// JWT Authentication Middleware for RBCK API Security
// Protects sensitive endpoints from unauthorized access

const jwt = require('jsonwebtoken');

/**
 * Authentication middleware to verify JWT tokens
 * Checks if user has valid admin token before accessing protected routes
 */
const authenticateAdmin = (req, res, next) => {
    try {
        // Extract token from Authorization header (Bearer token)
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        
        if (!token) {
            return res.status(401).json({ 
                error: 'Access token required',
                message: 'Please provide authorization token in header'
            });
        }
        
        // Verify token using JWT_SECRET
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if user has admin privileges
        if (!decoded.isAdmin) {
            return res.status(403).json({ 
                error: 'Admin access required',
                message: 'Only admin users can access this resource'
            });
        }
        
        // Token is valid, add user info to request object
        req.user = decoded;
        req.user.loginTime = new Date(decoded.iat * 1000); // Convert timestamp
        
        // Log admin action for security audit
        console.log(`🔐 Admin access granted: ${decoded.username} at ${new Date().toISOString()}`);
        
        next();
    } catch (error) {
        // Handle different JWT errors
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                error: 'Token expired',
                message: 'Please login again'
            });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                error: 'Invalid token',
                message: 'Token is malformed or corrupted'
            });
        } else {
            console.error('JWT verification error:', error.message);
            return res.status(401).json({ 
                error: 'Authentication failed',
                message: 'Unable to verify token'
            });
        }
    }
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