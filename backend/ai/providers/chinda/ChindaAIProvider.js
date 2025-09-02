const BaseProvider = require('../base/BaseProvider');
const axios = require('axios');

class ChindaAIProvider extends BaseProvider {    
    constructor(config) {
        super(config);
        this.baseURL = config.baseURL || config.baseUrl;
        this.apiKey = config.apiKey;
        
        // Enhanced token configuration for comprehensive content generation
        this.tokenLimits = {
            short: 2500,        // ~1,500-2,000 words
            medium: 5000,       // ~3,000-3,500 words  
            long: 7500,         // ~4,500-5,000 words
            comprehensive: 10000, // ~6,000+ words
            default: 5000       // Medium length as default
        };
        
        // Configure axios instance for ChindaX API
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 15000, // Extended timeout for longer content
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}` // ChindaX uses API key as Bearer token
            },
            // Connection optimization
            maxRedirects: 5,
            maxContentLength: 100000 // Increased for longer responses
        });
        
        console.log(`📏 [ChindaX] Enhanced token limits configured:`, this.tokenLimits);
        
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
            
            // Enhanced token configuration for comprehensive content generation
            console.log(`🔍 [ChindaX] DEBUG - Raw options received:`, JSON.stringify(options, null, 2));
            
            const contentLength = options.contentLength || 'default';
            const maxTokens = this.calculateOptimalTokens(options.maxTokens, contentLength, options.articleType);
            
            console.log(`🔍 [ChindaX] DEBUG - Token calculation:`, {
                explicitTokens: options.maxTokens,
                contentLength: contentLength,
                articleType: options.articleType,
                calculatedTokens: maxTokens
            });
            
            const requestData = {
                model: options.model || 'chinda-qwen3-4b',
                messages: messages,
                max_tokens: maxTokens,
                temperature: options.temperature || 0.7
            };
            
            console.log(`📏 [ChindaX] Using enhanced token limit: ${maxTokens} (type: ${contentLength})`);
            
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
            if (!data.choices?.[0]?.message) {
                throw new Error('Invalid response format from ChindaX API');
            }
            
            const content = data.choices[0].message.content;
            if (!content) {
                throw new Error('No content received from ChindaX');
            }
            
            const result = {
                content: content,
                model: data.model || options.model || 'chinda-qwen3-4b',
                provider: 'chinda',
                usage: data.usage || {},
                tokenLimit: requestData.max_tokens,
                contentLength: options.contentLength || 'default',
                wordCount: this.estimateWordCount(content)
            };
            
            console.log(`✅ [ChindaX] Generated ${result.wordCount} words using ${requestData.max_tokens} token limit`);
            return result;
            
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
       if (!data?.prompt) {
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
    
    /**
     * Calculate Optimal Token Limit
     * Determines the best token limit based on content requirements
     */
    calculateOptimalTokens(explicitTokens, contentLength = 'default', articleType = null) {
        // If explicit tokens provided, use them (with reasonable bounds)
        if (explicitTokens) {
            return Math.min(Math.max(explicitTokens, 1000), 12000); // Min 1000, Max 12000
        }

        // Article type specific tokens
        if (articleType) {
            const articleTokens = {
                'engine_maintenance': 6000,        // Comprehensive technical guides
                'hydraulic_repair': 7000,          // Detailed troubleshooting
                'troubleshooting': 8000,           // Extensive diagnostic guides  
                'seasonal_maintenance': 5500,       // Seasonal checklists
                'parts_replacement': 6500          // Step-by-step instructions
            };
            
            if (articleTokens[articleType]) {
                console.log(`📄 [ChindaX] Using article-specific token limit for ${articleType}: ${articleTokens[articleType]}`);
                return articleTokens[articleType];
            }
        }

        // Content length based tokens
        if (this.tokenLimits[contentLength]) {
            return this.tokenLimits[contentLength];
        }

        // Default fallback
        return this.tokenLimits.default;
    }

    /**
     * Estimate Word Count
     * Rough estimation of word count from content
     */
    estimateWordCount(content) {
        if (!content) return 0;
        
        // Handle Thai and English mixed content
        const englishWords = (content.match(/[a-zA-Z]+/g) || []).length;
        const thaiChars = (content.match(/[\u0E00-\u0E7F]/g) || []).length;
        const thaiWords = Math.floor(thaiChars / 4); // Approximate: 4 Thai chars = 1 word
        
        return englishWords + thaiWords;
    }

    /**
     * Get Token Limit Information  
     * Returns available token limit configurations
     */
    getTokenLimitInfo() {
        return {
            available: this.tokenLimits,
            articleTypes: {
                'engine_maintenance': 6000,
                'hydraulic_repair': 7000, 
                'troubleshooting': 8000,
                'seasonal_maintenance': 5500,
                'parts_replacement': 6500
            },
            recommendedWordCounts: {
                short: '1,500-2,000 words',
                medium: '3,000-3,500 words', 
                long: '4,500-5,000 words',
                comprehensive: '6,000+ words'
            }
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
            await this.generateResponse('test', { maxTokens: 5, temperature: 0.1 });
            // If we reach here, the API is reachable and working
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