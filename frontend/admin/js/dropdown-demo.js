/* ========================================
   LUXURY SIDEBAR DROPDOWN DEMO
   Demonstration and testing script
======================================== */

console.log('🎮 [DEMO] Loading dropdown demo script...');

/**
 * Demo functions for testing dropdown functionality
 */
window.dropdownDemo = {
    
    /**
     * Demonstrate all dropdown features
     */
    runFullDemo: function() {
        console.log('🎮 [DEMO] Running full dropdown demonstration...');
        
        const sidebar = document.querySelector('.sidebar-luxury');
        if (!sidebar || !sidebar.dropdownInstance) {
            console.error('❌ [DEMO] Dropdown system not found');
            return;
        }
        
        const dropdown = sidebar.dropdownInstance;
        
        // Demo sequence
        this.showDemoMessage('Starting Luxury Sidebar Dropdown Demo! 🎪');
        
        setTimeout(() => {
            this.showDemoMessage('1. Collapsing all categories...');
            dropdown.collapseAllCategories();
        }, 1000);
        
        setTimeout(() => {
            this.showDemoMessage('2. Expanding AI Interface category...');
            dropdown.expandCategoryByName('AI Interface');
        }, 2500);
        
        setTimeout(() => {
            this.showDemoMessage('3. Expanding Article Management...');
            dropdown.expandCategoryByName('Article Management');
        }, 4000);
        
        setTimeout(() => {
            this.showDemoMessage('4. Expanding all categories...');
            dropdown.expandAllCategories();
        }, 5500);
        
        setTimeout(() => {
            this.showDemoMessage('5. Collapsing all except Dashboard...');
            dropdown.collapseAllCategories();
        }, 7000);
        
        setTimeout(() => {
            this.showDemoMessage('Demo complete! Try clicking category headers! ✨');
        }, 8500);
    },
    
    /**
     * Test keyboard navigation
     */
    testKeyboardNavigation: function() {
        this.showDemoMessage('Use Arrow Keys, Home, End, Enter, Space to navigate! ⌨️');
        const firstCategory = document.querySelector('.category-header.dropdown-header');
        if (firstCategory) {
            firstCategory.focus();
        }
    },
    
    /**
     * Test accessibility features
     */
    testAccessibility: function() {
        this.showDemoMessage('Testing accessibility features... 🔍');
        
        const categories = document.querySelectorAll('.nav-category.dropdown-enabled');
        categories.forEach((category, index) => {
            const header = category.querySelector('.category-header');
            const expanded = header.getAttribute('aria-expanded') === 'true';
            console.log(`Category ${index + 1}: ${expanded ? 'Expanded' : 'Collapsed'}`);
        });
        
        this.showDemoMessage('Check console for accessibility status! 📊');
    },
    
    /**
     * Show responsive behavior
     */
    testResponsive: function() {
        this.showDemoMessage('Testing responsive behavior... 📱');
        
        // Simulate mobile view
        document.body.style.width = '375px';
        document.documentElement.style.width = '375px';
        
        setTimeout(() => {
            // Restore normal view
            document.body.style.width = '';
            document.documentElement.style.width = '';
            this.showDemoMessage('Responsive test complete! 📱➡️💻');
        }, 3000);
    },
    
    /**
     * Performance test
     */
    testPerformance: function() {
        this.showDemoMessage('Running performance test... ⚡');
        
        const sidebar = document.querySelector('.sidebar-luxury');
        if (!sidebar || !sidebar.dropdownInstance) return;
        
        const dropdown = sidebar.dropdownInstance;
        const startTime = performance.now();
        
        // Rapid toggle test
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                dropdown.expandAllCategories();
                setTimeout(() => dropdown.collapseAllCategories(), 100);
            }, i * 200);
        }
        
        setTimeout(() => {
            const endTime = performance.now();
            const duration = endTime - startTime;
            this.showDemoMessage(`Performance test complete! Duration: ${duration.toFixed(2)}ms ⚡`);
        }, 2500);
    },
    
    /**
     * Show demo message
     */
    showDemoMessage: function(message) {
        // Create or update demo message element
        let demoMsg = document.querySelector('#dropdown-demo-message');
        if (!demoMsg) {
            demoMsg = document.createElement('div');
            demoMsg.id = 'dropdown-demo-message';
            demoMsg.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #FFD700, #FFA500);
                color: #000;
                padding: 12px 20px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 14px;
                box-shadow: 0 4px 20px rgba(255, 215, 0, 0.3);
                z-index: 10001;
                max-width: 300px;
                transition: all 0.3s ease;
                transform: translateX(100%);
            `;
            document.body.appendChild(demoMsg);
        }
        
        demoMsg.textContent = message;
        demoMsg.style.transform = 'translateX(0)';
        
        // Auto hide after 3 seconds
        setTimeout(() => {
            demoMsg.style.transform = 'translateX(100%)';
        }, 3000);
        
        console.log(`🎮 [DEMO] ${message}`);
    },
    
    /**
     * Get dropdown status
     */
    getStatus: function() {
        const sidebar = document.querySelector('.sidebar-luxury');
        if (!sidebar || !sidebar.dropdownInstance) {
            console.log('❌ [DEMO] Dropdown system not found');
            return null;
        }
        
        const dropdown = sidebar.dropdownInstance;
        const expandedCategories = dropdown.getExpandedCategories();
        
        const status = {
            initialized: dropdown.isInitialized,
            totalCategories: dropdown.categories.length,
            expandedCount: expandedCategories.length,
            expandedNames: expandedCategories.map(cat => cat.name),
            settings: dropdown.settings
        };
        
        console.log('📊 [DEMO] Dropdown Status:', status);
        return status;
    },
    
    /**
     * Custom settings test
     */
    testCustomSettings: function() {
        const sidebar = document.querySelector('.sidebar-luxury');
        if (!sidebar || !sidebar.dropdownInstance) return;
        
        const dropdown = sidebar.dropdownInstance;
        
        this.showDemoMessage('Testing custom settings... ⚙️');
        
        // Change to single expand mode
        dropdown.updateSettings({
            singleExpand: true,
            animationDuration: 500
        });
        
        setTimeout(() => {
            this.showDemoMessage('Single expand mode enabled! Try opening multiple categories!');
        }, 1000);
        
        // Restore normal settings after 5 seconds
        setTimeout(() => {
            dropdown.updateSettings({
                singleExpand: false,
                animationDuration: 350
            });
            this.showDemoMessage('Settings restored! Multiple categories can be open again!');
        }, 5000);
    }
};

/**
 * Add demo control panel to page
 */
function addDemoControlPanel() {
    const panel = document.createElement('div');
    panel.id = 'dropdown-demo-panel';
    panel.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(10, 10, 10, 0.95);
        border: 1px solid rgba(255, 215, 0, 0.3);
        border-radius: 12px;
        padding: 15px;
        backdrop-filter: blur(10px);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 12px;
        color: #fff;
        max-width: 200px;
    `;
    
    panel.innerHTML = `
        <div style="color: #FFD700; font-weight: 600; margin-bottom: 10px; text-align: center;">
            🎪 Dropdown Demo
        </div>
        <button onclick="dropdownDemo.runFullDemo()" style="width: 100%; margin: 2px 0; padding: 6px; background: linear-gradient(135deg, #FFD700, #FFA500); border: none; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer;">
            🎮 Full Demo
        </button>
        <button onclick="dropdownDemo.testKeyboardNavigation()" style="width: 100%; margin: 2px 0; padding: 6px; background: rgba(255, 215, 0, 0.2); border: 1px solid rgba(255, 215, 0, 0.5); border-radius: 4px; color: #FFD700; font-size: 11px; cursor: pointer;">
            ⌨️ Keyboard Test
        </button>
        <button onclick="dropdownDemo.testAccessibility()" style="width: 100%; margin: 2px 0; padding: 6px; background: rgba(255, 215, 0, 0.2); border: 1px solid rgba(255, 215, 0, 0.5); border-radius: 4px; color: #FFD700; font-size: 11px; cursor: pointer;">
            🔍 A11y Test
        </button>
        <button onclick="dropdownDemo.testPerformance()" style="width: 100%; margin: 2px 0; padding: 6px; background: rgba(255, 215, 0, 0.2); border: 1px solid rgba(255, 215, 0, 0.5); border-radius: 4px; color: #FFD700; font-size: 11px; cursor: pointer;">
            ⚡ Performance
        </button>
        <button onclick="dropdownDemo.getStatus()" style="width: 100%; margin: 2px 0; padding: 6px; background: rgba(255, 215, 0, 0.2); border: 1px solid rgba(255, 215, 0, 0.5); border-radius: 4px; color: #FFD700; font-size: 11px; cursor: pointer;">
            📊 Status
        </button>
        <button onclick="dropdownDemo.testCustomSettings()" style="width: 100%; margin: 2px 0; padding: 6px; background: rgba(255, 215, 0, 0.2); border: 1px solid rgba(255, 215, 0, 0.5); border-radius: 4px; color: #FFD700; font-size: 11px; cursor: pointer;">
            ⚙️ Settings
        </button>
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255, 215, 0, 0.3); font-size: 10px; text-align: center; opacity: 0.7;">
            Luxury Sidebar Dropdown v1.0
        </div>
    `;
    
    document.body.appendChild(panel);
    
    // Make panel draggable
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;
    
    panel.addEventListener('mousedown', (e) => {
        if (e.target.tagName !== 'BUTTON') {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            isDragging = true;
            panel.style.cursor = 'grabbing';
        }
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            xOffset = currentX;
            yOffset = currentY;
            panel.style.transform = `translate(${currentX}px, ${currentY}px)`;
        }
    });
    
    document.addEventListener('mouseup', () => {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
        panel.style.cursor = 'default';
    });
}

// Initialize demo when dropdown system is ready
function initializeDropdownDemo() {
    const sidebar = document.querySelector('.sidebar-luxury');
    if (!sidebar || !sidebar.dropdownInstance) {
        setTimeout(initializeDropdownDemo, 1000);
        return;
    }
    
    addDemoControlPanel();
    console.log('🎮 [DEMO] Demo control panel added');
    console.log('💡 [DEMO] Use window.dropdownDemo for manual testing');
}

// Auto-initialize demo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeDropdownDemo, 2000);
    });
} else {
    setTimeout(initializeDropdownDemo, 2000);
}

console.log('🎮 [DEMO] Dropdown demo script loaded successfully');