/**
 * API Key Management Model
 * Secure storage and retrieval of API keys with encryption
 * Part of Phase 1: Security & Performance enhancements
 */

const crypto = require('crypto');
const { logger } = require('../middleware/errorHandler');

// Environment-based configuration
const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_KEY 
    ? Buffer.from(process.env.API_KEY_ENCRYPTION_KEY, 'base64').subarray(0, 32)
    : crypto.randomBytes(32);
const ALGORITHM = 'aes-256-gcm';

class ApiKeyManager {
    constructor() {
        this.keys = new Map();
        this.loadKeysFromEnv();
    }

    /**
     * Load API keys from environment variables on startup
     */
    loadKeysFromEnv() {
        const providers = ['OPENAI', 'CLAUDE', 'GEMINI', 'DEEPSEEK', 'CHINDA'];
        
        providers.forEach(provider => {
            const envKey = `${provider}_API_KEY`;
            const jwtKey = `${provider}_JWT_TOKEN`; // For providers like Chinda
            
            if (process.env[envKey]) {
                this.setApiKey(provider.toLowerCase(), process.env[envKey]);
                logger.info(`✅ Loaded ${provider} API key from environment`);
            }
            
            if (process.env[jwtKey]) {
                this.setApiKey(`${provider.toLowerCase()}_jwt`, process.env[jwtKey]);
                logger.info(`✅ Loaded ${provider} JWT token from environment`);
            }
        });
    }    /**
     * Encrypt an API key for secure storage
     * @param {string} text - The API key to encrypt
     * @returns {object} - Encrypted data with IV and auth tag
     */
    encrypt(text) {
        if (!text) return null;
        
        try {
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
            
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            const authTag = cipher.getAuthTag();
            
            return {
                encrypted,
                iv: iv.toString('hex'),
                authTag: authTag.toString('hex')
            };
        } catch (error) {
            logger.error('API key encryption failed:', error);
            throw new Error('Failed to encrypt API key');
        }
    }    /**
     * Decrypt an API key for use
     * @param {object} encryptedData - The encrypted data object
     * @returns {string} - Decrypted API key
     */
    decrypt(encryptedData) {
        if (!encryptedData || !encryptedData.encrypted) return null;
        
        try {
            const iv = Buffer.from(encryptedData.iv, 'hex');
            const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
            decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
            
            let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            logger.error('API key decryption failed:', error);
            throw new Error('Failed to decrypt API key');
        }
    }

    /**
     * Set an API key (encrypted storage)
     * @param {string} provider - Provider name (e.g., 'openai', 'claude')
     * @param {string} apiKey - The API key to store
     */
    setApiKey(provider, apiKey) {
        if (!provider || !apiKey) {
            throw new Error('Provider and API key are required');
        }

        const encrypted = this.encrypt(apiKey);
        this.keys.set(provider.toLowerCase(), {
            encrypted,
            createdAt: new Date(),
            lastUsed: null
        });

        logger.info(`🔐 API key stored for provider: ${provider}`);
    }

    /**
     * Get an API key (decrypted for use)
     * @param {string} provider - Provider name
     * @returns {string|null} - Decrypted API key or null if not found
     */
    getApiKey(provider) {
        const keyData = this.keys.get(provider.toLowerCase());
        if (!keyData) return null;

        try {
            const decrypted = this.decrypt(keyData.encrypted);
            
            // Update last used timestamp
            keyData.lastUsed = new Date();
            
            return decrypted;
        } catch (error) {
            logger.error(`Failed to retrieve API key for ${provider}:`, error);
            return null;
        }
    }

    /**
     * Get masked API keys for display purposes
     * @returns {object} - Object with masked API keys
     */
    getMaskedKeys() {
        const masked = {};
        
        for (const [provider, keyData] of this.keys.entries()) {
            try {
                const decrypted = this.decrypt(keyData.encrypted);
                if (decrypted && decrypted.length > 8) {
                    masked[provider] = decrypted.substring(0, 8) + '*'.repeat(Math.max(decrypted.length - 8, 8));
                } else if (decrypted) {
                    masked[provider] = '*'.repeat(8);
                } else {
                    masked[provider] = '';
                }
            } catch (error) {
                masked[provider] = '[ENCRYPTED]';
            }
        }
        
        return masked;
    }

    /**
     * Remove an API key
     * @param {string} provider - Provider name
     */
    removeApiKey(provider) {
        const deleted = this.keys.delete(provider.toLowerCase());
        if (deleted) {
            logger.info(`🗑️ API key removed for provider: ${provider}`);
        }
        return deleted;
    }

    /**
     * Get all stored provider names
     * @returns {Array} - Array of provider names
     */
    getProviders() {
        return Array.from(this.keys.keys());
    }

    /**
     * Check if a provider has an API key
     * @param {string} provider - Provider name
     * @returns {boolean} - True if provider has an API key
     */
    hasApiKey(provider) {
        return this.keys.has(provider.toLowerCase());
    }

    /**
     * Validate API key format for a specific provider
     * @param {string} provider - Provider name
     * @param {string} apiKey - API key to validate
     * @returns {object} - Validation result
     */
    validateApiKey(provider, apiKey) {
        if (!apiKey || typeof apiKey !== 'string') {
            return { valid: false, error: 'API key must be a non-empty string' };
        }

        const validations = {
            openai: /^sk-[A-Za-z0-9]{32,}$/,
            claude: /^sk-ant-[A-Za-z0-9\-_]{32,}$/,
            gemini: /^[A-Za-z0-9\-_]{32,}$/,
            deepseek: /^sk-[A-Za-z0-9]{32,}$/,
            chinda: /^sk-[A-Za-z0-9\-_]{32,}$/ // More flexible for custom provider
        };

        const pattern = validations[provider.toLowerCase()];
        if (!pattern) {
            return { valid: true, warning: 'No validation pattern for this provider' };
        }

        if (!pattern.test(apiKey)) {
            return { 
                valid: false, 
                error: `Invalid API key format for ${provider}` 
            };
        }

        return { valid: true };
    }

    /**
     * Get API key statistics
     * @returns {object} - Statistics about stored API keys
     */
    getStats() {
        const stats = {
            totalKeys: this.keys.size,
            providers: [],
            lastUsed: null
        };

        for (const [provider, keyData] of this.keys.entries()) {
            stats.providers.push({
                name: provider,
                createdAt: keyData.createdAt,
                lastUsed: keyData.lastUsed
            });

            if (keyData.lastUsed && (!stats.lastUsed || keyData.lastUsed > stats.lastUsed)) {
                stats.lastUsed = keyData.lastUsed;
            }
        }

        return stats;
    }
}

// Export singleton instance
module.exports = new ApiKeyManager();
