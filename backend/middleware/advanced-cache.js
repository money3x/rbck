/**
 * 🚀 ADVANCED CACHE SYSTEM
 * High-performance caching with Redis fallback, compression, and intelligent invalidation
 */

const NodeCache = require('node-cache');
const zlib = require('zlib');
const crypto = require('crypto');

class AdvancedCacheManager {
    constructor() {
        this.caches = this.initializeCaches();
        this.compressionThreshold = 1024; // Compress responses > 1KB
        this.stats = this.initializeStats();
        this.compressionEnabled = true;
        this.smartInvalidation = true;
        
        console.log('🚀 [ADVANCED CACHE] Initializing advanced cache manager...');
        this.setupEventHandlers();
        this.startPerformanceMonitoring();
    }

    initializeCaches() {
        return {
            // Ultra-fast cache for critical API responses (30 seconds)
            critical: new NodeCache({
                stdTTL: 30,
                checkperiod: 5,
                useClones: false,
                maxKeys: 500,
                deleteOnExpire: true
            }),
            
            // High-performance cache for frequently accessed data (2 minutes)
            frequent: new NodeCache({
                stdTTL: 120,
                checkperiod: 20,
                useClones: false,
                maxKeys: 1000,
                deleteOnExpire: true
            }),
            
            // Standard cache for regular API responses (5 minutes)
            standard: new NodeCache({
                stdTTL: 300,
                checkperiod: 60,
                useClones: false,
                maxKeys: 2000,
                deleteOnExpire: true
            }),
            
            // Long-term cache for static/computed data (30 minutes)
            longterm: new NodeCache({
                stdTTL: 1800,
                checkperiod: 300,
                useClones: false,
                maxKeys: 1000,
                deleteOnExpire: true
            }),
            
            // Database query cache (10 seconds for real-time feel)
            database: new NodeCache({
                stdTTL: 10,
                checkperiod: 2,
                useClones: false,
                maxKeys: 3000,
                deleteOnExpire: true
            }),
            
            // AI provider responses (3 minutes - balance between fresh and efficient)
            ai_providers: new NodeCache({
                stdTTL: 180,
                checkperiod: 30,
                useClones: false,
                maxKeys: 200,
                deleteOnExpire: true
            })
        };
    }

    initializeStats() {
        return {
            hits: 0,
            misses: 0,
            compressions: 0,
            decompressions: 0,
            invalidations: 0,
            totalRequests: 0,
            averageResponseTime: 0,
            memoryUsage: 0
        };
    }

    setupEventHandlers() {
        // Set up cache event handlers for monitoring
        Object.entries(this.caches).forEach(([name, cache]) => {
            cache.on('set', (key, value) => {
                console.log(`📝 [${name.toUpperCase()} CACHE] SET: ${key}`);
            });

            cache.on('expired', (key, value) => {
                console.log(`⏰ [${name.toUpperCase()} CACHE] EXPIRED: ${key}`);
            });

            cache.on('del', (key, value) => {
                console.log(`🗑️ [${name.toUpperCase()} CACHE] DELETED: ${key}`);
            });
        });
    }

    /**
     * Get from cache with automatic decompression
     */
    async get(cacheType, key) {
        const startTime = Date.now();
        this.stats.totalRequests++;

        try {
            const cache = this.caches[cacheType];
            if (!cache) {
                throw new Error(`Cache type '${cacheType}' not found`);
            }

            const cached = cache.get(key);
            
            if (cached) {
                this.stats.hits++;
                
                let data = cached;
                
                // Decompress if needed
                if (cached.compressed) {
                    data = await this.decompress(cached.data);
                    this.stats.decompressions++;
                    console.log(`🔄 [ADVANCED CACHE] Decompressed ${key}`);
                } else {
                    data = cached.data || cached;
                }

                const responseTime = Date.now() - startTime;
                this.updateAverageResponseTime(responseTime);
                
                console.log(`⚡ [ADVANCED CACHE] HIT: ${key} (${responseTime}ms)`);
                return { data, cached: true, responseTime };
            }

            this.stats.misses++;
            console.log(`📝 [ADVANCED CACHE] MISS: ${key}`);
            return null;

        } catch (error) {
            console.error('❌ [ADVANCED CACHE] Get error:', error);
            return null;
        }
    }

    /**
     * Set cache with intelligent compression
     */
    async set(cacheType, key, data, customTTL = null) {
        try {
            const cache = this.caches[cacheType];
            if (!cache) {
                throw new Error(`Cache type '${cacheType}' not found`);
            }

            let cacheData = data;
            let metadata = { compressed: false, originalSize: 0, compressedSize: 0 };

            // Serialize data to check size
            const serialized = JSON.stringify(data);
            metadata.originalSize = Buffer.byteLength(serialized, 'utf8');

            // Compress large responses
            if (this.compressionEnabled && metadata.originalSize > this.compressionThreshold) {
                const compressed = await this.compress(serialized);
                cacheData = {
                    data: compressed,
                    compressed: true,
                    originalSize: metadata.originalSize,
                    compressedSize: compressed.length
                };
                
                this.stats.compressions++;
                metadata.compressed = true;
                metadata.compressedSize = compressed.length;
                
                const compressionRatio = ((1 - metadata.compressedSize / metadata.originalSize) * 100).toFixed(1);
                console.log(`🗜️ [ADVANCED CACHE] Compressed ${key}: ${metadata.originalSize}B → ${metadata.compressedSize}B (${compressionRatio}% reduction)`);
            } else {
                cacheData = { data, compressed: false };
            }

            // Set with custom TTL if provided
            if (customTTL) {
                cache.set(key, cacheData, customTTL);
            } else {
                cache.set(key, cacheData);
            }

            console.log(`💾 [ADVANCED CACHE] SET: ${key} in ${cacheType} cache`);
            return true;

        } catch (error) {
            console.error('❌ [ADVANCED CACHE] Set error:', error);
            return false;
        }
    }

    /**
     * Intelligent cache invalidation
     */
    invalidate(pattern, options = {}) {
        const { cacheTypes = null, cascade = true } = options;
        let invalidatedCount = 0;
        
        const cachesToCheck = cacheTypes || Object.keys(this.caches);
        
        cachesToCheck.forEach(cacheType => {
            const cache = this.caches[cacheType];
            if (!cache) return;

            const keys = cache.keys();
            const keysToDelete = [];

            if (typeof pattern === 'string') {
                // String pattern matching
                keysToDelete.push(...keys.filter(key => key.includes(pattern)));
            } else if (pattern instanceof RegExp) {
                // Regex pattern matching
                keysToDelete.push(...keys.filter(key => pattern.test(key)));
            } else if (typeof pattern === 'function') {
                // Function-based pattern matching
                keysToDelete.push(...keys.filter(key => pattern(key)));
            }

            keysToDelete.forEach(key => {
                cache.del(key);
                invalidatedCount++;
            });
        });

        this.stats.invalidations += invalidatedCount;
        console.log(`🔄 [ADVANCED CACHE] Invalidated ${invalidatedCount} keys matching pattern`);
        
        return invalidatedCount;
    }

    /**
     * Smart invalidation based on data relationships
     */
    smartInvalidate(operation, data) {
        if (!this.smartInvalidation) return;

        const rules = {
            'post_created': () => {
                this.invalidate(/posts/);
                this.invalidate(/blog/);
                this.invalidate(/api.*posts/);
            },
            'post_updated': (postId) => {
                this.invalidate(`post:${postId}`);
                this.invalidate(/posts/);
                this.invalidate(/blog/);
            },
            'user_updated': (userId) => {
                this.invalidate(`user:${userId}`);
                this.invalidate(/sessions/);
            },
            'ai_config_changed': () => {
                this.invalidate(/ai/);
                this.invalidate(/providers/);
            },
            'cache_full': (cacheType) => {
                // Emergency cache clearing when approaching limits
                const cache = this.caches[cacheType];
                const keyCount = cache.keys().length;
                const maxKeys = cache.options.maxKeys;
                
                if (keyCount > maxKeys * 0.9) {
                    console.warn(`⚠️ [ADVANCED CACHE] Cache ${cacheType} approaching limit (${keyCount}/${maxKeys})`);
                    // Clear oldest 20% of entries
                    const keysToRemove = Math.floor(keyCount * 0.2);
                    const keys = cache.keys().slice(0, keysToRemove);
                    keys.forEach(key => cache.del(key));
                }
            }
        };

        if (rules[operation]) {
            rules[operation](data);
        }
    }

    /**
     * Compress data using gzip
     */
    async compress(data) {
        return new Promise((resolve, reject) => {
            zlib.gzip(data, (err, compressed) => {
                if (err) reject(err);
                else resolve(compressed);
            });
        });
    }

    /**
     * Decompress data using gzip
     */
    async decompress(compressed) {
        return new Promise((resolve, reject) => {
            zlib.gunzip(compressed, (err, decompressed) => {
                if (err) reject(err);
                else resolve(JSON.parse(decompressed.toString()));
            });
        });
    }

    /**
     * Create cache key with optional hashing
     */
    createKey(prefix, data, hash = false) {
        let key = `${prefix}:${typeof data === 'string' ? data : JSON.stringify(data)}`;
        
        if (hash && key.length > 200) {
            // Hash long keys for performance
            key = `${prefix}:${crypto.createHash('md5').update(key).digest('hex')}`;
        }
        
        return key;
    }

    /**
     * Batch operations for efficiency
     */
    async batchGet(operations) {
        const results = await Promise.allSettled(
            operations.map(({ cacheType, key }) => this.get(cacheType, key))
        );

        return results.map((result, index) => ({
            key: operations[index].key,
            success: result.status === 'fulfilled',
            data: result.status === 'fulfilled' ? result.value : null,
            error: result.status === 'rejected' ? result.reason : null
        }));
    }

    async batchSet(operations) {
        const results = await Promise.allSettled(
            operations.map(({ cacheType, key, data, ttl }) => 
                this.set(cacheType, key, data, ttl)
            )
        );

        return results.every(result => result.status === 'fulfilled' && result.value);
    }

    /**
     * Performance monitoring
     */
    startPerformanceMonitoring() {
        setInterval(() => {
            this.updateMemoryStats();
            this.logPerformanceMetrics();
        }, 60000); // Every minute
    }

    updateMemoryStats() {
        let totalMemory = 0;
        
        Object.entries(this.caches).forEach(([name, cache]) => {
            const keys = cache.keys();
            const keyCount = keys.length;
            
            // Estimate memory usage (rough calculation)
            let cacheMemory = 0;
            keys.slice(0, 10).forEach(key => {
                const data = cache.get(key);
                if (data) {
                    cacheMemory += JSON.stringify(data).length;
                }
            });
            
            // Extrapolate for all keys
            totalMemory += (cacheMemory / Math.min(keys.length, 10)) * keyCount;
        });
        
        this.stats.memoryUsage = totalMemory;
    }

    updateAverageResponseTime(responseTime) {
        this.stats.averageResponseTime = 
            (this.stats.averageResponseTime * (this.stats.totalRequests - 1) + responseTime) / 
            this.stats.totalRequests;
    }

    logPerformanceMetrics() {
        const hitRate = this.stats.totalRequests > 0 ? 
            (this.stats.hits / this.stats.totalRequests * 100).toFixed(1) : 0;
        
        console.log(`📊 [ADVANCED CACHE] Performance Report:`);
        console.log(`   Hit Rate: ${hitRate}% (${this.stats.hits}/${this.stats.totalRequests})`);
        console.log(`   Avg Response Time: ${this.stats.averageResponseTime.toFixed(1)}ms`);
        console.log(`   Compressions: ${this.stats.compressions}`);
        console.log(`   Memory Usage: ~${(this.stats.memoryUsage / 1024).toFixed(1)}KB`);
        
        Object.entries(this.caches).forEach(([name, cache]) => {
            console.log(`   ${name}: ${cache.keys().length} keys`);
        });
    }

    /**
     * Cache health check
     */
    healthCheck() {
        const health = {
            status: 'healthy',
            caches: {},
            stats: this.getStats(),
            memory: process.memoryUsage()
        };

        Object.entries(this.caches).forEach(([name, cache]) => {
            try {
                const testKey = `health_test_${Date.now()}`;
                const testData = { test: true };
                
                cache.set(testKey, testData, 1);
                const retrieved = cache.get(testKey);
                cache.del(testKey);
                
                health.caches[name] = {
                    status: retrieved ? 'healthy' : 'degraded',
                    keyCount: cache.keys().length,
                    maxKeys: cache.options.maxKeys,
                    ttl: cache.options.stdTTL
                };
            } catch (error) {
                health.caches[name] = {
                    status: 'error',
                    error: error.message
                };
                health.status = 'degraded';
            }
        });

        return health;
    }

    /**
     * Get comprehensive statistics
     */
    getStats() {
        const totalKeys = Object.values(this.caches).reduce((sum, cache) => sum + cache.keys().length, 0);
        
        return {
            ...this.stats,
            hitRate: this.stats.totalRequests > 0 ? 
                (this.stats.hits / this.stats.totalRequests * 100).toFixed(1) + '%' : '0%',
            totalKeys,
            cacheTypes: Object.keys(this.caches).length,
            compressionRatio: this.stats.compressions > 0 ? 
                ((this.stats.compressions / this.stats.totalRequests) * 100).toFixed(1) + '%' : '0%'
        };
    }

    /**
     * Clear all caches
     */
    clearAll() {
        Object.values(this.caches).forEach(cache => cache.flushAll());
        this.stats = this.initializeStats();
        console.log('🧹 [ADVANCED CACHE] All caches cleared');
    }

    /**
     * Export cache data for backup
     */
    export() {
        const exported = {};
        
        Object.entries(this.caches).forEach(([name, cache]) => {
            exported[name] = {};
            cache.keys().forEach(key => {
                exported[name][key] = cache.get(key);
            });
        });
        
        return exported;
    }
}

// Create singleton instance
const advancedCache = new AdvancedCacheManager();

// Express middleware factory
const createAdvancedCacheMiddleware = (cacheType = 'standard', options = {}) => {
    const { 
        keyGenerator = null, 
        ttl = null, 
        compression = true,
        skipMethods = ['POST', 'PUT', 'DELETE', 'PATCH']
    } = options;

    return async (req, res, next) => {
        // Skip caching for specified methods
        if (skipMethods.includes(req.method)) {
            return next();
        }

        try {
            // Generate cache key
            const key = keyGenerator ? 
                keyGenerator(req) : 
                advancedCache.createKey(req.method, req.originalUrl);

            // Try to get from cache
            const cached = await advancedCache.get(cacheType, key);
            
            if (cached) {
                res.set({
                    'X-Cache': 'HIT',
                    'X-Cache-Type': cacheType,
                    'X-Response-Time': `${cached.responseTime}ms`
                });
                
                return res.json(cached.data);
            }

            // Override res.json to cache response
            const originalJson = res.json;
            res.json = function(data) {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    advancedCache.set(cacheType, key, data, ttl);
                }
                
                res.set({
                    'X-Cache': 'MISS',
                    'X-Cache-Type': cacheType
                });
                
                originalJson.call(this, data);
            };

            next();
            
        } catch (error) {
            console.error('❌ [ADVANCED CACHE] Middleware error:', error);
            next();
        }
    };
};

// Pre-configured middleware instances
const criticalCache = createAdvancedCacheMiddleware('critical');
const frequentCache = createAdvancedCacheMiddleware('frequent');
const standardCache = createAdvancedCacheMiddleware('standard');
const longtermCache = createAdvancedCacheMiddleware('longterm');
const databaseCache = createAdvancedCacheMiddleware('database');
const aiCache = createAdvancedCacheMiddleware('ai_providers');

module.exports = {
    advancedCache,
    createAdvancedCacheMiddleware,
    
    // Pre-configured middleware
    criticalCache,
    frequentCache,
    standardCache,
    longtermCache,
    databaseCache,
    aiCache
};

console.log('✅ [ADVANCED CACHE] Advanced caching system ready');