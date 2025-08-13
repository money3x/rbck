/**
 * 🚀 PRODUCTION OPTIMIZER
 * Enables critical production optimizations for performance
 */

class ProductionOptimizer {
    constructor() {
        this.isProduction = window.location.hostname !== 'localhost';
        this.optimizations = new Map();
        this.compressionSupport = null;
        this.serviceWorkerSupport = 'serviceWorker' in navigator;
        
        this.init();
    }

    init() {
        console.log('🚀 [PROD OPTIMIZER] Initializing production optimizations...');
        
        // Apply all optimizations
        this.enableCompression();
        this.setupServiceWorker();
        this.enableResourceOptimizations();
        this.setupErrorBoundaries();
        this.optimizeNetworkRequests();
        
        console.log('✅ [PROD OPTIMIZER] Production optimizations applied');
    }

    /**
     * Enable compression for API requests
     */
    enableCompression() {
        // Override fetch to add compression headers
        const originalFetch = window.fetch;
        
        window.fetch = function(url, options = {}) {
            const headers = {
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept': 'application/json',
                ...options.headers
            };

            const optimizedOptions = {
                ...options,
                headers
            };

            console.log('🔄 [COMPRESSION] Enhanced request:', url);
            return originalFetch(url, optimizedOptions);
        };

        this.optimizations.set('compression', true);
        console.log('✅ [PROD OPTIMIZER] Compression headers enabled');
    }

    /**
     * Setup service worker for caching and performance
     */
    setupServiceWorker() {
        if (!this.serviceWorkerSupport) {
            console.log('⚠️ [PROD OPTIMIZER] Service Worker not supported');
            return;
        }

        if (this.isProduction) {
            this.registerServiceWorker();
        } else {
            console.log('🔄 [PROD OPTIMIZER] Service Worker disabled in development');
        }
    }

    async registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });

            console.log('✅ [SERVICE WORKER] Registered:', registration);

            // Handle updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // New version available
                        console.log('🔄 [SERVICE WORKER] New version available');
                        this.notifyUpdate();
                    }
                });
            });

            this.optimizations.set('serviceWorker', true);
        } catch (error) {
            console.error('❌ [SERVICE WORKER] Registration failed:', error);
        }
    }

    /**
     * Notify user of updates
     */
    notifyUpdate() {
        if (window.showNotification) {
            window.showNotification('🔄 New version available! Refresh to update.', 'info');
        }
    }

    /**
     * Enable resource optimizations
     */
    enableResourceOptimizations() {
        // Optimize images
        this.optimizeImages();
        
        // Enable resource hints
        this.addResourceHints();
        
        // Setup preloading
        this.setupPreloading();
        
        console.log('✅ [PROD OPTIMIZER] Resource optimizations enabled');
    }

    optimizeImages() {
        // Add intersection observer for lazy loading
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        
                        // Load high-quality image
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.classList.add('loaded');
                        }
                        
                        // WebP support detection
                        if (this.supportsWebP() && img.dataset.webp) {
                            img.src = img.dataset.webp;
                        }
                        
                        observer.unobserve(img);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '50px'
            });

            // Observe all images with data-src
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    supportsWebP() {
        if (this.webpSupport !== undefined) return this.webpSupport;
        
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        this.webpSupport = canvas.toDataURL('image/webp').startsWith('data:image/webp');
        
        return this.webpSupport;
    }

    addResourceHints() {
        const hints = [
            { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
            { rel: 'dns-prefetch', href: '//cdnjs.cloudflare.com' },
            { rel: 'preconnect', href: 'https://rbck.onrender.com', crossorigin: true }
        ];

        hints.forEach(hint => {
            if (!document.querySelector(`link[href="${hint.href}"]`)) {
                const link = document.createElement('link');
                Object.assign(link, hint);
                document.head.appendChild(link);
            }
        });
    }

    setupPreloading() {
        // Preload critical resources
        const criticalResources = [
            { href: '/api/ai/status', as: 'fetch', crossorigin: 'anonymous' }
        ];

        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            Object.assign(link, resource);
            document.head.appendChild(link);
        });
    }

    /**
     * Setup global error boundaries
     */
    setupErrorBoundaries() {
        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('🚨 [ERROR BOUNDARY] Script error:', {
                message: event.message,
                filename: event.filename,
                line: event.lineno,
                column: event.colno,
                error: event.error
            });

            // Send to monitoring service if available
            this.reportError({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                line: event.lineno,
                column: event.colno,
                stack: event.error?.stack
            });
        });

        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('🚨 [ERROR BOUNDARY] Unhandled promise:', event.reason);
            
            this.reportError({
                type: 'unhandled_promise',
                message: event.reason?.message || 'Unhandled promise rejection',
                stack: event.reason?.stack
            });
        });

        // Resource loading errors
        window.addEventListener('error', (event) => {
            if (event.target && event.target !== window) {
                console.error('🚨 [ERROR BOUNDARY] Resource error:', {
                    type: event.target.tagName,
                    source: event.target.src || event.target.href
                });
            }
        }, true);

        this.optimizations.set('errorBoundaries', true);
        console.log('✅ [PROD OPTIMIZER] Error boundaries enabled');
    }

    /**
     * Report errors to monitoring service
     */
    reportError(error) {
        // In production, send to error tracking service
        if (this.isProduction) {
            // Would send to service like Sentry, LogRocket, etc.
            console.log('📊 [ERROR TRACKING] Would report:', error);
        }
    }

    /**
     * Optimize network requests
     */
    optimizeNetworkRequests() {
        // Request batching
        this.setupRequestBatching();
        
        // Cache optimization
        this.setupCacheOptimization();
        
        console.log('✅ [PROD OPTIMIZER] Network optimizations enabled');
    }

    setupRequestBatching() {
        // Batch similar requests together
        window.requestBatcher = {
            pending: new Map(),
            
            batch: function(key, request, delay = 100) {
                if (this.pending.has(key)) {
                    return this.pending.get(key);
                }

                const promise = new Promise((resolve) => {
                    setTimeout(async () => {
                        try {
                            const result = await request();
                            resolve(result);
                        } catch (error) {
                            resolve({ error });
                        } finally {
                            this.pending.delete(key);
                        }
                    }, delay);
                });

                this.pending.set(key, promise);
                return promise;
            }
        };
    }

    setupCacheOptimization() {
        // HTTP cache headers optimization
        const cacheConfig = {
            'static': 'public, max-age=31536000', // 1 year for static assets
            'api': 'public, max-age=300',         // 5 minutes for API responses
            'dynamic': 'no-cache'                 // No cache for dynamic content
        };

        // Add cache headers to requests
        const originalFetch = window.fetch;
        window.fetch = function(url, options = {}) {
            const headers = { ...options.headers };

            // Determine cache strategy based on URL
            if (url.includes('/api/')) {
                headers['Cache-Control'] = cacheConfig.api;
            } else if (url.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff2?)$/)) {
                headers['Cache-Control'] = cacheConfig.static;
            }

            return originalFetch(url, { ...options, headers });
        };
    }

    /**
     * Get optimization status
     */
    getStatus() {
        return {
            isProduction: this.isProduction,
            optimizations: Object.fromEntries(this.optimizations),
            support: {
                serviceWorker: this.serviceWorkerSupport,
                webp: this.supportsWebP(),
                intersectionObserver: 'IntersectionObserver' in window,
                performanceObserver: 'PerformanceObserver' in window
            },
            performance: this.getPerformanceMetrics()
        };
    }

    getPerformanceMetrics() {
        if (!('performance' in window)) return null;

        const navigation = performance.getEntriesByType('navigation')[0];
        if (!navigation) return null;

        return {
            loadTime: navigation.loadEventEnd - navigation.fetchStart,
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
            firstPaint: this.getFirstPaint(),
            firstContentfulPaint: this.getFirstContentfulPaint(),
            timeToInteractive: this.estimateTimeToInteractive()
        };
    }

    getFirstPaint() {
        const entries = performance.getEntriesByType('paint');
        const fp = entries.find(entry => entry.name === 'first-paint');
        return fp ? fp.startTime : null;
    }

    getFirstContentfulPaint() {
        const entries = performance.getEntriesByType('paint');
        const fcp = entries.find(entry => entry.name === 'first-contentful-paint');
        return fcp ? fcp.startTime : null;
    }

    estimateTimeToInteractive() {
        // Simplified TTI estimation
        const navigation = performance.getEntriesByType('navigation')[0];
        return navigation ? navigation.loadEventEnd : null;
    }

    /**
     * Generate performance report
     */
    generateReport() {
        const status = this.getStatus();
        
        console.group('📊 [PRODUCTION OPTIMIZER] Performance Report');
        console.log('Environment:', status.isProduction ? 'Production' : 'Development');
        console.log('Active Optimizations:', status.optimizations);
        console.log('Browser Support:', status.support);
        
        if (status.performance) {
            console.log('Performance Metrics:', status.performance);
        }
        
        console.groupEnd();
        
        return status;
    }
}

// Initialize production optimizer
window.productionOptimizer = new ProductionOptimizer();

// Global debugging
window.prodReport = () => window.productionOptimizer.generateReport();

console.log('✅ [PROD OPTIMIZER] Production optimizer ready');