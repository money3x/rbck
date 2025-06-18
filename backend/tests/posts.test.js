const request = require('supertest');
const app = require('../server');

describe('Posts API', () => {
  let createdPostId;

  describe('GET /api/posts', () => {
    test('should return all posts', async () => {
      const response = await request(app)
        .get('/api/posts')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        const post = response.body[0];
        expect(post).toHaveProperty('id');
        expect(post).toHaveProperty('titleTH');
        expect(post).toHaveProperty('excerpt');
      }
    });

    test('should support query parameters', async () => {
      const response = await request(app)
        .get('/api/posts?status=published&limit=5')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(5);
    });
  });

  describe('POST /api/posts', () => {
    test('should create a new post with valid data', async () => {
      const newPost = {
        titleTH: 'ทดสอบการสร้างบทความ',
        titleEN: 'Test Article Creation',
        excerpt: 'นี่คือบทความทดสอบสำหรับการทดสอบระบบ CMS',
        content: '<p>เนื้อหาทดสอบ</p>',
        category: 'maintenance',
        tags: ['ทดสอบ', 'test'],
        status: 'draft',
        author: 'Test Author'
      };

      const response = await request(app)
        .post('/api/posts')
        .send(newPost)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.titleTH).toBe(newPost.titleTH);
      expect(response.body.excerpt).toBe(newPost.excerpt);
      expect(response.body).toHaveProperty('slug');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
      
      createdPostId = response.body.id;
    });

    test('should return 400 for missing required fields', async () => {
      const invalidPost = {
        titleEN: 'Test Article'
        // Missing titleTH and excerpt
      };

      const response = await request(app)
        .post('/api/posts')
        .send(invalidPost)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('message');
    });

    test('should auto-generate slug from Thai title', async () => {
      const newPost = {
        titleTH: 'การดูแลรักษา รถเกี่ยวข้าว ให้ใช้งานได้นาน',
        excerpt: 'เนื้อหาทดสอบการสร้าง slug อัตโนมัติ'
      };

      const response = await request(app)
        .post('/api/posts')
        .send(newPost)
        .expect(201);

      expect(response.body).toHaveProperty('slug');
      expect(response.body.slug).toMatch(/^[a-z0-9-]+$/);
    });
  });

  describe('GET /api/posts/:id', () => {
    test('should return a specific post', async () => {
      if (!createdPostId) {
        // Skip if no post was created in previous tests
        return;
      }

      const response = await request(app)
        .get(`/api/posts/${createdPostId}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('id', createdPostId);
      expect(response.body).toHaveProperty('titleTH');
      expect(response.body).toHaveProperty('excerpt');
    });

    test('should return 404 for non-existent post', async () => {
      const response = await request(app)
        .get('/api/posts/99999')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Post not found');
    });

    test('should return 400 for invalid post ID', async () => {
      const response = await request(app)
        .get('/api/posts/invalid-id')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('PUT /api/posts/:id', () => {
    test('should update an existing post', async () => {
      if (!createdPostId) {
        return;
      }

      const updateData = {
        titleTH: 'ทดสอบการแก้ไขบทความ (อัพเดท)',
        excerpt: 'เนื้อหาที่ถูกแก้ไขแล้ว',
        status: 'published'
      };

      const response = await request(app)
        .put(`/api/posts/${createdPostId}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.titleTH).toBe(updateData.titleTH);
      expect(response.body.excerpt).toBe(updateData.excerpt);
      expect(response.body.status).toBe(updateData.status);
      expect(response.body).toHaveProperty('updatedAt');
    });

    test('should return 404 for non-existent post update', async () => {
      const response = await request(app)
        .put('/api/posts/99999')
        .send({ titleTH: 'Test Update' })
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Post not found');
    });
  });

  describe('GET /api/analytics', () => {
    test('should return analytics data', async () => {
      const response = await request(app)
        .get('/api/analytics')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('totalPosts');
      expect(response.body).toHaveProperty('publishedPosts');
      expect(response.body).toHaveProperty('draftPosts');
      expect(response.body).toHaveProperty('pageViews');
      expect(response.body).toHaveProperty('trafficSources');
      expect(response.body).toHaveProperty('topKeywords');
      expect(response.body).toHaveProperty('popularPosts');
      
      expect(typeof response.body.totalPosts).toBe('number');
      expect(Array.isArray(response.body.topKeywords)).toBe(true);
      expect(Array.isArray(response.body.popularPosts)).toBe(true);
    });
  });

  describe('GET /api/blog-html', () => {
    test('should return HTML for published posts', async () => {
      const response = await request(app)
        .get('/api/blog-html')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('html');
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('posts');
      expect(response.body).toHaveProperty('source');
      
      expect(typeof response.body.html).toBe('string');
      expect(typeof response.body.count).toBe('number');
      expect(Array.isArray(response.body.posts)).toBe(true);
    });
  });

  describe('DELETE /api/posts/:id', () => {
    test('should delete an existing post', async () => {
      if (!createdPostId) {
        return;
      }

      const response = await request(app)
        .delete(`/api/posts/${createdPostId}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Post deleted successfully');

      // Verify post is deleted
      await request(app)
        .get(`/api/posts/${createdPostId}`)
        .expect(404);
    });

    test('should return 404 for non-existent post deletion', async () => {
      const response = await request(app)
        .delete('/api/posts/99999')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Post not found');
    });
  });

});
