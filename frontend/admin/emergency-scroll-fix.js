/**
 * EMERGENCY SCROLL FIX - TARGETED SECTION REPAIR
 * Date: 2025-06-27
 * Purpose: Fix scrolling ONLY in Article/Database sections without affecting Dashboard/AI
 */

window.emergencyScrollFix = function() {
    console.log('🚑 EMERGENCY SCROLL FIX - Starting targeted repair...');
    
    // Only target the problematic sections
    const problemSections = [
        'article-handles-section',
        'database-section', 
        'posts-section',
        'seo-section',
        'migration-section'
    ];
    
    problemSections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            console.log(`🔧 Fixing scrolling for: ${sectionId}`);
            
            // Reset overflow properties to allow scrolling
            section.style.overflow = 'visible';
            section.style.overflowY = 'auto';
            section.style.overflowX = 'hidden';
            section.style.height = 'auto';
            section.style.maxHeight = 'none';
            section.style.minHeight = 'auto';
            
            // Ensure content containers are scrollable
            const containers = section.querySelectorAll('.container, .article-container, .database-container, .content-area');
            containers.forEach(container => {
                container.style.overflow = 'visible';
                container.style.overflowY = 'auto';
                container.style.height = 'auto';
                container.style.maxHeight = 'none';
            });
            
            // Fix any nested scrollable areas
            const scrollAreas = section.querySelectorAll('.article-list, .database-list, .posts-list, .content-list');
            scrollAreas.forEach(area => {
                area.style.overflow = 'visible';
                area.style.overflowY = 'auto';
                area.style.height = 'auto';
                area.style.maxHeight = '70vh'; // Allow reasonable scrolling height
            });
        }
    });
    
    // Ensure main content area is properly sized but scrollable
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.style.overflow = 'visible';
        mainContent.style.overflowY = 'auto';
        mainContent.style.height = '100vh';
    }
    
    console.log('✅ Emergency scroll fix applied successfully!');
};

// Apply fix when sections are shown
window.originalShowSection = window.showSection;
window.showSection = function(sectionId) {
    // Call original function
    if (window.originalShowSection) {
        window.originalShowSection(sectionId);
    }
    
    // Apply emergency scroll fix for problem sections only
    const problemSections = [
        'article-handles-section',
        'database-section', 
        'posts-section',
        'seo-section',
        'migration-section'
    ];
    
    if (problemSections.includes(sectionId)) {
        setTimeout(() => {
            window.emergencyScrollFix();
        }, 100);
    }
};

// Manual trigger
window.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        window.emergencyScrollFix();
        alert('Emergency scroll fix applied!');
    }
});

// Auto-apply on load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        window.emergencyScrollFix();
    }, 500);
});

console.log('🚑 Emergency scroll fix loaded. Press Ctrl+Shift+F to manually trigger.');
