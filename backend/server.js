require('dotenv').config(); // Load environment variables

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs').promises;
const apiKeyRoutes = require('./apiKey.js');
const postRoutes = require('./posts.js');
const authRoutes = require('./routes/auth.js');
const supabase = require('./supabaseClient');
const { generalRateLimit } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 10000;

// Security middleware
app.use(helmet()); // Basic security headers
app.use(generalRateLimit); // General rate limiting

// Middleware
app.use(cors({
  origin: [
    'https://flourishing-gumdrop-dffe7a.netlify.app', // Netlify domain
    //'http://localhost:3000', // Local dev
    //'http://localhost:8080', // Local dev frontend
    //'http://localhost:10000', // Local dev backend
    //'http://127.0.0.1:3000', // Localhost แบบ IP
    //'http://127.0.0.1:8080',
    //'http://127.0.0.1:10000'
  ],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes); // Authentication routes
app.use('/api', apiKeyRoutes);    // Protected API key routes
app.use('/api', postRoutes);

// Static files - Serve frontend files (DISABLED - Frontend served by Netlify)
// app.use(express.static(path.join(__dirname, '..', 'frontend')));
// app.use('/admin', express.static(path.join(__dirname, '..', 'frontend', 'admin')));
// app.use('/css', express.static(path.join(__dirname, '..', 'frontend', 'css')));
// app.use('/js', express.static(path.join(__dirname, '..', 'frontend', 'js')));
// app.use('/script', express.static(path.join(__dirname, '..', 'frontend', 'script')));

// Debug middleware (DISABLED - Not needed for API-only server)
// app.use((req, res, next) => {
//     if (req.url.includes('.css') || req.url.includes('.js')) {
//         console.log(`📁 Static file request: ${req.url}`);
//     }
//     next();
// });
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
        console.log(`📊 Loaded ${posts.length} posts from data.json`);
    } catch (error) {
        console.log('📊 No existing data file, starting fresh');
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
        console.log('💾 Data saved successfully');
    } catch (error) {
        console.error('❌ Error saving data:', error);
    }
}

// API Routes

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'API is working!', 
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        status: 'ok'
    });
});

// Analytics endpoint
app.get('/api/analytics', (req, res) => {
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
        }))
    });
});

// Get all posts
app.get('/api/posts', (req, res) => {
    const sortedPosts = posts.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    res.json(sortedPosts);
});

// Get single post
app.get('/api/posts/:id', (req, res) => {
    const postId = parseInt(req.params.id);
    const post = posts.find(p => p.id === postId);
    
    if (!post) {
        return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json(post);
});

// Create new post
app.post('/api/posts', async (req, res) => {
    try {
        const postData = req.body;
        
        // Validation
        if (!postData.titleTH || !postData.excerpt) {
            return res.status(400).json({ error: 'Title and excerpt are required' });
        }
        
        // Auto-generate slug if not provided
        if (!postData.slug) {
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
        
        console.log(`📝 Created new post: ${newPost.titleTH}`);
        res.status(201).json(newPost);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// Update post
app.put('/api/posts/:id', async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const postIndex = posts.findIndex(p => p.id === postId);
        
        if (postIndex === -1) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        const updatedPost = {
            ...posts[postIndex],
            ...req.body,
            id: postId, // Ensure ID doesn't change
            updatedAt: new Date().toISOString()
        };
        
        posts[postIndex] = updatedPost;
        await saveData();
        
        console.log(`📝 Updated post: ${updatedPost.titleTH}`);
        res.json(updatedPost);
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ error: 'Failed to update post' });
    }
});

// Delete post
app.delete('/api/posts/:id', async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const postIndex = posts.findIndex(p => p.id === postId);
        
        if (postIndex === -1) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        const deletedPost = posts.splice(postIndex, 1)[0];
        await saveData();
        
        console.log(`🗑️ Deleted post: ${deletedPost.titleTH}`);
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

// Get blog HTML for frontend
app.get('/api/blog-html', async (req, res) => {
    try {
        console.log('[DEBUG] Starting blog-html request...');
        
        // Get local published posts first (always available)
        const localPublishedPosts = posts.filter(post => post.status === 'published');
        console.log('[DEBUG] Local published posts found:', localPublishedPosts.length);
        
        let finalPosts = [];
        let source = 'local';
        
        try {
            // Try to fetch from Supabase
            const { data: supabasePosts, error } = await supabase
                .from('posts')
                .select('*')
                .eq('status', 'published')
                .order('created_at', { ascending: false });
            
            console.log('[DEBUG] Supabase response:', {
                posts: supabasePosts?.length || 0,
                error: error?.message || 'none'
            });
            
            if (!error && supabasePosts && supabasePosts.length > 0) {
                finalPosts = supabasePosts;
                source = 'supabase';
                console.log('[DEBUG] Using Supabase data:', finalPosts.length, 'posts');
            } else {
                finalPosts = localPublishedPosts;
                source = 'local_fallback';
                console.log('[DEBUG] Using local fallback data:', finalPosts.length, 'posts');
            }
        } catch (supabaseError) {
            console.error('[DEBUG] Supabase connection error:', supabaseError);
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
            `;
        }).join('');
        
        console.log('[DEBUG] Generated HTML for', finalPosts.length, 'posts from', source);
        
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
        console.error('[ERROR] /api/blog-html failed:', err);
        
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

// Individual blog post view (KEEP - This serves as API endpoint for Netlify frontend)
app.get('/blog/:slug', (req, res) => {
    const post = posts.find(p => p.slug === req.params.slug && p.status === 'published');
    
    if (!post) {
        return res.status(404).send('Post not found');
    }
    
    // Increment view count
    post.views = (post.views || 0) + 1;
    saveData();
    
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
});

// Frontend routes (DISABLED - Frontend served by Netlify)
// Serve frontend - Main page
// app.get('/', (req, res) => {
//     console.log('🏠 [DEBUG] Serving main page');
//     res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
// });

// Admin panel route
// app.get('/admin', (req, res) => {
//     console.log('🔧 [DEBUG] Serving admin panel');
//     res.sendFile(path.join(__dirname, '..', 'frontend', 'admin', 'index.html'));
// });

// Blog post page route (catch-all for frontend routing)
// app.get('/blog/post.html', (req, res) => {
//     console.log('📰 [DEBUG] Serving blog post page');
//     res.sendFile(path.join(__dirname, '..', 'frontend', 'blog', 'post.html'));
// });

// Start server
async function startServer() {
    await loadInitialData();
    
    // CMS Static files (DISABLED - Frontend served by Netlify)
    // app.use('/cms-styles.css', express.static(path.join(__dirname, '..', 'frontend', 'css', 'cms-styles.css')));
    // app.use('/cms-script.js', express.static(path.join(__dirname, '..', 'frontend', 'js', 'cms-script.js')));
    
    app.listen(PORT, () => {
        console.log('🚀 ================================');
        console.log('🚀   Rabeab Kanchang CMS Server');
        console.log('🚀 ================================');
        console.log(`🌐 Frontend: http://localhost:${PORT}`);
        console.log(`⚙️  CMS Admin: http://localhost:${PORT}/admin`);
        console.log(`🔧 CMS Dashboard: http://localhost:${PORT}/cms`);
        console.log(`🔧 API: http://localhost:${PORT}/api/test`);
        console.log('🚀 ================================');
        console.log(`📊 Loaded ${posts.length} posts`);
        console.log('✅ Server is ready!');
    });
}

startServer().catch(console.error);
