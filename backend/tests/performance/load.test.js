// Performance Load Tests
const request = require('supertest');
const app = require('../../server');

describe('Performance Load Tests', () => {
  let authToken;

  beforeAll(async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: process.env.TEST_USER || 'admin',
        password: process.env.TEST_PASSWORD || 'admin123'
      });
    authToken = loginResponse.body.token;
  });

  describe('API Performance', () => {
    test('Health endpoint should respond under 100ms', async () => {
      const start = Date.now();
      await request(app)
        .get('/api/monitoring/health')
        .expect(200);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(100);
    });

    test('Posts endpoint should handle concurrent requests', async () => {
      const concurrentRequests = 20;
      const requests = Array(concurrentRequests).fill().map(() =>
        request(app)
          .get('/api/posts')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const start = Date.now();
      const responses = await Promise.all(requests);
      const duration = Date.now() - start;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Average response time should be reasonable
      const avgResponseTime = duration / concurrentRequests;
      expect(avgResponseTime).toBeLessThan(500);
    });

    test('Database queries should be optimized', async () => {
      const start = Date.now();
      await request(app)
        .get('/api/posts?limit=50')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(300);
    });

    test('Memory usage should remain stable under load', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform 100 requests
      const requests = Array(100).fill().map(() =>
        request(app)
          .get('/api/monitoring/health')
      );
      
      await Promise.all(requests);
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be minimal (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('AI Provider Performance', () => {
    test('AI provider status check should be fast', async () => {
      const start = Date.now();
      await request(app)
        .get('/api/ai/providers/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(2000);
    });

    test('Provider test should timeout appropriately', async () => {
      const start = Date.now();
      const response = await request(app)
        .post('/api/ai/providers/test')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ provider: 'openai' })
        .timeout(10000);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(10000);
      expect([200, 408, 503]).toContain(response.status);
    });
  });

  describe('Stress Testing', () => {
    test('Should handle rapid authentication requests', async () => {
      const authRequests = Array(10).fill().map(() =>
        request(app)
          .post('/api/auth/login')
          .send({
            username: process.env.TEST_USER || 'admin',
            password: process.env.TEST_PASSWORD || 'admin123'
          })
      );

      const responses = await Promise.allSettled(authRequests);
      const successfulAuths = responses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 200
      );

      // At least 80% should succeed (accounting for rate limiting)
      expect(successfulAuths.length).toBeGreaterThan(8);
    });

    test('Should maintain performance with large payload', async () => {
      const largeContent = 'x'.repeat(10000); // 10KB content
      
      const start = Date.now();
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Large Content Test',
          content: largeContent,
          author: 'Test'
        });
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(2000);
      expect([201, 400]).toContain(response.status); // 201 success or 400 validation
    });
  });

  describe('Cache Performance', () => {
    test('Cached responses should be faster', async () => {
      // First request (uncached)
      const start1 = Date.now();
      await request(app)
        .get('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const duration1 = Date.now() - start1;

      // Second request (should be cached)
      const start2 = Date.now();
      await request(app)
        .get('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const duration2 = Date.now() - start2;

      // Cached request should be faster
      expect(duration2).toBeLessThan(duration1);
    });
  });
});