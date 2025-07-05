// Monitoring and Metrics API Routes
const express = require('express');
const router = express.Router();
const { getHealthMetrics, getPrometheusMetrics } = require('../middleware/monitoring');
const { authenticateAdmin } = require('../middleware/auth');

// Health check endpoint with detailed metrics
router.get('/health', (req, res) => {
  try {
    const health = getHealthMetrics();
    const status = 'healthy';
    
    res.json({
      status,
      timestamp: new Date().toISOString(),
      service: 'rbck-cms',
      version: process.env.npm_package_version || '1.0.0',
      uptime: health.uptime,
      metrics: health.metrics,
      alerts: health.alerts,
      memory: {
        used: `${(health.memory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        total: `${(health.memory.heapTotal / 1024 / 1024).toFixed(2)}MB`,
        percentage: `${((health.memory.heapUsed / health.memory.heapTotal) * 100).toFixed(2)}%`
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Prometheus metrics endpoint
router.get('/metrics', (req, res) => {
  try {
    res.set('Content-Type', 'text/plain');
    res.send(getPrometheusMetrics());
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve metrics',
      message: error.message
    });
  }
});

// Detailed system metrics (admin only)
router.get('/system', authenticateAdmin, (req, res) => {
  try {
    const health = getHealthMetrics();
    const cpuUsage = process.cpuUsage();
    
    res.json({
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        pid: process.pid,
        uptime: process.uptime(),
        loadAverage: require('os').loadavg(),
        freeMemory: require('os').freemem(),
        totalMemory: require('os').totalmem()
      },
      process: {
        memory: process.memoryUsage(),
        cpu: cpuUsage,
        versions: process.versions
      },
      application: {
        requests: health.metrics.requests,
        errors: health.metrics.errors,
        errorRate: `${((health.metrics.errors / health.metrics.requests) * 100).toFixed(2)}%`,
        avgResponseTime: `${health.metrics.avgResponseTime.toFixed(3)}s`,
        alerts: health.alerts.length
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve system metrics',
      message: error.message
    });
  }
});

// Performance dashboard data
router.get('/dashboard', authenticateAdmin, (req, res) => {
  try {
    const health = getHealthMetrics();
    const timeRange = req.query.range || '1h';
    
    // Calculate performance scores
    const errorRate = health.metrics.errors / health.metrics.requests;
    const performanceScore = calculatePerformanceScore(health.metrics);
    
    res.json({
      overview: {
        status: errorRate < 0.05 ? 'healthy' : 'warning',
        totalRequests: health.metrics.requests,
        totalErrors: health.metrics.errors,
        errorRate: `${(errorRate * 100).toFixed(2)}%`,
        avgResponseTime: `${health.metrics.avgResponseTime.toFixed(3)}s`,
        uptime: `${(process.uptime() / 3600).toFixed(1)}h`,
        performanceScore
      },
      alerts: {
        active: health.alerts.filter(a => Date.now() - a.timestamp < 300000), // Last 5 minutes
        recent: health.alerts.slice(-20),
        summary: getAlertSummary(health.alerts)
      },
      resources: {
        memory: {
          used: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal,
          percentage: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100
        },
        cpu: {
          usage: health.metrics.cpuUsage || 0,
          loadAverage: require('os').loadavg()
        }
      },
      trends: {
        requestTrend: 'stable', // Would implement actual trend calculation
        errorTrend: errorRate < 0.01 ? 'improving' : 'stable',
        performanceTrend: 'stable'
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve dashboard data',
      message: error.message
    });
  }
});

// Alert management
router.get('/alerts', authenticateAdmin, (req, res) => {
  try {
    const health = getHealthMetrics();
    const { severity, type, limit = 50 } = req.query;
    
    let alerts = health.alerts;
    
    // Filter by severity
    if (severity) {
      alerts = alerts.filter(a => a.severity === severity);
    }
    
    // Filter by type
    if (type) {
      alerts = alerts.filter(a => a.type === type);
    }
    
    // Limit results
    alerts = alerts.slice(-parseInt(limit));
    
    res.json({
      alerts,
      total: alerts.length,
      summary: getAlertSummary(alerts)
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve alerts',
      message: error.message
    });
  }
});

// Helper functions
function calculatePerformanceScore(metrics) {
  let score = 100;
  
  // Error rate penalty
  const errorRate = metrics.errors / metrics.requests;
  if (errorRate > 0.1) score -= 40;
  else if (errorRate > 0.05) score -= 20;
  else if (errorRate > 0.01) score -= 10;
  
  // Response time penalty
  if (metrics.avgResponseTime > 5) score -= 30;
  else if (metrics.avgResponseTime > 2) score -= 15;
  else if (metrics.avgResponseTime > 1) score -= 5;
  
  // Memory usage penalty
  if (metrics.memoryUsage > 0.9) score -= 20;
  else if (metrics.memoryUsage > 0.8) score -= 10;
  
  return Math.max(0, Math.min(100, score));
}

function getAlertSummary(alerts) {
  const summary = {
    total: alerts.length,
    byType: {},
    bySeverity: {},
    recent: alerts.filter(a => Date.now() - a.timestamp < 3600000).length // Last hour
  };
  
  alerts.forEach(alert => {
    // Count by type
    summary.byType[alert.type] = (summary.byType[alert.type] || 0) + 1;
    
    // Count by severity
    const severity = alert.severity || 'medium';
    summary.bySeverity[severity] = (summary.bySeverity[severity] || 0) + 1;
  });
  
  return summary;
}

module.exports = router;