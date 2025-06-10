// Development Rate Limiting Middleware for RBCK API
// More lenient limits for development and testing

const rateLimit = require('express-rate-limit');

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

module.exports = {
    apiKeyRateLimit,
    loginRateLimit,
    generalRateLimit,
    createCustomRateLimit
};
