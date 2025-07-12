const MigrationService = require('./services/MigrationService');
const path = require('path');

async function testMigration() {
  console.log('🔍 Testing Migration System Debug...');
  
  try {
    // Test 1: Check if MigrationService loads
    console.log('✅ MigrationService loaded successfully');
    
    // Test 2: Test database connection
    console.log('🔌 Testing database connection...');
    const connectionTest = await MigrationService.testConnection();
    console.log('Connection result:', JSON.stringify(connectionTest, null, 2));
    
    if (!connectionTest.success) {
      console.log('❌ Connection failed. Environment variables:');
      console.log('SUPABASE_DB_HOST:', process.env.SUPABASE_DB_HOST || 'NOT SET');
      console.log('SUPABASE_DB_PASSWORD:', process.env.SUPABASE_DB_PASSWORD ? '***SET***' : 'NOT SET');
      console.log('SUPABASE_URL:', process.env.SUPABASE_URL || 'NOT SET');
      console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '***SET***' : 'NOT SET');
      return;
    }
    
    // Test 3: Check if schema file exists
    const schemaFilePath = path.join(__dirname, 'database-schema.sql');
    const fs = require('fs');
    
    if (fs.existsSync(schemaFilePath)) {
      console.log('✅ Schema file found:', schemaFilePath);
      const stats = fs.statSync(schemaFilePath);
      console.log('File size:', stats.size, 'bytes');
    } else {
      console.log('❌ Schema file NOT found:', schemaFilePath);
      return;
    }
    
    // Test 4: Get schema info
    console.log('📊 Getting current database schema...');
    const schemaInfo = await MigrationService.getSchemaInfo();
    console.log('Current tables:', schemaInfo.tables?.length || 0);
    if (schemaInfo.tables) {
      console.log('Table names:', schemaInfo.tables.map(t => t.table_name));
    }
    
    console.log('🎉 All tests passed! Migration system is ready.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testMigration();