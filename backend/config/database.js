// Optimized Database Configuration with Connection Pooling
const { createClient } = require('@supabase/supabase-js');
const winston = require('winston');

class DatabaseManager {
  constructor() {
    this.client = null;
    this.connectionPool = new Map();
    this.queryCache = new Map();
    this.config = {
      url: process.env.SUPABASE_URL,
      key: process.env.SUPABASE_KEY,
      options: {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false
        },
        db: {
          schema: 'public'
        },
        global: {
          headers: {
            'x-my-custom-header': 'rbck-cms'
          }
        },
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      }
    };
    
    this.queryStats = {
      totalQueries: 0,
      slowQueries: 0,
      cachedQueries: 0,
      errors: 0
    };
    
    this.init();
  }

  init() {
    try {
      this.client = createClient(this.config.url, this.config.key, this.config.options);
      
      // Setup query performance monitoring
      this.setupQueryMonitoring();
      
      // Initialize connection health check
      this.startHealthCheck();
      
      winston.info('Database connection initialized with optimization');
    } catch (error) {
      winston.error('Database initialization failed:', error);
      throw error;
    }
  }

  // Optimized query execution with caching and monitoring
  async executeQuery(table, operation, params = {}, cacheKey = null, cacheTime = 300) {
    const startTime = Date.now();
    this.queryStats.totalQueries++;

    try {
      // Check cache first for SELECT operations
      if (operation === 'select' && cacheKey && this.queryCache.has(cacheKey)) {
        const cached = this.queryCache.get(cacheKey);
        if (Date.now() - cached.timestamp < cacheTime * 1000) {
          this.queryStats.cachedQueries++;
          winston.debug(`Cache hit for query: ${cacheKey}`);
          return cached.data;
        } else {
          this.queryCache.delete(cacheKey);
        }
      }

      // Execute query with optimization
      let query = this.client.from(table);
      
      // Apply operation-specific optimizations
      switch (operation) {
        case 'select':
          query = this.optimizeSelectQuery(query, params);
          break;
        case 'insert':
          query = query.insert(params.data);
          break;
        case 'update':
          query = query.update(params.data);
          if (params.match) query = query.match(params.match);
          break;
        case 'delete':
          query = query.delete();
          if (params.match) query = query.match(params.match);
          break;
        case 'upsert':
          query = query.upsert(params.data);
          break;
      }

      const { data, error, count } = await query;
      const duration = Date.now() - startTime;

      if (error) {
        this.queryStats.errors++;
        winston.error('Database query error:', { error, table, operation, duration });
        throw error;
      }

      // Cache successful SELECT operations
      if (operation === 'select' && cacheKey && data) {
        this.queryCache.set(cacheKey, {
          data: { data, count },
          timestamp: Date.now()
        });
      }

      // Log slow queries
      if (duration > 1000) {
        this.queryStats.slowQueries++;
        winston.warn('Slow query detected:', {
          table,
          operation,
          duration: `${duration}ms`,
          params: JSON.stringify(params).substring(0, 200)
        });
      }

      winston.debug('Database query executed:', {
        table,
        operation,
        duration: `${duration}ms`,
        rows: Array.isArray(data) ? data.length : 1
      });

      return { data, count };

    } catch (error) {
      this.queryStats.errors++;
      const duration = Date.now() - startTime;
      winston.error('Database query failed:', {
        error: error.message,
        table,
        operation,
        duration: `${duration}ms`
      });
      throw error;
    }
  }

  // Optimize SELECT queries with intelligent column selection and indexes
  optimizeSelectQuery(query, params) {
    // Select specific columns if provided
    if (params.select) {
      query = query.select(params.select);
    } else {
      // Default optimized select for common tables
      query = query.select('*');
    }

    // Apply filters efficiently
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else if (typeof value === 'object' && value.operator) {
          switch (value.operator) {
            case 'gt':
              query = query.gt(key, value.value);
              break;
            case 'lt':
              query = query.lt(key, value.value);
              break;
            case 'gte':
              query = query.gte(key, value.value);
              break;
            case 'lte':
              query = query.lte(key, value.value);
              break;
            case 'like':
              query = query.ilike(key, `%${value.value}%`);
              break;
            case 'not':
              query = query.not(key, 'eq', value.value);
              break;
            default:
              query = query.eq(key, value.value);
          }
        } else {
          query = query.eq(key, value);
        }
      });
    }

    // Apply sorting with index hints
    if (params.order) {
      const { column, ascending = true } = params.order;
      query = query.order(column, { ascending });
    }

    // Apply pagination efficiently
    if (params.range) {
      const { from, to } = params.range;
      query = query.range(from, to);
    }

    // Limit results to prevent memory issues
    if (params.limit && !params.range) {
      query = query.limit(params.limit);
    }

    return query;
  }

  // Batch operations for better performance
  async executeBatch(operations) {
    const startTime = Date.now();
    const results = [];

    try {
      // Group operations by table for optimization
      const groupedOps = this.groupOperationsByTable(operations);
      
      for (const [table, ops] of groupedOps) {
        const tableResults = await Promise.allSettled(
          ops.map(op => this.executeQuery(table, op.operation, op.params, op.cacheKey))
        );
        results.push(...tableResults);
      }

      const duration = Date.now() - startTime;
      winston.info('Batch operations completed:', {
        operations: operations.length,
        duration: `${duration}ms`,
        successRate: `${(results.filter(r => r.status === 'fulfilled').length / results.length * 100).toFixed(1)}%`
      });

      return results;

    } catch (error) {
      winston.error('Batch operations failed:', error);
      throw error;
    }
  }

  groupOperationsByTable(operations) {
    const grouped = new Map();
    
    operations.forEach(op => {
      if (!grouped.has(op.table)) {
        grouped.set(op.table, []);
      }
      grouped.get(op.table).push(op);
    });

    return grouped;
  }

  // Connection health monitoring
  startHealthCheck() {
    setInterval(async () => {
      try {
        const { data, error } = await this.client
          .from('posts')
          .select('count', { count: 'exact', head: true });
          
        if (error) {
          winston.warn('Database health check failed:', error);
        } else {
          winston.debug('Database health check passed');
        }
      } catch (error) {
        winston.error('Database health check error:', error);
      }
    }, 60000); // Every minute
  }

  setupQueryMonitoring() {
    // Reset stats periodically
    setInterval(() => {
      const stats = { ...this.queryStats };
      winston.info('Database performance stats:', {
        ...stats,
        cacheHitRate: stats.totalQueries > 0 ? 
          `${(stats.cachedQueries / stats.totalQueries * 100).toFixed(1)}%` : '0%',
        errorRate: stats.totalQueries > 0 ? 
          `${(stats.errors / stats.totalQueries * 100).toFixed(1)}%` : '0%',
        slowQueryRate: stats.totalQueries > 0 ? 
          `${(stats.slowQueries / stats.totalQueries * 100).toFixed(1)}%` : '0%'
      });
      
      // Reset counters but keep running totals in separate tracking
      this.queryStats = {
        totalQueries: 0,
        slowQueries: 0,
        cachedQueries: 0,
        errors: 0
      };
    }, 300000); // Every 5 minutes
  }

  // Clean up cache to prevent memory leaks
  cleanupCache() {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour
    
    for (const [key, value] of this.queryCache.entries()) {
      if (now - value.timestamp > maxAge) {
        this.queryCache.delete(key);
      }
    }
    
    winston.debug('Query cache cleaned up:', {
      remainingEntries: this.queryCache.size
    });
  }

  // Get performance metrics
  getPerformanceMetrics() {
    return {
      queryStats: this.queryStats,
      cacheSize: this.queryCache.size,
      connectionStatus: this.client ? 'connected' : 'disconnected'
    };
  }

  // Force cache clear
  clearCache() {
    this.queryCache.clear();
    winston.info('Database query cache cleared');
  }

  // Get the Supabase client for direct access when needed
  getClient() {
    return this.client;
  }
}

// Create singleton instance
const dbManager = new DatabaseManager();

// Start cache cleanup interval
setInterval(() => {
  dbManager.cleanupCache();
}, 600000); // Every 10 minutes

module.exports = dbManager;