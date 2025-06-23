// JWT Authentication Middleware for RBCK API Security
// Protects sensitive endpoints from unauthorized access
// Enhanced with secure session management and audit logging

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { db } = require('../supabaseClient');
const { logger } = require('./errorHandler');

// In-memory session store for production security
// In a distributed system, use Redis or database
const activeSessions = new Map();
const failedAttempts = new Map();

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
            logger.warn(`🚨 Unauthorized access attempt from ${clientIp} - No token provided`);
            return res.status(401).json({ 
                success: false,
                error: 'Access token required',
                code: 'TOKEN_MISSING'
            });
        }
        
        // Check if JWT_SECRET is configured
        if (!process.env.JWT_SECRET) {
            logger.error('❌ JWT_SECRET not configured in environment variables');
            return res.status(500).json({
                success: false,
                error: 'Server configuration error',
                code: 'SERVER_CONFIG_ERROR'
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
        
        // Validate session if sessionId is present
        if (decoded.sessionId) {
            const session = validateSession(decoded.sessionId, clientIp);
            if (!session) {
                logger.warn(`🚨 Invalid session ${decoded.sessionId} from ${clientIp}`);
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
                // Fallback to token-based auth if database is unavailable
                logger.warn(`Database user lookup failed for ${decoded.username}, using token fallback`);
                req.user = {
                    id: decoded.userId || decoded.id,
                    username: decoded.username,
                    isAdmin: decoded.isAdmin || false,
                    loginTime: new Date(decoded.iat * 1000),
                    sessionId: decoded.sessionId
                };
                return next();
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
            
            // Check if user has admin privileges
            if (!user.is_admin && !decoded.isAdmin) {
                logger.warn(`🚨 Non-admin user ${user.username} attempted admin access from ${clientIp}`);
                return res.status(403).json({ 
                    success: false,
                    error: 'Admin access required',
                    code: 'INSUFFICIENT_PRIVILEGES'
                });
            }
            
            // Token is valid, add user info to request object
            req.user = {
                id: user.id,
                username: user.username,
                email: user.email,
                isAdmin: user.is_admin,
                fullName: user.full_name,
                loginTime: new Date(decoded.iat * 1000),
                sessionId: decoded.sessionId
            };
            
            logger.debug(`✅ User ${user.username} authenticated successfully from ${clientIp}`);
            next();
            
        } catch (dbError) {
            logger.error('Database error during authentication:', dbError);
            // Continue with token-based auth if database is unavailable
            req.user = {
                id: decoded.userId || decoded.id,
                username: decoded.username,
                isAdmin: decoded.isAdmin || false,
                loginTime: new Date(decoded.iat * 1000),
                sessionId: decoded.sessionId
            };
            next();
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
    const validUsername = process.env.ADMIN_USERNAME;
    const validPassword = process.env.ADMIN_PASSWORD;
    
    if (!validUsername || !validPassword) {
        logger.error('❌ Admin credentials not configured in environment variables');
        return { valid: false, error: 'Server configuration error' };
    }
    
    // Check for brute force attempts
    if (isBlocked(clientIp, username)) {
        logger.warn(`🚨 Login blocked for ${username} from ${clientIp} due to too many failed attempts`);
        return { 
            valid: false, 
            error: 'Account temporarily locked due to failed attempts',
            blocked: true 
        };
    }
    
    // Validate credentials with constant-time comparison for security
    const usernameValid = crypto.timingSafeEqual(
        Buffer.from(username), 
        Buffer.from(validUsername)
    );
    const passwordValid = crypto.timingSafeEqual(
        Buffer.from(password), 
        Buffer.from(validPassword)
    );
    
    const isValid = usernameValid && passwordValid;
    
    if (isValid) {
        // Clear any previous failed attempts
        clearFailedAttempts(clientIp, username);
        
        // Generate secure session
        const sessionId = generateSessionId();
        const userId = 'admin-' + crypto.randomBytes(8).toString('hex');
        
        // Store session
        storeSession(sessionId, userId, username, clientIp);
        
        logger.info(`✅ Admin credentials validated for ${username} from ${clientIp}`);
        return { 
            valid: true, 
            sessionId, 
            userId,
            username 
        };
    } else {
        // Track failed attempt
        trackFailedAttempt(clientIp, username);
        logger.warn(`❌ Invalid login attempt for username: ${username} from ${clientIp}`);
        return { 
            valid: false, 
            error: 'Invalid username or password' 
        };
    }
};

/**
 * Generate a secure session ID
 */
function generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Track failed login attempts for brute force protection
 */
function trackFailedAttempt(ip, username) {
    const key = `${ip}-${username}`;
    const current = failedAttempts.get(key) || { count: 0, lastAttempt: null };
    
    current.count += 1;
    current.lastAttempt = new Date();
    
    failedAttempts.set(key, current);
    
    // Auto-cleanup after 1 hour
    setTimeout(() => {
        failedAttempts.delete(key);
    }, 3600000);
    
    logger.warn(`🚨 Failed login attempt #${current.count} from ${ip} for user ${username}`);
}

/**
 * Check if IP/username combination is blocked due to failed attempts
 */
function isBlocked(ip, username) {
    const key = `${ip}-${username}`;
    const attempts = failedAttempts.get(key);
    
    if (!attempts) return false;
    
    // Block after 5 failed attempts
    if (attempts.count >= 5) {
        const timeSinceLastAttempt = Date.now() - attempts.lastAttempt.getTime();
        // Block for 30 minutes
        return timeSinceLastAttempt < 1800000;
    }
    
    return false;
}

/**
 * Clear failed attempts on successful login
 */
function clearFailedAttempts(ip, username) {
    const key = `${ip}-${username}`;
    failedAttempts.delete(key);
}

/**
 * Store active session securely
 */
function storeSession(sessionId, userId, username, ipAddress) {
    activeSessions.set(sessionId, {
        userId,
        username,
        ipAddress,
        createdAt: new Date(),
        lastActivity: new Date(),
        isActive: true
    });
    
    logger.info(`✅ New session created for user ${username} from ${ipAddress}`);
}

/**
 * Validate and refresh session
 */
function validateSession(sessionId, ipAddress) {
    const session = activeSessions.get(sessionId);
    
    if (!session || !session.isActive) {
        return null;
    }
    
    // Check IP address consistency (optional security measure)
    if (process.env.ENFORCE_IP_CONSISTENCY === 'true' && session.ipAddress !== ipAddress) {
        logger.warn(`🚨 Session ${sessionId} IP mismatch: ${session.ipAddress} vs ${ipAddress}`);
        invalidateSession(sessionId);
        return null;
    }
    
    // Check session timeout (24 hours)
    const sessionAge = Date.now() - session.createdAt.getTime();
    if (sessionAge > 86400000) { // 24 hours
        logger.info(`⏰ Session ${sessionId} expired for user ${session.username}`);
        invalidateSession(sessionId);
        return null;
    }
    
    // Update last activity
    session.lastActivity = new Date();
    
    return session;
}

/**
 * Invalidate a session
 */
function invalidateSession(sessionId) {
    const session = activeSessions.get(sessionId);
    if (session) {
        session.isActive = false;
        activeSessions.delete(sessionId);
        logger.info(`🔐 Session invalidated for user ${session.username}`);
    }
}

/**
 * Get all active sessions (for admin monitoring)
 */
function getActiveSessions() {
    const sessions = [];
    for (const [sessionId, session] of activeSessions.entries()) {
        if (session.isActive) {
            sessions.push({
                sessionId: sessionId.substring(0, 8) + '...',
                username: session.username,
                ipAddress: session.ipAddress,
                createdAt: session.createdAt,
                lastActivity: session.lastActivity
            });
        }
    }
    return sessions;
}

// Single consolidated export
module.exports = {
    authenticateAdmin,
    optionalAuth,
    validateApiKey,
    generateAdminToken,
    validateAdminCredentials,
    // Session management exports
    generateSessionId,
    storeSession,
    validateSession,
    invalidateSession,
    getActiveSessions,
    // Security monitoring exports
    trackFailedAttempt,
    isBlocked,
    clearFailedAttempts
};