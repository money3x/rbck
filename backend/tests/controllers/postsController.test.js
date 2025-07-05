/**
 * Posts Controller Tests
 * Test coverage for business logic and data operations
 */

const fs = require('fs').promises;
const path = require('path');
const postsController = require('../../controllers/postsController');

// Mock filesystem operations
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn()
  }
}));

// Mock logger
jest.mock('../../middleware/errorHandler', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  }
}));

// Mock cache
jest.mock('../../middleware/cache', () => ({
  clearCache: jest.fn()
}));

describe('PostsController', () => {
  beforeEach(() => {
    // Reset controller state
    postsController.posts = [];
    postsController.nextId = 1;
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with existing data file', async () => {
      const mockData = {
        posts: [{ id: 1, titleTH: 'Test Post', status: 'published' }],
        nextId: 2
      };
      
      fs.readFile.mockResolvedValue(JSON.stringify(mockData));
      
      await postsController.initialize();
      
      expect(postsController.posts).toHaveLength(1);
      expect(postsController.nextId).toBe(2);
      expect(fs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('data.json'),
        'utf8'
      );
    });

    it('should create default post when no data file exists', async () => {
      fs.readFile.mockRejectedValue(new Error('File not found'));
      fs.writeFile.mockResolvedValue();
      
      await postsController.initialize();
      
      expect(postsController.posts).toHaveLength(1);
      expect(postsController.nextId).toBe(2);
      expect(postsController.posts[0].titleTH).toContain('เทคนิค');
    });

    it('should handle initialization errors', async () => {
      fs.readFile.mockRejectedValue(new Error('Permission denied'));
      fs.writeFile.mockRejectedValue(new Error('Write failed'));
      
      await expect(postsController.initialize()).rejects.toThrow();
    });
  });

  describe('getAllPosts', () => {
    beforeEach(async () => {
      // Setup test posts
      postsController.posts = [
        {
          id: 1,
          titleTH: 'First Post',
          status: 'published',
          category: 'maintenance',
          updatedAt: '2023-01-01T00:00:00Z',
          views: 100
        },
        {
          id: 2,
          titleTH: 'Second Post',
          status: 'draft',
          category: 'repair',
          updatedAt: '2023-01-02T00:00:00Z',
          views: 50
        },
        {
          id: 3,
          titleTH: 'Third Post',
          status: 'published',
          category: 'maintenance',
          updatedAt: '2023-01-03T00:00:00Z',
          views: 200
        }
      ];
    });

    it('should return all posts without filters', async () => {
      const result = await postsController.getAllPosts();
      
      expect(result.success).toBe(true);
      expect(result.data.posts).toHaveLength(3);
      expect(result.data.total).toBe(3);
    });

    it('should filter posts by status', async () => {
      const result = await postsController.getAllPosts({ status: 'published' });
      
      expect(result.success).toBe(true);
      expect(result.data.posts).toHaveLength(2);
      expect(result.data.posts.every(p => p.status === 'published')).toBe(true);
    });

    it('should filter posts by category', async () => {
      const result = await postsController.getAllPosts({ category: 'maintenance' });
      
      expect(result.success).toBe(true);
      expect(result.data.posts).toHaveLength(2);
      expect(result.data.posts.every(p => p.category === 'maintenance')).toBe(true);
    });

    it('should search posts by title', async () => {
      const result = await postsController.getAllPosts({ search: 'First' });
      
      expect(result.success).toBe(true);
      expect(result.data.posts).toHaveLength(1);
      expect(result.data.posts[0].titleTH).toBe('First Post');
    });

    it('should apply pagination correctly', async () => {
      const result = await postsController.getAllPosts({ 
        limit: 2, 
        offset: 1 
      });
      
      expect(result.success).toBe(true);
      expect(result.data.posts).toHaveLength(2);
      expect(result.data.offset).toBe(1);
      expect(result.data.limit).toBe(2);
      expect(result.data.total).toBe(3);
    });

    it('should sort posts correctly', async () => {
      const result = await postsController.getAllPosts({ 
        sortBy: 'views', 
        sortOrder: 'desc' 
      });
      
      expect(result.success).toBe(true);
      expect(result.data.posts[0].views).toBe(200);
      expect(result.data.posts[2].views).toBe(50);
    });

    it('should handle multiple filters together', async () => {
      const result = await postsController.getAllPosts({
        status: 'published',
        category: 'maintenance',
        limit: 1
      });
      
      expect(result.success).toBe(true);
      expect(result.data.posts).toHaveLength(1);
      expect(result.data.posts[0].status).toBe('published');
      expect(result.data.posts[0].category).toBe('maintenance');
    });

    it('should handle errors gracefully', async () => {
      // Simulate error by corrupting posts array
      postsController.posts = null;
      
      const result = await postsController.getAllPosts();
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getPostById', () => {
    beforeEach(() => {
      postsController.posts = [
        { id: 1, titleTH: 'Test Post', status: 'published' }
      ];
    });

    it('should return post for valid ID', async () => {
      const result = await postsController.getPostById(1);
      
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(1);
      expect(result.data.titleTH).toBe('Test Post');
    });

    it('should return error for non-existent ID', async () => {
      const result = await postsController.getPostById(999);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Post not found');
      expect(result.postId).toBe(999);
    });

    it('should return error for invalid ID format', async () => {
      const result = await postsController.getPostById('invalid');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid post ID');
    });

    it('should return error for negative ID', async () => {
      const result = await postsController.getPostById(-1);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid post ID');
    });
  });

  describe('createPost', () => {
    beforeEach(() => {
      fs.writeFile.mockResolvedValue();
      postsController.nextId = 1;
      postsController.posts = [];
    });

    const validPostData = {
      titleTH: 'ทดสอบโพสต์ใหม่',
      slug: 'test-new-post',
      content: 'เนื้อหาทดสอบที่มีความยาวเพียงพอ',
      excerpt: 'สรุปเนื้อหาทดสอบ',
      status: 'draft'
    };

    it('should create post with valid data', async () => {
      const result = await postsController.createPost(validPostData);
      
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(1);
      expect(result.data.titleTH).toBe(validPostData.titleTH);
      expect(result.data.views).toBe(0);
      expect(result.data.reading_time).toBeGreaterThan(0);
      expect(postsController.posts).toHaveLength(1);
      expect(postsController.nextId).toBe(2);
    });

    it('should handle duplicate slug by modifying it', async () => {
      // Create first post
      await postsController.createPost(validPostData);
      
      // Try to create second post with same slug
      const result = await postsController.createPost(validPostData);
      
      expect(result.success).toBe(true);
      expect(result.data.slug).not.toBe(validPostData.slug);
      expect(result.data.slug).toContain(validPostData.slug);
    });

    it('should return validation errors for invalid data', async () => {
      const invalidData = {
        titleTH: 'ab', // Too short
        content: 'Content',
        excerpt: 'short' // Too short
      };
      
      const result = await postsController.createPost(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
      expect(result.details).toBeDefined();
      expect(result.details.length).toBeGreaterThan(0);
    });

    it('should handle save errors', async () => {
      fs.writeFile.mockRejectedValue(new Error('Write failed'));
      
      const result = await postsController.createPost(validPostData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to create post');
    });
  });

  describe('updatePost', () => {
    beforeEach(() => {
      fs.writeFile.mockResolvedValue();
      postsController.posts = [
        {
          id: 1,
          titleTH: 'Original Title',
          content: 'Original content',
          status: 'draft',
          createdAt: '2023-01-01T00:00:00Z'
        }
      ];
    });

    it('should update post with valid data', async () => {
      const updateData = {
        titleTH: 'Updated Title',
        status: 'published'
      };
      
      const result = await postsController.updatePost(1, updateData);
      
      expect(result.success).toBe(true);
      expect(result.data.titleTH).toBe('Updated Title');
      expect(result.data.status).toBe('published');
      expect(result.data.id).toBe(1);
      expect(result.data.updatedAt).toBeDefined();
      expect(result.data.createdAt).toBe('2023-01-01T00:00:00Z'); // Should not change
    });

    it('should update reading time when content changes', async () => {
      const longContent = Array(500).fill('word').join(' ');
      const updateData = { content: longContent };
      
      const result = await postsController.updatePost(1, updateData);
      
      expect(result.success).toBe(true);
      expect(result.data.reading_time).toBeGreaterThan(1);
    });

    it('should return error for non-existent post', async () => {
      const result = await postsController.updatePost(999, { titleTH: 'Test' });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Post not found');
    });

    it('should return validation errors for invalid data', async () => {
      const invalidData = { status: 'invalid_status' };
      
      const result = await postsController.updatePost(1, invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
    });
  });

  describe('deletePost', () => {
    beforeEach(() => {
      fs.writeFile.mockResolvedValue();
      postsController.posts = [
        { id: 1, titleTH: 'Test Post', status: 'published' },
        { id: 2, titleTH: 'Another Post', status: 'draft' }
      ];
    });

    it('should delete existing post', async () => {
      const result = await postsController.deletePost(1);
      
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(1);
      expect(postsController.posts).toHaveLength(1);
      expect(postsController.posts[0].id).toBe(2);
    });

    it('should return error for non-existent post', async () => {
      const result = await postsController.deletePost(999);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Post not found');
    });

    it('should handle save errors after deletion', async () => {
      fs.writeFile.mockRejectedValue(new Error('Write failed'));
      
      const result = await postsController.deletePost(1);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to delete post');
    });
  });

  describe('incrementViews', () => {
    beforeEach(() => {
      fs.writeFile.mockResolvedValue();
      postsController.posts = [
        { id: 1, titleTH: 'Test Post', views: 5 },
        { id: 2, titleTH: 'Another Post' } // No views property
      ];
    });

    it('should increment views for existing post', async () => {
      const views = await postsController.incrementViews(1);
      
      expect(views).toBe(6);
      expect(postsController.posts[0].views).toBe(6);
    });

    it('should initialize views for post without views property', async () => {
      const views = await postsController.incrementViews(2);
      
      expect(views).toBe(1);
      expect(postsController.posts[1].views).toBe(1);
    });

    it('should return 0 for non-existent post', async () => {
      const views = await postsController.incrementViews(999);
      
      expect(views).toBe(0);
    });

    it('should handle save errors gracefully', async () => {
      fs.writeFile.mockRejectedValue(new Error('Write failed'));
      
      const views = await postsController.incrementViews(1);
      
      expect(views).toBe(6); // Still increments in memory
      expect(postsController.posts[0].views).toBe(6);
    });
  });

  describe('getAnalytics', () => {
    beforeEach(() => {
      postsController.posts = [
        { id: 1, status: 'published', views: 100, titleTH: 'Post 1', slug: 'post-1' },
        { id: 2, status: 'published', views: 200, titleTH: 'Post 2', slug: 'post-2' },
        { id: 3, status: 'draft', views: 50, titleTH: 'Post 3', slug: 'post-3' },
        { id: 4, status: 'published', views: 150, titleTH: 'Post 4', slug: 'post-4' }
      ];
    });

    it('should generate correct analytics', () => {
      const analytics = postsController.getAnalytics();
      
      expect(analytics.totalPosts).toBe(4);
      expect(analytics.publishedPosts).toBe(3);
      expect(analytics.draftPosts).toBe(1);
      expect(analytics.pageViews).toBe(500); // 100+200+50+150
      expect(analytics.popularPosts).toHaveLength(3); // Only published posts
      expect(analytics.generatedAt).toBeDefined();
    });

    it('should sort popular posts by views', () => {
      const analytics = postsController.getAnalytics();
      
      expect(analytics.popularPosts[0].views).toBe(200); // Highest views first
      expect(analytics.popularPosts[1].views).toBe(150);
      expect(analytics.popularPosts[2].views).toBe(100);
    });

    it('should handle empty posts array', () => {
      postsController.posts = [];
      
      const analytics = postsController.getAnalytics();
      
      expect(analytics.totalPosts).toBe(0);
      expect(analytics.publishedPosts).toBe(0);
      expect(analytics.draftPosts).toBe(0);
      expect(analytics.pageViews).toBe(0);
      expect(analytics.popularPosts).toHaveLength(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle corrupted data gracefully', async () => {
      fs.readFile.mockResolvedValue('invalid json');
      
      await expect(postsController.initialize()).rejects.toThrow();
    });

    it('should handle concurrent operations', async () => {
      fs.writeFile.mockResolvedValue();
      postsController.posts = [];
      postsController.nextId = 1;
      
      const postData = {
        titleTH: 'Concurrent Test',
        slug: 'concurrent-test',
        content: 'Test content for concurrency',
        excerpt: 'Test excerpt'
      };
      
      // Simulate concurrent post creation
      const promises = [
        postsController.createPost(postData),
        postsController.createPost({ ...postData, slug: 'concurrent-test-2' }),
        postsController.createPost({ ...postData, slug: 'concurrent-test-3' })
      ];
      
      const results = await Promise.all(promises);
      
      expect(results.every(r => r.success)).toBe(true);
      expect(postsController.posts).toHaveLength(3);
    });
  });
});