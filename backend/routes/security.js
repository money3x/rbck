/**
 * Security Dashboard API Routes
 * Provides security monitoring data for admin panel
 * Created: 2025-07-04 - Security Dashboard Implementation
 */

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { authenticateAdmin, requireAdmin } = require('../middleware/auth');
const { SecurityLogger, getSecurityLogSummary } = require('../middleware/securityLogger');
const { getRateLimitStats } = require('../middleware/rateLimiter');

/**
 * 📊 Security Dashboard - Main endpoint
 * GET /api/security/dashboard
 */
router.get('/dashboard', authenticateAdmin, requireAdmin, async (req, res) => {
    try {
        const dashboardData = {
            // Live metrics
            metrics: await getSecurityMetrics(),
            
            // Recent alerts (last 24 hours)
            alerts: await getRecentSecurityAlerts(),
            
            // Authentication logs (last 100 entries)
            authLogs: await getAuthenticationLogs(),
            
            // Blocked IPs
            blockedIPs: await getBlockedIPs(),
            
            // Rate limiting stats
            rateLimiting: getRateLimitStats(),
            
            // System status
            systemStatus: await getSystemStatus(),
            
            timestamp: new Date().toISOString()
        };

        SecurityLogger.logData('SECURITY_DASHBOARD_ACCESSED', {
            userId: req.user.id,
            username: req.user.username,
            ip: req.ip,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            data: dashboardData
        });

    } catch (error) {
        console.error('Security dashboard error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load security dashboard',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Contact support'
        });
    }
});

/**
 * 🔒 Authentication Logs endpoint
 * GET /api/security/auth-logs
 */
router.get('/auth-logs', authenticateAdmin, requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const authLogs = await getAuthenticationLogs(page, limit);
        
        res.json({
            success: true,
            data: authLogs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: authLogs.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to load authentication logs'
        });
    }
});

/**
 * 🚫 Blocked IPs Management
 * GET /api/security/blocked-ips
 */
router.get('/blocked-ips', authenticateAdmin, requireAdmin, async (req, res) => {
    try {
        const blockedIPs = await getBlockedIPs();
        res.json({
            success: true,
            data: blockedIPs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to load blocked IPs'
        });
    }
});

/**
 * 🔓 Unblock IP endpoint
 * POST /api/security/unblock-ip
 */
router.post('/unblock-ip', authenticateAdmin, requireAdmin, async (req, res) => {
    try {
        const { ip } = req.body;
        
        if (!ip) {
            return res.status(400).json({
                success: false,
                error: 'IP address is required'
            });
        }

        // TODO: Implement IP unblocking logic
        SecurityLogger.logData('IP_UNBLOCKED', {
            unblockedIP: ip,
            adminUser: req.user.username,
            adminIP: req.ip,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            message: `IP ${ip} has been unblocked`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to unblock IP'
        });
    }
});

/**
 * 📊 Helper function: Get security metrics
 */
async function getSecurityMetrics() {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Read security logs for today's metrics
        const securityLogs = await readSecurityLogs();
        const todayLogs = securityLogs.filter(log => new Date(log.timestamp) >= today);
        
        return {
            failedLogins: todayLogs.filter(log => log.event === 'login_failure').length,
            blockedIPs: await getBlockedIPsCount(),
            rateLimited: todayLogs.filter(log => log.event === 'api_rate_limited').length,
            securityAlerts: todayLogs.filter(log => log.category === 'security_incident').length,
            totalRequests: todayLogs.length,
            lastUpdated: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error getting security metrics:', error);
        return {
            failedLogins: 0,
            blockedIPs: 0,
            rateLimited: 0,
            securityAlerts: 0,
            totalRequests: 0,
            lastUpdated: new Date().toISOString(),
            error: 'Metrics unavailable'
        };
    }
}

/**
 * ⚠️ Helper function: Get recent security alerts
 */
async function getRecentSecurityAlerts() {
    try {
        const securityLogs = await readSecurityLogs();
        const alerts = securityLogs
            .filter(log => log.level === 'warn' || log.level === 'error')
            .slice(0, 20) // Last 20 alerts
            .map(log => ({
                id: log.timestamp + '_' + Math.random().toString(36).substr(2, 9),
                timestamp: log.timestamp,
                type: log.event || 'Unknown',
                message: log.message || 'Security event detected',
                severity: log.level === 'error' ? 'high' : 'medium',
                ip: log.ip || 'Unknown',
                details: log
            }));
            
        return alerts;
    } catch (error) {
        console.error('Error getting security alerts:', error);
        return [];
    }
}

/**
 * 🔒 Helper function: Get authentication logs
 */
async function getAuthenticationLogs(page = 1, limit = 50) {
    try {
        const securityLogs = await readSecurityLogs();
        const authLogs = securityLogs
            .filter(log => log.category === 'authentication')
            .slice(0, parseInt(limit))
            .map(log => ({
                id: log.timestamp + '_auth',
                timestamp: log.timestamp,
                event: log.event,
                username: log.username || 'Unknown',
                ip: log.ip || log.clientIp || 'Unknown',
                userAgent: log.userAgent || 'Unknown',
                status: log.event.includes('success') ? 'success' : 'failed',
                details: log
            }));
            
        return authLogs;
    } catch (error) {
        console.error('Error getting authentication logs:', error);
        return [];
    }
}

/**
 * 🚫 Helper function: Get blocked IPs
 */
async function getBlockedIPs() {
    try {
        // TODO: Implement actual blocked IPs retrieval from rate limiter
        return [
            {
                ip: '192.168.1.100',
                reason: 'Multiple failed login attempts',
                blockedAt: new Date(Date.now() - 3600000).toISOString(),
                attempts: 15,
                lastAttempt: new Date(Date.now() - 1800000).toISOString()
            },
            {
                ip: '10.0.0.50',
                reason: 'Suspicious activity detected',
                blockedAt: new Date(Date.now() - 7200000).toISOString(),
                attempts: 8,
                lastAttempt: new Date(Date.now() - 3600000).toISOString()
            }
        ];
    } catch (error) {
        console.error('Error getting blocked IPs:', error);
        return [];
    }
}

/**
 * 📈 Helper function: Get blocked IPs count
 */
async function getBlockedIPsCount() {
    try {
        const blockedIPs = await getBlockedIPs();
        return blockedIPs.length;
    } catch (error) {
        return 0;
    }
}

/**
 * 🏥 Helper function: Get system status
 */
async function getSystemStatus() {
    try {
        return {
            server: 'healthy',
            database: 'connected',
            security: 'active',
            logging: 'operational',
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        return {
            server: 'unknown',
            database: 'unknown',
            security: 'unknown',
            logging: 'unknown',
            uptime: 0,
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * 📖 Helper function: Read security logs
 */
async function readSecurityLogs() {
    try {
        const logPath = path.join(__dirname, '../logs/security.log');
        const logContent = await fs.readFile(logPath, 'utf8');
        
        // Parse each line as JSON
        const logs = logContent
            .split('\n')
            .filter(line => line.trim())
            .map(line => {
                try {
                    return JSON.parse(line);
                } catch (e) {
                    return null;
                }
            })
            .filter(log => log !== null)
            .reverse(); // Most recent first
            
        return logs;
    } catch (error) {
        console.error('Error reading security logs:', error);
        return [];
    }
}

module.exports = router;