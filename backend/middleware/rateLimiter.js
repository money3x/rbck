// Rate Limiting Middleware for RBCK API Security
// Prevents brute force attacks and API abuse

const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for sensitive API Key management endpoints
 * Very restrictive to prevent unauthorized API key access
 */
const apiKeyRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Maximum 5 requests per 15 minutes
    message: {
        error: 'Too many API key requests',
        message: 'You have exceeded the limit for API key operations. Please wait 15 minutes before trying again.',
        retryAfter: 15 * 60, // seconds
        timestamp: new Date().toISOString()
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Custom key generator for better tracking
    keyGenerator: (req) => {
        return req.ip + ':' + (req.headers['user-agent'] || 'unknown');
    },
    // Custom handler for when limit is exceeded
    handler: (req, res) => {
        console.log(`🚨 API Key rate limit exceeded for IP: ${req.ip} at ${new Date().toISOString()}`);
        res.status(429).json({
            error: 'Too many API key requests',
            message: 'You have exceeded the limit for API key operations. Please wait 15 minutes before trying again.',
            retryAfter: 15 * 60,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Rate limiter for login attempts
 * Prevents brute force attacks on admin login
 */
const loginRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Maximum 5 login attempts per 15 minutes
    message: {
        error: 'Too many login attempts',
        message: 'You have exceeded the login attempt limit. Please wait 15 minutes before trying again.',
        retryAfter: 15 * 60,
        timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip successful requests from counting against limit
    skipSuccessfulRequests: true,
    keyGenerator: (req) => {
        return req.ip + ':login';
    },
    handler: (req, res) => {
        console.log(`🚨 Login rate limit exceeded for IP: ${req.ip} at ${new Date().toISOString()}`);
        res.status(429).json({
            error: 'Too many login attempts',
            message: 'You have exceeded the login attempt limit. Please wait 15 minutes before trying again.',
            retryAfter: 15 * 60,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * General rate limiter for all API endpoints
 * Moderate protection for general API usage
 */
const generalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Maximum 100 requests per 15 minutes
    message: {
        error: 'Too many requests',
        message: 'You have exceeded the general request limit. Please slow down your requests.',
        retryAfter: 15 * 60,
        timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    // More lenient key generation for general use
    keyGenerator: (req) => {
        return req.ip;
    },
    handler: (req, res) => {
        console.log(`⚠️ General rate limit exceeded for IP: ${req.ip} at ${new Date().toISOString()}`);
        res.status(429).json({
            error: 'Too many requests',
            message: 'You have exceeded the general request limit. Please slow down your requests.',
            retryAfter: 15 * 60,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Create custom rate limiter with specified options
 * Useful for specific endpoints that need custom limits
 */
const createCustomRateLimit = (windowMs, max, identifier) => {
    return rateLimit({
        windowMs: windowMs,
        max: max,
        message: {
            error: `Too many ${identifier} requests`,
            message: `You have exceeded the limit for ${identifier} operations.`,
            retryAfter: Math.floor(windowMs / 1000),
            timestamp: new Date().toISOString()
        },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => {
            return req.ip + ':' + identifier;
        }
    });
};

module.exports = {
    apiKeyRateLimit,
    loginRateLimit,
    generalRateLimit,
    createCustomRateLimit
};
