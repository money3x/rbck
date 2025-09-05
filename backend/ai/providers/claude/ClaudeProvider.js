const BaseProvider = require('../base/BaseProvider');
const axios = require('axios');

class ClaudeProvider extends BaseProvider {
    constructor(config) {
        super({
            ...config,
            name: 'qwen3',
            // Use ChindaX endpoint for Qwen3-235B model
            baseURL: config.baseURL || process.env.CHINDA_BASE_URL || 'https://chindax.iapp.co.th/api',
            defaultModel: 'Qwen/Qwen3-235B-A22B'
        });
        
        // Enhanced token configuration for comprehensive content generation
        this.tokenLimits = {
            short: 2500,        // ~1,500-2,000 words
            medium: 5000,       // ~3,000-3,500 words  
            long: 7500,         // ~4,500-5,000 words
            comprehensive: 10000, // ~6,000+ words
            default: 5000       // Medium length as default
        };
        
        console.log(`🚀 [Qwen3-235B] Initialized with endpoint: ${this.baseURL}`);
        console.log(`🚀 [Qwen3-235B] Using model: ${this.defaultModel || config.defaultModel}`);
        console.log(`📏 [Qwen3-235B] Enhanced token limits configured:`, this.tokenLimits);
    }

    async generateResponse(prompt, options = {}) {
        try {
            this.validateApiKey();
            
            const model = options.model || this.defaultModel || 'Qwen/Qwen3-235B-A22B';
            
            // Enhanced token limit calculation
            const contentLength = options.contentLength || 'default';
            const maxTokens = this.calculateOptimalTokens(options.maxTokens, contentLength, options.articleType);
            
            console.log(`🤖 [Qwen3-235B] Generating response using model: ${model}`);
            console.log(`📏 [Qwen3-235B] Using enhanced token limit: ${maxTokens} (type: ${contentLength})`);
            console.log(`🔐 [Qwen3-235B] Using endpoint: ${this.baseURL}/chat/completions`);
            
            const response = await axios.post(
                `${this.baseURL}/chat/completions`,
                {
                    model: model,
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: maxTokens,
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

            const result = {
                content: response.data.choices[0].message.content,
                usage: response.data.usage,
                model: response.data.model || model,
                provider: 'Qwen3-235B',
                tokenLimit: maxTokens,
                contentLength: contentLength,
                wordCount: this.estimateWordCount(response.data.choices[0].message.content)
            };
            
            console.log(`✅ [Qwen3-235B] Generated ${result.wordCount} words using ${maxTokens} token limit`);
            return result;
        } catch (error) {
            console.error('❌ [Qwen3-235B] Generation error:', error.message);
            throw this.formatError(error);
        }
    }

    async generateStreamResponse(prompt, options = {}) {
        try {
            this.validateApiKey();
            
            const model = options.model || this.defaultModel || 'Qwen/Qwen3-235B-A22B';
            console.log(`🌊 [Qwen3-235B] Streaming response using model: ${model}`);
            
            const response = await axios.post(
                `${this.baseURL}/chat/completions`,
                {
                    model: model,
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: this.calculateOptimalTokens(options.maxTokens, options.contentLength, options.articleType),
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
            console.error('❌ [Qwen3-235B] Stream error:', error.message);
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
                console.log(`📄 [Qwen3-235B] Using article-specific token limit for ${articleType}: ${articleTokens[articleType]}`);
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
            // Simple connection test
            const startTime = Date.now();
            
            // Test if we have valid configuration
            if (!this.baseURL || !this.apiKey) {
                throw new Error('Missing baseURL or API key');
            }
            
            // Try a very minimal request to test connectivity
            await this.generateResponse('test', { maxTokens: 5, temperature: 0.1 });
            const responseTime = Date.now() - startTime;
            
            return {
                status: 'healthy',
                provider: 'qwen3',
                model: 'Qwen/Qwen3-235B-A22B',
                responseTime: responseTime
            };
        } catch (error) {
            console.error('🔥 [Qwen3-235B] Health check failed:', error.message.substring(0, 300));
            
            return {
                status: 'unhealthy',
                provider: 'qwen3',
                error: error.message.substring(0, 300)
            };
        }
    }
}

module.exports = ClaudeProvider;
