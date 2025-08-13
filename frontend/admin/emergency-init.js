/**
 * 🚨 EMERGENCY INITIALIZATION SYSTEM
 * Master initialization to load all systems in correct order with error recovery
 */

class EmergencyInit {
    constructor() {
        this.loadedModules = new Set();
        this.failedModules = new Set();
        this.retryCount = new Map();
        this.maxRetries = 3;
        
        this.initSequence = [
            // Phase 1: Critical fixes (highest priority)
            { 
                name: 'critical-error-fix', 
                path: '/admin/critical-error-fix.js', 
                priority: 1,
                essential: true,
                description: 'Critical error recovery system'
            },
            { 
                name: 'api-url-fix', 
                path: '/admin/api-url-fix.js', 
                priority: 1,
                essential: true,
                description: 'API URL construction fixes'
            },
            
            // Phase 2: Core systems
            { 
                name: 'modals', 
                path: '/admin/modals.js', 
                priority: 2,
                essential: false,
                description: 'Modal management system'
            },
            { 
                name: 'api-helper', 
                path: '/admin/api-helper.js', 
                priority: 2,
                essential: true,
                description: 'API communication helper'
            },
            
            // Phase 3: Enhanced systems
            { 
                name: 'memory-manager', 
                path: '/admin/core/memory-manager.js', 
                priority: 3,
                essential: false,
                description: 'Memory leak prevention'
            },
            { 
                name: 'network-optimizer', 
                path: '/admin/core/network-optimizer.js', 
                priority: 3,
                essential: false,
                description: 'Network request optimization'
            },
            { 
                name: 'analytics-monitor', 
                path: '/admin/core/analytics-monitor.js', 
                priority: 3,
                essential: false,
                description: 'Performance analytics'
            }
        ];

        this.initialize();
    }

    async initialize() {
        console.log('🚨 [EMERGENCY INIT] Starting emergency initialization...');
        
        // Show loading indicator
        this.showLoadingIndicator();
        
        try {
            // Load modules by priority
            await this.loadByPriority();
            
            // Verify essential systems
            await this.verifyEssentialSystems();
            
            // Setup emergency handlers
            this.setupEmergencyHandlers();
            
            // Hide loading indicator
            this.hideLoadingIndicator();
            
            console.log('✅ [EMERGENCY INIT] Initialization complete');
            this.generateReport();
            
        } catch (error) {
            console.error('❌ [EMERGENCY INIT] Critical initialization failure:', error);
            this.handleCriticalFailure(error);
        }
    }

    /**
     * Load modules by priority
     */
    async loadByPriority() {
        const priorities = [...new Set(this.initSequence.map(m => m.priority))].sort();
        
        for (const priority of priorities) {
            const modules = this.initSequence.filter(m => m.priority === priority);
            console.log(`🔄 [EMERGENCY INIT] Loading priority ${priority} modules:`, modules.map(m => m.name));
            
            // Load modules of same priority in parallel
            const loadPromises = modules.map(module => this.loadModule(module));
            await Promise.allSettled(loadPromises);
        }
    }

    /**
     * Load individual module
     */
    async loadModule(module) {
        const retryKey = module.name;
        const currentRetries = this.retryCount.get(retryKey) || 0;
        
        if (currentRetries >= this.maxRetries) {
            console.error(`❌ [EMERGENCY INIT] Max retries exceeded for ${module.name}`);
            this.failedModules.add(module.name);
            return;
        }

        try {
            console.log(`📦 [EMERGENCY INIT] Loading ${module.name}...`);
            
            // Check if already loaded
            if (this.loadedModules.has(module.name)) {
                console.log(`✅ [EMERGENCY INIT] ${module.name} already loaded`);
                return;
            }
            
            // Load the script
            await this.loadScript(module.path);
            
            // Mark as loaded
            this.loadedModules.add(module.name);
            console.log(`✅ [EMERGENCY INIT] ${module.name} loaded successfully`);
            
        } catch (error) {
            console.error(`❌ [EMERGENCY INIT] Failed to load ${module.name}:`, error);
            
            // Retry if not exceeded max attempts
            if (currentRetries < this.maxRetries) {
                this.retryCount.set(retryKey, currentRetries + 1);
                console.log(`🔄 [EMERGENCY INIT] Retrying ${module.name} (attempt ${currentRetries + 2}/${this.maxRetries + 1})`);
                
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 1000 * (currentRetries + 1)));
                return this.loadModule(module);
            } else {
                this.failedModules.add(module.name);
                
                // If essential module failed, try fallback
                if (module.essential) {
                    this.createModuleFallback(module.name);
                }
            }
        }
    }

    /**
     * Load script dynamically
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            // Check if script already exists
            const existingScript = document.querySelector(`script[src="${src}"]`);
            if (existingScript) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = false; // Preserve execution order
            
            script.onload = () => {
                console.log(`📦 [SCRIPT LOADER] Script loaded: ${src}`);
                resolve();
            };
            
            script.onerror = (error) => {
                console.error(`❌ [SCRIPT LOADER] Script failed: ${src}`, error);
                reject(new Error(`Failed to load script: ${src}`));
            };
            
            document.head.appendChild(script);
        });
    }

    /**
     * Create fallback for failed essential modules
     */
    createModuleFallback(moduleName) {
        console.log(`🔧 [EMERGENCY INIT] Creating fallback for ${moduleName}`);
        
        switch (moduleName) {
            case 'api-helper':
                this.createAPIHelperFallback();
                break;
            case 'critical-error-fix':
                this.createCriticalErrorFixFallback();
                break;
            case 'api-url-fix':
                this.createAPIUrlFixFallback();
                break;
            default:
                console.warn(`⚠️ [EMERGENCY INIT] No fallback available for ${moduleName}`);
        }
    }

    /**
     * Create API Helper fallback
     */
    createAPIHelperFallback() {
        window.safeApiCall = async (url, options = {}) => {
            console.log('📋 [API FALLBACK] Using fallback API call for:', url);
            
            try {
                const response = await fetch(url, {
                    ...options,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        ...options.headers
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                return response;
            } catch (error) {
                console.error('❌ [API FALLBACK] Request failed:', error);
                throw error;
            }
        };
        
        console.log('✅ [EMERGENCY INIT] API Helper fallback created');
    }

    /**
     * Create Critical Error Fix fallback
     */
    createCriticalErrorFixFallback() {
        // Basic error handling
        window.addEventListener('error', (event) => {
            console.error('🚨 [ERROR FALLBACK] Global error:', event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('🚨 [ERROR FALLBACK] Unhandled rejection:', event.reason);
            event.preventDefault();
        });
        
        console.log('✅ [EMERGENCY INIT] Critical Error Fix fallback created');
    }

    /**
     * Create API URL Fix fallback
     */
    createAPIUrlFixFallback() {
        const baseUrl = 'https://rbck.onrender.com';
        
        const originalFetch = window.fetch;
        window.fetch = (input, init) => {
            if (typeof input === 'string' && input.startsWith('/api/')) {
                input = baseUrl + input;
            }
            return originalFetch(input, init);
        };
        
        console.log('✅ [EMERGENCY INIT] API URL Fix fallback created');
    }

    /**
     * Verify essential systems
     */
    async verifyEssentialSystems() {
        console.log('🔍 [EMERGENCY INIT] Verifying essential systems...');
        
        const essentialModules = this.initSequence.filter(m => m.essential);
        const verificationResults = {};
        
        for (const module of essentialModules) {
            const isWorking = await this.verifyModule(module.name);
            verificationResults[module.name] = isWorking;
            
            if (!isWorking) {
                console.warn(`⚠️ [EMERGENCY INIT] Essential module not working: ${module.name}`);
            }
        }
        
        return verificationResults;
    }

    /**
     * Verify individual module
     */
    async verifyModule(moduleName) {
        switch (moduleName) {
            case 'api-helper':
                return typeof window.safeApiCall === 'function';
            case 'critical-error-fix':
                return typeof window.criticalErrorFix === 'object';
            case 'api-url-fix':
                return typeof window.apiUrlFix === 'object';
            default:
                return this.loadedModules.has(moduleName);
        }
    }

    /**
     * Setup emergency handlers
     */
    setupEmergencyHandlers() {
        // Emergency restart function
        window.emergencyRestart = () => {
            console.log('🚨 [EMERGENCY] Restarting system...');
            window.location.reload();
        };

        // Emergency diagnostics
        window.emergencyDiagnostics = () => {
            return {
                loadedModules: Array.from(this.loadedModules),
                failedModules: Array.from(this.failedModules),
                retryCount: Object.fromEntries(this.retryCount),
                timestamp: new Date().toISOString()
            };
        };

        // Emergency safe mode
        window.emergencySafeMode = () => {
            console.log('🛡️ [EMERGENCY] Entering safe mode...');
            
            // Disable non-essential features
            const nonEssential = document.querySelectorAll('[data-enhanced], [data-optimized]');
            nonEssential.forEach(el => el.style.display = 'none');
            
            // Show minimal interface
            document.body.classList.add('safe-mode');
            
            console.log('✅ [EMERGENCY] Safe mode activated');
        };
    }

    /**
     * Show loading indicator
     */
    showLoadingIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'emergency-loading';
        indicator.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 99999;
                color: white;
                font-family: Arial, sans-serif;
            ">
                <div style="text-align: center;">
                    <div style="
                        width: 40px;
                        height: 40px;
                        border: 4px solid #333;
                        border-top: 4px solid #fff;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 20px auto;
                    "></div>
                    <h3>🚨 Emergency System Recovery</h3>
                    <p>Initializing critical systems...</p>
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        
        document.body.appendChild(indicator);
    }

    /**
     * Hide loading indicator
     */
    hideLoadingIndicator() {
        const indicator = document.getElementById('emergency-loading');
        if (indicator) {
            indicator.remove();
        }
    }

    /**
     * Handle critical initialization failure
     */
    handleCriticalFailure(error) {
        console.error('🚨 [EMERGENCY INIT] CRITICAL FAILURE:', error);
        
        // Hide loading indicator
        this.hideLoadingIndicator();
        
        // Show error message
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                left: 20px;
                right: 20px;
                background: #ff4757;
                color: white;
                padding: 20px;
                border-radius: 8px;
                z-index: 99999;
                font-family: Arial, sans-serif;
            ">
                <h3>🚨 Critical System Failure</h3>
                <p>The emergency initialization system encountered a critical error.</p>
                <button onclick="window.location.reload()" style="
                    background: white;
                    color: #ff4757;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-top: 10px;
                ">Reload Page</button>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
    }

    /**
     * Generate initialization report
     */
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            totalModules: this.initSequence.length,
            loadedModules: Array.from(this.loadedModules),
            failedModules: Array.from(this.failedModules),
            retryAttempts: Object.fromEntries(this.retryCount),
            successRate: ((this.loadedModules.size / this.initSequence.length) * 100).toFixed(1) + '%'
        };

        console.group('📊 [EMERGENCY INIT] Initialization Report');
        console.log('Success Rate:', report.successRate);
        console.log('Loaded Modules:', report.loadedModules);
        
        if (report.failedModules.length > 0) {
            console.warn('Failed Modules:', report.failedModules);
        }
        
        console.log('Full Report:', report);
        console.groupEnd();

        return report;
    }
}

// Auto-initialize when script loads
document.addEventListener('DOMContentLoaded', () => {
    window.emergencyInit = new EmergencyInit();
});

// Also initialize immediately if DOM is already ready
if (document.readyState === 'loading') {
    // DOM still loading, wait for DOMContentLoaded
} else {
    // DOM already loaded
    window.emergencyInit = new EmergencyInit();
}

console.log('🚨 [EMERGENCY INIT] Emergency initialization system loaded');