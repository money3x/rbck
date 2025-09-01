const BaseProvider = require('../base/BaseProvider');
const axios = require('axios');

class GeminiProvider extends BaseProvider {
    constructor(config) {
        super({
            ...config,
            baseURL: config.baseURL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
            defaultModel: 'gemini-2.5-flash'
        });
        
        // Enhanced token configuration for comprehensive content generation
        this.tokenLimits = {
            short: 2500,        // ~1,500-2,000 words
            medium: 5000,       // ~3,000-3,500 words  
            long: 7500,         // ~4,500-5,000 words
            comprehensive: 10000, // ~6,000+ words
            default: 5000       // Medium length as default
        };
        
        console.log(`📏 [Gemini] Enhanced token limits configured:`, this.tokenLimits);
    }

    async generateResponse(prompt, options = {}) {
        try {
            this.validateApiKey();
            
            const model = options.model || this.model || 'gemini-2.5-flash';
            // Enhanced token limit calculation
            const contentLength = options.contentLength || 'default';
            const maxTokens = this.calculateOptimalTokens(options.maxTokens, contentLength, options.articleType);
            
            console.log(`🤖 [Gemini] Generating response using model: ${model}`);
            console.log(`📏 [Gemini] Using enhanced token limit: ${maxTokens} (type: ${contentLength})`);
            
            // Always use the configured baseURL pattern
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
            
            const response = await axios.post(apiUrl,
                {
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: options.temperature || 0.7,
                        maxOutputTokens: maxTokens
                    }
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000, // 10 seconds timeout
                    maxContentLength: 50000,
                    maxRedirects: 5
                }
            );

            const content = response.data.candidates[0].content.parts[0].text;
            const result = {
                content: content,
                model: model,
                provider: 'Gemini',
                usage: response.data.usageMetadata || {},
                tokenLimit: maxTokens,
                contentLength: contentLength,
                wordCount: this.estimateWordCount(content)
            };
            
            console.log(`✅ [Gemini] Generated ${result.wordCount} words using ${maxTokens} token limit`);
            return result;
        } catch (error) {
            console.error('❌ [GEMINI] generateResponse error:', error);
            console.error('❌ [GEMINI] Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                config: {
                    url: error.config?.url,
                    method: error.config?.method
                }
            });
            
            // Format error properly
            const formattedError = this.formatError(error);
            console.error('❌ [GEMINI] Formatted error:', formattedError);
            throw formattedError;
        }
    }

    async generateStreamResponse(prompt, options = {}) {
        try {
            this.validateApiKey();
            
            const model = options.model || this.model || 'gemini-2.5-flash';
            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${this.apiKey}`,
                {
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: options.temperature || 0.7,
                        maxOutputTokens: this.calculateOptimalTokens(options.maxTokens, options.contentLength, options.articleType)
                    }
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000, // 10 seconds timeout
                    maxContentLength: 50000,
                    maxRedirects: 5,
                    responseType: 'stream'
                }
            );

            return response.data;
        } catch (error) {
            throw this.formatError(error);
        }
    }
    
    /**
     * Calculate Optimal Token Limit
     * Determines the best token limit based on content requirements
     */
    calculateOptimalTokens(explicitTokens, contentLength = 'default', articleType = null) {
        // If explicit tokens provided, use them (with reasonable bounds)
        if (explicitTokens) {
            return Math.min(Math.max(explicitTokens, 500), 12000); // Min 500, Max 12000
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
                console.log(`📄 [Gemini] Using article-specific token limit for ${articleType}: ${articleTokens[articleType]}`);
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
}

module.exports = GeminiProvider;
