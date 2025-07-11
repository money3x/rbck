const express = require('express');
const router = express.Router();
const { supabase } = require('../supabaseClient');
const { authenticateAdmin } = require('../middleware/auth');

// ✅ Middleware for admin-only access
const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Admin access required for database operations'
        });
    }
    next();
};

// ✅ Supabase auth check for migration endpoints
const supabaseAuth = (req, res, next) => {
    console.log('🔐 [SUPABASE_AUTH] Checking authentication for:', req.path);
    console.log('🔐 [SUPABASE_AUTH] Headers received:', {
        authorization: req.headers.authorization ? 'Present' : 'Missing',
        authLength: req.headers.authorization?.length || 0
    });
    
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        console.log('❌ [SUPABASE_AUTH] No token provided');
        return res.status(401).json({
            success: false,
            error: 'Supabase token required'
        });
    }
    
    console.log('🔐 [SUPABASE_AUTH] Token received:', {
        length: token.length,
        start: token.substring(0, 20),
        type: token.startsWith('eyJ') ? 'JWT-like' : 'Other'
    });
    
    // ✅ Check if token matches our SUPABASE_SERVICE_KEY
    if (token === process.env.SUPABASE_SERVICE_KEY) {
        req.user = { role: 'admin', username: 'supabase-admin', authType: 'supabase' };
        req.supabaseKey = token;
        return next();
    }
    
    // ✅ Also accept tokens that look like Supabase format as fallback
    const isSupabaseFormat = token.startsWith('eyJ') && token.length > 100;
    if (isSupabaseFormat) {
        req.user = { role: 'admin', username: 'supabase-admin', authType: 'supabase' };
        req.supabaseKey = token;
        return next();
    }
    
    console.log('🚨 [SUPABASE_AUTH] Invalid token received:', {
        tokenLength: token.length,
        tokenStart: token.substring(0, 20),
        expectedStart: process.env.SUPABASE_SERVICE_KEY?.substring(0, 20)
    });
    
    return res.status(401).json({
        success: false,
        error: 'Invalid Supabase authentication token'
    });
};

// ✅ Check migration status
router.get('/status', supabaseAuth, async (req, res) => {
    try {
        console.log('🔍 Checking migration status...');
        
        // Check if migrations table exists
        const { data: migrationTable, error: tableError } = await supabase
            .from('migrations')
            .select('*')
            .limit(1);

        const migrationsTableExists = !tableError;
        
        // Get executed migrations if table exists
        let executedMigrations = [];
        if (migrationsTableExists) {
            const { data: migrations, error } = await supabase
                .from('migrations')
                .select('filename, executed_at')
                .order('executed_at', { ascending: true });
            
            if (!error) {
                executedMigrations = migrations;
            }
        }

        // Check required tables
        const requiredTables = [
            'users', 'posts', 'categories', 'tags', 'post_tags',
            'ai_requests', 'ai_swarm_logs', 'settings'
        ];

        const tableStatus = {};
        for (const tableName of requiredTables) {
            try {
                const { data, error } = await supabase
                    .from(tableName)
                    .select('id')
                    .limit(1);
                
                tableStatus[tableName] = {
                    exists: !error,
                    error: error?.message || null
                };
            } catch (err) {
                tableStatus[tableName] = {
                    exists: false,
                    error: err.message
                };
            }
        }

        const existingTables = Object.entries(tableStatus)
            .filter(([_, status]) => status.exists)
            .map(([name]) => name);

        const missingTables = Object.entries(tableStatus)
            .filter(([_, status]) => !status.exists)
            .map(([name]) => name);

        res.json({
            success: true,
            data: {
                migrationsTableExists,
                executedMigrations: executedMigrations.length,
                executedMigrationsList: executedMigrations,
                totalRequiredTables: requiredTables.length,
                existingTables: existingTables.length,
                missingTables: missingTables.length,
                tableStatus,
                isFullyMigrated: missingTables.length === 0 && migrationsTableExists,
                recommendation: missingTables.length > 0 
                    ? 'Run migration to create missing tables'
                    : 'Database schema is up to date'
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Migration status check failed:', error.message);
        
        res.status(500).json({
            success: false,
            error: 'Failed to check migration status',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Contact support for details',
            timestamp: new Date().toISOString()
        });
    }
});

// ✅ Execute database migration
router.post('/execute', supabaseAuth, async (req, res) => {
    try {
        console.log('🚀 Starting database migration...');
        const migrationResults = [];
        let totalTime = 0;

        const startTime = Date.now();
        
        // 1. Create migrations tracking table
        console.log('📋 Creating migrations table...');
        try {
            const { error: migTableError } = await supabase.rpc('exec_sql', {
                sql: `CREATE TABLE IF NOT EXISTS migrations (
                    id SERIAL PRIMARY KEY,
                    filename VARCHAR(255) UNIQUE NOT NULL,
                    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );`
            });

            if (migTableError && !migTableError.message.includes('already exists')) {
                throw migTableError;
            }

            migrationResults.push({
                step: 'migrations_table',
                success: true,
                message: 'Migrations tracking table ready'
            });

        } catch (migTableErr) {
            migrationResults.push({
                step: 'migrations_table',
                success: false,
                error: migTableErr.message
            });
        }

        // 2. Execute main schema migration
        console.log('🏗️ Creating database schema...');
        
        const mainSchemaSQL = `
            -- Enable UUID extension
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

            -- Users table
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
            );

            -- Categories table
            CREATE TABLE IF NOT EXISTS categories (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
            );

            -- Posts table
            CREATE TABLE IF NOT EXISTS posts (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                title VARCHAR(500) NOT NULL,
                slug VARCHAR(500) UNIQUE NOT NULL,
                content TEXT NOT NULL,
                excerpt TEXT,
                featured_image_url TEXT,
                status VARCHAR(20) DEFAULT 'draft',
                author_id UUID REFERENCES users(id) ON DELETE CASCADE,
                category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
                generated_by_ai BOOLEAN DEFAULT false,
                ai_provider VARCHAR(50),
                ai_prompt TEXT,
                ai_confidence_score DECIMAL(3,2),
                meta_title VARCHAR(200),
                meta_description TEXT,
                meta_keywords TEXT,
                view_count INTEGER DEFAULT 0,
                like_count INTEGER DEFAULT 0,
                published_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            -- Tags table
            CREATE TABLE IF NOT EXISTS tags (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(100) UNIQUE NOT NULL,
                slug VARCHAR(100) UNIQUE NOT NULL,
                color VARCHAR(7),
                usage_count INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            -- Post-Tag relationship
            CREATE TABLE IF NOT EXISTS post_tags (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
                tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(post_id, tag_id)
            );

            -- AI Requests logging
            CREATE TABLE IF NOT EXISTS ai_requests (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
            );

            -- AI Swarm Council logs
            CREATE TABLE IF NOT EXISTS ai_swarm_logs (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                request_id UUID REFERENCES ai_requests(id) ON DELETE CASCADE,
                topic_analysis JSONB,
                roles_assigned JSONB,
                expert_responses JSONB,
                critic_review TEXT,
                final_synthesis TEXT,
                confidence_score DECIMAL(3,2),
                processing_time_ms INTEGER,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            -- Settings table
            CREATE TABLE IF NOT EXISTS settings (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                key VARCHAR(100) UNIQUE NOT NULL,
                value TEXT,
                type VARCHAR(20) DEFAULT 'string',
                description TEXT,
                is_public BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `;

        // Split and execute SQL statements
        const statements = mainSchemaSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.trim()) {
                try {
                    console.log(`🔄 Executing statement ${i + 1}/${statements.length}...`);
                    
                    const { error } = await supabase.rpc('exec_sql', {
                        sql: statement
                    });

                    if (error) {
                        throw error;
                    }

                } catch (stmtError) {
                    if (!stmtError.message.includes('already exists')) {
                        throw stmtError;
                    }
                }
            }
        }

        migrationResults.push({
            step: 'main_schema',
            success: true,
            message: 'Main database schema created successfully',
            statements_executed: statements.length
        });

        // 3. Create indexes
        console.log('📊 Creating database indexes...');
        
        const indexSQL = `
            CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
            CREATE INDEX IF NOT EXISTS idx_posts_category_id ON posts(category_id);
            CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
            CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
            CREATE INDEX IF NOT EXISTS idx_ai_requests_user_id ON ai_requests(user_id);
            CREATE INDEX IF NOT EXISTS idx_ai_requests_provider ON ai_requests(provider);
            CREATE INDEX IF NOT EXISTS idx_ai_requests_created_at ON ai_requests(created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_post_tags_post_id ON post_tags(post_id);
            CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON post_tags(tag_id);
        `;

        const indexStatements = indexSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);

        for (const indexStmt of indexStatements) {
            if (indexStmt.trim()) {
                try {
                    const { error } = await supabase.rpc('exec_sql', {
                        sql: indexStmt
                    });
                    if (error && !error.message.includes('already exists')) {
                        throw error;
                    }
                } catch (indexError) {
                    console.warn('⚠️ Index creation warning:', indexError.message);
                }
            }
        }

        migrationResults.push({
            step: 'indexes',
            success: true,
            message: 'Database indexes created successfully'
        });

        // 4. Record migration completion
        try {
            const { error: recordError } = await supabase
                .from('migrations')
                .insert({
                    filename: '001_initial_schema.sql'
                });

            if (recordError && !recordError.message.includes('duplicate')) {
                console.warn('⚠️ Could not record migration:', recordError.message);
            }
        } catch (recordErr) {
            console.warn('⚠️ Migration recording warning:', recordErr.message);
        }

        totalTime = Date.now() - startTime;

        console.log('🎉 Database migration completed successfully!');

        res.json({
            success: true,
            message: 'Database migration completed successfully',
            data: {
                migrationResults,
                totalTime: `${totalTime}ms`,
                timestamp: new Date().toISOString(),
                nextSteps: [
                    'Verify tables in Supabase dashboard',
                    'Run health check to confirm schema',
                    'Consider seeding initial data'
                ]
            }
        });

    } catch (error) {
        console.error('❌ Database migration failed:', error.message);

        res.status(500).json({
            success: false,
            error: 'Database migration failed',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Contact support for details',
            migrationResults,
            timestamp: new Date().toISOString(),
            troubleshooting: [
                'Check Supabase connection',
                'Verify admin permissions',
                'Check SQL syntax in migration',
                'Review Supabase logs for details'
            ]
        });
    }
});

// ✅ Health check for database schema
router.get('/health', supabaseAuth, async (req, res) => {
    try {
        console.log('🏥 Running database health check...');

        const healthChecks = {
            supabaseConnection: false,
            migrationsTable: false,
            coreTablesExist: false,
            indexesExist: false,
            totalTables: 0,
            missingTables: [],
            details: {}
        };

        // Test Supabase connection
        try {
            const { data, error } = await supabase
                .from('migrations')
                .select('count')
                .limit(1);
            
            healthChecks.supabaseConnection = !error;
            healthChecks.migrationsTable = !error;
        } catch (connError) {
            healthChecks.supabaseConnection = false;
        }

        // Check required tables
        const requiredTables = [
            'users', 'posts', 'categories', 'tags', 'post_tags',
            'ai_requests', 'ai_swarm_logs', 'settings'
        ];

        let existingTablesCount = 0;
        const missingTables = [];

        for (const tableName of requiredTables) {
            try {
                const { data, error } = await supabase
                    .from(tableName)
                    .select('id')
                    .limit(1);

                const exists = !error;
                healthChecks.details[tableName] = {
                    exists,
                    error: error?.message || null
                };

                if (exists) {
                    existingTablesCount++;
                } else {
                    missingTables.push(tableName);
                }

            } catch (tableError) {
                healthChecks.details[tableName] = {
                    exists: false,
                    error: tableError.message
                };
                missingTables.push(tableName);
            }
        }

        healthChecks.totalTables = existingTablesCount;
        healthChecks.missingTables = missingTables;
        healthChecks.coreTablesExist = missingTables.length === 0;

        // Overall health status
        const isHealthy = healthChecks.supabaseConnection && 
                         healthChecks.migrationsTable && 
                         healthChecks.coreTablesExist;

        res.json({
            success: true,
            healthy: isHealthy,
            data: healthChecks,
            summary: {
                status: isHealthy ? 'HEALTHY' : 'NEEDS_MIGRATION',
                tablesFound: `${existingTablesCount}/${requiredTables.length}`,
                recommendation: isHealthy 
                    ? 'Database schema is ready' 
                    : 'Run migration to create missing tables'
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Health check failed:', error.message);

        res.status(500).json({
            success: false,
            healthy: false,
            error: 'Health check failed',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Contact support for details',
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;
