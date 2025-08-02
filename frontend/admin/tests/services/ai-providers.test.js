/**
 * 🧪 AI Providers Service Tests
 * Comprehensive testing for AI provider management
 */

import { AIProvidersService } from '../../js/services/ai-providers.js';

describe('AIProvidersService', () => {
    let aiService;

    beforeEach(() => {
        // Setup DOM
        global.testUtils.setupDOM(`
            <div id="app">
                <div id="provider-container">
                    <div class="provider-card" data-provider="openai">
                        <input class="api-key-input" type="password" />
                        <button class="test-btn">Test</button>
                        <div class="status-indicator"></div>
                    </div>
                    <div class="provider-card" data-provider="anthropic">
                        <input class="api-key-input" type="password" />
                        <button class="test-btn">Test</button>
                        <div class="status-indicator"></div>
                    </div>
                </div>
            </div>
        `);

        aiService = new AIProvidersService();

        // Clear localStorage and fetch mocks
        global.localStorage.clear();
        global.fetch.mockClear();
    });

    afterEach(() => {
        global.testUtils.cleanupDOM();
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        test('should initialize with default providers', () => {
            expect(aiService.providers.size).toBeGreaterThan(0);
            expect(aiService.providers.has('openai')).toBe(true);
            expect(aiService.providers.has('anthropic')).toBe(true);
            expect(aiService.providers.has('google')).toBe(true);
        });

        test('should load saved API keys from localStorage', () => {
            // Mock saved keys
            global.localStorage.setItem('aiProvider_openai_apiKey', 'test-openai-key');
            global.localStorage.setItem('aiProvider_anthropic_apiKey', 'test-anthropic-key');
            
            const newService = new AIProvidersService();
            
            expect(newService.providers.get('openai').apiKey).toBe('test-openai-key');
            expect(newService.providers.get('anthropic').apiKey).toBe('test-anthropic-key');
        });

        test('should setup event listeners for provider cards', () => {
            const testButtons = document.querySelectorAll('.test-btn');
            expect(testButtons).toHaveLength(2);
            
            // Each button should have click listener
            testButtons.forEach(btn => {
                expect(btn.onclick).toBeTruthy();
            });
        });
    });

    describe('Provider Configuration', () => {
        test('should save API key for provider', () => {
            const testKey = 'sk-test123456789';
            
            aiService.saveApiKey('openai', testKey);
            
            expect(aiService.providers.get('openai').apiKey).toBe(testKey);
            expect(global.localStorage.setItem).toHaveBeenCalledWith(
                'aiProvider_openai_apiKey',
                testKey
            );
        });

        test('should validate API key format', () => {
            expect(aiService.validateApiKey('openai', 'sk-valid123')).toBe(true);
            expect(aiService.validateApiKey('openai', 'invalid-key')).toBe(false);
            expect(aiService.validateApiKey('openai', '')).toBe(false);
            
            expect(aiService.validateApiKey('anthropic', 'sk-ant-valid123')).toBe(true);
            expect(aiService.validateApiKey('anthropic', 'sk-invalid')).toBe(false);
        });

        test('should update provider status', () => {
            const openaiCard = document.querySelector('[data-provider="openai"]');
            const statusIndicator = openaiCard.querySelector('.status-indicator');
            
            aiService.updateProviderStatus('openai', 'working', 'API key is valid');
            
            expect(statusIndicator.classList.contains('status-working')).toBe(true);
            expect(statusIndicator.textContent).toContain('API key is valid');
        });

        test('should get available providers', () => {
            // Set some providers as working
            aiService.providers.get('openai').status = 'working';
            aiService.providers.get('anthropic').status = 'error';
            aiService.providers.get('google').status = 'working';
            
            const available = aiService.getAvailableProviders();
            
            expect(available).toHaveLength(2);
            expect(available.map(p => p.name)).toEqual(['openai', 'google']);
        });
    });

    describe('Provider Testing', () => {
        test('should test provider successfully', async () => {
            const testKey = 'sk-test123';
            
            // Mock successful API response
            global.fetch.mockResolvedValueOnce(
                global.testUtils.mockApiResponse({
                    choices: [{ message: { content: 'Test response' } }],
                    usage: { total_tokens: 50 }
                })
            );
            
            const result = await aiService.testProvider('openai', testKey);
            
            expect(result.success).toBe(true);
            expect(result.responseTime).toBeDefined();
            expect(result.message).toContain('Connection successful');
            
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('openai'),
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Authorization': `Bearer ${testKey}`,
                        'Content-Type': 'application/json'
                    })
                })
            );
        });

        test('should handle provider test failure', async () => {
            const testKey = 'sk-invalid';
            
            // Mock API error
            global.fetch.mockRejectedValueOnce(new Error('Invalid API key'));
            
            const result = await aiService.testProvider('openai', testKey);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid API key');
            expect(result.responseTime).toBeDefined();
        });

        test('should handle rate limiting gracefully', async () => {
            const testKey = 'sk-ratelimited';
            
            // Mock rate limit response
            global.fetch.mockResolvedValueOnce(
                global.testUtils.mockApiResponse(
                    { error: 'Rate limit exceeded' },
                    429
                )
            );
            
            const result = await aiService.testProvider('openai', testKey);
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('Rate limit');
        });

        test('should test all providers', async () => {
            // Set up API keys
            aiService.saveApiKey('openai', 'sk-openai123');
            aiService.saveApiKey('anthropic', 'sk-ant-anthropic123');
            
            // Mock responses
            global.fetch
                .mockResolvedValueOnce(
                    global.testUtils.mockApiResponse({ choices: [{ message: { content: 'OpenAI works' } }] })
                )
                .mockResolvedValueOnce(
                    global.testUtils.mockApiResponse({ content: [{ text: 'Anthropic works' }] })
                );
            
            const results = await aiService.testAllProviders();
            
            expect(results).toHaveProperty('openai');
            expect(results).toHaveProperty('anthropic');
            expect(results.openai.success).toBe(true);
            expect(results.anthropic.success).toBe(true);
        });
    });

    describe('Auto Testing', () => {
        test('should auto-test providers on startup', async () => {
            // Mock providers with API keys
            global.localStorage.setItem('aiProvider_openai_apiKey', 'sk-test123');
            global.localStorage.setItem('aiProvider_openai_autoTest', 'true');
            
            global.fetch.mockResolvedValueOnce(
                global.testUtils.mockApiResponse({ choices: [{ message: { content: 'Auto test' } }] })
            );
            
            const testSpy = jest.spyOn(AIProvidersService.prototype, 'testProvider');
            
            new AIProvidersService();
            
            await global.testUtils.nextTick();
            
            expect(testSpy).toHaveBeenCalledWith('openai', 'sk-test123');
        });

        test('should enable/disable auto testing', () => {
            aiService.setAutoTesting('openai', true);
            
            expect(global.localStorage.setItem).toHaveBeenCalledWith(
                'aiProvider_openai_autoTest',
                'true'
            );
            
            aiService.setAutoTesting('openai', false);
            
            expect(global.localStorage.setItem).toHaveBeenCalledWith(
                'aiProvider_openai_autoTest',
                'false'
            );
        });
    });

    describe('Provider Statistics', () => {
        test('should track provider usage', () => {
            aiService.trackProviderUsage('openai', 150, 0.003);
            aiService.trackProviderUsage('openai', 200, 0.005);
            
            const stats = aiService.getProviderStats('openai');
            
            expect(stats.totalRequests).toBe(2);
            expect(stats.totalTokens).toBe(350);
            expect(stats.totalCost).toBeCloseTo(0.008);
            expect(stats.averageTokens).toBe(175);
        });

        test('should get overall statistics', () => {
            aiService.trackProviderUsage('openai', 100, 0.002);
            aiService.trackProviderUsage('anthropic', 150, 0.003);
            
            const overallStats = aiService.getOverallStats();
            
            expect(overallStats.totalRequests).toBe(2);
            expect(overallStats.totalTokens).toBe(250);
            expect(overallStats.totalCost).toBeCloseTo(0.005);
            expect(overallStats.providers).toHaveLength(2);
        });
    });

    describe('Provider Recommendations', () => {
        test('should recommend best provider based on stats', () => {
            // Set up stats to favor anthropic
            aiService.trackProviderUsage('openai', 200, 0.01);  // Higher cost
            aiService.trackProviderUsage('anthropic', 180, 0.005);  // Lower cost
            aiService.providers.get('openai').status = 'working';
            aiService.providers.get('anthropic').status = 'working';
            
            const recommendation = aiService.recommendProvider();
            
            expect(recommendation.provider).toBe('anthropic');
            expect(recommendation.reason).toContain('cost-effective');
        });

        test('should recommend based on availability when no stats', () => {
            aiService.providers.get('openai').status = 'working';
            aiService.providers.get('anthropic').status = 'error';
            
            const recommendation = aiService.recommendProvider();
            
            expect(recommendation.provider).toBe('openai');
            expect(recommendation.reason).toContain('available');
        });
    });

    describe('Error Handling', () => {
        test('should handle invalid provider names', () => {
            expect(() => {
                aiService.saveApiKey('invalid-provider', 'test-key');
            }).toThrow('Unknown provider: invalid-provider');
            
            expect(() => {
                aiService.testProvider('invalid-provider', 'test-key');
            }).rejects.toThrow('Unknown provider: invalid-provider');
        });

        test('should handle localStorage errors gracefully', () => {
            // Mock localStorage error
            global.localStorage.setItem.mockImplementation(() => {
                throw new Error('Storage quota exceeded');
            });
            
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            aiService.saveApiKey('openai', 'test-key');
            
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Failed to save API key'),
                expect.any(Error)
            );
            
            consoleSpy.mockRestore();
        });
    });

    describe('Integration', () => {
        test('should integrate with UI elements', () => {
            const openaiCard = document.querySelector('[data-provider="openai"]');
            const apiKeyInput = openaiCard.querySelector('.api-key-input');
            const testBtn = openaiCard.querySelector('.test-btn');
            
            // Simulate user entering API key
            apiKeyInput.value = 'sk-test123';
            global.testUtils.simulateEvent(apiKeyInput, 'input');
            
            expect(aiService.providers.get('openai').apiKey).toBe('sk-test123');
            
            // Mock successful test
            global.fetch.mockResolvedValueOnce(
                global.testUtils.mockApiResponse({ choices: [{ message: { content: 'Test' } }] })
            );
            
            // Simulate test button click
            testBtn.click();
            
            expect(global.fetch).toHaveBeenCalled();
        });
    });
});