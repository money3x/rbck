// Authentication Routes for RBCK CMS
// Enhanced with secure session management and brute force protection

const express = require('express');
const router = express.Router();
const { generateAdminToken, validateAdminCredentials, getActiveSessions, invalidateSession, authenticateAdmin } = require('../middleware/auth');
const { loginRateLimit } = require('../middleware/rateLimiter');
const { logger } = require('../middleware/errorHandler');

/**
 * POST /api/auth/login
 * Enhanced authentication with secure session management
 */
router.post('/login', 
    express.json(), 
    loginRateLimit, // Apply rate limiting to prevent brute force
    async (req, res) => {
        try {
            const { username, password } = req.body;
            const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
            
            // Validate input
            if (!username || !password) {
                logger.warn(`🚨 Login attempt with missing credentials from ${clientIp}`);
                return res.status(400).json({ 
                    success: false,
                    error: 'Missing credentials',
                    message: 'Username and password are required',
                    code: 'MISSING_CREDENTIALS'
                });
            }
            
            // Validate string types and basic format
            if (typeof username !== 'string' || typeof password !== 'string') {
                logger.warn(`🚨 Login attempt with invalid credential format from ${clientIp}`);
                return res.status(400).json({ 
                    success: false,
                    error: 'Invalid credential format',
                    message: 'Username and password must be strings',
                    code: 'INVALID_FORMAT'
                });
            }
            
            // Trim whitespace
            const trimmedUsername = username.trim();
            const trimmedPassword = password.trim();
            
            if (!trimmedUsername || !trimmedPassword) {
                logger.warn(`🚨 Login attempt with empty credentials from ${clientIp}`);
                return res.status(400).json({ 
                    success: false,
                    error: 'Empty credentials',
                    message: 'Username and password cannot be empty',
                    code: 'EMPTY_CREDENTIALS'
                });
            }
            
            // Validate admin credentials with enhanced security
            const authResult = validateAdminCredentials(trimmedUsername, trimmedPassword, clientIp);
            
            if (!authResult.valid) {
                if (authResult.blocked) {
                    return res.status(429).json({
                        success: false,
                        error: 'Too many failed attempts',
                        message: authResult.error,
                        code: 'ACCOUNT_LOCKED'
                    });
                }
                
                return res.status(401).json({
                    success: false,
                    error: 'Authentication failed',
                    message: authResult.error,
                    code: 'INVALID_CREDENTIALS'
                });
            }
            
            // Generate JWT token with session information
            const token = generateAdminToken(authResult.username, authResult.sessionId, authResult.userId);
            
            logger.info(`✅ Successful admin login: ${authResult.username} from ${clientIp}`);
            
            // ✅ Response format matching login.html expectations
            res.json({
                success: true,
                message: 'Login successful',
                token: token, // ✅ Direct token field (login.html expects data.token)
                user: {
                    id: authResult.userId,
                    username: authResult.username,
                    isAdmin: true,
                    loginTime: new Date().toISOString()
                },
                sessionId: authResult.sessionId.substring(0, 8) + '...', // Masked session ID
                expiresIn: process.env.JWT_EXPIRATION || '24h'
            });
            
        } catch (error) {
            logger.error('Login error:', error);
            
            // Don't expose internal errors to client
            res.status(500).json({ 
                success: false,
                error: 'Internal server error',
                message: 'Unable to process login request. Please try again later.',
                code: 'SERVER_ERROR'
            });
        }
    }
);

/**
 * POST /api/auth/verify
 * Verify if current token is still valid
 */
router.post('/verify', 
    express.json(),
    (req, res) => {
        try {
            const authHeader = req.headers.authorization;
            const token = authHeader && authHeader.split(' ')[1];
            
            if (!token) {
                return res.status(401).json({ 
                    error: 'No token provided',
                    message: 'Authorization token is required'
                });
            }
            
            // Verify token
            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            if (!decoded.isAdmin) {
                return res.status(403).json({ 
                    error: 'Invalid token',
                    message: 'Token does not have admin privileges'
                });
            }
            
            res.json({
                valid: true,
                user: {
                    username: decoded.username,
                    isAdmin: decoded.isAdmin,
                    loginTime: decoded.loginTime
                },
                expiresAt: new Date(decoded.exp * 1000).toISOString()
            });
            
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    error: 'Token expired',
                    message: 'Please login again'
                });
            } else if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ 
                    error: 'Invalid token',
                    message: 'Token is malformed'
                });
            } else {
                console.error('Token verification error:', error);
                return res.status(500).json({ 
                    error: 'Verification failed',
                    message: 'Unable to verify token'
                });
            }
        }
    }
);

/**
 * GET /api/auth/sessions
 * Get all active sessions (admin only)
 */
router.get('/sessions',
    require('../middleware/auth').authenticateAdmin,
    (req, res) => {
        try {
            const sessions = getActiveSessions();
            
            logger.info(`Admin ${req.user.username} requested active sessions list`);
            
            res.json({
                success: true,
                data: {
                    sessions,
                    total: sessions.length,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            logger.error('Sessions listing error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve sessions',
                code: 'SERVER_ERROR'
            });
        }
    }
);

/**
 * DELETE /api/auth/sessions/:sessionId
 * Invalidate a specific session (admin only)
 */
router.delete('/sessions/:sessionId',
    require('../middleware/auth').authenticateAdmin,
    (req, res) => {
        try {
            const { sessionId } = req.params;
            
            if (!sessionId) {
                return res.status(400).json({
                    success: false,
                    error: 'Session ID required',
                    code: 'MISSING_SESSION_ID'
                });
            }
            
            invalidateSession(sessionId);
            
            logger.info(`Admin ${req.user.username} invalidated session ${sessionId.substring(0, 8)}...`);
            
            res.json({
                success: true,
                message: 'Session invalidated successfully',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error('Session invalidation error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to invalidate session',
                code: 'SERVER_ERROR'
            });
        }
    }
);

/**
 * POST /api/auth/logout
 * Logout and invalidate current session
 */
router.post('/logout',
    require('../middleware/auth').authenticateAdmin,
    (req, res) => {
        try {
            const sessionId = req.user.sessionId;
            
            if (sessionId) {
                invalidateSession(sessionId);
                logger.info(`User ${req.user.username} logged out and session invalidated`);
            }
            
            res.json({
                success: true,
                message: 'Logout successful',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error('Logout error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to logout',
                code: 'SERVER_ERROR'
            });
        }
    }
);

/**
 * ✅ PRODUCTION: GET /api/auth/verify-session  
 * Check if authentication is properly configured (no token required)
 */
router.get('/verify-session', (req, res) => {
    try {
        // ✅ For migration check - just verify backend is configured
        if (!process.env.JWT_SECRET) {
            return res.status(400).json({
                success: false,
                authenticated: false,
                error: 'JWT_SECRET not configured in backend',
                code: 'MISSING_JWT_SECRET'
            });
        }

        if (!process.env.ENCRYPTION_KEY) {
            return res.status(400).json({
                success: false,
                authenticated: false,
                error: 'ENCRYPTION_KEY not configured in backend',
                code: 'MISSING_ENCRYPTION_KEY'
            });
        }

        // ✅ Backend is properly configured
        console.log('✅ [AUTH] Session verification endpoint - backend configured');
        
        res.json({
            success: true,
            authenticated: true,
            backendConfigured: true,
            hasJWTSecret: !!process.env.JWT_SECRET,
            hasEncryptionKey: !!process.env.ENCRYPTION_KEY,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ [AUTH] Session verification error:', error);
        res.status(500).json({
            success: false,
            authenticated: false,
            error: 'Session verification failed',
            code: 'SERVER_ERROR'
        });
    }
});

/**
 * ✅ PRODUCTION: POST /api/auth/verify-token
 * Verify JWT token with ENCRYPTION_KEY validation (requires token)
 */
router.post('/verify-token', (req, res) => {
    try {
        // Get token from Authorization header or body
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1] || req.body.token;
        
        if (!token) {
            return res.status(401).json({
                success: false,
                authenticated: false,
                error: 'No authentication token provided',
                code: 'NO_TOKEN'
            });
        }
        
        // Verify JWT token
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // ✅ Check ENCRYPTION_KEY if provided
        if (process.env.ENCRYPTION_KEY && decoded.encryptionKey !== process.env.ENCRYPTION_KEY) {
            logger.warn('Authentication failed: Invalid ENCRYPTION_KEY');
            return res.status(401).json({
                success: false,
                authenticated: false,
                error: 'Invalid encryption key',
                code: 'INVALID_ENCRYPTION_KEY'
            });
        }
        
        // ✅ Verify admin privileges
        if (!decoded.isAdmin) {
            return res.status(403).json({
                success: false,
                authenticated: false,
                error: 'Admin privileges required',
                code: 'INSUFFICIENT_PRIVILEGES'
            });
        }
        
        logger.info(`✅ Session verified for user: ${decoded.username}`);
        
        res.json({
            success: true,
            authenticated: true,
            user: {
                id: decoded.id,
                username: decoded.username,
                isAdmin: decoded.isAdmin,
                loginTime: decoded.loginTime,
                encryptionVerified: true
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            logger.warn('Authentication failed: Token expired');
            return res.status(401).json({
                success: false,
                authenticated: false,
                error: 'Authentication token has expired',
                code: 'TOKEN_EXPIRED'
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            logger.warn('Authentication failed: Invalid token');
            return res.status(401).json({
                success: false,
                authenticated: false,
                error: 'Invalid authentication token',
                code: 'INVALID_TOKEN'
            });
        }
        
        logger.error('Session verification error:', error);
        res.status(401).json({
            success: false,
            authenticated: false,
            error: 'Session verification failed',
            code: 'SESSION_INVALID'
        });
    }
});

/**
 * ✅ PRODUCTION: POST /api/auth/logout
 * Server-side logout with session destruction
 */
router.post('/logout', (req, res) => {
    try {
        // Clear HTTP-only cookie if using cookies
        res.clearCookie('authToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
        
        // Clear session if using session store
        if (req.session) {
            req.session.destroy((err) => {
                if (err) {
                    logger.error('Session destruction error:', err);
                }
            });
        }
        
        logger.info('User logged out successfully');
        
        res.json({
            success: true,
            message: 'Logged out successfully',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        logger.error('Logout error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to logout',
            code: 'SERVER_ERROR'
        });
    }
});

/**
 * ✅ PRODUCTION: GET /api/auth/get-jwt-token
 * Get fresh JWT token for ConfigManager
 */
router.get('/get-jwt-token', (req, res) => {
    console.log('🔑 [AUTH] JWT token endpoint accessed from:', req.ip);
    console.log('🔑 [AUTH] Request headers:', req.headers);
    console.log('🔑 [AUTH] Request path:', req.path);
    
    try {
        // ✅ ตรวจสอบว่ามี JWT_SECRET ใน environment (หรือชื่ออื่น)
        const jwtSecret = process.env.JWT_SECRET || process.env.JWT_TOKEN;
        
        if (!jwtSecret) {
            logger.error('❌ JWT_SECRET/JWT_TOKEN not configured in environment');
            console.log('Available env vars:', Object.keys(process.env).filter(key => key.includes('JWT')));
            return res.status(500).json({
                success: false,
                error: 'JWT configuration missing',
                code: 'MISSING_JWT_SECRET'
            });
        }

        // ✅ สร้าง JWT token สำหรับระบบ
        const jwt = require('jsonwebtoken');
        const payload = {
            isAdmin: true,
            username: 'system',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
            encryptionKey: process.env.ENCRYPTION_KEY || 'default-key'
        };

        const token = jwt.sign(payload, jwtSecret);
        
        logger.info('✅ Fresh JWT token generated for ConfigManager');
        
        res.json({
            success: true,
            jwtToken: token,
            expiresIn: '24h',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        logger.error('❌ JWT token generation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate JWT token',
            code: 'TOKEN_GENERATION_FAILED'
        });
    }
});

/**
 * ✅ PRODUCTION: GET /api/auth/get-encryption-key  
 * Get ENCRYPTION_KEY for frontend configuration
 */
router.get('/get-encryption-key', (req, res) => {
    try {
        // ✅ ตรวจสอบว่ามี ENCRYPTION_KEY
        if (!process.env.ENCRYPTION_KEY) {
            logger.error('❌ ENCRYPTION_KEY not configured in environment');
            return res.status(500).json({
                success: false,
                error: 'Encryption key not configured',
                code: 'MISSING_ENCRYPTION_KEY'
            });
        }

        logger.info('✅ Encryption key provided to frontend');
        
        res.json({
            success: true,
            encryptionKey: process.env.ENCRYPTION_KEY,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        logger.error('❌ Encryption key retrieval error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get encryption key',
            code: 'ENCRYPTION_KEY_FAILED'
        });
    }
});


module.exports = router;
