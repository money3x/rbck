const axios = require('axios');
const BaseProvider = require('../base/BaseProvider');

class ChindaAIProvider extends BaseProvider {    constructor(config) {
        super(config);
        this.baseURL = config.baseURL || config.baseUrl;
        this.apiKey = config.apiKey;
        this.jwtToken = config.jwtToken;
        
        // Debug: ตรวจสอบ config ที่ได้รับ
        console.log('🔍 [ChindaX] Constructor config:', {
            baseURL: this.baseURL,
            apiKey: this.apiKey ? this.apiKey.substring(0, 20) + '...' : 'NOT SET',
            apiKeyLength: this.apiKey ? this.apiKey.length : 0,
            jwtToken: this.jwtToken ? 'Present' : 'Not set'
        });
        
        // Additional debug: Log the exact URL being used
        console.log('🔍 [ChindaX] Will make requests to:', `${this.baseURL}/chat/completions`);
        
        // Configure axios instance with timeout (ไม่ใส่ Authorization header ตรงนี้)
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 30000, // 30 seconds for AI processing
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'RBCK-CMS/1.0'
            }
        });
        
        if (!this.baseURL || !this.apiKey) {
            throw new Error('ChindaX configuration incomplete');
        }
    }
    
    async generateResponse(prompt, options = {}) {
        try {
            console.log(`🤖 [ChindaX] Generating response...`);
            console.log(`🔍 [ChindaX] Base URL: ${this.baseURL}`);
            console.log(`🔍 [ChindaX] API Key: ${this.apiKey ? 'Present' : 'Missing'}`);
            console.log(`🔍 [ChindaX] API Key value: ${this.apiKey ? this.apiKey.substring(0, 20) + '...' : 'Not set'}`);
            console.log(`🔍 [ChindaX] API Key length: ${this.apiKey ? this.apiKey.length : 0}`);
            
            const requestData = {
                model: options.model || 'chinda-qwen3-32b',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: options.maxTokens || 1000,
                temperature: options.temperature || 0.7
            };
            
            console.log(`🔍 [ChindaX] Request data:`, JSON.stringify(requestData, null, 2));
            
            // Chinda API ใช้ OpenAI-compatible format
            const response = await this.client.post('/chat/completions', requestData, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            
            console.log(`🔍 [ChindaX] Response received:`, JSON.stringify(response.data, null, 2));
            
            // Chinda API response format
            const content = response.data.choices?.[0]?.message?.content || 
                          response.data.content || 
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
                const responseData = error.response.data;
                console.error('❌ [ChindaX] Response status:', status);
                console.error('❌ [ChindaX] Response data:', JSON.stringify(responseData, null, 2));
                console.error('❌ [ChindaX] Response headers:', JSON.stringify(error.response.headers, null, 2));
                
                const message = responseData?.message || responseData?.detail || 'Unknown API error';
                throw new Error(`ChindaX API error [${status}]: ${message}`);
            } else if (error.request) {
                // Network error
                console.error('❌ [ChindaX] Request config:', JSON.stringify(error.request, null, 2));
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