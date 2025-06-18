const BaseProvider = require('../base/BaseProvider');
const axios = require('axios');

class GeminiProvider extends BaseProvider {
    constructor(config) {
        super({
            ...config,
            baseURL: config.baseURL || 'https://generativelanguage.googleapis.com/v1beta',
            defaultModel: 'gemini-pro'
        });
    }

    async generateResponse(prompt, options = {}) {
        try {
            this.validateApiKey();
            
            const model = options.model || this.model;
            const response = await axios.post(
                `${this.baseURL}/models/${model}:generateContent?key=${this.apiKey}`,
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
            throw this.formatError(error);
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
