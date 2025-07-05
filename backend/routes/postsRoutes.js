/**
 * Posts Routes
 * Clean, testable route handlers with proper error handling
 */

const express = require('express');
const router = express.Router();
const postsController = require('../controllers/postsController');
const { cacheMiddleware, clearCache } = require('../middleware/cache');
const { validatePost } = require('../middleware/validation');
const { authenticateAdmin } = require('../middleware/auth');
const { logger } = require('../middleware/errorHandler');

/**
 * @swagger
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       required:
 *         - titleTH
 *         - excerpt
 *       properties:
 *         id:
 *           type: integer
 *           description: Post ID
 *         titleTH:
 *           type: string
 *           description: Thai title
 *         titleEN:
 *           type: string
 *           description: English title
 *         slug:
 *           type: string
 *           description: URL slug
 *         content:
 *           type: string
 *           description: Post content
 *         excerpt:
 *           type: string
 *           description: Post excerpt
 *         status:
 *           type: string
 *           enum: [draft, published, archived]
 *         author:
 *           type: string
 *           description: Author name
 *         category:
 *           type: string
 *           enum: [maintenance, repair, operation, troubleshooting, parts, general]
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         views:
 *           type: integer
 *           description: View count
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get all posts with filtering and pagination
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived]
 *         description: Filter by status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and content
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of posts to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Number of posts to skip
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, views, titleTH]
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     posts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Post'
 *                     total:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *                     limit:
 *                       type: integer
 */
router.get('/', cacheMiddleware(300), async (req, res) => {
  try {
    const options = {
      status: req.query.status,
      category: req.query.category,
      search: req.query.search,
      limit: req.query.limit,
      offset: req.query.offset || 0,
      sortBy: req.query.sortBy || 'updatedAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await postsController.getAllPosts(options);
    
    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      ...result.data,
      query: req.query
    });
  } catch (error) {
    logger.error('Posts route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/posts/{id}:
 *   get:
 *     summary: Get single post by ID
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post not found
 */
router.get('/:id', cacheMiddleware(600), async (req, res) => {
  try {
    const result = await postsController.getPostById(req.params.id);
    
    if (!result.success) {
      const status = result.error === 'Post not found' ? 404 : 400;
      return res.status(status).json(result);
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Get post route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Post'
 *     responses:
 *       201:
 *         description: Post created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticateAdmin, validatePost, async (req, res) => {
  try {
    const result = await postsController.createPost(req.body);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json({
      success: true,
      data: result.data,
      message: 'Post created successfully'
    });
  } catch (error) {
    logger.error('Create post route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/posts/{id}:
 *   put:
 *     summary: Update an existing post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Post'
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 */
router.put('/:id', authenticateAdmin, validatePost, async (req, res) => {
  try {
    const result = await postsController.updatePost(req.params.id, req.body);
    
    if (!result.success) {
      const status = result.error === 'Post not found' ? 404 : 400;
      return res.status(status).json(result);
    }

    res.json({
      success: true,
      data: result.data,
      message: 'Post updated successfully'
    });
  } catch (error) {
    logger.error('Update post route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/posts/{id}:
 *   delete:
 *     summary: Delete a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 */
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const result = await postsController.deletePost(req.params.id);
    
    if (!result.success) {
      const status = result.error === 'Post not found' ? 404 : 400;
      return res.status(status).json(result);
    }

    res.json(result);
  } catch (error) {
    logger.error('Delete post route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/posts/{id}/view:
 *   post:
 *     summary: Increment post view count
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *     responses:
 *       200:
 *         description: View count incremented
 *       404:
 *         description: Post not found
 */
router.post('/:id/view', async (req, res) => {
  try {
    const views = await postsController.incrementViews(req.params.id);
    
    res.json({
      success: true,
      data: { views },
      message: 'View count incremented'
    });
  } catch (error) {
    logger.error('Increment views route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/posts/analytics:
 *   get:
 *     summary: Get posts analytics
 *     tags: [Posts]
 *     responses:
 *       200:
 *         description: Analytics data
 */
router.get('/analytics/summary', cacheMiddleware(600), async (req, res) => {
  try {
    const analytics = postsController.getAnalytics();
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Analytics route error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate analytics',
      message: error.message
    });
  }
});

module.exports = router;