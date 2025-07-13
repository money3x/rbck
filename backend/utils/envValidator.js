/**
 * Environment Validator
 * Validates critical environment variables on startup
 * Created: 2025-07-04 - Security Enhancement
 */

class EnvironmentValidator {
    /**
     * Validate security-critical environment variables
     * @returns {object} Validation result with errors and config
     */
    static validateSecurity() {
        const errors = [];
        
        // JWT Secret validation
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            errors.push('JWT_SECRET is required');
        } else if (jwtSecret.length < 32) {
            errors.push('JWT_SECRET must be at least 32 characters');
        } else if (jwtSecret === 'default' || jwtSecret === 'secret' || jwtSecret === 'your-secret-key') {
            errors.push('JWT_SECRET cannot be a common default value');
        }
        
        // BCrypt rounds validation
        const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        if (isNaN(bcryptRounds) || bcryptRounds < 10 || bcryptRounds > 15) {
            errors.push('BCRYPT_ROUNDS must be a number between 10-15');
        }
        
        // Rate limiting validation
        const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX) || 100;
        if (isNaN(rateLimitMax) || rateLimitMax < 1) {
            errors.push('RATE_LIMIT_MAX must be a positive number');
        }
        
        // Session timeout validation
        const sessionTimeout = parseInt(process.env.SESSION_TIMEOUT) || 3600000; // 1 hour default
        if (isNaN(sessionTimeout) || sessionTimeout < 300000) { // minimum 5 minutes
            errors.push('SESSION_TIMEOUT must be at least 300000ms (5 minutes)');
        }
        
        // Database validation
        if (!process.env.SUPABASE_URL) {
            errors.push('SUPABASE_URL is required');
        } else if (!process.env.SUPABASE_URL.startsWith('https://')) {
            errors.push('SUPABASE_URL must use HTTPS');
        }
        
        if (!process.env.SUPABASE_SERVICE_KEY) {
            errors.push('SUPABASE_SERVICE_KEY is required');
        } else if (process.env.SUPABASE_SERVICE_KEY.length < 100) {
            errors.push('SUPABASE_SERVICE_KEY appears to be invalid (too short)');
        }
        
        // Node environment validation
        const nodeEnv = process.env.NODE_ENV || 'development';
        if (!['development', 'production', 'test'].includes(nodeEnv)) {
            errors.push('NODE_ENV must be one of: development, production, test');
        }
        
        // Production-specific validations
        if (nodeEnv === 'production') {
            // FRONTEND_URL is optional - can be set for CORS configuration
            if (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.startsWith('https://')) {
                errors.push('FRONTEND_URL must use HTTPS in production if provided');
            }
            
            if (jwtSecret && jwtSecret.length < 64) {
                errors.push('JWT_SECRET should be at least 64 characters in production');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            config: errors.length === 0 ? {
                jwtSecret,
                bcryptRounds,
                rateLimitMax,
                sessionTimeout,
                nodeEnv
            } : null
        };
    }
    
    /**
     * Validate AI provider environment variables
     * @returns {object} Validation result with warnings
     */
    static validateAIProviders() {
        const providers = [
            'GEMINI_API_KEY', 
            'OPENAI_API_KEY', 
            'CLAUDE_API_KEY',
            'DEEPSEEK_API_KEY',
            'CHINDA_API_KEY'
        ];
        const warnings = [];
        const configured = [];
        
        providers.forEach(provider => {
            const key = process.env[provider];
            if (!key) {
                warnings.push(`${provider} not configured - provider will be disabled`);
            } else if (key.length < 10) {
                warnings.push(`${provider} appears to be invalid (too short)`);
            } else {
                configured.push(provider);
            }
        });
        
        if (configured.length === 0) {
            warnings.push('No AI providers configured - AI features will be disabled');
        }
        
        return { 
            warnings,
            configured,
            total: providers.length
        };
    }
    
    /**
     * Validate development environment settings
     * @returns {object} Development-specific validation result
     */
    static validateDevelopment() {
        const warnings = [];
        
        // Check for common development issues
        if (process.env.NODE_ENV === 'development') {
            if (process.env.JWT_SECRET === process.env.JWT_SECRET_PROD) {
                warnings.push('Using production JWT_SECRET in development');
            }
            
            if (!process.env.DEBUG) {
                warnings.push('DEBUG not set - consider enabling for development');
            }
        }
        
        return { warnings };
    }
    
    /**
     * Validate all environment settings
     * @returns {object} Complete validation result
     */
    static validateAll() {
        console.log('🔍 Starting comprehensive environment validation...');
        
        const security = this.validateSecurity();
        const aiProviders = this.validateAIProviders();
        const development = this.validateDevelopment();
        
        const result = {
            security,
            aiProviders,
            development,
            overall: {
                isValid: security.isValid,
                hasWarnings: aiProviders.warnings.length > 0 || development.warnings.length > 0,
                summary: {
                    securityErrors: security.errors.length,
                    aiWarnings: aiProviders.warnings.length,
                    devWarnings: development.warnings.length,
                    configuredProviders: aiProviders.configured.length
                }
            }
        };
        
        return result;
    }
    
    /**
     * Display validation results in a formatted way
     * @param {object} result - Validation result from validateAll()
     */
    static displayResults(result) {
        console.log('\n' + '='.repeat(60));
        console.log('🛡️  ENVIRONMENT VALIDATION REPORT');
        console.log('='.repeat(60));
        
        // Security validation results
        if (result.security.isValid) {
            console.log('✅ Security Configuration: PASSED');
        } else {
            console.log('❌ Security Configuration: FAILED');
            result.security.errors.forEach(error => {
                console.error(`   ❌ ${error}`);
            });
        }
        
        // AI providers results
        console.log(`\n🤖 AI Providers: ${result.aiProviders.configured.length}/${result.aiProviders.total} configured`);
        if (result.aiProviders.configured.length > 0) {
            result.aiProviders.configured.forEach(provider => {
                console.log(`   ✅ ${provider}`);
            });
        }
        if (result.aiProviders.warnings.length > 0) {
            result.aiProviders.warnings.forEach(warning => {
                console.warn(`   ⚠️  ${warning}`);
            });
        }
        
        // Development warnings
        if (result.development.warnings.length > 0) {
            console.log('\n⚠️  Development Warnings:');
            result.development.warnings.forEach(warning => {
                console.warn(`   ⚠️  ${warning}`);
            });
        }
        
        console.log('\n' + '='.repeat(60));
        
        if (result.overall.isValid) {
            console.log('🚀 Environment validation PASSED - Safe to start server');
        } else {
            console.log('🚨 Environment validation FAILED - Server startup blocked');
            console.log('   Fix the errors above before starting the server');
        }
        
        console.log('='.repeat(60) + '\n');
    }
    
    /**
     * Quick validation check for startup
     * @returns {boolean} True if environment is valid for startup
     */
    static quickCheck() {
        const result = this.validateSecurity();
        if (!result.isValid) {
            console.error('🚨 CRITICAL: Environment validation failed!');
            result.errors.forEach(error => {
                console.error(`  ❌ ${error}`);
            });
            return false;
        }
        return true;
    }
}

module.exports = EnvironmentValidator;