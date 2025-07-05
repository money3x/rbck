/**
 * Performance Optimizer - Advanced optimization techniques
 * Implements lazy loading, critical resource prioritization, and Core Web Vitals optimization
 */

class PerformanceOptimizer {
    constructor() {
        this.intersectionObserver = null;
        this.criticalResourcesLoaded = false;
        this.lazyElements = new Set();
        this.performanceMetrics = {
            lcp: null,
            fid: null,
            cls: null,
            score: 0
        };
        
        this.init();
    }

    init() {
        console.log('🚀 [PERFORMANCE] Initializing performance optimizer...');
        
        // Initialize immediately for critical performance
        this.preloadCriticalResources();
        this.initLazyLoading();
        this.initImageOptimization();
        this.initWebVitalsTracking();
        this.optimizeFirstPaint();
        
        // Defer non-critical optimizations
        requestIdleCallback(() => {
            this.initAdvancedOptimizations();
        });
    }

    preloadCriticalResources() {
        // Preload critical CSS
        const criticalCSS = document.createElement('link');
        criticalCSS.rel = 'preload';
        criticalCSS.as = 'style';
        criticalCSS.href = '/frontend/admin/css/critical.css';
        criticalCSS.onload = () => {
            criticalCSS.rel = 'stylesheet';
            this.criticalResourcesLoaded = true;
            console.log('✅ [PERFORMANCE] Critical CSS loaded');
        };
        document.head.appendChild(criticalCSS);

        // Preload critical JavaScript
        const criticalJS = document.createElement('link');
        criticalJS.rel = 'preload';
        criticalJS.as = 'script';
        criticalJS.href = '/frontend/admin/dist/js/main.47234b74d8640c5c6aed.js';
        document.head.appendChild(criticalJS);

        // Preload AI modal components (likely to be used)
        this.preloadComponent('/frontend/admin/components/ai-modal/modal-header.html');
    }

    async preloadComponent(url) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                const html = await response.text();
                // Store in cache for instant loading
                if (window.componentLoader) {
                    window.componentLoader.cache.set(url, html);
                }
                console.log(`📦 [PERFORMANCE] Preloaded component: ${url}`);
            }
        } catch (error) {
            console.warn(`⚠️ [PERFORMANCE] Failed to preload component: ${url}`, error);
        }
    }

    initLazyLoading() {
        // Intersection Observer for lazy loading
        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadElement(entry.target);
                    this.intersectionObserver.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '50px 0px', // Start loading 50px before element enters viewport
            threshold: 0.1
        });

        // Find and observe lazy elements
        this.observeLazyElements();
    }

    observeLazyElements() {
        // Lazy load images
        document.querySelectorAll('img[data-src], img[loading="lazy"]').forEach(img => {
            this.intersectionObserver.observe(img);
            this.lazyElements.add(img);
        });

        // Lazy load sections
        document.querySelectorAll('.lazy-load').forEach(section => {
            this.intersectionObserver.observe(section);
            this.lazyElements.add(section);
        });

        // Lazy load heavy components
        document.querySelectorAll('[data-component-lazy]').forEach(component => {
            this.intersectionObserver.observe(component);
            this.lazyElements.add(component);
        });

        console.log(`👁️ [PERFORMANCE] Observing ${this.lazyElements.size} lazy elements`);
    }

    loadElement(element) {
        // Handle different types of lazy elements
        if (element.tagName === 'IMG') {
            this.loadImage(element);
        } else if (element.hasAttribute('data-component-lazy')) {
            this.loadComponent(element);
        } else if (element.classList.contains('lazy-load')) {
            this.loadSection(element);
        }
    }

    loadImage(img) {
        const src = img.getAttribute('data-src');
        if (src) {
            // Create a new image to preload
            const newImg = new Image();
            newImg.onload = () => {
                img.src = src;
                img.classList.add('loaded');
                img.removeAttribute('data-src');
                console.log(`🖼️ [PERFORMANCE] Image loaded: ${src}`);
            };
            newImg.src = src;
        } else if (img.hasAttribute('loading')) {
            img.classList.add('loaded');
        }
    }

    async loadComponent(element) {
        const componentPath = element.getAttribute('data-component-lazy');
        const targetSelector = element.getAttribute('data-target') || element;
        
        try {
            if (window.componentLoader) {
                await window.componentLoader.loadComponent(componentPath, targetSelector);
                element.classList.add('loaded');
                console.log(`🧩 [PERFORMANCE] Lazy component loaded: ${componentPath}`);
            }
        } catch (error) {
            console.error(`❌ [PERFORMANCE] Failed to load lazy component: ${componentPath}`, error);
        }
    }

    loadSection(section) {
        section.classList.add('loaded');
        console.log(`📦 [PERFORMANCE] Section loaded lazily`);
        
        // Trigger any section-specific loading
        const event = new CustomEvent('sectionLoaded', { detail: { section } });
        section.dispatchEvent(event);
    }

    initImageOptimization() {
        // Add modern image format support detection
        this.detectWebPSupport().then(supportsWebP => {
            if (supportsWebP) {
                document.documentElement.classList.add('webp-support');
                console.log('🖼️ [PERFORMANCE] WebP support detected');
            }
        });

        // Optimize image loading
        document.querySelectorAll('img').forEach(img => {
            // Add loading="lazy" to images not already optimized
            if (!img.hasAttribute('loading') && !img.hasAttribute('data-src')) {
                img.loading = 'lazy';
            }
            
            // Add decode="async" for better performance
            img.decoding = 'async';
        });
    }

    async detectWebPSupport() {
        return new Promise((resolve) => {
            const webP = new Image();
            webP.onload = webP.onerror = () => {
                resolve(webP.height === 2);
            };
            webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
        });
    }

    initWebVitalsTracking() {
        // Track Largest Contentful Paint
        if ('PerformanceObserver' in window) {
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.performanceMetrics.lcp = lastEntry.startTime;
                this.calculatePerformanceScore();
                console.log(`📊 [LCP] ${lastEntry.startTime.toFixed(2)}ms`);
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

            // Track First Input Delay
            const fidObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    this.performanceMetrics.fid = entry.processingStart - entry.startTime;
                    this.calculatePerformanceScore();
                    console.log(`📊 [FID] ${this.performanceMetrics.fid.toFixed(2)}ms`);
                });
            });
            fidObserver.observe({ entryTypes: ['first-input'] });

            // Track Cumulative Layout Shift
            let clsValue = 0;
            const clsObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                }
                this.performanceMetrics.cls = clsValue;
                this.calculatePerformanceScore();
                console.log(`📊 [CLS] ${clsValue.toFixed(4)}`);
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });
        }
    }

    calculatePerformanceScore() {
        let score = 100;
        
        // LCP scoring (good: <2.5s, poor: >4s)
        if (this.performanceMetrics.lcp > 4000) score -= 30;
        else if (this.performanceMetrics.lcp > 2500) score -= 15;
        
        // FID scoring (good: <100ms, poor: >300ms)
        if (this.performanceMetrics.fid > 300) score -= 25;
        else if (this.performanceMetrics.fid > 100) score -= 10;
        
        // CLS scoring (good: <0.1, poor: >0.25)
        if (this.performanceMetrics.cls > 0.25) score -= 25;
        else if (this.performanceMetrics.cls > 0.1) score -= 10;
        
        this.performanceMetrics.score = Math.max(0, score);
        
        // Update UI if score indicator exists
        const scoreElement = document.getElementById('performance-score');
        if (scoreElement) {
            scoreElement.textContent = `${this.performanceMetrics.score}%`;
            scoreElement.className = `performance-score ${this.getScoreClass(this.performanceMetrics.score)}`;
        }
        
        console.log(`🏆 [PERFORMANCE SCORE] ${this.performanceMetrics.score}%`);
        
        return this.performanceMetrics.score;
    }

    getScoreClass(score) {
        if (score >= 90) return 'excellent';
        if (score >= 75) return 'good';
        if (score >= 60) return 'needs-improvement';
        return 'poor';
    }

    optimizeFirstPaint() {
        // Remove blocking resources
        document.querySelectorAll('link[rel="stylesheet"]:not([media])').forEach(link => {
            // Add media query to make CSS non-blocking for non-critical styles
            if (!link.href.includes('critical')) {
                link.media = 'print';
                link.onload = () => { link.media = 'all'; };
            }
        });

        // Optimize font loading
        document.querySelectorAll('link[href*="fonts.googleapis.com"]').forEach(link => {
            link.rel = 'preload';
            link.as = 'style';
            link.onload = () => { link.rel = 'stylesheet'; };
        });
    }

    initAdvancedOptimizations() {
        // Resource hints for likely navigation
        this.addResourceHints();
        
        // Optimize third-party scripts
        this.optimizeThirdPartyScripts();
        
        // Initialize service worker for caching
        this.initServiceWorker();
        
        console.log('🔧 [PERFORMANCE] Advanced optimizations initialized');
    }

    addResourceHints() {
        // Preconnect to external domains
        const preconnectDomains = [
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com',
            'https://api.openai.com',
            'https://api.anthropic.com'
        ];

        preconnectDomains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = domain;
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        });
    }

    optimizeThirdPartyScripts() {
        // Load non-critical scripts after page load
        window.addEventListener('load', () => {
            setTimeout(() => {
                // Load analytics or other non-critical scripts here
                console.log('📊 [PERFORMANCE] Loading non-critical scripts');
            }, 2000);
        });
    }

    async initServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('🔧 [SW] Service Worker registered:', registration);
            } catch (error) {
                console.warn('⚠️ [SW] Service Worker registration failed:', error);
            }
        }
    }

    // Public API methods
    getPerformanceMetrics() {
        return { ...this.performanceMetrics };
    }

    getPerformanceScore() {
        return this.performanceMetrics.score;
    }

    optimizeElement(element) {
        if (this.intersectionObserver) {
            this.intersectionObserver.observe(element);
            this.lazyElements.add(element);
        }
    }

    preloadResource(url, type = 'fetch') {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = type;
        link.href = url;
        document.head.appendChild(link);
    }
}

// Initialize performance optimizer
window.performanceOptimizer = new PerformanceOptimizer();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceOptimizer;
}

console.log('⚡ [PERFORMANCE OPTIMIZER] Performance optimization system activated');
console.log('📊 [DEBUG] Use window.performanceOptimizer.getPerformanceScore() to get current score');
console.log('🎯 [DEBUG] Target: 95% performance score for optimal user experience');