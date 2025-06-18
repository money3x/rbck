const request = require('supertest');
const app = require('../server');

describe('API Health and Basic Functionality', () => {
  
  describe('Health Check', () => {
    test('GET /api/health should return healthy status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('version');
    });
  });

  describe('Test Endpoint', () => {
    test('GET /api/test should return success message', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'API is working!');
      expect(response.body).toHaveProperty('status', 'ok');
    });
  });

  describe('Metrics Endpoint', () => {
    test('GET /api/metrics should return metrics data', async () => {
      const response = await request(app)
        .get('/api/metrics')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('requests');
      expect(response.body).toHaveProperty('errors');
      expect(response.body).toHaveProperty('system');
    });
  });

  describe('API Documentation', () => {
    test('GET /api-docs should serve Swagger UI', async () => {
      const response = await request(app)
        .get('/api-docs/')
        .expect(200);

      expect(response.text).toContain('swagger-ui');
    });
  });

  describe('Error Handling', () => {
    test('GET /nonexistent should return 404', async () => {
      const response = await request(app)
        .get('/nonexistent')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('message', 'Route not found');
    });
  });

  describe('CORS and Security Headers', () => {
    test('Should include security headers', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-content-type-options');
    });
  });

});

module.exports = app;
