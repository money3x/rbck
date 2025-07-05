/**
 * ✅ PHASE 3: Enhanced Security Logging Middleware
 * Comprehensive security event tracking and audit trail
 * Created: 2025-07-04 - Phase 3 Security Enhancement
 */

const winston = require('winston');
const path = require('path');

// ✅ Create dedicated security logger
const securityLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.label({ label: 'SECURITY' })
    ),
    defaultMeta: { 
        service: 'rbck-cms-security',
        version: '2.2.0' 
    },
    transports: [
        // Dedicated security log file
        new winston.transports.File({ 
            filename: 'logs/security.log',
            level: 'info',
            maxsize: 10485760, // 10MB
            maxFiles: 10
        }),
        // Critical security alerts
        new winston.transports.File({ 
            filename: 'logs/security-alerts.log',
            level: 'warn',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ]
});

// Add console logging in development
if (process.env.NODE_ENV !== 'production') {
    securityLogger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: 'HH:mm:ss' }),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
                return `${timestamp} [SECURITY] ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
            })
        )
    }));
}

/**
 * ✅ Security event types for consistent logging
 */
const SecurityEvents = {
    // Authentication events
    LOGIN_SUCCESS: 'login_success',
    LOGIN_FAILURE: 'login_failure',
    LOGIN_RATE_LIMITED: 'login_rate_limited',
    TOKEN_EXPIRED: 'token_expired',
    TOKEN_INVALID: 'token_invalid',
    
    // Authorization events
    ADMIN_ACCESS_GRANTED: 'admin_access_granted',
    ADMIN_ACCESS_DENIED: 'admin_access_denied',
    PRIVILEGE_ESCALATION_ATTEMPT: 'privilege_escalation_attempt',
    
    // API Security events
    API_KEY_ACCESSED: 'api_key_accessed',
    API_KEY_CONFIGURED: 'api_key_configured',
    API_RATE_LIMITED: 'api_rate_limited',
    
    // Network Security events
    SUSPICIOUS_IP_DETECTED: 'suspicious_ip_detected',
    IP_BLOCKED: 'ip_blocked',
    CORS_VIOLATION: 'cors_violation',
    
    // Data Security events
    SENSITIVE_DATA_ACCESS: 'sensitive_data_access',
    DATABASE_ERROR: 'database_error',
    MIGRATION_EXECUTED: 'migration_executed',
    
    // General Security events
    SECURITY_SCAN_DETECTED: 'security_scan_detected',
    UNUSUAL_USER_AGENT: 'unusual_user_agent',
    MULTIPLE_FAILED_REQUESTS: 'multiple_failed_requests'
};

/**
 * ✅ Enhanced security logging functions
 */
class SecurityLogger {
    /**
     * Log authentication events
     */
    static logAuth(event, details = {}) {
        const logLevel = event.includes('failure') || event.includes('denied') ? 'warn' : 'info';
        
        securityLogger[logLevel]('Authentication Event', {
            event,
            ...details,
            category: 'authentication',
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * Log authorization events
     */
    static logAuthorization(event, details = {}) {
        const logLevel = event.includes('denied') || event.includes('attempt') ? 'warn' : 'info';
        
        securityLogger[logLevel]('Authorization Event', {
            event,
            ...details,
            category: 'authorization',
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * Log API security events
     */
    static logAPI(event, details = {}) {
        const logLevel = event.includes('rate_limited') ? 'warn' : 'info';
        
        securityLogger[logLevel]('API Security Event', {
            event,
            ...details,
            category: 'api_security',
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * Log network security events
     */
    static logNetwork(event, details = {}) {
        securityLogger.warn('Network Security Event', {
            event,
            ...details,
            category: 'network_security',
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * Log data security events
     */
    static logData(event, details = {}) {
        const logLevel = event.includes('error') ? 'error' : 'info';
        
        securityLogger[logLevel]('Data Security Event', {
            event,
            ...details,
            category: 'data_security',
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * Log critical security incidents
     */
    static logIncident(severity, description, details = {}) {
        securityLogger.error('Security Incident', {
            severity,
            description,
            ...details,
            category: 'security_incident',
            timestamp: new Date().toISOString(),
            requiresAttention: severity === 'critical'
        });
    }
    
    /**
     * Log successful security measures
     */
    static logProtection(action, details = {}) {
        securityLogger.info('Security Protection Applied', {
            action,
            ...details,
            category: 'protection',
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * ✅ Security audit middleware
 */
const securityAuditMiddleware = (req, res, next) => {
    const startTime = Date.now();
    
    // Capture request details
    const requestDetails = {
        method: req.method,
        path: req.path,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        origin: req.get('Origin'),
        referer: req.get('Referer'),
        userId: req.user?.id,
        username: req.user?.username,
        isAdmin: req.user?.isAdmin
    };
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
        /\b(union|select|insert|delete|drop|script|alert|eval)\b/i,
        /\.\.\//,
        /<script/i,
        /javascript:/i
    ];
    
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const isSuspicious = suspiciousPatterns.some(pattern => 
        pattern.test(fullUrl) || pattern.test(JSON.stringify(req.body))
    );
    
    if (isSuspicious) {
        SecurityLogger.logNetwork(SecurityEvents.SECURITY_SCAN_DETECTED, {
            ...requestDetails,
            suspiciousContent: fullUrl
        });
    }
    
    // Log admin operations
    if (req.user?.isAdmin && req.method !== 'GET') {
        SecurityLogger.logAuthorization(SecurityEvents.ADMIN_ACCESS_GRANTED, {
            ...requestDetails,
            operation: `${req.method} ${req.path}`
        });
    }
    
    // Capture response
    const originalSend = res.send;
    res.send = function(data) {
        const responseTime = Date.now() - startTime;
        
        // Log failed authentication attempts
        if (res.statusCode === 401) {
            SecurityLogger.logAuth(SecurityEvents.LOGIN_FAILURE, {
                ...requestDetails,
                responseTime,
                statusCode: res.statusCode
            });
        }
        
        // Log rate limiting
        if (res.statusCode === 429) {
            SecurityLogger.logAPI(SecurityEvents.API_RATE_LIMITED, {
                ...requestDetails,
                responseTime,
                statusCode: res.statusCode
            });
        }
        
        // Log server errors that might indicate attacks
        if (res.statusCode >= 500) {
            SecurityLogger.logIncident('medium', 'Server error occurred', {
                ...requestDetails,
                responseTime,
                statusCode: res.statusCode
            });
        }
        
        return originalSend.call(this, data);
    };
    
    next();
};

/**
 * ✅ Get security logs summary for monitoring
 */
const getSecurityLogSummary = () => {
    return {
        loggerStatus: 'active',
        logLevel: securityLogger.level,
        transports: securityLogger.transports.length,
        events: SecurityEvents,
        timestamp: new Date().toISOString()
    };
};

module.exports = {
    securityLogger,
    SecurityLogger,
    SecurityEvents,
    securityAuditMiddleware,
    getSecurityLogSummary
};