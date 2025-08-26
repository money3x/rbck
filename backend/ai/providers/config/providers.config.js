// AI Providers Configuration
// Environment variables are loaded by server.js

const providersConfig = {
    claude: {
        name: 'Anthropic Claude',
        provider: 'ClaudeProvider',
        apiKey: process.env.CLAUDE_API_KEY,
        baseURL: process.env.CLAUDE_BASE_URL || 'https://api.anthropic.com/v1',
        defaultModel: 'claude-3-sonnet-20240229',
        enabled: process.env.CLAUDE_ENABLED === 'true',
        models: ['claude-3-sonnet-20240229', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
        role: 'Chief E-E-A-T Content Specialist',
        specialties: ['trustworthiness', 'experience integration', 'factual accuracy', 'content quality'],
        priority: 1,
        eatCapabilities: {
            expertise: 90,
            experience: 85,
            authoritativeness: 88,
            trustworthiness: 95
        }
    },
    openai: {
        name: 'OpenAI GPT OSS 120b',
        provider: 'OpenAIProvider',
        apiKey: process.env.OPENAI_API_KEY || process.env.CHINDA_API_KEY, // Use ChindaX key as fallback
        baseURL: process.env.OPENAI_BASE_URL || process.env.CHINDA_BASE_URL || 'https://chindax.iapp.co.th/api',
        defaultModel: 'accounts/fireworks/models/gpt-oss-120b',
        model: process.env.OPENAI_MODEL || 'accounts/fireworks/models/gpt-oss-120b',
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 1000,
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
        enabled: !!(process.env.OPENAI_API_KEY || process.env.CHINDA_API_KEY), // Enable if either key exists
        models: ['accounts/fireworks/models/gpt-oss-120b'],
        role: 'Advanced Language Model Expert',
        specialties: ['advanced reasoning', 'complex problem solving', 'detailed analysis', 'large context handling'],
        priority: 2,
        eatCapabilities: {
            expertise: 95,
            experience: 90,
            authoritativeness: 88,
            trustworthiness: 85
        }
    },
    deepseek: {
        name: 'DeepSeek',
        provider: 'DeepSeekProvider',
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
        defaultModel: 'deepseek-chat',
        enabled: process.env.DEEPSEEK_ENABLED === 'true',
        models: ['deepseek-chat', 'deepseek-coder'],
        role: 'Technical Expertise Validator',
        specialties: ['technical accuracy', 'expertise validation', 'depth analysis', 'schema markup'],
        priority: 3,
        eatCapabilities: {
            expertise: 95,
            experience: 80,
            authoritativeness: 85,
            trustworthiness: 85
        }
    },
    gemini: {
        name: 'Google Gemini',
        provider: 'GeminiProvider',
        apiKey: process.env.GEMINI_API_KEY,
        baseURL: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
        defaultModel: 'gemini-2.5-flash',
        enabled: !!process.env.GEMINI_API_KEY,
        models: ['gemini-pro', 'gemini-pro-vision', 'gemini-2.5-flash'],
        role: 'Content Comprehensiveness Enhancer',
        specialties: ['content breadth', 'comprehensive coverage', 'engaging elements', 'multimodal content'],
        priority: 4,
        eatCapabilities: {
            expertise: 75,
            experience: 60,
            authoritativeness: 70,
            trustworthiness: 65
        }
    },
    chinda: {
        name: 'ChindaX AI',
        provider: 'ChindaAIProvider',
        apiKey: process.env.CHINDA_API_KEY,
        baseURL: process.env.CHINDA_BASE_URL || 'https://chindax.iapp.co.th/api',
        defaultModel: 'chinda-qwen3-4b',
        model: process.env.CHINDA_MODEL || 'chinda-qwen3-4b',
        maxTokens: parseInt(process.env.CHINDA_MAX_TOKENS) || 2000,
        temperature: parseFloat(process.env.CHINDA_TEMPERATURE) || 0.7,
        enabled: !!process.env.CHINDA_API_KEY,
        models: ['chinda-qwen3-4b'],
        role: 'Local Authority & Cultural Expert',
        specialties: ['local expertise', 'cultural authority', 'thai context', 'local seo'],
        priority: 5,
        eatCapabilities: {
            expertise: 80,
            experience: 85,
            authoritativeness: 75,
            trustworthiness: 80
        }
    }
};

// JWT Configuration
const jwtConfig = {
    secret: process.env.JWT_SECRET || process.env.CHINDA_JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    issuer: process.env.JWT_ISSUER || 'rbck-cms'
};

// Validation function
const validateConfig = (providerName, config) => {
    if (!config.enabled) {
        console.warn(`⚠️  Provider ${providerName} is disabled`);
        return false;
    }

    if (!config.apiKey) {
        console.error(`❌ Provider ${providerName}: API key is required`);
        return false;
    }

    // ChindaX only requires API key

    if (!config.baseURL) {
        console.error(`❌ Provider ${providerName}: Base URL is required`);
        return false;
    }

    console.log(`✅ Provider ${providerName} configuration validated`);
    return true;
};

const getEnabledProviders = () => {
    const enabled = {};
    
    Object.keys(providersConfig).forEach(providerName => {
        const config = providersConfig[providerName];
        if (validateConfig(providerName, config)) {
            enabled[providerName] = config; // Return object with config
        }
    });

    return enabled;
};

const getEnabledProvidersWithConfig = () => {
    const enabled = [];
    
    Object.keys(providersConfig).forEach(providerName => {
        const config = providersConfig[providerName];
        if (validateConfig(providerName, config)) {
            enabled.push({
                name: providerName,
                ...config
            });
        }
    });

    return enabled;
};

const getProviderConfig = (providerName) => {
    const config = providersConfig[providerName];
    
    if (!config) {
        throw new Error(`Provider ${providerName} not found in configuration`);
    }

    if (!validateConfig(providerName, config)) {
        throw new Error(`Provider ${providerName} configuration is invalid`);
    }

    return config;
};

const getDefaultProvider = () => {
    const enabled = getEnabledProviders();
    const enabledKeys = Object.keys(enabled);
    return enabledKeys.length > 0 ? enabledKeys[0] : null;
};

module.exports = {
    providersConfig,
    getEnabledProviders,
    getEnabledProvidersWithConfig,
    getProviderConfig,
    getDefaultProvider,
    jwtConfig,
    validateConfig,
    
    // Helper functions
    isProviderEnabled: (providerName) => {
        return providersConfig[providerName]?.enabled && !!providersConfig[providerName]?.apiKey;
    },
    
    getAllProviders: () => {
        return Object.keys(providersConfig);
    },
    
    // Get just provider names as array (for backward compatibility)
    getEnabledProviderNames: () => {
        return Object.keys(getEnabledProviders());
    }
};
