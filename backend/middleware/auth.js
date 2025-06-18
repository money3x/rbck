// JWT Authentication Middleware for RBCK API Security
// Protects sensitive endpoints from unauthorized access

const jwt = require('jsonwebtoken');
const { db } = require('../supabaseClient');

/**
 * Authentication middleware to verify JWT tokens
 * Checks if user has valid admin token before accessing protected routes
 */
const authenticateAdmin = async (req, res, next) => {
    try {
        // Extract token from Authorization header (Bearer token)
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                error: 'Access token required',
                message: 'Please provide authorization token in header'
            });
        }
        
        // Check if JWT_SECRET is configured
        if (!process.env.JWT_SECRET) {
            console.error('❌ JWT_SECRET not configured in environment variables');
            return res.status(500).json({
                success: false,
                error: 'Server configuration error',
                message: 'Authentication service not properly configured'
            });
        }
        
        // Verify token using JWT_SECRET
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Validate user exists in database
        try {
            const { data: user, error } = await db.users.findById(decoded.userId || decoded.id);
            
            if (error || !user) {
                return res.status(401).json({
                    success: false,
                    error: 'User not found',
                    message: 'Token is valid but user no longer exists'
                });
            }
            
            // Check if user is active
            if (!user.is_active) {
                return res.status(403).json({
                    success: false,
                    error: 'Account deactivated',
                    message: 'User account has been deactivated'
                });
            }
            
            // Check if user has admin privileges
            if (!user.is_admin && !decoded.isAdmin) {
                return res.status(403).json({ 
                    success: false,
                    error: 'Admin access required',
                    message: 'Only admin users can access this resource'
                });
            }
            
            // Token is valid, add user info to request object
            req.user = {
                id: user.id,
                username: user.username,
                email: user.email,
                isAdmin: user.is_admin,
                fullName: user.full_name,
                loginTime: new Date(decoded.iat * 1000) // Convert timestamp
            };
            
            // Update last login time
            await db.users.update(user.id, { 
                last_login: new Date().toISOString() 
            });
            
            // Log admin action for security audit
            console.log(`🔐 Admin access granted: ${user.username} (${user.email}) at ${new Date().toISOString()}`);
            
            next();
        } catch (dbError) {
            console.error('Database error during authentication:', dbError);
            // Continue with token-based auth if database is unavailable
            req.user = {
                id: decoded.userId || decoded.id,
                username: decoded.username,
                isAdmin: decoded.isAdmin || false,
                loginTime: new Date(decoded.iat * 1000)
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

module.exports = {
    authenticateAdmin,
    optionalAuth,
    userRateLimit,
    validateApiKey
};

/**
 * Generate JWT token for authenticated admin
 * Used after successful login verification
 */
const generateAdminToken = (username) => {
    try {
        const payload = {
            username: username,
            isAdmin: true,
            loginTime: new Date().toISOString(),
            // Add timestamp for additional security
            iat: Math.floor(Date.now() / 1000)
        };
        
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { 
                expiresIn: '24h',
                issuer: 'rbck-cms',
                subject: username
            }
        );
        
        console.log(`🎫 JWT token generated for admin: ${username}`);
        return token;
    } catch (error) {
        console.error('Token generation error:', error);
        throw new Error('Failed to generate authentication token');
    }
};

/**
 * Validate admin credentials against environment variables
 * Used in login endpoint
 */
const validateAdminCredentials = (username, password) => {
    const validUsername = process.env.ADMIN_USERNAME;
    const validPassword = process.env.ADMIN_PASSWORD;
    
    if (!validUsername || !validPassword) {
        console.error('❌ Admin credentials not configured in environment variables');
        return false;
    }
    
    // Simple credential check (in production, use bcrypt for password hashing)
    const isValid = username === validUsername && password === validPassword;
    
    if (isValid) {
        console.log(`✅ Admin credentials validated: ${username}`);
    } else {
        console.log(`❌ Invalid login attempt for username: ${username}`);
    }
    
    return isValid;
};

module.exports = {
    authenticateAdmin,
    generateAdminToken,
    validateAdminCredentials
};