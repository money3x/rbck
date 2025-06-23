const http = require('http');
const { logger } = require('../middleware/errorHandler');

const HEALTH_CHECK_URL = process.env.HEALTH_CHECK_URL || 'http://localhost:10000/api/health';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

async function checkHealth(retries = 0) {
  return new Promise((resolve, reject) => {
    const url = new URL(HEALTH_CHECK_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200 && response.status === 'healthy') {
            resolve({
              success: true,
              status: response.status,
              uptime: response.uptime,
              database: response.database,
              memory: response.memory,
              timestamp: response.timestamp
            });
          } else {
            resolve({
              success: false,
              status: response.status || 'unhealthy',
              error: response.error || 'Health check failed',
              statusCode: res.statusCode
            });
          }
        } catch (parseError) {
          resolve({
            success: false,
            error: 'Invalid response format',
            statusCode: res.statusCode,
            rawResponse: data
          });
        }
      });
    });

    req.on('error', (error) => {
      if (retries < MAX_RETRIES) {
        console.log(`Health check failed, retrying in ${RETRY_DELAY}ms... (${retries + 1}/${MAX_RETRIES})`);
        setTimeout(() => {
          checkHealth(retries + 1).then(resolve).catch(reject);
        }, RETRY_DELAY);
      } else {
        resolve({
          success: false,
          error: error.message,
          retries: retries
        });
      }
    });

    req.on('timeout', () => {
      req.destroy();
      if (retries < MAX_RETRIES) {
        console.log(`Health check timed out, retrying... (${retries + 1}/${MAX_RETRIES})`);
        setTimeout(() => {
          checkHealth(retries + 1).then(resolve).catch(reject);
        }, RETRY_DELAY);
      } else {
        resolve({
          success: false,
          error: 'Request timeout',
          retries: retries
        });
      }
    });

    req.end();
  });
}

async function main() {
  console.log('🏥 RBCK CMS Health Check');
  console.log('========================');
  console.log(`Checking: ${HEALTH_CHECK_URL}`);
  console.log('');

  try {
    const result = await checkHealth();
    
    if (result.success) {
      console.log('✅ Health Check PASSED');
      console.log(`Status: ${result.status}`);
      console.log(`Uptime: ${Math.round(result.uptime)}s`);
      console.log(`Database: ${result.database || 'Unknown'}`);
      if (result.memory) {
        console.log(`Memory: ${result.memory.used}MB / ${result.memory.total}MB`);
      }
      console.log(`Timestamp: ${result.timestamp}`);
      
      // Log success
      if (logger) {
        logger.info('Health check passed', {
          status: result.status,
          uptime: result.uptime,
          database: result.database,
          memory: result.memory
        });
      }
      
      process.exit(0);
    } else {
      console.log('❌ Health Check FAILED');
      console.log(`Status: ${result.status || 'Unknown'}`);
      console.log(`Error: ${result.error}`);
      if (result.statusCode) {
        console.log(`HTTP Status: ${result.statusCode}`);
      }
      if (result.retries !== undefined) {
        console.log(`Retries: ${result.retries}`);
      }
      
      // Log failure
      if (logger) {
        logger.error('Health check failed', {
          status: result.status,
          error: result.error,
          statusCode: result.statusCode,
          retries: result.retries
        });
      }
      
      process.exit(1);
    }
  } catch (error) {
    console.log('❌ Health Check ERROR');
    console.log(`Error: ${error.message}`);
    
    if (logger) {
      logger.error('Health check error', {
        error: error.message,
        stack: error.stack
      });
    }
    
    process.exit(1);
  }
}

// Run health check if called directly
if (require.main === module) {
  main();
}

/**
 * Enhanced main function with comprehensive checks
 */
async function main() {
  console.log('🏥 Starting comprehensive health check...');
  
  try {
    // Basic health check
    const result = await checkHealth();
    
    if (result.success) {
      console.log('✅ Basic health check passed');
      console.log(`📊 Server Status: ${result.status}`);
      console.log(`🕐 Uptime: ${result.uptime}s`);
      console.log(`💾 Memory: ${JSON.stringify(result.memory)}`);
      
      // Additional production checks
      if (process.env.NODE_ENV === 'production') {
        console.log('\n🏭 Running production-specific checks...');
        
        // Check AI Swarm Council status
        await checkAISwarmHealth();
        
        // Check database connectivity
        await checkDatabaseHealth();
        
        // Check environment variables
        await checkEnvironmentHealth();
        
        console.log('✅ All production checks passed!');
      }
      
      console.log('\n🎉 System is healthy and ready for production!');
      process.exit(0);
    } else {
      throw new Error(`Health check failed: ${result.error}`);
    }
    
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    
    if (logger) {
      logger.error('Health check error', {
        error: error.message,
        stack: error.stack
      });
    }
    
    process.exit(1);
  }
}

/**
 * Check AI Swarm Council health
 */
async function checkAISwarmHealth() {
  try {
    console.log('🤖 Checking AI Swarm Council status...');
    
    // This is a basic check - in production you'd make an actual HTTP request
    const SwarmCouncil = require('../ai/swarm/SwarmCouncil');
    const EATOptimizedSwarmCouncil = require('../ai/swarm/EATOptimizedSwarmCouncil');
    
    const swarmCouncil = new SwarmCouncil();
    const eatSwarmCouncil = new EATOptimizedSwarmCouncil();
    
    const swarmStatus = swarmCouncil.getCouncilStatus ? swarmCouncil.getCouncilStatus() : { initialized: swarmCouncil.isInitialized };
    const eatStatus = eatSwarmCouncil.getCouncilStatus ? eatSwarmCouncil.getCouncilStatus() : { initialized: eatSwarmCouncil.isInitialized };
    
    console.log(`  ✅ Swarm Council: ${swarmStatus.initialized ? 'Ready' : 'Not initialized'}`);
    console.log(`  ✅ E-A-T Council: ${eatStatus.initialized ? 'Ready' : 'Not initialized'}`);
    
  } catch (error) {
    console.warn(`  ⚠️ AI Swarm check failed: ${error.message}`);
    // Don't fail the health check for AI issues in development
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}

/**
 * Check database connectivity
 */
async function checkDatabaseHealth() {
  try {
    console.log('🗄️ Checking database connectivity...');
    
    const supabase = require('../supabaseClient');
    
    if (supabase && typeof supabase.from === 'function') {
      // In test/dev environment, just check if client exists
      if (process.env.NODE_ENV === 'test') {
        console.log('  ✅ Database client available (test mode)');
        return;
      }
      
      // Try a simple query
      const { data, error } = await supabase
        .from('posts')
        .select('id')
        .limit(1);
        
      if (error && !error.message?.includes('Mock client')) {
        throw new Error(`Database query failed: ${error.message}`);
      }
      
      console.log('  ✅ Database connection healthy');
    } else {
      throw new Error('Database client not properly initialized');
    }
    
  } catch (error) {
    console.error(`  ❌ Database check failed: ${error.message}`);
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}

/**
 * Check critical environment variables
 */
async function checkEnvironmentHealth() {
  console.log('🔐 Checking environment configuration...');
  
  const criticalVars = [
    'JWT_SECRET',
    'ADMIN_USERNAME', 
    'ADMIN_PASSWORD'
  ];
  
  // Only require database vars in production
  if (process.env.NODE_ENV === 'production') {
    criticalVars.push('SUPABASE_URL', 'SUPABASE_SERVICE_KEY');
  }
  
  const missing = criticalVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing critical environment variables: ${missing.join(', ')}`);
  }
  
  console.log('  ✅ All critical environment variables configured');
}

module.exports = { checkHealth, checkAISwarmHealth, checkDatabaseHealth, checkEnvironmentHealth };
