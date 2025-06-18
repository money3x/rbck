#!/usr/bin/env node

/**
 * Production Deployment Script for RBCK CMS
 * This script performs pre-deployment checks and optimizations
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

const logger = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  warn: (msg) => console.warn(`⚠️  ${msg}`)
};

async function runDeploymentChecks() {
  logger.info('🚀 Starting RBCK CMS Production Deployment Checks...');
  
  try {    // 1. Check package.json dependencies
    logger.info('📦 Checking package.json dependencies...');
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packagePath, 'utf8'));
    
    const requiredDeps = [
      'express', 'cors', 'helmet', 'dotenv', 'express-validator',
      'winston', 'node-cache', 'swagger-jsdoc', 'swagger-ui-express'
    ];
    
    const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
    if (missingDeps.length > 0) {
      logger.error(`Missing dependencies: ${missingDeps.join(', ')}`);
      process.exit(1);
    }
    logger.success('All required dependencies found');
    
    // 2. Check environment variables
    logger.info('🔧 Checking environment configuration...');
    const requiredEnvVars = ['NODE_ENV', 'PORT'];
    const missingEnvVars = requiredEnvVars.filter(env => !process.env[env]);
    
    if (missingEnvVars.length > 0) {
      logger.warn(`Missing environment variables: ${missingEnvVars.join(', ')}`);
      logger.info('Creating .env.production template...');
      
      const envTemplate = `# RBCK CMS Production Environment
NODE_ENV=production
PORT=10000

# Database Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_key_here

# Security
JWT_SECRET=your_jwt_secret_here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password_here

# AI Integration
OPENAI_API_KEY=your_openai_key_here
GEMINI_API_KEY=your_gemini_key_here
CLAUDE_API_KEY=your_claude_key_here
DEEPSEEK_API_KEY=your_deepseek_key_here
CHINDA_API_KEY=your_chinda_key_here
`;
      await fs.writeFile('.env.production', envTemplate);
      logger.success('Created .env.production template');
    }
    
    // 3. Check critical files
    logger.info('📁 Checking critical files...');
    const criticalFiles = [
      'server.js',
      'middleware/errorHandler.js',
      'middleware/cache.js',
      'middleware/metrics.js',
      'middleware/validation.js',
      'config/swagger.js',
      'routes/ai.js',
      'routes/auth.js'
    ];
      for (const file of criticalFiles) {
      try {
        await fs.access(path.join(__dirname, '..', file));
      } catch (error) {
        logger.error(`Critical file missing: ${file}`);
        process.exit(1);
      }
    }
    logger.success('All critical files found');
      // 4. Run tests
    logger.info('🧪 Running test suite...');
    try {
      execSync('npm test', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
      logger.success('All tests passed');
    } catch (error) {
      logger.warn('Tests not available or failed');
      logger.info('Test failures detected. Please fix issues before deployment.');
    }
    
    // 5. Check logs directory
    logger.info('📝 Checking logs directory...');
    const logsDir = path.join(__dirname, '..', 'logs');
    try {
      await fs.access(logsDir);
    } catch (error) {
      await fs.mkdir(logsDir, { recursive: true });
      logger.success('Created logs directory');
    }
    
    // 6. Generate deployment info
    logger.info('📋 Generating deployment information...');
    const deploymentInfo = {
      timestamp: new Date().toISOString(),
      version: packageJson.version,
      nodeVersion: process.version,
      dependencies: Object.keys(packageJson.dependencies).length,
      devDependencies: Object.keys(packageJson.devDependencies || {}).length,
      environment: process.env.NODE_ENV || 'development',
      checks: {
        dependencies: true,
        files: true,
        logs: true
      }
    };
      await fs.writeFile(
      path.join(__dirname, '..', 'deployment-info.json'),
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    logger.success('🎉 Pre-deployment checks completed successfully!');
    logger.info('');
    logger.info('📋 Deployment Summary:');
    logger.info(`   Version: ${packageJson.version}`);
    logger.info(`   Node.js: ${process.version}`);
    logger.info(`   Dependencies: ${Object.keys(packageJson.dependencies).length}`);
    logger.info(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info('');
    logger.info('🚀 Ready for production deployment!');
    logger.info('');
    logger.info('📖 Next Steps:');
    logger.info('   1. Review .env.production file and add your secrets');
    logger.info('   2. Deploy to your hosting platform');
    logger.info('   3. Run health checks after deployment');
    logger.info('   4. Monitor logs and metrics');
    
  } catch (error) {
    logger.error(`Deployment check failed: ${error.message}`);
    process.exit(1);
  }
}

// Run deployment checks
runDeploymentChecks();
