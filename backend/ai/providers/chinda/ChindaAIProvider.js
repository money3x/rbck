const BaseProvider = require('../base/BaseProvider');
const axios = require('axios');

class ChindaAIProvider extends BaseProvider {
    constructor(config) {
        super(config);
        
        this.baseURL = config.baseURL || 'https://chindax.iapp.co.th/api';
        this.apiKey = config.apiKey;
        this.jwtToken = config.jwtToken;
        
        if (!this.apiKey || !this.jwtToken) {
            throw new Error('ChindaX requires both API Key and JWT Token');
        }
    }

    async generateResponse(prompt, options = {}) {
        try {            const requestBody = {
                // อัพเดท model name ให้ถูกต้อง
                model: options.model || "chinda-qwen3-32b", // ✅ ใช้ chinda-qwen3-32b
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: options.maxTokens || 1000,
                temperature: options.temperature || 0.7
            };

            const fullURL = `${this.baseURL}/chat/completions`;
            
            console.log('Sending request to ChindaX:', {
                url: fullURL,
                model: requestBody.model
            });

            const response = await axios.post(fullURL, requestBody, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'X-JWT-Token': this.jwtToken
                },
                timeout: 30000
            });

            return {
                content: response.data.choices[0].message.content,
                usage: response.data.usage,
                model: response.data.model,
                id: response.data.id,
                created: response.data.created
            };

        } catch (error) {
            console.error('ChindaX API Error:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            });
            
            throw new Error(`ChindaX API Error: ${error.response?.data?.error?.message || error.message}`);
        }
    }    async testConnection() {
        try {
            const testResponse = await this.generateResponse("สวัสดีครับ", {
                model: "chinda-qwen3-32b",
                maxTokens: 50
            });
            
            console.log('✅ ChindaX connection test successful');
            return testResponse;
        } catch (error) {
            console.error('❌ ChindaX connection test failed:', error.message);
            throw error;
        }
    }
}

module.exports = ChindaAIProvider;