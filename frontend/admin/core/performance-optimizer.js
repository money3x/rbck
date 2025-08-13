/**
 * 🚀 PERFORMANCE: Advanced Performance Optimizer
 * Implements critical performance optimizations for RBCK CMS
 */

class PerformanceOptimizer {
    constructor() {
        this.metrics = {
            bundleLoadTime: 0,
            moduleLoadTimes: new Map(),
            memoryUsage: [],
            networkRequests: 0,
            cacheHits: 0
        };
        
        this.observers = {
            performance: null,
            intersection: null,
            mutation: null
        };

        this.optimizations = {
            bundleSplitting: true,
            lazyLoading: true,
            resourceHints: true,
            criticalCSS: true,
            serviceWorker: true
        };

        this.init();
    }

    init() {
        console.log('🚀 [PERF OPTIMIZER] Initializing performance optimizations...');
        
        // Start performance monitoring
        this.startPerformanceMonitoring();
        
        // Apply critical optimizations
        this.applyCriticalOptimizations();
        
        // Setup lazy loading
        this.setupLazyLoading();
        
        // Initialize resource hints
        this.addResourceHints();
        
        console.log('✅ [PERF OPTIMIZER] Performance optimizer initialized');
    }

    /**
     * Apply critical performance optimizations
     */
    applyCriticalOptimizations() {
        // 1. Critical CSS inlining
        this.inlineCriticalCSS();
        
        // 2. Resource preloading
        this.preloadCriticalResources();
        
        // 3. Script optimization
        this.optimizeScriptLoading();
        
        // 4. Image optimization
        this.optimizeImages();
    }

    /**
     * Inline critical CSS for above-the-fold content
     */
    inlineCriticalCSS() {
        const criticalCSS = `
            /* Critical CSS for initial render */
            .loading-spinner { 
                display: inline-block; width: 20px; height: 20px; 
                border: 2px solid #f3f3f3; border-top: 2px solid #007cba;
                border-radius: 50%; animation: spin 1s linear infinite;
            }
            .hidden { display: none !important; }
            .fade-in { opacity: 0; transition: opacity 0.3s ease; }
            .fade-in.loaded { opacity: 1; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            
            /* Critical layout styles */
            .admin-container { max-width: 1200px; margin: 0 auto; padding: 20px; }
            .sidebar { width: 280px; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
            .main-content { flex: 1; min-height: 100vh; }
        `;

        const style = document.createElement('style');
        style.textContent = criticalCSS;
        document.head.insertBefore(style, document.head.firstChild);
        
        console.log('✅ [PERF OPTIMIZER] Critical CSS inlined');
    }

    /**
     * Preload critical resources
     */
    preloadCriticalResources() {
        const criticalResources = [
            { href: 'core/bootstrap.js', as: 'script' },
            { href: 'core/auth.js', as: 'script' },
            { href: 'unified-status-manager.js', as: 'script' },
            { href: 'css/luxury-sidebar.css', as: 'style' }
        ];

        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'modulepreload';
            link.href = resource.href;
            link.as = resource.as;
            document.head.appendChild(link);
        });

        console.log('✅ [PERF OPTIMIZER] Critical resources preloaded');
    }

    /**
     * Setup lazy loading for non-critical modules
     */
    setupLazyLoading() {
        // Lazy load AI monitoring when AI section is accessed
        const aiSections = document.querySelectorAll('[data-section*="ai"]');
        aiSections.forEach(section => {
            window.moduleLoader.loadOnVisible(section, 'aiMonitoring.js', (module) => {
                console.log('🔄 [LAZY LOAD] AI Monitoring loaded on demand');
            });
        });

        // Lazy load SEO tools when needed
        const seoButtons = document.querySelectorAll('[onclick*="seo"], [data-action*="seo"]');
        seoButtons.forEach(button => {
            window.moduleLoader.loadOnInteraction(button, 'seoTools.js', (module) => {
                console.log('🔄 [LAZY LOAD] SEO Tools loaded on interaction');
            });
        });

        // Lazy load blog manager when blog section is accessed
        const blogElements = document.querySelectorAll('[data-section="blog"], [onclick*="blog"]');
        blogElements.forEach(element => {
            window.moduleLoader.loadOnInteraction(element, 'blogManager.js', (module) => {
                console.log('🔄 [LAZY LOAD] Blog Manager loaded on demand');
            });
        });

        console.log('✅ [PERF OPTIMIZER] Lazy loading configured');
    }

    /**
     * Add resource hints for better loading performance
     */
    addResourceHints() {
        // DNS prefetch for external resources
        const externalDomains = [
            'https://rbck.onrender.com',
            'https://fonts.googleapis.com',
            'https://cdnjs.cloudflare.com'
        ];

        externalDomains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'dns-prefetch';
            link.href = domain;
            document.head.appendChild(link);
        });

        // Preconnect to API endpoint
        const preconnect = document.createElement('link');
        preconnect.rel = 'preconnect';
        preconnect.href = 'https://rbck.onrender.com';
        preconnect.crossOrigin = true;
        document.head.appendChild(preconnect);

        console.log('✅ [PERF OPTIMIZER] Resource hints added');
    }

    /**
     * Optimize script loading with defer and async
     */
    optimizeScriptLoading() {
        // Mark non-critical scripts for deferred loading
        const nonCriticalScripts = [
            'debug-fix.js',
            'migration.js',
            'sw.js'
        ];

        nonCriticalScripts.forEach(scriptName => {
            const scripts = document.querySelectorAll(`script[src*="${scriptName}"]`);
            scripts.forEach(script => {
                script.defer = true;
                script.async = false; // Maintain execution order
            });
        });

        console.log('✅ [PERF OPTIMIZER] Script loading optimized');
    }

    /**
     * Optimize images with lazy loading and WebP support
     */
    optimizeImages() {
        // Add lazy loading to images
        const images = document.querySelectorAll('img:not([loading])');
        images.forEach(img => {
            img.loading = 'lazy';
            img.decoding = 'async';
        });

        // Add intersection observer for advanced lazy loading
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.classList.add('fade-in', 'loaded');
                            observer.unobserve(img);
                        }
                    }
                });
            }, { threshold: 0.1, rootMargin: '50px' });

            const lazyImages = document.querySelectorAll('img[data-src]');
            lazyImages.forEach(img => imageObserver.observe(img));
        }

        console.log('✅ [PERF OPTIMIZER] Images optimized');
    }

    /**
     * Start comprehensive performance monitoring
     */
    startPerformanceMonitoring() {
        // Monitor bundle load time
        const startTime = performance.now();
        window.addEventListener('load', () => {
            this.metrics.bundleLoadTime = performance.now() - startTime;
            console.log(`📊 [PERF MONITOR] Bundle load time: ${this.metrics.bundleLoadTime.toFixed(2)}ms`);
        });

        // Monitor memory usage
        if ('memory' in performance) {
            setInterval(() => {
                this.metrics.memoryUsage.push({
                    timestamp: Date.now(),
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit
                });
                
                // Keep only last 100 entries
                if (this.metrics.memoryUsage.length > 100) {
                    this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-100);
                }
            }, 30000); // Every 30 seconds
        }

        // Monitor Core Web Vitals
        this.monitorCoreWebVitals();

        console.log('✅ [PERF MONITOR] Performance monitoring started');
    }

    /**
     * Monitor Core Web Vitals
     */
    monitorCoreWebVitals() {
        // Largest Contentful Paint (LCP)
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            console.log(`📊 [CORE WEB VITALS] LCP: ${lastEntry.startTime.toFixed(2)}ms`);
        }).observe({ type: 'largest-contentful-paint', buffered: true });

        // First Input Delay (FID)
        new PerformanceObserver((entryList) => {
            const firstInput = entryList.getEntries()[0];
            const fid = firstInput.processingStart - firstInput.startTime;
            console.log(`📊 [CORE WEB VITALS] FID: ${fid.toFixed(2)}ms`);
        }).observe({ type: 'first-input', buffered: true });

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            }
            console.log(`📊 [CORE WEB VITALS] CLS: ${clsValue.toFixed(4)}`);
        }).observe({ type: 'layout-shift', buffered: true });
    }

    /**
     * Bundle size analysis and reporting
     */
    analyzeBundleSize() {
        const scripts = document.querySelectorAll('script[src]');
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
        
        console.log('📊 [BUNDLE ANALYSIS] Script files:');
        scripts.forEach(script => {
            if (script.src && !script.src.includes('http')) {
                console.log(`  - ${script.src}: Loading...`);
            }
        });

        console.log('📊 [BUNDLE ANALYSIS] CSS files:');
        stylesheets.forEach(css => {
            if (css.href && !css.href.includes('http')) {
                console.log(`  - ${css.href}: Loading...`);
            }
        });

        return {
            scriptCount: scripts.length,
            cssCount: stylesheets.length,
            externalScripts: Array.from(scripts).filter(s => s.src.includes('http')).length,
            externalCSS: Array.from(stylesheets).filter(s => s.href.includes('http')).length
        };
    }

    /**
     * Get comprehensive performance metrics
     */
    getMetrics() {
        const navigation = performance.getEntriesByType('navigation')[0];
        
        return {
            ...this.metrics,
            navigationTiming: navigation ? {
                dns: navigation.domainLookupEnd - navigation.domainLookupStart,
                tcp: navigation.connectEnd - navigation.connectStart,
                request: navigation.responseStart - navigation.requestStart,
                response: navigation.responseEnd - navigation.responseStart,
                dom: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                load: navigation.loadEventEnd - navigation.loadEventStart
            } : null,
            bundleAnalysis: this.analyzeBundleSize()
        };
    }

    /**
     * Performance optimization report
     */
    generateReport() {
        const metrics = this.getMetrics();
        
        console.group('📊 [PERFORMANCE REPORT]');
        console.log('Bundle Load Time:', metrics.bundleLoadTime?.toFixed(2) + 'ms');
        console.log('Network Requests:', metrics.networkRequests);
        console.log('Cache Hits:', metrics.cacheHits);
        console.log('Module Load Times:', metrics.moduleLoadTimes);
        
        if (metrics.navigationTiming) {
            console.log('Navigation Timing:', metrics.navigationTiming);
        }
        
        console.log('Bundle Analysis:', metrics.bundleAnalysis);
        console.groupEnd();
        
        return metrics;
    }
}

// Initialize performance optimizer
window.performanceOptimizer = new PerformanceOptimizer();

// Make available globally for debugging
window.perfReport = () => window.performanceOptimizer.generateReport();

console.log('✅ [PERF OPTIMIZER] Performance optimizer ready');