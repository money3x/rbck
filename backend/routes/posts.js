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
            .select('id,titleth,titleen,content,author,category,excerpt,metadescription,created_at,updated_at,status')
            .eq('status', 'published')
            .order('created_at', { ascending: false })
            .limit(50);

        // Log query result
        console.log('📊 Supabase query result:', { returnedRows: data?.length || 0 });

        // Handle database error
        if (error) {
            return res.status(500).json({
                error: 'Database error',
                message: error.message,
                code: error.code || 'DB_ERROR'
            });
        }

        // Return results
        const posts = data || [];
        console.log('📊 /api/posts result', {
          returned: posts.length,
          sampleKeys: posts[0] ? Object.keys(posts[0]) : []
        });
        if (posts.length === 0) {
            return res.status(200).json({ 
                success: true,
                items: [],
                data: [],
                posts: [],
                message: 'No posts found',
                count: 0
            });
        }
        
        console.log('📊 posts result', { count: posts.length });
        res.json({ 
            success: true,
            items: posts,
            data: posts,
            posts: posts,
            count: posts.length
        });

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

// AI Enhancement endpoint
router.post('/ai-enhance', async (req, res) => {
    try {
        console.log('🤖 [AI-ENHANCE] Request received');
        
        // For now, return a placeholder response
        // TODO: Implement actual AI enhancement functionality
        res.json({
            success: true,
            message: 'AI enhancement functionality will be implemented soon',
            enhanced: {
                title: req.body.title || 'Enhanced Title',
                content: req.body.content || 'Enhanced Content',
                suggestions: ['Improve readability', 'Add more keywords', 'Optimize structure']
            }
        });
    } catch (error) {
        console.error('❌ [AI-ENHANCE] Error:', error);
        res.status(500).json({
            success: false,
            error: 'AI enhancement failed',
            message: error.message
        });
    }
});

// SEO Analysis endpoint
router.post('/seo-analyze', async (req, res) => {
    try {
        console.log('🔍 [SEO-ANALYZE] Request received');
        
        // For now, return a placeholder response
        // TODO: Implement actual SEO analysis functionality
        res.json({
            success: true,
            message: 'SEO analysis functionality will be implemented soon',
            analysis: {
                score: 75,
                suggestions: [
                    'Add meta description',
                    'Optimize title length',
                    'Include more keywords',
                    'Improve content structure'
                ],
                keywords: ['content', 'SEO', 'optimization'],
                readability: 'Good'
            }
        });
    } catch (error) {
        console.error('❌ [SEO-ANALYZE] Error:', error);
        res.status(500).json({
            success: false,
            error: 'SEO analysis failed',
            message: error.message
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