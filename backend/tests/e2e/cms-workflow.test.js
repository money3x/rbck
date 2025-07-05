// End-to-End Tests for Complete CMS Workflow
const request = require('supertest');
const app = require('../../server');

describe('CMS E2E Workflow', () => {
  let authToken;
  let createdPostId;

  beforeAll(async () => {
    // Login and get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: process.env.TEST_USER || 'admin',
        password: process.env.TEST_PASSWORD || 'admin123'
      });
    authToken = loginResponse.body.token;
  });

  describe('Complete Content Creation Workflow', () => {
    test('1. Create new post with AI optimization', async () => {
      const postData = {
        title: 'E2E Test Post',
        content: 'This is a test post for end-to-end testing.',
        author: 'Test Author',
        category: 'Technology',
        tags: ['testing', 'e2e'],
        aiOptimization: true
      };

      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.post).toBeDefined();
      expect(response.body.post.id).toBeDefined();
      
      createdPostId = response.body.post.id;
    });

    test('2. Retrieve created post', async () => {
      const response = await request(app)
        .get(`/api/posts/${createdPostId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.post.title).toBe('E2E Test Post');
    });

    test('3. Update post with AI enhancement', async () => {
      const updateData = {
        title: 'Updated E2E Test Post',
        content: 'This is an updated test post with AI enhancement.',
        aiEnhancement: true
      };

      const response = await request(app)
        .put(`/api/posts/${createdPostId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.post.title).toBe('Updated E2E Test Post');
    });

    test('4. Generate SEO optimization', async () => {
      const response = await request(app)
        .post(`/api/posts/${createdPostId}/seo`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ targetKeywords: ['testing', 'automation'] })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.seo).toBeDefined();
    });

    test('5. Delete post', async () => {
      const response = await request(app)
        .delete(`/api/posts/${createdPostId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('6. Verify post deletion', async () => {
      await request(app)
        .get(`/api/posts/${createdPostId}`)
        .expect(404);
    });
  });

  describe('Admin Dashboard Workflow', () => {
    test('Dashboard metrics should load correctly', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.metrics).toBeDefined();
      expect(response.body.metrics.totalPosts).toBeDefined();
      expect(response.body.metrics.aiUsage).toBeDefined();
    });

    test('User management should work', async () => {
      const newUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'testpass123',
        role: 'editor'
      };

      const createResponse = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newUser)
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      
      // Clean up - delete test user
      await request(app)
        .delete(`/api/users/${createResponse.body.user.id}`)
        .set('Authorization', `Bearer ${authToken}`);
    });
  });

  describe('Security Workflow', () => {
    test('Unauthorized access should be blocked', async () => {
      await request(app)
        .get('/api/admin/dashboard')
        .expect(401);
    });

    test('Invalid token should be rejected', async () => {
      await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    test('SQL injection should be prevented', async () => {
      const maliciousPayload = {
        title: "'; DROP TABLE posts; --",
        content: 'Malicious content'
      };

      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousPayload);

      // Should either succeed safely or fail validation
      expect([201, 400]).toContain(response.status);
    });
  });
});