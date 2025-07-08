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
        console.error('🔍 [BASE PROVIDER] formatError input:', {
            error: error,
            message: error?.message,
            response: error?.response?.data,
            status: error?.response?.status
        });
        
        // Handle different error types
        let errorMessage = 'Unknown error';
        let statusCode = 500;
        
        if (error?.message) {
            errorMessage = error.message;
        } else if (error?.response?.data?.error?.message) {
            errorMessage = error.response.data.error.message;
        } else if (error?.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }
        
        if (error?.response?.status) {
            statusCode = error.response.status;
        } else if (error?.status) {
            statusCode = error.status;
        }
        
        const formattedError = {
            provider: this.constructor.name,
            error: errorMessage,
            status: statusCode,
            timestamp: new Date().toISOString()
        };
        
        console.error('🔍 [BASE PROVIDER] formatError output:', formattedError);
        return formattedError;
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
