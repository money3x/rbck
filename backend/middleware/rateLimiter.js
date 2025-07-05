// ✅ PHASE 3: Enhanced Rate Limiting Middleware for RBCK API
// Advanced security features with adaptive protection

const rateLimit = require('express-rate-limit');

// ✅ NEW: Suspicious IP tracking
const suspiciousIPs = new Map();
const blockedIPs = new Set();

/**
 * ✅ PHASE 3: Advanced IP analysis and blocking
 */
const analyzeIPBehavior = (ip, endpoint) => {
    const key = `${ip}:${endpoint}`;
    const now = Date.now();
    
    if (!suspiciousIPs.has(key)) {
        suspiciousIPs.set(key, {
            requests: 1,
            firstSeen: now,
            lastSeen: now,
            violations: 0,
            patterns: []
        });
        return false;
    }
    
    const data = suspiciousIPs.get(key);
    data.requests++;
    data.lastSeen = now;
    
    // Check for rapid-fire requests (potential bot)
    const timeDiff = now - data.lastSeen;
    if (timeDiff < 100) { // Less than 100ms between requests
        data.violations++;
        data.patterns.push('rapid_fire');
    }
    
    // Check for sustained high volume
    const duration = now - data.firstSeen;
    if (duration < 60000 && data.requests > 50) { // 50+ requests in 1 minute
        data.violations++;
        data.patterns.push('high_volume');
    }
    
    // Block if too many violations
    if (data.violations >= 3) {
        blockedIPs.add(ip);
        console.warn(`🔒 [SECURITY] IP ${ip} blocked due to suspicious behavior:`, data.patterns);
        return true;
    }
    
    return false;
};

/**
 * ✅ PHASE 3: Enhanced middleware to check blocked IPs
 */
const blockSuspiciousIPs = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    
    // ✅ Development IP whitelist - bypass blocking for these IPs
    const developmentWhitelist = [
        '127.0.0.1',
        'localhost',
        '::1',
        '::ffff:127.0.0.1'
    ];
    
    // Skip blocking for development IPs
    if (process.env.NODE_ENV !== 'production' && 
        (developmentWhitelist.includes(ip) || ip.startsWith('192.168.') || ip.startsWith('10.0.'))) {
        return next();
    }
    
    if (blockedIPs.has(ip)) {
        console.warn(`🚫 [SECURITY] Blocked IP ${ip} attempted access to ${req.path}`);
        return res.status(429).json({
            success: false,
            error: 'Access temporarily restricted',
            message: 'Your IP has been temporarily blocked due to suspicious activity',
            code: 'IP_BLOCKED',
            timestamp: new Date().toISOString()
        });
    }
    
    // Analyze current request
    if (analyzeIPBehavior(ip, req.path)) {
        return res.status(429).json({
            success: false,
            error: 'Suspicious activity detected',
            message: 'Access restricted due to unusual request patterns',
            code: 'SUSPICIOUS_ACTIVITY',
            timestamp: new Date().toISOString()
        });
    }
    
    next();
};

/**
 * Development Rate limiter for API Key management endpoints
 * Much more lenient for development and testing
 */
const apiKeyRateLimit = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes (shorter window)
    max: 50, // Maximum 50 requests per 5 minutes (much higher for dev)
    message: {
        error: 'API Key rate limit exceeded (Development Mode)',
        message: 'You have exceeded the limit for API key operations. Please wait 5 minutes before trying again.',
        retryAfter: 5 * 60, // seconds
        currentLimit: 50,
        timeWindow: '5 minutes',
        environment: 'development',
        timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.ip + ':dev:' + (req.headers['user-agent'] || 'unknown');
    },
    handler: (req, res) => {
        console.log(`🚨 [DEV] API Key rate limit exceeded for IP: ${req.ip} at ${new Date().toISOString()}`);
        res.status(429).json({
            error: 'API Key rate limit exceeded (Development Mode)',
            message: 'You have exceeded the limit for API key operations. Please wait 5 minutes before trying again.',
            retryAfter: 5 * 60,
            currentLimit: 50,
            timeWindow: '5 minutes',
            environment: 'development',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Development Rate limiter for login attempts
 * More lenient for development
 */
const loginRateLimit = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 20, // Maximum 20 login attempts per 10 minutes
    message: {
        error: 'Too many login attempts (Development Mode)',
        message: 'You have exceeded the login attempt limit. Please wait 10 minutes before trying again.',
        retryAfter: 10 * 60,
        environment: 'development',
        timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => {
        return req.ip + ':dev:login';
    },
    handler: (req, res) => {
        console.log(`🚨 [DEV] Login rate limit exceeded for IP: ${req.ip} at ${new Date().toISOString()}`);
        res.status(429).json({
            error: 'Too many login attempts (Development Mode)',
            message: 'You have exceeded the login attempt limit. Please wait 10 minutes before trying again.',
            retryAfter: 10 * 60,
            environment: 'development',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Development General rate limiter
 * Very lenient for development
 */
const generalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Maximum 500 requests per 15 minutes (very high for dev)
    message: {
        error: 'Too many requests (Development Mode)',
        message: 'You have exceeded the general request limit. Please slow down your requests.',
        retryAfter: 15 * 60,
        environment: 'development',
        timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.ip + ':dev';
    },
    handler: (req, res) => {
        console.log(`⚠️ [DEV] General rate limit exceeded for IP: ${req.ip} at ${new Date().toISOString()}`);
        res.status(429).json({
            error: 'Too many requests (Development Mode)',
            message: 'You have exceeded the general request limit. Please slow down your requests.',
            retryAfter: 15 * 60,
            environment: 'development',
            timestamp: new Date().toISOString()
        });
    }
});

const createCustomRateLimit = (windowMs, max, identifier) => {
    return rateLimit({
        windowMs: windowMs,
        max: max,
        message: {
            error: `Too many ${identifier} requests (Development Mode)`,
            message: `You have exceeded the limit for ${identifier} operations.`,
            retryAfter: Math.floor(windowMs / 1000),
            environment: 'development',
            timestamp: new Date().toISOString()
        },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => {
            return req.ip + ':dev:' + identifier;
        }
    });
};

/**
 * Enhanced production rate limiter for API Key management
 * Strict limits for production security
 */
const productionApiKeyRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Maximum 10 requests per 15 minutes in production
    message: {
        error: 'API Key rate limit exceeded',
        message: 'You have exceeded the limit for API key operations. Please wait before trying again.',
        retryAfter: 15 * 60,
        currentLimit: 10,
        timeWindow: '15 minutes',
        timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.ip + ':prod:apikey:' + (req.user?.username || 'anonymous');
    },
    handler: (req, res) => {
        console.log(`🚨 [PROD] API Key rate limit exceeded for IP: ${req.ip}, User: ${req.user?.username || 'anonymous'} at ${new Date().toISOString()}`);
        res.status(429).json({
            success: false,
            error: 'API Key rate limit exceeded',
            message: 'You have exceeded the limit for API key operations. Please wait before trying again.',
            retryAfter: 15 * 60,
            code: 'RATE_LIMIT_EXCEEDED'
        });
    }
});

/**
 * Enhanced production login rate limiter
 * More strict for production security
 */
const productionLoginRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Maximum 5 login attempts per 15 minutes
    message: {
        error: 'Too many login attempts',
        message: 'You have exceeded the login attempt limit. Please wait before trying again.',
        retryAfter: 15 * 60,
        timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => {
        return req.ip + ':prod:login';
    },
    handler: (req, res) => {
        console.log(`🚨 [PROD] Login rate limit exceeded for IP: ${req.ip} at ${new Date().toISOString()}`);
        res.status(429).json({
            success: false,
            error: 'Too many login attempts',
            message: 'You have exceeded the login attempt limit. Please wait before trying again.',
            retryAfter: 15 * 60,
            code: 'LOGIN_RATE_LIMIT_EXCEEDED'
        });
    }
});

/**
 * Adaptive rate limiter that switches based on environment
 */
const adaptiveApiKeyRateLimit = process.env.NODE_ENV === 'production' 
    ? productionApiKeyRateLimit 
    : apiKeyRateLimit;

const adaptiveLoginRateLimit = process.env.NODE_ENV === 'production' 
    ? productionLoginRateLimit 
    : loginRateLimit;

/**
 * ✅ PHASE 3: Advanced AI endpoint rate limiting
 */
const aiEndpointRateLimit = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: process.env.NODE_ENV === 'production' ? 30 : 100,
    message: {
        error: 'AI service rate limit exceeded',
        message: 'Too many AI requests. Please wait before trying again.',
        retryAfter: 5 * 60,
        timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return `${req.ip}:ai:${req.user?.id || 'anonymous'}`;
    }
});

/**
 * ✅ PHASE 3: Migration endpoint rate limiting (very strict)
 */
const migrationRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Maximum 5 migration operations per hour
    message: {
        error: 'Migration rate limit exceeded',
        message: 'Too many migration operations. Please wait before trying again.',
        retryAfter: 60 * 60,
        timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return `${req.ip}:migration:${req.user?.id || 'anonymous'}`;
    }
});

/**
 * ✅ PHASE 3: Cleanup function to prevent memory leaks
 */
const cleanupSuspiciousIPs = () => {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [key, data] of suspiciousIPs.entries()) {
        if (now - data.lastSeen > maxAge) {
            suspiciousIPs.delete(key);
        }
    }
    
    // Clear blocked IPs after 2 hours
    if (blockedIPs.size > 0) {
        setTimeout(() => {
            blockedIPs.clear();
            console.log('🔄 [SECURITY] Cleared blocked IPs list');
        }, 2 * 60 * 60 * 1000);
    }
};

// Run cleanup every hour
setInterval(cleanupSuspiciousIPs, 60 * 60 * 1000);

/**
 * ✅ PHASE 3: Get rate limiting stats (for monitoring)
 */
const getRateLimitStats = () => {
    return {
        suspiciousIPs: suspiciousIPs.size,
        blockedIPs: blockedIPs.size,
        timestamp: new Date().toISOString()
    };
};

module.exports = {
    apiKeyRateLimit,
    loginRateLimit,
    generalRateLimit,
    createCustomRateLimit,
    productionApiKeyRateLimit,
    productionLoginRateLimit,
    adaptiveApiKeyRateLimit,
    adaptiveLoginRateLimit,
    // ✅ PHASE 3: New advanced rate limiting
    blockSuspiciousIPs,
    aiEndpointRateLimit,
    migrationRateLimit,
    getRateLimitStats,
    analyzeIPBehavior,
    // ✅ Export blocked IPs for manual management
    blockedIPs,
    suspiciousIPs
};
