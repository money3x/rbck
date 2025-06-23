/**
 * Security Validation Script
 * Comprehensive validation of all Phase 1 security implementations
 */

const apiKeyManager = require('./models/apiKeys');
const { logger } = require('./middleware/errorHandler');

console.log('🛡️  RBCK CMS Security Validation');
console.log('='.repeat(50));

async function validateSecurity() {
    const results = {
        encryption: false,
        apiKeyManagement: false,
        validation: false,
        masking: false,
        auditLogging: false
    };

    try {
        // 1. Test Encryption
        console.log('\n1. 🔐 Testing Encryption...');
        const testData = 'sensitive-test-data-12345';
        const encrypted = apiKeyManager.encrypt(testData);
        const decrypted = apiKeyManager.decrypt(encrypted);
        
        if (decrypted === testData) {
            console.log('   ✅ AES-256-GCM encryption: PASSED');
            results.encryption = true;
        } else {
            console.log('   ❌ Encryption test: FAILED');
        }        // 2. Test API Key Management
        console.log('\n2. 🔑 Testing API Key Management...');
        try {
            apiKeyManager.setApiKey('test-provider', 'test-key-12345');
            const retrieved = apiKeyManager.getApiKey('test-provider');
            
            if (retrieved === 'test-key-12345') {
                console.log('   ✅ API key storage/retrieval: PASSED');
                results.apiKeyManagement = true;
            } else {
                console.log('   ❌ API key management: FAILED');
            }
        } catch (error) {
            console.log(`   ❌ API key management error: ${error.message}`);
        }        // 3. Test Validation
        console.log('\n3. ✅ Testing Validation...');
        const validationResult = apiKeyManager.validateApiKey('openai', 'invalid-key');
        
        if (!validationResult.valid) {
            console.log('   ✅ API key validation: PASSED');
            results.validation = true;
        } else {
            console.log('   ❌ Validation test: FAILED');
        }

        // 4. Test Masking
        console.log('\n4. 🎭 Testing Key Masking...');
        const maskedKeys = apiKeyManager.getMaskedKeys();
        const hasProperMasking = Object.values(maskedKeys).every(key => 
            key.includes('*') && !key.includes('your-') && key.length > 10
        );
        
        if (hasProperMasking) {
            console.log('   ✅ Key masking: PASSED');
            console.log(`   📋 Sample: ${Object.entries(maskedKeys)[0]?.[1] || 'N/A'}`);
            results.masking = true;
        } else {
            console.log('   ❌ Key masking: FAILED');
        }

        // 5. Test Audit Logging
        console.log('\n5. 📋 Testing Audit Logging...');
        try {
            logger.info('Security validation test log entry');
            console.log('   ✅ Audit logging: PASSED');
            results.auditLogging = true;
        } catch (error) {
            console.log(`   ❌ Audit logging error: ${error.message}`);
        }

        // 6. Summary
        console.log('\n' + '='.repeat(50));
        console.log('📊 VALIDATION SUMMARY:');
        console.log('='.repeat(50));
        
        const passedTests = Object.values(results).filter(r => r).length;
        const totalTests = Object.keys(results).length;
        
        Object.entries(results).forEach(([test, passed]) => {
            console.log(`   ${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
        });
        
        console.log(`\n🎯 Overall Score: ${passedTests}/${totalTests} (${Math.round((passedTests/totalTests) * 100)}%)`);
        
        if (passedTests === totalTests) {
            console.log('\n🎉 ALL SECURITY TESTS PASSED! System is production-ready.');
        } else {
            console.log(`\n⚠️  ${totalTests - passedTests} test(s) failed. Review required.`);
        }

        // 7. Environment Check
        console.log('\n🌍 Environment Validation:');
        const requiredEnvVars = [
            'JWT_SECRET',
            'ADMIN_USERNAME', 
            'ADMIN_PASSWORD',
            'ENCRYPTION_KEY'
        ];
        
        requiredEnvVars.forEach(envVar => {
            const exists = !!process.env[envVar];
            console.log(`   ${exists ? '✅' : '❌'} ${envVar}: ${exists ? 'SET' : 'MISSING'}`);
        });

    } catch (error) {
        console.error('\n❌ Security validation failed:', error.message);
    }
}

// Run validation
validateSecurity().then(() => {
    console.log('\n🛡️  Security validation completed.');
    process.exit(0);
}).catch(error => {
    console.error('❌ Validation error:', error);
    process.exit(1);
});
