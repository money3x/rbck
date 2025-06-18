// Test setup configuration
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // Use random available port for testing

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
