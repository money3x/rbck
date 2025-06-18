/**
 * Config สำหรับ frontend (ไม่ควรใส่ API Key จริง)
 * Auto-detects environment and uses appropriate API endpoint
 */

// Smart environment detection
function getApiBase() {
    const hostname = window.location.hostname;
    const port = window.location.port;
    const protocol = window.location.protocol;
    
    // Check if we're in development (localhost or local IP)
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('192.168.')) {
        // Development: use local backend
        const backendPort = port === '8080' ? '10000' : '10000'; // Default backend port
        return `${protocol}//${hostname}:${backendPort}/api`;
    } else {
        // Production: use Netlify proxy to avoid CORS issues
        return '/api'; // This will be proxied to https://rbck.onrender.com/api by Netlify
    }
}

export const API_BASE = getApiBase();
export const GEMINI_MODEL = 'gemini-2.0-flash';

// Debug logging
console.log('🔧 Frontend Config:', {
    hostname: window.location.hostname,
    port: window.location.port,
    API_BASE: API_BASE,
    protocol: window.location.protocol
});

// Additional config for production
export const CONFIG = {
    isDevelopment: window.location.hostname.includes('localhost'),
    isProduction: !window.location.hostname.includes('localhost'),
    version: '1.0.0',
    apiTimeout: 30000, // 30 seconds
    retryAttempts: 3
};
