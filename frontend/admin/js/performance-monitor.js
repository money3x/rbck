/**
 * Advanced Performance Monitoring System
 * Tracks and analyzes frontend performance metrics
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            pageLoad: {},
            userInteractions: [],
            resourceTimings: [],
            componentLoads: [],
            memoryUsage: [],
            errors: []
        };
        
        this.observers = {};
        this.startTime = performance.now();
        this.isEnabled = true;
        
        this.init();
    }

    init() {
        if (!this.isEnabled) return;
        
        console.log('📊 [PERFORMANCE] Initializing performance monitoring...');
        
        // Initialize all monitoring features
        this.initPageLoadMetrics();
        this.initUserInteractionTracking();
        this.initResourceTimingTracking();
        this.initMemoryTracking();
        this.initErrorTracking();
        this.initLargestContentfulPaint();
        this.initFirstInputDelay();
        this.initCumulativeLayoutShift();
        
        // Start periodic collection
        this.startPeriodicCollection();
        
        console.log('✅ [PERFORMANCE] Performance monitoring initialized');
    }

    // Core Web Vitals Implementation
    initLargestContentfulPaint() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                
                this.metrics.pageLoad.lcp = {
                    value: lastEntry.startTime,
                    timestamp: Date.now(),
                    element: lastEntry.element?.tagName || 'unknown'
                };
                
                console.log(`📊 [LCP] Largest Contentful Paint: ${lastEntry.startTime.toFixed(2)}ms`);
            });
            
            observer.observe({ entryTypes: ['largest-contentful-paint'] });
            this.observers.lcp = observer;
        }
    }

    initFirstInputDelay() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    this.metrics.pageLoad.fid = {
                        value: entry.processingStart - entry.startTime,
                        timestamp: Date.now(),
                        eventType: entry.name
                    };
                    
                    console.log(`📊 [FID] First Input Delay: ${this.metrics.pageLoad.fid.value.toFixed(2)}ms`);
                });
            });
            
            observer.observe({ entryTypes: ['first-input'] });
            this.observers.fid = observer;
        }
    }

    initCumulativeLayoutShift() {
        if ('PerformanceObserver' in window) {
            let clsValue = 0;
            
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                }
                
                this.metrics.pageLoad.cls = {
                    value: clsValue,
                    timestamp: Date.now()
                };
                
                console.log(`📊 [CLS] Cumulative Layout Shift: ${clsValue.toFixed(4)}`);
            });
            
            observer.observe({ entryTypes: ['layout-shift'] });
            this.observers.cls = observer;
        }
    }

    initPageLoadMetrics() {
        // Navigation Timing API
        window.addEventListener('load', () => {
            setTimeout(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                
                this.metrics.pageLoad = {
                    ...this.metrics.pageLoad,
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                    loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                    domInteractive: navigation.domInteractive - navigation.navigationStart,
                    firstPaint: this.getFirstPaint(),
                    firstContentfulPaint: this.getFirstContentfulPaint(),
                    timestamp: Date.now()
                };
                
                console.log('📊 [PAGE LOAD] Metrics collected:', this.metrics.pageLoad);
            }, 100);
        });
    }

    getFirstPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const fp = paintEntries.find(entry => entry.name === 'first-paint');
        return fp ? fp.startTime : null;
    }

    getFirstContentfulPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        return fcp ? fcp.startTime : null;
    }

    initUserInteractionTracking() {
        const interactionEvents = ['click', 'keydown', 'scroll', 'resize'];
        
        interactionEvents.forEach(eventType => {
            document.addEventListener(eventType, (event) => {
                this.trackInteraction({
                    type: eventType,
                    timestamp: performance.now(),
                    target: event.target?.tagName || 'unknown',
                    targetId: event.target?.id || null,
                    targetClass: event.target?.className || null
                });
            }, { passive: true });
        });
    }

    trackInteraction(interaction) {
        this.metrics.userInteractions.push(interaction);
        
        // Keep only last 100 interactions to prevent memory bloat
        if (this.metrics.userInteractions.length > 100) {
            this.metrics.userInteractions = this.metrics.userInteractions.slice(-100);
        }
    }

    initResourceTimingTracking() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                
                entries.forEach(entry => {
                    if (entry.entryType === 'resource') {
                        this.metrics.resourceTimings.push({
                            name: entry.name,
                            type: this.getResourceType(entry.name),
                            duration: entry.duration,
                            size: entry.transferSize || entry.encodedBodySize,
                            timestamp: Date.now()
                        });
                    }
                });
                
                // Keep only last 50 resource timings
                if (this.metrics.resourceTimings.length > 50) {
                    this.metrics.resourceTimings = this.metrics.resourceTimings.slice(-50);
                }
            });
            
            observer.observe({ entryTypes: ['resource'] });
            this.observers.resource = observer;
        }
    }

    getResourceType(url) {
        if (url.includes('.css')) return 'css';
        if (url.includes('.js')) return 'js';
        if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
        if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
        return 'other';
    }

    initMemoryTracking() {
        if ('memory' in performance) {
            // Track memory usage periodically
            setInterval(() => {
                const memory = performance.memory;
                this.metrics.memoryUsage.push({
                    used: memory.usedJSHeapSize,
                    total: memory.totalJSHeapSize,
                    limit: memory.jsHeapSizeLimit,
                    timestamp: Date.now()
                });
                
                // Keep only last 20 memory snapshots
                if (this.metrics.memoryUsage.length > 20) {
                    this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-20);
                }
            }, 30000); // Every 30 seconds
        }
    }

    initErrorTracking() {
        window.addEventListener('error', (event) => {
            this.trackError({
                type: 'javascript',
                message: event.message,
                source: event.filename,
                line: event.lineno,
                column: event.colno,
                timestamp: Date.now()
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.trackError({
                type: 'promise',
                message: event.reason?.message || 'Unhandled promise rejection',
                timestamp: Date.now()
            });
        });
    }

    trackError(error) {
        this.metrics.errors.push(error);
        console.error('📊 [ERROR TRACKING]', error);
        
        // Keep only last 10 errors
        if (this.metrics.errors.length > 10) {
            this.metrics.errors = this.metrics.errors.slice(-10);
        }
    }

    trackComponentLoad(componentName, loadTime) {
        this.metrics.componentLoads.push({
            component: componentName,
            loadTime,
            timestamp: Date.now()
        });
        
        console.log(`📊 [COMPONENT] ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
        
        // Keep only last 50 component loads
        if (this.metrics.componentLoads.length > 50) {
            this.metrics.componentLoads = this.metrics.componentLoads.slice(-50);
        }
    }

    startPeriodicCollection() {
        // Send metrics to backend every 2 minutes
        setInterval(() => {
            this.sendMetricsToBackend();
        }, 120000);
    }

    async sendMetricsToBackend() {
        if (!this.isEnabled) return;
        
        try {
            const payload = {
                metrics: this.metrics,
                userAgent: navigator.userAgent,
                url: window.location.href,
                timestamp: Date.now(),
                sessionId: this.getSessionId()
            };
            
            // Send to backend API
            const response = await fetch('/api/performance/metrics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                console.log('📊 [METRICS] Successfully sent performance metrics to backend');
            }
        } catch (error) {
            console.warn('📊 [METRICS] Failed to send metrics to backend:', error);
        }
    }

    getSessionId() {
        let sessionId = sessionStorage.getItem('performanceSessionId');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('performanceSessionId', sessionId);
        }
        return sessionId;
    }

    // Public API Methods
    getMetrics() {
        return {
            ...this.metrics,
            runtime: performance.now() - this.startTime
        };
    }

    getWebVitals() {
        return {
            lcp: this.metrics.pageLoad.lcp,
            fid: this.metrics.pageLoad.fid,
            cls: this.metrics.pageLoad.cls,
            fcp: { value: this.metrics.pageLoad.firstContentfulPaint },
            fp: { value: this.metrics.pageLoad.firstPaint }
        };
    }

    getPerformanceScore() {
        const vitals = this.getWebVitals();
        let score = 100;
        
        // LCP scoring (good: <2.5s, poor: >4s)
        if (vitals.lcp?.value > 4000) score -= 30;
        else if (vitals.lcp?.value > 2500) score -= 15;
        
        // FID scoring (good: <100ms, poor: >300ms)
        if (vitals.fid?.value > 300) score -= 25;
        else if (vitals.fid?.value > 100) score -= 10;
        
        // CLS scoring (good: <0.1, poor: >0.25)
        if (vitals.cls?.value > 0.25) score -= 25;
        else if (vitals.cls?.value > 0.1) score -= 10;
        
        // Error penalty
        score -= this.metrics.errors.length * 5;
        
        return Math.max(0, Math.min(100, score));
    }

    generateReport() {
        const vitals = this.getWebVitals();
        const score = this.getPerformanceScore();
        
        return {
            score,
            vitals,
            summary: {
                totalInteractions: this.metrics.userInteractions.length,
                totalErrors: this.metrics.errors.length,
                componentsLoaded: this.metrics.componentLoads.length,
                resourcesLoaded: this.metrics.resourceTimings.length,
                averageComponentLoadTime: this.getAverageComponentLoadTime(),
                memoryPressure: this.getMemoryPressure()
            },
            recommendations: this.generateRecommendations()
        };
    }

    getAverageComponentLoadTime() {
        if (this.metrics.componentLoads.length === 0) return 0;
        
        const total = this.metrics.componentLoads.reduce((sum, load) => sum + load.loadTime, 0);
        return total / this.metrics.componentLoads.length;
    }

    getMemoryPressure() {
        if (this.metrics.memoryUsage.length === 0) return 'unknown';
        
        const latest = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
        const usageRatio = latest.used / latest.limit;
        
        if (usageRatio > 0.9) return 'high';
        if (usageRatio > 0.7) return 'medium';
        return 'low';
    }

    generateRecommendations() {
        const recommendations = [];
        const vitals = this.getWebVitals();
        
        if (vitals.lcp?.value > 2500) {
            recommendations.push('Optimize Largest Contentful Paint by reducing server response times and optimizing images');
        }
        
        if (vitals.fid?.value > 100) {
            recommendations.push('Reduce First Input Delay by optimizing JavaScript execution and using code splitting');
        }
        
        if (vitals.cls?.value > 0.1) {
            recommendations.push('Minimize Cumulative Layout Shift by setting image dimensions and avoiding dynamic content insertion');
        }
        
        if (this.metrics.errors.length > 5) {
            recommendations.push('Investigate and fix JavaScript errors to improve stability');
        }
        
        if (this.getMemoryPressure() === 'high') {
            recommendations.push('Optimize memory usage by cleaning up unused variables and implementing proper garbage collection');
        }
        
        return recommendations;
    }

    // Utility methods
    enable() {
        this.isEnabled = true;
        console.log('📊 [PERFORMANCE] Performance monitoring enabled');
    }

    disable() {
        this.isEnabled = false;
        Object.values(this.observers).forEach(observer => observer.disconnect());
        console.log('📊 [PERFORMANCE] Performance monitoring disabled');
    }

    reset() {
        this.metrics = {
            pageLoad: {},
            userInteractions: [],
            resourceTimings: [],
            componentLoads: [],
            memoryUsage: [],
            errors: []
        };
        this.startTime = performance.now();
        console.log('📊 [PERFORMANCE] Metrics reset');
    }
}

// Initialize global performance monitor
window.performanceMonitor = new PerformanceMonitor();

// Component load tracking integration
window.addEventListener('componentLoaded', (event) => {
    const loadTime = performance.now();
    window.performanceMonitor.trackComponentLoad(event.detail.componentPath, loadTime);
});

// ✅ Browser-compatible export
if (typeof window !== 'undefined') {
    window.PerformanceMonitor = PerformanceMonitor;
}

console.log('✅ [PERFORMANCE MONITOR] Performance monitoring system initialized');
console.log('📊 [DEBUG] Use window.performanceMonitor.generateReport() to view performance analysis');
console.log('📊 [DEBUG] Use window.performanceMonitor.getWebVitals() to view Core Web Vitals');
console.log('📊 [DEBUG] Use window.performanceMonitor.getPerformanceScore() to get overall score');