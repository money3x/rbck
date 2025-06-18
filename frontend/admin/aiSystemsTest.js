// Test script for AI Swarm and Monitoring systems
// This script will verify that our AI systems are working correctly

console.log('🧪 [TEST] Starting AI Systems Test...');

// Wait for page to load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(async () => {
        console.log('🔍 [TEST] Checking AI Systems availability...');
        
        // Test AI Swarm Council
        if (window.aiSwarmCouncil) {
            console.log('✅ [TEST] AI Swarm Council available');
            
            // Test status report
            const swarmStatus = window.aiSwarmCouncil.getStatusReport();
            console.log('📊 [TEST] AI Swarm Status:', swarmStatus);
            
            // Test conversation methods
            window.aiSwarmCouncil.addConversationMessage('system', '🧪 Test message from test script');
            console.log('✅ [TEST] AI Swarm conversation system working');
            
        } else {
            console.log('❌ [TEST] AI Swarm Council not available');
        }
        
        // Test AI Monitoring System
        if (window.aiMonitor) {
            console.log('✅ [TEST] AI Monitoring System available');
            
            // Test monitoring summary
            const monitoringSummary = window.aiMonitor.getSummary();
            console.log('📊 [TEST] AI Monitoring Summary:', monitoringSummary);
            
        } else {
            console.log('❌ [TEST] AI Monitoring System not available');
        }
        
        // Test UI elements
        const swarmPanel = document.getElementById('aiSwarmPanel');
        const monitoringPanel = document.getElementById('aiMonitoringPanel');
        
        console.log('🎨 [TEST] UI Elements:');
        console.log('  - AI Swarm Panel:', swarmPanel ? '✅ Found' : '❌ Missing');
        console.log('  - AI Monitoring Panel:', monitoringPanel ? '✅ Found' : '❌ Missing');
        
        // Test collaborative task simulation
        if (window.aiSwarmCouncil && swarmPanel) {
            console.log('🤖 [TEST] Testing collaborative task...');
            
            // Simulate a quick content review
            setTimeout(() => {
                window.aiSwarmCouncil.addConversationMessage('system', '🧪 Running test collaboration...');
            }, 2000);
        }
        
        console.log('✅ [TEST] AI Systems test completed');
        
    }, 3000); // Wait 3 seconds for full initialization
});

export { }; // Make this a module
