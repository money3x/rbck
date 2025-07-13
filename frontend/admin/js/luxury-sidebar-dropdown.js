/* ========================================
   LUXURY SIDEBAR DROPDOWN FUNCTIONALITY
   Premium collapsible navigation system
======================================== */

console.log('🎪 [DROPDOWN] Loading luxury sidebar dropdown system...');

/**
 * LuxurySidebarDropdown Class
 * Handles all dropdown functionality for the luxury sidebar
 * Features: Smooth animations, accessibility, keyboard support, state management
 */
class LuxurySidebarDropdown {
    constructor(sidebarElement) {
        this.sidebar = sidebarElement;
        this.categories = [];
        this.expandedCategories = new Set();
        this.isInitialized = false;
        this.settings = {
            defaultExpanded: ['Dashboard'], // Categories that start expanded
            singleExpand: false, // Allow multiple categories to be expanded
            rememberState: true, // Remember expanded state in localStorage
            animationDuration: 350,
            keyboardSupport: true
        };
        
        console.log('🎪 [DROPDOWN] Initializing dropdown system...');
        this.init();
    }
    
    /**
     * Initialize dropdown system
     */
    init() {
        try {
            this.setupCategories();
            this.loadSavedState();
            this.setupEventListeners();
            this.setupKeyboardNavigation();
            this.setupAccessibility();
            this.applyInitialStates();
            
            this.isInitialized = true;
            console.log('✅ [DROPDOWN] Dropdown system initialized successfully');
        } catch (error) {
            console.error('❌ [DROPDOWN] Initialization failed:', error);
        }
    }
    
    /**
     * Setup dropdown categories
     */
    setupCategories() {
        const categories = this.sidebar.querySelectorAll('.nav-category');
        
        categories.forEach((category, index) => {
            const header = category.querySelector('.category-header');
            const subMenu = category.querySelector('.sub-menu-grid');
            const categoryText = header.querySelector('span')?.textContent?.trim();
            
            if (!header || !subMenu) return;
            
            // Add dropdown classes
            category.classList.add('dropdown-enabled');
            header.classList.add('dropdown-header');
            
            // Create dropdown indicator
            const indicator = this.createDropdownIndicator();
            header.appendChild(indicator);
            
            // Add data attributes
            category.setAttribute('data-category', categoryText || `category-${index}`);
            category.setAttribute('data-category-index', index);
            header.setAttribute('tabindex', '0');
            header.setAttribute('role', 'button');
            header.setAttribute('aria-expanded', 'false');
            header.setAttribute('aria-controls', `submenu-${index}`);
            
            subMenu.setAttribute('id', `submenu-${index}`);
            subMenu.setAttribute('role', 'region');
            subMenu.setAttribute('aria-labelledby', `header-${index}`);
            header.setAttribute('id', `header-${index}`);
            
            // Store category info
            this.categories.push({
                element: category,
                header: header,
                subMenu: subMenu,
                indicator: indicator,
                name: categoryText || `category-${index}`,
                index: index,
                expanded: false
            });
        });
        
        console.log(`🎪 [DROPDOWN] Setup ${this.categories.length} dropdown categories`);
    }
    
    /**
     * Create dropdown indicator (chevron)
     */
    createDropdownIndicator() {
        const indicator = document.createElement('i');
        indicator.className = 'fas fa-chevron-down dropdown-indicator';
        indicator.setAttribute('aria-hidden', 'true');
        indicator.setAttribute('aria-label', 'Toggle submenu');
        return indicator;
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        this.categories.forEach(category => {
            // Click handler for category header
            category.header.addEventListener('click', (event) => {
                event.preventDefault();
                this.toggleCategory(category);
            });
            
            // Prevent clicks on indicator from bubbling
            category.indicator.addEventListener('click', (event) => {
                event.stopPropagation();
                this.toggleCategory(category);
            });
        });
        
        console.log('🎪 [DROPDOWN] Event listeners attached');
    }
    
    /**
     * Setup keyboard navigation
     */
    setupKeyboardNavigation() {
        if (!this.settings.keyboardSupport) return;
        
        this.categories.forEach(category => {
            category.header.addEventListener('keydown', (event) => {
                switch (event.key) {
                    case 'Enter':
                    case ' ':
                        event.preventDefault();
                        this.toggleCategory(category);
                        break;
                    case 'ArrowUp':
                        event.preventDefault();
                        this.focusPreviousCategory(category);
                        break;
                    case 'ArrowDown':
                        event.preventDefault();
                        this.focusNextCategory(category);
                        break;
                    case 'Home':
                        event.preventDefault();
                        this.focusFirstCategory();
                        break;
                    case 'End':
                        event.preventDefault();
                        this.focusLastCategory();
                        break;
                }
            });
        });
        
        console.log('🎪 [DROPDOWN] Keyboard navigation configured');
    }
    
    /**
     * Setup accessibility features
     */
    setupAccessibility() {
        // Add screen reader announcements
        if (!document.querySelector('#dropdown-announcements')) {
            const announcements = document.createElement('div');
            announcements.id = 'dropdown-announcements';
            announcements.setAttribute('aria-live', 'polite');
            announcements.setAttribute('aria-atomic', 'true');
            announcements.className = 'sr-only';
            document.body.appendChild(announcements);
        }
        
        console.log('🎪 [DROPDOWN] Accessibility features configured');
    }
    
    /**
     * Toggle category expanded/collapsed state
     */
    toggleCategory(category) {
        const wasExpanded = category.expanded;
        
        // Handle single expand mode
        if (this.settings.singleExpand && !wasExpanded) {
            this.collapseAllCategories();
        }
        
        if (wasExpanded) {
            this.collapseCategory(category);
        } else {
            this.expandCategory(category);
        }
        
        // Save state
        if (this.settings.rememberState) {
            this.saveState();
        }
        
        // Announce to screen readers
        this.announceStateChange(category);
    }
    
    /**
     * Expand a category
     */
    expandCategory(category) {
        category.expanded = true;
        category.element.classList.remove('collapsed');
        category.element.classList.add('expanded', 'expanding');
        category.header.setAttribute('aria-expanded', 'true');
        
        // Add to expanded set
        this.expandedCategories.add(category.name);
        
        // Remove expanding class after animation
        setTimeout(() => {
            category.element.classList.remove('expanding');
        }, this.settings.animationDuration);
        
        console.log(`🎪 [DROPDOWN] Expanded: ${category.name}`);
    }
    
    /**
     * Collapse a category
     */
    collapseCategory(category) {
        category.expanded = false;
        category.element.classList.remove('expanded', 'expanding');
        category.element.classList.add('collapsed');
        category.header.setAttribute('aria-expanded', 'false');
        
        // Remove from expanded set
        this.expandedCategories.delete(category.name);
        
        console.log(`🎪 [DROPDOWN] Collapsed: ${category.name}`);
    }
    
    /**
     * Collapse all categories
     */
    collapseAllCategories() {
        this.categories.forEach(category => {
            if (category.expanded && !this.settings.defaultExpanded.includes(category.name)) {
                this.collapseCategory(category);
            }
        });
    }
    
    /**
     * Expand all categories
     */
    expandAllCategories() {
        this.categories.forEach(category => {
            if (!category.expanded) {
                this.expandCategory(category);
            }
        });
    }
    
    /**
     * Apply initial states based on settings
     */
    applyInitialStates() {
        this.categories.forEach(category => {
            const shouldBeExpanded = this.settings.defaultExpanded.includes(category.name) ||
                                   this.expandedCategories.has(category.name);
            
            if (shouldBeExpanded) {
                // Set expanded state without animation for initial load
                category.expanded = true;
                category.element.classList.add('expanded');
                category.element.classList.remove('collapsed');
                category.header.setAttribute('aria-expanded', 'true');
                this.expandedCategories.add(category.name);
            } else {
                // Set collapsed state
                category.expanded = false;
                category.element.classList.add('collapsed');
                category.element.classList.remove('expanded');
                category.header.setAttribute('aria-expanded', 'false');
            }
        });
        
        console.log('🎪 [DROPDOWN] Initial states applied');
    }
    
    /**
     * Focus navigation methods
     */
    focusPreviousCategory(currentCategory) {
        const currentIndex = currentCategory.index;
        const previousIndex = currentIndex > 0 ? currentIndex - 1 : this.categories.length - 1;
        this.categories[previousIndex].header.focus();
    }
    
    focusNextCategory(currentCategory) {
        const currentIndex = currentCategory.index;
        const nextIndex = currentIndex < this.categories.length - 1 ? currentIndex + 1 : 0;
        this.categories[nextIndex].header.focus();
    }
    
    focusFirstCategory() {
        if (this.categories.length > 0) {
            this.categories[0].header.focus();
        }
    }
    
    focusLastCategory() {
        if (this.categories.length > 0) {
            this.categories[this.categories.length - 1].header.focus();
        }
    }
    
    /**
     * State management
     */
    saveState() {
        if (!this.settings.rememberState) return;
        
        const expandedNames = Array.from(this.expandedCategories);
        localStorage.setItem('luxurySidebarDropdownState', JSON.stringify(expandedNames));
    }
    
    loadSavedState() {
        if (!this.settings.rememberState) return;
        
        try {
            const saved = localStorage.getItem('luxurySidebarDropdownState');
            if (saved) {
                const expandedNames = JSON.parse(saved);
                expandedNames.forEach(name => {
                    this.expandedCategories.add(name);
                });
                console.log('🎪 [DROPDOWN] Loaded saved state:', expandedNames);
            }
        } catch (error) {
            console.warn('🎪 [DROPDOWN] Could not load saved state:', error);
        }
    }
    
    /**
     * Announce state changes to screen readers
     */
    announceStateChange(category) {
        const announcements = document.querySelector('#dropdown-announcements');
        if (!announcements) return;
        
        const state = category.expanded ? 'expanded' : 'collapsed';
        announcements.textContent = `${category.name} menu ${state}`;
        
        // Clear announcement after delay
        setTimeout(() => {
            announcements.textContent = '';
        }, 1000);
    }
    
    /**
     * Public API methods
     */
    
    /**
     * Get category by name
     */
    getCategoryByName(name) {
        return this.categories.find(cat => cat.name === name);
    }
    
    /**
     * Expand category by name
     */
    expandCategoryByName(name) {
        const category = this.getCategoryByName(name);
        if (category && !category.expanded) {
            this.expandCategory(category);
        }
    }
    
    /**
     * Collapse category by name
     */
    collapseCategoryByName(name) {
        const category = this.getCategoryByName(name);
        if (category && category.expanded) {
            this.collapseCategory(category);
        }
    }
    
    /**
     * Get expanded categories
     */
    getExpandedCategories() {
        return this.categories.filter(cat => cat.expanded);
    }
    
    /**
     * Update settings
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        console.log('🎪 [DROPDOWN] Settings updated:', this.settings);
    }
    
    /**
     * Destroy dropdown system
     */
    destroy() {
        // Remove event listeners
        this.categories.forEach(category => {
            category.header.removeEventListener('click', this.toggleCategory);
            category.header.removeEventListener('keydown', this.setupKeyboardNavigation);
        });
        
        // Remove classes and attributes
        this.categories.forEach(category => {
            category.element.classList.remove('dropdown-enabled', 'expanded', 'collapsed');
            category.header.classList.remove('dropdown-header');
            category.indicator.remove();
        });
        
        // Remove announcements
        const announcements = document.querySelector('#dropdown-announcements');
        if (announcements) announcements.remove();
        
        this.isInitialized = false;
        console.log('🎪 [DROPDOWN] Dropdown system destroyed');
    }
}

// ========================================
// AUTO-INITIALIZATION
// ========================================

/**
 * Initialize dropdown system when luxury sidebar is ready
 */
function initializeLuxurySidebarDropdown() {
    // Wait for luxury sidebar to be initialized
    const sidebar = document.querySelector('.sidebar-luxury');
    if (!sidebar || !sidebar.luxurySidebarInstance) {
        setTimeout(initializeLuxurySidebarDropdown, 500);
        return;
    }
    
    // Avoid double initialization
    if (sidebar.dropdownInstance) {
        console.log('🎪 [DROPDOWN] Already initialized, skipping...');
        return sidebar.dropdownInstance;
    }
    
    const instance = new LuxurySidebarDropdown(sidebar);
    sidebar.dropdownInstance = instance;
    
    console.log('✅ [DROPDOWN] Auto-initialization complete');
    return instance;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeLuxurySidebarDropdown, 1500);
    });
} else {
    // DOM is already ready
    setTimeout(initializeLuxurySidebarDropdown, 1500);
}

// Expose to global scope
window.LuxurySidebarDropdown = LuxurySidebarDropdown;
window.initializeLuxurySidebarDropdown = initializeLuxurySidebarDropdown;

// Quick access functions for manual control
window.expandAllSidebarCategories = function() {
    const sidebar = document.querySelector('.sidebar-luxury');
    if (sidebar && sidebar.dropdownInstance) {
        sidebar.dropdownInstance.expandAllCategories();
    }
};

window.collapseAllSidebarCategories = function() {
    const sidebar = document.querySelector('.sidebar-luxury');
    if (sidebar && sidebar.dropdownInstance) {
        sidebar.dropdownInstance.collapseAllCategories();
    }
};

console.log('🎪 [DROPDOWN] Luxury sidebar dropdown module loaded successfully');
console.log('💡 [DROPDOWN] Use expandAllSidebarCategories() or collapseAllSidebarCategories() for manual control');