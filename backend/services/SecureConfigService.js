/**
 * Secure Configuration Service
 * Handles sensitive configuration data without exposing API keys
 * Created: 2025-07-04 - Security Enhancement
 */

class SecureConfigService {
    /**
     * Get provider configuration WITHOUT API keys
     * @param {string} providerName - Name of the AI provider
     * @returns {object} Configuration object without sensitive data
     */
    static getProviderConfig(providerName) {
        const configs = {
            gemini: {
                name: 'Gemini 2.0 Flash',
                type: 'Google AI',
                endpoint: process.env.GEMINI_API_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta',
                model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
                status: this.hasValidKey('gemini') ? 'active' : 'inactive',
                responseTime: 800,
                successRate: 0.95,
                costPerToken: 0.0000025,
                features: ['text-generation', 'content-analysis', 'multilingual'],
                hasValidKey: () => this.hasValidKey('gemini')
            },
            openai: {
                name: 'OpenAI GPT',
                type: 'OpenAI',
                endpoint: process.env.OPENAI_API_ENDPOINT || 'https://api.openai.com/v1',
                model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
                status: this.hasValidKey('openai') ? 'active' : 'inactive',
                responseTime: 1200,
                successRate: 0.92,
                costPerToken: 0.000002,
                features: ['text-generation', 'code-review', 'quality-check'],
                hasValidKey: () => this.hasValidKey('openai')
            },
            claude: {
                name: 'Claude AI',
                type: 'Anthropic',
                endpoint: process.env.CLAUDE_API_ENDPOINT || 'https://api.anthropic.com/v1',
                model: process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229',
                status: this.hasValidKey('claude') ? 'active' : 'inactive',
                responseTime: 1000,
                successRate: 0.89,
                costPerToken: 0.000003,
                features: ['content-optimization', 'structure-analysis', 'readability'],
                hasValidKey: () => this.hasValidKey('claude')
            },
            deepseek: {
                name: 'DeepSeek AI',
                type: 'DeepSeek AI',
                endpoint: process.env.DEEPSEEK_API_ENDPOINT || 'https://api.deepseek.com/v1',
                model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
                status: this.hasValidKey('deepseek') ? 'maintenance' : 'inactive',
                responseTime: 1500,
                successRate: 0.85,
                costPerToken: 0.000001,
                features: ['technical-analysis', 'code-optimization', 'performance'],
                hasValidKey: () => this.hasValidKey('deepseek')
            },
            chinda: {
                name: 'ChindaX AI',
                type: 'ChindaX',
                endpoint: process.env.CHINDA_API_ENDPOINT || 'https://api.chindax.com/v1',
                model: process.env.CHINDA_MODEL || 'chinda-chat',
                status: this.hasValidKey('chinda') ? 'active' : 'inactive',
                responseTime: 900,
                successRate: 0.88,
                costPerToken: 0.0000015,
                features: ['thai-language', 'cultural-adaptation', 'localization'],
                hasValidKey: () => this.hasValidKey('chinda')
            }
        };
        
        return configs[providerName] || null;
    }
    
    /**
     * Securely get API key for a provider
     * @param {string} providerName - Name of the AI provider
     * @returns {string|null} API key or null if not found
     */
    static getApiKey(providerName) {
        const keys = {
            gemini: process.env.GEMINI_API_KEY,
            openai: process.env.OPENAI_API_KEY,
            claude: process.env.CLAUDE_API_KEY,
            deepseek: process.env.DEEPSEEK_API_KEY,
            chinda: process.env.CHINDA_API_KEY
        };
        
        const key = keys[providerName];
        
        // Log access but never log the actual key
        if (key) {
            console.log(`🔑 [SECURE] API key accessed for provider: ${providerName}`);
        } else {
            console.warn(`⚠️ [SECURE] No API key found for provider: ${providerName}`);
        }
        
        return key || null;
    }
    
    /**
     * Check if provider has a valid API key
     * @param {string} providerName - Name of the AI provider
     * @returns {boolean} True if key exists and is valid format
     */
    static hasValidKey(providerName) {
        const key = process.env[this.getKeyEnvName(providerName)];
        
        if (!key) return false;
        
        // Basic key format validation
        switch (providerName) {
            case 'gemini':
                return key.length > 20 && key.startsWith('AI');
            case 'openai':
                return key.length > 20 && key.startsWith('sk-');
            case 'claude':
                return key.length > 20 && key.startsWith('sk-ant-');
            case 'deepseek':
                return key.length > 15;
            case 'chinda':
                return key.length > 15;
            default:
                return key.length > 10; // Minimum length check
        }
    }
    
    /**
     * Get environment variable name for provider API key
     * @param {string} providerName - Name of the AI provider  
     * @returns {string} Environment variable name
     */
    static getKeyEnvName(providerName) {
        const envNames = {
            gemini: 'GEMINI_API_KEY',
            openai: 'OPENAI_API_KEY', 
            claude: 'CLAUDE_API_KEY',
            deepseek: 'DEEPSEEK_API_KEY',
            chinda: 'CHINDA_API_KEY'
        };
        
        return envNames[providerName];
    }
    
    /**
     * Get all available providers (without sensitive data)
     * @returns {array} Array of provider configurations
     */
    static getAllProviders() {
        const providers = ['gemini', 'openai', 'claude', 'deepseek', 'chinda'];
        return providers.map(provider => this.getProviderConfig(provider));
    }
    
    /**
     * Get only active providers (those with valid API keys)
     * @returns {array} Array of active provider configurations
     */
    static getActiveProviders() {
        return this.getAllProviders().filter(provider => provider.status === 'active');
    }
    
    /**
     * Create secure headers for API requests
     * @param {string} providerName - Name of the AI provider
     * @returns {object} Headers object with authorization
     */
    static createSecureHeaders(providerName) {
        const apiKey = this.getApiKey(providerName);
        
        if (!apiKey) {
            throw new Error(`No API key available for provider: ${providerName}`);
        }
        
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'RBCK-CMS/2.2.0'
        };
        
        // Provider-specific authorization headers
        switch (providerName) {
            case 'gemini':
                headers['Authorization'] = `Bearer ${apiKey}`;
                break;
            case 'openai':
                headers['Authorization'] = `Bearer ${apiKey}`;
                break;
            case 'claude':
                headers['x-api-key'] = apiKey;
                break;
            case 'deepseek':
                headers['Authorization'] = `Bearer ${apiKey}`;
                break;
            case 'chinda':
                headers['Authorization'] = `Bearer ${apiKey}`;
                break;
            default:
                headers['Authorization'] = `Bearer ${apiKey}`;
        }
        
        return headers;
    }
    
    /**
     * Validate provider configuration
     * @param {string} providerName - Name of the AI provider
     * @returns {object} Validation result
     */
    static validateProvider(providerName) {
        const config = this.getProviderConfig(providerName);
        
        if (!config) {
            return {
                isValid: false,
                error: `Unknown provider: ${providerName}`
            };
        }
        
        if (!this.hasValidKey(providerName)) {
            return {
                isValid: false,
                error: `No valid API key for provider: ${providerName}`,
                suggestion: `Set environment variable: ${this.getKeyEnvName(providerName)}`
            };
        }
        
        return {
            isValid: true,
            config: config
        };
    }
}

module.exports = SecureConfigService;