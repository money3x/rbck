class BaseProvider {
    constructor(config) {
        this.config = config;
        this.apiKey = config.apiKey;
        this.baseURL = config.baseURL;
        this.model = config.model || config.defaultModel;
    }

    async generateResponse(prompt, options = {}) {
        throw new Error('generateResponse method must be implemented by subclass');
    }

    async generateStreamResponse(prompt, options = {}) {
        throw new Error('generateStreamResponse method must be implemented by subclass');
    }

    validateApiKey() {
        if (!this.apiKey) {
            throw new Error(`API key is required for ${this.constructor.name}`);
        }
    }

    formatError(error) {
        return {
            provider: this.constructor.name,
            error: error.message,
            status: error.status || 500,
            timestamp: new Date().toISOString()
        };
    }

    async checkHealth() {
        try {
            this.validateApiKey();
            return { status: 'healthy', provider: this.constructor.name };
        } catch (error) {
            return { status: 'unhealthy', provider: this.constructor.name, error: error.message };
        }
    }
}

module.exports = BaseProvider;
