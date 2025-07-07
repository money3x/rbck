/**
 * Configuration Routes for RBCK CMS
 * Provides backend configuration endpoints for frontend
 */

const express = require('express');
const router = express.Router();
const { logger } = require('../middleware/errorHandler');

/**
 * ✅ PRODUCTION: GET /api/config/supabase
 * Get Supabase configuration for frontend
 */
router.get('/supabase', (req, res) => {
    try {
        // ✅ ตรวจสอบ Supabase configuration
        const requiredSupabaseVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'SUPABASE_ANON_KEY'];
        const missingVars = requiredSupabaseVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            logger.error('❌ Missing Supabase environment variables:', missingVars);
            return res.status(500).json({
                success: false,
                error: 'Supabase configuration incomplete',
                missing: missingVars,
                code: 'MISSING_SUPABASE_CONFIG'
            });
        }

        logger.info('✅ Supabase configuration provided to frontend');
        
        res.json({
            success: true,
            config: {
                SUPABASE_URL: process.env.SUPABASE_URL,
                SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
                SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        logger.error('❌ Supabase config retrieval error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get Supabase configuration',
            code: 'SUPABASE_CONFIG_FAILED'
        });
    }
});

/**
 * ✅ PRODUCTION: GET /api/config/environment
 * Get general environment configuration
 */
router.get('/environment', (req, res) => {
    try {
        res.json({
            success: true,
            config: {
                NODE_ENV: process.env.NODE_ENV || 'development',
                API_VERSION: '1.0.0',
                TIMESTAMP: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('❌ Environment config error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get environment configuration'
        });
    }
});

module.exports = router;