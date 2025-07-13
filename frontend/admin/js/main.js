/**
 * RBCK CMS - Main JavaScript Entry Point
 * Optimized modular architecture with performance monitoring
 */

// Import modules (assuming module bundler)
import './performance-monitor.js';
import './component-loader.js';

// Application State Management
class RBCKApp {
    constructor() {
        this.state = {
            isInitialized: false,
            currentSection: 'dashboard',
            user: null,
            performance: {
                startTime: performance.now(),
                componentsLoaded: 0,
                criticalResourcesLoaded: false
            }
        };
        
        this.modules = new Map();
        this.eventHandlers = new Map();
        
        this.init();
    }

    async init() {
        console.log('🚀 [RBCK APP] Initializing application...');
        
        try {
            // Initialize performance monitoring first
            this.initPerformanceTracking();
            
            // Load critical resources
            await this.loadCriticalResources();
            
            // Initialize component system
            await this.initComponentSystem();
            
            // Setup global event handlers
            this.setupEventHandlers();
            
            // Initialize modules
            await this.initModules();
            
            // Mark as initialized
            this.state.isInitialized = true;
            
            console.log('✅ [RBCK APP] Application initialized successfully');
            
            // Dispatch ready event
            window.dispatchEvent(new CustomEvent('rbckReady', {
                detail: {
                    initTime: performance.now() - this.state.performance.startTime,
                    version: '1.0.0'
                }
            }));
            
        } catch (error) {
            console.error('❌ [RBCK APP] Initialization failed:', error);
            this.handleInitializationError(error);
        }
    }

    initPerformanceTracking() {
        // Performance monitor should already be initialized
        if (window.performanceMonitor) {
            window.performanceMonitor.trackComponentLoad('rbck-app', performance.now());
            console.log('📊 [RBCK APP] Performance monitoring active');
        }
    }

    async loadCriticalResources() {
        const criticalResources = [
            '/frontend/admin/css/ai-modal.css',
            '/frontend/admin/js/component-loader.js'
        ];
        
        const loadPromises = criticalResources.map(async (resource) => {
            if (resource.endsWith('.css')) {
                return this.loadStylesheet(resource);
            } else if (resource.endsWith('.js')) {
                return this.loadScript(resource);
            }
        });
        
        await Promise.all(loadPromises);
        this.state.performance.criticalResourcesLoaded = true;
        
        console.log('✅ [RBCK APP] Critical resources loaded');
    }

    loadStylesheet(href) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async initComponentSystem() {
        if (window.componentLoader) {
            console.log('🧩 [RBCK APP] Component system ready');
            
            // Pre-load frequently used components
            await this.preloadComponents();
        } else {
            console.warn('⚠️ [RBCK APP] Component loader not available');
        }
    }

    async preloadComponents() {
        const frequentComponents = [
            {
                path: '/frontend/admin/components/ai-modal/modal-header.html',
                target: '#preload-container'
            }
        ];
        
        // Create temporary container for preloading
        const preloadContainer = document.createElement('div');
        preloadContainer.id = 'preload-container';
        preloadContainer.style.display = 'none';
        document.body.appendChild(preloadContainer);
        
        try {
            await window.componentLoader.loadComponents(frequentComponents);
            console.log('✅ [RBCK APP] Components preloaded');
        } catch (error) {
            console.warn('⚠️ [RBCK APP] Component preloading failed:', error);
        }
    }

    setupEventHandlers() {
        // Global error handler
        window.addEventListener('error', (event) => {
            this.handleGlobalError(event);
        });
        
        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.handleUnhandledRejection(event);
        });
        
        // Performance monitoring events
        window.addEventListener('componentLoaded', (event) => {
            this.state.performance.componentsLoaded++;
            console.log(`🧩 [RBCK APP] Component loaded: ${event.detail.componentPath}`);
        });
        
        // Network status monitoring
        window.addEventListener('online', () => {
            console.log('🌐 [RBCK APP] Network connection restored');
            this.handleNetworkStatusChange(true);
        });
        
        window.addEventListener('offline', () => {
            console.warn('📵 [RBCK APP] Network connection lost');
            this.handleNetworkStatusChange(false);
        });
        
        console.log('✅ [RBCK APP] Event handlers setup complete');
    }

    async initModules() {
        const modules = [
            { name: 'ai-settings', init: this.initAISettings.bind(this) },
            { name: 'dashboard', init: this.initDashboard.bind(this) },
            { name: 'auth', init: this.initAuth.bind(this) }
        ];
        
        for (const module of modules) {
            try {
                await module.init();
                this.modules.set(module.name, { status: 'loaded', timestamp: Date.now() });
                console.log(`✅ [RBCK APP] Module loaded: ${module.name}`);
            } catch (error) {
                console.error(`❌ [RBCK APP] Module failed to load: ${module.name}`, error);
                this.modules.set(module.name, { status: 'error', error, timestamp: Date.now() });
            }
        }
    }

    async initAISettings() {
        // Initialize AI Settings functionality
        if (typeof window.initializeAIModalComponents === 'function') {
            await window.initializeAIModalComponents();
        }
        
        if (typeof window.openAISettingsModal === 'function') {
            console.log('🤖 [AI SETTINGS] AI Settings module ready');
        }
    }

    async initDashboard() {
        // Initialize dashboard functionality
        console.log('📊 [DASHBOARD] Dashboard module ready');
    }

    async initAuth() {
        // Initialize authentication
        console.log('🔐 [AUTH] Authentication module ready');
    }

    // Error Handling
    handleGlobalError(event) {
        console.error('🚨 [GLOBAL ERROR]', {
            message: event.message,
            source: event.filename,
            line: event.lineno,
            column: event.colno,
            error: event.error
        });
        
        // Send to performance monitor if available
        if (window.performanceMonitor) {
            window.performanceMonitor.trackError({
                type: 'javascript',
                message: event.message,
                source: event.filename,
                line: event.lineno,
                column: event.colno,
                timestamp: Date.now()
            });
        }
    }

    handleUnhandledRejection(event) {
        console.error('🚨 [UNHANDLED REJECTION]', event.reason);
        
        if (window.performanceMonitor) {
            window.performanceMonitor.trackError({
                type: 'promise',
                message: event.reason?.message || 'Unhandled promise rejection',
                timestamp: Date.now()
            });
        }
    }

    handleNetworkStatusChange(isOnline) {
        this.state.isOnline = isOnline;
        
        // Emit custom event for other modules to handle
        window.dispatchEvent(new CustomEvent('networkStatusChanged', {
            detail: { isOnline }
        }));
    }

    handleInitializationError(error) {
        // Display user-friendly error message
        const errorContainer = document.getElementById('error-container') || document.body;
        
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #fee;
                border: 1px solid #fcc;
                color: #c33;
                padding: 15px;
                border-radius: 8px;
                font-family: Arial, sans-serif;
                z-index: 10000;
                max-width: 300px;
            ">
                <strong>⚠️ Initialization Error</strong><br>
                The application failed to start properly. Please refresh the page or contact support.
                <button onclick="location.reload()" style="
                    margin-top: 10px;
                    padding: 5px 10px;
                    background: #c33;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                ">Reload Page</button>
            </div>
        `;
        
        errorContainer.appendChild(errorDiv);
    }

    // Public API
    getState() {
        return { ...this.state };
    }

    getModuleStatus(moduleName) {
        return this.modules.get(moduleName) || { status: 'not-loaded' };
    }

    getAllModulesStatus() {
        return Object.fromEntries(this.modules);
    }

    async reloadModule(moduleName) {
        console.log(`🔄 [RBCK APP] Reloading module: ${moduleName}`);
        
        // Implementation depends on specific module
        // This is a placeholder for module reloading logic
        
        return { success: true, module: moduleName };
    }

    getPerformanceReport() {
        const report = {
            appInitTime: this.state.performance.startTime,
            componentsLoaded: this.state.performance.componentsLoaded,
            modulesLoaded: this.modules.size,
            criticalResourcesLoaded: this.state.performance.criticalResourcesLoaded
        };
        
        if (window.performanceMonitor) {
            report.webVitals = window.performanceMonitor.getWebVitals();
            report.performanceScore = window.performanceMonitor.getPerformanceScore();
        }
        
        return report;
    }
}

// Initialize application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.rbckApp = new RBCKApp();
    });
} else {
    window.rbckApp = new RBCKApp();
}

// Global utilities for backward compatibility
window.RBCK = {
    app: () => window.rbckApp,
    performance: () => window.performanceMonitor,
    components: () => window.componentLoader,
    version: '1.0.0'
};

console.log('✅ [RBCK MAIN] Main application script loaded');
console.log('🔧 [DEBUG] Use window.rbckApp.getPerformanceReport() to view performance metrics');
console.log('🔧 [DEBUG] Use window.RBCK to access global utilities');