const BaseProvider = require('../base/BaseProvider');
const axios = require('axios');

class ChindaAIProvider extends BaseProvider {    
    constructor(config) {
        super(config);
        this.baseURL = config.baseURL || config.baseUrl;
        this.apiKey = config.apiKey;
        
        // Configure axios instance for ChindaX API
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 30000, // 30 seconds for AI processing
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}` // ChindaX uses API key as Bearer token
            }
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
            
            // Convert prompt to OpenAI-compatible messages format
            const messages = [
                {
                    role: 'user',
                    content: prompt
                }
            ];
            
            const requestData = {
                model: options.model || 'chinda-qwen3-4b',
                messages: messages,
                max_tokens: options.maxTokens || 1000,
                temperature: options.temperature || 0.7
            };
            
            console.log(`📤 [ChindaX] Request details:`, {
                url: `${this.baseURL}/chat/completions`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey.substring(0, 8)}...`
                },
                data: JSON.stringify(requestData, null, 2)
            });
            
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
                model: data.model || options.model || 'chinda-qwen3-4b',
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
                
                // Enhanced error debugging
                console.error('🔍 [ChindaX] Error response details:', {
                    status: status,
                    statusText: error.response.statusText,
                    data: JSON.stringify(errorData, null, 2),
                    headers: error.response.headers
                });
                
                // Handle OpenAI-compatible error format
                if (errorData?.error?.message) {
                    message = errorData.error.message;
                } else if (errorData?.message) {
                    message = errorData.message;
                } else if (errorData?.detail) {
                    message = errorData.detail; // For FastAPI format
                } else if (typeof errorData === 'string') {
                    message = errorData;
                } else {
                    message = `Raw error: ${JSON.stringify(errorData)}`;
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
            model: 'chinda-qwen3-4b'
        };
    }
    
    async checkHealth() {
        try {
            // Simple connection test first
            const startTime = Date.now();
            
            // Test if we have valid configuration
            if (!this.baseURL || !this.apiKey) {
                throw new Error('Missing baseURL or API key');
            }
            
            // Try a very minimal request
            const testResponse = await this.generateResponse('test', { maxTokens: 5, temperature: 0.1 });
            const responseTime = Date.now() - startTime;
            
            return {
                status: 'healthy',
                provider: 'chinda',
                model: 'chinda-qwen3-4b',
                responseTime: responseTime
            };
        } catch (error) {
            console.error('🔥 [ChindaX] Health check failed:', error.message.substring(0, 300));
            
            // For HTTP 400 errors, try to mark as temporarily down but not failed
            if (error.message.includes('400')) {
                return {
                    status: 'unhealthy',
                    provider: 'chinda',
                    error: 'HTTP 400 - API request format issue (temporary)',
                    recoverable: true
                };
            }
            
            return {
                status: 'unhealthy',
                provider: 'chinda',
                error: error.message.substring(0, 300)
            };
        }
    }
}

module.exports = ChindaAIProvider;