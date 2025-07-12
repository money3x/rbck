const express = require('express');
const router = express.Router();
const MigrationService = require('../services/MigrationService');
const path = require('path');
const fs = require('fs');

// ✅ Debug endpoint to check environment variables and system state
router.get('/debug', async (req, res) => {
    try {
        console.log('🔍 Migration Debug Check...');
        
        const debugInfo = {
            timestamp: new Date().toISOString(),
            nodeEnv: process.env.NODE_ENV,
            environmentVariables: {
                SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'NOT SET',
                SUPABASE_KEY: process.env.SUPABASE_KEY ? 'SET' : 'NOT SET',
                SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET',
                SUPABASE_DB_HOST: process.env.SUPABASE_DB_HOST || 'NOT SET',
                SUPABASE_DB_PORT: process.env.SUPABASE_DB_PORT || 'NOT SET (default: 5432)',
                SUPABASE_DB_NAME: process.env.SUPABASE_DB_NAME || 'NOT SET (default: postgres)',
                SUPABASE_DB_USER: process.env.SUPABASE_DB_USER || 'NOT SET (default: postgres)',
                SUPABASE_DB_PASSWORD: process.env.SUPABASE_DB_PASSWORD ? 'SET' : 'NOT SET'
            },
            files: {
                migrationServiceExists: fs.existsSync(path.join(__dirname, '..', 'services', 'MigrationService.js')),
                schemaFileExists: fs.existsSync(path.join(__dirname, '..', 'database-schema.sql')),
                schemaFileSize: null
            },
            system: {
                platform: process.platform,
                nodeVersion: process.version,
                workingDirectory: process.cwd()
            }
        };
        
        // Check schema file size
        const schemaFilePath = path.join(__dirname, '..', 'database-schema.sql');
        if (fs.existsSync(schemaFilePath)) {
            const stats = fs.statSync(schemaFilePath);
            debugInfo.files.schemaFileSize = stats.size;
        }
        
        // Test database connection
        console.log('🔌 Testing database connection...');
        const connectionTest = await MigrationService.testConnection();
        debugInfo.databaseConnection = connectionTest;
        
        // Get current schema info if connection works
        if (connectionTest.success) {
            console.log('📊 Getting schema info...');
            const schemaInfo = await MigrationService.getSchemaInfo();
            debugInfo.currentSchema = {
                tablesCount: schemaInfo.tables?.length || 0,
                tableNames: schemaInfo.tables?.map(t => t.table_name) || [],
                columnsCount: schemaInfo.columns?.length || 0,
                indexesCount: schemaInfo.indexes?.length || 0
            };
        }
        
        res.json({
            success: true,
            message: 'Migration system debug information',
            data: debugInfo
        });
        
    } catch (error) {
        console.error('❌ Debug check failed:', error.message);
        
        res.status(500).json({
            success: false,
            error: 'Debug check failed',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// ✅ Force migration execution (with detailed logging)
router.post('/force-execute', async (req, res) => {
    try {
        console.log('🚀 FORCE Migration Execution Started...');
        
        const schemaFilePath = path.join(__dirname, '..', 'database-schema.sql');
        
        // Step 1: Verify file exists
        if (!fs.existsSync(schemaFilePath)) {
            return res.status(400).json({
                success: false,
                error: 'Schema file not found',
                path: schemaFilePath
            });
        }
        
        console.log('📄 Schema file found:', schemaFilePath);
        
        // Step 2: Test connection with detailed info
        console.log('🔌 Testing database connection...');
        const connectionTest = await MigrationService.testConnection();
        
        if (!connectionTest.success) {
            return res.status(500).json({
                success: false,
                error: 'Database connection failed',
                details: connectionTest.error,
                config: connectionTest.config
            });
        }
        
        console.log('✅ Database connection successful');
        
        // Step 3: Execute migration with full logging
        console.log('📄 Executing database schema...');
        const migrationResult = await MigrationService.executeSQLFile(schemaFilePath);
        
        console.log('🎉 Migration execution completed');
        console.log('Result:', JSON.stringify(migrationResult, null, 2));
        
        res.json({
            success: migrationResult.success,
            message: migrationResult.success ? 'Migration completed successfully' : 'Migration failed',
            data: migrationResult,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Force migration failed:', error.message);
        
        res.status(500).json({
            success: false,
            error: 'Force migration failed',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

module.exports = router;