// backend/posts.js
// REST API for posts with comprehensive Supabase error handling
const express = require('express');
const router = express.Router();
const supabase = require('./supabaseClient');
const { authenticateAdmin } = require('./middleware/auth');

// Test Supabase connection function
const testSupabaseConnection = async () => {
    try {
        console.log('🔍 Testing Supabase connection in posts route...');
        
        // Check if supabase client exists and has the from method
        if (!supabase || typeof supabase.from !== 'function') {
            console.warn('⚠️ Supabase client not properly initialized');
            return false;
        }

        // Simple test query
        const { data, error } = await supabase
            .from('posts')
            .select('id')
            .limit(1);
            
        if (error) {
            console.warn('⚠️ Supabase test query failed:', error.message);
            return false;
        }
        
        console.log('✅ Supabase connection test successful in posts route');
        return true;
    } catch (error) {
        console.warn('⚠️ Supabase connection test error:', error.message);
        return false;
    }
};

// Middleware to check Supabase connection before using
const checkSupabaseConnection = async (req, res, next) => {
    const isConnected = await testSupabaseConnection();
    req.supabaseAvailable = isConnected;
    next();
};

// GET /api/posts - Get all posts
router.get('/', checkSupabaseConnection, async (req, res) => {
    try {
        console.log('📋 GET /api/posts called');
        
        if (!req.supabaseAvailable) {
            console.log('📋 Using fallback posts data');
            const fallbackPosts = [
                {
                    id: 1,
                    title: "Welcome to RBCK CMS",
                    content: "This is a sample post from fallback data. Your Supabase database is not connected yet.",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    published: true,
                    author: "System"
                },
                {
                    id: 2,
                    title: "Getting Started",
                    content: "To connect your Supabase database, make sure to set the SUPABASE_URL and SUPABASE_ANON_KEY environment variables.",
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

        // Use Supabase query
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase query error:', error);
            throw new Error(`Database query failed: ${error.message}`);
        }

        console.log(`✅ Successfully fetched ${data?.length || 0} posts from Supabase`);

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

// GET /api/posts/:id - Get specific post
router.get('/:id', checkSupabaseConnection, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`📋 GET /api/posts/${id} called`);

        if (!req.supabaseAvailable) {
            return res.status(503).json({
                success: false,
                error: 'Database temporarily unavailable',
                source: 'fallback'
            });
        }

        // Validate ID
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

// POST /api/posts - Create new post (Admin only)
router.post('/', authenticateAdmin, checkSupabaseConnection, async (req, res) => {
    try {
        console.log('📝 POST /api/posts called');
        
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

        console.log('✅ Post created successfully:', data.id);

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

// PUT /api/posts/:id - Update post (Admin only)
router.put('/:id', authenticateAdmin, checkSupabaseConnection, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`✏️ PUT /api/posts/${id} called`);
        
        if (!req.supabaseAvailable) {
            return res.status(503).json({
                success: false,
                error: 'Database temporarily unavailable - cannot update posts'
            });
        }

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

        console.log('✅ Post updated successfully:', data.id);

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

// DELETE /api/posts/:id - Delete post (Admin only)
router.delete('/:id', authenticateAdmin, checkSupabaseConnection, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🗑️ DELETE /api/posts/${id} called`);
        
        if (!req.supabaseAvailable) {
            return res.status(503).json({
                success: false,
                error: 'Database temporarily unavailable - cannot delete posts'
            });
        }

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

        console.log('✅ Post deleted successfully:', id);

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
