const express = require('express');
const router = express.Router();
const { supabase, isConnected } = require('../supabaseClient');

// GET /api/posts - Get all posts
router.get('/', async (req, res) => {
    try {
        console.log('📋 /api/posts called', { hasUrl: !!process.env.SUPABASE_URL, hasAnon: !!process.env.SUPABASE_ANON_KEY });

        // Check if client exists
        if (!supabase) {
            console.error('❌ Supabase client not available');
            return res.status(503).json({
                success: false,
                error: 'Database service unavailable',
                message: 'Supabase client not initialized',
                code: 'DB_CLIENT_MISSING',
                data: []
            });
        }

        // Query database
        const { data, error, count } = await supabase
            .from('posts')
            .select('id,title,status,published_at')
            .eq('status', 'published')
            .order('published_at', { ascending: false })
            .limit(50);

        // Log query result
        console.log('📊 Supabase query result:', { returnedRows: data?.length || 0 });

        // Handle database error
        if (error) {
            return res.status(500).json({
                error: 'Database error',
                message: error.message,
                code: error.code
            });
        }

        // Return results
        const posts = data || [];
        if (posts.length === 0) {
            return res.status(200).json({ items: [], message: 'No posts found' });
        }
        
        res.json({ items: posts });

    } catch (error) {
        console.error('❌ Route error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message,
            code: 'ROUTE_ERROR',
            data: []
        });
    }
});

// Health check endpoint
router.get('/health', async (req, res) => {
    const { checkHealth } = require('../supabaseClient');
    const health = await checkHealth();
    
    res.json({
        ok: true,
        database: health,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;