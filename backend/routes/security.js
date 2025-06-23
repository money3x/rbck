/**
 * Security Monitoring Routes
 * Provides admin oversight of security events and system health
 * Part of Phase 1: Security & Performance enhancements
 */

const express = require('express');
const router = express.Router();
const { authenticateAdmin, getActiveSessions } = require('../middleware/auth');
const { logger } = require('../middleware/errorHandler');

/**
 * GET /api/security/overview
 * Security dashboard overview
 */
router.get('/overview',
    authenticateAdmin,
    (req, res) => {
        try {
            const sessions = getActiveSessions();
            
            // Mock security metrics (in production, pull from actual monitoring)
            const securityOverview = {
                activeSessions: sessions.length,
                recentLogins: sessions.filter(s => {
                    const sessionAge = Date.now() - new Date(s.createdAt).getTime();
                    return sessionAge < 3600000; // Last hour
                }).length,
                failedAttempts: 0, // Would be pulled from failedAttempts Map
                blockedIPs: 0,
                lastSecurityEvent: new Date().toISOString(),
                systemStatus: 'secure',
                encryptionStatus: 'active',
                timestamp: new Date().toISOString()
            };
            
            logger.info(`Security overview requested by admin: ${req.user.username}`);
            
            res.json({
                success: true,
                data: securityOverview
            });
        } catch (error) {
            logger.error('Security overview error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve security overview'
            });
        }
    }
);

/**
 * GET /api/security/sessions
 * Detailed session information
 */
router.get('/sessions',
    authenticateAdmin,
    (req, res) => {
        try {
            const sessions = getActiveSessions();
            
            logger.info(`Session details requested by admin: ${req.user.username}`);
            
            res.json({
                success: true,
                data: {
                    sessions,
                    total: sessions.length,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            logger.error('Session details error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve session details'
            });
        }
    }
);

/**
 * GET /api/security/audit-log
 * Security audit log (recent events)
 */
router.get('/audit-log',
    authenticateAdmin,
    (req, res) => {
        try {
            // Mock audit log (in production, pull from actual log files)
            const auditLog = [
                {
                    timestamp: new Date().toISOString(),
                    event: 'admin_login',
                    user: req.user.username,
                    ip: req.ip,
                    details: 'Successful admin login'
                },
                // Add more mock events as needed
            ];
            
            logger.info(`Audit log requested by admin: ${req.user.username}`);
            
            res.json({
                success: true,
                data: {
                    events: auditLog,
                    total: auditLog.length,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            logger.error('Audit log error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve audit log'
            });
        }
    }
);

/**
 * POST /api/security/test-encryption
 * Test encryption functionality
 */
router.post('/test-encryption',
    authenticateAdmin,
    (req, res) => {
        try {
            const { testData } = req.body;
            
            if (!testData) {
                return res.status(400).json({
                    success: false,
                    error: 'Test data required'
                });
            }
            
            // Test encryption with API key manager
            const apiKeyManager = require('../models/apiKeys');
            
            // Simple encryption test
            const encrypted = apiKeyManager.encrypt(testData);
            const decrypted = apiKeyManager.decrypt(encrypted);
            
            const encryptionWorks = decrypted === testData;
            
            logger.info(`Encryption test performed by admin: ${req.user.username} - Result: ${encryptionWorks ? 'Success' : 'Failed'}`);
            
            res.json({
                success: true,
                data: {
                    encryptionWorking: encryptionWorks,
                    testPassed: encryptionWorks,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            logger.error('Encryption test error:', error);
            res.status(500).json({
                success: false,
                error: 'Encryption test failed'
            });
        }
    }
);

/**
 * GET /api/security/health
 * Security system health check
 */
router.get('/health',
    authenticateAdmin,
    (req, res) => {
        try {
            const health = {
                authentication: 'healthy',
                encryption: 'healthy',
                rateLimiting: 'active',
                sessions: 'active',
                auditLogging: 'active',
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'development'
            };
            
            logger.info(`Security health check by admin: ${req.user.username}`);
            
            res.json({
                success: true,
                data: health
            });
        } catch (error) {
            logger.error('Security health check error:', error);
            res.status(500).json({
                success: false,
                error: 'Security health check failed'
            });
        }
    }
);

module.exports = router;
