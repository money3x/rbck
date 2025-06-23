const { getProviderConfig, getEnabledProviders } = require('../config/providers.config');

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

        return new ProviderClass(config);
    }

    static getAvailableProviders() {
        return Object.keys(getEnabledProviders());
    }

    static async testProvider(providerName) {
        try {
            const provider = this.createProvider(providerName);
            return await provider.checkHealth();
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
}

module.exports = ProviderFactory;
