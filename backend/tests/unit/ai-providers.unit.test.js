// Unit Tests for AI Providers
const ProviderFactory = require('../../ai/providers/factory/ProviderFactory');
const OpenAIProvider = require('../../ai/providers/openai/OpenAIProvider');
const ClaudeProvider = require('../../ai/providers/claude/ClaudeProvider');

describe('AI Provider Unit Tests', () => {
  describe('ProviderFactory', () => {
    test('should create OpenAI provider', () => {
      const provider = ProviderFactory.getProvider('openai', { apiKey: 'test-key' });
      expect(provider).toBeInstanceOf(OpenAIProvider);
    });

    test('should create Claude provider', () => {
      const provider = ProviderFactory.getProvider('claude', { apiKey: 'test-key' });
      expect(provider).toBeInstanceOf(ClaudeProvider);
    });

    test('should throw error for invalid provider', () => {
      expect(() => {
        ProviderFactory.getProvider('invalid', { apiKey: 'test-key' });
      }).toThrow('Unknown provider');
    });
  });

  describe('OpenAI Provider', () => {
    let provider;

    beforeEach(() => {
      provider = new OpenAIProvider({ apiKey: 'test-key' });
    });

    test('should initialize with correct config', () => {
      expect(provider.apiKey).toBe('test-key');
      expect(provider.name).toBe('OpenAI');
    });

    test('should validate API key format', () => {
      expect(() => new OpenAIProvider({ apiKey: 'invalid' })).toThrow();
      expect(() => new OpenAIProvider({ apiKey: 'sk-valid123' })).not.toThrow();
    });

    test('should format request correctly', () => {
      const request = provider.formatRequest('Test prompt', { temperature: 0.7 });
      expect(request).toHaveProperty('messages');
      expect(request.messages[0].content).toBe('Test prompt');
      expect(request.temperature).toBe(0.7);
    });

    test('should handle rate limiting', async () => {
      const mockResponse = { status: 429, headers: { 'retry-after': '60' } };
      provider.makeRequest = jest.fn().mockResolvedValue(mockResponse);
      
      const result = await provider.generateContent('test');
      expect(result.rateLimited).toBe(true);
      expect(result.retryAfter).toBe(60);
    });
  });

  describe('Claude Provider', () => {
    let provider;

    beforeEach(() => {
      provider = new ClaudeProvider({ apiKey: 'sk-ant-test' });
    });

    test('should format Claude-specific request', () => {
      const request = provider.formatRequest('Test prompt');
      expect(request).toHaveProperty('model');
      expect(request.model).toBe('claude-3-sonnet-20240229');
      expect(request.messages[0].content).toBe('Test prompt');
    });

    test('should handle Claude response format', () => {
      const mockResponse = {
        content: [{ type: 'text', text: 'Claude response' }],
        usage: { input_tokens: 10, output_tokens: 15 }
      };
      
      const result = provider.parseResponse(mockResponse);
      expect(result.content).toBe('Claude response');
      expect(result.tokensUsed).toBe(25);
    });
  });
});