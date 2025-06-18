const { body, param, query, validationResult } = require('express-validator');
const { logger } = require('./errorHandler');

// Custom validator for Thai text
const isThaiText = (value) => {
  const thaiRegex = /^[\u0E00-\u0E7F\s\d\w.,!?()[\]{}""''´`~@#$%^&*+=<>|\\:;/-]*$/;
  return thaiRegex.test(value);
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

// Validation result handler middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));

    logger.warn('Validation failed', {
      url: req.originalUrl,
      method: req.method,
      errors: formattedErrors,
      body: req.body,
      ip: req.ip
    });

    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: formattedErrors,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      }
    });
  }
  
  next();
};

// Sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Remove any potentially dangerous HTML tags from string fields
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    // Remove script tags and their content
    str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove dangerous attributes
    str = str.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    str = str.replace(/\s*javascript\s*:/gi, '');
    
    return str.trim();
  };

  // Recursively sanitize object
  const sanitizeObject = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    } else if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    } else if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    return obj;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

module.exports = {
  validationRules,
  handleValidationErrors,
  sanitizeInput,
  isThaiText,
  validatePost: [
    validationRules.createPost,
    handleValidationErrors
  ],
  validateAuth: [
    validationRules.login,
    handleValidationErrors
  ]
};
