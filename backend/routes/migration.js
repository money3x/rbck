const express = require('express');
const router = express.Router();
const { supabase } = require('../supabaseClient');
const { authenticateAdmin } = require('../middleware/auth');
const MigrationService = require('../services/MigrationService');
// Gate MigrationServiceHTTP behind env flag for safety
const MigrationServiceHTTP = process.env.RUN_MIGRATIONS === 'true' 
    ? require('../services/MigrationServiceHTTP') 
    : null;
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
        
        // Use modern HTTP API migration system (bypasses network restrictions)
        console.log('🌐 Using HTTP API migration system...');
        console.log('🔌 Testing connection capabilities...');
        
        // Check if migrations are enabled
        if (!MigrationServiceHTTP) {
            return res.status(503).json({
                success: false,
                error: 'Database migrations are disabled. Set RUN_MIGRATIONS=true to enable.',
                code: 'MIGRATIONS_DISABLED'
            });
        }
        
        // Test HTTP API connection first
        const httpConnectionTest = await MigrationServiceHTTP.testConnection();
        
        if (httpConnectionTest.success) {
            console.log('✅ HTTP API connection successful - using modern migration system');
            
            // Execute migration via HTTP API
            console.log('🚀 Executing migration via Supabase HTTP API...');
            const migrationResult = await MigrationServiceHTTP.executeMigration();
            
            if (migrationResult.success) {
                console.log('🎉 HTTP API migration completed successfully!');
                
                // Record migration completion via Supabase client
                try {
                    const { error: recordError } = await supabase
                        .from('migrations')
                        .insert({
                            filename: 'rbck_http_api_migration.sql'
                        });

                    if (recordError && !recordError.message.includes('duplicate')) {
                        console.warn('⚠️ Could not record migration:', recordError.message);
                    }
                } catch (recordErr) {
                    console.warn('⚠️ Migration recording warning:', recordErr.message);
                }

                return res.json({
                    success: true,
                    message: '🚀 Modern HTTP API migration completed successfully',
                    data: {
                        ...migrationResult,
                        migrationMethod: 'HTTP API',
                        networkOptimized: true,
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
                console.error('❌ HTTP API migration failed');
                
                return res.status(500).json({
                    success: false,
                    error: 'HTTP API migration failed',
                    details: migrationResult.error,
                    results: migrationResult.results,
                    timestamp: new Date().toISOString(),
                    troubleshooting: [
                        'Check Supabase service role key',
                        'Verify HTTP API permissions',
                        'Check migration logs for details',
                        'Try direct SQL execution in Supabase dashboard'
                    ]
                });
            }
        }
        
        // Fallback: Try direct connection if HTTP API fails
        console.log('⚠️ HTTP API not available, trying direct connection...');
        const directConnectionTest = await MigrationService.testConnection();
        
        if (!directConnectionTest.success) {
            return res.status(500).json({
                success: false,
                error: 'All migration methods failed',
                details: {
                    httpApi: httpConnectionTest.error,
                    directConnection: directConnectionTest.error
                },
                timestamp: new Date().toISOString(),
                troubleshooting: [
                    'Check SUPABASE_SERVICE_KEY environment variable',
                    'Verify Supabase project is active',
                    'Check network connectivity',
                    'Try manual migration via Supabase SQL Editor'
                ]
            });
        }

        console.log('✅ Direct connection successful - using fallback method');

        // Execute migration via direct connection
        console.log('📄 Executing database schema via direct connection...');
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
