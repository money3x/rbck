/**
 * Config สำหรับ frontend (ไม่ควรใส่ API Key จริง)
 * Auto-detects environment and uses appropriate API endpoint
 * Updated: 2025-06-19 - Disabled Supabase routes, using fallback posts
 */

// Smart environment detection
function getApiBase() {
    const hostname = window.location.hostname;
    const port = window.location.port;
    const protocol = window.location.protocol;
    
    console.log('🔍 Detecting environment:', { hostname, port, protocol });
    
    // Check if we're in development (localhost or local IP)
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('192.168.')) {
        // Development: use local backend
        const backendPort = port === '8080' ? '10000' : '10000'; // Default backend port
        const devUrl = `${protocol}//${hostname}:${backendPort}/api`;
        console.log('🏠 Development mode detected, using:', devUrl);
        return devUrl;
    } else {
        // Production: ALWAYS use direct connection to Render
        // Netlify proxy is not working correctly, so bypass it completely
        const prodUrl = 'https://rbck.onrender.com/api';
        console.log('🌐 Production mode detected, using direct connection:', prodUrl);
        return prodUrl;
    }
}

export const API_BASE = getApiBase();
export const GEMINI_MODEL = 'gemini-2.0-flash';

// Debug logging with cache buster
const cacheBuster = Date.now();
console.log(`🔧 Frontend Config [${cacheBuster}]:`, {
    hostname: window.location.hostname,
    port: window.location.port,
    API_BASE: API_BASE,
    protocol: window.location.protocol,
    usingDirectConnection: !API_BASE.startsWith('/api'),
    configVersion: '2025-06-19-v1-supabase-fix'
});

// Verify config is correct
if (API_BASE.startsWith('/api') && !window.location.hostname.includes('localhost')) {
    console.error('❌ CONFIG ERROR: Still using proxy in production!');
    console.error('❌ This will cause connection failures!');
    console.error('✅ Expected API_BASE: https://rbck.onrender.com/api');
    console.error('❌ Actual API_BASE:', API_BASE);
} else {
    console.log('✅ Config validation passed');
}

// Additional config for production
export const CONFIG = {
    isDevelopment: window.location.hostname.includes('localhost'),
    isProduction: !window.location.hostname.includes('localhost'),
    version: '1.0.0',
    apiTimeout: 30000, // 30 seconds
    retryAttempts: 3,
    configVersion: '2025-06-19-v1-supabase-fix',
    
    // CORS settings for direct connection
    corsSettings: {
        mode: 'cors',
        credentials: 'omit', // Don't send credentials for CORS
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    }
};
