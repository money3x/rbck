require('dotenv').config(); // Load environment variables

// ✅ SECURITY FIX: Early environment validation
const EnvironmentValidator = require('./utils/envValidator');
console.log('🔍 Pre-startup environment validation...');
if (!EnvironmentValidator.quickCheck()) {
    console.error('🚨 Cannot start server: Environment validation failed');
    process.exit(1);
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs').promises;

// Import configuration
const config = require('./config/config');

// Validate configuration on startup
config.validateConfig();

// Import routes
const apiKeyRoutes = require('./apiKey.js');
const postRoutes = require('./routes/posts');
const authRoutes = require('./routes/auth.js');
const configRoutes = require('./routes/config.js');
const aiRoutes = require('./routes/ai.js');
const migrationRoutes = require('./routes/migration.js');
const securityRoutes = require('./routes/security.js');
const performanceRoutes = require('./routes/performance.js');
const supabase = require('./supabaseClient');

// Import secure API key manager
const apiKeyManager = require('./models/apiKeys');

// Import middleware  
const { generalRateLimit, blockSuspiciousIPs, aiEndpointRateLimit, migrationRateLimit } = require('./middleware/rateLimiter');
const { logger, errorHandler, requestLogger, handleNotFound } = require('./middleware/errorHandler');
const { 
  cacheMiddleware, 
  clearCache, 
  getCacheStats, 
  initializeCacheMonitoring,
  isCacheHealthy,
  apiCache
} = require('./middleware/cache');
const { metricsMiddleware, healthCheck, getMetrics } = require('./middleware/metrics');
const { validatePost, validateAuth, sanitizeInput } = require('./middleware/validation');
const { authenticateAdmin } = require('./middleware/auth');
const { requestMonitoring, trackError } = require('./middleware/monitoring');
const { securityAuditMiddleware, SecurityLogger } = require('./middleware/securityLogger');

// Import Swagger config
const { setupSwagger } = require('./config/swagger');

const app = express();
const PORT = config.server.port;

// Initialize logger
logger.info('🚀 Starting RBCK CMS Server...', {
  version: config.api.version,
  environment: config.server.env,
  port: PORT
});

// Initialize cache monitoring
initializeCacheMonitoring();

// ✅ PHASE 3: Enhanced security middleware with production-grade settings
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.openai.com", "https://api.anthropic.com", "https://generativelanguage.googleapis.com", "https://api.deepseek.com", "https://api.chindax.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      // ✅ NEW: Additional security directives
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"],
      workerSrc: ["'self'"]
    },
    reportOnly: process.env.NODE_ENV === 'development' // Report-only in development
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for development
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  // ✅ NEW: Additional security headers
  permittedCrossDomainPolicies: false,
  dnsPrefetchControl: { allow: false },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  originAgentCluster: true
}));

// ✅ PHASE 3: Additional custom security headers
app.use((req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Feature policy (Permissions Policy)
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), bluetooth=(), accelerometer=(), gyroscope=(), magnetometer=()');
  
  // Cache control for sensitive endpoints
  if (req.path.includes('/admin') || req.path.includes('/auth')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }
  
  next();
});

// ✅ PHASE 3: Enhanced logging and monitoring
app.use(requestLogger);
app.use(securityAuditMiddleware);  // Security audit logging
app.use(metricsMiddleware);
app.use(requestMonitoring());

// ✅ PHASE 3: Enhanced rate limiting with suspicious IP blocking
app.use(blockSuspiciousIPs);
app.use(generalRateLimit);

// CORS configuration for Netlify frontend
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (config.frontend.allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // ✅ PRODUCTION FIX: Allow the specific Netlify domain in production
    if (origin === 'https://flourishing-gumdrop-dffe7a.netlify.app') {
      console.log('✅ Production: Allowing configured Netlify domain:', origin);
      return callback(null, true);
    }
    
    // ✅ DEBUGGING: Temporarily allow all .netlify.app domains
    if (origin && origin.includes('.netlify.app')) {
      console.log('✅ Debug: Allowing Netlify domain:', origin);
      return callback(null, true);
    }
    
    // ✅ Development: Allow any .netlify.app domain for testing
    if (process.env.NODE_ENV === 'development' && origin.includes('.netlify.app')) {
      console.warn('⚠️ Development: Allowing Netlify domain:', origin);
      return callback(null, true);
    }
    
    // Log rejected origins for debugging
    console.warn('⚠️ CORS rejected origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: false, // Set to false for better CORS compatibility
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-From', 'Accept', 'Cache-Control', 'Pragma'],
  exposedHeaders: ['X-Cache', 'X-Cache-Key'],
  maxAge: 86400, // Cache preflight response for 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));

// Body parsing with validation
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization middleware for all requests (except auth and migration endpoints)
app.use((req, res, next) => {
  // Skip sanitization for auth endpoints that don't need it
  if (req.path.includes('/auth/get-jwt-token') || 
      req.path.includes('/auth/get-supabase-token') ||
      req.path.includes('/auth/get-encryption-key') ||
      req.path.includes('/auth/verify-session') ||
      req.path.includes('/migration/status') ||
      req.path.includes('/migration/health') ||
      req.path.includes('/migration/execute')) {
    console.log('🛡️ [MIDDLEWARE] Skipping sanitization for protected endpoint:', req.path);
    return next();
  }
  console.log('🛡️ [MIDDLEWARE] Applying sanitization for:', req.path);
  return sanitizeInput(req, res, next);
});

// Setup Swagger documentation
setupSwagger(app);

// Health and monitoring endpoints (must be BEFORE generic routes)
app.get('/health', healthCheck);
app.get('/api/health', healthCheck);
app.get('/api/metrics', getMetrics);

// Advanced monitoring routes
const monitoringRoutes = require('./routes/monitoring');
app.use('/api/monitoring', monitoringRoutes);
app.get('/api/cache/stats', (req, res) => {
  try {
    const stats = getCacheStats();
    const health = isCacheHealthy();
    res.json({
      success: true,
      data: {
        ...stats,
        healthy: health,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Cache stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cache stats'
    });
  }
});

app.delete('/api/cache/clear', (req, res) => {
  try {
    clearCache.all();
    logger.info('Cache cleared via API');
    res.json({ 
      success: true,
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Cache clear error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache'
    });
  }
});

// API Routes with enhanced middleware
app.use('/api/auth', authRoutes); // Authentication routes (validation handled per-route)
app.use('/api/config', configRoutes);            // ✅ Configuration routes (public for frontend)
app.use('/api/security', authenticateAdmin, securityRoutes);       // ✅ Security Dashboard routes (admin only)
app.use('/api/ai', aiRoutes);                   // ✅ PHASE 3: AI provider routes (rate limiting temporarily disabled for debugging)
app.use('/api/migration', authenticateAdmin, migrationRateLimit, migrationRoutes); // ✅ PHASE 3: Database migration routes (admin only) with strict rate limiting
app.use('/api/performance', performanceRoutes); // Performance monitoring routes
app.use('/api', apiKeyRoutes);                  // Protected API key routes
app.use('/api/posts', postRoutes);              // Post management routes (mount on /api/posts to avoid conflicts)

// Static files - Serve frontend files (DISABLED - Frontend served by Netlify)
// app.use(express.static(path.join(__dirname, '..', 'frontend')));
// app.use('/admin', express.static(path.join(__dirname, '..', 'frontend', 'admin')));
// app.use('/css', express.static(path.join(__dirname, '..', 'frontend', 'css')));
// app.use('/js', express.static(path.join(__dirname, '..', 'frontend', 'js')));
// app.use('/script', express.static(path.join(__dirname, '..', 'frontend', 'script')));

// Debug middleware for static file requests
app.use((req, res, next) => {
    if (req.url.includes('.css') || req.url.includes('.js') || req.url.includes('.html')) {
        logger.debug(`📁 Static file request: ${req.url}`);
    }
    next();
});
// Serve static files from frontend and admin directories
//app.use(express.static('frontend'));
//app.use('/admin', express.static('admin'));

// In-memory database (ใน production ใช้ database จริง)
let posts = [];
let nextId = 1;

// Load initial data
async function loadInitialData() {
    try {
        const dataPath = path.join(__dirname, 'data.json');
        const data = await fs.readFile(dataPath, 'utf8');
        const parsed = JSON.parse(data);
        posts = parsed.posts || [];
        nextId = parsed.nextId || 1;
        logger.info(`📊 Loaded ${posts.length} posts from data.json`);
    } catch (error) {
        logger.info('📊 No existing data file, starting fresh');
        // เพิ่มข้อมูลตัวอย่าง
        posts = [
            {
                id: 1,
                titleTH: 'เทคนิคการดูแลรักษารถเกี่ยวข้าวเบื้องต้น',
                titleEN: 'Basic Rice Harvester Maintenance Tips',
                slug: 'basic-rice-harvester-maintenance-tips',
                content: `
                    <h3>🌾 การดูแลรักษารถเกี่ยวข้าวอย่างถูกต้อง</h3>
                    <p>รถเกี่ยวข้าวเป็นเครื่องจักรที่สำคัญสำหรับเกษตรกร การดูแลรักษาอย่างเหมาะสมจะช่วยยืดอายุการใช้งานและรักษาประสิทธิภาพ</p>
                    
                    <h4>🔧 ขั้นตอนการดูแลรักษา</h4>
                    <ol>
                        <li><strong>ทำความสะอาดหลังใช้งาน</strong><br>
                        เก็บเศษฟาง ธุลี และสิ่งสกปรกที่ติดเครื่อง โดยเฉพาะบริเวณใบมีดและส่วนที่สัมผัสข้าว</li>
                        
                        <li><strong>ตรวจสอบน้ำมันเครื่อง</strong><br>
                        เช็คระดับน้ำมันเครื่องก่อนการใช้งานทุกครั้ง เปลี่ยนน้ำมันตามระยะที่กำหนดในคู่มือ</li>
                        
                        <li><strong>ดูแลใบมีด</strong><br>
                        ตรวจสอบความคมของใบมีด ลับคมเมื่อจำเป็น และปรับตั้งให้อยู่ในตำแหน่งที่เหมาะสม</li>
                        
                        <li><strong>ตรวจสายพาน</strong><br>
                        เช็คความตึงของสายพาน ดูรอยแตกหรือการสึกหรอ เปลี่ยนเมื่อพบความเสียหาย</li>
                        
                        <li><strong>การเก็บรักษา</strong><br>
                        เก็บเครื่องในที่แห้ง ระบายอากาศดี หลีกเลี่ยงความชื้นที่อาจทำให้เกิดสนิม</li>
                    </ol>
                    
                    <h4>⚠️ สิ่งที่ควรหลีกเลี่ยง</h4>
                    <ul>
                        <li>การใช้งานเครื่องในสภาพน้ำมันไม่เพียงพอ</li>
                        <li>การบังคับใช้งานเมื่อมีสิ่งแปลกปลอมติดขัด</li>
                        <li>การทิ้งเครื่องกลางแจ้งโดยไม่มีการป้องกัน</li>
                    </ul>
                    
                    <p><strong>💡 เคล็ดลับ:</strong> การบำรุงรักษาเป็นประจำจะช่วยประหยัดค่าใช้จ่ายในการซ่อมแซมและยืดอายุการใช้งานของเครื่อง</p>
                `,
                excerpt: 'เรียนรู้เทคนิคการดูแลรักษารถเกี่ยวข้าวอย่างถูกต้อง ตั้งแต่การทำความสะอาด การตรวจสอบ จนถึงการเก็บรักษา เพื่อให้เครื่องใช้งานได้นานและมีประสิทธิภาพสูงสุด',
                category: 'maintenance',
                tags: ['รถเกี่ยวข้าว', 'การดูแลรักษา', 'เทคนิค', 'บำรุงรักษา'],
                status: 'published',
                author: 'ระเบียบการช่าง',
                publishDate: new Date().toISOString().split('T')[0],
                views: 0,
                metaTitle: 'เทคนิคการดูแลรักษารถเกี่ยวข้าว | ระเบียบการช่าง',
                metaDescription: 'เรียนรู้วิธีการดูแลรักษารถเกี่ยวข้าวอย่างถูกต้อง เพื่อยืดอายุการใช้งานและรักษาประสิทธิภาพ คำแนะนำจากผู้เชี่ยวชาญ',
                focusKeyword: 'ดูแลรักษารถเกี่ยวข้าว',
                schemaType: 'HowTo',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        nextId = 2;
        await saveData();
    }
}

// Save data to file
async function saveData() {
    try {
        const dataPath = path.join(__dirname, 'data.json');
        const data = {
            posts: posts,
            nextId: nextId,
            lastUpdated: new Date().toISOString()
        };
        await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
        logger.debug('💾 Data saved successfully');
    } catch (error) {
        logger.error('❌ Error saving data:', error);
    }
}

// Enhanced API Routes with caching and validation

/**
 * @swagger
 * /api/test:
 *   get:
 *     summary: Test API connectivity
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API is working
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                 version:
 *                   type: string
 *                 status:
 *                   type: string
 */
app.get('/api/test', cacheMiddleware(300), (req, res) => {
    res.json({ 
        message: 'API is working!', 
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        status: 'ok',
        environment: process.env.NODE_ENV || 'development'
    });
});

/**
 * @swagger
 * /api/analytics:
 *   get:
 *     summary: Get site analytics
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Analytics data
 */
app.get('/api/analytics', cacheMiddleware(600), (req, res) => {
    try {
        const publishedPosts = posts.filter(post => post.status === 'published');
        const draftPosts = posts.filter(post => post.status === 'draft');
        const totalViews = posts.reduce((sum, post) => sum + (post.views || 0), 0);
        
        res.json({
            totalPosts: posts.length,
            publishedPosts: publishedPosts.length,
            draftPosts: draftPosts.length,
            pageViews: totalViews,
            trafficSources: {
                organic: 65,
                direct: 20,
                social: 10,
                referral: 5
            },
            topKeywords: [
                { keyword: 'รถเกี่ยวข้าว', count: 1234 },
                { keyword: 'ซ่อมรถเกี่ยวข้าว', count: 892 },
                { keyword: 'ดูแลรักษารถเกี่ยวข้าว', count: 567 },
                { keyword: 'อะไหล่รถเกี่ยวข้าว', count: 445 }
            ],
            popularPosts: publishedPosts.slice(0, 5).map(post => ({
                title: post.titleTH,
                views: post.views || 0,
                slug: post.slug
            })),
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error generating analytics:', error);
        res.status(500).json({ 
            error: 'Failed to generate analytics',
            message: error.message 
        });
    }
});

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get all posts
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by post status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Limit number of results
 *     responses:
 *       200:
 *         description: List of posts
 */
app.get('/api/posts', cacheMiddleware(300), (req, res) => {
    try {
        let filteredPosts = [...posts];
        
        // Filter by status if provided
        if (req.query.status) {
            filteredPosts = filteredPosts.filter(post => post.status === req.query.status);
        }
        
        // Sort by update date
        filteredPosts.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        
        // Apply limit if provided
        if (req.query.limit) {
            const limit = parseInt(req.query.limit);
            if (!isNaN(limit) && limit > 0) {
                filteredPosts = filteredPosts.slice(0, limit);
            }
        }
        
        res.json({
            posts: filteredPosts,
            total: filteredPosts.length,
            query: req.query
        });
    } catch (error) {
        logger.error('Error fetching posts:', error);
        res.status(500).json({ 
            error: 'Failed to fetch posts',
            message: error.message 
        });
    }
});

/**
 * @swagger
 * /api/posts/{id}:
 *   get:
 *     summary: Get single post by ID
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post details
 *       404:
 *         description: Post not found
 */
app.get('/api/posts/:id', cacheMiddleware(600), (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        
        if (isNaN(postId)) {
            return res.status(400).json({ 
                error: 'Invalid post ID',
                message: 'Post ID must be a number' 
            });
        }
        
        const post = posts.find(p => p.id === postId);
        
        if (!post) {
            return res.status(404).json({ 
                error: 'Post not found',
                postId: postId 
            });
        }
        
        res.json(post);
    } catch (error) {
        logger.error('Error fetching post:', error);
        res.status(500).json({ 
            error: 'Failed to fetch post',
            message: error.message 
        });
    }
});

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titleTH
 *               - excerpt
 *             properties:
 *               titleTH:
 *                 type: string
 *               titleEN:
 *                 type: string
 *               content:
 *                 type: string
 *               excerpt:
 *                 type: string
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published]
 *               author:
 *                 type: string
 *     responses:
 *       201:
 *         description: Post created successfully
 *       400:
 *         description: Validation error
 */
app.post('/api/posts', validatePost, async (req, res) => {
    try {
        const postData = req.body;
        
        // Auto-generate slug if not provided
        if (!postData.slug && postData.titleTH) {
            postData.slug = postData.titleTH
                .toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '');
        }
        
        const newPost = {
            id: nextId++,
            ...postData,
            views: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        posts.push(newPost);
        await saveData();
        
        // Clear cache for posts endpoints
        clearCache('/api/posts');
        clearCache('/api/analytics');
        
        logger.info(`📝 Created new post: ${newPost.titleTH}`, { postId: newPost.id });
        res.status(201).json(newPost);
    } catch (error) {
        logger.error('Error creating post:', error);
        res.status(500).json({ 
            error: 'Failed to create post',
            message: error.message 
        });
    }
});

/**
 * @swagger
 * /api/posts/{id}:
 *   put:
 *     summary: Update an existing post
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       404:
 *         description: Post not found
 */
app.put('/api/posts/:id', validatePost, async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        
        if (isNaN(postId)) {
            return res.status(400).json({ 
                error: 'Invalid post ID',
                message: 'Post ID must be a number' 
            });
        }
        
        const postIndex = posts.findIndex(p => p.id === postId);
        
        if (postIndex === -1) {
            return res.status(404).json({ 
                error: 'Post not found',
                postId: postId 
            });
        }
        
        const updatedPost = {
            ...posts[postIndex],
            ...req.body,
            id: postId, // Ensure ID doesn't change
            updatedAt: new Date().toISOString()
        };
        
        posts[postIndex] = updatedPost;
        await saveData();
        
        // Clear cache for posts endpoints
        clearCache('/api/posts');
        clearCache('/api/analytics');
        
        logger.info(`📝 Updated post: ${updatedPost.titleTH}`, { postId });
        res.json(updatedPost);
    } catch (error) {
        logger.error('Error updating post:', error);
        res.status(500).json({ 
            error: 'Failed to update post',
            message: error.message 
        });
    }
});

/**
 * @swagger
 * /api/posts/{id}:
 *   delete:
 *     summary: Delete a post
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       404:
 *         description: Post not found
 */
app.delete('/api/posts/:id', async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        
        if (isNaN(postId)) {
            return res.status(400).json({ 
                error: 'Invalid post ID',
                message: 'Post ID must be a number' 
            });
        }
        
        const postIndex = posts.findIndex(p => p.id === postId);
        
        if (postIndex === -1) {
            return res.status(404).json({ 
                error: 'Post not found',
                postId: postId 
            });
        }
        
        const deletedPost = posts.splice(postIndex, 1)[0];
        await saveData();
        
        // Clear cache for posts endpoints
        clearCache('/api/posts');
        clearCache('/api/analytics');
        
        logger.info(`🗑️ Deleted post: ${deletedPost.titleTH}`, { postId });
        res.json({ 
            message: 'Post deleted successfully',
            deletedPost: {
                id: deletedPost.id,
                title: deletedPost.titleTH
            }
        });
    } catch (error) {
        logger.error('Error deleting post:', error);
        res.status(500).json({ 
            error: 'Failed to delete post',
            message: error.message 
        });
    }
});

/**
 * @swagger
 * /api/blog-html:
 *   get:
 *     summary: Get blog HTML for frontend
 *     tags: [Blog]
 *     responses:
 *       200:
 *         description: Generated blog HTML
 */
app.get('/api/blog-html', cacheMiddleware(300), async (req, res) => {
    try {
        logger.debug('Starting blog-html request...');
        
        // Get local published posts first (always available)
        const localPublishedPosts = posts.filter(post => post.status === 'published');
        logger.debug(`Local published posts found: ${localPublishedPosts.length}`);
        
        let finalPosts = [];
        let source = 'local';        try {
            // Try to fetch from Supabase (only if properly initialized)
            if (supabase && typeof supabase.from === 'function') {
                const { data: supabasePosts, error } = await supabase
                    .from('posts')
                    .select('*')
                    .eq('status', 'published')
                    .order('created_at', { ascending: false });
                
                logger.debug('Supabase response:', {
                    posts: supabasePosts?.length || 0,
                    error: error?.message || 'none'
                });
                
                if (!error && supabasePosts && supabasePosts.length > 0) {
                    finalPosts = supabasePosts;
                    source = 'supabase';
                    logger.debug(`Using Supabase data: ${finalPosts.length} posts`);
                } else {
                    finalPosts = localPublishedPosts;
                    source = 'local_fallback';
                    logger.debug(`Using local fallback data: ${finalPosts.length} posts`);
                }
            } else {
                finalPosts = localPublishedPosts;
                source = 'local_no_supabase';
                logger.debug(`No Supabase connection, using local data: ${finalPosts.length} posts`);
            }
        } catch (supabaseError) {
            logger.error('Supabase connection error:', supabaseError);
            finalPosts = localPublishedPosts;
            source = 'local_error_fallback';
        }
        
        // Generate HTML for final posts
        const blogHTML = finalPosts.map(post => {
            // Handle different title field names (Supabase vs Local)
            const title = post.titleth || post.titleTH || post.title || 'ไม่มีหัวข้อ';
            const excerpt = post.excerpt || 'ไม่มีเนื้อหาย่อ';
            const author = post.author || 'ระเบียบการช่าง';
            const views = post.views || 0;
            const slug = post.slug || '';
            
            // Handle date formatting
            let dateStr = 'ไม่ระบุ';
            if (post.created_at) {
                dateStr = new Date(post.created_at).toLocaleDateString('th-TH');
            } else if (post.createdAt) {
                dateStr = new Date(post.createdAt).toLocaleDateString('th-TH');
            } else if (post.publishDate) {
                dateStr = new Date(post.publishDate).toLocaleDateString('th-TH');
            }
            
            return `
                <article class="blog-post-item">
                    <div class="post-image-placeholder">ภาพประกอบบทความ: ${title}</div>
                    <div class="post-content">
                        <h3><a href="/blog/${slug}" class="post-title-link">${title}</a></h3>
                        <p class="post-meta">เผยแพร่เมื่อ: ${dateStr} | โดย: ${author} | ดู: ${views} ครั้ง</p>
                        <p class="post-excerpt">${excerpt}</p>
                        <div class="post-tags">
                            ${(Array.isArray(post.tags) ? post.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : '')}
                        </div>
                        <div class="post-actions">
                            <a href="/blog/${slug}" class="read-more-btn">อ่านบทความ →</a>
                        </div>
                        <p class="ai-generated-notice">*บทความจากระบบ CMS</p>
                    </div>
                </article>
            `;        }).join('');
        
        logger.debug(`Generated HTML for ${finalPosts.length} posts from ${source}`);
        
        res.json({
            html: blogHTML,
            count: finalPosts.length,
            posts: finalPosts,
            source: source,
            debug: {
                localPostsCount: localPublishedPosts.length,
                finalPostsCount: finalPosts.length,
                source: source
            }
        });
        
    } catch (err) {
        logger.error('/api/blog-html failed:', err);
        
        // Final fallback - always use local data
        const localPublishedPosts = posts.filter(post => post.status === 'published');
        const fallbackHTML = localPublishedPosts.map(post => `
            <article class="blog-post-item">
                <div class="post-image-placeholder">ภาพประกอบบทความ: ${post.titleTH || 'ไม่มีหัวข้อ'}</div>
                <div class="post-content">
                    <h3><a href="/blog/${post.slug}" class="post-title-link">${post.titleTH || 'ไม่มีหัวข้อ'}</a></h3>
                    <p class="post-meta">เผยแพร่เมื่อ: ${post.publishDate ? new Date(post.publishDate).toLocaleDateString('th-TH') : 'ไม่ระบุ'} | โดย: ${post.author || 'ระเบียบการช่าง'} | ดู: ${post.views || 0} ครั้ง</p>
                    <p class="post-excerpt">${post.excerpt || 'ไม่มีเนื้อหาย่อ'}</p>
                    <div class="post-tags">
                        ${(Array.isArray(post.tags) ? post.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : '')}
                    </div>
                    <div class="post-actions">
                        <a href="/blog/${post.slug}" class="read-more-btn">อ่านบทความ →</a>
                    </div>
                    <p class="ai-generated-notice">*บทความจากระบบ CMS</p>
                </div>
            </article>
        `).join('');
        
        res.json({ 
            html: fallbackHTML, 
            count: localPublishedPosts.length, 
            posts: localPublishedPosts,
            source: 'error_fallback',
            error: err.message
        });
    }
});

// Individual blog post view (Enhanced with caching and error handling)
app.get('/blog/:slug', cacheMiddleware(1800), (req, res) => {
    try {
        const post = posts.find(p => p.slug === req.params.slug && p.status === 'published');
        
        if (!post) {
            logger.warn(`Blog post not found: ${req.params.slug}`, { 
                ip: req.ip, 
                userAgent: req.get('User-Agent') 
            });
            return res.status(404).send(`
                <!DOCTYPE html>
                <html lang="th">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>ไม่พบบทความ | ระเบียบการช่าง</title>
                </head>
                <body>
                    <h1>ไม่พบบทความที่ต้องการ</h1>
                    <p>ขออภัย บทความที่คุณต้องการไม่พบในระบบ</p>
                    <a href="/">← กลับสู่หน้าหลัก</a>
                </body>
                </html>
            `);
        }
        
        // Increment view count safely
        post.views = (post.views || 0) + 1;
        saveData().catch(error => logger.error('Error saving view count:', error));
        
        logger.info(`Blog post viewed: ${post.titleTH}`, { 
            slug: req.params.slug,
            views: post.views,
            ip: req.ip 
        });        // Return HTML page
        const html = `
        <!DOCTYPE html>
        <html lang="th">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${post.metaTitle || post.titleTH}</title>
            <meta name="description" content="${post.metaDescription || post.excerpt}">
            <meta name="keywords" content="${Array.isArray(post.tags) ? post.tags.join(', ') : ''}">
            <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;700&display=swap" rel="stylesheet">
            <style>
                body { 
                    font-family: 'Sarabun', sans-serif; 
                    max-width: 800px; 
                    margin: 0 auto; 
                    padding: 20px; 
                    line-height: 1.6; 
                    color: #333;
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 40px; 
                    padding-bottom: 20px; 
                    border-bottom: 2px solid #27533b; 
                }
                .header h1 { 
                    color: #27533b; 
                    font-size: 2.2em; 
                    margin-bottom: 10px;
                }
                .meta { 
                    color: #6c757d; 
                    margin-bottom: 30px; 
                    font-size: 0.95em;
                }
                .content { 
                    line-height: 1.8; 
                    font-size: 1.1em;
                }
                .content h3 { 
                    color: #27533b; 
                    margin: 30px 0 15px 0; 
                    font-size: 1.4em;
                }
                .content h4 { 
                    color: #27533b; 
                    margin: 25px 0 10px 0; 
                    font-size: 1.2em;
                }
                .content ol, .content ul { 
                    margin: 15px 0; 
                    padding-left: 30px; 
                }
                .content li { 
                    margin-bottom: 10px; 
                }
                .back-link { 
                    display: inline-block; 
                    margin-top: 40px; 
                    padding: 10px 20px; 
                    background: #27533b; 
                    color: white; 
                    text-decoration: none; 
                    border-radius: 5px; 
                }
                .back-link:hover { 
                    background: #1e3d2b; 
                }
                .tags {
                    margin: 30px 0;
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 8px;
                }
                .tag {
                    display: inline-block;
                    background: #e0a800;
                    color: #27533b;
                    padding: 4px 12px;
                    margin: 2px;
                    border-radius: 15px;
                    font-size: 0.9em;
                    font-weight: 500;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${post.titleTH}</h1>
                <div class="meta">
                    เผยแพร่เมื่อ: ${new Date(post.publishDate).toLocaleDateString('th-TH')} | 
                    โดย: ${post.author} | 
                    ดู: ${post.views} ครั้ง
                </div>
            </div>
            
            <div class="content">
                ${post.content}
            </div>
            
            ${post.tags && post.tags.length > 0 ? `
            <div class="tags">
                <strong>แท็ก:</strong> 
                ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
            ` : ''}
            
            <a href="/" class="back-link">← กลับสู่หน้าหลัก</a>
        </body>
        </html>
        `;
        
        res.send(html);
    } catch (error) {
        logger.error('Error serving blog post:', error);
        res.status(500).send(`
            <!DOCTYPE html>
            <html lang="th">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>เกิดข้อผิดพลาด | ระเบียบการช่าง</title>
            </head>
            <body>
                <h1>เกิดข้อผิดพลาด</h1>
                <p>ขออภัย เกิดข้อผิดพลาดในการแสดงบทความ</p>
                <a href="/">← กลับสู่หน้าหลัก</a>
            </body>
            </html>
        `);
    }
});

// Root endpoint for API-only backend
app.get('/', (req, res) => {
    try {
        res.json({
            name: config.api.title,
            version: config.api.version,
            description: config.api.description,
            status: 'operational',
            timestamp: new Date().toISOString(),
            endpoints: {
                documentation: '/api-docs',
                health: '/health',
                test: '/api/test',
                metrics: '/api/metrics',
                auth: '/api/auth',
                ai: '/api/ai',
                posts: '/api/posts'
            },
            frontend: config.frontend.url,
            environment: config.server.env,
            enabledAIProviders: config.getEnabledAIProviders()
        });
    } catch (error) {
        logger.error('Error serving root endpoint:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

// 404 handler for undefined API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'API endpoint not found',
        path: req.originalUrl,
        method: req.method,
        availableEndpoints: {
            auth: '/api/auth',
            ai: '/api/ai', 
            posts: '/api/posts',
            test: '/api/test',
            health: '/health',
            docs: '/api-docs'
        }
    });
});

// Static file routes - REMOVED (Frontend served by Netlify)
// Static file serving is now handled by Netlify for better performance and CDN
// app.use('/cms-styles.css', express.static(path.join(__dirname, '..', 'frontend', 'css', 'cms-styles.css')));
// app.use('/cms-script.js', express.static(path.join(__dirname, '..', 'frontend', 'js', 'cms-script.js')));

// Error handling middleware (must be last)
app.use(handleNotFound);
app.use(errorHandler);

// Enhanced server startup
async function startServer() {
    try {
        await loadInitialData();
          const server = app.listen(PORT, () => {            logger.info('🚀 ================================');
            logger.info(`🚀   ${config.api.title} v${config.api.version}`);
            logger.info('🚀 ================================');
            logger.info(`🌐 API Server: http://localhost:${PORT}`);
            logger.info(`📖 API Docs: http://localhost:${PORT}/api-docs`);
            logger.info(`🔧 Health Check: http://localhost:${PORT}/health`);
            logger.info(`📊 Metrics: http://localhost:${PORT}/api/metrics`);
            logger.info(`🧪 API Test: http://localhost:${PORT}/api/test`);
            logger.info('🚀 ================================');
            logger.info(`📊 Loaded ${posts.length} posts`);
            logger.info(`🌍 Environment: ${config.server.env}`);
            logger.info(`🌐 Frontend URL: ${config.frontend.url}`);
            logger.info(`🤖 AI Providers: ${config.getEnabledAIProviders().map(p => p.name).join(', ') || 'None'}`);
            logger.info('✅ API Server is ready and operational!');
        });

        // Graceful shutdown handling
        const gracefulShutdown = (signal) => {
            logger.info(`📢 Received ${signal}. Starting graceful shutdown...`);
            
            server.close((err) => {
                if (err) {
                    logger.error('❌ Error during server shutdown:', err);
                    process.exit(1);
                }
                
                logger.info('✅ Server closed successfully');
                process.exit(0);
            });
            
            // Force close after 30 seconds
            setTimeout(() => {
                logger.error('❌ Forced shutdown after timeout');
                process.exit(1);
            }, 30000);
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger.error('❌ Uncaught Exception:', error);
            gracefulShutdown('uncaughtException');
        });

        process.on('unhandledRejection', (reason, promise) => {
            logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
            gracefulShutdown('unhandledRejection');
        });
        
    } catch (error) {
        logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Export app for testing
module.exports = app;

// Only start server if this file is run directly (not in tests)
if (require.main === module) {
    startServer();
}
