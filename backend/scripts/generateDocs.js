const fs = require('fs').promises;
const path = require('path');
const { specs } = require('../config/swagger');

async function generateDocs() {
  console.log('📚 Generating API Documentation...');
  
  try {
    // Create docs directory if it doesn't exist
    const docsDir = path.join(__dirname, '../docs');
    try {
      await fs.access(docsDir);
    } catch {
      await fs.mkdir(docsDir, { recursive: true });
    }

    // Generate OpenAPI JSON
    const swaggerJson = JSON.stringify(specs, null, 2);
    await fs.writeFile(path.join(docsDir, 'openapi.json'), swaggerJson);
    console.log('✅ Generated OpenAPI JSON specification');

    // Generate README
    const readme = generateReadme();
    await fs.writeFile(path.join(docsDir, 'API_README.md'), readme);
    console.log('✅ Generated API README');

    // Generate endpoint documentation
    const endpointsDoc = generateEndpointsDoc();
    await fs.writeFile(path.join(docsDir, 'ENDPOINTS.md'), endpointsDoc);
    console.log('✅ Generated endpoints documentation');

    // Generate deployment guide
    const deploymentGuide = generateDeploymentGuide();
    await fs.writeFile(path.join(docsDir, 'DEPLOYMENT.md'), deploymentGuide);
    console.log('✅ Generated deployment guide');

    console.log('');
    console.log('📚 Documentation generated successfully!');
    console.log('Files created:');
    console.log('  - docs/openapi.json (OpenAPI 3.0 specification)');
    console.log('  - docs/API_README.md (API overview)');
    console.log('  - docs/ENDPOINTS.md (Endpoint documentation)');
    console.log('  - docs/DEPLOYMENT.md (Deployment guide)');

  } catch (error) {
    console.error('❌ Error generating documentation:', error);
    process.exit(1);
  }
}

function generateReadme() {
  return `# RBCK CMS API Documentation

## Overview
This is the API documentation for the RBCK (Rice Harvester) CMS system with AI integration.

## Base URL
- Development: \`http://localhost:10000\`
- Production: \`https://your-production-domain.com\`

## Authentication
The API uses JWT (JSON Web Token) authentication. Include the token in the Authorization header:

\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## Content Types
- All requests with body should use \`Content-Type: application/json\`
- All responses are in JSON format

## Error Handling
All API responses follow this structure:

### Success Response
\`\`\`json
{
  "success": true,
  "data": {
    // Response data
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
\`\`\`

### Error Response
\`\`\`json
{
  "success": false,
  "error": {
    "message": "Error description",
    "details": [], // Validation errors if applicable
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "unique-request-id"
  }
}
\`\`\`

## Rate Limiting
- General API: 1000 requests per 15 minutes
- AI endpoints: 50 requests per 15 minutes
- Authentication: 5 attempts per 15 minutes

## API Endpoints

### Health & Status
- \`GET /api/health\` - Health check
- \`GET /api/metrics\` - System metrics
- \`GET /api/test\` - Test endpoint

### Posts Management
- \`GET /api/posts\` - Get all posts
- \`GET /api/posts/:id\` - Get specific post
- \`POST /api/posts\` - Create new post
- \`PUT /api/posts/:id\` - Update post
- \`DELETE /api/posts/:id\` - Delete post

### AI Integration
- \`GET /api/ai/providers\` - Get available AI providers
- \`POST /api/ai/generate\` - Generate content using AI
- \`POST /api/ai/test-connection\` - Test AI provider connection

### Analytics
- \`GET /api/analytics\` - Get site analytics

## Interactive Documentation
Visit \`/api-docs\` when the server is running to access the interactive Swagger UI.

## SDKs and Libraries
Currently, no official SDKs are available. Use standard HTTP clients like:
- JavaScript: fetch(), axios
- Python: requests
- PHP: cURL, Guzzle
- Java: OkHttp, Retrofit

## Support
For API support, please contact the development team.

## Changelog
- v1.0.0: Initial API release with basic CMS and AI integration
`;
}

function generateEndpointsDoc() {
  return `# API Endpoints Reference

## Table of Contents
1. [Health & Monitoring](#health--monitoring)
2. [Posts Management](#posts-management)
3. [AI Integration](#ai-integration)
4. [Analytics](#analytics)
5. [Authentication](#authentication)

## Health & Monitoring

### GET /api/health
Check system health status.

**Response:**
\`\`\`json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "database": "healthy",
  "memory": {
    "used": 45.2,
    "total": 512.0,
    "external": 12.1
  }
}
\`\`\`

### GET /api/metrics
Get detailed system metrics (requires authentication).

**Headers:**
\`\`\`
Authorization: Bearer <token>
\`\`\`

**Response:**
\`\`\`json
{
  "requests": {
    "total": 1500,
    "successful": 1450,
    "failed": 50,
    "averageResponseTime": 120
  },
  "errors": {
    "total": 15,
    "byType": {
      "ValidationError": 8,
      "DatabaseError": 4,
      "AuthError": 3
    }
  },
  "ai": {
    "totalRequests": 250,
    "successfulRequests": 240,
    "failedRequests": 10,
    "byProvider": {
      "chinda": {
        "requests": 150,
        "successful": 145,
        "failed": 5
      }
    }
  }
}
\`\`\`

## Posts Management

### GET /api/posts
Retrieve all posts with optional filtering and pagination.

**Query Parameters:**
- \`page\` (integer): Page number (default: 1)
- \`limit\` (integer): Items per page (default: 10, max: 100)
- \`status\` (string): Filter by status (draft, published, archived)
- \`category\` (string): Filter by category
- \`search\` (string): Search in title and content
- \`sortBy\` (string): Sort field (createdAt, updatedAt, views, titleTH)
- \`sortOrder\` (string): Sort order (asc, desc)

**Example Request:**
\`\`\`
GET /api/posts?status=published&limit=5&sortBy=views&sortOrder=desc
\`\`\`

### POST /api/posts
Create a new post.

**Request Body:**
\`\`\`json
{
  "titleTH": "หัวข้อภาษาไทย",
  "titleEN": "English Title",
  "excerpt": "สรุปเนื้อหา",
  "content": "<p>เนื้อหาบทความ</p>",
  "category": "maintenance",
  "tags": ["tag1", "tag2"],
  "status": "draft",
  "author": "ชื่อผู้เขียน",
  "metaTitle": "SEO Title",
  "metaDescription": "SEO Description",
  "focusKeyword": "คำหลัก"
}
\`\`\`

## AI Integration

### GET /api/ai/providers
Get list of available AI providers.

**Response:**
\`\`\`json
{
  "success": true,
  "providers": [
    {
      "id": "chinda",
      "name": "ChindaX AI",
      "model": "chinda-qwen3-4b",
      "status": "active"
    },
    {
      "id": "openai",
      "name": "OpenAI",
      "model": "gpt-4",
      "status": "active"
    }
  ]
}
\`\`\`

### POST /api/ai/generate
Generate content using AI.

**Request Body:**
\`\`\`json
{
  "prompt": "เขียนบทความเกี่ยวกับการดูแลรักษารถเกี่ยวข้าว",
  "provider": "chinda",
  "parameters": {
    "temperature": 0.7,
    "max_tokens": 1000
  }
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "content": "เนื้อหาที่ AI สร้าง...",
    "provider": "chinda",
    "model": "chinda-qwen3-4b",
    "usage": {
      "prompt_tokens": 50,
      "completion_tokens": 500,
      "total_tokens": 550
    }
  }
}
\`\`\`

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Invalid or missing authentication |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |
| 503 | Service Unavailable - System maintenance |

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| /api/posts | 100 requests per 15 minutes |
| /api/ai/* | 50 requests per 15 minutes |
| /api/auth/login | 5 requests per 15 minutes |
| All others | 1000 requests per 15 minutes |
`;
}

function generateDeploymentGuide() {
  return `# RBCK CMS Deployment Guide

## System Requirements

### Minimum Requirements
- Node.js 16.0 or higher
- npm 8.0 or higher
- 1GB RAM
- 10GB disk space

### Recommended for Production
- Node.js 18.0 or higher
- 4GB RAM
- 50GB disk space
- Load balancer (for high availability)

## Environment Variables

Create a \`.env\` file with the following variables:

\`\`\`bash
# Server Configuration
NODE_ENV=production
PORT=10000

# Database (Supabase)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key

# Authentication
JWT_SECRET=your-super-secret-jwt-key
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=your-secure-password

# AI Provider Keys
OPENAI_API_KEY=your-openai-api-key
CLAUDE_API_KEY=your-claude-api-key
GEMINI_API_KEY=your-gemini-api-key
DEEPSEEK_API_KEY=your-deepseek-api-key
CHINDA_API_KEY=your-chinda-api-key
CHINDA_JWT_TOKEN=your-chinda-jwt-token

# Logging
LOG_LEVEL=info

# CORS Origins (comma-separated)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Health Check URL (for monitoring)
HEALTH_CHECK_URL=https://yourdomain.com/api/health
\`\`\`

## Deployment Options

### 1. Render.com (Recommended)

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set build command: \`npm install\`
4. Set start command: \`npm start\`
5. Add environment variables in Render dashboard
6. Deploy!

### 2. Railway

1. Connect GitHub repository
2. Add environment variables
3. Deploy automatically on push

### 3. Heroku

1. Create Heroku app
2. Set buildpack: \`heroku/nodejs\`
3. Add environment variables
4. Deploy via Git or GitHub integration

### 4. VPS/Dedicated Server

\`\`\`bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone https://github.com/your-username/rbck-cms.git
cd rbck-cms/backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your values

# Install PM2 for process management
npm install -g pm2

# Start application with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
\`\`\`

## PM2 Configuration

Create \`ecosystem.config.js\`:

\`\`\`javascript
module.exports = {
  apps: [{
    name: 'rbck-cms',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 10000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
\`\`\`

## Database Setup (Supabase)

1. Create new Supabase project
2. Run the SQL schema from \`backend/models/database.js\`
3. Set up Row Level Security (RLS) policies
4. Configure API keys and URLs

## Frontend Deployment (Netlify)

1. Connect GitHub repository to Netlify
2. Set build command: \`npm run build\` (if using build process)
3. Set publish directory: \`frontend\`
4. Add environment variables for API URL
5. Configure redirects in \`_redirects\` file

## Health Monitoring

Set up monitoring with:

\`\`\`bash
# Health check script (run via cron)
*/5 * * * * /usr/bin/node /path/to/rbck-cms/backend/scripts/healthCheck.js

# Log rotation
/var/log/rbck-cms/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    copytruncate
}
\`\`\`

## SSL/TLS Configuration

### Using Let's Encrypt (for VPS)

\`\`\`bash
# Install Certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Set up auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
\`\`\`

## Performance Optimization

### 1. Enable Compression
Already included in the application.

### 2. Use CDN
Configure CDN for static assets.

### 3. Database Optimization
- Enable connection pooling
- Use read replicas for read-heavy workloads
- Implement proper indexing

### 4. Caching
- Redis for session storage
- Application-level caching for frequently accessed data

## Security Checklist

- [ ] Environment variables secured
- [ ] HTTPS enabled
- [ ] Rate limiting configured
- [ ] Input validation enabled
- [ ] Error handling doesn't expose sensitive info
- [ ] Logs don't contain sensitive data
- [ ] Database access restricted
- [ ] API keys rotated regularly
- [ ] Monitoring and alerting set up

## Monitoring and Alerting

### Recommended Tools
- **Uptime monitoring**: UptimeRobot, Pingdom
- **Error tracking**: Sentry
- **Performance monitoring**: New Relic, DataDog
- **Log management**: LogDNA, Papertrail

### Custom Health Checks
Use the built-in health check endpoint:
\`\`\`
GET /api/health
\`\`\`

## Backup Strategy

### Database Backups
- Automated daily backups via Supabase
- Export data regularly
- Test restore procedures

### Code Backups
- GitHub repository serves as primary backup
- Tag releases for rollback capability

## Rollback Procedure

1. Identify the last working version
2. Deploy previous version
3. Restore database if needed
4. Verify functionality
5. Investigate and fix issues

## Support

For deployment support:
- Check logs first: \`pm2 logs rbck-cms\`
- Run health check: \`npm run health-check\`
- Check system metrics: \`GET /api/metrics\`
`;
}

// Run if called directly
if (require.main === module) {
  generateDocs();
}

module.exports = { generateDocs };
