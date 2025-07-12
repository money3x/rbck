const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const winston = require('winston');

class MigrationService {
  constructor() {
    // Handle different connection formats
    const getDbHost = () => {
      if (process.env.SUPABASE_DB_HOST) {
        return process.env.SUPABASE_DB_HOST;
      }
      // Extract from SUPABASE_URL if available
      if (process.env.SUPABASE_URL) {
        const url = process.env.SUPABASE_URL.replace('https://', '');
        const projectId = url.split('.')[0];
        return `db.${projectId}.supabase.co`;
      }
      return 'db.yfituqryipsdmqyjxpon.supabase.co';
    };

    this.dbConfig = {
      host: getDbHost(),
      port: process.env.SUPABASE_DB_PORT || 5432,
      database: process.env.SUPABASE_DB_NAME || 'postgres',
      user: process.env.SUPABASE_DB_USER || 'postgres',
      password: process.env.SUPABASE_DB_PASSWORD || process.env.SUPABASE_SERVICE_ROLE_KEY,
      ssl: { rejectUnauthorized: false }
    };
  }

  // Get database connection
  async getConnection() {
    const client = new Client(this.dbConfig);
    await client.connect();
    return client;
  }

  // Execute SQL file
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
      
      // Connect to database
      client = await this.getConnection();
      winston.info('🔌 Connected to database');
      
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
          winston.debug(`SQL: ${trimmedStatement.substring(0, 100)}...`);
          
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
          
          // Check if it's a non-critical error (like table already exists)
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
          
          // Continue execution for non-critical errors
          if (!isNonCritical) {
            winston.warn(`⚠️ Non-critical error, continuing migration...`);
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

  // Check if error is non-critical (like table already exists)
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

  // Execute single SQL statement
  async executeSingleSQL(sql) {
    let client;
    
    try {
      client = await this.getConnection();
      const result = await client.query(sql);
      
      return {
        success: true,
        result: result.rows,
        affectedRows: result.rowCount,
        command: result.command
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
      
    } finally {
      if (client) {
        await client.end();
      }
    }
  }

  // Test database connection
  async testConnection() {
    let client;
    
    try {
      client = await this.getConnection();
      const result = await client.query('SELECT NOW() as current_time');
      
      return {
        success: true,
        message: 'Database connection successful',
        timestamp: result.rows[0].current_time
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        config: {
          host: this.dbConfig.host,
          port: this.dbConfig.port,
          database: this.dbConfig.database,
          user: this.dbConfig.user,
          ssl: this.dbConfig.ssl
        }
      };
      
    } finally {
      if (client) {
        await client.end();
      }
    }
  }

  // Get database schema information
  async getSchemaInfo() {
    let client;
    
    try {
      client = await this.getConnection();
      
      // Get all tables
      const tablesResult = await client.query(`
        SELECT table_name, table_schema 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      
      // Get all columns
      const columnsResult = await client.query(`
        SELECT table_name, column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        ORDER BY table_name, ordinal_position
      `);
      
      // Get all indexes
      const indexesResult = await client.query(`
        SELECT schemaname, tablename, indexname, indexdef 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        ORDER BY tablename, indexname
      `);
      
      return {
        success: true,
        tables: tablesResult.rows,
        columns: columnsResult.rows,
        indexes: indexesResult.rows,
        totalTables: tablesResult.rows.length,
        totalColumns: columnsResult.rows.length,
        totalIndexes: indexesResult.rows.length
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
      
    } finally {
      if (client) {
        await client.end();
      }
    }
  }
}

module.exports = new MigrationService();