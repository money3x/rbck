const fs = require('fs');
const path = require('path');
const winston = require('winston');

class MigrationServiceHTTP {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    // Try multiple possible environment variable names
    this.serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                         process.env.SUPABASE_SERVICE_KEY || 
                         process.env.SUPABASE_KEY ||
                         process.env.SUPABASE_DB_PASSWORD;
    
    if (!this.supabaseUrl || !this.serviceRoleKey) {
      throw new Error('Missing Supabase configuration: SUPABASE_URL and service role key required');
    }
  }

  // Execute SQL via Supabase REST API
  async executeSQL(sql) {
    try {
      const response = await fetch(`${this.supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.serviceRoleKey}`,
          'apikey': this.serviceRoleKey
        },
        body: JSON.stringify({ sql })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`SQL execution failed: ${error.message}`);
    }
  }

  // Create a function in Supabase to execute SQL
  async createSQLExecutorFunction() {
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION exec_sql(sql text)
      RETURNS json AS $$
      DECLARE
        result json;
      BEGIN
        EXECUTE sql;
        GET DIAGNOSTICS result = ROW_COUNT;
        RETURN json_build_object('success', true, 'rows_affected', result);
      EXCEPTION WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    try {
      return await this.executeSQL(createFunctionSQL);
    } catch (error) {
      winston.warn('Could not create SQL executor function:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Test connection via HTTP API
  async testConnection() {
    try {
      // Test basic API connectivity
      const response = await fetch(`${this.supabaseUrl}/rest/v1/`, {
        headers: {
          'Authorization': `Bearer ${this.serviceRoleKey}`,
          'apikey': this.serviceRoleKey
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Test SQL execution capability
      const testQuery = 'SELECT NOW() as current_time, version() as pg_version';
      
      try {
        const sqlResult = await this.executeSQL(testQuery);
        
        return {
          success: true,
          message: 'HTTP API connection successful',
          method: 'Supabase REST API',
          timestamp: new Date().toISOString(),
          sqlCapability: true,
          testResult: sqlResult
        };
      } catch (sqlError) {
        // API works but SQL execution might need setup
        return {
          success: true,
          message: 'HTTP API connection successful, SQL execution needs setup',
          method: 'Supabase REST API',
          timestamp: new Date().toISOString(),
          sqlCapability: false,
          sqlError: sqlError.message,
          recommendation: 'Create SQL executor function in Supabase'
        };
      }

    } catch (error) {
      return {
        success: false,
        error: error.message,
        config: {
          url: this.supabaseUrl,
          hasServiceKey: !!this.serviceRoleKey
        }
      };
    }
  }

  // Execute individual table creation using Supabase client methods
  async createTablesViAPI() {
    const results = [];
    
    // Tables to create (simplified approach)
    const tables = [
      {
        name: 'users',
        sql: `CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          username VARCHAR(100) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          first_name VARCHAR(100),
          last_name VARCHAR(100),
          role VARCHAR(50) DEFAULT 'user',
          avatar_url TEXT,
          is_active BOOLEAN DEFAULT true,
          email_verified BOOLEAN DEFAULT false,
          last_login TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`
      },
      {
        name: 'categories',
        sql: `CREATE TABLE IF NOT EXISTS categories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) UNIQUE NOT NULL,
          slug VARCHAR(100) UNIQUE NOT NULL,
          description TEXT,
          color VARCHAR(7),
          icon VARCHAR(50),
          parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
          sort_order INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`
      },
      {
        name: 'tags',
        sql: `CREATE TABLE IF NOT EXISTS tags (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) UNIQUE NOT NULL,
          slug VARCHAR(100) UNIQUE NOT NULL,
          color VARCHAR(7),
          usage_count INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`
      },
      {
        name: 'post_tags',
        sql: `CREATE TABLE IF NOT EXISTS post_tags (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
          tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(post_id, tag_id)
        )`
      },
      {
        name: 'ai_requests',
        sql: `CREATE TABLE IF NOT EXISTS ai_requests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          provider VARCHAR(50) NOT NULL,
          request_type VARCHAR(50) NOT NULL,
          prompt TEXT NOT NULL,
          response TEXT,
          model_used VARCHAR(100),
          temperature DECIMAL(3,2),
          max_tokens INTEGER,
          tokens_used INTEGER,
          response_time_ms INTEGER,
          success BOOLEAN DEFAULT false,
          error_message TEXT,
          estimated_cost DECIMAL(10,6),
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`
      },
      {
        name: 'ai_swarm_logs',
        sql: `CREATE TABLE IF NOT EXISTS ai_swarm_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          request_id UUID REFERENCES ai_requests(id) ON DELETE CASCADE,
          topic_analysis JSONB,
          roles_assigned JSONB,
          expert_responses JSONB,
          critic_review TEXT,
          final_synthesis TEXT,
          confidence_score DECIMAL(3,2),
          processing_time_ms INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`
      },
      {
        name: 'settings',
        sql: `CREATE TABLE IF NOT EXISTS settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          key VARCHAR(100) UNIQUE NOT NULL,
          value TEXT,
          type VARCHAR(20) DEFAULT 'string',
          description TEXT,
          is_public BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`
      },
      {
        name: 'migrations',
        sql: `CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          filename VARCHAR(255) UNIQUE NOT NULL,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`
      }
    ];

    let successCount = 0;
    let errorCount = 0;

    for (const table of tables) {
      try {
        winston.info(`🔧 Creating table: ${table.name}`);
        
        const result = await this.executeSQL(table.sql);
        
        results.push({
          table: table.name,
          success: true,
          result: result
        });
        
        successCount++;
        winston.info(`✅ Table ${table.name} created successfully`);
        
      } catch (error) {
        winston.error(`❌ Failed to create table ${table.name}: ${error.message}`);
        
        results.push({
          table: table.name,
          success: false,
          error: error.message
        });
        
        errorCount++;
      }
    }

    return {
      success: errorCount === 0,
      message: `Table creation completed: ${successCount} successful, ${errorCount} errors`,
      statistics: {
        totalTables: tables.length,
        successfulTables: successCount,
        errorTables: errorCount
      },
      results: results
    };
  }

  // Extend posts table with new columns
  async extendPostsTable() {
    const alterStatements = [
      'ALTER TABLE posts ADD COLUMN IF NOT EXISTS featured_image_url TEXT',
      'ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES users(id) ON DELETE CASCADE',
      'ALTER TABLE posts ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL',
      'ALTER TABLE posts ADD COLUMN IF NOT EXISTS generated_by_ai BOOLEAN DEFAULT false',
      'ALTER TABLE posts ADD COLUMN IF NOT EXISTS ai_provider VARCHAR(50)',
      'ALTER TABLE posts ADD COLUMN IF NOT EXISTS ai_prompt TEXT',
      'ALTER TABLE posts ADD COLUMN IF NOT EXISTS ai_confidence_score DECIMAL(3,2)',
      'ALTER TABLE posts ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0',
      'ALTER TABLE posts ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0',
      'ALTER TABLE posts ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE'
    ];

    const results = [];
    let successCount = 0;

    for (const statement of alterStatements) {
      try {
        const result = await this.executeSQL(statement);
        results.push({ statement, success: true, result });
        successCount++;
      } catch (error) {
        results.push({ statement, success: false, error: error.message });
      }
    }

    return {
      success: successCount > 0,
      message: `Posts table extension: ${successCount}/${alterStatements.length} successful`,
      results: results
    };
  }

  // Execute complete migration via HTTP API
  async executeMigration() {
    const startTime = Date.now();
    
    try {
      winston.info('🚀 Starting HTTP API migration...');
      
      // Step 1: Test connection
      const connectionTest = await this.testConnection();
      if (!connectionTest.success) {
        throw new Error(`Connection failed: ${connectionTest.error}`);
      }
      
      winston.info('✅ HTTP API connection successful');
      
      // Step 2: Create SQL executor function if needed
      if (!connectionTest.sqlCapability) {
        winston.info('🔧 Setting up SQL execution capability...');
        await this.createSQLExecutorFunction();
      }
      
      // Step 3: Create tables
      winston.info('🏗️ Creating database tables...');
      const tableResults = await this.createTablesViAPI();
      
      // Step 4: Extend posts table
      winston.info('📊 Extending posts table...');
      const postsResults = await this.extendPostsTable();
      
      const duration = Date.now() - startTime;
      
      return {
        success: tableResults.success && postsResults.success,
        message: 'HTTP API migration completed',
        duration: `${duration}ms`,
        method: 'Supabase REST API',
        statistics: {
          ...tableResults.statistics,
          postsExtension: postsResults.success
        },
        results: {
          tables: tableResults.results,
          postsExtension: postsResults.results
        }
      };
      
    } catch (error) {
      winston.error('❌ HTTP API migration failed:', error.message);
      
      return {
        success: false,
        error: error.message,
        duration: `${Date.now() - startTime}ms`,
        method: 'Supabase REST API'
      };
    }
  }
}

module.exports = new MigrationServiceHTTP();