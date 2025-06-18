const BaseProvider = require('../base/BaseProvider');
const axios = require('axios');

class ClaudeProvider extends BaseProvider {
    constructor(config) {
        super({
            ...config,
            baseURL: config.baseURL || 'https://api.anthropic.com/v1',
            defaultModel: 'claude-3-sonnet-20240229'
        });
    }

    async generateResponse(prompt, options = {}) {
        try {
            this.validateApiKey();
            
            const response = await axios.post(
                `${this.baseURL}/messages`,
                {
                    model: options.model || this.model,
                    max_tokens: options.maxTokens || 1000,
                    temperature: options.temperature || 0.7,
                    messages: [{ role: 'user', content: prompt }]
                },
                {
                    headers: {
                        'x-api-key': this.apiKey,
                        'anthropic-version': '2023-06-01',
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                content: response.data.content[0].text,
                usage: response.data.usage,
                model: response.data.model,
                provider: 'Claude'
            };
        } catch (error) {
            throw this.formatError(error);
        }
    }

    async generateStreamResponse(prompt, options = {}) {
        try {
            this.validateApiKey();
            
            const response = await axios.post(
                `${this.baseURL}/messages`,
                {
                    model: options.model || this.model,
                    max_tokens: options.maxTokens || 1000,
                    temperature: options.temperature || 0.7,
                    messages: [{ role: 'user', content: prompt }],
                    stream: true
                },
                {
                    headers: {
                        'x-api-key': this.apiKey,
                        'anthropic-version': '2023-06-01',
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

module.exports = ClaudeProvider;
