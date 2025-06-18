// backend/posts.js
// REST API สำหรับบทความ (posts) เชื่อมต่อ Supabase
const express = require('express');
const router = express.Router();
const supabase = require('./supabaseClient');
const { authenticateAdmin } = require('./middleware/auth');

// ฟังก์ชันตรวจสอบ Supabase connection
const testSupabaseConnection = async () => {
    try {
        // ใช้ query ง่ายๆ แทน count(*)
        const { data, error } = await supabase
            .from('posts')
            .select('id')
            .limit(1);
            
        if (error) {
            console.warn('Supabase test query failed:', error.message);
            return false;
        }
        
        console.log('✅ Supabase connection successful');
        return true;
    } catch (error) {
        console.warn('⚠️ Supabase connection test failed:', error.message);
        return false;
    }
};

// Middleware เพื่อตรวจสอบ Supabase ก่อนใช้งาน
const checkSupabaseConnection = async (req, res, next) => {
    const isConnected = await testSupabaseConnection();
    req.supabaseAvailable = isConnected;
    next();
};

// GET /api/posts - ดึงรายการโพสต์ทั้งหมด
router.get('/posts', checkSupabaseConnection, async (req, res) => {
    try {
        if (!req.supabaseAvailable) {
            // ถ้า Supabase ไม่พร้อม ใช้ fallback data
            console.log('📋 Using fallback posts data');
            const fallbackPosts = [
                {
                    id: 1,
                    title: "Welcome to RBCK CMS",
                    content: "This is a sample post from fallback data.",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    published: true,
                    author: "System"
                }
            ];
            
            return res.json({
                success: true,
                data: fallbackPosts,
                source: 'fallback',
                message: 'Using fallback data due to database connection issues'
            });
        }

        // ใช้ Supabase query ที่ปลอดภัย
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase query error:', error);
            throw new Error(`Database query failed: ${error.message}`);
        }

        res.json({
            success: true,
            data: data || [],
            source: 'supabase',
            count: data ? data.length : 0
        });

    } catch (error) {
        console.error('Posts GET error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch posts',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            source: 'error'
        });
    }
});

// GET /api/posts/slug/:slug - ดึงบทความตาม slug
router.get('/posts/slug/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .eq('slug', slug)
            .single();
        if (error) return res.status(404).json({ error: error.message });
        res.json(data);
    } catch (err) {
        console.error('Posts slug endpoint error:', err);
        res.status(500).json({ error: 'Internal server error while fetching post by slug' });
    }
});

// GET /api/posts/:id - ดึงโพสต์เฉพาะ
router.get('/posts/:id', checkSupabaseConnection, async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.supabaseAvailable) {
            return res.status(503).json({
                success: false,
                error: 'Database temporarily unavailable',
                source: 'fallback'
            });
        }

        // ตรวจสอบว่า id เป็นตัวเลข
        if (isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                error: 'Invalid post ID format'
            });
        }

        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .eq('id', parseInt(id))
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    error: 'Post not found'
                });
            }
            throw new Error(`Database query failed: ${error.message}`);
        }

        res.json({
            success: true,
            data: data,
            source: 'supabase'
        });

    } catch (error) {
        console.error('Post GET by ID error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch post',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// POST /api/posts - สร้างโพสต์ใหม่ (Admin only)
router.post('/posts', authenticateAdmin, checkSupabaseConnection, async (req, res) => {
    try {
        if (!req.supabaseAvailable) {
            return res.status(503).json({
                success: false,
                error: 'Database temporarily unavailable - cannot create posts',
                source: 'fallback'
            });
        }

        const { title, content, published = false } = req.body;

        // Validation
        if (!title || !content) {
            return res.status(400).json({
                success: false,
                error: 'Title and content are required'
            });
        }

        if (title.length > 255) {
            return res.status(400).json({
                success: false,
                error: 'Title must be less than 255 characters'
            });
        }

        const newPost = {
            title: title.trim(),
            content: content.trim(),
            published: Boolean(published),
            author: req.user?.username || 'admin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('posts')
            .insert([newPost])
            .select()
            .single();

        if (error) {
            console.error('Supabase insert error:', error);
            throw new Error(`Failed to create post: ${error.message}`);
        }

        res.status(201).json({
            success: true,
            data: data,
            message: 'Post created successfully',
            source: 'supabase'
        });

    } catch (error) {
        console.error('Post creation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create post',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// PUT /api/posts/:id - อัพเดตโพสต์ (Admin only)
router.put('/posts/:id', authenticateAdmin, checkSupabaseConnection, async (req, res) => {
    try {
        if (!req.supabaseAvailable) {
            return res.status(503).json({
                success: false,
                error: 'Database temporarily unavailable - cannot update posts'
            });
        }

        const { id } = req.params;
        const { title, content, published } = req.body;

        if (isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                error: 'Invalid post ID format'
            });
        }

        const updateData = {
            updated_at: new Date().toISOString()
        };

        if (title !== undefined) updateData.title = title.trim();
        if (content !== undefined) updateData.content = content.trim();
        if (published !== undefined) updateData.published = Boolean(published);

        const { data, error } = await supabase
            .from('posts')
            .update(updateData)
            .eq('id', parseInt(id))
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    error: 'Post not found'
                });
            }
            throw new Error(`Failed to update post: ${error.message}`);
        }

        res.json({
            success: true,
            data: data,
            message: 'Post updated successfully',
            source: 'supabase'
        });

    } catch (error) {
        console.error('Post update error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update post',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// DELETE /api/posts/:id - ลบโพสต์ (Admin only)
router.delete('/posts/:id', authenticateAdmin, checkSupabaseConnection, async (req, res) => {
    try {
        if (!req.supabaseAvailable) {
            return res.status(503).json({
                success: false,
                error: 'Database temporarily unavailable - cannot delete posts'
            });
        }

        const { id } = req.params;

        if (isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                error: 'Invalid post ID format'
            });
        }

        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', parseInt(id));

        if (error) {
            console.error('Supabase delete error:', error);
            throw new Error(`Failed to delete post: ${error.message}`);
        }

        res.json({
            success: true,
            message: 'Post deleted successfully',
            source: 'supabase'
        });

    } catch (error) {
        console.error('Post deletion error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete post',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
