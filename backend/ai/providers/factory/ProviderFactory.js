const { getProviderConfig, getEnabledProviders } = require('../config/providers.config');
const CircuitBreaker = require('../base/CircuitBreaker');

// Import all providers
const OpenAIProvider = require('../openai/OpenAIProvider');
const GeminiProvider = require('../gemini/GeminiProvider');
const DeepSeekProvider = require('../deepseek/DeepSeekProvider');
const ClaudeProvider = require('../claude/ClaudeProvider');
const ChindaAIProvider = require('../chinda/ChindaAIProvider');

class ProviderFactory {
    static providerClasses = {
        OpenAIProvider,
        GeminiProvider,
        DeepSeekProvider,
        ClaudeProvider,
        ChindaAIProvider
    };

    // Circuit breaker instances for each provider
    static circuitBreakers = new Map();

    static createProvider(providerName) {
        const config = getProviderConfig(providerName);
        
        if (!config) {
            throw new Error(`Provider ${providerName} not found in configuration`);
        }

        if (!config.enabled) {
            throw new Error(`Provider ${providerName} is disabled`);
        }

        if (!config.apiKey) {
            throw new Error(`API key not found for provider ${providerName}`);
        }

        const ProviderClass = this.providerClasses[config.provider];
        
        if (!ProviderClass) {
            throw new Error(`Provider class ${config.provider} not found`);
        }

        // Create provider instance
        const provider = new ProviderClass(config);
        
        // Create and attach circuit breaker if not exists
        if (!this.circuitBreakers.has(providerName)) {
            const circuitBreaker = new CircuitBreaker(providerName, {
                threshold: config.circuitBreakerThreshold || 5,
                timeout: config.circuitBreakerTimeout || 60000,
                resetTimeout: config.circuitBreakerResetTimeout || 300000
            });
            
            this.circuitBreakers.set(providerName, circuitBreaker);
            console.log(`🔌 [ProviderFactory] Circuit breaker created for ${providerName}`);
        }
        
        // Attach circuit breaker to provider
        provider.circuitBreaker = this.circuitBreakers.get(providerName);
        
        return provider;
    }

    static getAvailableProviders() {
        return Object.keys(getEnabledProviders());
    }

    static async testProvider(providerName) {
        try {
            const provider = this.createProvider(providerName);
            const circuitBreaker = this.circuitBreakers.get(providerName);
            
            if (circuitBreaker && !circuitBreaker.allowsRequests()) {
                return {
                    status: 'circuit_breaker_open',
                    provider: providerName,
                    error: 'Circuit breaker is OPEN - provider is temporarily unavailable',
                    circuitBreakerStatus: circuitBreaker.getStatus()
                };
            }
            
            // Test through circuit breaker if available
            if (circuitBreaker) {
                return await circuitBreaker.execute(() => provider.checkHealth());
            } else {
                return await provider.checkHealth();
            }
        } catch (error) {
            return {
                status: 'error',
                provider: providerName,
                error: error.message
            };
        }
    }

    static async testAllProviders() {
        const availableProviders = this.getAvailableProviders();
        const results = {};

        for (const providerName of availableProviders) {
            results[providerName] = await this.testProvider(providerName);
        }

        return results;
    }

    /**
     * Get circuit breaker status for a provider
     */
    static getProviderCircuitBreakerStatus(providerName) {
        const circuitBreaker = this.circuitBreakers.get(providerName);
        return circuitBreaker ? circuitBreaker.getStatus() : null;
    }

    /**
     * Get circuit breaker status for all providers
     */
    static getAllCircuitBreakerStatus() {
        const status = {};
        for (const [providerName, circuitBreaker] of this.circuitBreakers.entries()) {
            status[providerName] = circuitBreaker.getStatus();
        }
        return status;
    }

    /**
     * Reset circuit breaker for a provider
     */
    static resetProviderCircuitBreaker(providerName) {
        const circuitBreaker = this.circuitBreakers.get(providerName);
        if (circuitBreaker) {
            circuitBreaker.reset();
            console.log(`🔄 [ProviderFactory] Circuit breaker reset for ${providerName}`);
            return true;
        }
        return false;
    }

    /**
     * Start monitoring for all circuit breakers
     */
    static startCircuitBreakerMonitoring() {
        for (const [, circuitBreaker] of this.circuitBreakers.entries()) {
            circuitBreaker.startMonitoring();
        }
        console.log('📊 [ProviderFactory] Circuit breaker monitoring started for all providers');
    }

    /**
     * Stop monitoring for all circuit breakers
     */
    static stopCircuitBreakerMonitoring() {
        for (const [, circuitBreaker] of this.circuitBreakers.entries()) {
            circuitBreaker.stopMonitoring();
        }
        console.log('🛑 [ProviderFactory] Circuit breaker monitoring stopped for all providers');
    }

    /**
     * Cleanup all circuit breakers
     */
    static cleanup() {
        for (const [providerName, circuitBreaker] of this.circuitBreakers.entries()) {
            circuitBreaker.destroy();
        }
        this.circuitBreakers.clear();
        console.log('🗑️ [ProviderFactory] All circuit breakers cleaned up');
    }
}

module.exports = ProviderFactory;
