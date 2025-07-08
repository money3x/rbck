const BaseProvider = require('../base/BaseProvider');
const axios = require('axios');

class GeminiProvider extends BaseProvider {
    constructor(config) {
        super({
            ...config,
            baseURL: config.baseURL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
            defaultModel: 'gemini-2.0-flash'
        });
    }

    async generateResponse(prompt, options = {}) {
        try {
            this.validateApiKey();
            
            const model = options.model || this.model;
            // Use the complete baseURL that includes the endpoint
            const apiUrl = this.baseURL.includes(':generateContent') 
                ? `${this.baseURL}?key=${this.apiKey}`
                : `${this.baseURL}/models/${model}:generateContent?key=${this.apiKey}`;
            
            const response = await axios.post(apiUrl,
                {
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: options.temperature || 0.7,
                        maxOutputTokens: options.maxTokens || 1000
                    }
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                content: response.data.candidates[0].content.parts[0].text,
                model: model,
                provider: 'Gemini'
            };
        } catch (error) {
            console.error('❌ [GEMINI] generateResponse error:', error);
            console.error('❌ [GEMINI] Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                config: {
                    url: error.config?.url,
                    method: error.config?.method
                }
            });
            
            // Format error properly
            const formattedError = this.formatError(error);
            console.error('❌ [GEMINI] Formatted error:', formattedError);
            throw formattedError;
        }
    }

    async generateStreamResponse(prompt, options = {}) {
        try {
            this.validateApiKey();
            
            const model = options.model || this.model;
            const response = await axios.post(
                `${this.baseURL}/models/${model}:streamGenerateContent?key=${this.apiKey}`,
                {
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: options.temperature || 0.7,
                        maxOutputTokens: options.maxTokens || 1000
                    }
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    responseType: 'stream'
                }
            );

            return response.data;
        } catch (error) {
            throw this.formatError(error);
        }
    }
}

module.exports = GeminiProvider;
