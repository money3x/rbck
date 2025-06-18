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

module.exports = { checkHealth };
