const BaseProvider = require('../base/BaseProvider');
const axios = require('axios');

class ChindaAIProvider extends BaseProvider {    
    constructor(config) {
        super(config);
        this.baseURL = config.baseURL || config.baseUrl;
        this.apiKey = config.apiKey;
        this.jwtToken = config.jwtToken;
        
        // Configure axios instance with timeout for ChindaX API  
        // Try multiple authentication methods
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // Method 1: Standard Bearer token
        if (this.jwtToken && this.jwtToken !== 'test-chinda-jwt-replace-with-real-token') {
            headers['Authorization'] = `Bearer ${this.jwtToken}`;
        } else {
            // Method 2: API Key as Bearer token (fallback)
            headers['Authorization'] = `Bearer ${this.apiKey}`;
        }
        
        // Method 3: Also try X-API-Key (some APIs use this)
        headers['X-API-Key'] = this.apiKey;
        
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 30000, // 30 seconds for AI processing
            headers: headers
        });
        
        if (!this.baseURL || !this.apiKey) {
            throw new Error('ChindaX configuration incomplete: baseURL and apiKey required');
        }
    }
    
    async generateResponse(prompt, options = {}) {
        try {
            console.log(`🤖 [ChindaX] Generating response via ChindaX API...`);
            console.log(`🔐 [ChindaX] Using baseURL: ${this.baseURL}`);
            console.log(`🔐 [ChindaX] API Key: ${this.apiKey.substring(0, 8)}...`);
            console.log(`🔐 [ChindaX] JWT Token: ${this.jwtToken ? this.jwtToken.substring(0, 8) + '...' : 'none'}`);
            
            // Convert prompt to OpenAI-compatible messages format
            const messages = [
                {
                    role: 'user',
                    content: prompt
                }
            ];
            
            const requestData = {
                model: options.model || 'chinda-qwen3-32b',
                messages: messages,
                max_tokens: options.maxTokens || 1000,
                temperature: options.temperature || 0.7
            };
            
            console.log(`📤 [ChindaX] Request data:`, JSON.stringify(requestData, null, 2));
            
            // Use OpenAI-compatible chat/completions endpoint
            const response = await this.client.post('/chat/completions', requestData);
            
            // Parse OpenAI-compatible response format
            const data = response.data;
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('Invalid response format from ChindaX API');
            }
            
            const content = data.choices[0].message.content;
            if (!content) {
                throw new Error('No content received from ChindaX');
            }
            
            return {
                content: content,
                model: data.model || options.model || 'chinda-qwen3-32b',
                provider: 'chinda',
                usage: data.usage || {}
            };
            
        } catch (error) {
            console.error('❌ [ChindaX] Generation error:', error.message);
            
            if (error.response) {
                // HTTP error from ChindaX API
                const status = error.response.status;
                const errorData = error.response.data;
                let message = 'Unknown API error';
                
                // Handle OpenAI-compatible error format
                if (errorData?.error?.message) {
                    message = errorData.error.message;
                } else if (errorData?.message) {
                    message = errorData.message;
                } else if (typeof errorData === 'string') {
                    message = errorData;
                }
                
                throw new Error(`ChindaX API error [${status}]: ${message}`);
            } else if (error.request) {
                // Network error
                throw new Error('ChindaX API network error - please check connection and endpoint');
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
    
    async checkHealth() {
        try {
            // Test with a simple request
            const testResponse = await this.generateResponse('Hello', { maxTokens: 10 });
            return {
                status: 'healthy',
                provider: 'chinda',
                model: 'chinda-qwen3-32b',
                responseTime: Date.now()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                provider: 'chinda',
                error: error.message
            };
        }
    }
}

module.exports = ChindaAIProvider;