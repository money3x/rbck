# RBCK CMS - Enhanced Production System

## 🚀 Overview

The RBCK CMS (Rabeab Kanchang Content Management System) is a production-ready Node.js/Express application with advanced features including AI integration, comprehensive error handling, caching, monitoring, and API documentation.

## ✨ Enhanced Features

### 🛡️ Security & Production Ready
- **Helmet.js** - Security headers and XSS protection
- **Input Validation** - Express-validator with sanitization
- **Rate Limiting** - Protection against DoS attacks
- **Error Handling** - Comprehensive logging with Winston
- **Environment Configuration** - Secure environment variable management

### 📊 Monitoring & Analytics
- **Real-time Metrics** - Request tracking, response times, error rates
- **Health Checks** - System health monitoring endpoints
- **Performance Monitoring** - Memory usage, uptime tracking
- **Structured Logging** - JSON logs with different severity levels

### ⚡ Performance Optimization
- **Multi-layer Caching** - NodeCache implementation with TTL
- **Cache Invalidation** - Smart cache management
- **Response Compression** - Gzip compression support
- **Optimized Database Queries** - Efficient data fetching

### 🤖 AI Integration
- **Multiple AI Providers** - OpenAI, Gemini, Claude, DeepSeek, ChindaX
- **Provider Factory Pattern** - Modular AI provider management
- **Fallback Support** - Automatic provider switching
- **Rate Limiting** - AI API usage protection

### 📚 API Documentation
- **Swagger/OpenAPI 3.0** - Interactive API documentation
- **Auto-generated Docs** - Self-documenting endpoints
- **Schema Validation** - Request/response validation
- **API Testing Interface** - Built-in API testing tools

### 🧪 Testing & Quality Assurance
- **Jest Test Suite** - Comprehensive unit and integration tests
- **API Testing** - Endpoint testing with Supertest
- **AI Integration Tests** - Provider testing and fallback validation
- **Health Check Tests** - System monitoring validation

## 🏗️ Architecture

```
backend/
├── server.js                 # Main application entry point
├── middleware/               # Custom middleware
│   ├── errorHandler.js       # Winston logging & error handling
│   ├── cache.js             # NodeCache implementation
│   ├── metrics.js           # Performance monitoring
│   ├── validation.js        # Input validation & sanitization
│   ├── auth.js              # Authentication middleware
│   └── rateLimiter.js       # Rate limiting
├── config/
│   └── swagger.js           # API documentation setup
├── routes/
│   ├── ai.js                # AI provider endpoints
│   ├── auth.js              # Authentication routes
│   └── posts.js             # Blog post management
├── ai/
│   └── providers/           # AI provider implementations
├── tests/                   # Test suites
├── scripts/                 # Utility scripts
└── logs/                    # Log files
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Environment variables configured

### Installation

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Run Production Server**
   ```bash
   npm start
   ```

## 🔧 Configuration

### Environment Variables

```env
# Application
NODE_ENV=production
PORT=10000

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key

# Security
JWT_SECRET=your_jwt_secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure_password

# AI Providers
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
CLAUDE_API_KEY=your_claude_key
DEEPSEEK_API_KEY=your_deepseek_key
CHINDA_API_KEY=your_chinda_key
```

## 📊 API Endpoints

### System Endpoints
- `GET /health` - Health check
- `GET /api/metrics` - System metrics
- `GET /api/cache/stats` - Cache statistics
- `GET /api-docs` - Swagger documentation

### Content Management
- `GET /api/posts` - List posts (with caching)
- `POST /api/posts` - Create post (with validation)
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `GET /api/analytics` - Analytics data

### AI Integration
- `POST /api/ai/chat` - AI chat interaction
- `GET /api/ai/providers` - Available AI providers
- `POST /api/ai/generate` - Content generation

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
npm run test:api      # API endpoints
npm run test:ai       # AI integration
npm run test:posts    # Post management
```

### Test Coverage
```bash
npm run test:coverage
```

## 📈 Monitoring

### Health Checks
```bash
# Basic health check
curl http://localhost:10000/health

# Detailed metrics
curl http://localhost:10000/api/metrics

# Cache statistics
curl http://localhost:10000/api/cache/stats
```

### Log Management
- **Application Logs**: `logs/app.log`
- **Error Logs**: `logs/error.log`
- **Access Logs**: `logs/access.log`

### Performance Metrics
- Request count and rate
- Response times (min, max, average)
- Error rates by endpoint
- Memory usage and uptime
- Cache hit/miss ratios

## 🚀 Deployment

### Pre-deployment Check
```bash
node scripts/deploymentCheck.js
```

### Production Deployment
1. **Build and Test**
   ```bash
   npm run build
   npm test
   ```

2. **Environment Setup**
   - Configure production environment variables
   - Set up logging directories
   - Configure reverse proxy (Nginx)

3. **Start Production Server**
   ```bash
   npm start
   ```

4. **Health Verification**
   ```bash
   curl http://your-domain/health
   ```

## 🔒 Security Features

- **Input Sanitization** - XSS and injection protection
- **Rate Limiting** - DoS attack prevention
- **Security Headers** - Helmet.js implementation
- **Environment Isolation** - Secure configuration management
- **Error Handling** - No sensitive data leakage

## 📚 Documentation

- **API Documentation**: Available at `/api-docs` when server is running
- **Code Documentation**: JSDoc comments throughout codebase
- **Deployment Guide**: See `scripts/generateDocs.js`

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new features
4. Ensure all tests pass
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check the health endpoint: `/health`
2. Review logs in the `logs/` directory
3. Check the API documentation: `/api-docs`
4. Run deployment checks: `node scripts/deploymentCheck.js`

---

**Version**: 2.0.0  
**Last Updated**: June 16, 2025  
**Status**: Production Ready ✅
