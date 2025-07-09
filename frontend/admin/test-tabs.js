// Test script for tab functionality
console.log('🧪 Testing tab functionality...');

// Test 1: Check if showSection function exists
function testShowSectionFunction() {
    console.log('📋 Test 1: showSection function existence');
    
    if (typeof window.showSection === 'function') {
        console.log('✅ showSection function exists');
        return true;
    } else {
        console.log('❌ showSection function not found');
        return false;
    }
}

// Test 2: Check if content sections exist
function testContentSections() {
    console.log('📋 Test 2: Content sections existence');
    
    const sections = [
        'dashboard',
        'ai-swarm',
        'ai-monitoring',
        'ai-chatbot',
        'blog-manage',
        'blog-create',
        'seo-tools',
        'analytics',
        'security-dashboard',
        'auth-logs',
        'blocked-ips',
        'security-alerts',
        'migration'
    ];
    
    let allSectionsExist = true;
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            console.log(`✅ Section '${sectionId}' exists`);
        } else {
            console.log(`❌ Section '${sectionId}' not found`);
            allSectionsExist = false;
        }
    });
    
    return allSectionsExist;
}

// Test 3: Check if navigation links exist
function testNavigationLinks() {
    console.log('📋 Test 3: Navigation links existence');
    
    const navLinks = document.querySelectorAll('.nav-link[onclick*="showSection"]');
    console.log(`✅ Found ${navLinks.length} navigation links`);
    
    navLinks.forEach((link, index) => {
        const onclick = link.getAttribute('onclick');
        console.log(`  ${index + 1}. ${onclick}`);
    });
    
    return navLinks.length > 0;
}

// Test 4: Simulate tab switching
function testTabSwitching() {
    console.log('📋 Test 4: Tab switching functionality');
    
    if (typeof window.showSection !== 'function') {
        console.log('❌ Cannot test tab switching - showSection function not available');
        return false;
    }
    
    const testSections = ['dashboard', 'blog-manage', 'seo-tools', 'analytics'];
    let allSwitchesWork = true;
    
    testSections.forEach(sectionId => {
        try {
            console.log(`  Testing switch to: ${sectionId}`);
            window.showSection(sectionId);
            
            // Check if section is now active
            const section = document.getElementById(sectionId);
            if (section && section.classList.contains('active')) {
                console.log(`  ✅ Successfully switched to ${sectionId}`);
            } else {
                console.log(`  ❌ Failed to switch to ${sectionId}`);
                allSwitchesWork = false;
            }
        } catch (error) {
            console.log(`  ❌ Error switching to ${sectionId}:`, error.message);
            allSwitchesWork = false;
        }
    });
    
    return allSwitchesWork;
}

// Test 5: Check CSS styling for tab separation
function testTabSeparation() {
    console.log('📋 Test 5: Tab content separation');
    
    const sections = document.querySelectorAll('.content-section');
    let properSeparation = true;
    
    sections.forEach(section => {
        const isActive = section.classList.contains('active');
        const isVisible = window.getComputedStyle(section).display !== 'none';
        
        if (isActive && !isVisible) {
            console.log(`❌ Section ${section.id} is active but not visible`);
            properSeparation = false;
        } else if (!isActive && isVisible) {
            console.log(`⚠️ Section ${section.id} is not active but visible`);
        }
    });
    
    const activeSections = document.querySelectorAll('.content-section.active');
    if (activeSections.length === 1) {
        console.log(`✅ Only one section is active: ${activeSections[0].id}`);
    } else {
        console.log(`❌ Multiple sections are active: ${activeSections.length}`);
        properSeparation = false;
    }
    
    return properSeparation;
}

// Run all tests
function runAllTests() {
    console.log('🚀 Starting tab functionality tests...');
    console.log('=====================================');
    
    const results = {
        showSectionExists: testShowSectionFunction(),
        contentSectionsExist: testContentSections(),
        navigationLinksExist: testNavigationLinks(),
        tabSwitchingWorks: testTabSwitching(),
        tabSeparationWorks: testTabSeparation()
    };
    
    console.log('=====================================');
    console.log('🏁 Test Results Summary:');
    console.log('=====================================');
    
    Object.entries(results).forEach(([test, passed]) => {
        console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    });
    
    const overallPassed = Object.values(results).every(result => result === true);
    console.log('=====================================');
    console.log(`🎯 Overall Result: ${overallPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    return results;
}

// Auto-run tests when loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllTests);
} else {
    runAllTests();
}

// Export for manual testing
window.testTabs = {
    runAllTests,
    testShowSectionFunction,
    testContentSections,
    testNavigationLinks,
    testTabSwitching,
    testTabSeparation
};