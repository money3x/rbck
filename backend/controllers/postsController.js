/**
 * Posts Controller
 * Handles all post-related business logic with proper error handling and validation
 */

const { Post } = require('../models/Post');
const { logger } = require('../middleware/errorHandler');
const { clearCache } = require('../middleware/cache');
const fs = require('fs').promises;
const path = require('path');

class PostsController {
  constructor() {
    this.posts = [];
    this.nextId = 1;
    this.dataPath = path.join(__dirname, '..', 'data.json');
  }

  /**
   * Initialize posts data from file
   */
  async initialize() {
    try {
      await this.loadInitialData();
    } catch (error) {
      logger.error('Failed to initialize posts controller:', error);
      throw error;
    }
  }

  /**
   * Load posts from data.json file
   */
  async loadInitialData() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf8');
      const parsed = JSON.parse(data);
      this.posts = parsed.posts || [];
      this.nextId = parsed.nextId || 1;
      logger.info(`📊 Loaded ${this.posts.length} posts from data.json`);
    } catch (error) {
      logger.info('📊 No existing data file, starting fresh');
      await this.createDefaultPost();
    }
  }

  /**
   * Create default sample post
   */
  async createDefaultPost() {
    const defaultPost = {
      id: 1,
      titleTH: 'เทคนิคการดูแลรักษารถเกี่ยวข้าวเบื้องต้น',
      titleEN: 'Basic Rice Harvester Maintenance Tips',
      slug: 'basic-rice-harvester-maintenance-tips',
      content: `
        <h3>🌾 การดูแลรักษารถเกี่ยวข้าวอย่างถูกต้อง</h3>
        <p>รถเกี่ยวข้าวเป็นเครื่องจักรที่สำคัญสำหรับเกษตรกร การดูแลรักษาอย่างเหมาะสมจะช่วยยืดอายุการใช้งานและรักษาประสิทธิภาพ</p>
      `,
      excerpt: 'เรียนรู้เทคนิคการดูแลรักษารถเกี่ยวข้าวอย่างถูกต้อง',
      category: 'maintenance',
      tags: ['รถเกี่ยวข้าว', 'การดูแลรักษา', 'เทคนิค', 'บำรุงรักษา'],
      status: 'published',
      author: 'ระเบียบการช่าง',
      publishDate: new Date().toISOString().split('T')[0],
      views: 0,
      metaTitle: 'เทคนิคการดูแลรักษารถเกี่ยวข้าว | ระเบียบการช่าง',
      metaDescription: 'เรียนรู้วิธีการดูแลรักษารถเกี่ยวข้าวอย่างถูกต้อง',
      focusKeyword: 'ดูแลรักษารถเกี่ยวข้าว',
      schemaType: 'HowTo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.posts = [defaultPost];
    this.nextId = 2;
    await this.saveData();
  }

  /**
   * Save posts data to file
   */
  async saveData() {
    try {
      const data = {
        posts: this.posts,
        nextId: this.nextId,
        lastUpdated: new Date().toISOString()
      };
      await fs.writeFile(this.dataPath, JSON.stringify(data, null, 2));
      logger.debug('💾 Data saved successfully');
    } catch (error) {
      logger.error('❌ Error saving data:', error);
      throw error;
    }
  }

  /**
   * Get all posts with filtering and pagination
   */
  async getAllPosts(options = {}) {
    try {
      const {
        status,
        category,
        limit,
        offset = 0,
        sortBy = 'updatedAt',
        sortOrder = 'desc',
        search
      } = options;

      let filteredPosts = [...this.posts];

      // Apply filters
      if (status) {
        filteredPosts = filteredPosts.filter(post => post.status === status);
      }

      if (category) {
        filteredPosts = filteredPosts.filter(post => post.category === category);
      }

      if (search) {
        const searchLower = search.toLowerCase();
        filteredPosts = filteredPosts.filter(post => 
          post.titleTH?.toLowerCase().includes(searchLower) ||
          post.titleEN?.toLowerCase().includes(searchLower) ||
          post.content?.toLowerCase().includes(searchLower) ||
          post.excerpt?.toLowerCase().includes(searchLower)
        );
      }

      // Apply sorting
      filteredPosts.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        
        if (sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });

      // Apply pagination
      const total = filteredPosts.length;
      if (limit) {
        const limitNum = parseInt(limit);
        const offsetNum = parseInt(offset);
        if (!isNaN(limitNum) && limitNum > 0) {
          filteredPosts = filteredPosts.slice(offsetNum, offsetNum + limitNum);
        }
      }

      return {
        success: true,
        data: {
          posts: filteredPosts,
          total,
          offset: parseInt(offset),
          limit: limit ? parseInt(limit) : total
        }
      };
    } catch (error) {
      logger.error('Error fetching posts:', error);
      return {
        success: false,
        error: 'Failed to fetch posts',
        message: error.message
      };
    }
  }

  /**
   * Get single post by ID
   */
  async getPostById(id) {
    try {
      const postId = parseInt(id);
      
      if (isNaN(postId) || postId < 1) {
        return {
          success: false,
          error: 'Invalid post ID',
          message: 'Post ID must be a positive integer'
        };
      }

      const post = this.posts.find(p => p.id === postId);
      
      if (!post) {
        return {
          success: false,
          error: 'Post not found',
          postId: postId
        };
      }

      return {
        success: true,
        data: post
      };
    } catch (error) {
      logger.error('Error fetching post:', error);
      return {
        success: false,
        error: 'Failed to fetch post',
        message: error.message
      };
    }
  }

  /**
   * Create new post
   */
  async createPost(postData) {
    try {
      // Validate post data
      const validation = Post.validateForCreate(postData);
      if (!validation.success) {
        return {
          success: false,
          error: 'Validation failed',
          details: validation.errors
        };
      }

      const validatedData = validation.data;

      // Ensure slug is unique
      if (this.posts.some(p => p.slug === validatedData.slug)) {
        validatedData.slug = `${validatedData.slug}-${Date.now()}`;
      }

      const newPost = {
        id: this.nextId++,
        ...validatedData,
        views: 0,
        likes: 0,
        reading_time: Post.calculateReadingTime(validatedData.content),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.posts.push(newPost);
      await this.saveData();

      // Clear relevant caches
      clearCache('/api/posts');
      clearCache('/api/analytics');

      logger.info(`📝 Created new post: ${newPost.titleTH}`, { postId: newPost.id });
      
      return {
        success: true,
        data: newPost
      };
    } catch (error) {
      logger.error('Error creating post:', error);
      return {
        success: false,
        error: 'Failed to create post',
        message: error.message
      };
    }
  }

  /**
   * Update existing post
   */
  async updatePost(id, postData) {
    try {
      const postId = parseInt(id);
      
      if (isNaN(postId) || postId < 1) {
        return {
          success: false,
          error: 'Invalid post ID',
          message: 'Post ID must be a positive integer'
        };
      }

      const postIndex = this.posts.findIndex(p => p.id === postId);
      
      if (postIndex === -1) {
        return {
          success: false,
          error: 'Post not found',
          postId: postId
        };
      }

      // Validate update data
      const validation = Post.validateForUpdate(postData);
      if (!validation.success) {
        return {
          success: false,
          error: 'Validation failed',
          details: validation.errors
        };
      }

      const validatedData = validation.data;

      // Update reading time if content changed
      if (validatedData.content) {
        validatedData.reading_time = Post.calculateReadingTime(validatedData.content);
      }

      const updatedPost = {
        ...this.posts[postIndex],
        ...validatedData,
        id: postId, // Ensure ID doesn't change
        updatedAt: new Date().toISOString()
      };

      this.posts[postIndex] = updatedPost;
      await this.saveData();

      // Clear relevant caches
      clearCache('/api/posts');
      clearCache('/api/analytics');

      logger.info(`📝 Updated post: ${updatedPost.titleTH}`, { postId });
      
      return {
        success: true,
        data: updatedPost
      };
    } catch (error) {
      logger.error('Error updating post:', error);
      return {
        success: false,
        error: 'Failed to update post',
        message: error.message
      };
    }
  }

  /**
   * Delete post
   */
  async deletePost(id) {
    try {
      const postId = parseInt(id);
      
      if (isNaN(postId) || postId < 1) {
        return {
          success: false,
          error: 'Invalid post ID',
          message: 'Post ID must be a positive integer'
        };
      }

      const postIndex = this.posts.findIndex(p => p.id === postId);
      
      if (postIndex === -1) {
        return {
          success: false,
          error: 'Post not found',
          postId: postId
        };
      }

      const deletedPost = this.posts.splice(postIndex, 1)[0];
      await this.saveData();

      // Clear relevant caches
      clearCache('/api/posts');
      clearCache('/api/analytics');

      logger.info(`🗑️ Deleted post: ${deletedPost.titleTH}`, { postId });
      
      return {
        success: true,
        message: 'Post deleted successfully',
        data: {
          id: deletedPost.id,
          title: deletedPost.titleTH
        }
      };
    } catch (error) {
      logger.error('Error deleting post:', error);
      return {
        success: false,
        error: 'Failed to delete post',
        message: error.message
      };
    }
  }

  /**
   * Increment post view count
   */
  async incrementViews(id) {
    try {
      const postId = parseInt(id);
      const post = this.posts.find(p => p.id === postId);
      
      if (post) {
        post.views = (post.views || 0) + 1;
        await this.saveData().catch(error => 
          logger.error('Error saving view count:', error)
        );
        return post.views;
      }
      
      return 0;
    } catch (error) {
      logger.error('Error incrementing views:', error);
      return 0;
    }
  }

  /**
   * Get analytics data
   */
  getAnalytics() {
    try {
      const publishedPosts = this.posts.filter(post => post.status === 'published');
      const draftPosts = this.posts.filter(post => post.status === 'draft');
      const totalViews = this.posts.reduce((sum, post) => sum + (post.views || 0), 0);

      return {
        totalPosts: this.posts.length,
        publishedPosts: publishedPosts.length,
        draftPosts: draftPosts.length,
        pageViews: totalViews,
        trafficSources: {
          organic: 65,
          direct: 20,
          social: 10,
          referral: 5
        },
        topKeywords: [
          { keyword: 'รถเกี่ยวข้าว', count: 1234 },
          { keyword: 'ซ่อมรถเกี่ยวข้าว', count: 892 },
          { keyword: 'ดูแลรักษารถเกี่ยวข้าว', count: 567 },
          { keyword: 'อะไหล่รถเกี่ยวข้าว', count: 445 }
        ],
        popularPosts: publishedPosts
          .sort((a, b) => (b.views || 0) - (a.views || 0))
          .slice(0, 5)
          .map(post => ({
            title: post.titleTH,
            views: post.views || 0,
            slug: post.slug
          })),
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error generating analytics:', error);
      throw error;
    }
  }
}

// Export singleton instance
const postsController = new PostsController();

module.exports = postsController;