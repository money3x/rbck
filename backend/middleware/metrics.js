const { logger } = require('./errorHandler');

// Performance metrics storage
const metrics = {
  requests: {
    total: 0,
    successful: 0,
    failed: 0,
    byMethod: {},
    byRoute: {},
    averageResponseTime: 0,
    responseTimeHistory: []
  },
  errors: {
    total: 0,
    byType: {},
    recent: []
  },
  system: {
    uptime: process.uptime(),
    startTime: new Date(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage()
  },
  cache: {
    hits: 0,
    misses: 0,
    hitRate: 0
  },
  ai: {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    byProvider: {}
  }
};

// Update metrics helper
const updateMetrics = (type, data) => {
  switch (type) {
    case 'request':
      metrics.requests.total++;
      metrics.requests.byMethod[data.method] = (metrics.requests.byMethod[data.method] || 0) + 1;
      metrics.requests.byRoute[data.route] = (metrics.requests.byRoute[data.route] || 0) + 1;
      
      if (data.responseTime) {
        metrics.requests.responseTimeHistory.push(data.responseTime);
        // Keep only last 100 response times
        if (metrics.requests.responseTimeHistory.length > 100) {
          metrics.requests.responseTimeHistory.shift();
        }
        // Update average
        metrics.requests.averageResponseTime = 
          metrics.requests.responseTimeHistory.reduce((a, b) => a + b, 0) / 
          metrics.requests.responseTimeHistory.length;
      }
      
      if (data.statusCode >= 200 && data.statusCode < 400) {
        metrics.requests.successful++;
      } else {
        metrics.requests.failed++;
      }
      break;

    case 'error':
      metrics.errors.total++;
      metrics.errors.byType[data.type] = (metrics.errors.byType[data.type] || 0) + 1;
      metrics.errors.recent.push({
        ...data,
        timestamp: new Date()
      });
      // Keep only last 10 errors
      if (metrics.errors.recent.length > 10) {
        metrics.errors.recent.shift();
      }
      break;

    case 'cache':
      if (data.hit) {
        metrics.cache.hits++;
      } else {
        metrics.cache.misses++;
      }
      metrics.cache.hitRate = metrics.cache.hits / (metrics.cache.hits + metrics.cache.misses);
      break;

    case 'ai':
      metrics.ai.totalRequests++;
      if (!metrics.ai.byProvider[data.provider]) {
        metrics.ai.byProvider[data.provider] = {
          requests: 0,
          successful: 0,
          failed: 0,
          averageResponseTime: 0,
          responseTimeHistory: []
        };
      }
      
      const providerMetrics = metrics.ai.byProvider[data.provider];
      providerMetrics.requests++;
      
      if (data.success) {
        metrics.ai.successfulRequests++;
        providerMetrics.successful++;
      } else {
        metrics.ai.failedRequests++;
        providerMetrics.failed++;
      }
      
      if (data.responseTime) {
        providerMetrics.responseTimeHistory.push(data.responseTime);
        if (providerMetrics.responseTimeHistory.length > 50) {
          providerMetrics.responseTimeHistory.shift();
        }
        providerMetrics.averageResponseTime = 
          providerMetrics.responseTimeHistory.reduce((a, b) => a + b, 0) / 
          providerMetrics.responseTimeHistory.length;
      }
      break;
  }
};

// Metrics collection middleware
const metricsMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Override res.end to capture metrics
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    
    updateMetrics('request', {
      method: req.method,
      route: req.route ? req.route.path : req.path,
      statusCode: res.statusCode,
      responseTime
    });
    
    originalEnd.apply(this, args);
  };
  
  next();
};

// Health check endpoint handler
const healthCheck = async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '2.2.0',
    environment: process.env.NODE_ENV || 'development'
  };

  // Check database connectivity (non-critical - don't fail health check if missing)
  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && 
        !process.env.SUPABASE_URL.includes('placeholder')) {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
      
      // Simple query to test connection
      const { error } = await supabase.from('posts').select('id').limit(1);
      health.database = error ? 'unhealthy' : 'healthy';
      if (error) {
        health.databaseError = error?.message;
      }
    } else {
      health.database = 'not_configured';
      health.databaseNote = 'Database credentials not configured - using fallback data';
    }
  } catch (error) {
    health.database = 'not_configured';
    health.databaseNote = 'Database connection failed - using fallback data';
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  health.memory = {
    used: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100,
    total: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100,
    external: Math.round(memUsage.external / 1024 / 1024 * 100) / 100
  };

  // Check if memory usage is too high (>80% of total)
  if (health.memory.used / health.memory.total > 0.8) {
    health.status = 'warning';
    health.warnings = health.warnings || [];
    health.warnings.push('High memory usage');
  }

  // Server is healthy as long as it's running - database issues don't make it unhealthy
  // Only fail if critical system issues (like memory)
  
  res.status(200).json(health);
};

// Detailed metrics endpoint
const getMetrics = (req, res) => {
  // Update system metrics
  metrics.system.uptime = process.uptime();
  metrics.system.memoryUsage = process.memoryUsage();
  metrics.system.cpuUsage = process.cpuUsage();

  res.json({
    ...metrics,
    timestamp: new Date().toISOString(),
    requestsPerMinute: metrics.requests.total / (process.uptime() / 60),
    errorRate: metrics.requests.failed / metrics.requests.total || 0
  });
};

// Reset metrics
const resetMetrics = (req, res) => {
  // Reset all metrics except system info
  metrics.requests = {
    total: 0,
    successful: 0,
    failed: 0,
    byMethod: {},
    byRoute: {},
    averageResponseTime: 0,
    responseTimeHistory: []
  };
  
  metrics.errors = {
    total: 0,
    byType: {},
    recent: []
  };
  
  metrics.cache = {
    hits: 0,
    misses: 0,
    hitRate: 0
  };
  
  metrics.ai = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    byProvider: {}
  };

  logger.info('Metrics reset by admin', {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.json({ message: 'Metrics reset successfully', timestamp: new Date().toISOString() });
};

module.exports = {
  metrics,
  updateMetrics,
  metricsMiddleware,
  healthCheck,
  getMetrics,
  resetMetrics
};
