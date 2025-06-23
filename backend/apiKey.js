// Enhanced API Key Management Routes with Encryption
// Environment variables are loaded by server.js
const express = require('express');
const router = express.Router();

// Import secure API key manager and security middleware
const apiKeyManager = require('./models/apiKeys');
const { authenticateAdmin } = require('./middleware/auth');
const { apiKeyRateLimit } = require('./middleware/rateLimiter');
const { logger } = require('./middleware/errorHandler');

// ======= SECURE API KEY MANAGEMENT =======

// GET /api/apikey - Retrieve API keys securely (Admin only)
router.get('/apikey', 
    apiKeyRateLimit,      // Rate limiting
    authenticateAdmin,    // Admin authentication required
    (req, res) => {
        try {
            // Get masked API keys for display
            const maskedKeys = apiKeyManager.getMaskedKeys();
            const stats = apiKeyManager.getStats();
            
            // Log admin action for security audit
            logger.info(`🔍 API keys retrieved by admin: ${req.user.username} from ${req.ip}`);
            
            res.json({
                success: true,
                data: {
                    keys: maskedKeys,
                    stats: {
                        totalProviders: stats.totalKeys,
                        lastUsed: stats.lastUsed
                    }
                },
                message: 'API keys retrieved successfully',
                timestamp: new Date().toISOString()
            });
        } catch (error) {            logger.error('Error fetching API keys:', error);
            res.status(500).json({ 
                success: false,
                error: 'Failed to retrieve API keys',
                code: 'RETRIEVAL_ERROR'
            });
        }
    }
);

// GET /api/apikey/display - Get masked API keys for UI display
router.get('/apikey/display', 
    apiKeyRateLimit,      
    authenticateAdmin,    
    (req, res) => {
        try {
            const maskedKeys = apiKeyManager.getMaskedKeys();
            const stats = apiKeyManager.getStats();
            
            logger.info(`🔍 Masked API keys retrieved by admin: ${req.user.username} from ${req.ip}`);
            
            res.json({
                success: true,
                data: {
                    keys: maskedKeys,
                    stats: {
                        totalProviders: stats.totalKeys,
                        providers: stats.providers.map(p => ({
                            name: p.name,
                            hasKey: true,
                            lastUsed: p.lastUsed
                        }))
                    }
                },
                message: 'Masked API keys retrieved successfully',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error('Error fetching masked API keys:', error);
            res.status(500).json({ 
                success: false,
                error: 'Failed to retrieve masked API keys',
                code: 'RETRIEVAL_ERROR'
            });
        }
    }
);

// POST /api/apikey - Save API keys securely (Admin only)
router.post('/apikey', 
    express.json(), 
    apiKeyRateLimit,      // Rate limiting
    authenticateAdmin,    // Admin authentication required
    (req, res) => {
        try {
            const { provider, apiKey } = req.body;
            
            // Validate input
            if (!provider || !apiKey) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Missing required fields',
                    message: 'Provider and API key are required',
                    code: 'MISSING_FIELDS'
                });
            }
            
            // Validate provider
            const validProviders = ['openai', 'claude', 'gemini', 'deepseek', 'chinda'];
            if (!validProviders.includes(provider.toLowerCase())) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid provider',
                    message: `Provider must be one of: ${validProviders.join(', ')}`,
                    code: 'INVALID_PROVIDER'
                });
            }
            
            // Validate API key format
            const validation = apiKeyManager.validateApiKey(provider, apiKey);
            if (!validation.valid) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid API key format',
                    message: validation.error,
                    code: 'INVALID_API_KEY'
                });
            }
            
            // Store API key securely
            apiKeyManager.setApiKey(provider, apiKey);
              // Log admin action for security audit
            logger.info(`🔐 API key updated for ${provider} by admin: ${req.user.username} from ${req.ip}`);
            
            res.json({
                success: true,
                message: `API key for ${provider} updated successfully`,
                data: {
                    provider,
                    masked: apiKey.substring(0, 8) + '*'.repeat(Math.max(apiKey.length - 8, 8)),
                    timestamp: new Date().toISOString()
                }
            });
            
        } catch (error) {
            logger.error('Error updating API key:', error);
            res.status(500).json({ 
                success: false,
                error: 'Failed to update API key',
                code: 'UPDATE_ERROR'
            });
        }
    }
);

// POST /api/apikey/test - Test API key functionality
router.post('/apikey/test',
    express.json(),
    apiKeyRateLimit,
    authenticateAdmin,
    async (req, res) => {
        try {
            const { provider } = req.body;
            
            if (!provider) {
                return res.status(400).json({
                    success: false,
                    error: 'Provider required',
                    code: 'MISSING_PROVIDER'
                });
            }
            
            // Check if API key exists
            const hasKey = apiKeyManager.hasApiKey(provider);
            if (!hasKey) {
                return res.status(404).json({
                    success: false,
                    error: 'API key not found',
                    message: `No API key configured for ${provider}`,
                    code: 'KEY_NOT_FOUND'
                });
            }
            
            // Simple test - just verify key exists and is accessible
            const testKey = apiKeyManager.getApiKey(provider);
            const isValid = testKey && testKey.length > 0;
            
            logger.info(`API key test for ${provider} by admin: ${req.user.username} - Result: ${isValid ? 'Success' : 'Failed'}`);
            
            res.json({
                success: true,
                data: {
                    provider,
                    status: isValid ? 'valid' : 'invalid',
                    keyLength: testKey ? testKey.length : 0,
                    timestamp: new Date().toISOString()
                }
            });
            
        } catch (error) {
            logger.error('API key test error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to test API key',
                code: 'TEST_ERROR'
            });
        }
    }
);

module.exports = router;
