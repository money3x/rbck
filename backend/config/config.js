/**
 * Application Configuration
 * Central configuration management for all environment variables
 */

require('dotenv').config();

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 10000,
    host: process.env.HOST || 'localhost',
    env: process.env.NODE_ENV || 'development'
  },

  // Database Configuration (Supabase)
  database: {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_SERVICE_KEY,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY 
  },

  // Frontend Configuration
  frontend: {
    url: process.env.FRONTEND_URL || 'https://flourishing-gumdrop-dffe7a.netlify.app',
    allowedOrigins: [
      process.env.FRONTEND_URL,
      'https://flourishing-gumdrop-dffe7a.netlify.app',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:8080',
      'http://localhost:5500',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:5500'
    ].filter(Boolean) // Remove null/undefined values
  },

  // API Configuration
  api: {
    baseUrl: process.env.API_URL || process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 10000}`,
    version: '2.0.0',
    title: 'RBCK CMS API',
    description: 'Rice Harvester Content Management System API'
  },

  // Security Configuration
  security: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiration: process.env.JWT_EXPIRATION || '24h',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100
  },

  // AI Providers Configuration
  ai: {
    providers: {
      openai: {
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        enabled: !!process.env.OPENAI_API_KEY
      },
      gemini: {
        apiKey: process.env.GEMINI_API_KEY,
        model: process.env.GEMINI_MODEL || 'gemini-pro',
        enabled: !!process.env.GEMINI_API_KEY
      },
      claude: {
        apiKey: process.env.CLAUDE_API_KEY,
        model: process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229',
        enabled: !!process.env.CLAUDE_API_KEY
      },
      deepseek: {
        apiKey: process.env.DEEPSEEK_API_KEY,
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        enabled: !!process.env.DEEPSEEK_API_KEY
      },
      chinda: {
        apiKey: process.env.CHINDA_API_KEY,
        jwtToken: process.env.CHINDA_JWT_TOKEN,
        baseUrl: process.env.CHINDA_BASE_URL || 'https://chindax.iapp.co.th',
        model: process.env.CHINDA_MODEL || 'chinda-qwen3-32b',
        enabled: !!(process.env.CHINDA_API_KEY && process.env.CHINDA_JWT_TOKEN)
      }
    }
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    format: process.env.LOG_FORMAT || 'json',
    maxFiles: process.env.LOG_MAX_FILES || '14d',
    maxSize: process.env.LOG_MAX_SIZE || '20m'
  },

  // Cache Configuration
  cache: {
    ttl: {
      api: parseInt(process.env.CACHE_API_TTL) || 300, // 5 minutes
      posts: parseInt(process.env.CACHE_POSTS_TTL) || 900, // 15 minutes
      static: parseInt(process.env.CACHE_STATIC_TTL) || 3600, // 1 hour
      ai: parseInt(process.env.CACHE_AI_TTL) || 1800 // 30 minutes
    },
    checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD) || 600 // 10 minutes
  },

  // Admin Configuration
  admin: {
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD,
    email: process.env.ADMIN_EMAIL || 'admin@rbck.com'
  }
};

// Validation functions
const validateConfig = () => {
  const errors = [];

  // Check required environment variables for production
  if (config.server.env === 'production') {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-default-jwt-secret-change-this') {
      errors.push('JWT_SECRET must be set in production');
    }

    if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD === 'change-this-password') {
      errors.push('ADMIN_PASSWORD must be set in production');
    }

    if (!config.database.supabaseUrl || config.database.supabaseUrl.includes('placeholder')) {
      errors.push('SUPABASE_URL must be set in production');
    }

    if (!config.database.supabaseKey || config.database.supabaseKey.includes('placeholder')) {
      errors.push('SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY must be set in production');
    }
  }

  if (errors.length > 0) {
    console.error('❌ Configuration Validation Errors:');
    errors.forEach(error => console.error(`   • ${error}`));
    
    if (config.server.env === 'production') {
      process.exit(1);
    } else {
      console.warn('⚠️  Running in development mode with default values');
    }
  }
};

// Get enabled AI providers
const getEnabledAIProviders = () => {
  return Object.entries(config.ai.providers)
    .filter(([_, provider]) => provider.enabled)
    .map(([name, provider]) => ({
      name,
      model: provider.model,
      enabled: provider.enabled
    }));
};

// Export configuration
module.exports = {
  ...config,
  validateConfig,
  getEnabledAIProviders,
  
  // Helper functions
  isDevelopment: () => config.server.env === 'development',
  isProduction: () => config.server.env === 'production',
  isTest: () => config.server.env === 'test'
};
