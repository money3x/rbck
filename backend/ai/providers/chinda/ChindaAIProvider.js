const axios = require('axios');
const BaseProvider = require('../base/BaseProvider');

class ChindaAIProvider extends BaseProvider {
    constructor(config) {
        super(config);
        this.baseURL = config.baseURL || config.baseUrl;
        this.apiKey = config.apiKey;
        this.jwtToken = config.jwtToken;
        
        // Usage tracking
        this.usageStats = {
            totalRequests: 0,
            totalTokens: 0,
            lastUsed: null,
            requestsToday: 0,
            lastResetDate: new Date().toDateString()
        };
        
        // Only log in development mode - like Gemini
        if (process.env.NODE_ENV === 'development') {
            console.log('🔍 [ChindaX] Provider initialized:', {
                baseURL: this.baseURL,
                apiKey: this.apiKey ? 'Present' : 'Missing'
            });
        }
        
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
            // Reset daily counter if needed
            const today = new Date().toDateString();
            if (this.usageStats.lastResetDate !== today) {
                this.usageStats.requestsToday = 0;
                this.usageStats.lastResetDate = today;
            }
            
            // Update usage stats
            this.usageStats.totalRequests++;
            this.usageStats.requestsToday++;
            this.usageStats.lastUsed = new Date();
            
            // Only log when actually being used (like Gemini)
            if (options.verbose || process.env.NODE_ENV === 'development') {
                console.log(`🤖 [ChindaX] Generating response (${this.usageStats.requestsToday} requests today)...`);
            }
            
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
            
            // Chinda API ใช้ OpenAI-compatible format
            const response = await this.client.post('/chat/completions', requestData, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            
            // Chinda API response format
            const content = response.data.choices?.[0]?.message?.content || 
                          response.data.content || 
                          response.data.response || 
                          response.data.text || 
                          response.data.message;
                          
            if (!content) {
                throw new Error('No content received from ChindaX');
            }
            
            // Update token usage stats
            const tokensUsed = response.data.usage?.total_tokens || 150; // Estimate if not provided
            this.usageStats.totalTokens += tokensUsed;
            
            return {
                content: content,
                model: options.model || 'chinda-qwen3-32b',
                provider: 'ChindaX',
                usage: {
                    total_tokens: tokensUsed,
                    prompt_tokens: response.data.usage?.prompt_tokens || 0,
                    completion_tokens: response.data.usage?.completion_tokens || tokensUsed
                }
            };
            
        } catch (error) {
            // Only log errors for debugging - similar to Gemini
            if (error.response) {
                const status = error.response.status;
                const responseData = error.response.data;
                const message = responseData?.message || responseData?.detail || 'Unknown API error';
                
                // Log minimal error info
                console.error(`❌ [ChindaX] API error [${status}]:`, message);
                
                throw new Error(`ChindaX API error [${status}]: ${message}`);
            } else if (error.request) {
                console.error('❌ [ChindaX] Network error');
                throw new Error('ChindaX API network error - please check connection');
            } else {
                console.error('❌ [ChindaX] Configuration error:', error.message);
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
    
    // Get usage statistics
    getUsageStats() {
        return {
            ...this.usageStats,
            provider: 'ChindaX'
        };
    }
}

module.exports = ChindaAIProvider;