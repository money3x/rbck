/**
 * Post Model Tests
 * Comprehensive test coverage for Post model validation and business logic
 */

const { Post, CreatePostSchema, UpdatePostSchema } = require('../../models/Post');

describe('Post Model', () => {
  describe('Validation', () => {
    const validPostData = {
      titleTH: 'ทดสอบหัวข้อภาษาไทย',
      slug: 'test-thai-title',
      content: 'เนื้อหาทดสอบที่มีความยาวเพียงพอสำหรับการทดสอบ',
      excerpt: 'สรุปเนื้อหาทดสอบ',
      author: 'ผู้เขียนทดสอบ',
      status: 'draft'
    };

    describe('validateForCreate', () => {
      it('should validate valid post data successfully', () => {
        const result = Post.validateForCreate(validPostData);
        
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data.titleTH).toBe(validPostData.titleTH);
        expect(result.data.slug).toBe(validPostData.slug);
      });

      it('should auto-generate slug from titleTH when slug is missing', () => {
        const postDataWithoutSlug = { ...validPostData };
        delete postDataWithoutSlug.slug;
        
        const result = Post.validateForCreate(postDataWithoutSlug);
        
        // Debug log
        if (!result.success) {
          console.log('Validation errors:', result.errors);
        }
        
        expect(result.success).toBe(true);
        expect(result.data.slug).toBeDefined();
        expect(result.data.slug).toBe('ทดสอบหัวข้อภาษาไทย');
      });

      it('should fail validation when titleTH is missing', () => {
        const invalidData = { ...validPostData };
        delete invalidData.titleTH;
        
        const result = Post.validateForCreate(invalidData);
        
        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors.some(e => e.field === 'titleTH')).toBe(true);
      });

      it('should fail validation when titleTH is too short', () => {
        const invalidData = { ...validPostData, titleTH: 'ab' };
        
        const result = Post.validateForCreate(invalidData);
        
        expect(result.success).toBe(false);
        expect(result.errors.some(e => e.field === 'titleTH')).toBe(true);
      });

      it('should fail validation when excerpt is too short', () => {
        const invalidData = { ...validPostData, excerpt: 'short' };
        
        const result = Post.validateForCreate(invalidData);
        
        expect(result.success).toBe(false);
        expect(result.errors.some(e => e.field === 'excerpt')).toBe(true);
      });

      it('should fail validation when status is invalid', () => {
        const invalidData = { ...validPostData, status: 'invalid_status' };
        
        const result = Post.validateForCreate(invalidData);
        
        expect(result.success).toBe(false);
        expect(result.errors.some(e => e.field === 'status')).toBe(true);
      });

      it('should validate optional fields correctly', () => {
        const postWithOptionals = {
          ...validPostData,
          titleEN: 'English Title',
          metaTitle: 'Meta Title',
          metaDescription: 'Meta description for SEO',
          keywords: 'keyword1, keyword2',
          tags: ['tag1', 'tag2'],
          category: 'maintenance'
        };
        
        const result = Post.validateForCreate(postWithOptionals);
        
        expect(result.success).toBe(true);
        expect(result.data.titleEN).toBe(postWithOptionals.titleEN);
        expect(result.data.tags).toEqual(postWithOptionals.tags);
      });
    });

    describe('validateForUpdate', () => {
      it('should validate partial update data', () => {
        const updateData = {
          titleTH: 'หัวข้อใหม่',
          status: 'published'
        };
        
        const result = Post.validateForUpdate(updateData);
        
        expect(result.success).toBe(true);
        expect(result.data.titleTH).toBe(updateData.titleTH);
        expect(result.data.status).toBe(updateData.status);
        expect(result.data.updatedAt).toBeDefined();
      });

      it('should allow empty update object', () => {
        const result = Post.validateForUpdate({});
        
        expect(result.success).toBe(true);
        expect(result.data.updatedAt).toBeDefined();
      });

      it('should fail validation for invalid partial data', () => {
        const invalidUpdate = {
          titleTH: 'ab', // Too short
          status: 'invalid'
        };
        
        const result = Post.validateForUpdate(invalidUpdate);
        
        expect(result.success).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Business Logic Methods', () => {
    describe('generateSlug', () => {
      it('should generate valid slug from Thai title', () => {
        const title = 'ทดสอบการสร้าง สลัก';
        const slug = Post.generateSlug(title);
        
        expect(slug).toBe('ทดสอบการสร้าง-สลัก');
        expect(slug).not.toContain(' ');
      });

      it('should generate valid slug from English title', () => {
        const title = 'Test Slug Generation';
        const slug = Post.generateSlug(title);
        
        expect(slug).toBe('test-slug-generation');
        expect(slug).not.toContain(' ');
        expect(slug).not.toContain('_');
      });

      it('should handle special characters correctly', () => {
        const title = 'Test!@#$%^&*()_+Title';
        const slug = Post.generateSlug(title);
        
        expect(slug).toBe('test-title');
        expect(slug).not.toMatch(/[!@#$%^&*()_+]/);
      });

      it('should remove leading and trailing hyphens', () => {
        const title = '---Test Title---';
        const slug = Post.generateSlug(title);
        
        expect(slug).toBe('test-title');
        expect(slug).not.toMatch(/^-|-$/);
      });

      it('should throw error for invalid input', () => {
        expect(() => Post.generateSlug('')).toThrow();
        expect(() => Post.generateSlug(null)).toThrow();
        expect(() => Post.generateSlug(undefined)).toThrow();
      });
    });

    describe('calculateReadingTime', () => {
      it('should calculate reading time correctly', () => {
        const shortContent = 'Short content';
        const longContent = Array(300).fill('word').join(' '); // 300 words
        
        expect(Post.calculateReadingTime(shortContent)).toBe(1); // Minimum 1 minute
        expect(Post.calculateReadingTime(longContent)).toBe(2); // ~1.5 minutes, rounded up to 2
      });

      it('should handle empty or invalid content', () => {
        expect(Post.calculateReadingTime('')).toBe(1);
        expect(Post.calculateReadingTime(null)).toBe(1);
        expect(Post.calculateReadingTime(undefined)).toBe(1);
      });

      it('should handle very long content', () => {
        const veryLongContent = Array(1000).fill('word').join(' '); // 1000 words
        const readingTime = Post.calculateReadingTime(veryLongContent);
        
        expect(readingTime).toBe(5); // 1000 words / 200 words per minute = 5 minutes
      });
    });

    describe('Status Checks', () => {
      it('should correctly identify published posts', () => {
        const publishedPost = { status: 'published' };
        const draftPost = { status: 'draft' };
        
        expect(Post.isPublished(publishedPost)).toBe(true);
        expect(Post.isPublished(draftPost)).toBe(false);
        expect(Post.isPublished(null)).toBe(false);
      });

      it('should correctly identify draft posts', () => {
        const draftPost = { status: 'draft' };
        const publishedPost = { status: 'published' };
        
        expect(Post.isDraft(draftPost)).toBe(true);
        expect(Post.isDraft(publishedPost)).toBe(false);
        expect(Post.isDraft(null)).toBe(false);
      });
    });

    describe('Data Transformation', () => {
      const samplePost = {
        id: 1,
        titleTH: 'ทดสอบ',
        titleEN: 'Test',
        slug: 'test',
        content: 'Content',
        excerpt: 'Excerpt',
        status: 'published',
        author: 'Author',
        views: 100,
        reading_time: 5,
        createdAt: '2023-01-01T00:00:00Z'
      };

      it('should convert to public format correctly', () => {
        const publicPost = Post.toPublic(samplePost);
        
        expect(publicPost).toBeDefined();
        expect(publicPost.id).toBe(samplePost.id);
        expect(publicPost.titleTH).toBe(samplePost.titleTH);
        // Should exclude reading_time from public data
        expect(publicPost.reading_time).toBeUndefined();
      });

      it('should handle null input for toPublic', () => {
        expect(Post.toPublic(null)).toBeNull();
        expect(Post.toPublic(undefined)).toBeNull();
      });

      it('should convert to summary format correctly', () => {
        const summary = Post.toSummary(samplePost);
        
        expect(summary).toBeDefined();
        expect(summary.id).toBe(samplePost.id);
        expect(summary.titleTH).toBe(samplePost.titleTH);
        expect(summary.excerpt).toBe(samplePost.excerpt);
        // Should not include full content in summary
        expect(summary.content).toBeUndefined();
      });

      it('should handle null input for toSummary', () => {
        expect(Post.toSummary(null)).toBeNull();
        expect(Post.toSummary(undefined)).toBeNull();
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle extremely long content', () => {
      const extremelyLongContent = 'a'.repeat(60000); // Exceeds 50000 limit
      const postData = {
        titleTH: 'Test',
        slug: 'test',
        content: extremelyLongContent,
        excerpt: 'Test excerpt'
      };
      
      const result = Post.validateForCreate(postData);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.field === 'content')).toBe(true);
    });

    it('should handle invalid slug format', () => {
      const postData = {
        titleTH: 'Test',
        slug: 'invalid slug with spaces',
        content: 'Content',
        excerpt: 'Excerpt'
      };
      
      const result = Post.validateForCreate(postData);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.field === 'slug')).toBe(true);
    });

    it('should handle too many tags', () => {
      const postData = {
        titleTH: 'Test',
        slug: 'test',
        content: 'Content',
        excerpt: 'Excerpt',
        tags: Array(15).fill('tag') // Exceeds 10 tag limit
      };
      
      const result = Post.validateForCreate(postData);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.field === 'tags')).toBe(true);
    });
  });
});