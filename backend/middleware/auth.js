// JWT Authentication Middleware for RBCK API Security
// Protects sensitive endpoints from unauthorized access
// Enhanced with secure session management and audit logging

const jwt = require('jsonwebtoken');
const { db } = require('../supabaseClient');
const { logger } = require('./errorHandler');
const securityService = require('../services/SecurityService');
const { SecurityLogger, SecurityEvents } = require('./securityLogger');

/**
 * Enhanced authentication middleware with secure session management
 * Protects sensitive endpoints with JWT tokens and session validation
 */
const authenticateAdmin = async (req, res, next) => {
    try {
        const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
        
        // Extract token from Authorization header (Bearer token)
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        
        if (!token) {
            SecurityLogger.logAuth(SecurityEvents.LOGIN_FAILURE, {
                reason: 'no_token',
                clientIp,
                endpoint: req.path,
                userAgent: req.get('User-Agent')
            });
            return res.status(401).json({ 
                success: false,
                error: 'Access token required',
                code: 'TOKEN_MISSING'
            });
        }
        
        // Check if JWT_SECRET is configured
        if (!process.env.JWT_SECRET) {
            // ✅ SECURITY FIX: Don't expose configuration details in logs
            logger.error('Authentication configuration error', { component: 'auth', level: 'critical' });
            return res.status(500).json({
                success: false,
                error: 'Authentication service unavailable',
                code: 'AUTH_SERVICE_ERROR'
            });
        }
        
        // Verify token using JWT_SECRET
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtError) {
            logger.warn(`🚨 Invalid token from ${clientIp}: ${jwtError.message}`);
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired token',
                code: 'TOKEN_INVALID'
            });
        }
        
        // ✅ SECURITY FIX: Enforce session validation for admin operations
        const requiresSession = req.path.includes('/admin/') || 
                               req.method !== 'GET' || 
                               req.path.includes('/migration') ||
                               req.path.includes('/configure');
                               
        if (requiresSession && !decoded.sessionId) {
            logger.warn('Session required for admin operation', { 
                userId: decoded.userId || decoded.id,
                clientIp: clientIp,
                endpoint: req.path,
                method: req.method,
                timestamp: new Date().toISOString()
            });
            return res.status(401).json({
                success: false,
                error: 'Session required for this operation',
                code: 'SESSION_REQUIRED'
            });
        }
        
        // Validate the session if sessionId is present
        if (decoded.sessionId) {
            const userAgent = req.get('User-Agent');
            const session = securityService.validateSession(decoded.sessionId, clientIp, userAgent);
            if (!session) {
                logger.warn('Invalid session attempt', { 
                    sessionId: decoded.sessionId,
                    clientIp: clientIp,
                    endpoint: req.path,
                    timestamp: new Date().toISOString()
                });
                return res.status(401).json({
                    success: false,
                    error: 'Session invalid or expired',
                    code: 'SESSION_INVALID'
                });
            }
        }
        
        // In test environment, skip database check and use token-based auth
        if (process.env.NODE_ENV === 'test') {
            req.user = {
                id: decoded.userId || decoded.id,
                username: decoded.username || 'test-user',
                isAdmin: decoded.isAdmin !== false,
                loginTime: new Date(decoded.iat * 1000),
                sessionId: decoded.sessionId
            };
            return next();
        }
        
        // Validate user exists in database (production mode)
        try {
            const { data: user, error } = await db.users.findById(decoded.userId || decoded.id);
            
            if (error || !user) {
                // ✅ SECURITY FIX: NO FALLBACK - Reject authentication
                // Database user lookup failed - don't trust token data
                logger.warn('Database user lookup failed', { 
                    userId: decoded.userId || decoded.id,
                    sessionId: decoded.sessionId,
                    timestamp: new Date().toISOString(),
                    clientIp: clientIp
                });
                
                return res.status(401).json({
                    success: false,
                    error: 'Authentication verification failed',
                    code: 'AUTH_VERIFICATION_FAILED'
                });
            }
            
            // Check if user is active
            if (!user.is_active) {
                logger.warn(`🚨 Deactivated user ${user.username} attempted access from ${clientIp}`);
                return res.status(403).json({
                    success: false,
                    error: 'Account deactivated',
                    code: 'ACCOUNT_DEACTIVATED'
                });
            }
            
            // ✅ SECURITY FIX: Check admin privileges from DATABASE only
            if (!user.is_admin) {
                logger.warn('Non-admin access attempt', { 
                    userId: user.id,
                    clientIp: clientIp,
                    endpoint: req.path,
                    timestamp: new Date().toISOString()
                });
                return res.status(403).json({ 
                    success: false,
                    error: 'Administrator privileges required',
                    code: 'ADMIN_REQUIRED'
                });
            }
            
            // ✅ SECURITY FIX: Set user data from DATABASE only
            req.user = {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role || 'admin', // Add role field
                isAdmin: user.is_admin, // From database, not token!
                fullName: user.full_name,
                loginTime: new Date(decoded.iat * 1000),
                sessionId: decoded.sessionId,
                lastLogin: user.last_login_at
            };
            
            SecurityLogger.logAuth(SecurityEvents.LOGIN_SUCCESS, {
                userId: user.id,
                username: user.username,
                clientIp,
                endpoint: req.path,
                sessionId: decoded.sessionId
            });
            next();
            
        } catch (dbError) {
            logger.error('Database error during authentication', { 
                error: dbError.message,
                userId: decoded.userId || decoded.id,
                sessionId: decoded.sessionId,
                clientIp: clientIp,
                timestamp: new Date().toISOString()
            });
            
            // ✅ SECURITY FIX: NO FALLBACK on database errors
            // If database is unavailable, reject authentication
            return res.status(503).json({
                success: false,
                error: 'Authentication service temporarily unavailable',
                code: 'AUTH_SERVICE_UNAVAILABLE'
            });
        }
        
    } catch (error) {
        // Handle different JWT errors
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                error: 'Token expired',
                message: 'Please login again',
                expiredAt: error.expiredAt
            });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false,
                error: 'Invalid token',
                message: 'Token is malformed or invalid'
            });
        } else if (error.name === 'NotBeforeError') {
            return res.status(401).json({
                success: false,
                error: 'Token not active',
                message: 'Token is not active yet'
            });
        } else {
            console.error('Authentication error:', error);
            return res.status(500).json({
                success: false,
                error: 'Authentication failed',
                message: 'Internal authentication error'
            });
        }
    }
};

/**
 * ✅ NEW: Admin-only middleware for critical operations
 * Ensures only verified admin users can access sensitive endpoints
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        logger.warn('Unauthenticated admin access attempt', {
            clientIp: req.ip || req.connection.remoteAddress,
            endpoint: req.path,
            timestamp: new Date().toISOString()
        });
        
        return res.status(401).json({
            success: false,
            error: 'Authentication required',
            code: 'AUTH_REQUIRED'
        });
    }
    
    if (req.user.role !== 'admin' || !req.user.isAdmin) {
        logger.warn('Non-admin attempted admin action', {
            userId: req.user.id,
            username: req.user.username,
            role: req.user.role,
            endpoint: req.path,
            clientIp: req.ip || req.connection.remoteAddress,
            timestamp: new Date().toISOString()
        });
        
        return res.status(403).json({
            success: false,
            error: 'Administrator privileges required',
            code: 'ADMIN_REQUIRED'
        });
    }
    
    next();
};

/**
 * Optional authentication middleware
 * Adds user info if token is present, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            req.user = null;
            return next();
        }
        
        if (!process.env.JWT_SECRET) {
            req.user = null;
            return next();
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Try to get user from database
        try {
            const { data: user, error } = await db.users.findById(decoded.userId || decoded.id);
            
            if (!error && user && user.is_active) {
                req.user = {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    isAdmin: user.is_admin,
                    fullName: user.full_name
                };
            } else {
                req.user = null;
            }
        } catch (dbError) {
            req.user = null;
        }
        
    } catch (error) {
        req.user = null;
    }
    
    next();
};

/**
 * Rate limiting per user
 */
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    const userRequestCounts = new Map();
    
    return (req, res, next) => {
        const userId = req.user?.id || req.ip;
        const now = Date.now();
        
        if (!userRequestCounts.has(userId)) {
            userRequestCounts.set(userId, { count: 1, resetTime: now + windowMs });
            return next();
        }
        
        const userCount = userRequestCounts.get(userId);
        
        if (now > userCount.resetTime) {
            userCount.count = 1;
            userCount.resetTime = now + windowMs;
            return next();
        }
        
        if (userCount.count >= maxRequests) {
            return res.status(429).json({
                success: false,
                error: 'Rate limit exceeded',
                message: `Too many requests. Limit: ${maxRequests} per ${windowMs / 1000} seconds`,
                retryAfter: Math.ceil((userCount.resetTime - now) / 1000)
            });
        }
        
        userCount.count++;
        next();
    };
};

/**
 * API key validation middleware
 */
const validateApiKey = (requiredProvider = null) => {
    return (req, res, next) => {
        const { provider } = req.body || req.params;
        
        if (requiredProvider && provider !== requiredProvider) {
            return res.status(400).json({
                success: false,
                error: 'Invalid provider',
                message: `This endpoint requires ${requiredProvider} provider`
            });
        }
        
        // Check if API key exists for the provider
        const apiKeyVar = `${provider?.toUpperCase()}_API_KEY`;
        if (!process.env[apiKeyVar]) {
            return res.status(503).json({
                success: false,
                error: 'Service unavailable',
                message: `${provider} API key not configured`
            });
        }
          next();
    };
};

/**
 * Generate JWT token for authenticated admin with session management
 * @param {string} username - Admin username
 * @param {string} sessionId - Secure session ID
 * @param {string} userId - User ID
 * @returns {string} - JWT token
 */
const generateAdminToken = (username, sessionId, userId) => {
    try {
        const payload = {
            username: username,
            userId: userId,
            sessionId: sessionId,
            isAdmin: true,
            loginTime: new Date().toISOString(),
            iat: Math.floor(Date.now() / 1000)
        };
        
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { 
                expiresIn: process.env.JWT_EXPIRATION || '24h',
                issuer: 'rbck-cms',
                audience: 'rbck-admin'
            }
        );
        
        logger.info(`🔐 JWT token generated for admin: ${username}`);
        return token;
    } catch (error) {
        logger.error('JWT token generation failed:', error);
        throw new Error('Failed to generate authentication token');
    }
};

/**
 * Enhanced admin credentials validation with security features
 * @param {string} username - Username to validate
 * @param {string} password - Password to validate
 * @param {string} clientIp - Client IP address for audit logging
 * @returns {object} - Validation result with session info
 */
const validateAdminCredentials = (username, password, clientIp = 'unknown') => {
    return securityService.validateAdminCredentials(username, password, clientIp);
};

/**
 * Get all active sessions (for admin monitoring)
 */
function getActiveSessions() {
    return securityService.getActiveSessions();
}

/**
 * Invalidate a session
 */
function invalidateSession(sessionId) {
    return securityService.invalidateSession(sessionId);
}

// Single consolidated export
module.exports = {
    authenticateAdmin,
    requireAdmin, // ✅ NEW: Admin-only middleware
    optionalAuth,
    validateApiKey,
    generateAdminToken,
    validateAdminCredentials,
    // Session management exports  
    invalidateSession,
    getActiveSessions
};