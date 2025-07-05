/**
 * Post Model
 * Handles blog post data operations with proper validation and error handling
 */

const { z } = require('zod');

// Post validation schema
const PostSchema = z.object({
  id: z.number().int().positive().optional(),
  titleTH: z.string().min(3).max(255),
  titleEN: z.string().max(255).optional(),
  title: z.string().max(255).optional(), // Backward compatibility
  slug: z.string().min(1).max(255).regex(/^[\u0E00-\u0E7Fa-z0-9-]+$/),
  content: z.string().max(50000),
  excerpt: z.string().min(10).max(500),
  featured_image_url: z.string().url().optional(),
  author: z.string().max(100).default('ระเบียบการช่าง'),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  
  // SEO Fields
  metaTitle: z.string().max(160).optional(),
  metaDescription: z.string().max(320).optional(),
  keywords: z.string().optional(),
  focusKeyword: z.string().max(100).optional(),
  
  // Analytics Fields
  views: z.number().int().min(0).default(0),
  likes: z.number().int().min(0).default(0),
  reading_time: z.number().int().positive().optional(),
  
  // Schema & Technical SEO
  schemaType: z.enum(['Article', 'BlogPosting', 'HowTo', 'NewsArticle']).default('Article'),
  canonicalUrl: z.string().url().optional(),
  
  // Tags as array
  tags: z.array(z.string().max(50)).max(10).default([]),
  category: z.enum(['maintenance', 'repair', 'operation', 'troubleshooting', 'parts', 'general']).optional(),
  
  // Timestamps
  publishedAt: z.date().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

const CreatePostSchema = PostSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  views: true,
  likes: true
});

const UpdatePostSchema = PostSchema.partial().omit({ 
  id: true, 
  createdAt: true 
});

class Post {
  static tableName = 'posts';
  
  static fields = [
    'id', 'titleTH', 'titleEN', 'title', 'slug', 'content', 'excerpt', 
    'featured_image_url', 'author', 'status', 'metaTitle', 'metaDescription', 
    'keywords', 'focusKeyword', 'views', 'likes', 'reading_time', 
    'schemaType', 'canonicalUrl', 'publishedAt', 'createdAt', 'updatedAt'
  ];

  constructor(data) {
    this.data = PostSchema.parse(data);
  }

  /**
   * Validate post data for creation
   * @param {Object} postData - Post data to validate
   * @returns {Object} - Validation result
   */
  static validateForCreate(postData) {
    try {
      // Auto-generate slug if not provided but titleTH exists
      let dataToValidate = { ...postData };
      if (!dataToValidate.slug && dataToValidate.titleTH) {
        dataToValidate.slug = Post.generateSlug(dataToValidate.titleTH);
      }
      
      const validated = CreatePostSchema.parse(dataToValidate);
      
      return { success: true, data: validated };
    } catch (error) {
      return { 
        success: false, 
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      };
    }
  }

  /**
   * Validate post data for update
   * @param {Object} postData - Post data to validate
   * @returns {Object} - Validation result
   */
  static validateForUpdate(postData) {
    try {
      const validated = UpdatePostSchema.parse(postData);
      validated.updatedAt = new Date();
      
      return { success: true, data: validated };
    } catch (error) {
      return { 
        success: false, 
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      };
    }
  }

  /**
   * Generate URL-friendly slug from title
   * @param {string} title - Title to convert
   * @returns {string} - Generated slug
   */
  static generateSlug(title) {
    if (!title || typeof title !== 'string') {
      throw new Error('Title is required for slug generation');
    }

    // Handle Thai text differently - preserve Thai characters
    const isThaiText = /[\u0E00-\u0E7F]/.test(title);
    
    if (isThaiText) {
      return title
        .toLowerCase()
        .trim()
        .replace(/[^\u0E00-\u0E7F\w\s-]/g, '') // Keep Thai characters, alphanumeric, spaces, hyphens
        .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    } else {
      return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    }
  }

  /**
   * Calculate estimated reading time
   * @param {string} content - Post content
   * @returns {number} - Reading time in minutes
   */
  static calculateReadingTime(content) {
    if (!content || typeof content !== 'string') return 1;
    
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }

  /**
   * Check if post is published
   * @param {Object} post - Post object
   * @returns {boolean} - Is published
   */
  static isPublished(post) {
    return post?.status === 'published';
  }

  /**
   * Check if post is draft
   * @param {Object} post - Post object
   * @returns {boolean} - Is draft
   */
  static isDraft(post) {
    return post?.status === 'draft';
  }

  /**
   * Get safe post data for public API
   * @param {Object} post - Post object
   * @returns {Object} - Public post data
   */
  static toPublic(post) {
    if (!post) return null;
    
    // Remove internal fields from public response
    const publicFields = Post.fields.filter(field => 
      !['reading_time'].includes(field)
    );
    
    const publicPost = {};
    publicFields.forEach(field => {
      if (post[field] !== undefined) {
        publicPost[field] = post[field];
      }
    });
    
    return publicPost;
  }

  /**
   * Get posts summary for listings
   * @param {Object} post - Post object
   * @returns {Object} - Post summary
   */
  static toSummary(post) {
    if (!post) return null;
    
    return {
      id: post.id,
      titleTH: post.titleTH,
      titleEN: post.titleEN,
      slug: post.slug,
      excerpt: post.excerpt,
      author: post.author,
      status: post.status,
      category: post.category,
      tags: post.tags || [],
      views: post.views || 0,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    };
  }
}

module.exports = {
  Post,
  PostSchema,
  CreatePostSchema,
  UpdatePostSchema
};