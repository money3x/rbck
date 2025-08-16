/**
 * Thread-Safe Circuit Breaker Pattern Implementation
 * Prevents cascading failures with shared state management
 */

class CircuitBreaker {
    constructor(provider, options = {}) {
        this.provider = provider;
        this.providerId = `${provider}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`; // Unique ID
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
        this.createdAt = Date.now();
        this.requestQueue = [];
        this.activeRequests = new Set();
        
        // Thread-safe state management
        this.stateLock = false;
        this.stateChangeListeners = [];
        
        // Performance tracking
        this.stats = {
            totalAttempts: 0,
            totalFailures: 0,
            totalSuccesses: 0,
            averageResponseTime: 0,
            lastResponseTime: 0,
            uptime: 100,
            concurrentRequests: 0,
            maxConcurrentRequests: 0
        };
        
        console.log(`🔌 [Circuit Breaker] Initialized for ${provider} [${this.providerId}] with threshold: ${this.options.threshold}`);
    }
    
    /**
     * Execute an operation through the circuit breaker (thread-safe)
     * @param {Function} operation - The operation to execute
     * @param {string} requestId - Optional request identifier
     * @returns {Promise} - Result of the operation
     */
    async execute(operation, requestId = null) {
        const reqId = requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const startTime = Date.now();
        
        // Thread-safe state check
        await this.waitForStateLockRelease();
        
        this.stats.totalAttempts++;
        this.stats.concurrentRequests++;
        this.stats.maxConcurrentRequests = Math.max(this.stats.maxConcurrentRequests, this.stats.concurrentRequests);
        
        this.activeRequests.add(reqId);
        
        try {
            // Check circuit state
            if (this.state === 'OPEN') {
                if (Date.now() < this.nextAttempt) {
                    const error = new Error(`Circuit breaker is OPEN for ${this.provider} [${this.providerId}]. Next attempt in ${Math.ceil((this.nextAttempt - Date.now()) / 1000)}s`);
                    error.code = 'CIRCUIT_BREAKER_OPEN';
                    error.providerId = this.providerId;
                    error.requestId = reqId;
                    this.stats.totalFailures++;
                    throw error;
                } else {
                    // Circuit is opening, try half-open
                    await this.changeState('HALF_OPEN');
                    console.log(`🔄 [Circuit Breaker] ${this.provider} [${this.providerId}] transitioning to HALF_OPEN`);
                }
            }
            
            try {
                console.log(`⚡ [Circuit Breaker] Executing operation for ${this.provider} [${reqId}] (State: ${this.state})`);
                const result = await Promise.race([
                    operation(),
                    this.createTimeoutPromise(this.options.timeout)
                ]);
                
                // Success
                const responseTime = Date.now() - startTime;
                await this.onSuccess(responseTime, reqId);
                
                return result;
                
            } catch (error) {
                // Failure
                const responseTime = Date.now() - startTime;
                await this.onFailure(error, responseTime, reqId);
                throw error;
            }
            
        } finally {
            this.activeRequests.delete(reqId);
            this.stats.concurrentRequests--;
        }
    }
    
    /**
     * Create timeout promise for operation
     * @param {number} timeout 
     * @returns {Promise}
     */
    createTimeoutPromise(timeout) {
        return new Promise((_, reject) => {
            setTimeout(() => {
                const error = new Error(`Operation timeout after ${timeout}ms for ${this.provider}`);
                error.code = 'CIRCUIT_BREAKER_TIMEOUT';
                error.providerId = this.providerId;
                reject(error);
            }, timeout);
        });
    }
    
    /**
     * Wait for state lock to be released
     */
    async waitForStateLockRelease() {
        while (this.stateLock) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }
    
    /**
     * Thread-safe state change
     * @param {string} newState 
     */
    async changeState(newState) {
        this.stateLock = true;
        
        try {
            const oldState = this.state;
            this.state = newState;
            
            // Notify listeners
            this.stateChangeListeners.forEach(listener => {
                try {
                    listener(oldState, newState, this.providerId);
                } catch (error) {
                    console.error(`❌ [Circuit Breaker] State change listener error:`, error);
                }
            });
            
            console.log(`🔄 [Circuit Breaker] ${this.provider} [${this.providerId}] state: ${oldState} -> ${newState}`);
            
        } finally {
            this.stateLock = false;
        }
    }
    
    /**
     * Handle successful operation (thread-safe)
     * @param {number} responseTime - Response time in milliseconds
     * @param {string} requestId - Request identifier
     */
    async onSuccess(responseTime, requestId) {
        await this.waitForStateLockRelease();
        
        this.stats.totalSuccesses++;
        this.stats.lastResponseTime = responseTime;
        this.stats.averageResponseTime = (
            (this.stats.averageResponseTime * (this.stats.totalSuccesses - 1)) + responseTime
        ) / this.stats.totalSuccesses;
        
        if (this.state === 'HALF_OPEN') {
            this.successCount++;
            if (this.successCount >= 3) { // Require 3 successful calls to close circuit
                await this.changeState('CLOSED');
                this.failureCount = 0;
                this.successCount = 0;
                console.log(`✅ [Circuit Breaker] ${this.provider} [${this.providerId}] circuit CLOSED after successful recovery`);
            }
        } else if (this.state === 'CLOSED') {
            // Reset failure count on success
            this.failureCount = Math.max(0, this.failureCount - 1);
        }
        
        this.updateUptime();
        console.log(`✅ [Circuit Breaker] ${this.provider} [${requestId}] operation succeeded (${responseTime}ms)`);
    }
    
    /**
     * Handle failed operation (thread-safe)
     * @param {Error} error - The error that occurred
     * @param {number} responseTime - Response time in milliseconds
     * @param {string} requestId - Request identifier
     */
    async onFailure(error, responseTime, requestId) {
        await this.waitForStateLockRelease();
        
        this.stats.totalFailures++;
        this.stats.lastResponseTime = responseTime;
        this.failureCount++;
        this.lastFailureTime = Date.now();
        
        console.error(`❌ [Circuit Breaker] ${this.provider} [${requestId}] operation failed (${responseTime}ms):`, error.message);
        
        if (this.failureCount >= this.options.threshold) {
            await this.changeState('OPEN');
            this.nextAttempt = Date.now() + this.options.resetTimeout;
            this.successCount = 0;
            
            console.error(`🚫 [Circuit Breaker] ${this.provider} [${this.providerId}] circuit OPENED due to ${this.failureCount} failures`);
            console.error(`🚫 [Circuit Breaker] ${this.provider} [${this.providerId}] will retry after ${new Date(this.nextAttempt).toISOString()}`);
        }
        
        this.updateUptime();
    }
    
    /**
     * Check if requests are allowed (thread-safe)
     * @returns {boolean}
     */
    allowsRequests() {
        if (this.stateLock) {
            return false; // Don't allow requests during state changes
        }
        return this.state !== 'OPEN' || Date.now() >= this.nextAttempt;
    }
    
    /**
     * Add state change listener
     * @param {Function} listener 
     */
    addStateChangeListener(listener) {
        this.stateChangeListeners.push(listener);
    }
    
    /**
     * Remove state change listener
     * @param {Function} listener 
     */
    removeStateChangeListener(listener) {
        const index = this.stateChangeListeners.indexOf(listener);
        if (index > -1) {
            this.stateChangeListeners.splice(index, 1);
        }
    }
    
    /**
     * Update uptime calculation
     */
    updateUptime() {
        const total = this.stats.totalAttempts;
        if (total > 0) {
            this.stats.uptime = ((this.stats.totalSuccesses / total) * 100).toFixed(2);
        }
    }
    
    /**
     * Start monitoring circuit breaker health
     */
    startMonitoring() {
        if (this.isMonitoring) {
            return;
        }
        
        this.isMonitoring = true;
        this.monitorInterval = setInterval(() => {
            const status = this.getStatus();
            console.log(`📊 [Circuit Breaker] ${this.provider} [${this.providerId}] Status:`, {
                state: status.state,
                uptime: status.stats.uptime + '%',
                failures: status.failureCount,
                activeRequests: status.activeRequests
            });
        }, this.options.monitor);
        
        console.log(`📊 [Circuit Breaker] ${this.provider} [${this.providerId}] monitoring started`);
    }
    
    /**
     * Stop monitoring circuit breaker health
     */
    async stopMonitoring() {
        if (!this.isMonitoring) {
            return;
        }
        
        this.isMonitoring = false;
        
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
        }
        
        console.log(`🛑 [Circuit Breaker] ${this.provider} [${this.providerId}] monitoring stopped`);
    }
    
    /**
     * Get circuit breaker status
     * @returns {Object}
     */
    getStatus() {
        return {
            provider: this.provider,
            providerId: this.providerId,
            state: this.state,
            failureCount: this.failureCount,
            successCount: this.successCount,
            nextAttempt: this.nextAttempt,
            lastFailureTime: this.lastFailureTime,
            isMonitoring: this.isMonitoring,
            createdAt: this.createdAt,
            activeRequests: this.activeRequests.size,
            stateLock: this.stateLock,
            stats: { ...this.stats },
            options: { ...this.options }
        };
    }
    
    /**
     * Reset circuit breaker (thread-safe)
     */
    async reset() {
        await this.changeState('CLOSED');
        
        this.failureCount = 0;
        this.successCount = 0;
        this.nextAttempt = Date.now();
        this.lastFailureTime = null;
        
        // Reset stats
        this.stats = {
            totalAttempts: 0,
            totalFailures: 0,
            totalSuccesses: 0,
            averageResponseTime: 0,
            lastResponseTime: 0,
            uptime: 100,
            concurrentRequests: 0,
            maxConcurrentRequests: 0
        };
        
        console.log(`🔄 [Circuit Breaker] ${this.provider} [${this.providerId}] reset to CLOSED state`);
    }
    
    /**
     * Cleanup circuit breaker resources (thread-safe)
     */
    async destroy() {
        await this.stopMonitoring();
        
        // Wait for active requests to complete
        while (this.activeRequests.size > 0) {
            console.log(`⏳ [Circuit Breaker] ${this.provider} [${this.providerId}] waiting for ${this.activeRequests.size} active requests...`);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        this.stateChangeListeners = [];
        this.requestQueue = [];
        
        console.log(`🗑️ [Circuit Breaker] ${this.provider} [${this.providerId}] destroyed`);
    }
}

module.exports = CircuitBreaker;