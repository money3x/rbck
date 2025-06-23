class BaseProvider {
    constructor(config) {
        this.config = config;
        this.apiKey = config.apiKey;
        this.baseURL = config.baseURL;
        this.model = config.model || config.defaultModel;
        this.name = config.name || this.constructor.name.toLowerCase().replace('provider', '');
    }

    async generateResponse(prompt, options = {}) {
        throw new Error('generateResponse method must be implemented by subclass');
    }

    async generateStreamResponse(prompt, options = {}) {
        throw new Error('generateStreamResponse method must be implemented by subclass');
    }

    // Added missing methods required by tests
    async generateContent(prompt, options = {}) {
        return this.generateResponse(prompt, options);
    }

    validateRequest(request) {
        if (!request || typeof request !== 'object') {
            throw new Error('Invalid request format');
        }
        if (!request.prompt && !request.message) {
            throw new Error('Request must contain prompt or message');
        }
        return true;
    }

    formatResponse(response, originalRequest = {}) {
        return {
            success: true,
            provider: this.name,
            model: this.model,
            content: response.content || response.text || response,
            tokens: response.tokens || null,
            timestamp: new Date().toISOString(),
            requestId: originalRequest.id || null
        };
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
