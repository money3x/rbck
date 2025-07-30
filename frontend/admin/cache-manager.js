/**
 * Advanced Cache Manager
 * Provides poe.com-style ultra-fast data access with intelligent caching
 * Multi-layer caching with TTL, LRU eviction, and memory optimization
 */

class AdvancedCacheManager {
    constructor(options = {}) {
        this.cache = new Map();
        this.timestamps = new Map();
        this.accessCount = new Map();
        this.lastAccess = new Map();
        
        // Configuration (poe.com style performance)
        this.maxSize = options.maxSize || 1000; // Max cached items
        this.defaultTTL = options.defaultTTL || 300000; // 5 minutes default
        this.cleanupInterval = options.cleanupInterval || 60000; // 1 minute cleanup
        this.hitCount = 0;
        this.missCount = 0;
        
        // Memory optimization
        this.memoryThreshold = options.memoryThreshold || 50 * 1024 * 1024; // 50MB
        this.compressionEnabled = options.compression || true;
        
        this.startCleanupTimer();
        console.log('⚡ [CACHE] Advanced cache manager initialized');
    }
    
    /**
     * Get item from cache with ultra-fast lookup
     */
    get(key, options = {}) {
        const now = Date.now();
        
        if (!this.cache.has(key)) {
            this.missCount++;
            console.log(`📭 [CACHE] MISS: ${key}`);
            return null;
        }
        
        const item = this.cache.get(key);
        const timestamp = this.timestamps.get(key);
        const ttl = options.ttl || item.ttl || this.defaultTTL;
        
        // Check expiration
        if (now - timestamp > ttl) {
            this.delete(key);
            this.missCount++;
            console.log(`⏰ [CACHE] EXPIRED: ${key}`);
            return null;
        }
        
        // Update access statistics (LRU)
        this.lastAccess.set(key, now);
        this.accessCount.set(key, (this.accessCount.get(key) || 0) + 1);
        
        this.hitCount++;
        console.log(`⚡ [CACHE] HIT: ${key} (${this.getHitRatio()}% hit rate)`);
        
        return item.data;
    }
    
    /**
     * Set item in cache with intelligent compression
     */
    set(key, data, options = {}) {
        const now = Date.now();
        const ttl = options.ttl || this.defaultTTL;
        
        // Compress large objects if enabled
        let processedData = data;
        let compressed = false;
        
        if (this.compressionEnabled && this.shouldCompress(data)) {
            processedData = this.compress(data);
            compressed = true;
        }
        
        const item = {
            data: processedData,
            ttl,
            compressed,
            size: this.calculateSize(data),
            metadata: options.metadata || {}
        };
        
        // Check memory and size limits
        if (this.cache.size >= this.maxSize) {
            this.evictLRU();
        }
        
        this.cache.set(key, item);
        this.timestamps.set(key, now);
        this.lastAccess.set(key, now);
        this.accessCount.set(key, 1);
        
        console.log(`💾 [CACHE] SET: ${key} (${item.size} bytes, TTL: ${ttl}ms, compressed: ${compressed})`);
        
        return true;
    }
    
    /**
     * Delete item from cache
     */
    delete(key) {
        const deleted = this.cache.delete(key);
        this.timestamps.delete(key);
        this.lastAccess.delete(key);
        this.accessCount.delete(key);
        
        if (deleted) {
            console.log(`🗑️ [CACHE] DELETE: ${key}`);
        }
        
        return deleted;
    }
    
    /**
     * Get or set with callback (like Redis pattern)
     */
    async getOrSet(key, fetchFunction, options = {}) {
        // Try to get from cache first
        let data = this.get(key, options);
        
        if (data !== null) {
            return data;
        }
        
        // Not in cache, fetch data
        console.log(`🔄 [CACHE] FETCHING: ${key}`);
        
        try {
            data = await fetchFunction();
            
            if (data !== null && data !== undefined) {
                this.set(key, data, options);
            }
            
            return data;
            
        } catch (error) {
            console.error(`❌ [CACHE] FETCH ERROR for ${key}:`, error);
            throw error;
        }
    }
    
    /**
     * Cache API responses with automatic key generation
     */
    async cacheApiCall(url, fetchOptions = {}, cacheOptions = {}) {
        const cacheKey = this.generateApiKey(url, fetchOptions);
        
        return this.getOrSet(cacheKey, async () => {
            const response = await fetch(url, fetchOptions);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            let data;
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }
            
            return {
                data,
                status: response.status,
                headers: Object.fromEntries(response.headers.entries()),
                timestamp: Date.now()
            };
            
        }, cacheOptions);
    }
    
    /**
     * Generate cache key for API calls
     */
    generateApiKey(url, options = {}) {
        const keyData = {
            url,
            method: options.method || 'GET',
            body: options.body,
            headers: options.headers
        };
        
        const keyString = JSON.stringify(keyData);
        return `api:${this.hashString(keyString)}`;
    }
    
    /**
     * Simple hash function for key generation
     */
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }
    
    /**
     * Check if data should be compressed
     */
    shouldCompress(data) {
        const size = this.calculateSize(data);
        return size > 1024; // Compress if larger than 1KB
    }
    
    /**
     * Simple compression (JSON stringify)
     */
    compress(data) {
        return JSON.stringify(data);
    }
    
    /**
     * Calculate approximate size of data
     */
    calculateSize(data) {
        if (typeof data === 'string') {
            return data.length * 2; // UTF-16
        }
        
        try {
            return JSON.stringify(data).length * 2;
        } catch (error) {
            return 0;
        }
    }
    
    /**
     * Evict least recently used items
     */
    evictLRU() {
        let oldestKey = null;
        let oldestTime = Infinity;
        
        for (const [key, time] of this.lastAccess.entries()) {
            if (time < oldestTime) {
                oldestTime = time;
                oldestKey = key;
            }
        }
        
        if (oldestKey) {
            console.log(`🧹 [CACHE] LRU EVICT: ${oldestKey}`);
            this.delete(oldestKey);
        }
    }
    
    /**
     * Clean up expired items
     */
    cleanup() {
        const now = Date.now();
        let cleanedCount = 0;
        
        for (const [key, timestamp] of this.timestamps.entries()) {
            const item = this.cache.get(key);
            const ttl = item?.ttl || this.defaultTTL;
            
            if (now - timestamp > ttl) {
                this.delete(key);
                cleanedCount++;
            }
        }
        
        if (cleanedCount > 0) {
            console.log(`🧹 [CACHE] Cleaned up ${cleanedCount} expired items`);
        }
    }
    
    /**
     * Start automatic cleanup timer
     */
    startCleanupTimer() {
        setInterval(() => {
            this.cleanup();
        }, this.cleanupInterval);
        
        console.log(`🕒 [CACHE] Cleanup timer started (${this.cleanupInterval}ms interval)`);
    }
    
    /**
     * Clear all cache
     */
    clear() {
        const size = this.cache.size;
        this.cache.clear();
        this.timestamps.clear();
        this.lastAccess.clear();
        this.accessCount.clear();
        
        console.log(`🧹 [CACHE] Cleared all ${size} items`);
    }
    
    /**
     * Get cache statistics
     */
    getStats() {
        const totalRequests = this.hitCount + this.missCount;
        const hitRatio = totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0;
        
        let totalSize = 0;
        for (const item of this.cache.values()) {
            totalSize += item.size || 0;
        }
        
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hitCount: this.hitCount,
            missCount: this.missCount,
            hitRatio: Math.round(hitRatio * 100) / 100,
            totalSize,
            memoryUsage: `${Math.round(totalSize / 1024)} KB`,
            uptime: Date.now() - this.startTime
        };
    }
    
    /**
     * Get hit ratio percentage
     */
    getHitRatio() {
        const total = this.hitCount + this.missCount;
        return total > 0 ? Math.round((this.hitCount / total) * 100) : 0;
    }
    
    /**
     * Set multiple items at once
     */
    setMultiple(items, options = {}) {
        const results = {};
        
        for (const [key, data] of Object.entries(items)) {
            results[key] = this.set(key, data, options);
        }
        
        console.log(`💾 [CACHE] SET MULTIPLE: ${Object.keys(items).length} items`);
        return results;
    }
    
    /**
     * Get multiple items at once
     */
    getMultiple(keys, options = {}) {
        const results = {};
        
        for (const key of keys) {
            results[key] = this.get(key, options);
        }
        
        console.log(`📦 [CACHE] GET MULTIPLE: ${keys.length} items`);
        return results;
    }
    
    /**
     * Check if key exists (without affecting LRU)
     */
    has(key) {
        return this.cache.has(key) && !this.isExpired(key);
    }
    
    /**
     * Check if key is expired
     */
    isExpired(key) {
        if (!this.cache.has(key)) return true;
        
        const timestamp = this.timestamps.get(key);
        const item = this.cache.get(key);
        const ttl = item?.ttl || this.defaultTTL;
        
        return (Date.now() - timestamp) > ttl;
    }
    
    /**
     * Update TTL for existing item
     */
    updateTTL(key, newTTL) {
        if (this.cache.has(key)) {
            const item = this.cache.get(key);
            item.ttl = newTTL;
            this.timestamps.set(key, Date.now());
            console.log(`⏰ [CACHE] TTL UPDATED: ${key} -> ${newTTL}ms`);
            return true;
        }
        return false;
    }
}

// Create singleton instance
const cacheManager = new AdvancedCacheManager({
    maxSize: 1000,
    defaultTTL: 300000, // 5 minutes
    cleanupInterval: 60000, // 1 minute
    compression: true
});

// Global access
window.cacheManager = cacheManager;

// Export for module use
export default cacheManager;

console.log('⚡ [CACHE] Advanced cache manager loaded');