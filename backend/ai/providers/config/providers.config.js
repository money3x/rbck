require('dotenv').config();

const providersConfig = {
    openai: {
        name: 'OpenAI',
        provider: 'OpenAIProvider',
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
        defaultModel: 'gpt-3.5-turbo',
        enabled: process.env.OPENAI_ENABLED === 'true',
        models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo']
    },
    gemini: {
        name: 'Google Gemini',
        provider: 'GeminiProvider',
        apiKey: process.env.GEMINI_API_KEY,
        baseURL: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
        defaultModel: 'gemini-pro',
        enabled: process.env.GEMINI_ENABLED === 'true',
        models: ['gemini-pro', 'gemini-pro-vision']
    },
    deepseek: {
        name: 'DeepSeek',
        provider: 'DeepSeekProvider',
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
        defaultModel: 'deepseek-chat',
        enabled: process.env.DEEPSEEK_ENABLED === 'true',
        models: ['deepseek-chat', 'deepseek-coder']
    },
    claude: {
        name: 'Anthropic Claude',
        provider: 'ClaudeProvider',
        apiKey: process.env.CLAUDE_API_KEY,
        baseURL: process.env.CLAUDE_BASE_URL || 'https://api.anthropic.com/v1',
        defaultModel: 'claude-3-sonnet-20240229',
        enabled: process.env.CLAUDE_ENABLED === 'true',
        models: ['claude-3-sonnet-20240229', 'claude-3-opus-20240229', 'claude-3-haiku-20240307']
    },    
    chinda: {
        apiKey: process.env.CHINDA_API_KEY,
        jwtToken: process.env.CHINDA_JWT_TOKEN,
        baseURL: process.env.CHINDA_BASE_URL || 'https://chindax.iapp.co.th/api',
        model: process.env.CHINDA_MODEL || 'chinda-qwen3-32b', // ✅ อัพเดท model name
        maxTokens: parseInt(process.env.CHINDA_MAX_TOKENS) || 2000,
        temperature: parseFloat(process.env.CHINDA_TEMPERATURE) || 0.7,
        enabled: !!(process.env.CHINDA_API_KEY && process.env.CHINDA_JWT_TOKEN)
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

    // ChindaX requires both API key and JWT token
    if (providerName === 'chinda' && !config.jwtToken) {
        console.error(`❌ Provider ${providerName}: JWT token is required for ChindaX`);
        return false;
    }

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
            enabled[providerName] = config;
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
    const providerKeys = Object.keys(enabled);
    return providerKeys.length > 0 ? providerKeys[0] : null;
};

module.exports = {
    providersConfig,
    getEnabledProviders,
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
    }
};
