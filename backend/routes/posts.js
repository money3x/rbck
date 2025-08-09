const express = require('express');
const router = express.Router();
const { supabase, isConnected } = require('../supabaseClient');

// GET /api/posts - Get all posts
router.get('/', async (req, res) => {
    try {
        console.log('📋 GET /api/posts called');
        
        // Log configuration status
        console.log('🔍 Database status:', {
            hasUrl: !!process.env.SUPABASE_URL,
            hasAnon: !!process.env.SUPABASE_ANON_KEY,
            clientExists: !!supabase,
            isConnected: isConnected
        });

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
        console.log('🔄 Querying posts table...');
        const { data, error, count } = await supabase
            .from('posts')
            .select('*', { count: 'exact' })
            .eq('status', 'published')
            .order('created_at', { ascending: false })
            .limit(100);

        // Log query result
        console.log('📊 Query result:', {
            totalRows: count,
            returnedRows: data?.length || 0,
            hasError: !!error
        });

        // Handle database error
        if (error) {
            console.error('❌ Database query failed:', {
                message: error.message,
                details: error.details,
                code: error.code
            });
            
            return res.status(500).json({
                success: false,
                error: 'Database query failed',
                message: error.message,
                code: error.code || 'DB_QUERY_ERROR',
                data: []
            });
        }

        // Return results (always array)
        const posts = data || [];
        console.log(`✅ Successfully returned ${posts.length} posts`);
        
        res.json({
            success: true,
            data: posts,
            count: posts.length,
            source: 'supabase'
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