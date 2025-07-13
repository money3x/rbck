/**
 * Component Loader - Modular HTML Component Management
 * Loads HTML components dynamically to break down monolithic files
 */

class ComponentLoader {
    constructor() {
        this.cache = new Map();
        this.loadedComponents = new Set();
    }

    /**
     * Load HTML component from file
     * @param {string} componentPath - Path to component file
     * @param {string} targetSelector - CSS selector for target element
     * @param {boolean} cache - Whether to cache the component
     */
    async loadComponent(componentPath, targetSelector, cache = true) {
        try {
            console.log(`🔄 [COMPONENT] Loading: ${componentPath}`);
            
            let html;
            if (cache && this.cache.has(componentPath)) {
                html = this.cache.get(componentPath);
                console.log(`📦 [COMPONENT] Using cached: ${componentPath}`);
            } else {
                const response = await fetch(componentPath);
                if (!response.ok) {
                    throw new Error(`Failed to load component: ${response.status}`);
                }
                html = await response.text();
                
                if (cache) {
                    this.cache.set(componentPath, html);
                }
            }

            const targetElement = document.querySelector(targetSelector);
            if (!targetElement) {
                throw new Error(`Target element not found: ${targetSelector}`);
            }

            targetElement.innerHTML = html;
            this.loadedComponents.add(componentPath);
            
            console.log(`✅ [COMPONENT] Loaded: ${componentPath} → ${targetSelector}`);
            
            // Dispatch custom event for component loaded
            window.dispatchEvent(new CustomEvent('componentLoaded', {
                detail: { componentPath, targetSelector }
            }));
            
            return html;
        } catch (error) {
            console.error(`❌ [COMPONENT] Error loading ${componentPath}:`, error);
            throw error;
        }
    }

    /**
     * Load multiple components in parallel
     * @param {Array} components - Array of {path, target, cache} objects
     */
    async loadComponents(components) {
        console.log(`🔄 [COMPONENT] Loading ${components.length} components in parallel...`);
        
        const promises = components.map(({ path, target, cache = true }) => 
            this.loadComponent(path, target, cache)
        );
        
        try {
            await Promise.all(promises);
            console.log(`✅ [COMPONENT] All ${components.length} components loaded successfully`);
        } catch (error) {
            console.error(`❌ [COMPONENT] Error loading components:`, error);
            throw error;
        }
    }

    /**
     * Reload a component (useful for development)
     * @param {string} componentPath - Path to component file
     * @param {string} targetSelector - CSS selector for target element
     */
    async reloadComponent(componentPath, targetSelector) {
        this.cache.delete(componentPath);
        this.loadedComponents.delete(componentPath);
        return this.loadComponent(componentPath, targetSelector, true);
    }

    /**
     * Check if component is loaded
     * @param {string} componentPath - Path to component file
     */
    isLoaded(componentPath) {
        return this.loadedComponents.has(componentPath);
    }

    /**
     * Get component cache stats
     */
    getCacheStats() {
        return {
            cached: this.cache.size,
            loaded: this.loadedComponents.size,
            components: Array.from(this.loadedComponents)
        };
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        this.loadedComponents.clear();
        console.log('🗑️ [COMPONENT] Cache cleared');
    }
}

// Create global instance
window.componentLoader = new ComponentLoader();

// AI Modal Component Configuration
window.aiModalComponents = {
    header: {
        path: '/frontend/components/ai-modal/modal-header.html',
        target: '#ai-modal-header-container'
    },
    generalTab: {
        path: '/frontend/components/ai-modal/general-tab.html',
        target: '#ai-modal-tabs-container'
    },
    footer: {
        path: '/frontend/components/ai-modal/modal-footer.html',
        target: '#ai-modal-footer-container'
    }
};

/**
 * Initialize AI Modal with components
 */
window.initializeAIModalComponents = async function() {
    console.log('🚀 [AI MODAL] Initializing component-based modal...');
    
    try {
        // Load all AI modal components
        const components = [
            { 
                path: '/frontend/components/ai-modal/modal-header.html', 
                target: '#ai-modal-header-container' 
            },
            { 
                path: '/frontend/components/ai-modal/general-tab.html', 
                target: '#ai-modal-content-container' 
            },
            { 
                path: '/frontend/components/ai-modal/modal-footer.html', 
                target: '#ai-modal-footer-container' 
            }
        ];
        
        await window.componentLoader.loadComponents(components);
        
        // Initialize tab functionality after components are loaded
        if (typeof window.initializeAISettingsTabs === 'function') {
            setTimeout(() => {
                window.initializeAISettingsTabs();
            }, 100);
        }
        
        console.log('✅ [AI MODAL] Component-based modal initialized successfully');
        
    } catch (error) {
        console.error('❌ [AI MODAL] Failed to initialize components:', error);
        // Fallback to original modal if component loading fails
        console.log('🔄 [AI MODAL] Falling back to original modal implementation');
    }
};

/**
 * Performance monitoring for component loading
 */
window.componentPerformance = {
    startTime: Date.now(),
    metrics: [],
    
    recordLoad(componentPath, loadTime) {
        this.metrics.push({
            component: componentPath,
            loadTime,
            timestamp: Date.now()
        });
    },
    
    getStats() {
        const totalLoadTime = this.metrics.reduce((sum, m) => sum + m.loadTime, 0);
        return {
            totalComponents: this.metrics.length,
            totalLoadTime,
            averageLoadTime: totalLoadTime / this.metrics.length || 0,
            slowestComponent: this.metrics.reduce((slowest, current) => 
                current.loadTime > (slowest?.loadTime || 0) ? current : slowest, null)
        };
    }
};

// Monitor component loading performance
window.addEventListener('componentLoaded', (event) => {
    const loadTime = Date.now() - window.componentPerformance.startTime;
    window.componentPerformance.recordLoad(event.detail.componentPath, loadTime);
});

console.log('✅ [COMPONENT LOADER] Component management system initialized');
console.log('🧪 [DEBUG] Use window.componentLoader.getCacheStats() to view cache status');
console.log('📊 [DEBUG] Use window.componentPerformance.getStats() to view performance metrics');