/* ========================================
   LUXURY SIDEBAR INTERACTIVE BEHAVIOR
   Production-Ready JavaScript Class
======================================== */

console.log('🎭 [LUXURY SIDEBAR] Loading interactive behavior system...');

/**
 * LuxurySidebar Class
 * Handles all interactive behaviors for the luxury sidebar
 * Features: Keyboard navigation, focus management, accessibility, performance optimization
 */
class LuxurySidebar {
    constructor(element) {
        this.sidebar = element;
        this.activeItem = null;
        this.navItems = [];
        this.isInitialized = false;
        
        console.log('🎭 [LUXURY SIDEBAR] Initializing sidebar behavior...');
        this.init();
    }
    
    /**
     * Initialize all sidebar behaviors
     */
    init() {
        try {
            this.cacheElements();
            this.setupEventListeners();
            this.setupKeyboardNavigation();
            this.setupAccessibility();
            this.setupPerformanceOptimizations();
            this.setInitialState();
            
            this.isInitialized = true;
            console.log('✅ [LUXURY SIDEBAR] Sidebar behavior initialized successfully');
        } catch (error) {
            console.error('❌ [LUXURY SIDEBAR] Initialization failed:', error);
        }
    }
    
    /**
     * Cache DOM elements for performance
     */
    cacheElements() {
        this.navItems = Array.from(this.sidebar.querySelectorAll('.sidebar-nav-item'));
        this.categories = Array.from(this.sidebar.querySelectorAll('.nav-category'));
        this.header = this.sidebar.querySelector('.sidebar-header');
        
        console.log(`🎭 [LUXURY SIDEBAR] Cached ${this.navItems.length} navigation items`);
    }
    
    /**
     * Set up event listeners with performance optimization
     */
    setupEventListeners() {
        // Event delegation for better performance
        this.sidebar.addEventListener('click', this.handleClick.bind(this));
        this.sidebar.addEventListener('keydown', this.handleKeydown.bind(this));
        
        // Throttled hover events for smooth animations
        this.sidebar.addEventListener('mouseover', 
            this.throttle(this.handleHover.bind(this), 16)
        );
        
        this.sidebar.addEventListener('mouseout', 
            this.throttle(this.handleMouseOut.bind(this), 16)
        );
        
        // Focus events for accessibility
        this.sidebar.addEventListener('focusin', this.handleFocusIn.bind(this));
        this.sidebar.addEventListener('focusout', this.handleFocusOut.bind(this));
        
        console.log('🎭 [LUXURY SIDEBAR] Event listeners attached');
    }
    
    /**
     * Handle click events on navigation items
     */
    handleClick(event) {
        const navItem = event.target.closest('.sidebar-nav-item');
        if (!navItem) return;
        
        // Prevent double-clicking issues
        if (navItem.dataset.clicking === 'true') return;
        navItem.dataset.clicking = 'true';
        
        // Performance: Use requestAnimationFrame for smooth updates
        requestAnimationFrame(() => {
            this.setActiveItem(navItem);
            this.announceToScreenReader(navItem.textContent.trim());
            
            // Reset click protection
            setTimeout(() => {
                delete navItem.dataset.clicking;
            }, 100);
        });
    }
    
    /**
     * Handle hover events with smooth animations
     */
    handleHover(event) {
        const navItem = event.target.closest('.sidebar-nav-item');
        if (!navItem) return;
        
        // Add hover enhancement
        requestAnimationFrame(() => {
            navItem.style.setProperty('--hover-intensity', '1');
        });
    }
    
    /**
     * Handle mouse out events
     */
    handleMouseOut(event) {
        const navItem = event.target.closest('.sidebar-nav-item');
        if (!navItem) return;
        
        requestAnimationFrame(() => {
            navItem.style.removeProperty('--hover-intensity');
        });
    }
    
    /**
     * Set active navigation item with smooth transitions
     */
    setActiveItem(item) {
        // Remove previous active state
        if (this.activeItem && this.activeItem !== item) {
            this.activeItem.classList.remove('active');
            this.activeItem.setAttribute('aria-current', 'false');
        }
        
        // Set new active state
        item.classList.add('active');
        item.setAttribute('aria-current', 'page');
        this.activeItem = item;
        
        // Smooth scroll into view if needed
        this.ensureItemVisible(item);
        
        console.log('🎭 [LUXURY SIDEBAR] Active item set:', item.textContent.trim());
    }
    
    /**
     * Ensure item is visible in sidebar with smooth scrolling
     */
    ensureItemVisible(item) {
        const navMenu = this.sidebar.querySelector('.nav-menu');
        if (!navMenu) return;
        
        const itemRect = item.getBoundingClientRect();
        const menuRect = navMenu.getBoundingClientRect();
        
        if (itemRect.top < menuRect.top || itemRect.bottom > menuRect.bottom) {
            item.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'nearest'
            });
        }
    }
    
    /**
     * Setup keyboard navigation for accessibility
     */
    setupKeyboardNavigation() {
        this.navItems.forEach((item, index) => {
            // Set initial tabindex
            item.setAttribute('tabindex', index === 0 ? '0' : '-1');
            
            // Add keyboard support indicators
            item.setAttribute('data-keyboard-nav', 'true');
        });
        
        console.log('🎭 [LUXURY SIDEBAR] Keyboard navigation configured');
    }
    
    /**
     * Handle keyboard navigation
     */
    handleKeydown(event) {
        const { key, target } = event;
        const currentItem = target.closest('.sidebar-nav-item');
        
        if (!currentItem) return;
        
        const currentIndex = this.navItems.indexOf(currentItem);
        let targetIndex = currentIndex;
        
        switch (key) {
            case 'ArrowDown':
                targetIndex = (currentIndex + 1) % this.navItems.length;
                break;
            case 'ArrowUp':
                targetIndex = currentIndex > 0 ? currentIndex - 1 : this.navItems.length - 1;
                break;
            case 'Home':
                targetIndex = 0;
                break;
            case 'End':
                targetIndex = this.navItems.length - 1;
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                currentItem.click();
                return;
            default:
                return;
        }
        
        event.preventDefault();
        this.focusItem(this.navItems[targetIndex]);
    }
    
    /**
     * Focus specific navigation item
     */
    focusItem(item) {
        // Update tabindex for roving tabindex pattern
        this.navItems.forEach(navItem => {
            navItem.setAttribute('tabindex', '-1');
        });
        
        item.setAttribute('tabindex', '0');
        item.focus();
        
        // Ensure focused item is visible
        this.ensureItemVisible(item);
    }
    
    /**
     * Handle focus in events
     */
    handleFocusIn(event) {
        const navItem = event.target.closest('.sidebar-nav-item');
        if (!navItem) return;
        
        // Add focus enhancement
        navItem.setAttribute('data-focused', 'true');
        this.sidebar.setAttribute('data-has-focus', 'true');
    }
    
    /**
     * Handle focus out events
     */
    handleFocusOut(event) {
        const navItem = event.target.closest('.sidebar-nav-item');
        if (!navItem) return;
        
        navItem.removeAttribute('data-focused');
        
        // Check if focus is still within sidebar
        setTimeout(() => {
            if (!this.sidebar.contains(document.activeElement)) {
                this.sidebar.removeAttribute('data-has-focus');
            }
        }, 10);
    }
    
    /**
     * Setup accessibility features
     */
    setupAccessibility() {
        // Add screen reader only content
        if (!document.querySelector('.sr-only-styles')) {
            const style = document.createElement('style');
            style.className = 'sr-only-styles';
            style.textContent = `
                .sr-only {
                    position: absolute;
                    width: 1px;
                    height: 1px;
                    padding: 0;
                    margin: -1px;
                    overflow: hidden;
                    clip: rect(0, 0, 0, 0);
                    white-space: nowrap;
                    border: 0;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Set up ARIA live region for announcements
        if (!document.querySelector('#sidebar-announcements')) {
            const liveRegion = document.createElement('div');
            liveRegion.id = 'sidebar-announcements';
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.className = 'sr-only';
            document.body.appendChild(liveRegion);
        }
        
        console.log('🎭 [LUXURY SIDEBAR] Accessibility features configured');
    }
    
    /**
     * Setup performance optimizations
     */
    setupPerformanceOptimizations() {
        // Enable CSS containment for better performance
        this.sidebar.style.contain = 'layout style';
        
        // Add hardware acceleration hints
        this.sidebar.style.willChange = 'transform';
        
        // Optimize for touch devices
        if ('ontouchstart' in window) {
            this.sidebar.style.touchAction = 'pan-y';
        }
        
        console.log('🎭 [LUXURY SIDEBAR] Performance optimizations applied');
    }
    
    /**
     * Set initial state
     */
    setInitialState() {
        // Find and set the initially active item
        const activeItem = this.sidebar.querySelector('.sidebar-nav-item.active') || 
                          this.sidebar.querySelector('.sidebar-nav-item[aria-current="page"]') ||
                          this.navItems[0];
        
        if (activeItem) {
            this.setActiveItem(activeItem);
        }
        
        // Add CSS class to indicate JavaScript is loaded
        this.sidebar.classList.add('sidebar-enhanced');
        
        console.log('🎭 [LUXURY SIDEBAR] Initial state configured');
    }
    
    /**
     * Announce navigation changes to screen readers
     */
    announceToScreenReader(text) {
        const liveRegion = document.querySelector('#sidebar-announcements');
        if (!liveRegion) return;
        
        liveRegion.textContent = `Navigated to ${text}`;
        
        // Clear announcement after a delay
        setTimeout(() => {
            liveRegion.textContent = '';
        }, 1000);
    }
    
    /**
     * Throttle function for performance optimization
     */
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    /**
     * Public method to add new navigation item
     */
    addNavItem(item) {
        if (this.isInitialized) {
            this.cacheElements();
            this.setupKeyboardNavigation();
        }
    }
    
    /**
     * Public method to remove navigation item
     */
    removeNavItem(item) {
        if (this.activeItem === item) {
            this.activeItem = null;
        }
        
        if (this.isInitialized) {
            this.cacheElements();
            this.setupKeyboardNavigation();
        }
    }
    
    /**
     * Public method to get current active item
     */
    getActiveItem() {
        return this.activeItem;
    }
    
    /**
     * Public method to destroy sidebar behavior
     */
    destroy() {
        // Remove event listeners
        this.sidebar.removeEventListener('click', this.handleClick);
        this.sidebar.removeEventListener('keydown', this.handleKeydown);
        this.sidebar.removeEventListener('mouseover', this.handleHover);
        this.sidebar.removeEventListener('mouseout', this.handleMouseOut);
        this.sidebar.removeEventListener('focusin', this.handleFocusIn);
        this.sidebar.removeEventListener('focusout', this.handleFocusOut);
        
        // Clean up DOM modifications
        this.sidebar.classList.remove('sidebar-enhanced');
        this.sidebar.removeAttribute('data-has-focus');
        
        this.isInitialized = false;
        console.log('🎭 [LUXURY SIDEBAR] Sidebar behavior destroyed');
    }
}

// ========================================
// AUTO-INITIALIZATION
// ========================================

/**
 * Initialize luxury sidebar when DOM is ready
 */
function initializeLuxurySidebar() {
    const sidebar = document.querySelector('.sidebar-luxury');
    
    if (sidebar) {
        // Avoid double initialization
        if (sidebar.luxurySidebarInstance) {
            console.log('🎭 [LUXURY SIDEBAR] Already initialized, skipping...');
            return sidebar.luxurySidebarInstance;
        }
        
        const instance = new LuxurySidebar(sidebar);
        sidebar.luxurySidebarInstance = instance;
        
        console.log('✅ [LUXURY SIDEBAR] Auto-initialization complete');
        return instance;
    } else {
        console.warn('⚠️ [LUXURY SIDEBAR] Sidebar element not found');
        return null;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLuxurySidebar);
} else {
    // DOM is already ready
    initializeLuxurySidebar();
}

// Expose to global scope for manual initialization
window.LuxurySidebar = LuxurySidebar;
window.initializeLuxurySidebar = initializeLuxurySidebar;

// ES Module exports
export { LuxurySidebar, initializeLuxurySidebar };
export default LuxurySidebar;

console.log('🎭 [LUXURY SIDEBAR] JavaScript module loaded successfully');