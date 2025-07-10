const { body, param, query, validationResult } = require('express-validator');
const { logger } = require('./errorHandler');
const { SecurityLogger, SecurityEvents } = require('./securityLogger');

// ✅ PHASE 3: Enhanced security validators

// Custom validator for Thai text
const isThaiText = (value) => {
  const thaiRegex = /^[\u0E00-\u0E7F\s\d\w.,!?()[\]{}""''´`~@#$%^&*+=<>|\\:;/-]*$/;
  return thaiRegex.test(value);
};

// ✅ NEW: Advanced security validators
const securityValidators = {
  // Check for SQL injection patterns
  isSqlSafe: (value) => {
    if (typeof value !== 'string') return true;
    const sqlPatterns = [
      /(\b(union|select|insert|delete|drop|alter|create|exec|execute)\b)/i,
      /(--|\/\*|\*\/|;|'|")/,
      /(\bor\b\s+\d+\s*=\s*\d+|\band\b\s+\d+\s*=\s*\d+)/i
    ];
    return !sqlPatterns.some(pattern => pattern.test(value));
  },

  // Check for XSS patterns
  isXssSafe: (value) => {
    if (typeof value !== 'string') return true;
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/i,
      /vbscript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i
    ];
    return !xssPatterns.some(pattern => pattern.test(value));
  },

  // Check for path traversal
  isPathSafe: (value) => {
    if (typeof value !== 'string') return true;
    const pathPatterns = [
      /\.\./,
      /\/\//,
      /\\\\/, 
      /%2e%2e/i,
      /%252e%252e/i
    ];
    return !pathPatterns.some(pattern => pattern.test(value));
  },

  // Check for command injection
  isCommandSafe: (value) => {
    if (typeof value !== 'string') return true;
    const commandPatterns = [
      /[;&|`$(){}]/,
      /\b(cat|ls|ps|kill|rm|mv|cp|chmod|chown|su|sudo)\b/i
    ];
    return !commandPatterns.some(pattern => pattern.test(value));
  },

  // Check for suspicious file extensions
  isSafeFileExtension: (value) => {
    if (typeof value !== 'string') return true;
    const dangerousExtensions = [
      /\.(exe|bat|cmd|com|pif|scr|vbs|js|jar|app|deb|pkg|dmg)$/i,
      /\.(php|asp|jsp|cgi|pl|py|rb|sh|bash)$/i
    ];
    return !dangerousExtensions.some(pattern => pattern.test(value));
  }
};

// Validation rules for different endpoints
const validationRules = {
  // Post validation
  createPost: [
    body('titleTH')
      .notEmpty()
      .withMessage('Thai title is required')
      .isLength({ min: 3, max: 200 })
      .withMessage('Thai title must be between 3 and 200 characters')
      .custom(isThaiText)
      .withMessage('Thai title must contain valid Thai characters'),
    
    body('titleEN')
      .optional()
      .isLength({ max: 200 })
      .withMessage('English title must not exceed 200 characters'),
    
    body('excerpt')
      .notEmpty()
      .withMessage('Excerpt is required')
      .isLength({ min: 10, max: 500 })
      .withMessage('Excerpt must be between 10 and 500 characters'),
    
    body('content')
      .optional()
      .isLength({ max: 50000 })
      .withMessage('Content must not exceed 50,000 characters'),
    
    body('category')
      .optional()
      .isIn(['maintenance', 'repair', 'operation', 'troubleshooting', 'parts', 'general'])
      .withMessage('Invalid category'),
    
    body('tags')
      .optional()
      .isArray({ max: 10 })
      .withMessage('Tags must be an array with maximum 10 items'),
    
    body('tags.*')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Each tag must be between 1 and 50 characters'),
    
    body('status')
      .optional()
      .isIn(['draft', 'published', 'archived'])
      .withMessage('Status must be draft, published, or archived'),
    
    body('author')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Author name must not exceed 100 characters'),
    
    body('metaTitle')
      .optional()
      .isLength({ max: 160 })
      .withMessage('Meta title must not exceed 160 characters'),
    
    body('metaDescription')
      .optional()
      .isLength({ max: 320 })
      .withMessage('Meta description must not exceed 320 characters'),
    
    body('focusKeyword')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Focus keyword must not exceed 100 characters'),
    
    body('schemaType')
      .optional()
      .isIn(['Article', 'BlogPosting', 'HowTo', 'NewsArticle'])
      .withMessage('Invalid schema type')
  ],

  updatePost: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Post ID must be a positive integer'),
    
    // Same rules as createPost but all optional
    body('titleTH')
      .optional()
      .isLength({ min: 3, max: 200 })
      .withMessage('Thai title must be between 3 and 200 characters')
      .custom(isThaiText)
      .withMessage('Thai title must contain valid Thai characters'),
    
    body('excerpt')
      .optional()
      .isLength({ min: 10, max: 500 })
      .withMessage('Excerpt must be between 10 and 500 characters'),
    
    // ... other fields similar to createPost but optional
  ],

  getPost: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Post ID must be a positive integer')
  ],

  deletePost: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Post ID must be a positive integer')
  ],

  // AI request validation
  aiRequest: [
    body('prompt')
      .notEmpty()
      .withMessage('Prompt is required')
      .isLength({ min: 3, max: 5000 })
      .withMessage('Prompt must be between 3 and 5000 characters'),
    
    body('provider')
      .notEmpty()
      .withMessage('Provider is required')
      .isIn(['openai', 'claude', 'gemini', 'deepseek', 'chinda'])
      .withMessage('Invalid AI provider'),
    
    body('model')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Model name must not exceed 100 characters'),
    
    body('parameters')
      .optional()
      .isObject()
      .withMessage('Parameters must be an object'),
    
    body('parameters.temperature')
      .optional()
      .isFloat({ min: 0, max: 2 })
      .withMessage('Temperature must be between 0 and 2'),
    
    body('parameters.max_tokens')
      .optional()
      .isInt({ min: 1, max: 32000 })
      .withMessage('Max tokens must be between 1 and 32000')
  ],

  // Query parameter validation
  queryPosts: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('status')
      .optional()
      .isIn(['draft', 'published', 'archived'])
      .withMessage('Invalid status filter'),
    
    query('category')
      .optional()
      .isIn(['maintenance', 'repair', 'operation', 'troubleshooting', 'parts', 'general'])
      .withMessage('Invalid category filter'),
    
    query('search')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search term must be between 1 and 100 characters'),
    
    query('sortBy')
      .optional()
      .isIn(['createdAt', 'updatedAt', 'views', 'titleTH'])
      .withMessage('Invalid sort field'),
    
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc')
  ],

  // Authentication validation
  login: [
    body('email')
      .isEmail()
      .withMessage('Valid email is required')
      .normalizeEmail(),
    
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
  ],

  register: [
    body('email')
      .isEmail()
      .withMessage('Valid email is required')
      .normalizeEmail(),
    
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
    
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords do not match');
        }
        return true;
      }),
    
    body('name')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters')
  ]
};

// ✅ PHASE 3: Enhanced validation result handler with security logging
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));

    // ✅ Check for potential security violations
    const securityViolations = formattedErrors.filter(error => 
      error.message.includes('SQL') || 
      error.message.includes('XSS') || 
      error.message.includes('injection') ||
      error.message.includes('path traversal')
    );

    if (securityViolations.length > 0) {
      SecurityLogger.logIncident('medium', 'Security validation failure detected', {
        ip: req.ip,
        endpoint: req.originalUrl,
        method: req.method,
        violations: securityViolations,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id
      });
    }

    logger.warn('Validation failed', {
      url: req.originalUrl,
      method: req.method,
      errors: formattedErrors,
      ip: req.ip,
      securityViolations: securityViolations.length
    });

    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: process.env.NODE_ENV === 'development' ? formattedErrors : 'Invalid input provided',
        timestamp: new Date().toISOString(),
        requestId: req.requestId || Date.now() + '-' + Math.random().toString(36).substr(2, 9)
      }
    });
  }
  
  next();
};

// ✅ PHASE 3: Enhanced sanitization middleware with security detection
const sanitizeInput = (req, res, next) => {
  console.log('🔍 [VALIDATION] Sanitize input called for:', req.method, req.path);
  console.log('🔍 [VALIDATION] Query params:', req.query);
  console.log('🔍 [VALIDATION] Body:', req.body ? 'Present' : 'None');
  
  // Skip sanitization for GET requests without body/query params
  if (req.method === 'GET' && (!req.query || Object.keys(req.query).length === 0)) {
    console.log('🔍 [VALIDATION] Skipping sanitization for clean GET request');
    return next();
  }
  
  let suspiciousContent = [];
  
  // ✅ Enhanced sanitization with threat detection
  const sanitizeString = (str, fieldName = 'unknown') => {
    if (typeof str !== 'string') return str;
    
    const originalStr = str;
    
    // Check for security threats before sanitizing
    if (!securityValidators.isSqlSafe(str)) {
      suspiciousContent.push({ field: fieldName, threat: 'SQL_INJECTION', content: str.substring(0, 100) });
    }
    if (!securityValidators.isXssSafe(str)) {
      suspiciousContent.push({ field: fieldName, threat: 'XSS_ATTEMPT', content: str.substring(0, 100) });
    }
    if (!securityValidators.isPathSafe(str)) {
      suspiciousContent.push({ field: fieldName, threat: 'PATH_TRAVERSAL', content: str.substring(0, 100) });
    }
    if (!securityValidators.isCommandSafe(str)) {
      suspiciousContent.push({ field: fieldName, threat: 'COMMAND_INJECTION', content: str.substring(0, 100) });
    }
    
    // Remove script tags and their content
    str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove dangerous attributes
    str = str.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    str = str.replace(/\s*javascript\s*:/gi, '');
    str = str.replace(/\s*vbscript\s*:/gi, '');
    
    // Remove potentially dangerous HTML elements
    str = str.replace(/<(iframe|object|embed|applet|link|meta|base)[^>]*>/gi, '');
    
    // Remove SQL injection patterns
    str = str.replace(/(union|select|insert|delete|drop|alter|create|exec|execute)(\s+)/gi, '');
    
    // Remove path traversal patterns
    str = str.replace(/\.\.\//g, '');
    str = str.replace(/\.\.\\/g, '');
    
    return str.trim();
  };

  // ✅ Recursively sanitize object with field tracking
  const sanitizeObject = (obj, parentKey = '') => {
    if (Array.isArray(obj)) {
      return obj.map((item, index) => sanitizeObject(item, `${parentKey}[${index}]`));
    } else if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        const fieldPath = parentKey ? `${parentKey}.${key}` : key;
        sanitized[key] = sanitizeObject(value, fieldPath);
      }
      return sanitized;
    } else if (typeof obj === 'string') {
      return sanitizeString(obj, parentKey);
    }
    return obj;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body, 'body');
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query, 'query');
  }

  // ✅ Log suspicious content if found
  if (suspiciousContent.length > 0) {
    SecurityLogger.logIncident('high', 'Malicious input detected and sanitized', {
      ip: req.ip,
      endpoint: req.originalUrl,
      method: req.method,
      threats: suspiciousContent,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id
    });
  }

  next();
};

module.exports = {
  validationRules,
  handleValidationErrors,
  sanitizeInput,
  isThaiText,
  securityValidators, // ✅ PHASE 3: Export security validators
  validatePost: [
    validationRules.createPost,
    handleValidationErrors
  ],
  validateAuth: [
    validationRules.login,
    handleValidationErrors
  ]
};
