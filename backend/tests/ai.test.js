const request = require('supertest');
const app = require('../server');

describe('AI Integration Tests', () => {
  describe('AI Provider Configuration', () => {
    test('should load AI provider configurations', () => {
      const providersConfig = require('../ai/providers/config/providers.config');
      
      expect(providersConfig).toHaveProperty('providersConfig');
      expect(providersConfig.providersConfig).toHaveProperty('chinda');
      expect(providersConfig.providersConfig).toHaveProperty('openai');
      expect(providersConfig.providersConfig).toHaveProperty('claude');
      expect(providersConfig.providersConfig).toHaveProperty('gemini');
      expect(providersConfig.providersConfig).toHaveProperty('deepseek');
    });
  });
  describe('Provider Factory', () => {
    test('should create provider instances for enabled providers', () => {
      const ProviderFactory = require('../ai/providers/factory/ProviderFactory');
      const { getEnabledProviders } = require('../ai/providers/config/providers.config');
      
      // Get list of enabled providers
      const enabledProviders = Object.keys(getEnabledProviders());
      
      if (enabledProviders.length > 0) {
        enabledProviders.forEach(providerName => {
          expect(() => {
            const provider = ProviderFactory.createProvider(providerName);
            expect(provider).toBeDefined();
          }).not.toThrow();
        });
      } else {
        // If no providers are enabled, test that the factory handles it properly
        expect(enabledProviders).toEqual([]);
      }
    });

    test('should throw error for invalid provider', () => {
      const ProviderFactory = require('../ai/providers/factory/ProviderFactory');
      
      expect(() => {
        ProviderFactory.createProvider('invalid-provider');
      }).toThrow();
    });
  });
  describe('Base Provider', () => {
    test('should have required methods', () => {
      const BaseProvider = require('../ai/providers/base/BaseProvider');
      
      // Test with mock config
      const mockConfig = {
        apiKey: 'test-key',
        baseURL: 'https://test.com',
        model: 'test-model'
      };
      
      const provider = new BaseProvider(mockConfig);
      
      expect(typeof provider.generateContent).toBe('function');
      expect(typeof provider.validateRequest).toBe('function');
      expect(typeof provider.formatResponse).toBe('function');
    });
  });
  describe('ChindaX Provider', () => {
    test('should initialize correctly with valid config', () => {
      const ChindaAIProvider = require('../ai/providers/chinda/ChindaAIProvider');
      
      // Mock config for testing
      const mockConfig = {
        apiKey: 'test-key',
        baseURL: 'https://test.com',
        model: 'test-model',
        jwtToken: 'test-jwt'
      };
      
      expect(() => {
        const provider = new ChindaAIProvider(mockConfig);
        expect(provider).toBeDefined();
        expect(provider.name).toBe('chinda');
      }).not.toThrow();
    });

    test('should validate JWT configuration with mock data', () => {
      const ChindaAIProvider = require('../ai/providers/chinda/ChindaAIProvider');
      
      const mockConfig = {
        apiKey: 'test-key',
        baseURL: 'https://test.com',
        model: 'test-model',
        jwtToken: 'test-jwt'
      };
      
      const provider = new ChindaAIProvider(mockConfig);
      
      // Test JWT validation (should not throw with valid config)
      expect(() => {
        provider.validateJWTConfig();
      }).not.toThrow();
    });
  });

  describe('AI API Endpoints', () => {
    describe('GET /api/ai/providers', () => {
      test('should return list of available providers', async () => {
        const response = await request(app)
          .get('/api/ai/providers')
          .expect('Content-Type', /json/)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('providers');
        expect(Array.isArray(response.body.providers)).toBe(true);
        
        // Check that ChindaX is included
        const chindaProvider = response.body.providers.find(p => p.id === 'chinda');
        expect(chindaProvider).toBeDefined();
        expect(chindaProvider).toHaveProperty('name', 'ChindaX AI');
        expect(chindaProvider).toHaveProperty('model', 'chinda-qwen3-32b');
      });
    });

    describe('GET /api/ai/status', () => {
      test('should return AI system status', async () => {
        const response = await request(app)
          .get('/api/ai/status')
          .expect('Content-Type', /json/)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('status');
        expect(response.body).toHaveProperty('providers');
        expect(response.body).toHaveProperty('metrics');
      });
    });

    describe('POST /api/ai/generate', () => {
      test('should validate request body', async () => {
        // Test with missing required fields
        const response = await request(app)
          .post('/api/ai/generate')
          .send({})
          .expect('Content-Type', /json/)
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body.error).toHaveProperty('message');
      });

      test('should reject invalid provider', async () => {
        const response = await request(app)
          .post('/api/ai/generate')
          .send({
            prompt: 'Test prompt',
            provider: 'invalid-provider'
          })
          .expect('Content-Type', /json/)
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
      });

      test('should accept valid request structure', async () => {
        const validRequest = {
          prompt: 'เขียนบทความเกี่ยวกับการดูแลรักษารถเกี่ยวข้าว',
          provider: 'chinda',
          parameters: {
            temperature: 0.7,
            max_tokens: 1000
          }
        };

        // Note: This test might fail if no API keys are configured
        // We're testing the request structure, not the actual AI call
        const response = await request(app)
          .post('/api/ai/generate')
          .send(validRequest);

        // Should either succeed or fail with API key error, not validation error
        expect(response.status).not.toBe(400);
      });
    });

    describe('POST /api/ai/test-connection', () => {
      test('should test provider connections', async () => {
        const response = await request(app)
          .post('/api/ai/test-connection')
          .send({
            provider: 'chinda'
          });

        // Should return a response about connection status
        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('provider', 'chinda');
      });

      test('should reject invalid provider for connection test', async () => {
        const response = await request(app)
          .post('/api/ai/test-connection')
          .send({
            provider: 'invalid-provider'
          })
          .expect('Content-Type', /json/)
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle AI provider errors gracefully', async () => {
      // This would test actual error scenarios
      // For now, we test that the error handling structure is in place
      const response = await request(app)
        .post('/api/ai/generate')
        .send({
          prompt: 'test',
          provider: 'chinda'
        });

      // Response should have proper error structure if it fails
      if (!response.body.success) {
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('message');
        expect(response.body.error).toHaveProperty('timestamp');
      }
    });
  });

});
