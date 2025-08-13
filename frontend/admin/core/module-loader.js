/**
 * 🚀 PERFORMANCE: Dynamic Module Loader
 * Implements lazy loading and code splitting for optimal performance
 */

class ModuleLoader {
    constructor() {
        this.loadedModules = new Set();
        this.moduleCache = new Map();
        this.loadingPromises = new Map();
    }

    /**
     * Load module dynamically with caching
     * @param {string} modulePath - Path to module
     * @param {boolean} cache - Whether to cache the module
     * @returns {Promise<any>} Module exports
     */
    async loadModule(modulePath, cache = true) {
        // Return cached module if available
        if (cache && this.moduleCache.has(modulePath)) {
            console.log(`⚡ [MODULE LOADER] Cache hit: ${modulePath}`);
            return this.moduleCache.get(modulePath);
        }

        // Return existing loading promise if in progress
        if (this.loadingPromises.has(modulePath)) {
            console.log(`⏳ [MODULE LOADER] Waiting for: ${modulePath}`);
            return this.loadingPromises.get(modulePath);
        }

        console.log(`🔄 [MODULE LOADER] Loading: ${modulePath}`);

        // Create loading promise
        const loadingPromise = this.createLoadingPromise(modulePath);
        this.loadingPromises.set(modulePath, loadingPromise);

        try {
            const module = await loadingPromise;
            
            // Cache successful loads
            if (cache) {
                this.moduleCache.set(modulePath, module);
            }
            
            this.loadedModules.add(modulePath);
            this.loadingPromises.delete(modulePath);
            
            console.log(`✅ [MODULE LOADER] Loaded: ${modulePath}`);
            return module;
        } catch (error) {
            this.loadingPromises.delete(modulePath);
            console.error(`❌ [MODULE LOADER] Failed to load: ${modulePath}`, error);
            throw error;
        }
    }

    /**
     * Create loading promise with timeout and fallbacks
     */
    async createLoadingPromise(modulePath) {
        const timeout = 10000; // 10 second timeout
        
        return Promise.race([
            this.loadScript(modulePath),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error(`Module loading timeout: ${modulePath}`)), timeout)
            )
        ]);
    }

    /**
     * Load script dynamically
     */
    async loadScript(modulePath) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = modulePath;
            script.async = true;
            script.defer = true;
            
            script.onload = () => {
                document.head.removeChild(script);
                resolve(window); // Return window object for global modules
            };
            
            script.onerror = () => {
                document.head.removeChild(script);
                reject(new Error(`Failed to load script: ${modulePath}`));
            };
            
            document.head.appendChild(script);
        });
    }

    /**
     * Load multiple modules in parallel
     */
    async loadModules(moduleList) {
        console.log(`🚀 [MODULE LOADER] Loading ${moduleList.length} modules in parallel...`);
        
        const loadPromises = moduleList.map(async (moduleInfo) => {
            const { path, name, required = false } = typeof moduleInfo === 'string' ? 
                { path: moduleInfo, name: moduleInfo } : moduleInfo;
            
            try {
                const module = await this.loadModule(path);
                return { name, module, success: true };
            } catch (error) {
                if (required) {
                    throw error;
                }
                console.warn(`⚠️ [MODULE LOADER] Optional module failed: ${name}`, error);
                return { name, error, success: false };
            }
        });

        const results = await Promise.allSettled(loadPromises);
        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        
        console.log(`✅ [MODULE LOADER] Loaded ${successful}/${moduleList.length} modules`);
        return results;
    }

    /**
     * Load module when element becomes visible (intersection observer)
     */
    loadOnVisible(element, modulePath, callback) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(async (entry) => {
                if (entry.isIntersecting) {
                    observer.disconnect();
                    try {
                        const module = await this.loadModule(modulePath);
                        if (callback) callback(module);
                    } catch (error) {
                        console.error(`❌ [MODULE LOADER] Visibility-based loading failed:`, error);
                    }
                }
            });
        }, { threshold: 0.1 });

        observer.observe(element);
        return observer;
    }

    /**
     * Load module when user interacts with element
     */
    loadOnInteraction(element, modulePath, callback) {
        const events = ['click', 'touchstart', 'mouseenter', 'focus'];
        
        const loadModule = async () => {
            // Remove event listeners to prevent multiple loads
            events.forEach(event => element.removeEventListener(event, loadModule));
            
            try {
                const module = await this.loadModule(modulePath);
                if (callback) callback(module);
            } catch (error) {
                console.error(`❌ [MODULE LOADER] Interaction-based loading failed:`, error);
            }
        };

        events.forEach(event => element.addEventListener(event, loadModule, { once: true }));
    }

    /**
     * Preload modules with low priority
     */
    preloadModules(moduleList, priority = 'low') {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                this.loadModules(moduleList.map(path => ({ path, cache: true })));
            }, { timeout: 5000 });
        } else {
            // Fallback for browsers without requestIdleCallback
            setTimeout(() => {
                this.loadModules(moduleList.map(path => ({ path, cache: true })));
            }, 2000);
        }
    }

    /**
     * Get loading statistics
     */
    getStats() {
        return {
            loadedModules: this.loadedModules.size,
            cachedModules: this.moduleCache.size,
            activeLoads: this.loadingPromises.size,
            modules: Array.from(this.loadedModules)
        };
    }

    /**
     * Clear cache and reset loader
     */
    clearCache() {
        this.moduleCache.clear();
        this.loadedModules.clear();
        console.log('🧹 [MODULE LOADER] Cache cleared');
    }
}

// Create global instance
window.moduleLoader = new ModuleLoader();

// Export for ES6 modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModuleLoader;
}

console.log('✅ [MODULE LOADER] Dynamic module loader initialized');