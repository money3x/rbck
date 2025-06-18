const BaseProvider = require('../base/BaseProvider');
const axios = require('axios');

class DeepSeekProvider extends BaseProvider {
    constructor(config) {
        super({
            ...config,
            baseURL: config.baseURL || 'https://api.deepseek.com/v1',
            defaultModel: 'deepseek-chat'
        });
    }

    async generateResponse(prompt, options = {}) {
        try {
            this.validateApiKey();
            
            const response = await axios.post(
                `${this.baseURL}/chat/completions`,
                {
                    model: options.model || this.model,
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: options.maxTokens || 1000,
                    temperature: options.temperature || 0.7,
                    stream: false
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                content: response.data.choices[0].message.content,
                usage: response.data.usage,
                model: response.data.model,
                provider: 'DeepSeek'
            };
        } catch (error) {
            throw this.formatError(error);
        }
    }

    async generateStreamResponse(prompt, options = {}) {
        try {
            this.validateApiKey();
            
            const response = await axios.post(
                `${this.baseURL}/chat/completions`,
                {
                    model: options.model || this.model,
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: options.maxTokens || 1000,
                    temperature: options.temperature || 0.7,
                    stream: true
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
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

module.exports = DeepSeekProvider;
