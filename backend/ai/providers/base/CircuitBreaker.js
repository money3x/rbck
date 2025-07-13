/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by monitoring provider health
 */

class CircuitBreaker {
    constructor(provider, options = {}) {
        this.provider = provider;
        this.options = {
            threshold: options.threshold || 5, // Number of failures before opening circuit
            timeout: options.timeout || 60000, // Time to wait before trying again (1 minute)
            monitor: options.monitor || 30000, // How often to check (30 seconds)
            resetTimeout: options.resetTimeout || 300000, // Time to wait before closing circuit (5 minutes)
            ...options
        };
        
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.failureCount = 0;
        this.nextAttempt = Date.now();
        this.lastFailureTime = null;
        this.successCount = 0;
        this.isMonitoring = false;
        
        // Performance tracking
        this.stats = {
            totalAttempts: 0,
            totalFailures: 0,
            totalSuccesses: 0,
            averageResponseTime: 0,
            lastResponseTime: 0,
            uptime: 100
        };
        
        console.log(`🔌 [Circuit Breaker] Initialized for ${provider} with threshold: ${this.options.threshold}`);
    }
    
    /**
     * Execute an operation through the circuit breaker
     * @param {Function} operation - The operation to execute
     * @returns {Promise} - Result of the operation
     */
    async execute(operation) {
        const startTime = Date.now();
        this.stats.totalAttempts++;
        
        // Check circuit state
        if (this.state === 'OPEN') {
            if (Date.now() < this.nextAttempt) {
                const error = new Error(`Circuit breaker is OPEN for ${this.provider}. Next attempt in ${Math.ceil((this.nextAttempt - Date.now()) / 1000)}s`);
                error.code = 'CIRCUIT_BREAKER_OPEN';
                error.provider = this.provider;
                error.retryAfter = Math.ceil((this.nextAttempt - Date.now()) / 1000);
                throw error;
            }
            
            // Transition to HALF_OPEN
            this.state = 'HALF_OPEN';
            this.successCount = 0;
            console.log(`🔄 [Circuit Breaker] ${this.provider} transitioning to HALF_OPEN state`);
        }
        
        try {
            // Execute the operation
            const result = await operation();
            const responseTime = Date.now() - startTime;
            
            // Operation succeeded
            this.onSuccess(responseTime);
            return result;
            
        } catch (error) {
            const responseTime = Date.now() - startTime;
            this.onFailure(error, responseTime);
            throw error;
        }
    }
    
    /**
     * Handle successful operation
     * @param {number} responseTime - Time taken for the operation
     */
    onSuccess(responseTime) {
        this.failureCount = 0;
        this.successCount++;
        this.stats.totalSuccesses++;
        this.stats.lastResponseTime = responseTime;
        
        // Update average response time
        this.updateAverageResponseTime(responseTime);
        
        if (this.state === 'HALF_OPEN') {
            // Need multiple successes to close circuit
            if (this.successCount >= 3) {
                this.state = 'CLOSED';
                console.log(`✅ [Circuit Breaker] ${this.provider} circuit CLOSED - recovered after ${this.successCount} successes`);
            }
        } else if (this.state === 'OPEN') {
            // Shouldn't happen, but handle gracefully
            this.state = 'CLOSED';
            console.log(`✅ [Circuit Breaker] ${this.provider} circuit unexpectedly CLOSED`);
        }
        
        // Update uptime
        this.updateUptime();
        
        console.log(`✅ [Circuit Breaker] ${this.provider} operation succeeded (${responseTime}ms) - State: ${this.state}`);
    }
    
    /**
     * Handle failed operation
     * @param {Error} error - The error that occurred
     * @param {number} responseTime - Time taken for the operation
     */
    onFailure(error, responseTime) {
        this.failureCount++;
        this.stats.totalFailures++;
        this.stats.lastResponseTime = responseTime;
        this.lastFailureTime = Date.now();
        
        // Update average response time (even for failures)
        this.updateAverageResponseTime(responseTime);
        
        console.warn(`❌ [Circuit Breaker] ${this.provider} operation failed (${responseTime}ms) - Failure count: ${this.failureCount}/${this.options.threshold}`);
        console.warn(`❌ [Circuit Breaker] Error:`, error.message);
        
        if (this.failureCount >= this.options.threshold) {
            this.state = 'OPEN';
            this.nextAttempt = Date.now() + this.options.timeout;
            
            console.error(`🚨 [Circuit Breaker] ${this.provider} circuit OPENED due to ${this.failureCount} failures`);
            console.error(`🚨 [Circuit Breaker] Next attempt in ${this.options.timeout / 1000} seconds`);
        } else if (this.state === 'HALF_OPEN') {
            // Failed while in HALF_OPEN, go back to OPEN
            this.state = 'OPEN';
            this.nextAttempt = Date.now() + this.options.timeout;
            
            console.error(`🚨 [Circuit Breaker] ${this.provider} failed in HALF_OPEN, returning to OPEN state`);
        }
        
        // Update uptime
        this.updateUptime();
    }
    
    /**
     * Update average response time using exponential moving average
     * @param {number} responseTime - New response time
     */
    updateAverageResponseTime(responseTime) {
        if (this.stats.averageResponseTime === 0) {
            this.stats.averageResponseTime = responseTime;
        } else {
            // Exponential moving average with alpha = 0.1
            this.stats.averageResponseTime = (0.9 * this.stats.averageResponseTime) + (0.1 * responseTime);
        }
    }
    
    /**
     * Update uptime percentage
     */
    updateUptime() {
        if (this.stats.totalAttempts === 0) {
            this.stats.uptime = 100;
        } else {
            this.stats.uptime = (this.stats.totalSuccesses / this.stats.totalAttempts) * 100;
        }
    }
    
    /**
     * Get current circuit breaker status
     * @returns {Object} - Current status information
     */
    getStatus() {
        const now = Date.now();
        const timeSinceLastFailure = this.lastFailureTime ? now - this.lastFailureTime : null;
        const timeUntilNextAttempt = this.state === 'OPEN' ? Math.max(0, this.nextAttempt - now) : 0;
        
        return {
            provider: this.provider,
            state: this.state,
            isHealthy: this.state === 'CLOSED' || (this.state === 'HALF_OPEN' && this.successCount > 0),
            failureCount: this.failureCount,
            successCount: this.successCount,
            threshold: this.options.threshold,
            nextAttempt: this.state === 'OPEN' ? new Date(this.nextAttempt).toISOString() : null,
            timeUntilNextAttempt: Math.ceil(timeUntilNextAttempt / 1000),
            timeSinceLastFailure: timeSinceLastFailure ? Math.ceil(timeSinceLastFailure / 1000) : null,
            stats: {
                ...this.stats,
                averageResponseTime: Math.round(this.stats.averageResponseTime),
                uptime: Math.round(this.stats.uptime * 100) / 100
            },
            lastCheck: new Date().toISOString()
        };
    }
    
    /**
     * Check if the circuit breaker allows requests
     * @returns {boolean} - Whether requests are allowed
     */
    allowsRequests() {
        if (this.state === 'CLOSED') return true;
        if (this.state === 'HALF_OPEN') return true;
        if (this.state === 'OPEN') return Date.now() >= this.nextAttempt;
        return false;
    }
    
    /**
     * Manually reset the circuit breaker
     */
    reset() {
        console.log(`🔄 [Circuit Breaker] Manually resetting ${this.provider} circuit breaker`);
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.successCount = 0;
        this.nextAttempt = Date.now();
        this.lastFailureTime = null;
    }
    
    /**
     * Start health monitoring
     */
    startMonitoring() {
        if (this.isMonitoring) {
            console.warn(`⚠️ [Circuit Breaker] ${this.provider} monitoring already started`);
            return;
        }
        
        this.isMonitoring = true;
        this.monitoringInterval = setInterval(() => {
            this.performHealthCheck();
        }, this.options.monitor);
        
        console.log(`📊 [Circuit Breaker] Started monitoring ${this.provider} every ${this.options.monitor / 1000}s`);
    }
    
    /**
     * Stop health monitoring
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        this.isMonitoring = false;
        console.log(`🛑 [Circuit Breaker] Stopped monitoring ${this.provider}`);
    }
    
    /**
     * Perform a health check (lightweight operation)
     */
    async performHealthCheck() {
        if (this.state === 'OPEN') {
            // Don't perform health checks when circuit is open
            return;
        }
        
        try {
            // This should be implemented by each provider as a lightweight check
            console.log(`💓 [Circuit Breaker] Health check for ${this.provider}...`);
            
            // For now, just update the last check timestamp
            // In a real implementation, this would make a lightweight API call
            
        } catch (error) {
            console.warn(`⚠️ [Circuit Breaker] Health check failed for ${this.provider}:`, error.message);
        }
    }
    
    /**
     * Get detailed statistics
     * @returns {Object} - Detailed statistics
     */
    getDetailedStats() {
        const status = this.getStatus();
        const now = Date.now();
        
        return {
            ...status,
            options: this.options,
            performance: {
                successRate: this.stats.totalAttempts > 0 ? 
                    Math.round((this.stats.totalSuccesses / this.stats.totalAttempts) * 10000) / 100 : 0,
                failureRate: this.stats.totalAttempts > 0 ? 
                    Math.round((this.stats.totalFailures / this.stats.totalAttempts) * 10000) / 100 : 0,
                totalAttempts: this.stats.totalAttempts,
                averageResponseTime: Math.round(this.stats.averageResponseTime),
                lastResponseTime: this.stats.lastResponseTime
            },
            circuitBreakerConfig: {
                threshold: this.options.threshold,
                timeout: this.options.timeout,
                resetTimeout: this.options.resetTimeout,
                monitorInterval: this.options.monitor
            }
        };
    }
    
    /**
     * Cleanup resources
     */
    destroy() {
        this.stopMonitoring();
        console.log(`🗑️ [Circuit Breaker] ${this.provider} circuit breaker destroyed`);
    }
}

module.exports = CircuitBreaker;