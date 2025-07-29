// Test setup configuration - Only override in test environment
if (process.env.NODE_ENV !== 'development') {
    process.env.NODE_ENV = 'test';
}
process.env.PORT = process.env.PORT || '0'; // Use random available port for testing

// Set up test environment variables
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'admin123';
process.env.ADMIN_EMAIL = 'admin@test.com';

// Mock encryption key for testing
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-bytes-1234';

// Disable Supabase for tests to use mock client
process.env.SUPABASE_URL = 'mock-supabase-url';
process.env.SUPABASE_SERVICE_KEY = 'mock-supabase-key';

// Enable ChindaX for AI tests - Only in test environment
if (process.env.NODE_ENV === 'test') {
    process.env.GEMINI_ENABLED = 'false';
    process.env.OPENAI_ENABLED = 'false';
    process.env.CLAUDE_ENABLED = 'false';
    process.env.DEEPSEEK_ENABLED = 'false';
    process.env.QWEN_ENABLED = 'false';
    process.env.CHINDA_ENABLED = 'true';
    process.env.CHINDA_API_KEY = 'test-chinda-api-key';
    process.env.CHINDA_JWT_TOKEN = 'test-jwt-token-for-chinda-testing-minimum-length-required-by-validation';
    process.env.CHINDA_BASE_URL = 'https://test-chinda.example.com/api';
}

// Test utilities
const jwt = require('jsonwebtoken');

global.generateTestToken = (userId = 'test-user-id') => {
  return jwt.sign(
    { userId, isAdmin: true },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

global.getAuthHeaders = () => ({
  'Authorization': `Bearer ${generateTestToken()}`
});

// Suppress console logs during testing unless debugging
if (!process.env.DEBUG) {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
}

// Increase timeout for async operations
jest.setTimeout(30000);

// Global test teardown
afterAll(async () => {
  // Clean up any resources
  await new Promise(resolve => setTimeout(resolve, 1000));
});
