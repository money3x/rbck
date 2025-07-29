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

/**
 * ⚡ Smart Configuration Management - ดึงทุกอย่างจาก Render โดยตรง
 */
export class ConfigManager {
    constructor() {
        this.cache = {
            jwtToken: null,
            encryptionKey: null,
            supabaseUrl: null,
            supabaseServiceKey: null,
            supabaseAnonKey: null,
            lastUpdate: null,
            ttl: 5 * 60 * 1000 // 5 minutes cache
        };
    }

    /**
     * ดึง Supabase configuration จาก Render backend โดยตรง
     */
    async getSupabaseConfig() {
        try {
            // ✅ ตรวจสอบ cache ก่อน
            if (this.cache.supabaseUrl && Date.now() - this.cache.lastUpdate < this.cache.ttl) {
                console.log('🎯 [SUPABASE] Using cached Supabase config');
                return {
                    url: this.cache.supabaseUrl,
                    serviceKey: this.cache.supabaseServiceKey,
                    anonKey: this.cache.supabaseAnonKey
                };
            }

            console.log('🔄 [SUPABASE] Fetching Supabase config from Render...');
            
            const response = await fetch(`${API_BASE}/config/supabase`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.success && result.config) {
                // ✅ Cache the configuration
                this.cache.supabaseUrl = result.config.SUPABASE_URL;
                this.cache.supabaseServiceKey = result.config.SUPABASE_SERVICE_KEY;
                this.cache.supabaseAnonKey = result.config.SUPABASE_ANON_KEY;
                this.cache.lastUpdate = Date.now();
                
                console.log('✅ [SUPABASE] Fresh Supabase config retrieved from Render');
                
                return {
                    url: result.config.SUPABASE_URL,
                    serviceKey: result.config.SUPABASE_SERVICE_KEY,
                    anonKey: result.config.SUPABASE_ANON_KEY
                };
            } else {
                throw new Error(result.error || 'Failed to get Supabase config');
            }

        } catch (error) {
            console.error('❌ [SUPABASE] Failed to get Supabase config from Render:', error);
            // ⚠️ อย่าใช้ fallback เพราะ sensitive data ไม่ควรเก็บใน frontend
            throw error;
        }
    }


    /**
     * ดึง JWT Token จาก Render backend โดยตรง
     */
    async getJWTToken() {
        try {
            // ✅ ตรวจสอบ cache ก่อน
            if (this.cache.jwtToken && Date.now() - this.cache.lastUpdate < this.cache.ttl) {
                console.log('🎯 [TOKEN] Using cached JWT token');
                return this.cache.jwtToken;
            }

            console.log('🔄 [TOKEN] Fetching fresh JWT token from Render...');
            
            const response = await fetch(`${API_BASE}/auth/get-jwt-token`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.success && result.jwtToken) {
                this.cache.jwtToken = result.jwtToken;
                this.cache.lastUpdate = Date.now();
                console.log('✅ [TOKEN] Fresh JWT token retrieved from Render');
                return result.jwtToken;
            } else {
                throw new Error(result.error || 'Failed to get JWT token');
            }

        } catch (error) {
            console.error('❌ [TOKEN] Failed to get JWT from Render:', error);
            
            // ✅ ใน production ไม่ควรใช้ localStorage เก็บ token (security risk)
            if (error.message.includes('HTTP 400') || error.message.includes('HTTP 404')) {
                console.warn('⚠️ [TOKEN] Backend endpoint not available - this indicates configuration problem');
                console.warn('⚠️ [TOKEN] Please check Render backend environment variables:');
                console.warn('⚠️ [TOKEN] - JWT_SECRET should be set');
                console.warn('⚠️ [TOKEN] - ENCRYPTION_KEY should be set'); 
                console.warn('⚠️ [TOKEN] - Backend routes should be properly configured');
            }
            
            // ✅ Production approach: Don't use localStorage, require proper backend setup
            console.error('❌ [TOKEN] ConfigManager requires proper backend setup');
            console.error('❌ [TOKEN] Backend must provide JWT tokens through /api/auth/get-jwt-token');
            console.error('❌ [TOKEN] Please ensure Render backend is configured with proper environment variables');
            
            throw new Error('Backend configuration required - JWT endpoint not available');
        }
    }

    /**
     * ดึง ENCRYPTION_KEY จาก Render backend โดยตรง
     */
    async getEncryptionKey() {
        try {
            // ✅ ตรวจสอบ cache ก่อน
            if (this.cache.encryptionKey && Date.now() - this.cache.lastUpdate < this.cache.ttl) {
                console.log('🎯 [ENCRYPTION] Using cached encryption key');
                return this.cache.encryptionKey;
            }

            console.log('🔄 [ENCRYPTION] Fetching encryption key from Render...');
            
            const response = await fetch(`${API_BASE}/auth/get-encryption-key`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.success && result.encryptionKey) {
                this.cache.encryptionKey = result.encryptionKey;
                this.cache.lastUpdate = Date.now();
                console.log('✅ [ENCRYPTION] Fresh encryption key retrieved from Render');
                return result.encryptionKey;
            } else {
                throw new Error(result.error || 'Failed to get encryption key');
            }

        } catch (error) {
            console.error('❌ [ENCRYPTION] Failed to get encryption key from Render:', error);
            throw error;
        }
    }

    /**
     * ล้าง cache (ใช้เมื่อต้องการ refresh tokens)
     */
    clearCache() {
        this.cache = {
            jwtToken: null,
            encryptionKey: null,
            lastUpdate: null,
            ttl: 5 * 60 * 1000
        };
        console.log('🗑️ [TOKEN] Token cache cleared');
    }

    /**
     * ตรวจสอบว่า token ยังใช้งานได้หรือไม่
     */
    async validateToken(token) {
        try {
            const response = await fetch(`${API_BASE}/auth/verify-session`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token })
            });

            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('❌ [TOKEN] Token validation failed:', error);
            return false;
        }
    }
}

// ✅ สร้าง instance ที่ใช้ทั่วทั้งแอป
export const configManager = new ConfigManager();

/**
 * ⚡ Helper functions สำหรับใช้งานง่าย
 */
export const getToken = () => configManager.getJWTToken();
export const getEncryptionKey = () => configManager.getEncryptionKey();
export const getSupabaseConfig = () => configManager.getSupabaseConfig();
export const validateToken = (token) => configManager.validateToken(token);
export const clearConfigCache = () => configManager.clearCache();

/**
 * ✅ Test backend configuration and endpoints
 */
export async function testBackendConfiguration() {
    console.log('🧪 [CONFIG] Testing backend configuration...');
    
    const results = {
        jwtEndpoint: false,
        encryptionEndpoint: false,
        supabaseEndpoint: false,
        healthCheck: false,
        errors: []
    };
    
    // Test JWT token endpoint
    try {
        const response = await fetch(`${API_BASE}/auth/get-jwt-token`);
        if (response.ok) {
            const data = await response.json();
            results.jwtEndpoint = data.success === true;
        } else {
            results.errors.push(`JWT endpoint returned ${response.status}`);
        }
    } catch (error) {
        results.errors.push(`JWT endpoint error: ${error.message}`);
    }
    
    // Test encryption key endpoint
    try {
        const response = await fetch(`${API_BASE}/auth/get-encryption-key`);
        if (response.ok) {
            const data = await response.json();
            results.encryptionEndpoint = data.success === true;
        } else {
            results.errors.push(`Encryption endpoint returned ${response.status}`);
        }
    } catch (error) {
        results.errors.push(`Encryption endpoint error: ${error.message}`);
    }
    
    // Test Supabase config endpoint
    try {
        const response = await fetch(`${API_BASE}/config/supabase`);
        if (response.ok) {
            const data = await response.json();
            results.supabaseEndpoint = data.success === true;
        } else {
            results.errors.push(`Supabase config endpoint returned ${response.status}`);
        }
    } catch (error) {
        results.errors.push(`Supabase config endpoint error: ${error.message}`);
    }
    
    // Test general health
    try {
        const response = await fetch(`${API_BASE}/health`);
        results.healthCheck = response.ok;
    } catch (error) {
        results.errors.push(`Health check error: ${error.message}`);
    }
    
    console.log('🧪 [CONFIG] Backend test results:', results);
    return results;
}

// Additional config for production
export const CONFIG = {
    isDevelopment: window.location.hostname.includes('localhost'),
    isProduction: !window.location.hostname.includes('localhost'),
    version: '1.0.0',
    apiTimeout: 30000, // 30 seconds
    retryAttempts: 3,
    configVersion: '2025-07-07-v1-production-ready',
    
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
