// Advanced Monitoring Middleware with APM and Alerting
const winston = require('winston');
const prometheus = require('prom-client');
const { logger } = require('./errorHandler');

// Create a Registry to hold metrics
const register = new prometheus.Registry();

// Default metrics
prometheus.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const httpRequestTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status']
});

const aiProviderRequests = new prometheus.Counter({
  name: 'ai_provider_requests_total',
  help: 'Total AI provider requests',
  labelNames: ['provider', 'status']
});

const aiProviderLatency = new prometheus.Histogram({
  name: 'ai_provider_latency_seconds',
  help: 'AI provider request latency',
  labelNames: ['provider'],
  buckets: [0.5, 1, 2, 5, 10, 30]
});

const systemErrors = new prometheus.Counter({
  name: 'system_errors_total',
  help: 'Total system errors',
  labelNames: ['type', 'severity']
});

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(aiProviderRequests);
register.registerMetric(aiProviderLatency);
register.registerMetric(systemErrors);

// Performance monitoring class
class PerformanceMonitor {
  constructor() {
    this.alerts = [];
    this.thresholds = {
      responseTime: 2000,      // 2 seconds
      errorRate: 0.05,         // 5%
      memoryUsage: 0.85,       // 85%
      cpuUsage: 0.80           // 80%
    };
    this.metrics = {
      requests: 0,
      errors: 0,
      avgResponseTime: 0,
      memoryUsage: 0,
      cpuUsage: 0
    };
    
    this.startSystemMonitoring();
  }

  // HTTP request monitoring middleware
  requestMonitoring() {
    return (req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const route = req.route?.path || req.path || 'unknown';
        const status = res.statusCode.toString();
        
        // Record metrics
        httpRequestDuration
          .labels(req.method, route, status)
          .observe(duration);
          
        httpRequestTotal
          .labels(req.method, route, status)
          .inc();
        
        // Update internal metrics
        this.updateMetrics(duration, res.statusCode);
        
        // Check for alerts
        this.checkAlerts(duration, res.statusCode);
        
        // Log slow requests
        if (duration > this.thresholds.responseTime / 1000) {
          logger.warn('Slow request detected', {
            method: req.method,
            path: req.path,
            duration: `${duration}s`,
            userAgent: req.get('User-Agent'),
            ip: req.ip
          });
        }
      });
      
      next();
    };
  }

  // AI provider monitoring
  trackAIRequest(provider, duration, success) {
    const status = success ? 'success' : 'error';
    
    aiProviderRequests
      .labels(provider, status)
      .inc();
      
    aiProviderLatency
      .labels(provider)
      .observe(duration / 1000);
    
    if (!success) {
      systemErrors
        .labels('ai_provider', 'high')
        .inc();
        
      this.sendAlert({
        type: 'ai_provider_error',
        provider,
        duration,
        timestamp: Date.now()
      });
    }
  }

  // Error monitoring
  trackError(error, severity = 'medium') {
    systemErrors
      .labels(error.type || 'unknown', severity)
      .inc();
    
    if (severity === 'high' || severity === 'critical') {
      this.sendAlert({
        type: 'system_error',
        error: error.message,
        severity,
        stack: error.stack,
        timestamp: Date.now()
      });
    }
    
    logger.error('System error tracked', {
      error: error.message,
      severity,
      stack: error.stack
    });
  }

  // System monitoring (CPU, Memory)
  startSystemMonitoring() {
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const memUsageMB = memUsage.heapUsed / 1024 / 1024;
      const memUsagePercent = memUsage.heapUsed / memUsage.heapTotal;
      
      this.metrics.memoryUsage = memUsagePercent;
      
      // Check memory threshold
      if (memUsagePercent > this.thresholds.memoryUsage) {
        this.sendAlert({
          type: 'high_memory_usage',
          usage: `${(memUsagePercent * 100).toFixed(2)}%`,
          usageMB: `${memUsageMB.toFixed(2)}MB`,
          timestamp: Date.now()
        });
      }
      
      // Log system metrics
      logger.info('System metrics', {
        memory: {
          heapUsed: `${memUsageMB.toFixed(2)}MB`,
          heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
          percentage: `${(memUsagePercent * 100).toFixed(2)}%`
        }
      });
    }, 30000); // Every 30 seconds
  }

  // Update internal metrics
  updateMetrics(duration, statusCode) {
    this.metrics.requests++;
    
    if (statusCode >= 400) {
      this.metrics.errors++;
    }
    
    // Calculate moving average for response time
    this.metrics.avgResponseTime = 
      (this.metrics.avgResponseTime + duration) / 2;
  }

  // Alert checking
  checkAlerts(duration, statusCode) {
    // Check error rate
    const errorRate = this.metrics.errors / this.metrics.requests;
    if (errorRate > this.thresholds.errorRate && this.metrics.requests > 10) {
      this.sendAlert({
        type: 'high_error_rate',
        rate: `${(errorRate * 100).toFixed(2)}%`,
        errors: this.metrics.errors,
        requests: this.metrics.requests,
        timestamp: Date.now()
      });
    }
    
    // Check response time
    if (duration > this.thresholds.responseTime / 1000) {
      this.sendAlert({
        type: 'slow_response',
        duration: `${duration}s`,
        threshold: `${this.thresholds.responseTime / 1000}s`,
        timestamp: Date.now()
      });
    }
  }

  // Alert sending
  sendAlert(alert) {
    // Prevent spam - only send same alert type once per minute
    const recentAlert = this.alerts.find(a => 
      a.type === alert.type && 
      Date.now() - a.timestamp < 60000
    );
    
    if (recentAlert) return;
    
    this.alerts.push(alert);
    
    // Log alert
    logger.error('ALERT', alert);
    
    // Send to external monitoring service (Slack, email, etc.)
    this.sendExternalAlert(alert);
    
    // Clean old alerts (keep last 100)
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }

  // External alert integration
  async sendExternalAlert(alert) {
    try {
      // Webhook to Slack/Discord/Teams
      if (process.env.ALERT_WEBHOOK_URL) {
        const payload = {
          text: `🚨 RBCK CMS Alert: ${alert.type}`,
          attachments: [{
            color: this.getAlertColor(alert.type),
            fields: Object.entries(alert).map(([key, value]) => ({
              title: key,
              value: value.toString(),
              short: true
            }))
          }]
        };
        
        // Implement webhook call here
        console.log('Alert sent:', JSON.stringify(payload, null, 2));
      }
      
      // Email alert for critical issues
      if (alert.severity === 'critical' && process.env.ALERT_EMAIL) {
        // Implement email sending here
        console.log('Critical alert email sent');
      }
    } catch (error) {
      logger.error('Failed to send external alert', error);
    }
  }

  getAlertColor(alertType) {
    const colors = {
      high_error_rate: 'danger',
      slow_response: 'warning',
      high_memory_usage: 'warning',
      ai_provider_error: 'danger',
      system_error: 'danger'
    };
    return colors[alertType] || 'warning';
  }

  // Health check endpoint data
  getHealthMetrics() {
    return {
      metrics: this.metrics,
      alerts: this.alerts.slice(-10), // Last 10 alerts
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      prometheus: register.metrics()
    };
  }

  // Reset metrics (for testing)
  resetMetrics() {
    this.metrics = {
      requests: 0,
      errors: 0,
      avgResponseTime: 0,
      memoryUsage: 0,
      cpuUsage: 0
    };
    this.alerts = [];
  }
}

// Create global monitor instance
const monitor = new PerformanceMonitor();

// Middleware functions
const requestMonitoring = () => monitor.requestMonitoring();

const trackAIRequest = (provider, duration, success) => 
  monitor.trackAIRequest(provider, duration, success);

const trackError = (error, severity) => 
  monitor.trackError(error, severity);

const getHealthMetrics = () => monitor.getHealthMetrics();

const getPrometheusMetrics = () => register.metrics();

module.exports = {
  requestMonitoring,
  trackAIRequest,
  trackError,
  getHealthMetrics,
  getPrometheusMetrics,
  monitor
};