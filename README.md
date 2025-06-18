# RBCK CMS - Rice Harvester Content Management System

## 🌾 Overview

RBCK CMS is a production-ready Node.js/Express content management system designed specifically for rice harvester agricultural content. The system features AI integration, comprehensive security, caching, and monitoring capabilities.

## ✨ Key Features

- 🛡️ **Security First**: Helmet.js, input validation, rate limiting, JWT authentication
- 🤖 **AI Integration**: Multiple AI providers (OpenAI, Gemini, Claude, DeepSeek, ChindaX)
- ⚡ **Performance**: Multi-layer caching, compression, optimized queries
- 📊 **Monitoring**: Real-time metrics, health checks, structured logging
- 📚 **API Documentation**: Swagger/OpenAPI 3.0 with interactive testing
- 🧪 **Testing**: Comprehensive Jest test suite with coverage

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm 8+
- Supabase account (for database)

### Installation

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd rbck
   ```

2. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration (see .env.example for required variables)
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Run Production Server**
   ```bash
   npm start
   ```

## 🌐 Deployment

### Frontend (Netlify)
- Deploy from `/frontend` directory
- Set build command: `npm run build` (if using build process)
- Set publish directory: `/frontend`

### Backend (Render)
- Deploy from `/backend` directory
- Set build command: `npm install`
- Set start command: `npm start`
- Configure environment variables (see `.env.example`)

## 📋 Environment Variables

### Required for Production
- `JWT_SECRET` - Strong JWT secret key
- `ADMIN_PASSWORD` - Admin dashboard password
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_KEY` - Supabase service role key

### Optional AI Providers
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `CLAUDE_API_KEY`
- `DEEPSEEK_API_KEY`
- `CHINDA_API_KEY` & `CHINDA_JWT_TOKEN`

## 🧪 Testing

```bash
cd backend
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage
```

## 📚 API Documentation

Access interactive API documentation at:
- Development: `http://localhost:10000/api-docs`
- Production: `https://your-api-url.com/api-docs`

## 🏗️ Project Structure

```
rbck/
├── backend/              # Node.js/Express API server
│   ├── middleware/       # Custom middleware (auth, cache, validation)
│   ├── routes/          # API routes (auth, ai, posts, migration)
│   ├── ai/              # AI provider implementations
│   ├── tests/           # Jest test suites
│   └── config/          # Configuration files
├── frontend/            # Static frontend files
│   ├── admin/           # Admin dashboard
│   ├── css/             # Stylesheets
│   └── js/              # JavaScript files
└── docs/                # Documentation
```

## 🔒 Security Features

- **Authentication**: JWT-based admin authentication
- **Input Validation**: Express-validator with sanitization
- **Rate Limiting**: Protection against DoS attacks
- **Security Headers**: Helmet.js configuration
- **Environment Security**: All secrets via environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add/update tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Check existing GitHub issues
- Review API documentation
- Check logs for error details