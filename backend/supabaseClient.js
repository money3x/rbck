const { createClient } = require('@supabase/supabase-js');

// Environment variables - NO hardcoding
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Logging utility
const logger = {
    info: (msg, data) => console.log(`ℹ️ [Supabase] ${msg}`, data || ''),
    warn: (msg, data) => console.warn(`⚠️ [Supabase] ${msg}`, data || ''),
    error: (msg, error) => console.error(`❌ [Supabase] ${msg}`, error || '')
};

// Initialize client
let supabase = null;
let isConnected = false;

// Log configuration status (never expose actual values)
logger.info('Configuration check', {
    hasUrl: !!SUPABASE_URL,
    hasAnonKey: !!SUPABASE_ANON_KEY,
    nodeEnv: process.env.NODE_ENV
});

// Initialize client if environment variables are available
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
        isConnected = true;
        logger.info('Supabase client initialized successfully');
    } catch (error) {
        logger.error('Failed to initialize Supabase client', error);
        supabase = null;
        isConnected = false;
    }
} else {
    logger.error('Missing required environment variables', {
        missingUrl: !SUPABASE_URL,
        missingAnonKey: !SUPABASE_ANON_KEY
    });
}

// Health check function
async function checkHealth() {
    if (!supabase) {
        return { connected: false, error: 'Client not initialized' };
    }

    try {
        const { data, error } = await supabase.from('posts').select('id').limit(1);
        return { 
            connected: !error, 
            error: error?.message || null,
            canQuery: !!data
        };
    } catch (error) {
        return { connected: false, error: error.message };
    }
}

module.exports = {
    supabase,
    isConnected,
    checkHealth
};