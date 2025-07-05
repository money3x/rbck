// Unit Tests for AI Swarm Council
const EATOptimizedSwarmCouncil = require('../../ai/swarm/EATOptimizedSwarmCouncil');
const SwarmCouncil = require('../../ai/swarm/SwarmCouncil');

describe('AI Swarm Council Unit Tests', () => {
  let council;

  beforeEach(() => {
    council = new EATOptimizedSwarmCouncil();
  });

  describe('EATOptimizedSwarmCouncil', () => {
    test('should initialize with correct provider roles', () => {
      expect(council.providerRoles).toHaveProperty('claude');
      expect(council.providerRoles.claude.role).toBe('Chief E-A-T Content Specialist');
      expect(council.eatGuidelines).toBeDefined();
    });

    test('should calculate E-A-T score correctly', () => {
      const content = {
        title: 'Expert Guide to AI',
        content: 'This comprehensive guide covers artificial intelligence with authoritative sources...',
        author: 'Dr. AI Expert',
        sources: ['research.ai', 'stanford.edu']
      };

      const score = council.calculateEATScore(content);
      expect(score).toBeGreaterThan(70);
      expect(score).toBeLessThanOrEqual(100);
    });

    test('should validate content expertise', () => {
      const expertContent = {
        content: 'Technical analysis with detailed explanations and authoritative sources',
        wordCount: 1500,
        sources: ['expert1.com', 'university.edu']
      };

      const score = council.evaluateExpertise(expertContent);
      expect(score).toBeGreaterThan(60);
    });

    test('should assess authoritativeness', () => {
      const authoritativeContent = {
        author: 'PhD in Computer Science',
        sources: ['mit.edu', 'stanford.edu', 'nature.com'],
        citations: 15
      };

      const score = council.evaluateAuthoritativeness(authoritativeContent);
      expect(score).toBeGreaterThan(70);
    });

    test('should evaluate trustworthiness', () => {
      const trustworthyContent = {
        factualAccuracy: 95,
        sources: ['scientific-journal.com', 'government.gov'],
        transparency: true,
        bias: 'minimal'
      };

      const score = council.evaluateTrustworthiness(trustworthyContent);
      expect(score).toBeGreaterThan(80);
    });
  });

  describe('Provider Orchestration', () => {
    test('should assign providers to roles correctly', async () => {
      const content = { title: 'Test', content: 'Test content' };
      const assignments = await council.assignProviderRoles(content);
      
      expect(assignments).toHaveProperty('primary');
      expect(assignments).toHaveProperty('secondary');
      expect(assignments.primary).toContain('claude');
    });

    test('should handle provider failures gracefully', async () => {
      const mockFailProvider = jest.fn().mockRejectedValue(new Error('Provider timeout'));
      council.providers = { openai: { generateContent: mockFailProvider } };

      const result = await council.optimizeWithFallback('test content', ['openai']);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should aggregate provider responses', () => {
      const responses = [
        { provider: 'claude', content: 'Claude response', confidence: 0.9 },
        { provider: 'openai', content: 'OpenAI response', confidence: 0.8 },
        { provider: 'gemini', content: 'Gemini response', confidence: 0.85 }
      ];

      const aggregated = council.aggregateResponses(responses);
      expect(aggregated.primaryResponse).toBe('Claude response');
      expect(aggregated.consensus).toBeGreaterThan(0.8);
    });
  });

  describe('Performance Optimization', () => {
    test('should optimize content workflow', async () => {
      const content = {
        title: 'Test Article',
        content: 'Basic content that needs optimization',
        targetKeywords: ['test', 'optimization']
      };

      // Mock provider responses
      council.providers = {
        claude: { generateContent: jest.fn().mockResolvedValue('Enhanced content') },
        openai: { generateContent: jest.fn().mockResolvedValue('SEO optimized') },
        gemini: { generateContent: jest.fn().mockResolvedValue('Fact checked') }
      };

      const result = await council.optimizeContent(content);
      expect(result.success).toBe(true);
      expect(result.eatScore).toBeGreaterThan(0);
    });

    test('should track performance metrics', () => {
      const metrics = council.getPerformanceMetrics();
      expect(metrics).toHaveProperty('totalOptimizations');
      expect(metrics).toHaveProperty('averageEATScore');
      expect(metrics).toHaveProperty('providerUsage');
    });

    test('should handle concurrent optimizations', async () => {
      const contents = [
        { title: 'Article 1', content: 'Content 1' },
        { title: 'Article 2', content: 'Content 2' },
        { title: 'Article 3', content: 'Content 3' }
      ];

      const promises = contents.map(content => council.optimizeContent(content));
      const results = await Promise.allSettled(promises);

      expect(results.length).toBe(3);
      results.forEach(result => {
        expect(['fulfilled', 'rejected']).toContain(result.status);
      });
    });
  });
});