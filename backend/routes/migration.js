const express = require('express');
const router = express.Router();
const { supabase } = require('../supabaseClient');
const { authenticateAdmin } = require('../middleware/auth');
const MigrationService = require('../services/MigrationService');
const path = require('path');
const fs = require('fs');

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

// ✅ Migration auth - use internal service or admin token
const migrationAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required for migration operations'
        });
    }
    
    // Option 1: Use JWT admin token
    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.isAdmin) {
            req.user = { role: 'admin', username: decoded.username, authType: 'jwt' };
            return next();
        }
    } catch (err) {
        // JWT validation failed, try other methods
    }
    
    // Option 2: Internal service token
    if (token === process.env.INTERNAL_SERVICE_TOKEN) {
        req.user = { role: 'admin', username: 'internal-service', authType: 'service' };
        return next();
    }
    
    return res.status(401).json({
        success: false,
        error: 'Invalid authentication token'
    });
};

// ✅ Check migration status (PUBLIC for initial setup)
router.get('/status', async (req, res) => {
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

// ✅ Execute database migration (REAL SQL EXECUTION)
router.post('/execute', async (req, res) => {
    try {
        console.log('🚀 Starting REAL database migration...');
        
        const schemaFilePath = path.join(__dirname, '..', 'database-schema.sql');
        
        // Test database connection first
        console.log('🔌 Testing database connection...');
        const connectionTest = await MigrationService.testConnection();
        
        console.log('Connection test result:', connectionTest);
        
        if (!connectionTest.success) {
            return res.status(500).json({
                success: false,
                error: 'Database connection failed',
                details: connectionTest.error,
                timestamp: new Date().toISOString(),
                troubleshooting: [
                    'Check SUPABASE_DB_HOST environment variable',
                    'Check SUPABASE_DB_PASSWORD environment variable',
                    'Verify Supabase database credentials',
                    'Check network connectivity to Supabase'
                ]
            });
        }

        console.log('✅ Database connection successful');

        // Execute migration
        console.log('📄 Executing database schema...');
        const migrationResult = await MigrationService.executeSQLFile(schemaFilePath);

        if (migrationResult.success) {
            console.log('🎉 Database migration completed successfully!');
            
            // Record migration completion
            try {
                const { error: recordError } = await supabase
                    .from('migrations')
                    .insert({
                        filename: 'rbck_supabase_migration.sql'
                    });

                if (recordError && !recordError.message.includes('duplicate')) {
                    console.warn('⚠️ Could not record migration:', recordError.message);
                }
            } catch (recordErr) {
                console.warn('⚠️ Migration recording warning:', recordErr.message);
            }

            res.json({
                success: true,
                message: 'Database migration completed successfully',
                data: {
                    ...migrationResult,
                    timestamp: new Date().toISOString(),
                    nextSteps: [
                        'Verify all tables exist in Supabase Table Editor',
                        'Run health check to confirm schema is complete',
                        'Check migration status to see current progress',
                        'Test application functionality'
                    ]
                }
            });
        } else {
            console.error('❌ Database migration failed');
            
            res.status(500).json({
                success: false,
                error: 'Database migration failed',
                details: migrationResult.error,
                results: migrationResult.results,
                timestamp: new Date().toISOString(),
                troubleshooting: [
                    'Check SQL syntax in database-schema.sql',
                    'Verify database permissions',
                    'Check Supabase logs for details',
                    'Review failed statements in results'
                ]
            });
        }

    } catch (error) {
        console.error('❌ Database migration failed:', error.message);

        res.status(500).json({
            success: false,
            error: 'Database migration failed',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Contact support for details',
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

// ✅ Health check for database schema (PUBLIC for monitoring)
router.get('/health', async (req, res) => {
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
