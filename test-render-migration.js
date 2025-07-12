// Test script to verify migration system on Render
// Usage: Replace YOUR_RENDER_URL with your actual Render backend URL

const RENDER_URL = 'https://your-render-backend.onrender.com'; // REPLACE THIS

async function testMigrationSystem() {
    console.log('🔍 Testing Migration System on Render...');
    console.log('Backend URL:', RENDER_URL);
    
    try {
        // Test 1: Check if debug endpoint exists
        console.log('\n1️⃣ Testing debug endpoint...');
        const debugResponse = await fetch(`${RENDER_URL}/api/debug-migration/debug`);
        
        if (debugResponse.ok) {
            const debugData = await debugResponse.json();
            console.log('✅ Debug endpoint working');
            console.log('Environment Variables:', debugData.data.environmentVariables);
            console.log('Database Connection:', debugData.data.databaseConnection?.success ? '✅ Connected' : '❌ Failed');
            
            if (debugData.data.currentSchema) {
                console.log('Current Tables:', debugData.data.currentSchema.tableNames);
                console.log('Tables Count:', debugData.data.currentSchema.tablesCount);
            }
        } else {
            console.log('❌ Debug endpoint failed:', debugResponse.status);
        }
        
        // Test 2: Check migration status
        console.log('\n2️⃣ Testing migration status...');
        const statusResponse = await fetch(`${RENDER_URL}/api/migration/status`);
        
        if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            console.log('✅ Status endpoint working');
            console.log('Existing Tables:', statusData.data.existingTables);
            console.log('Missing Tables:', statusData.data.missingTables);
            console.log('Fully Migrated:', statusData.data.isFullyMigrated);
            console.log('Recommendation:', statusData.data.recommendation);
        } else {
            console.log('❌ Status endpoint failed:', statusResponse.status);
        }
        
        // Test 3: Execute migration (if needed)
        console.log('\n3️⃣ Testing migration execution...');
        const executeResponse = await fetch(`${RENDER_URL}/api/debug-migration/force-execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (executeResponse.ok) {
            const executeData = await executeResponse.json();
            console.log('✅ Migration execution completed');
            console.log('Success:', executeData.success);
            console.log('Message:', executeData.message);
            
            if (executeData.data) {
                console.log('Duration:', executeData.data.duration);
                console.log('Statements:', executeData.data.statistics?.totalStatements);
                console.log('Successful:', executeData.data.statistics?.successfulStatements);
                console.log('Errors:', executeData.data.statistics?.errorStatements);
            }
        } else {
            const errorText = await executeResponse.text();
            console.log('❌ Migration execution failed:', executeResponse.status);
            console.log('Error:', errorText);
        }
        
        // Test 4: Check status after migration
        console.log('\n4️⃣ Checking status after migration...');
        const finalStatusResponse = await fetch(`${RENDER_URL}/api/migration/status`);
        
        if (finalStatusResponse.ok) {
            const finalStatusData = await finalStatusResponse.json();
            console.log('✅ Final status check');
            console.log('Existing Tables:', finalStatusData.data.existingTables);
            console.log('Missing Tables:', finalStatusData.data.missingTables);
            console.log('Fully Migrated:', finalStatusData.data.isFullyMigrated);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testMigrationSystem();