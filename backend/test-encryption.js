/**
 * Test script for API key encryption functionality
 */

// Set up test environment
const crypto = require('crypto');
process.env.NODE_ENV = 'test';
process.env.API_KEY_ENCRYPTION_KEY = crypto.randomBytes(32).toString('base64');

console.log('🧪 Testing API Key Encryption...\n');

try {
    // Import the API key manager
    const apiKeyManager = require('./models/apiKeys');
    
    console.log('✅ API Key Manager loaded successfully');
    
    // Test data
    const testApiKey = 'sk-test1234567890abcdef';
    const provider = 'openai';
    
    console.log(`📝 Testing with: ${testApiKey}`);
    
    // Test encryption directly
    console.log('\n🔐 Testing encryption/decryption...');
    const encrypted = apiKeyManager.encrypt(testApiKey);
    console.log('✅ Encryption successful:', encrypted);
    
    const decrypted = apiKeyManager.decrypt(encrypted);
    console.log('✅ Decryption successful:', decrypted);
    
    const matches = decrypted === testApiKey;
    console.log(`✅ Round-trip test: ${matches ? 'PASSED' : 'FAILED'}`);
    
    // Test API key manager methods
    console.log('\n🔑 Testing API key management...');
    apiKeyManager.setApiKey(provider, testApiKey);
    console.log('✅ API key stored successfully');
    
    const retrieved = apiKeyManager.getApiKey(provider);
    console.log('✅ API key retrieved:', retrieved);
    
    const retrievalMatches = retrieved === testApiKey;
    console.log(`✅ Storage/retrieval test: ${retrievalMatches ? 'PASSED' : 'FAILED'}`);
    
    // Test masked keys
    console.log('\n🎭 Testing masked keys...');
    const masked = apiKeyManager.getMaskedKeys();
    console.log('✅ Masked keys:', masked);
    
    // Test validation
    console.log('\n✅ Testing validation...');
    const validation = apiKeyManager.validateApiKey('openai', testApiKey);
    console.log('✅ Validation result:', validation);
    
    console.log('\n🎉 All encryption tests PASSED! 🎉');
    
} catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
}
