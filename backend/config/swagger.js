const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RBCK CMS API',
      version: '1.0.0',
      description: 'Rice Harvester CMS API with AI Integration',
      contact: {
        name: 'Rabeab Kanchang',
        email: 'support@rbck.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:10000',
        description: 'Development server'
      },
      {
        url: 'https://rbck.onrender.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      },
      schemas: {
        Post: {
          type: 'object',
          required: ['titleTH', 'excerpt'],
          properties: {
            id: {
              type: 'integer',
              description: 'Unique identifier for the post',
              example: 1
            },
            titleTH: {
              type: 'string',
              description: 'Thai title of the post',
              example: 'เทคนิคการดูแลรักษารถเกี่ยวข้าว'
            },
            titleEN: {
              type: 'string',
              description: 'English title of the post',
              example: 'Rice Harvester Maintenance Tips'
            },
            slug: {
              type: 'string',
              description: 'URL-friendly version of the title',
              example: 'rice-harvester-maintenance-tips'
            },
            content: {
              type: 'string',
              description: 'HTML content of the post'
            },
            excerpt: {
              type: 'string',
              description: 'Short summary of the post',
              example: 'เรียนรู้เทคนิคการดูแลรักษารถเกี่ยวข้าวอย่างถูกต้อง'
            },
            category: {
              type: 'string',
              description: 'Post category',
              example: 'maintenance'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of tags',
              example: ['รถเกี่ยวข้าว', 'การดูแลรักษา']
            },
            status: {
              type: 'string',
              enum: ['draft', 'published', 'archived'],
              description: 'Publication status'
            },
            author: {
              type: 'string',
              description: 'Author name',
              example: 'ระเบียบการช่าง'
            },
            publishDate: {
              type: 'string',
              format: 'date',
              description: 'Publication date'
            },
            views: {
              type: 'integer',
              description: 'Number of views',
              example: 156
            },
            metaTitle: {
              type: 'string',
              description: 'SEO meta title'
            },
            metaDescription: {
              type: 'string',
              description: 'SEO meta description'
            },
            focusKeyword: {
              type: 'string',
              description: 'SEO focus keyword'
            },
            schemaType: {
              type: 'string',
              description: 'Schema.org type',
              example: 'HowTo'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        AIRequest: {
          type: 'object',
          required: ['prompt', 'provider'],
          properties: {
            prompt: {
              type: 'string',
              description: 'The prompt to send to the AI provider',
              example: 'เขียนบทความเกี่ยวกับการดูแลรักษารถเกี่ยวข้าว'
            },
            provider: {
              type: 'string',
              enum: ['openai', 'claude', 'gemini', 'deepseek', 'chinda'],
              description: 'AI provider to use'
            },
            model: {
              type: 'string',
              description: 'Specific model to use',
              example: 'gpt-4'
            },
            parameters: {
              type: 'object',
              description: 'Additional parameters for the AI request'
            }
          }
        },
        AIResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Whether the request was successful'
            },
            data: {
              type: 'object',
              properties: {
                content: {
                  type: 'string',
                  description: 'Generated content from AI'
                },
                provider: {
                  type: 'string',
                  description: 'AI provider used'
                },
                model: {
                  type: 'string',
                  description: 'Model used'
                },
                usage: {
                  type: 'object',
                  description: 'Token usage information'
                }
              }
            },
            error: {
              type: 'object',
              description: 'Error information if request failed'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'Error message'
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Error timestamp'
                },
                requestId: {
                  type: 'string',
                  description: 'Unique request identifier'
                }
              }
            }
          }
        }
      }
    }
  },
  apis: [
    './server.js',
    './routes/*.js',
    './middleware/*.js'
  ]
};

const specs = swaggerJsdoc(options);

/**
 * Setup Swagger documentation for Express app
 * @param {object} app - Express application instance
 */
function setupSwagger(app) {
  // Swagger UI endpoint
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'RBCK CMS API Documentation'
  }));
  
  // JSON endpoint for API specs
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
  
  // Add redirects for common documentation paths
  app.get('/docs', (req, res) => {
    res.redirect('/api-docs');
  });

  app.get('/swagger', (req, res) => {
    res.redirect('/api-docs');
  });
  
  console.log('📚 Swagger documentation available at /api-docs');
}

module.exports = {
  swaggerUi,
  specs,
  setupSwagger
};
