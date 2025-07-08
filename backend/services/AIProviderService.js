/**
 * AI Provider Service - Centralized provider management
 * Performance optimizations: Caching, async provider validation, smart fallbacks
 */

const { getProviderConfig } = require('../ai/providers/config/providers.config');
const ProviderFactory = require('../ai/providers/factory/ProviderFactory');

class AIProviderService {
    constructor() {
        this.providerCache = new Map();
        this.configCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        
        // Provider name mapping for frontend compatibility
        this.providerMapping = {
            'anthropic': 'claude',
            'openai': 'openai',
            'gemini': 'gemini',
            'deepseek': 'deepseek',
            'chinda': 'chinda'
        };
        
        // Provider priority for fallbacks (based on reliability)
        this.fallbackOrder = ['openai', 'claude', 'deepseek', 'chinda', 'gemini'];
        
        this.initializeProviders();
    }
    
    /**
     * Initialize available providers cache
     */
    async initializeProviders() {
        try {
            console.log('🚀 [AI SERVICE] Initializing provider cache...');
            
            for (const provider of this.fallbackOrder) {
                try {
                    const config = await this.getProviderConfig(provider);
                    if (config && config.apiKey) {
                        console.log(`✅ [AI SERVICE] Provider ${provider} initialized`);
                    }
                } catch (error) {
                    console.warn(`⚠️ [AI SERVICE] Provider ${provider} not available:`, error.message);
                }
            }
            
            console.log('✅ [AI SERVICE] Provider initialization complete');
        } catch (error) {
            console.error('❌ [AI SERVICE] Initialization failed:', error);
        }
    }
    
    /**
     * Get provider configuration with caching
     */
    async getProviderConfig(providerName) {
        const mappedProvider = this.mapProviderName(providerName);
        const cacheKey = `config_${mappedProvider}`;
        
        // Check cache first
        if (this.configCache.has(cacheKey)) {
            const cached = this.configCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.config;
            }
        }
        
        // Get fresh config
        try {
            const config = getProviderConfig(mappedProvider);
            
            // Cache the result
            this.configCache.set(cacheKey, {
                config: config,
                timestamp: Date.now()
            });
            
            return config;
        } catch (error) {
            // Cache the error to prevent repeated failed attempts
            this.configCache.set(cacheKey, {
                config: null,
                error: error.message,
                timestamp: Date.now()
            });
            throw error;
        }
    }
    
    /**
     * Get or create provider instance with caching
     */
    async getProviderInstance(providerName) {
        const mappedProvider = this.mapProviderName(providerName);
        const cacheKey = `instance_${mappedProvider}`;
        
        // Check cache first
        if (this.providerCache.has(cacheKey)) {
            const cached = this.providerCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.instance;
            }
        }
        
        // Create new instance
        try {
            const instance = ProviderFactory.createProvider(mappedProvider);
            
            // Cache the instance
            this.providerCache.set(cacheKey, {
                instance: instance,
                timestamp: Date.now()
            });
            
            return instance;
        } catch (error) {
            console.error(`❌ [AI SERVICE] Failed to create provider ${mappedProvider}:`, error.message);
            throw error;
        }
    }
    
    /**
     * Smart provider selection with fallbacks
     */
    async selectBestProvider(requestedProvider) {
        const mappedProvider = this.mapProviderName(requestedProvider);
        
        // Try requested provider first
        try {
            const config = await this.getProviderConfig(mappedProvider);
            if (config && config.apiKey) {
                return { provider: mappedProvider, config: config };
            }
        } catch (error) {
            console.warn(`⚠️ [AI SERVICE] Requested provider ${mappedProvider} unavailable`);
        }
        
        // Try fallback providers
        for (const fallbackProvider of this.fallbackOrder) {
            if (fallbackProvider === mappedProvider) continue; // Skip already tried
            
            try {
                const config = await this.getProviderConfig(fallbackProvider);
                if (config && config.apiKey) {
                    console.log(`🔄 [AI SERVICE] Using fallback provider: ${fallbackProvider}`);
                    return { 
                        provider: fallbackProvider, 
                        config: config,
                        isFallback: true,
                        originalProvider: requestedProvider
                    };
                }
            } catch (error) {
                // Continue to next fallback
                continue;
            }
        }
        
        throw new Error(`No available AI providers configured. Please set up at least one provider in your environment variables.`);
    }
    
    /**
     * Process chat message with optimized provider handling
     */
    async processMessage(requestedProvider, message, options = {}) {
        const startTime = Date.now();
        
        try {
            // Smart provider selection
            const { provider, config, isFallback, originalProvider } = await this.selectBestProvider(requestedProvider);
            
            // Get provider instance
            const providerInstance = await this.getProviderInstance(provider);
            
            // Generate response
            const response = await providerInstance.generateResponse(message, {
                model: options.model,
                maxTokens: options.maxTokens || 1000,
                temperature: options.temperature || 0.7
            });
            
            const processingTime = Date.now() - startTime;
            
            return {
                success: true,
                response: response.content,
                provider: provider,
                model: response.model,
                processingTime: processingTime,
                ...(isFallback && { 
                    fallbackUsed: true,
                    originalProvider: originalProvider,
                    note: `Used ${provider} as fallback for ${originalProvider}`
                })
            };
            
        } catch (error) {
            const processingTime = Date.now() - startTime;
            
            console.error('❌ [AI SERVICE] Message processing failed:', error.message);
            
            throw {
                success: false,
                error: error.message,
                provider: requestedProvider,
                processingTime: processingTime
            };
        }
    }
    
    /**
     * Map frontend provider names to backend names
     */
    mapProviderName(providerName) {
        return this.providerMapping[providerName] || providerName;
    }
    
    /**
     * Get available providers status
     */
    async getProvidersStatus() {
        const status = {};
        
        for (const provider of this.fallbackOrder) {
            try {
                const config = await this.getProviderConfig(provider);
                status[provider] = {
                    available: !!(config && config.apiKey),
                    configured: !!config,
                    status: config && config.apiKey ? 'ready' : 'needs_configuration'
                };
            } catch (error) {
                status[provider] = {
                    available: false,
                    configured: false,
                    status: 'error',
                    error: error.message
                };
            }
        }
        
        return status;
    }
    
    /**
     * Clear caches (for development/testing)
     */
    clearCache() {
        this.providerCache.clear();
        this.configCache.clear();
        console.log('🧹 [AI SERVICE] Cache cleared');
    }
    
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            providerCache: {
                size: this.providerCache.size,
                keys: Array.from(this.providerCache.keys())
            },
            configCache: {
                size: this.configCache.size,
                keys: Array.from(this.configCache.keys())
            },
            cacheTimeout: this.cacheTimeout
        };
    }
}

// Singleton instance
const aiProviderService = new AIProviderService();

module.exports = aiProviderService;