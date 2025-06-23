/**
 * Environment Variable Validation Script
 * Comprehensive validation for production readiness
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

class EnvironmentValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.validationResults = {};
    }

    /**
     * Validate required environment variables
     */
    validateRequired() {
        console.log('🔍 [ENV VALIDATOR] Checking required environment variables...');

        const requiredVars = [
            'SUPABASE_URL',
            'SUPABASE_SERVICE_KEY',
            'JWT_SECRET',
            'ADMIN_USERNAME',
            'ADMIN_PASSWORD'
        ];

        requiredVars.forEach(varName => {
            const value = process.env[varName];
            if (!value) {
                this.errors.push(`${varName} is required but not set`);
            } else if (this.isDefaultValue(varName, value)) {
                this.errors.push(`${varName} is using default/placeholder value`);
            } else {
                this.validationResults[varName] = '✅ Valid';
            }
        });
    }

    /**
     * Validate AI provider environment variables
     */
    validateAIProviders() {
        console.log('🤖 [ENV VALIDATOR] Checking AI provider configurations...');

        const aiProviders = {
            GEMINI: ['GEMINI_API_KEY'],
            OPENAI: ['OPENAI_API_KEY'],
            CLAUDE: ['CLAUDE_API_KEY'],
            DEEPSEEK: ['DEEPSEEK_API_KEY'],
            CHINDA: ['CHINDA_API_KEY', 'CHINDA_JWT_TOKEN']
        };

        let enabledProviders = 0;

        Object.entries(aiProviders).forEach(([provider, requiredVars]) => {
            const hasAllVars = requiredVars.every(varName => {
                const value = process.env[varName];
                return value && !this.isDefaultValue(varName, value);
            });

            if (hasAllVars) {
                enabledProviders++;
                this.validationResults[`${provider}_PROVIDER`] = '✅ Configured';
            } else {
                this.warnings.push(`${provider} provider not configured (optional)`);
                this.validationResults[`${provider}_PROVIDER`] = '⚠️ Missing';
            }
        });

        if (enabledProviders === 0) {
            this.errors.push('No AI providers are configured. At least one AI provider is required for E-A-T optimization');
        } else {
            this.validationResults['AI_PROVIDERS_COUNT'] = `✅ ${enabledProviders} configured`;
        }
    }

    /**
     * Validate production-specific settings
     */
    validateProduction() {
        console.log('🏭 [ENV VALIDATOR] Checking production-specific settings...');

        const nodeEnv = process.env.NODE_ENV;
        
        if (nodeEnv === 'production') {
            // Check security settings
            if (!process.env.CORS_ORIGIN || process.env.CORS_ORIGIN === '*') {
                this.warnings.push('CORS_ORIGIN should be set to specific domain in production');
            }

            // Check SSL/HTTPS settings
            if (!process.env.FRONTEND_URL?.startsWith('https://')) {
                this.warnings.push('FRONTEND_URL should use HTTPS in production');
            }

            // Check logging level
            if (process.env.LOG_LEVEL === 'debug') {
                this.warnings.push('LOG_LEVEL=debug may impact performance in production');
            }

            this.validationResults['PRODUCTION_SECURITY'] = this.warnings.length === 0 ? '✅ Secure' : '⚠️ Needs attention';
        } else {
            this.validationResults['ENVIRONMENT'] = `📝 ${nodeEnv || 'development'}`;
        }
    }

    /**
     * Validate database configuration
     */
    validateDatabase() {
        console.log('🗄️ [ENV VALIDATOR] Checking database configuration...');

        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

        if (supabaseUrl && supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.co')) {
            this.validationResults['SUPABASE_URL'] = '✅ Valid format';
        } else if (supabaseUrl) {
            this.errors.push('SUPABASE_URL format appears invalid');
        }

        if (supabaseKey && supabaseKey.length > 100) {
            this.validationResults['SUPABASE_KEY'] = '✅ Appears valid';
        } else if (supabaseKey) {
            this.warnings.push('SUPABASE_SERVICE_KEY appears too short');
        }
    }

    /**
     * Validate security configuration
     */
    validateSecurity() {
        console.log('🔐 [ENV VALIDATOR] Checking security configuration...');

        const jwtSecret = process.env.JWT_SECRET;
        
        if (jwtSecret) {
            if (jwtSecret.length < 32) {
                this.errors.push('JWT_SECRET should be at least 32 characters long');
            } else {
                this.validationResults['JWT_SECRET'] = '✅ Strong';
            }
        }

        const adminPassword = process.env.ADMIN_PASSWORD;
        
        if (adminPassword) {
            if (adminPassword.length < 8) {
                this.errors.push('ADMIN_PASSWORD should be at least 8 characters long');
            } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(adminPassword)) {
                this.warnings.push('ADMIN_PASSWORD should include uppercase, lowercase, and numbers');
            } else {
                this.validationResults['ADMIN_PASSWORD'] = '✅ Strong';
            }
        }
    }

    /**
     * Check if value is a default/placeholder value
     */
    isDefaultValue(varName, value) {
        const defaults = {
            'JWT_SECRET': ['your-default-jwt-secret-change-this', 'change-this-secret', 'default-secret'],
            'ADMIN_PASSWORD': ['change-this-password', 'admin', 'password', '123456'],
            'SUPABASE_URL': ['your-supabase-url', 'placeholder'],
            'SUPABASE_SERVICE_KEY': ['your-service-key', 'placeholder']
        };

        return defaults[varName]?.includes(value) || false;
    }

    /**
     * Run comprehensive validation
     */
    async validate() {
        console.log('🚀 [ENV VALIDATOR] Starting comprehensive environment validation...\n');

        this.validateRequired();
        this.validateAIProviders();
        this.validateDatabase();
        this.validateSecurity();
        this.validateProduction();

        return this.generateReport();
    }

    /**
     * Generate validation report
     */
    generateReport() {
        console.log('\n📊 [ENV VALIDATOR] Validation Report:');
        console.log('═'.repeat(60));

        // Show validation results
        console.log('\n📋 Configuration Status:');
        Object.entries(this.validationResults).forEach(([key, status]) => {
            console.log(`  ${key.padEnd(25)} ${status}`);
        });

        // Show errors
        if (this.errors.length > 0) {
            console.log('\n❌ Critical Issues:');
            this.errors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error}`);
            });
        }

        // Show warnings
        if (this.warnings.length > 0) {
            console.log('\n⚠️  Warnings:');
            this.warnings.forEach((warning, index) => {
                console.log(`  ${index + 1}. ${warning}`);
            });
        }

        // Final status
        const isValid = this.errors.length === 0;
        const statusMessage = isValid ? 
            '✅ Environment validation passed!' : 
            `❌ Environment validation failed with ${this.errors.length} critical issues.`;

        console.log('\n' + '═'.repeat(60));
        console.log(statusMessage);

        if (!isValid && process.env.NODE_ENV === 'production') {
            console.log('\n🚨 Production deployment blocked due to critical issues.');
            process.exit(1);
        }

        return {
            isValid,
            errors: this.errors,
            warnings: this.warnings,
            results: this.validationResults
        };
    }
}

// Export for use in other modules
module.exports = EnvironmentValidator;

// Run validation if this file is executed directly
if (require.main === module) {
    const validator = new EnvironmentValidator();
    validator.validate();
}
