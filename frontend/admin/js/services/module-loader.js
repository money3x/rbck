/**
 * 🔌 Dynamic Module Loader for Micro-Frontend Architecture
 * Handles loading and communication between micro-frontend modules
 */

export class ModuleLoader {
    constructor() {
        this.loadedModules = new Map();
        this.moduleRegistry = new Map();
        this.eventBus = new EventTarget();
        this.loadingPromises = new Map();
        this.init();
    }

    /**
     * Initialize the module loader
     */
    init() {
        this.setupGlobalErrorHandling();
        this.setupModuleRegistry();
        this.setupEventBus();
        
        console.log('✅ [ModuleLoader] Module loader initialized');
    }

    /**
     * Setup module registry with available modules
     */
    setupModuleRegistry() {
        this.moduleRegistry.set('aiChat', {
            url: 'http://localhost:3002/remoteEntry.js',
            scope: 'aiChatModule',
            module: './ChatInterface',
            fallback: () => import('../components/chat-interface.js')
        });

        this.moduleRegistry.set('blogManager', {
            url: 'http://localhost:3003/remoteEntry.js',
            scope: 'blogModule', 
            module: './BlogManager',
            fallback: () => import('../../blogManager.js')
        });

        this.moduleRegistry.set('seoTools', {
            url: 'http://localhost:3004/remoteEntry.js',
            scope: 'seoModule',
            module: './SEOTools',
            fallback: () => import('../../seoTools.js')
        });

        this.moduleRegistry.set('aiMonitoring', {
            url: 'http://localhost:3005/remoteEntry.js',
            scope: 'aiMonitoringModule',
            module: './AIMonitoring',
            fallback: () => import('../../aiMonitoring.js')
        });
    }

    /**
     * Load a micro-frontend module
     */
    async loadModule(moduleName) {
        // Return existing module if already loaded
        if (this.loadedModules.has(moduleName)) {
            return this.loadedModules.get(moduleName);
        }

        // Return existing loading promise if module is being loaded
        if (this.loadingPromises.has(moduleName)) {
            return this.loadingPromises.get(moduleName);
        }

        const moduleConfig = this.moduleRegistry.get(moduleName);
        if (!moduleConfig) {
            throw new Error(`Module ${moduleName} not found in registry`);
        }

        // Create loading promise
        const loadingPromise = this.loadRemoteModule(moduleConfig, moduleName);
        this.loadingPromises.set(moduleName, loadingPromise);

        try {
            const module = await loadingPromise;
            this.loadedModules.set(moduleName, module);
            this.loadingPromises.delete(moduleName);
            
            this.emitEvent('moduleLoaded', { moduleName, module });
            console.log(`✅ [ModuleLoader] Module ${moduleName} loaded successfully`);
            
            return module;
            
        } catch (error) {
            this.loadingPromises.delete(moduleName);
            console.error(`❌ [ModuleLoader] Failed to load module ${moduleName}:`, error);
            
            // Try fallback
            if (moduleConfig.fallback) {
                console.log(`🔄 [ModuleLoader] Trying fallback for ${moduleName}`);
                try {
                    const fallbackModule = await moduleConfig.fallback();
                    this.loadedModules.set(moduleName, fallbackModule);
                    this.emitEvent('moduleFallbackLoaded', { moduleName, module: fallbackModule });
                    return fallbackModule;
                } catch (fallbackError) {
                    console.error(`❌ [ModuleLoader] Fallback failed for ${moduleName}:`, fallbackError);
                }
            }
            
            throw error;
        }
    }

    /**
     * Load remote module using Module Federation
     */
    async loadRemoteModule(config, moduleName) {
        try {
            // Load the remote container
            await this.loadScript(config.url);
            
            // Initialize the container
            await window[config.scope].init(__webpack_share_scopes__.default);
            
            // Get the module factory
            const factory = await window[config.scope].get(config.module);
            
            // Get the module
            const module = factory();
            
            return module;
            
        } catch (error) {
            console.error(`❌ [ModuleLoader] Remote module loading failed for ${moduleName}:`, error);
            throw error;
        }
    }

    /**
     * Load script dynamically
     */
    loadScript(url) {
        return new Promise((resolve, reject) => {
            // Check if script is already loaded
            const existingScript = document.querySelector(`script[src="${url}"]`);
            if (existingScript) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.async = true;
            script.src = url;
            
            script.onload = () => {
                console.log(`✅ [ModuleLoader] Script loaded: ${url}`);
                resolve();
            };
            
            script.onerror = () => {
                console.error(`❌ [ModuleLoader] Script failed to load: ${url}`);
                reject(new Error(`Failed to load script: ${url}`));
            };
            
            document.head.appendChild(script);
        });
    }

    /**
     * Preload modules for better performance
     */
    async preloadModules(moduleNames) {
        console.log(`🔄 [ModuleLoader] Preloading modules:`, moduleNames);
        
        const preloadPromises = moduleNames.map(moduleName => {
            const config = this.moduleRegistry.get(moduleName);
            if (config) {
                return this.loadScript(config.url).catch(error => {
                    console.warn(`⚠️ [ModuleLoader] Preload failed for ${moduleName}:`, error);
                });
            }
        });

        await Promise.allSettled(preloadPromises);
        console.log(`✅ [ModuleLoader] Preloading completed`);
    }

    /**
     * Lazy load module when needed
     */
    async lazyLoadModule(moduleName, container) {
        try {
            console.log(`🔄 [ModuleLoader] Lazy loading ${moduleName}`);
            
            // Show loading indicator
            if (container) {
                container.innerHTML = `
                    <div class="module-loading">
                        <div class="loading-spinner"></div>
                        <p>Loading ${moduleName}...</p>
                    </div>
                `;
            }

            const module = await this.loadModule(moduleName);
            
            // Initialize module in container
            if (container && module.default) {
                container.innerHTML = '';
                
                if (typeof module.default === 'function') {
                    // If module exports a component/class
                    const instance = new module.default();
                    if (instance.render) {
                        instance.render(container);
                    }
                } else if (module.default.mount) {
                    // If module has a mount function
                    module.default.mount(container);
                }
            }

            return module;
            
        } catch (error) {
            console.error(`❌ [ModuleLoader] Lazy loading failed for ${moduleName}:`, error);
            
            if (container) {
                container.innerHTML = `
                    <div class="module-error">
                        <h3>⚠️ Module Loading Failed</h3>
                        <p>Failed to load ${moduleName}</p>
                        <button onclick="window.moduleLoader.lazyLoadModule('${moduleName}', this.parentElement.parentElement)">
                            Retry
                        </button>
                    </div>
                `;
            }
            
            throw error;
        }
    }

    /**
     * Setup event bus for inter-module communication
     */
    setupEventBus() {
        // Make event bus globally available
        window.moduleEventBus = this.eventBus;
        
        // Setup standard events
        this.on('themeChanged', (event) => {
            this.broadcastToModules('themeChanged', event.detail);
        });

        this.on('authStateChanged', (event) => {
            this.broadcastToModules('authStateChanged', event.detail);
        });
    }

    /**
     * Broadcast event to all loaded modules
     */
    broadcastToModules(eventType, data) {
        this.loadedModules.forEach((module, moduleName) => {
            if (module.onGlobalEvent) {
                try {
                    module.onGlobalEvent(eventType, data);
                } catch (error) {
                    console.error(`❌ [ModuleLoader] Event broadcast failed for ${moduleName}:`, error);
                }
            }
        });
    }

    /**
     * Emit event on the event bus
     */
    emitEvent(type, data) {
        const event = new CustomEvent(type, { detail: data });
        this.eventBus.dispatchEvent(event);
    }

    /**
     * Listen to events on the event bus
     */
    on(type, listener) {
        this.eventBus.addEventListener(type, listener);
    }

    /**
     * Remove event listener
     */
    off(type, listener) {
        this.eventBus.removeEventListener(type, listener);
    }

    /**
     * Setup global error handling for modules
     */
    setupGlobalErrorHandling() {
        window.addEventListener('error', (event) => {
            if (event.filename && event.filename.includes('remoteEntry.js')) {
                console.error('❌ [ModuleLoader] Remote module error:', event.error);
                this.emitEvent('moduleError', {
                    filename: event.filename,
                    error: event.error,
                    message: event.message
                });
            }
        });

        window.addEventListener('unhandledrejection', (event) => {
            if (event.reason && event.reason.message && event.reason.message.includes('Module Federation')) {
                console.error('❌ [ModuleLoader] Module Federation error:', event.reason);
                this.emitEvent('moduleError', {
                    type: 'module-federation',
                    error: event.reason
                });
            }
        });
    }

    /**
     * Get module loading status
     */
    getModuleStatus(moduleName) {
        return {
            isLoaded: this.loadedModules.has(moduleName),
            isLoading: this.loadingPromises.has(moduleName),
            isRegistered: this.moduleRegistry.has(moduleName)
        };
    }

    /**
     * Get all loaded modules
     */
    getLoadedModules() {
        return Array.from(this.loadedModules.keys());
    }

    /**
     * Unload a module
     */
    unloadModule(moduleName) {
        if (this.loadedModules.has(moduleName)) {
            const module = this.loadedModules.get(moduleName);
            
            // Call cleanup if available
            if (module.cleanup) {
                try {
                    module.cleanup();
                } catch (error) {
                    console.error(`❌ [ModuleLoader] Cleanup failed for ${moduleName}:`, error);
                }
            }
            
            this.loadedModules.delete(moduleName);
            this.emitEvent('moduleUnloaded', { moduleName });
            
            console.log(`✅ [ModuleLoader] Module ${moduleName} unloaded`);
        }
    }

    /**
     * Reload a module
     */
    async reloadModule(moduleName) {
        this.unloadModule(moduleName);
        return this.loadModule(moduleName);
    }

    /**
     * Health check for all modules
     */
    async healthCheck() {
        const results = {};
        
        for (const moduleName of this.moduleRegistry.keys()) {
            try {
                const config = this.moduleRegistry.get(moduleName);
                const response = await fetch(config.url, { method: 'HEAD' });
                results[moduleName] = {
                    status: response.ok ? 'healthy' : 'unhealthy',
                    responseTime: performance.now()
                };
            } catch (error) {
                results[moduleName] = {
                    status: 'error',
                    error: error.message
                };
            }
        }
        
        return results;
    }

    /**
     * Get module loader statistics
     */
    getStats() {
        return {
            totalModules: this.moduleRegistry.size,
            loadedModules: this.loadedModules.size,
            loadingModules: this.loadingPromises.size,
            moduleNames: Array.from(this.moduleRegistry.keys()),
            loadedModuleNames: Array.from(this.loadedModules.keys())
        };
    }
}

// Export for global access
export default ModuleLoader;