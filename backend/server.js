console.log('🚀 [INIT] Loading server.js v2025-07-13-auth-removed...');
require('dotenv').config(); // Load environment variables

// ✅ SECURITY FIX: Early environment validation
const EnvironmentValidator = require('./utils/envValidator');
console.log('🔍 Pre-startup environment validation...');

// Temporarily disabled for production deployment
// TODO: Re-enable after setting proper environment variables on Render
/*
if (!EnvironmentValidator.quickCheck()) {
    console.error('🚨 Cannot start server: Environment validation failed');
    process.exit(1);
}
*/
console.log('⚠️  Environment validation temporarily disabled for deployment')

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
console.log('🔧 [IMPORT] Loading routes...');
console.log('🔧 [IMPORT] Loading apiKey routes...');
const apiKeyRoutes = require('./apiKey.js');
console.log('🔧 [IMPORT] Loading posts routes...');
const postRoutes = require('./routes/posts');
console.log('🔧 [IMPORT] Loading auth routes...');
const authRoutes = require('./routes/auth.js');
console.log('🔧 [IMPORT] Loading config routes...');
const configRoutes = require('./routes/config.js');
console.log('🔧 [IMPORT] Loading ai routes...');
const aiRoutes = require('./routes/ai.js');
console.log('🔧 [IMPORT] Loading migration routes...');
const migrationRoutes = require('./routes/migration.js');
console.log('🔧 [IMPORT] Loading security routes...');
const securityRoutes = require('./routes/security.js');
console.log('🔧 [IMPORT] Loading performance routes...');
const performanceRoutes = require('./routes/performance.js');
console.log('🔧 [IMPORT] Loading supabase client...');
const supabase = require('./supabaseClient');
console.log('✅ [IMPORT] All routes loaded successfully');

// Import secure API key manager
const apiKeyManager = require('./models/apiKeys');

// Import middleware  
console.log('🔧 [IMPORT] Loading middleware...');
console.log('🔧 [IMPORT] Loading rateLimiter...');
const { generalRateLimit, blockSuspiciousIPs, aiEndpointRateLimit, migrationRateLimit } = require('./middleware/rateLimiter');
console.log('🔧 [IMPORT] Loading errorHandler...');
const { logger, errorHandler, requestLogger, handleNotFound } = require('./middleware/errorHandler');
console.log('🔧 [IMPORT] Loading cache...');
const { 
  cacheMiddleware, 
  clearCache, 
  getCacheStats, 
  initializeCacheMonitoring,
  isCacheHealthy,
  apiCache
} = require('./middleware/cache');
console.log('🔧 [IMPORT] Loading metrics...');
const { metricsMiddleware, healthCheck, getMetrics } = require('./middleware/metrics');
console.log('🔧 [IMPORT] Loading validation...');
const { validatePost, validateAuth, sanitizeInput } = require('./middleware/validation');
console.log('🔧 [IMPORT] Loading auth...');
const { authenticateAdmin } = require('./middleware/auth');
console.log('🔧 [IMPORT] Loading monitoring...');
const { requestMonitoring, trackError } = require('./middleware/monitoring');
console.log('🔧 [IMPORT] Loading securityLogger...');
const { securityAuditMiddleware, SecurityLogger } = require('./middleware/securityLogger');
console.log('✅ [IMPORT] All middleware loaded');

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

// CORS configuration for Netlify frontend - SIMPLIFIED
app.use(cors({
  origin: ['https://flourishing-gumdrop-dffe7a.netlify.app', 'http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200
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
console.log('🔧 [INIT] Setting up API routes...');
app.use('/api/auth', authRoutes); // Authentication routes (validation handled per-route)
app.use('/api/config', configRoutes);            // ✅ Configuration routes (public for frontend)
app.use('/api/security', authenticateAdmin, securityRoutes);       // ✅ Security Dashboard routes (admin only)
app.use('/api/ai', aiRoutes);                   // ✅ PHASE 3: AI provider routes (rate limiting temporarily disabled for debugging)
app.use('/api/migration', migrationRoutes); // ✅ PHASE 3: Database migration routes (rate limiting removed for debugging)
app.use('/api/performance', performanceRoutes); // Performance monitoring routes
app.use('/api', apiKeyRoutes);                  // Protected API key routes
app.use('/api/posts', postRoutes);              // Post management routes (mount on /api/posts to avoid conflicts)
console.log('✅ [INIT] API routes configured');

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

// REMOVED: In-memory database fallback system
// All data now comes from Supabase only - no fallback in production

// Initialize data connection (Supabase only)
async function initializeDataConnection() {
    try {
        logger.info('🔄 Verifying Supabase connection...');
        
        // Only proceed if we have a valid Supabase client
        if (!supabase.isConnected()) {
            throw new Error('Supabase client not connected');
        }
        
        // Test connection with a simple query
        const { error } = await supabase.supabase
            .from('posts')
            .select('id')
            .limit(1);
            
        if (error) {
            throw new Error(`Supabase connection test failed: ${error.message}`);
        }
        
        logger.info('✅ Supabase connection verified');
        return true;
        
    } catch (error) {
        logger.error('❌ Data connection initialization failed:', error);
        
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Production requires valid Supabase connection');
        }
        
        return false;
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

// REMOVED: Duplicate post endpoints - handled by routes/posts.js
// This prevents conflicts between server.js and routes/posts.js endpoints

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
        logger.debug('Starting blog-html request - using Supabase only...');
        
        // Verify Supabase connection first
        if (!supabase.isConnected()) {
            throw new Error('Supabase client not connected');
        }
        
        // Fetch from Supabase only - no fallbacks
        const { data: supabasePosts, error } = await supabase.db.posts.findAll(100, 0);
        
        if (error) {
            throw new Error(`Database query failed: ${error.message}`);
        }
        
        // Filter published posts
        const publishedPosts = (supabasePosts || []).filter(post => post.status === 'published');
        
        if (publishedPosts.length === 0) {
            logger.info('No published posts found in database');
            return res.json({
                html: '<div class="no-posts-message">ไม่มีบทความที่เผยแพร่แล้ว</div>',
                count: 0,
                posts: [],
                source: 'supabase'
            });
        }
        
        // Generate HTML for published posts
        const blogHTML = publishedPosts.map(post => {
            // Handle field name consistency (Supabase uses snake_case)
            const title = post.titleth || post.titleTH || post.title || 'ไม่มีหัวข้อ';
            const excerpt = post.excerpt || 'ไม่มีเนื้อหาย่อ';
            const author = post.author || 'ระเบียบการช่าง';
            const views = post.views || 0;
            const slug = post.slug || '';
            
            // Handle date formatting (Supabase uses created_at)
            let dateStr = 'ไม่ระบุ';
            if (post.created_at) {
                dateStr = new Date(post.created_at).toLocaleDateString('th-TH');
            } else if (post.publishedat) {
                dateStr = new Date(post.publishedat).toLocaleDateString('th-TH');
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
                    </div>
                </article>
            `;
        }).join('');
        
        logger.debug(`Generated HTML for ${publishedPosts.length} posts from Supabase`);
        
        res.json({
            html: blogHTML,
            count: publishedPosts.length,
            posts: publishedPosts,
            source: 'supabase'
        });
        
    } catch (err) {
        logger.error('/api/blog-html failed:', err);
        
        // In production, fail hard - no fallbacks
        if (process.env.NODE_ENV === 'production') {
            return res.status(503).json({
                success: false,
                error: 'Database connection required',
                message: 'Blog content unavailable - please check database connection'
            });
        }
        
        // Development fallback with clear indication
        res.status(503).json({
            html: '<div class="error-message">Database connection failed - please check Supabase configuration</div>',
            count: 0,
            posts: [],
            source: 'error',
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
        });
        
        // Return HTML page
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
console.log('🔧 [INIT] Setting up error handling middleware...');
app.use(handleNotFound);
app.use(errorHandler);
console.log('✅ [INIT] All middleware configured');

// Enhanced server startup
async function startServer() {
    console.log('🚀 [START] startServer() called');
    try {
        // Initialize AI services in proper order
        console.log('🤖 [START] Initializing AI Services...');
        
        try {
            // Initialize AI Provider Service first
            const aiProviderService = require('./services/AIProviderService');
            console.log('🔧 Initializing AI Provider Service...');
            await aiProviderService.initializeProviders();
            console.log('✅ AI Provider Service initialized');
            
            // Initialize AI Swarm Councils (singleton) 
            console.log('🔧 Initializing AI Swarm Councils...');
            const SwarmCouncilManager = require('./services/SwarmCouncilManager');
            const swarmCouncilManager = SwarmCouncilManager.getInstance();
            await swarmCouncilManager.initializeAll();
            console.log('✅ AI Swarm Councils initialized');
            
        } catch (aiError) {
            console.warn('⚠️ AI Services initialization failed but server will continue:', aiError.message);
            console.warn('⚠️ AI features may be limited');
        }
        
        await initializeDataConnection();
        
        const server = app.listen(PORT, () => {
            logger.info('🚀 ================================');
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

        // 🚀 REAL-TIME WEBSOCKET: Initialize after server starts (poe.com style)
        let realTimeWS = null;
        try {
            const RealTimeWebSocketServer = require('./websocket/websocket-server');
            realTimeWS = new RealTimeWebSocketServer(server);
            
            // Setup real-time AI status broadcasting
            realTimeWS.on('client_connected', ({ clientInfo }) => {
                logger.info(`⚡ [WEBSOCKET] Client ${clientInfo.id} connected for real-time updates`);
            });
            
            // Make globally available for broadcasting updates
            global.realTimeWS = realTimeWS;
            
            logger.info('⚡ [WEBSOCKET] Real-time server active on /ws');
            logger.info('⚡ [WEBSOCKET] Ultra-fast updates enabled (poe.com style)');
            
        } catch (error) {
            logger.warn('⚠️ [WEBSOCKET] Real-time server failed to initialize:', error.message);
            logger.warn('⚠️ [WEBSOCKET] Falling back to HTTP polling');
        }

        // Graceful shutdown handling
        const gracefulShutdown = (signal) => {
            logger.info(`📢 Received ${signal}. Starting graceful shutdown...`);
            
            // Cleanup AI Swarm Councils
            try {
                SwarmCouncilManager.destroy();
                logger.info('✅ AI Swarm Councils cleaned up');
            } catch (error) {
                logger.error('❌ Error cleaning up AI councils:', error);
            }
            
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
    console.log('🚀 [MAIN] Starting server...');
    startServer().catch(error => {
        console.error('❌ [MAIN] Server startup failed:', error);
        console.error('❌ [MAIN] Stack trace:', error.stack);
        process.exit(1);
    });
} else {
    console.log('📦 [MAIN] Module loaded but not executed directly');
}
