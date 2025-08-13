/**
 * 🚀 CSS OPTIMIZER
 * Dynamic CSS loading, bundling, and optimization for performance
 */

class CSSOptimizer {
    constructor() {
        this.loadedCSS = new Set();
        this.criticalCSS = new Set();
        this.loadingPromises = new Map();
        this.mediaQueries = new Map();
        
        this.config = {
            criticalThreshold: 1024, // CSS size threshold for critical inlining
            lazyLoadDelay: 100,      // Delay for lazy loading non-critical CSS
            preloadHints: true,      // Enable resource hints
            minification: true,      // Minify CSS on-the-fly (client-side)
            bundling: true,          // Bundle related CSS files
            compression: true        // Enable compression hints
        };

        this.initialize();
    }

    initialize() {
        console.log('🚀 [CSS OPTIMIZER] Initializing CSS optimization system...');
        
        // Analyze current CSS
        this.analyzeCurrentCSS();
        
        // Setup critical CSS extraction
        this.extractCriticalCSS();
        
        // Setup lazy loading for non-critical CSS
        this.setupLazyLoading();
        
        // Add performance monitoring
        this.setupPerformanceMonitoring();
        
        console.log('✅ [CSS OPTIMIZER] CSS optimizer ready');
    }

    /**
     * Analyze currently loaded CSS
     */
    analyzeCurrentCSS() {
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
        const inlineStyles = document.querySelectorAll('style');
        
        console.log(`📊 [CSS ANALYZER] Found ${stylesheets.length} external stylesheets, ${inlineStyles.length} inline styles`);
        
        // Categorize CSS by importance
        stylesheets.forEach(link => {
            const href = link.href;
            const isCritical = this.isCriticalCSS(href);
            
            if (isCritical) {
                this.criticalCSS.add(href);
                console.log(`🎯 [CSS ANALYZER] Critical CSS: ${href}`);
            } else {
                console.log(`⏳ [CSS ANALYZER] Non-critical CSS: ${href}`);
            }
            
            this.loadedCSS.add(href);
        });
    }

    /**
     * Determine if CSS is critical for above-the-fold content
     */
    isCriticalCSS(href) {
        const criticalPatterns = [
            /luxury-sidebar\.css/,
            /layout/,
            /critical/,
            /main/,
            /bootstrap/,
            /grid/
        ];

        return criticalPatterns.some(pattern => pattern.test(href));
    }

    /**
     * Extract and inline critical CSS
     */
    async extractCriticalCSS() {
        const criticalStyles = [];
        
        // Get critical CSS rules from loaded stylesheets
        for (const sheet of document.styleSheets) {
            try {
                if (this.criticalCSS.has(sheet.href)) {
                    const criticalRules = this.extractCriticalRules(sheet);
                    if (criticalRules.length > 0) {
                        criticalStyles.push(criticalRules.join('\n'));
                    }
                }
            } catch (error) {
                // CORS or other access errors
                console.warn(`⚠️ [CSS OPTIMIZER] Cannot access stylesheet: ${sheet.href}`);
            }
        }

        // Inline critical CSS
        if (criticalStyles.length > 0) {
            this.inlineCriticalCSS(criticalStyles.join('\n'));
        }
    }

    /**
     * Extract critical CSS rules (above-the-fold)
     */
    extractCriticalRules(stylesheet) {
        const criticalRules = [];
        const criticalSelectors = [
            /^\.sidebar/,
            /^\.header/,
            /^\.nav/,
            /^\.auth/,
            /^\.loading/,
            /^\.hidden/,
            /^body/,
            /^html/,
            /^\.container/,
            /^\.main/
        ];

        try {
            for (const rule of stylesheet.cssRules || stylesheet.rules || []) {
                if (rule.type === CSSRule.STYLE_RULE) {
                    const selector = rule.selectorText;
                    
                    if (criticalSelectors.some(pattern => pattern.test(selector))) {
                        criticalRules.push(rule.cssText);
                    }
                }
            }
        } catch (error) {
            console.warn(`⚠️ [CSS OPTIMIZER] Error extracting rules:`, error);
        }

        return criticalRules;
    }

    /**
     * Inline critical CSS for faster rendering
     */
    inlineCriticalCSS(css) {
        const minifiedCSS = this.config.minification ? this.minifyCSS(css) : css;
        
        const style = document.createElement('style');
        style.type = 'text/css';
        style.setAttribute('data-critical', 'true');
        style.textContent = minifiedCSS;
        
        // Insert at the beginning of head for highest priority
        document.head.insertBefore(style, document.head.firstChild);
        
        console.log(`⚡ [CSS OPTIMIZER] Inlined ${minifiedCSS.length} bytes of critical CSS`);
    }

    /**
     * Basic CSS minification
     */
    minifyCSS(css) {
        return css
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
            .replace(/\s+/g, ' ')             // Collapse whitespace
            .replace(/;\s*}/g, '}')           // Remove last semicolon before }
            .replace(/\s*{\s*/g, '{')         // Remove space around {
            .replace(/;\s*/g, ';')            // Remove space after ;
            .replace(/,\s*/g, ',')            // Remove space after ,
            .trim();
    }

    /**
     * Setup lazy loading for non-critical CSS
     */
    setupLazyLoading() {
        // Find non-critical CSS that can be lazy loaded
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
        
        stylesheets.forEach(link => {
            const href = link.href;
            
            if (!this.criticalCSS.has(href)) {
                this.makeCSSLazy(link);
            }
        });

        // Setup intersection observer for component-specific CSS
        this.setupComponentBasedLoading();
    }

    /**
     * Make CSS load lazily
     */
    makeCSSLazy(link) {
        // Don't lazy load if already loaded
        if (link.hasAttribute('data-lazy-loaded')) return;

        const href = link.href;
        
        // Remove from render blocking
        link.media = 'print';
        link.setAttribute('data-lazy-href', href);
        
        // Load after a short delay
        setTimeout(() => {
            this.loadCSS(href, link);
        }, this.config.lazyLoadDelay);
        
        console.log(`⏳ [CSS OPTIMIZER] Made CSS lazy: ${href}`);
    }

    /**
     * Load CSS asynchronously
     */
    async loadCSS(href, existingLink = null) {
        // Check if already loading
        if (this.loadingPromises.has(href)) {
            return this.loadingPromises.get(href);
        }

        const loadPromise = new Promise((resolve, reject) => {
            let link = existingLink;
            
            if (!link) {
                link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = href;
            }

            const onLoad = () => {
                link.media = 'all';
                link.setAttribute('data-lazy-loaded', 'true');
                this.loadedCSS.add(href);
                this.loadingPromises.delete(href);
                console.log(`✅ [CSS OPTIMIZER] Loaded CSS: ${href}`);
                resolve();
            };

            const onError = () => {
                this.loadingPromises.delete(href);
                console.error(`❌ [CSS OPTIMIZER] Failed to load CSS: ${href}`);
                reject(new Error(`Failed to load CSS: ${href}`));
            };

            link.onload = onLoad;
            link.onerror = onError;

            // If we're updating an existing link, just change the media
            if (existingLink) {
                link.media = 'all';
            } else {
                document.head.appendChild(link);
            }

            // Fallback timeout
            setTimeout(() => {
                if (!link.getAttribute('data-lazy-loaded')) {
                    onLoad(); // Assume loaded
                }
            }, 5000);
        });

        this.loadingPromises.set(href, loadPromise);
        return loadPromise;
    }

    /**
     * Setup component-based CSS loading
     */
    setupComponentBasedLoading() {
        // Map components to their CSS files
        const componentCSS = {
            'ai-monitoring': ['aiMonitoring.css'],
            'seo-tools': ['seoTools.css'],
            'blog-manager': ['blogManager.css'],
            'settings': ['settings.css'],
            'security': ['security-dashboard.css']
        };

        // Use intersection observer for component visibility
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(async (entry) => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const component = element.getAttribute('data-component') || 
                                    element.className.match(/(\w+-\w+)/)?.[1];
                    
                    if (component && componentCSS[component]) {
                        await this.loadComponentCSS(component, componentCSS[component]);
                        observer.unobserve(element);
                    }
                }
            });
        }, { threshold: 0.1, rootMargin: '50px' });

        // Observe elements with data-component attributes
        document.querySelectorAll('[data-component], .ai-monitoring, .seo-tools, .blog-manager, .settings, .security')
            .forEach(el => observer.observe(el));
    }

    /**
     * Load CSS for specific components
     */
    async loadComponentCSS(component, cssFiles) {
        console.log(`🔄 [CSS OPTIMIZER] Loading CSS for component: ${component}`);
        
        const loadPromises = cssFiles.map(cssFile => {
            const href = `css/${cssFile}`;
            return this.loadCSS(href);
        });

        try {
            await Promise.all(loadPromises);
            console.log(`✅ [CSS OPTIMIZER] Component CSS loaded: ${component}`);
        } catch (error) {
            console.error(`❌ [CSS OPTIMIZER] Component CSS load failed: ${component}`, error);
        }
    }

    /**
     * Bundle related CSS files
     */
    async bundleCSS(cssFiles, bundleName) {
        if (!this.config.bundling) return;

        console.log(`📦 [CSS OPTIMIZER] Bundling CSS: ${bundleName}`);
        
        try {
            const cssContents = await Promise.all(
                cssFiles.map(file => this.fetchCSSContent(file))
            );

            const bundledCSS = cssContents.join('\n');
            const minifiedCSS = this.config.minification ? 
                this.minifyCSS(bundledCSS) : bundledCSS;

            // Create bundled stylesheet
            const style = document.createElement('style');
            style.setAttribute('data-bundle', bundleName);
            style.textContent = minifiedCSS;
            document.head.appendChild(style);

            // Remove original stylesheets
            cssFiles.forEach(file => {
                const link = document.querySelector(`link[href*="${file}"]`);
                if (link) link.remove();
            });

            console.log(`✅ [CSS OPTIMIZER] Bundle created: ${bundleName} (${minifiedCSS.length} bytes)`);

        } catch (error) {
            console.error(`❌ [CSS OPTIMIZER] Bundling failed: ${bundleName}`, error);
        }
    }

    /**
     * Fetch CSS content
     */
    async fetchCSSContent(href) {
        const response = await fetch(href);
        if (!response.ok) {
            throw new Error(`Failed to fetch CSS: ${href}`);
        }
        return response.text();
    }

    /**
     * Add resource hints for better loading performance
     */
    addResourceHints() {
        if (!this.config.preloadHints) return;

        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
        
        stylesheets.forEach(link => {
            const href = link.href;
            
            if (!this.criticalCSS.has(href)) {
                // Add preload hint for non-critical CSS
                const preload = document.createElement('link');
                preload.rel = 'preload';
                preload.as = 'style';
                preload.href = href;
                preload.onload = () => {
                    preload.rel = 'stylesheet';
                };
                
                document.head.appendChild(preload);
                console.log(`🔗 [CSS OPTIMIZER] Added preload hint: ${href}`);
            }
        });
    }

    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        // Monitor CSS load times
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.name.endsWith('.css')) {
                        console.log(`📊 [CSS PERF] ${entry.name}: ${entry.duration.toFixed(2)}ms`);
                    }
                });
            });
            
            observer.observe({ type: 'resource', buffered: true });
        }

        // Monitor CLS (Cumulative Layout Shift) from CSS loading
        if ('PerformanceObserver' in window) {
            const clsObserver = new PerformanceObserver((list) => {
                let clsValue = 0;
                list.getEntries().forEach((entry) => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                });
                
                if (clsValue > 0.1) { // CLS threshold
                    console.warn(`⚠️ [CSS PERF] High CLS detected: ${clsValue.toFixed(4)}`);
                }
            });
            
            clsObserver.observe({ type: 'layout-shift', buffered: true });
        }
    }

    /**
     * Optimize existing CSS by removing unused rules
     */
    async optimizeLoadedCSS() {
        console.log('🔧 [CSS OPTIMIZER] Optimizing loaded CSS...');
        
        for (const stylesheet of document.styleSheets) {
            try {
                if (stylesheet.href && this.loadedCSS.has(stylesheet.href)) {
                    await this.removeUnusedRules(stylesheet);
                }
            } catch (error) {
                console.warn(`⚠️ [CSS OPTIMIZER] Cannot optimize stylesheet: ${stylesheet.href}`);
            }
        }
    }

    /**
     * Remove unused CSS rules (basic implementation)
     */
    async removeUnusedRules(stylesheet) {
        const unusedRules = [];
        
        try {
            for (let i = stylesheet.cssRules.length - 1; i >= 0; i--) {
                const rule = stylesheet.cssRules[i];
                
                if (rule.type === CSSRule.STYLE_RULE) {
                    const selector = rule.selectorText;
                    
                    // Check if selector is used in DOM
                    if (!document.querySelector(selector)) {
                        unusedRules.push(selector);
                        stylesheet.deleteRule(i);
                    }
                }
            }
            
            if (unusedRules.length > 0) {
                console.log(`🧹 [CSS OPTIMIZER] Removed ${unusedRules.length} unused rules from ${stylesheet.href}`);
            }
            
        } catch (error) {
            console.warn(`⚠️ [CSS OPTIMIZER] Error removing unused rules:`, error);
        }
    }

    /**
     * Get CSS performance metrics
     */
    getMetrics() {
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"], style');
        let totalSize = 0;
        let loadedCount = 0;
        
        return {
            totalStylesheets: stylesheets.length,
            loadedCSS: this.loadedCSS.size,
            criticalCSS: this.criticalCSS.size,
            loadingPromises: this.loadingPromises.size,
            estimatedSize: `~${(totalSize / 1024).toFixed(1)}KB`,
            optimization: {
                minification: this.config.minification,
                bundling: this.config.bundling,
                lazyLoading: true,
                preloadHints: this.config.preloadHints
            }
        };
    }

    /**
     * Generate CSS optimization report
     */
    generateReport() {
        const metrics = this.getMetrics();
        
        console.group('📊 [CSS OPTIMIZER] Performance Report');
        console.log('Total Stylesheets:', metrics.totalStylesheets);
        console.log('Loaded CSS Files:', metrics.loadedCSS);
        console.log('Critical CSS Files:', metrics.criticalCSS);
        console.log('Currently Loading:', metrics.loadingPromises);
        console.log('Optimizations Enabled:', metrics.optimization);
        console.groupEnd();
        
        return metrics;
    }

    /**
     * Force load all remaining CSS
     */
    async loadAllCSS() {
        console.log('🚀 [CSS OPTIMIZER] Force loading all remaining CSS...');
        
        const stylesheets = document.querySelectorAll('link[data-lazy-href]');
        const loadPromises = [];
        
        stylesheets.forEach(link => {
            const href = link.getAttribute('data-lazy-href');
            if (href && !this.loadedCSS.has(href)) {
                loadPromises.push(this.loadCSS(href, link));
            }
        });
        
        await Promise.all(loadPromises);
        console.log(`✅ [CSS OPTIMIZER] All CSS loaded (${loadPromises.length} files)`);
    }
}

// Initialize CSS optimizer
const cssOptimizer = new CSSOptimizer();

// Make available globally for debugging
window.cssOptimizer = cssOptimizer;
window.cssReport = () => cssOptimizer.generateReport();
window.loadAllCSS = () => cssOptimizer.loadAllCSS();

// Auto-optimize after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        cssOptimizer.addResourceHints();
        cssOptimizer.optimizeLoadedCSS();
    }, 1000);
});

console.log('✅ [CSS OPTIMIZER] CSS optimization system ready');