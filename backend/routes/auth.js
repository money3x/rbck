// Authentication Routes for RBCK CMS
// Handles admin login and token management

const express = require('express');
const router = express.Router();
const { generateAdminToken, validateAdminCredentials } = require('../middleware/auth');
const { loginRateLimit } = require('../middleware/rateLimiter');

/**
 * POST /api/auth/login
 * Authenticate admin user and return JWT token
 */
router.post('/login', 
    express.json(), 
    loginRateLimit, // Apply rate limiting to prevent brute force
    async (req, res) => {
        try {
            const { username, password } = req.body;
            
            // Validate input
            if (!username || !password) {
                return res.status(400).json({ 
                    error: 'Missing credentials',
                    message: 'Username and password are required'
                });
            }
            
            // Validate string types and basic format
            if (typeof username !== 'string' || typeof password !== 'string') {
                return res.status(400).json({ 
                    error: 'Invalid credential format',
                    message: 'Username and password must be strings'
                });
            }
            
            // Trim whitespace
            const trimmedUsername = username.trim();
            const trimmedPassword = password.trim();
            
            if (!trimmedUsername || !trimmedPassword) {
                return res.status(400).json({ 
                    error: 'Empty credentials',
                    message: 'Username and password cannot be empty'
                });
            }
            
            // Validate admin credentials
            const isValidCredentials = validateAdminCredentials(trimmedUsername, trimmedPassword);
            
            if (!isValidCredentials) {
                // Log failed attempt
                console.log(`🚫 Failed login attempt - Username: ${trimmedUsername}, IP: ${req.ip}, Time: ${new Date().toISOString()}`);
                
                return res.status(401).json({ 
                    error: 'Invalid credentials',
                    message: 'Username or password is incorrect'
                });
            }
            
            // Generate JWT token for successful login
            const token = generateAdminToken(trimmedUsername);
            
            // Log successful login
            console.log(`✅ Successful admin login - Username: ${trimmedUsername}, IP: ${req.ip}, Time: ${new Date().toISOString()}`);
            
            // Return token and success info
            res.json({
                success: true,
                message: 'Login successful',
                token: token,
                expiresIn: '24h',
                user: {
                    username: trimmedUsername,
                    isAdmin: true,
                    loginTime: new Date().toISOString()
                }
            });
            
        } catch (error) {
            console.error('Login error:', error);
            
            // Don't expose internal errors to client
            res.status(500).json({ 
                error: 'Internal server error',
                message: 'Unable to process login request. Please try again later.'
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
 * POST /api/auth/logout
 * Logout endpoint (client-side token removal)
 */
router.post('/logout', (req, res) => {
    // Since we're using stateless JWT, logout is handled client-side
    // This endpoint is mainly for logging purposes
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
        try {
            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log(`👋 Admin logout - Username: ${decoded.username}, IP: ${req.ip}, Time: ${new Date().toISOString()}`);
        } catch (error) {
            // Token might be expired or invalid, but still log the logout attempt
            console.log(`👋 Logout attempt with invalid token - IP: ${req.ip}, Time: ${new Date().toISOString()}`);
        }
    }
    
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

module.exports = router;
