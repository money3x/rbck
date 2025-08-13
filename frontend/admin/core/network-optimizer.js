/**
 * 🌐 NETWORK OPTIMIZER
 * Optimizes network requests for better performance and reliability
 */

class NetworkOptimizer {
    constructor() {
        this.requestQueue = new Map();
        this.requestCache = new Map();
        this.retryQueue = new Set();
        this.connectionStatus = 'online';
        this.bandwidthEstimate = null;
        
        this.config = {
            maxConcurrentRequests: 6,
            requestTimeout: 15000,
            retryAttempts: 3,
            retryDelay: 1000,
            batchDelay: 50,
            cacheTimeout: 60000, // 1 minute
            compressionThreshold: 1024,
            priorityLevels: {
                critical: 1,
                high: 2,
                normal: 3,
                low: 4
            }
        };

        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            cachedRequests: 0,
            retriedRequests: 0,
            totalBytes: 0,
            compressionSaved: 0,
            averageResponseTime: 0,
            networkErrors: 0
        };

        this.initialize();
    }

    initialize() {
        console.log('🌐 [NETWORK OPTIMIZER] Initializing network optimization...');
        
        // Monitor network status
        this.setupNetworkMonitoring();
        
        // Setup request batching
        this.setupRequestBatching();
        
        // Override fetch for optimization
        this.setupFetchOptimization();
        
        // Setup bandwidth estimation
        this.setupBandwidthEstimation();
        
        console.log('✅ [NETWORK OPTIMIZER] Network optimizer ready');
    }

    /**
     * Setup network status monitoring
     */
    setupNetworkMonitoring() {
        // Online/offline detection
        window.addEventListener('online', () => {
            this.connectionStatus = 'online';
            console.log('🌐 [NETWORK] Connection restored');
            this.processRetryQueue();
        });

        window.addEventListener('offline', () => {
            this.connectionStatus = 'offline';
            console.log('📱 [NETWORK] Connection lost - switching to offline mode');
        });

        // Network Information API
        if ('connection' in navigator) {
            const connection = navigator.connection;
            
            const updateConnectionInfo = () => {
                console.log(`📊 [NETWORK] Connection: ${connection.effectiveType}, Downlink: ${connection.downlink}Mbps`);
                this.bandwidthEstimate = connection.downlink;
                this.adaptToConnection(connection);
            };
            
            connection.addEventListener('change', updateConnectionInfo);
            updateConnectionInfo();
        }
    }

    /**
     * Adapt behavior based on connection quality
     */
    adaptToConnection(connection) {
        const effectiveType = connection.effectiveType;
        
        switch (effectiveType) {
            case 'slow-2g':
            case '2g':
                this.config.maxConcurrentRequests = 2;
                this.config.requestTimeout = 30000;
                this.config.batchDelay = 200;
                console.log('📱 [NETWORK] Optimized for slow connection');
                break;
                
            case '3g':
                this.config.maxConcurrentRequests = 4;
                this.config.requestTimeout = 20000;
                this.config.batchDelay = 100;
                console.log('📱 [NETWORK] Optimized for 3G connection');
                break;
                
            case '4g':
            default:
                this.config.maxConcurrentRequests = 6;
                this.config.requestTimeout = 15000;
                this.config.batchDelay = 50;
                console.log('📱 [NETWORK] Optimized for fast connection');
                break;
        }
    }

    /**
     * Setup request batching system
     */
    setupRequestBatching() {
        this.batchProcessor = setInterval(() => {
            this.processBatchedRequests();
        }, this.config.batchDelay);
    }

    /**
     * Process batched requests efficiently
     */
    processBatchedRequests() {
        // Group similar requests that can be batched
        const batchableRequests = this.findBatchableRequests();
        
        if (batchableRequests.length > 1) {
            console.log(`📦 [NETWORK] Batching ${batchableRequests.length} similar requests`);
            this.executeBatchRequest(batchableRequests);
        }
    }

    /**
     * Find requests that can be batched together
     */
    findBatchableRequests() {
        const pending = [];
        
        for (const [key, request] of this.requestQueue) {
            if (request.status === 'pending' && request.batchable) {
                pending.push(request);
            }
        }
        
        // Group by similar endpoints
        const groups = pending.reduce((acc, request) => {
            const baseUrl = request.url.split('?')[0];
            if (!acc[baseUrl]) acc[baseUrl] = [];
            acc[baseUrl].push(request);
            return acc;
        }, {});
        
        // Return groups with more than 1 request
        return Object.values(groups).filter(group => group.length > 1).flat();
    }

    /**
     * Execute batched request
     */
    async executeBatchRequest(requests) {
        try {
            const batchPayload = {
                requests: requests.map(req => ({
                    id: req.id,
                    method: req.options.method || 'GET',
                    url: req.url,
                    data: req.options.body
                }))
            };

            const response = await this.optimizedFetch('/api/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(batchPayload)
            });

            const results = await response.json();
            
            // Resolve individual requests with their results
            results.forEach(result => {
                const request = requests.find(req => req.id === result.id);
                if (request) {
                    request.resolve(new Response(JSON.stringify(result.data), {
                        status: result.status || 200,
                        headers: { 'Content-Type': 'application/json' }
                    }));
                    this.requestQueue.delete(request.id);
                }
            });

            console.log(`✅ [NETWORK] Batch request completed for ${requests.length} requests`);
            
        } catch (error) {
            console.error('❌ [NETWORK] Batch request failed:', error);
            
            // Fallback to individual requests
            requests.forEach(request => {
                this.executeIndividualRequest(request);
            });
        }
    }

    /**
     * Setup optimized fetch override
     */
    setupFetchOptimization() {
        const originalFetch = window.fetch;
        
        window.fetch = async (url, options = {}) => {
            return this.optimizedFetch(url, options, originalFetch);
        };
    }

    /**
     * Optimized fetch implementation
     */
    async optimizedFetch(url, options = {}, originalFetch = fetch) {
        const startTime = Date.now();
        this.stats.totalRequests++;
        
        try {
            // Check cache first
            const cacheKey = this.generateCacheKey(url, options);
            const cached = this.getFromCache(cacheKey);
            
            if (cached) {
                this.stats.cachedRequests++;
                console.log(`⚡ [NETWORK] Cache hit: ${url}`);
                return cached;
            }

            // Check if offline
            if (this.connectionStatus === 'offline') {
                throw new Error('Network offline');
            }

            // Add optimization headers
            const optimizedOptions = this.addOptimizationHeaders(options);
            
            // Add request timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeout);
            
            optimizedOptions.signal = controller.signal;

            // Execute request with retry logic
            const response = await this.executeWithRetry(
                () => originalFetch(url, optimizedOptions),
                this.config.retryAttempts
            );

            clearTimeout(timeoutId);

            // Cache successful responses
            if (response.ok && options.method !== 'POST') {
                this.cacheResponse(cacheKey, response.clone());
            }

            // Update stats
            const responseTime = Date.now() - startTime;
            this.updateStats(true, responseTime, response);
            
            console.log(`✅ [NETWORK] Request completed: ${url} (${responseTime}ms)`);
            return response;

        } catch (error) {
            const responseTime = Date.now() - startTime;
            this.updateStats(false, responseTime);
            
            console.error(`❌ [NETWORK] Request failed: ${url} (${responseTime}ms)`, error);
            
            // Try to serve from cache as fallback
            const cacheKey = this.generateCacheKey(url, options);
            const staleCache = this.getFromCache(cacheKey, true);
            
            if (staleCache) {
                console.log(`🔄 [NETWORK] Serving stale cache for: ${url}`);
                this.stats.cachedRequests++;
                return staleCache;
            }

            throw error;
        }
    }

    /**
     * Add optimization headers to requests
     */
    addOptimizationHeaders(options) {
        const headers = {
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'max-age=60',
            ...options.headers
        };

        // Add compression hints for large payloads
        if (options.body && typeof options.body === 'string' && 
            options.body.length > this.config.compressionThreshold) {
            headers['Content-Encoding'] = 'gzip';
        }

        // Add network hint headers
        if (this.bandwidthEstimate) {
            headers['Save-Data'] = this.bandwidthEstimate < 1 ? '1' : '0';
        }

        return { ...options, headers };
    }

    /**
     * Execute request with retry logic
     */
    async executeWithRetry(requestFn, maxRetries) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await requestFn();
                
                if (response.ok) {
                    return response;
                }
                
                // Don't retry client errors (4xx)
                if (response.status >= 400 && response.status < 500) {
                    return response;
                }
                
                throw new Error(`HTTP ${response.status}`);
                
            } catch (error) {
                lastError = error;
                
                if (attempt < maxRetries) {
                    const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
                    console.log(`🔄 [NETWORK] Retry attempt ${attempt}/${maxRetries} in ${delay}ms`);
                    
                    await new Promise(resolve => setTimeout(resolve, delay));
                    this.stats.retriedRequests++;
                } else {
                    break;
                }
            }
        }
        
        throw lastError;
    }

    /**
     * Generate cache key for requests
     */
    generateCacheKey(url, options) {
        const method = options.method || 'GET';
        const body = options.body || '';
        const headers = JSON.stringify(options.headers || {});
        
        return `${method}:${url}:${btoa(body)}:${btoa(headers)}`;
    }

    /**
     * Get response from cache
     */
    getFromCache(cacheKey, allowStale = false) {
        const cached = this.requestCache.get(cacheKey);
        
        if (!cached) return null;
        
        const age = Date.now() - cached.timestamp;
        const isStale = age > this.config.cacheTimeout;
        
        if (isStale && !allowStale) {
            this.requestCache.delete(cacheKey);
            return null;
        }
        
        // Clone response to avoid consuming the stream
        return cached.response.clone();
    }

    /**
     * Cache response
     */
    cacheResponse(cacheKey, response) {
        // Don't cache large responses
        const contentLength = response.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > 1024 * 1024) { // 1MB
            return;
        }
        
        this.requestCache.set(cacheKey, {
            response,
            timestamp: Date.now()
        });
        
        // Cleanup old cache entries
        if (this.requestCache.size > 100) {
            const oldestKey = this.requestCache.keys().next().value;
            this.requestCache.delete(oldestKey);
        }
    }

    /**
     * Setup bandwidth estimation
     */
    setupBandwidthEstimation() {
        // Simple bandwidth estimation using small requests
        this.estimateBandwidth();
        
        // Re-estimate periodically
        setInterval(() => {
            this.estimateBandwidth();
        }, 300000); // Every 5 minutes
    }

    /**
     * Estimate available bandwidth
     */
    async estimateBandwidth() {
        if (!('performance' in window)) return;
        
        try {
            const startTime = Date.now();
            const response = await fetch('/api/ping?t=' + startTime, {
                method: 'HEAD',
                cache: 'no-cache'
            });
            
            if (response.ok) {
                const endTime = Date.now();
                const duration = endTime - startTime;
                
                // Estimate bandwidth (very rough calculation)
                const estimatedBandwidth = 1000 / duration; // MB/s
                
                if (this.bandwidthEstimate === null) {
                    this.bandwidthEstimate = estimatedBandwidth;
                } else {
                    // Exponential moving average
                    this.bandwidthEstimate = 0.7 * this.bandwidthEstimate + 0.3 * estimatedBandwidth;
                }
                
                console.log(`📊 [NETWORK] Estimated bandwidth: ${this.bandwidthEstimate.toFixed(2)} MB/s`);
            }
        } catch (error) {
            console.warn('⚠️ [NETWORK] Bandwidth estimation failed:', error);
        }
    }

    /**
     * Process retry queue when connection is restored
     */
    processRetryQueue() {
        console.log(`🔄 [NETWORK] Processing retry queue (${this.retryQueue.size} requests)`);
        
        const requests = Array.from(this.retryQueue);
        this.retryQueue.clear();
        
        requests.forEach(async (request) => {
            try {
                const response = await this.optimizedFetch(request.url, request.options);
                request.resolve(response);
            } catch (error) {
                request.reject(error);
            }
        });
    }

    /**
     * Update network statistics
     */
    updateStats(success, responseTime, response = null) {
        if (success) {
            this.stats.successfulRequests++;
            
            // Update average response time
            this.stats.averageResponseTime = 
                (this.stats.averageResponseTime * (this.stats.successfulRequests - 1) + responseTime) / 
                this.stats.successfulRequests;
            
            // Track bytes if available
            if (response && response.headers.get('content-length')) {
                this.stats.totalBytes += parseInt(response.headers.get('content-length'));
            }
        } else {
            this.stats.failedRequests++;
            this.stats.networkErrors++;
        }
    }

    /**
     * Preload critical resources
     */
    preloadResources(urls, priority = 'low') {
        urls.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = url;
            link.setAttribute('data-priority', priority);
            document.head.appendChild(link);
            
            console.log(`🔗 [NETWORK] Preloading: ${url} (${priority})`);
        });
    }

    /**
     * Setup request prioritization
     */
    prioritizeRequest(url, options, priority = 'normal') {
        const queueEntry = {
            url,
            options,
            priority: this.config.priorityLevels[priority] || 3,
            timestamp: Date.now()
        };
        
        return new Promise((resolve, reject) => {
            queueEntry.resolve = resolve;
            queueEntry.reject = reject;
            
            this.requestQueue.set(url + Date.now(), queueEntry);
            this.processRequestQueue();
        });
    }

    /**
     * Process request queue with priority
     */
    processRequestQueue() {
        const activeRequests = Array.from(this.requestQueue.values())
            .filter(req => req.status === 'active').length;
        
        if (activeRequests >= this.config.maxConcurrentRequests) {
            return;
        }
        
        // Sort by priority and age
        const pending = Array.from(this.requestQueue.entries())
            .filter(([key, req]) => req.status !== 'active')
            .sort(([, a], [, b]) => {
                if (a.priority !== b.priority) {
                    return a.priority - b.priority; // Lower number = higher priority
                }
                return a.timestamp - b.timestamp; // Older first
            });
        
        const toProcess = pending.slice(0, this.config.maxConcurrentRequests - activeRequests);
        
        toProcess.forEach(([key, request]) => {
            request.status = 'active';
            this.executeIndividualRequest(request)
                .finally(() => {
                    this.requestQueue.delete(key);
                    this.processRequestQueue(); // Process next in queue
                });
        });
    }

    /**
     * Execute individual request
     */
    async executeIndividualRequest(request) {
        try {
            const response = await this.optimizedFetch(request.url, request.options);
            request.resolve(response);
        } catch (error) {
            request.reject(error);
        }
    }

    /**
     * Clear network cache
     */
    clearCache() {
        this.requestCache.clear();
        console.log('🧹 [NETWORK] Cache cleared');
    }

    /**
     * Get network optimization statistics
     */
    getStats() {
        return {
            ...this.stats,
            connectionStatus: this.connectionStatus,
            bandwidthEstimate: this.bandwidthEstimate,
            cacheSize: this.requestCache.size,
            queueSize: this.requestQueue.size,
            retryQueueSize: this.retryQueue.size,
            successRate: this.stats.totalRequests > 0 ? 
                (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(1) + '%' : '0%',
            cacheHitRate: this.stats.totalRequests > 0 ? 
                (this.stats.cachedRequests / this.stats.totalRequests * 100).toFixed(1) + '%' : '0%'
        };
    }

    /**
     * Generate network optimization report
     */
    generateReport() {
        const stats = this.getStats();
        
        console.group('🌐 [NETWORK OPTIMIZER] Report');
        console.log('Connection Status:', stats.connectionStatus);
        console.log('Bandwidth Estimate:', stats.bandwidthEstimate?.toFixed(2) + ' MB/s' || 'Unknown');
        console.log('Total Requests:', stats.totalRequests);
        console.log('Success Rate:', stats.successRate);
        console.log('Cache Hit Rate:', stats.cacheHitRate);
        console.log('Average Response Time:', stats.averageResponseTime.toFixed(2) + 'ms');
        console.log('Total Bytes:', this.formatBytes(stats.totalBytes));
        console.log('Queue Sizes:', {
            active: stats.queueSize,
            retry: stats.retryQueueSize,
            cache: stats.cacheSize
        });
        console.groupEnd();
        
        return stats;
    }

    /**
     * Format bytes helper
     */
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    /**
     * Cleanup resources
     */
    destroy() {
        if (this.batchProcessor) {
            clearInterval(this.batchProcessor);
        }
        
        this.requestQueue.clear();
        this.requestCache.clear();
        this.retryQueue.clear();
        
        console.log('🧹 [NETWORK OPTIMIZER] Destroyed');
    }
}

// Create global instance
window.networkOptimizer = new NetworkOptimizer();

// Global debugging functions
window.networkReport = () => window.networkOptimizer.generateReport();
window.clearNetworkCache = () => window.networkOptimizer.clearCache();
window.preloadResources = (urls, priority) => window.networkOptimizer.preloadResources(urls, priority);

console.log('✅ [NETWORK OPTIMIZER] Network optimization system ready');