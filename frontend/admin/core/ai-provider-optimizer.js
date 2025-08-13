/**
 * 🚀 AI PROVIDER OPTIMIZER
 * Optimizes AI provider interactions for maximum efficiency
 */

class AIProviderOptimizer {
    constructor() {
        this.providers = ['gemini', 'openai', 'claude', 'deepseek', 'chinda'];
        this.cache = new Map();
        this.requestQueue = new Map();
        this.circuitBreakers = new Map();
        
        this.config = {
            cacheTimeout: 300000,     // 5 minutes
            requestTimeout: 10000,    // 10 seconds
            maxRetries: 3,
            batchDelay: 100,          // 100ms batching window
            circuitBreakerThreshold: 5,
            circuitBreakerTimeout: 60000, // 1 minute
            poolSize: 3,              // Max concurrent requests per provider
            priorityLevels: {
                'high': 1,
                'medium': 2,
                'low': 3
            }
        };

        this.stats = {
            requests: 0,
            cacheHits: 0,
            cacheMisses: 0,
            failures: 0,
            avgResponseTime: 0,
            totalResponseTime: 0
        };

        this.initialize();
    }

    initialize() {
        console.log('🚀 [AI OPTIMIZER] Initializing AI provider optimizer...');
        
        // Initialize circuit breakers
        this.initializeCircuitBreakers();
        
        // Setup request batching
        this.setupRequestBatching();
        
        // Initialize provider pools
        this.initializeProviderPools();
        
        console.log('✅ [AI OPTIMIZER] AI provider optimizer ready');
    }

    /**
     * Initialize circuit breakers for each provider
     */
    initializeCircuitBreakers() {
        this.providers.forEach(provider => {
            this.circuitBreakers.set(provider, {
                state: 'CLOSED',     // CLOSED, OPEN, HALF_OPEN
                failures: 0,
                lastFailure: null,
                nextRetry: null
            });
        });
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
     * Initialize provider connection pools
     */
    initializeProviderPools() {
        this.providers.forEach(provider => {
            this.requestQueue.set(provider, {
                pending: [],
                active: 0,
                maxConcurrent: this.config.poolSize
            });
        });
    }

    /**
     * Optimized provider status check with caching and circuit breaking
     */
    async checkProviderStatus(provider, options = {}) {
        const {
            useCache = true,
            priority = 'medium',
            timeout = this.config.requestTimeout
        } = options;

        console.log(`🔍 [AI OPTIMIZER] Checking ${provider} status (priority: ${priority})`);
        
        // Check circuit breaker
        if (this.isCircuitOpen(provider)) {
            console.warn(`⚡ [AI OPTIMIZER] Circuit breaker OPEN for ${provider}`);
            return { success: false, error: 'Circuit breaker open', cached: false };
        }

        // Check cache first
        if (useCache) {
            const cached = this.getFromCache(provider, 'status');
            if (cached) {
                this.stats.cacheHits++;
                console.log(`⚡ [AI OPTIMIZER] Cache hit for ${provider} status`);
                return { ...cached, cached: true };
            }
        }

        this.stats.cacheMisses++;
        return this.executeProviderRequest(provider, 'status', { timeout, priority });
    }

    /**
     * Execute provider request with optimization
     */
    async executeProviderRequest(provider, operation, options = {}) {
        const startTime = Date.now();
        const { timeout, priority = 'medium' } = options;
        
        try {
            // Add to request queue
            const result = await this.queueRequest(provider, {
                operation,
                timeout,
                priority,
                timestamp: startTime
            });

            // Update stats
            const responseTime = Date.now() - startTime;
            this.updateStats(true, responseTime);
            this.updateCircuitBreaker(provider, true);

            // Cache successful results
            if (result.success) {
                this.cacheResult(provider, operation, result);
            }

            console.log(`✅ [AI OPTIMIZER] ${provider} ${operation} completed (${responseTime}ms)`);
            return result;

        } catch (error) {
            const responseTime = Date.now() - startTime;
            console.error(`❌ [AI OPTIMIZER] ${provider} ${operation} failed:`, error);
            
            this.updateStats(false, responseTime);
            this.updateCircuitBreaker(provider, false);
            
            return {
                success: false,
                error: error.message,
                responseTime,
                cached: false
            };
        }
    }

    /**
     * Queue request with priority and concurrency management
     */
    async queueRequest(provider, requestData) {
        const queue = this.requestQueue.get(provider);
        
        if (queue.active >= queue.maxConcurrent) {
            // Add to pending queue
            return new Promise((resolve, reject) => {
                queue.pending.push({
                    resolve,
                    reject,
                    ...requestData
                });
                
                // Sort by priority
                queue.pending.sort((a, b) => 
                    this.config.priorityLevels[a.priority] - this.config.priorityLevels[b.priority]
                );
            });
        }

        // Execute immediately
        queue.active++;
        
        try {
            const result = await this.executeRequest(provider, requestData);
            this.processNextInQueue(provider);
            return result;
        } catch (error) {
            this.processNextInQueue(provider);
            throw error;
        }
    }

    /**
     * Process next request in queue
     */
    processNextInQueue(provider) {
        const queue = this.requestQueue.get(provider);
        queue.active--;

        if (queue.pending.length > 0 && queue.active < queue.maxConcurrent) {
            const nextRequest = queue.pending.shift();
            queue.active++;
            
            this.executeRequest(provider, nextRequest)
                .then(result => {
                    nextRequest.resolve(result);
                    this.processNextInQueue(provider);
                })
                .catch(error => {
                    nextRequest.reject(error);
                    this.processNextInQueue(provider);
                });
        }
    }

    /**
     * Execute actual request
     */
    async executeRequest(provider, { operation, timeout }) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            let response;
            const apiBase = window.__API_BASE__ || 'https://rbck.onrender.com/api';

            switch (operation) {
                case 'status':
                    response = await this.fetchProviderStatus(provider, controller.signal, apiBase);
                    break;
                case 'test':
                    response = await this.testProvider(provider, controller.signal, apiBase);
                    break;
                case 'metrics':
                    response = await this.fetchProviderMetrics(provider, controller.signal, apiBase);
                    break;
                default:
                    throw new Error(`Unknown operation: ${operation}`);
            }

            clearTimeout(timeoutId);
            return response;

        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            
            throw error;
        }
    }

    /**
     * Fetch provider status optimized
     */
    async fetchProviderStatus(provider, signal, apiBase) {
        const response = await fetch(`${apiBase}/ai/metrics`, {
            method: 'GET',
            signal,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Cache-Control': 'max-age=60' // 1 minute cache hint
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.success || !data.metrics) {
            throw new Error('Invalid response format');
        }

        const providerData = data.metrics[provider];
        if (!providerData) {
            return {
                success: false,
                connected: false,
                configured: false,
                error: 'Provider not found in response'
            };
        }

        return {
            success: true,
            connected: providerData.isActive && providerData.configured,
            configured: providerData.configured,
            isActive: providerData.isActive,
            status: providerData.status,
            responseTime: providerData.averageResponseTime,
            successRate: providerData.successRate,
            uptime: providerData.uptime
        };
    }

    /**
     * Test provider with retry logic
     */
    async testProvider(provider, signal, apiBase) {
        const maxRetries = this.config.maxRetries;
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await fetch(`${apiBase}/ai/test/${provider}`, {
                    method: 'POST',
                    signal,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ test: true })
                });

                const result = await response.json();
                
                if (result.success) {
                    return {
                        success: true,
                        responseTime: result.responseTime,
                        attempt
                    };
                }
                
                throw new Error(result.error || 'Test failed');

            } catch (error) {
                lastError = error;
                
                if (attempt < maxRetries) {
                    // Exponential backoff
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    break;
                }
            }
        }

        throw new Error(`Test failed after ${maxRetries} attempts: ${lastError.message}`);
    }

    /**
     * Fetch provider metrics
     */
    async fetchProviderMetrics(provider, signal, apiBase) {
        const response = await fetch(`${apiBase}/ai/metrics/${provider}`, {
            method: 'GET',
            signal,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        return await response.json();
    }

    /**
     * Cache management
     */
    getFromCache(provider, operation) {
        const key = `${provider}:${operation}`;
        const cached = this.cache.get(key);
        
        if (cached && (Date.now() - cached.timestamp) < this.config.cacheTimeout) {
            return cached.data;
        }
        
        if (cached) {
            this.cache.delete(key);
        }
        
        return null;
    }

    cacheResult(provider, operation, data) {
        const key = `${provider}:${operation}`;
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Circuit breaker management
     */
    isCircuitOpen(provider) {
        const breaker = this.circuitBreakers.get(provider);
        
        if (breaker.state === 'OPEN') {
            // Check if we should try half-open
            if (Date.now() > breaker.nextRetry) {
                breaker.state = 'HALF_OPEN';
                console.log(`🔄 [AI OPTIMIZER] Circuit breaker HALF_OPEN for ${provider}`);
                return false;
            }
            return true;
        }
        
        return false;
    }

    updateCircuitBreaker(provider, success) {
        const breaker = this.circuitBreakers.get(provider);
        
        if (success) {
            // Reset on success
            if (breaker.state === 'HALF_OPEN') {
                breaker.state = 'CLOSED';
                console.log(`✅ [AI OPTIMIZER] Circuit breaker CLOSED for ${provider}`);
            }
            breaker.failures = 0;
        } else {
            breaker.failures++;
            breaker.lastFailure = Date.now();
            
            if (breaker.failures >= this.config.circuitBreakerThreshold) {
                breaker.state = 'OPEN';
                breaker.nextRetry = Date.now() + this.config.circuitBreakerTimeout;
                console.warn(`⚡ [AI OPTIMIZER] Circuit breaker OPEN for ${provider} (${breaker.failures} failures)`);
            }
        }
    }

    /**
     * Batch processing for multiple provider status checks
     */
    async checkAllProvidersStatus(options = {}) {
        console.log('🚀 [AI OPTIMIZER] Checking all providers status (batched)...');
        
        const promises = this.providers.map(async provider => {
            try {
                const result = await this.checkProviderStatus(provider, options);
                return { provider, ...result };
            } catch (error) {
                return {
                    provider,
                    success: false,
                    error: error.message,
                    cached: false
                };
            }
        });

        const results = await Promise.allSettled(promises);
        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        
        console.log(`✅ [AI OPTIMIZER] Batch status check completed: ${successful}/${this.providers.length} providers`);
        
        return results.map(result => 
            result.status === 'fulfilled' ? result.value : {
                provider: 'unknown',
                success: false,
                error: result.reason?.message || 'Unknown error'
            }
        );
    }

    /**
     * Process batched requests
     */
    processBatchedRequests() {
        // Implementation for batching similar requests together
        // This would group similar API calls and execute them efficiently
    }

    /**
     * Update performance statistics
     */
    updateStats(success, responseTime) {
        this.stats.requests++;
        
        if (success) {
            this.stats.totalResponseTime += responseTime;
            this.stats.avgResponseTime = this.stats.totalResponseTime / 
                (this.stats.requests - this.stats.failures);
        } else {
            this.stats.failures++;
        }
    }

    /**
     * Get optimization statistics
     */
    getStats() {
        const cacheTotal = this.stats.cacheHits + this.stats.cacheMisses;
        
        return {
            ...this.stats,
            cacheHitRate: cacheTotal > 0 ? 
                (this.stats.cacheHits / cacheTotal * 100).toFixed(1) + '%' : '0%',
            successRate: this.stats.requests > 0 ? 
                ((this.stats.requests - this.stats.failures) / this.stats.requests * 100).toFixed(1) + '%' : '0%',
            cacheSize: this.cache.size,
            circuitBreakers: Object.fromEntries(
                Array.from(this.circuitBreakers.entries()).map(([provider, breaker]) => [
                    provider, 
                    { state: breaker.state, failures: breaker.failures }
                ])
            ),
            queueStatus: Object.fromEntries(
                Array.from(this.requestQueue.entries()).map(([provider, queue]) => [
                    provider,
                    { active: queue.active, pending: queue.pending.length }
                ])
            )
        };
    }

    /**
     * Clear caches and reset circuit breakers
     */
    reset() {
        this.cache.clear();
        this.initializeCircuitBreakers();
        
        // Clear request queues
        this.requestQueue.forEach(queue => {
            queue.pending = [];
            queue.active = 0;
        });

        // Reset stats
        this.stats = {
            requests: 0,
            cacheHits: 0,
            cacheMisses: 0,
            failures: 0,
            avgResponseTime: 0,
            totalResponseTime: 0
        };

        console.log('🔄 [AI OPTIMIZER] Optimizer reset');
    }

    /**
     * Cleanup resources
     */
    destroy() {
        if (this.batchProcessor) {
            clearInterval(this.batchProcessor);
        }
        
        this.cache.clear();
        console.log('🧹 [AI OPTIMIZER] Optimizer destroyed');
    }
}

// Create global instance
window.aiProviderOptimizer = new AIProviderOptimizer();

// Global debugging functions
window.aiOptimizerStats = () => window.aiProviderOptimizer.getStats();
window.resetAIOptimizer = () => window.aiProviderOptimizer.reset();

console.log('✅ [AI OPTIMIZER] AI provider optimizer ready');