/**
 * 🤖 AI Providers Management Service
 * Centralized AI provider testing, configuration, and management
 * Extracted from index.html for better maintainability
 */

export class AIProvidersService {
    constructor() {
        this.providers = ['openai', 'claude', 'gemini', 'deepseek', 'chinda'];
        this.testResults = {};
        this.apiKeys = {};
        this.init();
    }

    init() {
        this.loadStoredKeys();
        this.setupAutoTesting();
        this.initializeProviderUI();
    }

    /**
     * Test individual AI provider connection
     */
    async testProvider(provider) {
        console.log(`🔄 [${provider}] Testing connection...`);
        
        const badge = document.getElementById(`${provider}-badge`);
        const testBtn = document.getElementById(`test${provider.charAt(0).toUpperCase() + provider.slice(1)}`);
        
        if (badge) {
            badge.textContent = 'Testing...';
            badge.style.background = '#3b82f6';
        }
        
        if (testBtn) {
            testBtn.disabled = true;
            testBtn.textContent = 'Testing...';
        }

        try {
            const apiKey = this.getApiKey(provider);
            if (!apiKey) {
                throw new Error('API key not found');
            }

            const result = await this.performProviderTest(provider, apiKey);
            
            if (result.success) {
                console.log(`✅ [${provider}] Connection successful`);
                if (badge) {
                    badge.textContent = 'Connected ✓';
                    badge.style.background = '#10b981';
                }
                this.showNotification(`${provider} connection successful!`, 'success');
            } else {
                throw new Error(result.error || 'Connection failed');
            }
            
            this.testResults[provider] = result;
            
        } catch (error) {
            console.error(`❌ [${provider}] Test failed:`, error);
            
            if (badge) {
                badge.textContent = 'Failed ✗';
                badge.style.background = '#ef4444';
            }
            
            this.showNotification(`${provider} test failed: ${error.message}`, 'error');
            this.testResults[provider] = { success: false, error: error.message };
        } finally {
            if (testBtn) {
                testBtn.disabled = false;
                testBtn.textContent = 'Test Connection';
            }
        }
    }

    /**
     * Perform actual provider test based on provider type
     */
    async performProviderTest(provider, apiKey) {
        const testConfigs = {
            openai: {
                url: 'https://api.openai.com/v1/models',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            },
            claude: {
                url: 'https://api.anthropic.com/v1/messages',
                headers: {
                    'x-api-key': apiKey,
                    'Content-Type': 'application/json',
                    'anthropic-version': '2023-06-01'
                },
                method: 'POST',
                body: {
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 10,
                    messages: [{ role: 'user', content: 'Hi' }]
                }
            },
            gemini: {
                url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
                headers: { 'Content-Type': 'application/json' },
                method: 'POST',
                body: {
                    contents: [{ parts: [{ text: 'Hi' }] }]
                }
            },
            deepseek: {
                url: 'https://api.deepseek.com/v1/models',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            },
            chinda: {
                url: 'https://api.chindax.ai/v1/health',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        };

        const config = testConfigs[provider];
        if (!config) {
            throw new Error(`Unknown provider: ${provider}`);
        }

        const response = await fetch(config.url, {
            method: config.method || 'GET',
            headers: config.headers,
            body: config.body ? JSON.stringify(config.body) : undefined
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return { success: true, data, provider };
    }

    /**
     * Test provider silently for auto-testing
     */
    async testProviderSilent(provider) {
        try {
            const apiKey = this.getApiKey(provider);
            if (!apiKey) return false;

            const result = await this.performProviderTest(provider, apiKey);
            return result.success;
            
        } catch (error) {
            console.error(`❌ [${provider}] Silent test failed:`, error);
            return false;
        }
    }

    /**
     * Setup auto-testing for API key inputs
     */
    setupAutoTesting() {
        this.providers.forEach(provider => {
            const apiKeyInput = document.getElementById(`${provider}ApiKey`);
            if (apiKeyInput) {
                let autoTestTimeout = null;
                
                apiKeyInput.addEventListener('input', () => {
                    const badge = document.getElementById(`${provider}-badge`);
                    
                    // Clear previous timeout
                    if (autoTestTimeout) {
                        clearTimeout(autoTestTimeout);
                    }
                    
                    // Update badge immediately
                    if (badge) {
                        if (apiKeyInput.value.trim()) {
                            badge.textContent = 'Ready to Test';
                            badge.style.background = '#3b82f6';
                        } else {
                            badge.textContent = 'No API Key';
                            badge.style.background = '#6c757d';
                        }
                    }
                    
                    // Auto-test after 2 seconds of no typing
                    if (apiKeyInput.value.trim().length > 10) {
                        autoTestTimeout = setTimeout(async () => {
                            console.log(`🔄 [${provider}] Auto-testing connection...`);
                            await this.testProvider(provider);
                        }, 2000);
                    }
                });
            }
            
            // Special handling for ChindaX JWT token
            if (provider === 'chinda') {
                const jwtInput = document.getElementById('chindaJwtToken');
                if (jwtInput) {
                    jwtInput.addEventListener('input', () => {
                        const badge = document.getElementById(`${provider}-badge`);
                        if (badge) {
                            if (jwtInput.value.trim()) {
                                badge.textContent = 'JWT Ready';
                                badge.style.background = '#8b5cf6';
                            }
                        }
                    });
                }
            }
        });
    }

    /**
     * Save API key securely
     */
    saveApiKey(provider, apiKey, additionalData = {}) {
        try {
            if (window.SecurityFramework?.Auth?.encryptAndStore) {
                // Use secure storage if available
                window.SecurityFramework.Auth.encryptAndStore(`${provider}_api_key`, apiKey);
            } else {
                // Fallback to localStorage (less secure)
                localStorage.setItem(`${provider}_api_key`, apiKey);
            }
            
            // Store additional data (like JWT tokens)
            if (Object.keys(additionalData).length > 0) {
                Object.entries(additionalData).forEach(([key, value]) => {
                    if (window.SecurityFramework?.Auth?.encryptAndStore) {
                        window.SecurityFramework.Auth.encryptAndStore(`${provider}_${key}`, value);
                    } else {
                        localStorage.setItem(`${provider}_${key}`, value);
                    }
                });
            }
            
            this.apiKeys[provider] = apiKey;
            console.log(`✅ [${provider}] API key saved securely`);
            
            // Auto-test after saving
            setTimeout(() => this.testProvider(provider), 500);
            
        } catch (error) {
            console.error(`❌ [${provider}] Failed to save API key:`, error);
            this.showNotification(`Failed to save ${provider} API key`, 'error');
        }
    }

    /**
     * Get API key securely
     */
    getApiKey(provider) {
        if (this.apiKeys[provider]) {
            return this.apiKeys[provider];
        }
        
        try {
            let apiKey;
            if (window.SecurityFramework?.Auth?.decryptFromStorage) {
                apiKey = window.SecurityFramework.Auth.decryptFromStorage(`${provider}_api_key`);
            } else {
                apiKey = localStorage.getItem(`${provider}_api_key`);
            }
            
            if (apiKey) {
                this.apiKeys[provider] = apiKey;
            }
            
            return apiKey;
            
        } catch (error) {
            console.error(`❌ [${provider}] Failed to retrieve API key:`, error);
            return null;
        }
    }

    /**
     * Load stored API keys on initialization
     */
    loadStoredKeys() {
        this.providers.forEach(provider => {
            const apiKey = this.getApiKey(provider);
            if (apiKey) {
                const input = document.getElementById(`${provider}ApiKey`);
                if (input) {
                    input.value = apiKey;
                }
                
                // Update badge status
                const badge = document.getElementById(`${provider}-badge`);
                if (badge) {
                    badge.textContent = 'Stored Key Found';
                    badge.style.background = '#8b5cf6';
                }
            }
        });
    }

    /**
     * Test all providers
     */
    async testAllProviders() {
        console.log('🔄 [AI Providers] Testing all providers...');
        
        const results = await Promise.allSettled(
            this.providers.map(provider => this.testProvider(provider))
        );
        
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const total = results.length;
        
        this.showNotification(
            `Provider testing complete: ${successful}/${total} successful`,
            successful === total ? 'success' : 'warning'
        );
        
        return results;
    }

    /**
     * Get provider health status
     */
    getProviderStatus() {
        const status = {};
        
        this.providers.forEach(provider => {
            const badge = document.getElementById(`${provider}-badge`);
            const hasKey = !!this.getApiKey(provider);
            const testResult = this.testResults[provider];
            
            status[provider] = {
                hasApiKey: hasKey,
                isConnected: testResult?.success || false,
                lastTest: testResult?.timestamp || null,
                badgeText: badge?.textContent || 'Unknown'
            };
        });
        
        return status;
    }

    /**
     * Initialize provider UI elements
     */
    initializeProviderUI() {
        this.providers.forEach(provider => {
            const testBtn = document.getElementById(`test${provider.charAt(0).toUpperCase() + provider.slice(1)}`);
            if (testBtn) {
                testBtn.addEventListener('click', () => this.testProvider(provider));
            }
            
            const saveBtn = document.getElementById(`save${provider.charAt(0).toUpperCase() + provider.slice(1)}`);
            if (saveBtn) {
                saveBtn.addEventListener('click', () => this.saveProviderConfig(provider));
            }
        });
    }

    /**
     * Save provider configuration
     */
    saveProviderConfig(provider) {
        const apiKeyInput = document.getElementById(`${provider}ApiKey`);
        if (!apiKeyInput) return;
        
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            this.showNotification(`Please enter ${provider} API key`, 'warning');
            return;
        }
        
        const additionalData = {};
        
        // Handle ChindaX JWT token
        if (provider === 'chinda') {
            const jwtInput = document.getElementById('chindaJwtToken');
            if (jwtInput && jwtInput.value.trim()) {
                additionalData.jwt_token = jwtInput.value.trim();
            }
        }
        
        this.saveApiKey(provider, apiKey, additionalData);
    }

    /**
     * Clear provider configuration
     */
    clearProviderConfig(provider) {
        try {
            if (window.SecurityFramework?.Auth?.removeFromStorage) {
                window.SecurityFramework.Auth.removeFromStorage(`${provider}_api_key`);
            } else {
                localStorage.removeItem(`${provider}_api_key`);
            }
            
            delete this.apiKeys[provider];
            delete this.testResults[provider];
            
            const input = document.getElementById(`${provider}ApiKey`);
            if (input) input.value = '';
            
            const badge = document.getElementById(`${provider}-badge`);
            if (badge) {
                badge.textContent = 'No API Key';
                badge.style.background = '#6c757d';
            }
            
            console.log(`✅ [${provider}] Configuration cleared`);
            this.showNotification(`${provider} configuration cleared`, 'info');
            
        } catch (error) {
            console.error(`❌ [${provider}] Failed to clear configuration:`, error);
        }
    }

    /**
     * Export provider configurations
     */
    exportConfigurations() {
        const configs = {};
        
        this.providers.forEach(provider => {
            const status = this.getProviderStatus()[provider];
            configs[provider] = {
                hasApiKey: status.hasApiKey,
                isConnected: status.isConnected,
                lastTest: status.lastTest
                // Note: API keys are NOT exported for security
            };
        });
        
        const exportData = {
            providers: configs,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-providers-config-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Show notification helper
     */
    showNotification(message, type = 'info') {
        // Use existing notification system if available
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            // Fallback to console
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    /**
     * Get provider statistics
     */
    getStatistics() {
        const status = this.getProviderStatus();
        const total = this.providers.length;
        const connected = Object.values(status).filter(s => s.isConnected).length;
        const hasKeys = Object.values(status).filter(s => s.hasApiKey).length;
        
        return {
            totalProviders: total,
            connectedProviders: connected,
            providersWithKeys: hasKeys,
            connectionRate: Math.round((connected / total) * 100),
            keyRate: Math.round((hasKeys / total) * 100),
            providers: status
        };
    }

    /**
     * Refresh all provider connections
     */
    async refreshAllConnections() {
        console.log('🔄 [AI Providers] Refreshing all connections...');
        
        const refreshPromises = this.providers.map(async (provider) => {
            if (this.getApiKey(provider)) {
                return this.testProviderSilent(provider);
            }
            return false;
        });
        
        const results = await Promise.allSettled(refreshPromises);
        const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
        
        console.log(`✅ [AI Providers] Refresh complete: ${successful}/${this.providers.length} connected`);
        return successful;
    }
}

// Export for global access
export default AIProvidersService;