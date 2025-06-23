// Authentication Routes for RBCK CMS
// Enhanced with secure session management and brute force protection

const express = require('express');
const router = express.Router();
const { generateAdminToken, validateAdminCredentials, getActiveSessions, invalidateSession } = require('../middleware/auth');
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
              res.json({
                success: true,
                message: 'Login successful',
                data: {
                    token,
                    username: authResult.username,
                    sessionId: authResult.sessionId.substring(0, 8) + '...', // Masked session ID
                    loginTime: new Date().toISOString(),
                    expiresIn: process.env.JWT_EXPIRATION || '24h'
                }
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

module.exports = router;
