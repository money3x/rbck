/* ========================================
   LUXURY SIDEBAR DEBUG & INITIALIZATION
   Debug tool for troubleshooting sidebar styling
======================================== */

console.log('🔧 [DEBUG] Loading luxury sidebar debug tools...');

/**
 * Debug Luxury Sidebar Function
 * Check if all luxury sidebar components are properly loaded and styled
 */
function debugLuxurySidebar() {
    console.log('🔧 [DEBUG] Starting luxury sidebar debug...');
    
    // Check if sidebar element exists
    const sidebar = document.querySelector('.sidebar-luxury');
    console.log('🔧 [DEBUG] Sidebar element found:', !!sidebar);
    
    if (!sidebar) {
        console.error('❌ [DEBUG] Sidebar element not found!');
        return;
    }
    
    // Check computed styles
    const sidebarStyles = window.getComputedStyle(sidebar);
    console.log('🔧 [DEBUG] Sidebar computed styles:');
    console.log('  - Background:', sidebarStyles.background);
    console.log('  - Backdrop Filter:', sidebarStyles.backdropFilter);
    console.log('  - Border Right:', sidebarStyles.borderRight);
    console.log('  - Box Shadow:', sidebarStyles.boxShadow);
    
    // Check nav categories
    const categories = sidebar.querySelectorAll('.nav-category');
    console.log('🔧 [DEBUG] Categories found:', categories.length);
    
    categories.forEach((category, index) => {
        const categoryStyles = window.getComputedStyle(category);
        console.log(`🔧 [DEBUG] Category ${index + 1}:`, {
            background: categoryStyles.background,
            border: categoryStyles.border,
            borderRadius: categoryStyles.borderRadius
        });
    });
    
    // Check nav links
    const navLinks = sidebar.querySelectorAll('.nav-link');
    console.log('🔧 [DEBUG] Nav links found:', navLinks.length);
    
    // Check if JavaScript is working
    const luxuryInstance = sidebar.luxurySidebarInstance;
    console.log('🔧 [DEBUG] Luxury sidebar instance:', !!luxuryInstance);
    
    // Check CSS files loading
    const stylesheets = Array.from(document.styleSheets);
    const luxurySheets = stylesheets.filter(sheet => 
        sheet.href && sheet.href.includes('luxury-sidebar')
    );
    console.log('🔧 [DEBUG] Luxury CSS files loaded:', luxurySheets.length);
    luxurySheets.forEach(sheet => {
        console.log('  - CSS File:', sheet.href.split('/').pop());
    });
    
    return {
        sidebar,
        categories: categories.length,
        navLinks: navLinks.length,
        instance: !!luxuryInstance,
        cssFiles: luxurySheets.length
    };
}

/**
 * Force Apply Luxury Styling
 * Apply luxury styling directly via JavaScript if CSS fails
 */
function forceApplyLuxuryStyling() {
    console.log('🔧 [DEBUG] Force applying luxury styling...');
    
    const sidebar = document.querySelector('.sidebar-luxury');
    if (!sidebar) {
        console.error('❌ [DEBUG] Cannot find sidebar element');
        return;
    }
    
    // Force sidebar styling
    Object.assign(sidebar.style, {
        background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(10, 10, 10, 0.9) 50%, rgba(26, 26, 26, 0.95) 100%)',
        backdropFilter: 'blur(20px) saturate(1.2)',
        borderRight: '1px solid rgba(255, 215, 0, 0.15)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
        width: '280px',
        height: '100vh',
        position: 'fixed',
        left: '0',
        top: '0',
        zIndex: '1000'
    });
    
    // Force category styling
    const categories = sidebar.querySelectorAll('.nav-category');
    categories.forEach(category => {
        Object.assign(category.style, {
            background: 'rgba(10, 10, 10, 0.85)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 215, 0, 0.15)',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            padding: '0',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
        });
    });
    
    // Force category header styling
    const headers = sidebar.querySelectorAll('.category-header');
    headers.forEach(header => {
        Object.assign(header.style, {
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.12) 0%, rgba(26, 26, 26, 0.8) 100%)',
            color: '#FFFFFF',
            fontWeight: '600',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '1rem 1.5rem',
            borderBottom: '1px solid rgba(255, 215, 0, 0.15)',
            borderRadius: '12px 12px 0 0',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
        });
    });
    
    // Force nav-link styling
    const navLinks = sidebar.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        Object.assign(link.style, {
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem 1.5rem',
            margin: '4px 0',
            color: '#E5E4E2',
            fontWeight: '500',
            textDecoration: 'none',
            lineHeight: '1.5',
            borderRadius: '8px',
            border: '1px solid transparent',
            transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            background: 'transparent'
        });
        
        // Add hover effect
        link.addEventListener('mouseenter', function() {
            Object.assign(this.style, {
                background: 'rgba(255, 215, 0, 0.08)',
                color: '#FFFFFF',
                borderColor: 'rgba(255, 215, 0, 0.15)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                transform: 'translateX(4px)'
            });
        });
        
        link.addEventListener('mouseleave', function() {
            if (!this.classList.contains('active')) {
                Object.assign(this.style, {
                    background: 'transparent',
                    color: '#E5E4E2',
                    borderColor: 'transparent',
                    boxShadow: 'none',
                    transform: 'translateX(0)'
                });
            }
        });
        
        // Active state
        if (link.classList.contains('active')) {
            Object.assign(link.style, {
                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 215, 0, 0.05) 100%)',
                color: '#FFFFFF',
                borderColor: '#FFD700',
                boxShadow: '0 4px 20px rgba(255, 215, 0, 0.15)',
                fontWeight: '600'
            });
        }
    });
    
    // Force sidebar header styling
    const header = sidebar.querySelector('.sidebar-header');
    if (header) {
        Object.assign(header.style, {
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.08) 0%, rgba(10, 10, 10, 0.95) 100%)',
            borderBottom: '1px solid rgba(255, 215, 0, 0.15)',
            padding: '2rem 1.5rem',
            color: '#FFFFFF'
        });
        
        const h1 = header.querySelector('h1');
        if (h1) {
            Object.assign(h1.style, {
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#FFFFFF',
                margin: '0 0 0.5rem 0',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
            });
        }
        
        const p = header.querySelector('p');
        if (p) {
            Object.assign(p.style, {
                fontSize: '0.875rem',
                color: '#E5E4E2',
                margin: '0',
                opacity: '0.9'
            });
        }
    }
    
    console.log('✅ [DEBUG] Luxury styling force applied');
}

/**
 * Initialize Debug Mode
 * Run debug checks and apply fixes if needed
 */
function initializeDebugMode() {
    console.log('🔧 [DEBUG] Initializing debug mode...');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                const results = debugLuxurySidebar();
                
                // If styling is not applied, force apply it
                if (results && results.cssFiles === 0) {
                    console.warn('⚠️ [DEBUG] CSS files not detected, force applying styling...');
                    forceApplyLuxuryStyling();
                }
            }, 1000);
        });
    } else {
        setTimeout(() => {
            const results = debugLuxurySidebar();
            
            // If styling is not applied, force apply it
            if (results && results.cssFiles === 0) {
                console.warn('⚠️ [DEBUG] CSS files not detected, force applying styling...');
                forceApplyLuxuryStyling();
            }
        }, 1000);
    }
}

// Auto-initialize debug mode
initializeDebugMode();

// Expose to global scope for manual debugging
window.debugLuxurySidebar = debugLuxurySidebar;
window.forceApplyLuxuryStyling = forceApplyLuxuryStyling;

console.log('✅ [DEBUG] Luxury sidebar debug tools loaded');
console.log('💡 [DEBUG] Run debugLuxurySidebar() or forceApplyLuxuryStyling() in console if needed');