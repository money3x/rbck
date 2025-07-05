// Optimized Post Model with Database Performance Enhancements
const dbManager = require('../../config/database');
const winston = require('winston');

class PostModel {
  constructor() {
    this.tableName = 'posts';
    this.defaultSelect = 'id, title, content, author, category, tags, created_at, updated_at, published, slug, seo_score, ai_optimized';
    this.listSelect = 'id, title, author, category, tags, created_at, published, slug, seo_score'; // Lighter for lists
  }

  // Optimized post retrieval with caching
  async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      category,
      author,
      search,
      published,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options;

    try {
      const offset = (page - 1) * limit;
      const cacheKey = `posts_list_${JSON.stringify(options)}`;

      const filters = {};
      if (category) filters.category = category;
      if (author) filters.author = author;
      if (published !== undefined) filters.published = published;
      
      // Add search filter
      if (search) {
        filters.title = { operator: 'like', value: search };
      }

      const params = {
        select: this.listSelect,
        filters,
        order: { column: sortBy, ascending: sortOrder === 'asc' },
        range: { from: offset, to: offset + limit - 1 }
      };

      const result = await dbManager.executeQuery(
        this.tableName,
        'select',
        params,
        cacheKey,
        300 // 5 minute cache
      );

      return {
        posts: result.data || [],
        total: result.count || 0,
        page,
        pages: Math.ceil((result.count || 0) / limit),
        limit
      };

    } catch (error) {
      winston.error('PostModel.findAll error:', error);
      throw new Error(`Failed to retrieve posts: ${error.message}`);
    }
  }

  // Optimized single post retrieval
  async findById(id) {
    try {
      const cacheKey = `post_${id}`;
      
      const params = {
        select: this.defaultSelect,
        filters: { id }
      };

      const result = await dbManager.executeQuery(
        this.tableName,
        'select',
        params,
        cacheKey,
        600 // 10 minute cache for single posts
      );

      return result.data && result.data.length > 0 ? result.data[0] : null;

    } catch (error) {
      winston.error('PostModel.findById error:', error);
      throw new Error(`Failed to retrieve post: ${error.message}`);
    }
  }

  // Optimized post creation with validation
  async create(postData) {
    try {
      // Validate required fields
      const requiredFields = ['title', 'content', 'author'];
      for (const field of requiredFields) {
        if (!postData[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Generate slug if not provided
      if (!postData.slug) {
        postData.slug = this.generateSlug(postData.title);
      }

      // Add timestamps
      const now = new Date().toISOString();
      const dataToInsert = {
        ...postData,
        created_at: now,
        updated_at: now,
        published: postData.published || false,
        ai_optimized: postData.ai_optimized || false
      };

      const params = {
        data: dataToInsert
      };

      const result = await dbManager.executeQuery(
        this.tableName,
        'insert',
        params
      );

      // Clear list cache after creation
      this.clearListCache();

      winston.info('Post created:', { id: result.data[0]?.id, title: postData.title });
      return result.data[0];

    } catch (error) {
      winston.error('PostModel.create error:', error);
      throw new Error(`Failed to create post: ${error.message}`);
    }
  }

  // Optimized post update
  async update(id, updateData) {
    try {
      // Add updated timestamp
      const dataToUpdate = {
        ...updateData,
        updated_at: new Date().toISOString()
      };

      const params = {
        data: dataToUpdate,
        match: { id }
      };

      const result = await dbManager.executeQuery(
        this.tableName,
        'update',
        params
      );

      // Clear caches
      this.clearPostCache(id);
      this.clearListCache();

      winston.info('Post updated:', { id, fields: Object.keys(updateData) });
      return result.data[0];

    } catch (error) {
      winston.error('PostModel.update error:', error);
      throw new Error(`Failed to update post: ${error.message}`);
    }
  }

  // Optimized post deletion
  async delete(id) {
    try {
      const params = {
        match: { id }
      };

      await dbManager.executeQuery(
        this.tableName,
        'delete',
        params
      );

      // Clear caches
      this.clearPostCache(id);
      this.clearListCache();

      winston.info('Post deleted:', { id });
      return true;

    } catch (error) {
      winston.error('PostModel.delete error:', error);
      throw new Error(`Failed to delete post: ${error.message}`);
    }
  }

  // Bulk operations for better performance
  async createMany(posts) {
    try {
      const operations = posts.map(post => ({
        table: this.tableName,
        operation: 'insert',
        params: {
          data: {
            ...post,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            published: post.published || false,
            slug: post.slug || this.generateSlug(post.title)
          }
        }
      }));

      const results = await dbManager.executeBatch(operations);
      this.clearListCache();

      winston.info('Bulk posts created:', { count: posts.length });
      return results;

    } catch (error) {
      winston.error('PostModel.createMany error:', error);
      throw new Error(`Failed to create posts: ${error.message}`);
    }
  }

  // Search with full-text search optimization
  async search(query, options = {}) {
    try {
      const { limit = 10, category } = options;
      const cacheKey = `posts_search_${query}_${JSON.stringify(options)}`;

      const filters = {};
      if (category) filters.category = category;
      
      // Use Supabase full-text search
      const client = dbManager.getClient();
      let searchQuery = client
        .from(this.tableName)
        .select(this.listSelect)
        .textSearch('content', query, {
          type: 'websearch',
          config: 'english'
        });

      if (category) {
        searchQuery = searchQuery.eq('category', category);
      }

      searchQuery = searchQuery
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      const { data, error } = await searchQuery;

      if (error) throw error;

      winston.info('Search executed:', { query, results: data?.length || 0 });
      return data || [];

    } catch (error) {
      winston.error('PostModel.search error:', error);
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  // Get analytics data
  async getAnalytics() {
    try {
      const cacheKey = 'posts_analytics';
      
      const client = dbManager.getClient();
      
      // Get counts by category
      const { data: categoryData } = await client
        .from(this.tableName)
        .select('category')
        .eq('published', true);

      // Get counts by author
      const { data: authorData } = await client
        .from(this.tableName)
        .select('author')
        .eq('published', true);

      // Get total counts
      const { count: totalPosts } = await client
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      const { count: publishedPosts } = await client
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('published', true);

      const analytics = {
        totalPosts,
        publishedPosts,
        draftPosts: totalPosts - publishedPosts,
        categoryCounts: this.groupAndCount(categoryData, 'category'),
        authorCounts: this.groupAndCount(authorData, 'author')
      };

      return analytics;

    } catch (error) {
      winston.error('PostModel.getAnalytics error:', error);
      throw new Error(`Failed to get analytics: ${error.message}`);
    }
  }

  // Helper methods
  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-')
      .substring(0, 50);
  }

  groupAndCount(data, field) {
    const counts = {};
    data.forEach(item => {
      const value = item[field] || 'Uncategorized';
      counts[value] = (counts[value] || 0) + 1;
    });
    return counts;
  }

  clearPostCache(id) {
    // This would integrate with the cache system to clear specific post cache
    dbManager.clearCache(); // For now, clear all cache
  }

  clearListCache() {
    // Clear list-related caches
    dbManager.clearCache(); // For now, clear all cache
  }

  // Get model performance metrics
  getPerformanceMetrics() {
    return dbManager.getPerformanceMetrics();
  }
}

module.exports = new PostModel();