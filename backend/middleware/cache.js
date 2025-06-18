const NodeCache = require('node-cache');

// Create cache instances for different types of data
const caches = {
  // Short-term cache for API responses (5 minutes)
  api: new NodeCache({ stdTTL: 300, checkperiod: 60 }),
  
  // Medium-term cache for posts (15 minutes)
  posts: new NodeCache({ stdTTL: 900, checkperiod: 180 }),
  
  // Long-term cache for static content (1 hour)
  static: new NodeCache({ stdTTL: 3600, checkperiod: 600 }),
  
  // AI provider responses cache (30 minutes)
  ai: new NodeCache({ stdTTL: 1800, checkperiod: 300 })
};

// Cache middleware factory
const createCacheMiddleware = (ttlOrType = 'api', keyGenerator = null) => {
  return (req, res, next) => {
    // Skip caching for POST, PUT, DELETE requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching for admin routes
    if (req.path.startsWith('/api/admin')) {
      return next();
    }

    try {
      // Determine cache type and TTL
      let cacheType = 'api';
      let ttl = 300; // default 5 minutes

      if (typeof ttlOrType === 'string') {
        cacheType = ttlOrType;
        // Validate cache type exists
        if (!caches[cacheType]) {
          console.warn(`❌ Invalid cache type: ${cacheType}, using default 'api' cache`);
          cacheType = 'api';
        }
        ttl = caches[cacheType].options.stdTTL || 300;
      } else if (typeof ttlOrType === 'number') {
        // If a number is passed, use it as custom TTL with api cache
        ttl = ttlOrType;
        cacheType = 'api';
      }

      console.log(`🔧 Using cache: type="${cacheType}", ttl=${ttl}s for ${req.method} ${req.originalUrl}`);

      // Generate cache key
      const key = keyGenerator 
        ? keyGenerator(req) 
        : `${req.method}:${req.originalUrl}`;

      // Try to get cached response
      const cachedResponse = caches[cacheType].get(key);
      
      if (cachedResponse) {
        console.log(`🎯 Cache HIT for: ${key}`);
        // Add cache headers
        res.set({
          'X-Cache': 'HIT',
          'X-Cache-Key': key,
          'X-Cache-TTL': ttl
        });
        
        return res.json(cachedResponse);
      }      console.log(`📝 Cache MISS for: ${key}`);
      // Store original res.json function
      const originalJson = res.json;
      
      // Override res.json to cache the response
      res.json = function(data) {
        try {
          // Only cache successful responses
          if (res.statusCode >= 200 && res.statusCode < 300) {
            // Use custom TTL if number was passed, otherwise use cache default
            if (typeof ttlOrType === 'number') {
              caches[cacheType].set(key, data, ttl);
            } else {
              caches[cacheType].set(key, data);
            }
            console.log(`💾 Cached response for: ${key} (TTL: ${ttl}s)`);
          }
          
          // Add cache headers
          res.set({
            'X-Cache': 'MISS',
            'X-Cache-Key': key,
            'X-Cache-TTL': ttl
          });
          
          // Call original json method
          originalJson.call(this, data);
        } catch (cacheError) {
          console.error('❌ Cache error:', cacheError);
          // Ensure original method is called even on error
          originalJson.call(this, data);
        }
      };

      next();
      
    } catch (error) {
      console.error('❌ Cache middleware error:', error);
      // Continue without caching on error
      next();
    }
  };
};

// Specific cache middleware for different routes
const apiCache = createCacheMiddleware('api');
const postsCache = createCacheMiddleware('posts', (req) => `posts:${req.originalUrl}`);
const staticCache = createCacheMiddleware('static');
const aiCache = createCacheMiddleware('ai', (req) => `ai:${req.body ? JSON.stringify(req.body) : req.originalUrl}`);

// Cache invalidation helpers
const invalidateCache = {
  // Invalidate all post-related caches
  posts: () => {
    caches.posts.flushAll();
    caches.api.del('GET:/api/posts');
    caches.api.del('GET:/api/blog-html');
  },
  
  // Invalidate specific post cache
  post: (id) => {
    caches.posts.del(`posts:GET:/api/posts/${id}`);
    caches.posts.flushAll(); // Also clear all posts cache
  },
  
  // Invalidate AI cache
  ai: () => {
    caches.ai.flushAll();
  },
  
  // Invalidate all caches
  all: () => {
    Object.values(caches).forEach(cache => cache.flushAll());
  }
};

// Cache statistics
const getCacheStats = () => {
  const stats = {};
  
  Object.keys(caches).forEach(cacheType => {
    const cache = caches[cacheType];
    stats[cacheType] = {
      keys: cache.keys().length,
      hits: cache.getStats().hits,
      misses: cache.getStats().misses,
      errors: cache.getStats().errors,
      hitRate: cache.getStats().hits / (cache.getStats().hits + cache.getStats().misses) || 0
    };
  });
  
  return stats;
};

// Cache warming - preload frequently accessed data
const warmCache = async (dataLoader) => {
  try {
    if (typeof dataLoader.posts === 'function') {
      const posts = await dataLoader.posts();
      caches.posts.set('posts:GET:/api/posts', posts);
    }
    
    if (typeof dataLoader.analytics === 'function') {
      const analytics = await dataLoader.analytics();
      caches.api.set('GET:/api/analytics', analytics);
    }
    
    console.log('✅ Cache warmed successfully');
  } catch (error) {
    console.error('❌ Cache warming failed:', error);
  }
};

// Cache health check
const isCacheHealthy = () => {
  try {
    // Test each cache instance
    for (const [type, cache] of Object.entries(caches)) {
      const testKey = `health_test_${type}`;
      const testValue = { test: true, timestamp: Date.now() };
      
      // Try to set and get a test value
      cache.set(testKey, testValue, 1); // 1 second TTL
      const retrieved = cache.get(testKey);
      cache.del(testKey); // Clean up
      
      if (!retrieved || retrieved.test !== true) {
        console.warn(`❌ Cache health check failed for: ${type}`);
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error('❌ Cache health check error:', error);
    return false;
  }
};

// Initialize cache health monitoring
const initializeCacheMonitoring = () => {
  console.log('🔍 Initializing cache monitoring...');
  
  // Check cache health on startup
  const isHealthy = isCacheHealthy();
  console.log(`📊 Cache health status: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);
  
  // Log cache configuration
  Object.entries(caches).forEach(([type, cache]) => {
    console.log(`📦 Cache [${type}]: TTL=${cache.options.stdTTL}s, Keys=${cache.keys().length}`);
  });
};

module.exports = {
  // Cache instances
  caches,
  
  // Pre-configured middleware
  apiCache,
  postsCache,
  staticCache,
  aiCache,
  
  // Factory function
  createCacheMiddleware,
  cacheMiddleware: createCacheMiddleware, // Alias for convenience
    // Utility functions
  invalidateCache,
  clearCache: invalidateCache, // Alias for convenience
  getCacheStats,
  warmCache,
  isCacheHealthy,
  initializeCacheMonitoring
};
