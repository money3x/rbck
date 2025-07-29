const ProviderFactory = require('../factory/ProviderFactory');
const { getEnabledProviders } = require('../config/providers.config');

/**
 * Unified Provider Pool - Eliminates duplicate provider instances
 * Manages single instances of providers shared across all councils
 */
class ProviderPool {
    constructor() {
        this.providers = new Map();
        this.healthChecks = new Map();
        this.initializationStatus = new Map();
        this.lastHealthCheck = new Map();
        this.isInitializing = false;
        
        console.log('🏊 [ProviderPool] Provider pool initialized');
    }

    /**
     * Initialize all enabled providers
     * @returns {Promise<void>}
     */
    async initializeProviders() {
        if (this.isInitializing) {
            console.log('⏳ [ProviderPool] Already initializing, waiting...');
            return this.waitForInitialization();
        }

        this.isInitializing = true;
        
        try {
            console.log('🚀 [ProviderPool] Starting provider initialization...');
            
            const enabledProviders = getEnabledProviders();
            const initPromises = [];

            for (const [providerName, config] of Object.entries(enabledProviders)) {
                initPromises.push(this.initializeProvider(providerName, config));
            }

            // Initialize all providers in parallel
            const results = await Promise.allSettled(initPromises);
            
            let successCount = 0;
            let failCount = 0;

            results.forEach((result, index) => {
                const providerName = Object.keys(enabledProviders)[index];
                if (result.status === 'fulfilled') {
                    successCount++;
                    this.initializationStatus.set(providerName, 'success');
                } else {
                    failCount++;
                    this.initializationStatus.set(providerName, 'failed');
                    console.error(`❌ [ProviderPool] Failed to initialize ${providerName}:`, result.reason);
                }
            });

            console.log(`✅ [ProviderPool] Initialization complete: ${successCount} success, ${failCount} failed`);
            
        } finally {
            this.isInitializing = false;
        }
    }

    /**
     * Initialize a single provider
     * @param {string} providerName 
     * @param {object} config 
     * @returns {Promise<void>}
     */
    async initializeProvider(providerName, config) {
        try {
            console.log(`🔄 [ProviderPool] Initializing ${providerName}...`);
            
            // Create provider instance through factory
            const provider = ProviderFactory.createProvider(providerName);
            
            // Test provider health
            const healthResult = await this.testProviderHealth(provider, providerName);
            
            if (healthResult.status === 'healthy') {
                this.providers.set(providerName, provider);
                this.healthChecks.set(providerName, healthResult);
                this.lastHealthCheck.set(providerName, Date.now());
                
                console.log(`✅ [ProviderPool] ${providerName} initialized successfully`);
            } else {
                throw new Error(`Health check failed: ${healthResult.error}`);
            }
            
        } catch (error) {
            console.error(`❌ [ProviderPool] Failed to initialize ${providerName}:`, error.message);
            throw error;
        }
    }

    /**
     * Get provider instance (shared across councils)
     * @param {string} providerName 
     * @returns {object|null}
     */
    getProvider(providerName) {
        const provider = this.providers.get(providerName);
        if (!provider) {
            console.warn(`⚠️ [ProviderPool] Provider ${providerName} not found in pool`);
            return null;
        }
        
        // Update last access time
        this.lastHealthCheck.set(providerName, Date.now());
        return provider;
    }

    /**
     * Get all available providers
     * @returns {Map<string, object>}
     */
    getAllProviders() {
        return new Map(this.providers);
    }

    /**
     * Get providers by role/specialty
     * @param {string} role 
     * @returns {Array<{name: string, provider: object, config: object}>}
     */
    getProvidersByRole(role) {
        const enabledProviders = getEnabledProviders();
        const matchingProviders = [];

        for (const [providerName, config] of Object.entries(enabledProviders)) {
            if (config.role === role || (config.specialties && config.specialties.includes(role))) {
                const provider = this.providers.get(providerName);
                if (provider) {
                    matchingProviders.push({
                        name: providerName,
                        provider,
                        config
                    });
                }
            }
        }

        return matchingProviders;
    }

    /**
     * Test provider health
     * @param {object} provider 
     * @param {string} providerName 
     * @returns {Promise<object>}
     */
    async testProviderHealth(provider, providerName) {
        try {
            // Use circuit breaker if available
            const circuitBreaker = ProviderFactory.circuitBreakers.get(providerName);
            
            if (circuitBreaker && !circuitBreaker.allowsRequests()) {
                return {
                    status: 'circuit_breaker_open',
                    provider: providerName,
                    error: 'Circuit breaker is OPEN'
                };
            }

            const healthResult = circuitBreaker 
                ? await circuitBreaker.execute(() => provider.checkHealth())
                : await provider.checkHealth();

            return healthResult;
            
        } catch (error) {
            return {
                status: 'unhealthy',
                provider: providerName,
                error: error.message
            };
        }
    }

    /**
     * Perform health checks on all providers
     * @returns {Promise<Map<string, object>>}
     */
    async performHealthChecks() {
        const healthResults = new Map();
        const healthPromises = [];

        for (const [providerName, provider] of this.providers.entries()) {
            healthPromises.push(
                this.testProviderHealth(provider, providerName)
                    .then(result => {
                        healthResults.set(providerName, result);
                        this.healthChecks.set(providerName, result);
                        this.lastHealthCheck.set(providerName, Date.now());
                    })
                    .catch(error => {
                        const errorResult = {
                            status: 'error',
                            provider: providerName,
                            error: error.message
                        };
                        healthResults.set(providerName, errorResult);
                        this.healthChecks.set(providerName, errorResult);
                    })
            );
        }

        await Promise.allSettled(healthPromises);
        return healthResults;
    }

    /**
     * Get provider status
     * @returns {object}
     */
    getStatus() {
        const status = {
            totalProviders: this.providers.size,
            healthyProviders: 0,
            unhealthyProviders: 0,
            providers: {},
            lastUpdate: new Date().toISOString()
        };

        for (const [providerName, healthCheck] of this.healthChecks.entries()) {
            const isHealthy = healthCheck.status === 'healthy';
            status.providers[providerName] = {
                status: healthCheck.status,
                lastCheck: this.lastHealthCheck.get(providerName),
                circuitBreakerStatus: ProviderFactory.getProviderCircuitBreakerStatus(providerName),
                provider: this.providers.get(providerName) // Add provider reference
            };
            
            if (isHealthy) {
                status.healthyProviders++;
            } else {
                status.unhealthyProviders++;
            }
        }

        return status;
    }

    /**
     * Wait for initialization to complete
     * @returns {Promise<void>}
     */
    async waitForInitialization() {
        while (this.isInitializing) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        console.log('🧹 [ProviderPool] Cleaning up provider pool...');
        
        this.providers.clear();
        this.healthChecks.clear();
        this.initializationStatus.clear();
        this.lastHealthCheck.clear();
        
        // Cleanup circuit breakers
        ProviderFactory.cleanup();
        
        console.log('✅ [ProviderPool] Cleanup complete');
    }

    /**
     * Reset provider pool
     */
    async reset() {
        await this.cleanup();
        await this.initializeProviders();
    }
}

// Export singleton instance
let poolInstance = null;

module.exports = {
    ProviderPool,
    getInstance: () => {
        if (!poolInstance) {
            poolInstance = new ProviderPool();
        }
        return poolInstance;
    },
    resetInstance: () => {
        if (poolInstance) {
            poolInstance.cleanup();
        }
        poolInstance = null;
    }
};