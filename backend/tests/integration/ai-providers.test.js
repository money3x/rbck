// Integration Tests for AI Providers
const request = require('supertest');
const app = require('../../server');

describe('AI Providers Integration', () => {
  let authToken;

  beforeAll(async () => {
    // Get auth token for tests
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: process.env.TEST_USER || 'admin',
        password: process.env.TEST_PASSWORD || 'admin123'
      });
    authToken = loginResponse.body.token;
  });

  describe('Provider Status Endpoints', () => {
    test('GET /api/ai/providers/status - should return all provider statuses', async () => {
      const response = await request(app)
        .get('/api/ai/providers/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.providers).toBeDefined();
      expect(Object.keys(response.body.providers)).toEqual(
        expect.arrayContaining(['openai', 'claude', 'gemini', 'deepseek', 'chindax'])
      );
    });

    test('POST /api/ai/providers/test - should test provider connectivity', async () => {
      const response = await request(app)
        .post('/api/ai/providers/test')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ provider: 'openai' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.status).toBeDefined();
    });
  });

  describe('AI Swarm Council', () => {
    test('POST /api/ai/swarm/optimize - should process content optimization', async () => {
      const testContent = {
        title: 'Test Article',
        content: 'This is a test article for optimization.',
        targetKeywords: ['test', 'optimization']
      };

      const response = await request(app)
        .post('/api/ai/swarm/optimize')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testContent)
        .timeout(30000);

      expect(response.body.success).toBe(true);
      expect(response.body.optimization).toBeDefined();
      expect(response.body.eatScore).toBeGreaterThan(0);
    });

    test('GET /api/ai/swarm/metrics - should return swarm performance metrics', async () => {
      const response = await request(app)
        .get('/api/ai/swarm/metrics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.metrics).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid provider gracefully', async () => {
      const response = await request(app)
        .post('/api/ai/providers/test')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ provider: 'invalid-provider' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    test('should handle rate limiting', async () => {
      // Make multiple rapid requests to test rate limiting
      const requests = Array(10).fill().map(() =>
        request(app)
          .get('/api/ai/providers/status')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.allSettled(requests);
      const rateLimited = responses.some(r => 
        r.value && r.value.status === 429
      );
      
      expect(rateLimited).toBe(true);
    });
  });
});

describe('Performance Tests', () => {
  test('API response times should be under 2 seconds', async () => {
    const start = Date.now();
    await request(app)
      .get('/api/health')
      .expect(200);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(2000);
  });

  test('Concurrent requests should handle gracefully', async () => {
    const concurrentRequests = Array(5).fill().map(() =>
      request(app).get('/api/health')
    );

    const responses = await Promise.all(concurrentRequests);
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
  });
});