const axios = require('axios');
const BaseProvider = require('../base/BaseProvider');

class ChindaAIProvider extends BaseProvider {    constructor(config) {
        super(config);
        this.baseURL = config.baseURL || config.baseUrl;
        this.apiKey = config.apiKey;
        this.jwtToken = config.jwtToken;
        
        // Configure axios instance with timeout
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 30000, // 30 seconds for AI processing
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.jwtToken}`,
                'X-API-Key': this.apiKey
            }
        });
        
        if (!this.baseURL || !this.apiKey || !this.jwtToken) {
            throw new Error('ChindaX configuration incomplete');
        }
    }
    
    async generateResponse(prompt, options = {}) {
        try {
            console.log(`🤖 [ChindaX] Generating response...`);
            
            const response = await this.client.post('/generate', {
                prompt: prompt,
                model: options.model || 'chinda-qwen3-32b',
                max_tokens: options.maxTokens || 1000,
                temperature: options.temperature || 0.7
            });
            
            // axios auto-handles JSON parsing
            const content = response.data.content || 
                          response.data.response || 
                          response.data.text || 
                          response.data.message;
                          
            if (!content) {
                throw new Error('No content received from ChindaX');
            }
            
            return {
                content: content,
                model: options.model || 'chinda-qwen3-32b',
                provider: 'ChindaX'
            };
            
        } catch (error) {
            console.error('❌ [ChindaX] Generation error:', error.message);
            
            if (error.response) {
                // HTTP error from ChindaX API
                const status = error.response.status;
                const message = error.response.data?.message || 'Unknown API error';
                throw new Error(`ChindaX API error [${status}]: ${message}`);
            } else if (error.request) {
                // Network error
                throw new Error('ChindaX API network error - please check connection');
            } else {
                // Configuration or other error
                throw new Error(`ChindaX error: ${error.message}`);
            }
        }
    }

    async generateContent(prompt) {
        // For backward compatibility
        const response = await this.generateResponse(prompt);
        return response.content;
    }
    
    async validateRequest(data) {
        if (!data || !data.prompt) {
            return { isValid: false, errors: ['Prompt is required'] };
        }
        if (data.prompt.length > 8000) {
            return { isValid: false, errors: ['Prompt too long (max 8000 chars)'] };
        }
        return { isValid: true, errors: [] };
    }
    
    formatResponse(response) {
        return {
            content: response,
            provider: 'chinda',
            model: 'chinda-qwen3-32b'
        };
    }
}

module.exports = ChindaAIProvider;