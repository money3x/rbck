// Advanced CMS Dashboard for SEO-Optimized Blog Management
// Supporting both traditional SEO and Search Generative Experience (SGE)
// Production-ready with Supabase integration

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

class BlogCMS {
    constructor() {
        // Use Supabase for production, fallback to local file for development
        this.useSupabase = process.env.NODE_ENV === 'production' || process.env.SUPABASE_URL;
        
        if (this.useSupabase) {
            this.supabase = createClient(
                process.env.SUPABASE_URL || 'your-supabase-url',
                process.env.SUPABASE_KEY || 'your-supabase-key'
            );
            console.log('📊 CMS using Supabase database (production mode)');
        } else {
            this.dataPath = path.join(__dirname, 'data.json');
            console.log('📊 CMS using local file system (development mode)');
        }
        
        // SEO and SGE optimization tools
        this.seoAnalyzer = new SEOAnalyzer();
        this.aiContentOptimizer = new AIContentOptimizer();
        this.schemaGenerator = new SchemaGenerator();
    }

    // Initialize CMS routes
    initializeRoutes(app) {
        // Dashboard endpoint
        app.get('/cms', this.renderDashboard.bind(this));
        app.get('/cms/api/posts', this.getAllPosts.bind(this));
        app.get('/cms/api/posts/:id', this.getPost.bind(this));
        app.post('/cms/api/posts', this.createPost.bind(this));
        app.put('/cms/api/posts/:id', this.updatePost.bind(this));
        app.delete('/cms/api/posts/:id', this.deletePost.bind(this));
        
        // SEO & SGE optimization endpoints
        app.post('/cms/api/seo-analyze', this.analyzeSEO.bind(this));
        app.post('/cms/api/sge-optimize', this.optimizeForSGE.bind(this));
        app.post('/cms/api/generate-schema', this.generateStructuredData.bind(this));
        app.post('/cms/api/ai-enhance', this.enhanceWithAI.bind(this));
        
        // Media management
        app.post('/cms/api/upload', this.uploadMedia.bind(this));
        app.get('/cms/api/media', this.getMediaLibrary.bind(this));
        
        console.log('✅ CMS routes initialized successfully');
    }

    // Render CMS Dashboard
    renderDashboard(req, res) {
        const dashboardHTML = `
        <!DOCTYPE html>
        <html lang="th">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>CMS Dashboard - ระเบียบการช่าง</title>
            <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;700&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="/cms-styles.css">
        </head>
        <body>
            <div class="cms-container">
                <header class="cms-header">
                    <h1>🚀 Advanced Blog CMS ${this.useSupabase ? '(Production)' : '(Development)'}</h1>
                    <div class="header-actions">
                        <button class="btn-primary" onclick="createNewPost()">+ สร้างบทความใหม่</button>
                        <button class="btn-secondary" onclick="toggleSEOPanel()">📊 SEO Tools</button>
                    </div>
                </header>

                <div class="cms-body">
                    <!-- Sidebar Navigation -->
                    <aside class="cms-sidebar">
                        <nav>
                            <ul>
                                <li><a href="#dashboard" class="active">📈 Dashboard</a></li>
                                <li><a href="#posts">📝 บทความ</a></li>
                                <li><a href="#seo">🔍 SEO Tools</a></li>
                                <li><a href="#sge">🤖 SGE Optimizer</a></li>
                                <li><a href="#media">🖼️ สื่อ</a></li>
                                <li><a href="#analytics">📊 Analytics</a></li>
                                <li><a href="#settings">⚙️ ตั้งค่า</a></li>
                            </ul>
                        </nav>
                    </aside>

                    <!-- Main Content Area -->
                    <main class="cms-main">
                        <!-- Dashboard Section -->
                        <section id="dashboard" class="cms-section active">
                            <div class="dashboard-stats">
                                <div class="stat-card">
                                    <h3>📝 บทความทั้งหมด</h3>
                                    <div class="stat-number" id="totalPosts">0</div>
                                </div>
                                <div class="stat-card">
                                    <h3>📈 SEO Score เฉลี่ย</h3>
                                    <div class="stat-number" id="avgSEOScore">0</div>
                                </div>
                                <div class="stat-card">
                                    <h3>🤖 SGE Ready</h3>
                                    <div class="stat-number" id="sgeReady">0%</div>
                                </div>
                                <div class="stat-card">
                                    <h3>👁️ Views รวม</h3>
                                    <div class="stat-number" id="totalViews">0</div>
                                </div>
                            </div>

                            <div class="recent-posts">
                                <h2>บทความล่าสุด</h2>
                                <div id="recentPostsList"></div>
                            </div>
                        </section>

                        <!-- Posts Management Section -->
                        <section id="posts" class="cms-section">
                            <div class="section-header">
                                <h2>จัดการบทความ</h2>
                                <div class="filters">
                                    <select id="statusFilter">
                                        <option value="">ทุกสถานะ</option>
                                        <option value="draft">ฉบับร่าง</option>
                                        <option value="published">เผยแพร่แล้ว</option>
                                        <option value="archived">เก็บถาวร</option>
                                    </select>
                                    <input type="search" id="searchPosts" placeholder="ค้นหาบทความ...">
                                </div>
                            </div>
                            <div id="postsList" class="posts-grid"></div>
                        </section>

                        <!-- SEO Tools Section -->
                        <section id="seo" class="cms-section">
                            <div class="seo-dashboard">
                                <h2>🔍 SEO Analysis Tools</h2>
                                
                                <div class="seo-tools-grid">
                                    <div class="tool-card">
                                        <h3>🎯 Keyword Research</h3>
                                        <p>ค้นหาและวิเคราะห์คีย์เวิร์ดสำหรับเนื้อหา</p>
                                        <button onclick="openKeywordTool()">เริ่มวิเคราะห์</button>
                                    </div>
                                    
                                    <div class="tool-card">
                                        <h3>📊 Content Score</h3>
                                        <p>ประเมินคุณภาพเนื้อหาสำหรับ SEO</p>
                                        <button onclick="analyzeContent()">วิเคราะห์เนื้อหา</button>
                                    </div>
                                    
                                    <div class="tool-card">
                                        <h3>🔗 Internal Linking</h3>
                                        <p>แนะนำการลิงก์ภายในเว็บไซต์</p>
                                        <button onclick="suggestLinks()">แนะนำลิงก์</button>
                                    </div>
                                    
                                    <div class="tool-card">
                                        <h3>📱 Mobile Optimization</h3>
                                        <p>ตรวจสอบการแสดงผลบนมือถือ</p>
                                        <button onclick="checkMobile()">ตรวจสอบ</button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <!-- SGE Optimization Section -->
                        <section id="sge" class="cms-section">
                            <div class="sge-optimizer">
                                <h2>🤖 Search Generative Experience Optimizer</h2>
                                <p class="sge-description">เพิ่มประสิทธิภาพเนื้อหาสำหรับ AI-powered search results</p>
                                
                                <div class="sge-features">
                                    <div class="feature-card">
                                        <h3>🎯 Answer Optimization</h3>
                                        <p>ปรับปรุงเนื้อหาให้ตอบคำถามได้ตรงจุด</p>
                                        <button onclick="optimizeAnswers()">เพิ่มประสิทธิภาพ</button>
                                    </div>
                                    
                                    <div class="feature-card">
                                        <h3>📝 Snippet Enhancement</h3>
                                        <p>สร้าง featured snippets ที่ AI เข้าใจง่าย</p>
                                        <button onclick="enhanceSnippets()">ปรับปรุง Snippets</button>
                                    </div>
                                    
                                    <div class="feature-card">
                                        <h3>🔍 Entity Recognition</h3>
                                        <p>ระบุและเชื่อมโยง entities สำคัญ</p>
                                        <button onclick="identifyEntities()">ระบุ Entities</button>
                                    </div>
                                    
                                    <div class="feature-card">
                                        <h3>💬 Conversational Content</h3>
                                        <p>ปรับเนื้อหาให้เหมาะกับการสนทนา</p>
                                        <button onclick="makeConversational()">ปรับรูปแบบ</button>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </main>
                </div>
            </div>

            <script src="/cms-script.js"></script>
        </body>
        </html>`;
        
        res.send(dashboardHTML);
    }

    // Get all posts with SEO scores
    async getAllPosts(req, res) {
        try {
            let posts = [];

            if (this.useSupabase) {
                // Supabase query
                const { data, error } = await this.supabase
                    .from('blog_posts')
                    .select('*')
                    .order('updated_at', { ascending: false });

                if (error) throw error;
                posts = data || [];
            } else {
                // Local file system
                const data = JSON.parse(fs.readFileSync(this.dataPath, 'utf8'));
                posts = data.posts || [];
            }

            // Add SEO scores to each post
            const postsWithSEO = await Promise.all(posts.map(async (post) => {
                const seoScore = await this.seoAnalyzer.calculateScore(post);
                const sgeScore = await this.seoAnalyzer.calculateSGEReadiness(post);
                
                return {
                    ...post,
                    seoScore,
                    sgeScore
                };
            }));

            res.json({
                success: true,
                posts: postsWithSEO,
                stats: {
                    total: postsWithSEO.length,
                    published: postsWithSEO.filter(p => p.status === 'published').length,
                    avgSEOScore: postsWithSEO.length > 0 ? Math.round(postsWithSEO.reduce((sum, p) => sum + p.seoScore, 0) / postsWithSEO.length) : 0,
                    sgeReady: postsWithSEO.length > 0 ? Math.round((postsWithSEO.filter(p => p.sgeScore > 70).length / postsWithSEO.length) * 100) : 0
                },
                mode: this.useSupabase ? 'production' : 'development'
            });
        } catch (error) {
            console.error('Error fetching posts:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Get single post
    async getPost(req, res) {
        try {
            const postId = req.params.id;
            let post = null;

            if (this.useSupabase) {
                const { data, error } = await this.supabase
                    .from('blog_posts')
                    .select('*')
                    .eq('id', postId)
                    .single();

                if (error) throw error;
                post = data;
            } else {
                const data = JSON.parse(fs.readFileSync(this.dataPath, 'utf8'));
                post = data.posts.find(p => p.id === parseInt(postId));
            }

            if (!post) {
                return res.status(404).json({ success: false, error: 'Post not found' });
            }

            res.json({ success: true, post });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Create new post
    async createPost(req, res) {
        try {
            const postData = {
                ...req.body,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            if (this.useSupabase) {
                const { data, error } = await this.supabase
                    .from('blog_posts')
                    .insert([postData])
                    .select()
                    .single();

                if (error) throw error;
                res.json({ success: true, post: data });
            } else {
                const data = JSON.parse(fs.readFileSync(this.dataPath, 'utf8'));
                const newPost = {
                    id: data.posts.length + 1,
                    ...postData
                };
                data.posts.push(newPost);
                fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
                res.json({ success: true, post: newPost });
            }
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Update post
    async updatePost(req, res) {
        try {
            const postId = req.params.id;
            const updateData = {
                ...req.body,
                updated_at: new Date().toISOString()
            };

            if (this.useSupabase) {
                const { data, error } = await this.supabase
                    .from('blog_posts')
                    .update(updateData)
                    .eq('id', postId)
                    .select()
                    .single();

                if (error) throw error;
                res.json({ success: true, post: data });
            } else {
                const data = JSON.parse(fs.readFileSync(this.dataPath, 'utf8'));
                const postIndex = data.posts.findIndex(p => p.id === parseInt(postId));
                
                if (postIndex === -1) {
                    return res.status(404).json({ success: false, error: 'Post not found' });
                }

                data.posts[postIndex] = { ...data.posts[postIndex], ...updateData };
                fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
                res.json({ success: true, post: data.posts[postIndex] });
            }
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Delete post
    async deletePost(req, res) {
        try {
            const postId = req.params.id;

            if (this.useSupabase) {
                const { error } = await this.supabase
                    .from('blog_posts')
                    .delete()
                    .eq('id', postId);

                if (error) throw error;
                res.json({ success: true });
            } else {
                const data = JSON.parse(fs.readFileSync(this.dataPath, 'utf8'));
                data.posts = data.posts.filter(p => p.id !== parseInt(postId));
                fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
                res.json({ success: true });
            }
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Analyze SEO for a post
    async analyzeSEO(req, res) {
        try {
            const { postId, content } = req.body;
            
            const analysis = await this.seoAnalyzer.fullAnalysis({
                id: postId,
                ...content
            });

            res.json({
                success: true,
                analysis
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Optimize content for SGE
    async optimizeForSGE(req, res) {
        try {
            const { content } = req.body;
            
            const optimized = await this.aiContentOptimizer.optimizeForSGE(content);

            res.json({
                success: true,
                optimized
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Generate structured data
    async generateStructuredData(req, res) {
        try {
            const { post } = req.body;
            
            const schema = await this.schemaGenerator.generateBlogSchema(post);

            res.json({
                success: true,
                schema
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Enhance content with AI
    async enhanceWithAI(req, res) {
        try {
            const { content } = req.body;
            
            const enhanced = await this.aiContentOptimizer.enhanceContent(content);

            res.json({
                success: true,
                enhanced
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Upload media
    async uploadMedia(req, res) {
        try {
            // Placeholder for media upload functionality
            res.json({ success: true, message: 'Media upload functionality to be implemented' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Get media library
    async getMediaLibrary(req, res) {
        try {
            // Placeholder for media library functionality
            res.json({ success: true, media: [] });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

// SEO Analyzer Class
class SEOAnalyzer {
    async calculateScore(post) {
        let score = 0;
        
        // Title optimization (20 points)
        if (post.titleth && post.titleth.length >= 30 && post.titleth.length <= 60) {
            score += 20;
        } else if (post.titleth && post.titleth.length > 0) {
            score += 10;
        }

        // Meta description (15 points)
        if (post.meta_description && post.meta_description.length >= 120 && post.meta_description.length <= 160) {
            score += 15;
        } else if (post.meta_description && post.meta_description.length > 0) {
            score += 8;
        }

        // Content length (20 points)
        if (post.content && post.content.length >= 1000) {
            score += 20;
        } else if (post.content && post.content.length >= 500) {
            score += 15;
        } else if (post.content && post.content.length >= 300) {
            score += 10;
        }

        // Tags/Keywords (15 points)
        if (post.tags && post.tags.length >= 3) {
            score += 15;
        } else if (post.tags && post.tags.length > 0) {
            score += 8;
        }

        // Images (10 points)
        const imageCount = (post.content || '').match(/<img/g)?.length || 0;
        if (imageCount >= 2) {
            score += 10;
        } else if (imageCount >= 1) {
            score += 5;
        }

        // Internal links (10 points)
        const internalLinks = (post.content || '').match(/href=["']\//g)?.length || 0;
        if (internalLinks >= 2) {
            score += 10;
        } else if (internalLinks >= 1) {
            score += 5;
        }

        // Headers structure (10 points)
        const headers = (post.content || '').match(/<h[1-6]/g)?.length || 0;
        if (headers >= 3) {
            score += 10;
        } else if (headers >= 1) {
            score += 5;
        }

        return Math.min(score, 100);
    }

    async calculateSGEReadiness(post) {
        let score = 0;

        // Clear question answering (25 points)
        if (post.main_question && post.quick_answer) {
            score += 25;
        }

        // Conversational tone (20 points)
        const conversationalWords = ['คือ', 'เป็น', 'ทำให้', 'ช่วย', 'แล้ว', 'ซึ่ง'];
        const contentWords = (post.content || '').toLowerCase();
        const conversationalCount = conversationalWords.filter(word => contentWords.includes(word)).length;
        if (conversationalCount >= 5) {
            score += 20;
        } else if (conversationalCount >= 3) {
            score += 15;
        } else if (conversationalCount >= 1) {
            score += 10;
        }

        // Structured content (20 points)
        const hasList = /<[uo]l>/i.test(post.content || '');
        const hasTable = /<table>/i.test(post.content || '');
        if (hasList && hasTable) {
            score += 20;
        } else if (hasList || hasTable) {
            score += 15;
        }

        // Entity mentions (15 points)
        if (post.related_entities && post.related_entities.length > 0) {
            score += 15;
        }

        // FAQ structure (20 points)
        const faqPattern = /คำถาม|ถาม|ตอบ|Q:|A:/i;
        if (faqPattern.test(post.content || '')) {
            score += 20;
        }

        return Math.min(score, 100);
    }

    async fullAnalysis(post) {
        const seoScore = await this.calculateScore(post);
        const sgeScore = await this.calculateSGEReadiness(post);
        
        return {
            seoScore,
            sgeScore,
            recommendations: this.generateRecommendations(post, seoScore, sgeScore),
            keywords: this.extractKeywords(post.content || ''),
            readability: this.calculateReadability(post.content || '')
        };
    }

    generateRecommendations(post, seoScore, sgeScore) {
        const recommendations = [];

        if (seoScore < 70) {
            recommendations.push({
                type: 'seo',
                priority: 'high',
                message: 'เพิ่มความยาวเนื้อหาให้มากกว่า 1000 คำ'
            });
        }

        if (sgeScore < 60) {
            recommendations.push({
                type: 'sge',
                priority: 'high',
                message: 'เพิ่มคำถาม-คำตอบที่ชัดเจนในเนื้อหา'
            });
        }

        if (!post.meta_description) {
            recommendations.push({
                type: 'seo',
                priority: 'medium',
                message: 'เพิ่ม meta description'
            });
        }

        return recommendations;
    }

    extractKeywords(content) {
        // Simple keyword extraction (can be enhanced with NLP)
        const words = content.toLowerCase()
            .replace(/[^\u0E00-\u0E7Fa-zA-Z\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2);
        
        const frequency = {};
        words.forEach(word => {
            frequency[word] = (frequency[word] || 0) + 1;
        });

        return Object.entries(frequency)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([word, count]) => ({ word, count }));
    }

    calculateReadability(content) {
        const sentences = content.split(/[.!?]+/).length;
        const words = content.split(/\s+/).length;
        const avgWordsPerSentence = words / sentences;
        
        let score = 100;
        if (avgWordsPerSentence > 20) score -= 20;
        if (avgWordsPerSentence > 25) score -= 20;
        
        return Math.max(score, 0);
    }
}

// AI Content Optimizer Class
class AIContentOptimizer {
    async optimizeForSGE(content) {
        // Placeholder for AI optimization
        // In production, this would connect to OpenAI, Gemini, or other AI services
        
        return {
            optimizedContent: content,
            suggestions: [
                'เพิ่มหัวข้อย่อยที่ตอบคำถามเฉพาะ',
                'สร้างส่วนสรุปที่ชัดเจน',
                'เพิ่มตัวอย่างที่เป็นรูปธรรม'
            ],
            entities: this.extractEntities(content),
            questions: this.generateQuestions(content)
        };
    }

    async enhanceContent(content) {
        return {
            enhancedContent: content,
            improvements: [
                'ปรับปรุงโครงสร้างหัวข้อ',
                'เพิ่มคำคล้องจอง',
                'ปรับปรุงการเชื่อมโยงประโยค'
            ]
        };
    }

    extractEntities(content) {
        // Simple entity extraction
        const entities = [];
        
        // Thai organization/company patterns
        const orgPattern = /บริษัท[\s\u0E00-\u0E7F]+/g;
        const orgs = content.match(orgPattern) || [];
        entities.push(...orgs.map(org => ({ type: 'organization', text: org })));

        // Location patterns
        const locationPattern = /จังหวัด[\s\u0E00-\u0E7F]+|ตำบล[\s\u0E00-\u0E7F]+|อำเภอ[\s\u0E00-\u0E7F]+/g;
        const locations = content.match(locationPattern) || [];
        entities.push(...locations.map(loc => ({ type: 'location', text: loc })));

        return entities;
    }

    generateQuestions(content) {
        // Generate potential questions based on content
        const questions = [
            'คืออะไร?',
            'ทำอย่างไร?',
            'เมื่อไหร่?',
            'ที่ไหน?',
            'ทำไม?',
            'ใครเป็นผู้?'
        ];

        return questions.slice(0, 3);
    }
}

// Schema Generator Class
class SchemaGenerator {    
    generateBlogSchema(post) {
        const baseUrl = process.env.NODE_ENV === 'production' 
            ? 'https://rbck.onrender.com' 
            : 'http://localhost:10000';
            
        return {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": post.titleth,
            "description": post.meta_description || post.excerpt,
            "author": {
                "@type": "Organization",
                "name": "ระเบียบการช่าง"
            },
            "publisher": {
                "@type": "Organization",
                "name": "ระเบียบการช่าง",
                "logo": {
                    "@type": "ImageObject",
                    "url": `${baseUrl}/logo.png`
                }
            },
            "datePublished": post.created_at || new Date().toISOString(),
            "dateModified": post.updated_at || post.created_at || new Date().toISOString(),
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": `${baseUrl}/blog/${post.slug}`
            },
            "keywords": Array.isArray(post.tags) ? post.tags.join(', ') : '',
            "articleSection": post.category || 'บทความ',
            "wordCount": (post.content || '').replace(/<[^>]*>/g, '').split(/\s+/).length
        };
    }

    generateFAQSchema(questions) {
        return {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": questions.map(q => ({
                "@type": "Question",
                "name": q.question,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": q.answer
                }
            }))
        };
    }
}

module.exports = BlogCMS;
