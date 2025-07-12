const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const winston = require('winston');

class MigrationServiceAlt {
  constructor() {
    // Alternative connection methods for network issues
    this.connectionConfigs = [
      // Config 1: Direct connection with IPv4 force
      {
        name: 'Direct IPv4',
        host: 'db.yfituqryipsdmqyjxpon.supabase.co',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: process.env.SUPABASE_DB_PASSWORD || process.env.SUPABASE_SERVICE_ROLE_KEY,
        ssl: { rejectUnauthorized: false, require: true },
        family: 4,
        connectionTimeoutMillis: 30000
      },
      // Config 2: Try alternative port (some providers use 6543)
      {
        name: 'Alternative Port',
        host: 'db.yfituqryipsdmqyjxpon.supabase.co',
        port: 6543,
        database: 'postgres',
        user: 'postgres',
        password: process.env.SUPABASE_DB_PASSWORD || process.env.SUPABASE_SERVICE_ROLE_KEY,
        ssl: { rejectUnauthorized: false, require: true },
        family: 4,
        connectionTimeoutMillis: 30000
      },
      // Config 3: Try without SSL requirement
      {
        name: 'No SSL Requirement',
        host: 'db.yfituqryipsdmqyjxpon.supabase.co',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: process.env.SUPABASE_DB_PASSWORD || process.env.SUPABASE_SERVICE_ROLE_KEY,
        ssl: { rejectUnauthorized: false },
        family: 4,
        connectionTimeoutMillis: 30000
      },
      // Config 4: Use connection string if available
      {
        name: 'Connection String',
        connectionString: process.env.SUPABASE_CONNECTION_STRING,
        ssl: { rejectUnauthorized: false }
      }
    ];
  }

  // Try multiple connection methods
  async getConnection() {
    for (const config of this.connectionConfigs) {
      if (config.name === 'Connection String' && !config.connectionString) {
        continue; // Skip if no connection string
      }
      
      try {
        winston.info(`🔄 Trying connection method: ${config.name}`);
        
        const client = new Client(config);
        await client.connect();
        
        winston.info(`✅ Connected using: ${config.name}`);
        return { client, method: config.name };
        
      } catch (error) {
        winston.warn(`❌ Connection method '${config.name}' failed: ${error.message}`);
        continue;
      }
    }
    
    throw new Error('All connection methods failed');
  }

  // Test connection with multiple methods
  async testConnection() {
    try {
      const { client, method } = await this.getConnection();
      
      const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
      await client.end();
      
      return {
        success: true,
        message: `Database connection successful using ${method}`,
        method: method,
        timestamp: result.rows[0].current_time,
        version: result.rows[0].pg_version
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        configs: this.connectionConfigs.map(c => ({
          name: c.name,
          host: c.host,
          port: c.port,
          hasPassword: !!c.password,
          hasConnectionString: !!c.connectionString
        }))
      };
    }
  }

  // Execute SQL file with connection retry
  async executeSQLFile(filePath) {
    const startTime = Date.now();
    let client;
    
    try {
      winston.info(`🚀 Starting migration from file: ${filePath}`);
      
      // Read SQL file
      if (!fs.existsSync(filePath)) {
        throw new Error(`SQL file not found: ${filePath}`);
      }
      
      const sqlContent = fs.readFileSync(filePath, 'utf8');
      winston.info(`📄 SQL file loaded: ${sqlContent.length} characters`);
      
      // Connect to database with retry
      const { client: dbClient, method } = await this.getConnection();
      client = dbClient;
      winston.info(`🔌 Connected to database using: ${method}`);
      
      // Split SQL into statements
      const statements = this.splitSQLStatements(sqlContent);
      winston.info(`📋 Found ${statements.length} SQL statements`);
      
      const results = [];
      let successCount = 0;
      let errorCount = 0;
      
      // Execute each statement
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        const trimmedStatement = statement.trim();
        
        if (trimmedStatement.length === 0) continue;
        
        try {
          winston.debug(`🔧 Executing statement ${i + 1}/${statements.length}`);
          
          const result = await client.query(trimmedStatement);
          
          results.push({
            statement: i + 1,
            success: true,
            affectedRows: result.rowCount || 0,
            command: result.command || 'Unknown'
          });
          
          successCount++;
          winston.debug(`✅ Statement ${i + 1} executed successfully`);
          
        } catch (error) {
          winston.error(`❌ Statement ${i + 1} failed: ${error.message}`);
          
          const isNonCritical = this.isNonCriticalError(error.message);
          
          results.push({
            statement: i + 1,
            success: false,
            error: error.message,
            sql: trimmedStatement.substring(0, 200),
            critical: !isNonCritical
          });
          
          if (!isNonCritical) {
            errorCount++;
          }
        }
      }
      
      const duration = Date.now() - startTime;
      
      winston.info(`🎉 Migration completed in ${duration}ms`);
      winston.info(`✅ Success: ${successCount}, ❌ Errors: ${errorCount}`);
      
      return {
        success: errorCount === 0,
        message: `Migration completed: ${successCount} successful, ${errorCount} errors`,
        duration: `${duration}ms`,
        connectionMethod: method,
        statistics: {
          totalStatements: statements.length,
          successfulStatements: successCount,
          errorStatements: errorCount,
          nonCriticalErrors: results.filter(r => !r.success && !r.critical).length
        },
        results: results
      };
      
    } catch (error) {
      winston.error('❌ Migration failed:', error.message);
      
      return {
        success: false,
        error: error.message,
        duration: `${Date.now() - startTime}ms`,
        results: []
      };
      
    } finally {
      if (client) {
        await client.end();
        winston.info('🔌 Database connection closed');
      }
    }
  }

  // Split SQL content into individual statements
  splitSQLStatements(sqlContent) {
    // Remove SQL comments
    const cleanedSQL = sqlContent
      .replace(/--.*$/gm, '') // Remove single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments
    
    // Split by semicolon but preserve semicolons inside quoted strings
    const statements = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    
    for (let i = 0; i < cleanedSQL.length; i++) {
      const char = cleanedSQL[i];
      const prevChar = i > 0 ? cleanedSQL[i - 1] : '';
      
      if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (!inQuotes) {
          inQuotes = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          inQuotes = false;
          quoteChar = '';
        }
      }
      
      if (char === ';' && !inQuotes) {
        const statement = current.trim();
        if (statement.length > 0) {
          statements.push(statement);
        }
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add the last statement if it doesn't end with semicolon
    const finalStatement = current.trim();
    if (finalStatement.length > 0) {
      statements.push(finalStatement);
    }
    
    return statements;
  }

  // Check if error is non-critical
  isNonCriticalError(errorMessage) {
    const nonCriticalPatterns = [
      /already exists/i,
      /duplicate/i,
      /relation.*already exists/i,
      /table.*already exists/i,
      /index.*already exists/i,
      /function.*already exists/i,
      /trigger.*already exists/i,
      /constraint.*already exists/i,
      /extension.*already exists/i,
      /role.*already exists/i,
      /policy.*already exists/i,
      /on conflict.*do nothing/i
    ];
    
    return nonCriticalPatterns.some(pattern => pattern.test(errorMessage));
  }
}

module.exports = new MigrationServiceAlt();