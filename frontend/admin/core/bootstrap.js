// ⚡ PERFORMANCE: Bootstrap Module (15KB vs 3.2MB)
// Minimal bootstrap that loads modules on-demand

/**
 * 🚀 RBCK CMS High-Performance Bootstrap
 * Loads critical modules first, defers non-critical ones
 */

class PerformanceBootstrap {
    constructor() {
        this.loadTimes = new Map();
        this.modules = new Map();
        this.criticalModulesLoaded = false;
        
        console.log('⚡ [BOOTSTRAP] Starting high-performance initialization...');
        this.startTime = performance.now();
    }

    /**
     * ⚡ OPTIMIZED: Critical path initialization
     */
    async init() {
        try {
            // ⚡ Phase 1: Critical modules (parallel loading)
            await this.loadCriticalModules();
            
            // ⚡ Phase 2: Authentication check (fast path)
            await this.initializeAuthentication();
            
            // ⚡ Phase 3: Deferred loading (non-blocking)
            this.scheduleDeferredLoading();
            
            // ⚡ Phase 4: Performance monitoring
            this.initializePerformanceMonitoring();
            
            console.log(`⚡ [BOOTSTRAP] Initialization complete (${(performance.now() - this.startTime).toFixed(1)}ms)`);
            
        } catch (error) {
            console.error('❌ [BOOTSTRAP] Initialization failed:', error);
            this.fallbackInitialization();
        }
    }

    /**
     * ⚡ OPTIMIZED: Load critical modules in parallel
     */
    async loadCriticalModules() {
        const criticalModules = [
            { name: 'auth', path: './auth.js' },
            { name: 'api', path: './api-client.js' }
        ];

        console.log('⚡ [BOOTSTRAP] Loading critical modules...');
        
        // ⚡ Parallel loading with performance tracking
        const loadPromises = criticalModules.map(async (module) => {
            const startTime = performance.now();
            
            try {
                const moduleExport = await import(module.path);
                const loadTime = performance.now() - startTime;
                
                this.modules.set(module.name, moduleExport.default);
                this.loadTimes.set(module.name, loadTime);
                
                console.log(`✅ [BOOTSTRAP] ${module.name} loaded (${loadTime.toFixed(1)}ms)`);
                return moduleExport;
                
            } catch (error) {
                console.error(`❌ [BOOTSTRAP] Failed to load ${module.name}:`, error);
                throw error;
            }
        });

        await Promise.all(loadPromises);
        this.criticalModulesLoaded = true;
    }

    /**
     * ⚡ OPTIMIZED: Fast authentication initialization
     */
    async initializeAuthentication() {
        const authModule = this.modules.get('auth');
        if (!authModule) {
            throw new Error('Authentication module not loaded');
        }

        console.log('⚡ [BOOTSTRAP] Initializing authentication...');
        
        // ⚡ Make auth available globally for backward compatibility
        window.authManager = authModule;
        window.checkAuthentication = () => authModule.checkAuthentication();
        window.logout = () => authModule.logout();
        window.redirectToLogin = () => authModule.redirectToLogin();

        // ⚡ Initialize API client with auth
        const apiModule = this.modules.get('api');
        if (apiModule) {
            window.api = apiModule;
        }

        // ⚡ Start authentication check (non-blocking)
        setTimeout(() => authModule.checkAuthentication(), 0);
    }

    /**
     * ⚡ OPTIMIZED: Deferred loading strategy
     */
    scheduleDeferredLoading() {
        // ⚡ Load UI modules when user interacts
        this.addInteractionListeners();
        
        // ⚡ Load admin modules when needed
        this.addAdminModuleLoaders();
        
        // ⚡ Preload likely-needed modules
        this.schedulePreloading();
    }

    /**
     * ⚡ OPTIMIZED: Interaction-based loading
     */
    addInteractionListeners() {
        // ⚡ Load AI modal when AI button clicked
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-module="ai-modal"]')) {
                this.loadModule('ai-modal', '../modals.js');
            }
        });

        // ⚡ Load security dashboard when security menu clicked
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-module="security"]')) {
                this.loadModule('security', '../js/security-dashboard.js');
            }
        });

        // ⚡ Load sidebar when first interaction
        let sidebarLoaded = false;
        // REMOVED: luxury-sidebar.js loading (unused component)
    }

    /**
     * ⚡ OPTIMIZED: Admin-specific module loading
     */
    addAdminModuleLoaders() {
        // ⚡ Load performance monitoring when needed
        window.loadPerformanceModule = () => {
            return this.loadModule('performance', '../js/performance-monitor.js');
        };

        // ⚡ Load debug tools in development
        if (window.location.hostname.includes('localhost')) {
            setTimeout(() => {
                this.loadModule('debug', '../js/debug-tools.js');
            }, 2000);
        }
    }

    /**
     * ⚡ OPTIMIZED: Predictive module preloading
     */
    schedulePreloading() {
        // ⚡ Preload likely modules after critical path
        setTimeout(() => {
            this.preloadModules([
                '../modals.js'
            ]);
        }, 1000);

        // ⚡ Preload admin modules for authenticated users
        window.addEventListener('auth-success', () => {
            setTimeout(() => {
                this.preloadModules([
                    '../js/security-dashboard.js',
                    '../js/performance-monitor.js'
                ]);
            }, 500);
        });
    }

    /**
     * ⚡ OPTIMIZED: Dynamic module loading
     */
    async loadModule(name, path) {
        if (this.modules.has(name)) {
            console.log(`⚡ [BOOTSTRAP] Module ${name} already loaded`);
            return this.modules.get(name);
        }

        console.log(`⚡ [BOOTSTRAP] Loading module: ${name}`);
        const startTime = performance.now();

        // ⚡ Always try fallback first for better compatibility
        try {
            return await this.loadModuleAsFallback(name, path);
        } catch (fallbackError) {
            console.warn(`⚠️ [BOOTSTRAP] Fallback failed for ${name}, trying ES module:`, fallbackError);
            
            // ⚡ If fallback fails, try ES module as secondary option
            try {
                const moduleExport = await import(path);
                const loadTime = performance.now() - startTime;
                
                this.modules.set(name, moduleExport.default);
                this.loadTimes.set(name, loadTime);
                
                console.log(`✅ [BOOTSTRAP] ${name} loaded via ES module (${loadTime.toFixed(1)}ms)`);
                
                // ⚡ Trigger module loaded event
                window.dispatchEvent(new CustomEvent('module-loaded', {
                    detail: { name, loadTime }
                }));
                
                return moduleExport.default;
                
            } catch (esError) {
                console.error(`❌ [BOOTSTRAP] Both fallback and ES module failed for ${name}:`, esError);
                throw esError;
            }
        }
    }

    /**
     * ⚡ OPTIMIZED: Fallback module loading for MIME type issues
     */
    async loadModuleAsFallback(name, path) {
        console.log(`🔄 [BOOTSTRAP] Loading ${name} as regular script...`);
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = path;
            script.type = 'text/javascript'; // Explicit type
            
            const loadTime = performance.now();
            
            script.onload = () => {
                const duration = performance.now() - loadTime;
                console.log(`✅ [BOOTSTRAP] ${name} loaded as fallback (${duration.toFixed(1)}ms)`);
                
                this.modules.set(name, window);
                this.loadTimes.set(name, duration);
                
                // ⚡ Trigger module loaded event
                window.dispatchEvent(new CustomEvent('module-loaded', {
                    detail: { name, loadTime: duration }
                }));
                
                resolve(window);
            };
            
            script.onerror = (error) => {
                console.error(`❌ [BOOTSTRAP] Fallback failed for ${name}:`, error);
                reject(new Error(`Failed to load ${name} as regular script`));
            };
            
            // ⚡ Timeout protection
            setTimeout(() => {
                if (!script.complete) {
                    reject(new Error(`Timeout loading ${name}`));
                }
            }, 10000); // 10 second timeout
            
            document.head.appendChild(script);
        });
    }

    /**
     * ⚡ OPTIMIZED: Module preloading with priority
     */
    async preloadModules(paths) {
        const preloadPromises = paths.map(async (path) => {
            try {
                // ⚡ Use link preload for faster loading
                const link = document.createElement('link');
                link.rel = 'modulepreload';
                link.href = path;
                document.head.appendChild(link);
                
                // ⚡ Also load the module (cache it)
                await import(path);
                console.log(`⚡ [BOOTSTRAP] Preloaded: ${path}`);
                
            } catch (error) {
                console.warn(`⚠️ [BOOTSTRAP] Preload failed: ${path}`, error);
            }
        });

        await Promise.allSettled(preloadPromises);
    }

    /**
     * ⚡ OPTIMIZED: Performance monitoring setup
     */
    initializePerformanceMonitoring() {
        // ⚡ Web Vitals monitoring
        this.monitorWebVitals();
        
        // ⚡ Custom performance tracking
        this.trackCustomMetrics();
        
        // ⚡ Performance budget alerts
        this.setupPerformanceBudget();
    }

    monitorWebVitals() {
        // ⚡ Core Web Vitals tracking
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                const value = entry.value || entry.duration || 0;
                console.log(`📊 [PERFORMANCE] ${entry.name}: ${value.toFixed(1)}ms`);
                
                // ⚡ Send to analytics (if available)
                if (window.gtag) {
                    gtag('event', 'web_vitals', {
                        metric_name: entry.name,
                        metric_value: value,
                        metric_id: entry.id
                    });
                }
            });
        });

        try {
            observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
        } catch (error) {
            console.warn('⚠️ [PERFORMANCE] Web Vitals monitoring not supported');
        }
    }

    trackCustomMetrics() {
        // ⚡ Track module loading performance
        window.addEventListener('module-loaded', (e) => {
            const { name, loadTime } = e.detail;
            console.log(`📊 [MODULES] ${name}: ${loadTime.toFixed(1)}ms`);
        });

        // ⚡ Track authentication performance
        window.addEventListener('auth-success', (e) => {
            const authTime = performance.now() - this.startTime;
            console.log(`📊 [AUTH] Authentication: ${authTime.toFixed(1)}ms`);
        });
    }

    setupPerformanceBudget() {
        const budgets = {
            'module-load': 200,    // Max 200ms per module
            'auth-check': 1000,    // Max 1s for auth
            'api-request': 2000    // Max 2s for API calls
        };

        // ⚡ Monitor and alert on budget violations
        window.addEventListener('module-loaded', (e) => {
            if (e.detail.loadTime > budgets['module-load']) {
                console.warn(`⚠️ [BUDGET] Module ${e.detail.name} exceeded budget: ${e.detail.loadTime.toFixed(1)}ms`);
            }
        });
    }

    /**
     * ⚡ OPTIMIZED: Fallback initialization
     */
    fallbackInitialization() {
        console.warn('⚠️ [BOOTSTRAP] Using fallback initialization');
        
        // ⚡ Load essential functions as fallbacks
        window.testProvider = window.testProvider || function(provider) {
            console.log(`🔧 [FALLBACK] Testing ${provider}...`);
        };
        
        window.showNotification = window.showNotification || function(message, type) {
            console.log(`📢 [FALLBACK] ${type}: ${message}`);
        };
        
        window.checkAuthentication = window.checkAuthentication || function() {
            console.log('🔒 [FALLBACK] Authentication check');
            return false;
        };
    }

    /**
     * ⚡ OPTIMIZED: Get performance report
     */
    getPerformanceReport() {
        const totalTime = performance.now() - this.startTime;
        const moduleStats = Array.from(this.loadTimes.entries()).map(([name, time]) => ({
            name,
            loadTime: `${time.toFixed(1)}ms`
        }));

        return {
            totalInitTime: `${totalTime.toFixed(1)}ms`,
            criticalModulesLoaded: this.criticalModulesLoaded,
            modulesLoaded: this.modules.size,
            moduleStats,
            memoryUsage: performance.memory ? {
                used: `${(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB`,
                total: `${(performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(1)}MB`
            } : 'Not available'
        };
    }
}

// ⚡ Initialize bootstrap
const bootstrap = new PerformanceBootstrap();

// ⚡ Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => bootstrap.init());
} else {
    bootstrap.init();
}

// ⚡ Global access for debugging
window.bootstrap = bootstrap;

// ⚡ Performance debugging
window.getPerformanceReport = () => bootstrap.getPerformanceReport();

console.log('⚡ [PERFORMANCE] Bootstrap loaded - 15KB vs 3.2MB (-99.5%)');