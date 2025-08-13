/**
 * 📊 ANALYTICS MONITOR
 * Comprehensive monitoring and analytics for performance tracking
 */

class AnalyticsMonitor {
    constructor() {
        this.metrics = new Map();
        this.events = [];
        this.observers = new Set();
        this.timers = new Map();
        this.vitals = new Map();
        
        this.config = {
            maxEvents: 1000,
            maxMetrics: 500,
            trackingInterval: 5000,
            reportingInterval: 60000,
            enableRUM: true, // Real User Monitoring
            enableCoreWebVitals: true,
            enableResourceTiming: true,
            enableUserTiming: true,
            batchSize: 50,
            offlineStorage: true
        };

        this.collectors = {
            performance: true,
            errors: true,
            interactions: true,
            resources: true,
            navigation: true,
            vitals: true,
            memory: true,
            network: true
        };

        this.offlineQueue = [];
        this.sessionId = this.generateSessionId();
        this.initialize();
    }

    initialize() {
        console.log('📊 [ANALYTICS] Initializing comprehensive analytics monitoring...');
        
        // Setup Core Web Vitals monitoring
        this.setupCoreWebVitals();
        
        // Setup Real User Monitoring
        this.setupRealUserMonitoring();
        
        // Setup error tracking
        this.setupErrorTracking();
        
        // Setup resource monitoring
        this.setupResourceMonitoring();
        
        // Setup interaction tracking
        this.setupInteractionTracking();
        
        // Setup performance observers
        this.setupPerformanceObservers();
        
        // Setup network monitoring
        this.setupNetworkMonitoring();
        
        // Setup memory monitoring
        this.setupMemoryMonitoring();
        
        // Setup reporting
        this.setupReporting();
        
        console.log('✅ [ANALYTICS] Analytics monitoring system ready');
    }

    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return `rbck_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Setup Core Web Vitals monitoring
     */
    setupCoreWebVitals() {
        if (!this.config.enableCoreWebVitals || !('PerformanceObserver' in window)) return;
        
        try {
            // Cumulative Layout Shift (CLS)
            const clsObserver = new PerformanceObserver((list) => {
                let clsValue = 0;
                list.getEntries().forEach((entry) => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                });
                
                this.recordVital('CLS', clsValue);
                
                if (clsValue > 0.25) { // Poor CLS threshold
                    console.warn(`📊 [ANALYTICS] Poor CLS detected: ${clsValue.toFixed(4)}`);
                }
            });
            
            clsObserver.observe({ type: 'layout-shift', buffered: true });
            this.observers.add(clsObserver);
            
            // Largest Contentful Paint (LCP)
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                const lcp = lastEntry.startTime;
                
                this.recordVital('LCP', lcp);
                
                if (lcp > 4000) { // Poor LCP threshold
                    console.warn(`📊 [ANALYTICS] Poor LCP detected: ${lcp.toFixed(2)}ms`);
                }
            });
            
            lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
            this.observers.add(lcpObserver);
            
            // First Input Delay (FID)
            const fidObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    const fid = entry.processingStart - entry.startTime;
                    this.recordVital('FID', fid);
                    
                    if (fid > 300) { // Poor FID threshold
                        console.warn(`📊 [ANALYTICS] Poor FID detected: ${fid.toFixed(2)}ms`);
                    }
                });
            });
            
            fidObserver.observe({ type: 'first-input', buffered: true });
            this.observers.add(fidObserver);
            
            // First Contentful Paint (FCP)
            const fcpObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.name === 'first-contentful-paint') {
                        this.recordVital('FCP', entry.startTime);
                    }
                });
            });
            
            fcpObserver.observe({ type: 'paint', buffered: true });
            this.observers.add(fcpObserver);
            
            console.log('✅ [ANALYTICS] Core Web Vitals monitoring enabled');
            
        } catch (error) {
            console.error('❌ [ANALYTICS] Core Web Vitals setup failed:', error);
        }
    }

    /**
     * Record vital metric
     */
    recordVital(name, value) {
        const vital = {
            name,
            value,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            url: window.location.href
        };
        
        this.vitals.set(name, vital);
        this.trackEvent('vital', vital);
        
        console.log(`📊 [ANALYTICS] ${name}: ${typeof value === 'number' ? value.toFixed(2) : value}`);
    }

    /**
     * Setup Real User Monitoring
     */
    setupRealUserMonitoring() {
        if (!this.config.enableRUM) return;
        
        // Track page load performance
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.collectNavigationTiming();
                this.collectResourceTiming();
            }, 0);
        });
        
        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            this.trackEvent('visibility_change', {
                hidden: document.hidden,
                timestamp: Date.now()
            });
        });
        
        // Track user agent and device info
        this.collectDeviceInfo();
        
        console.log('✅ [ANALYTICS] Real User Monitoring enabled');
    }

    /**
     * Collect navigation timing data
     */
    collectNavigationTiming() {
        if (!('performance' in window) || !performance.getEntriesByType) return;
        
        const navigation = performance.getEntriesByType('navigation')[0];
        if (!navigation) return;
        
        const timing = {
            dns: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcp: navigation.connectEnd - navigation.connectStart,
            ssl: navigation.secureConnectionStart > 0 ? 
                navigation.connectEnd - navigation.secureConnectionStart : 0,
            ttfb: navigation.responseStart - navigation.requestStart,
            download: navigation.responseEnd - navigation.responseStart,
            domParsing: navigation.domContentLoadedEventEnd - navigation.responseEnd,
            resourceLoad: navigation.loadEventEnd - navigation.domContentLoadedEventEnd,
            totalLoad: navigation.loadEventEnd - navigation.fetchStart
        };
        
        this.recordMetric('navigation_timing', timing);
        
        // Log warnings for slow timings
        if (timing.totalLoad > 5000) {
            console.warn(`📊 [ANALYTICS] Slow page load: ${timing.totalLoad}ms`);
        }
        if (timing.ttfb > 1000) {
            console.warn(`📊 [ANALYTICS] Slow TTFB: ${timing.ttfb}ms`);
        }
    }

    /**
     * Collect resource timing data
     */
    collectResourceTiming() {
        if (!this.config.enableResourceTiming || !('performance' in window)) return;
        
        const resources = performance.getEntriesByType('resource');
        const resourceMetrics = {
            totalResources: resources.length,
            totalSize: 0,
            averageLoadTime: 0,
            slowResources: [],
            resourceTypes: {}
        };
        
        let totalLoadTime = 0;
        
        resources.forEach(resource => {
            const loadTime = resource.responseEnd - resource.startTime;
            totalLoadTime += loadTime;
            
            // Track resource types
            const type = this.getResourceType(resource.name);
            resourceMetrics.resourceTypes[type] = (resourceMetrics.resourceTypes[type] || 0) + 1;
            
            // Track slow resources
            if (loadTime > 2000) { // > 2 seconds
                resourceMetrics.slowResources.push({
                    name: resource.name,
                    loadTime,
                    size: resource.transferSize || 0
                });
            }
            
            // Estimate total size
            if (resource.transferSize) {
                resourceMetrics.totalSize += resource.transferSize;
            }
        });
        
        resourceMetrics.averageLoadTime = totalLoadTime / resources.length;
        
        this.recordMetric('resource_timing', resourceMetrics);
        
        if (resourceMetrics.slowResources.length > 0) {
            console.warn(`📊 [ANALYTICS] ${resourceMetrics.slowResources.length} slow resources detected`);
        }
    }

    /**
     * Get resource type from URL
     */
    getResourceType(url) {
        if (url.match(/\.(js)$/i)) return 'script';
        if (url.match(/\.(css)$/i)) return 'stylesheet';
        if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) return 'image';
        if (url.match(/\.(woff|woff2|ttf|eot)$/i)) return 'font';
        if (url.includes('/api/')) return 'xhr';
        return 'other';
    }

    /**
     * Collect device and browser information
     */
    collectDeviceInfo() {
        const deviceInfo = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            devicePixelRatio: window.devicePixelRatio || 1,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            } : null
        };
        
        this.recordMetric('device_info', deviceInfo);
    }

    /**
     * Setup error tracking
     */
    setupErrorTracking() {
        if (!this.collectors.errors) return;
        
        // JavaScript errors
        window.addEventListener('error', (event) => {
            this.trackError({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                line: event.lineno,
                column: event.colno,
                stack: event.error?.stack,
                timestamp: Date.now()
            });
        });
        
        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.trackError({
                type: 'unhandled_promise',
                message: event.reason?.message || 'Unhandled promise rejection',
                stack: event.reason?.stack,
                timestamp: Date.now()
            });
        });
        
        // Resource loading errors
        window.addEventListener('error', (event) => {
            if (event.target && event.target !== window) {
                this.trackError({
                    type: 'resource',
                    element: event.target.tagName,
                    source: event.target.src || event.target.href,
                    timestamp: Date.now()
                });
            }
        }, true);
        
        console.log('✅ [ANALYTICS] Error tracking enabled');
    }

    /**
     * Track error with context
     */
    trackError(errorData) {
        const error = {
            ...errorData,
            sessionId: this.sessionId,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: Date.now()
        };
        
        this.trackEvent('error', error);
        console.error('📊 [ANALYTICS] Error tracked:', errorData);
    }

    /**
     * Setup interaction tracking
     */
    setupInteractionTracking() {
        if (!this.collectors.interactions) return;
        
        // Track clicks
        document.addEventListener('click', (event) => {
            this.trackInteraction('click', {
                element: event.target.tagName,
                id: event.target.id,
                className: event.target.className,
                text: event.target.textContent?.substring(0, 50),
                x: event.clientX,
                y: event.clientY
            });
        });
        
        // Track form submissions
        document.addEventListener('submit', (event) => {
            this.trackInteraction('form_submit', {
                formId: event.target.id,
                formAction: event.target.action,
                fieldCount: event.target.elements.length
            });
        });
        
        // Track scroll depth
        let maxScrollDepth = 0;
        window.addEventListener('scroll', this.throttle(() => {
            const scrollPercent = (window.scrollY + window.innerHeight) / document.body.scrollHeight * 100;
            if (scrollPercent > maxScrollDepth) {
                maxScrollDepth = Math.round(scrollPercent);
                
                // Track milestone scroll depths
                if (maxScrollDepth % 25 === 0 && maxScrollDepth <= 100) {
                    this.trackInteraction('scroll', { depth: maxScrollDepth });
                }
            }
        }, 1000));
        
        console.log('✅ [ANALYTICS] Interaction tracking enabled');
    }

    /**
     * Track user interaction
     */
    trackInteraction(type, data) {
        this.trackEvent('interaction', {
            type,
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Setup performance observers
     */
    setupPerformanceObservers() {
        if (!('PerformanceObserver' in window)) return;
        
        // User timing marks and measures
        if (this.config.enableUserTiming) {
            const userTimingObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    this.trackEvent('user_timing', {
                        name: entry.name,
                        entryType: entry.entryType,
                        startTime: entry.startTime,
                        duration: entry.duration || 0
                    });
                });
            });
            
            userTimingObserver.observe({ entryTypes: ['mark', 'measure'] });
            this.observers.add(userTimingObserver);
        }
        
        // Long task detection
        try {
            const longTaskObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    console.warn(`📊 [ANALYTICS] Long task detected: ${entry.duration.toFixed(2)}ms`);
                    this.trackEvent('long_task', {
                        duration: entry.duration,
                        startTime: entry.startTime
                    });
                });
            });
            
            longTaskObserver.observe({ entryTypes: ['longtask'] });
            this.observers.add(longTaskObserver);
        } catch (e) {
            // Long task API not supported in all browsers
        }
    }

    /**
     * Setup network monitoring
     */
    setupNetworkMonitoring() {
        if (!this.collectors.network) return;
        
        // Monitor connection changes
        if ('connection' in navigator) {
            const connection = navigator.connection;
            
            const trackConnection = () => {
                this.recordMetric('network_info', {
                    effectiveType: connection.effectiveType,
                    downlink: connection.downlink,
                    rtt: connection.rtt,
                    saveData: connection.saveData
                });
            };
            
            connection.addEventListener('change', trackConnection);
            trackConnection(); // Initial measurement
        }
        
        // Monitor online/offline status
        window.addEventListener('online', () => {
            this.trackEvent('network', { status: 'online', timestamp: Date.now() });
        });
        
        window.addEventListener('offline', () => {
            this.trackEvent('network', { status: 'offline', timestamp: Date.now() });
        });
    }

    /**
     * Setup memory monitoring
     */
    setupMemoryMonitoring() {
        if (!this.collectors.memory || !('performance' in window) || !('memory' in performance)) return;
        
        const monitorMemory = () => {
            const memory = performance.memory;
            this.recordMetric('memory_usage', {
                used: memory.usedJSHeapSize,
                total: memory.totalJSHeapSize,
                limit: memory.jsHeapSizeLimit,
                percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
            });
        };
        
        // Monitor memory every 30 seconds
        setInterval(monitorMemory, 30000);
        monitorMemory(); // Initial measurement
        
        console.log('✅ [ANALYTICS] Memory monitoring enabled');
    }

    /**
     * Setup automated reporting
     */
    setupReporting() {
        // Send data periodically
        setInterval(() => {
            this.sendBatchData();
        }, this.config.reportingInterval);
        
        // Send data on page unload
        window.addEventListener('beforeunload', () => {
            this.sendBatchData(true);
        });
        
        // Send data when page becomes hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.sendBatchData();
            }
        });
    }

    /**
     * Record metric
     */
    recordMetric(name, value) {
        const metric = {
            name,
            value,
            timestamp: Date.now(),
            sessionId: this.sessionId
        };
        
        this.metrics.set(`${name}_${Date.now()}`, metric);
        
        // Cleanup old metrics
        if (this.metrics.size > this.config.maxMetrics) {
            const oldestKey = this.metrics.keys().next().value;
            this.metrics.delete(oldestKey);
        }
    }

    /**
     * Track event
     */
    trackEvent(type, data) {
        const event = {
            type,
            data,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            url: window.location.href
        };
        
        this.events.push(event);
        
        // Cleanup old events
        if (this.events.length > this.config.maxEvents) {
            this.events.shift();
        }
    }

    /**
     * Send batch data to analytics endpoint
     */
    async sendBatchData(force = false) {
        const eventsToSend = this.events.slice();
        const metricsToSend = Array.from(this.metrics.values());
        const vitalsToSend = Array.from(this.vitals.values());
        
        if (!force && eventsToSend.length < this.config.batchSize) {
            return; // Wait for more data
        }
        
        const payload = {
            sessionId: this.sessionId,
            timestamp: Date.now(),
            url: window.location.href,
            events: eventsToSend,
            metrics: metricsToSend,
            vitals: vitalsToSend,
            userAgent: navigator.userAgent
        };
        
        try {
            if ('navigator' in window && 'sendBeacon' in navigator) {
                // Use sendBeacon for reliability during page unload
                const success = navigator.sendBeacon(
                    '/api/analytics',
                    JSON.stringify(payload)
                );
                
                if (success) {
                    this.clearSentData();
                    console.log(`📊 [ANALYTICS] Sent ${eventsToSend.length} events via beacon`);
                }
            } else {
                // Fallback to fetch
                const response = await fetch('/api/analytics', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                
                if (response.ok) {
                    this.clearSentData();
                    console.log(`📊 [ANALYTICS] Sent ${eventsToSend.length} events via fetch`);
                }
            }
            
        } catch (error) {
            console.error('📊 [ANALYTICS] Failed to send data:', error);
            
            // Store in offline queue if enabled
            if (this.config.offlineStorage) {
                this.offlineQueue.push(payload);
            }
        }
    }

    /**
     * Clear sent data
     */
    clearSentData() {
        this.events.length = 0;
        this.metrics.clear();
    }

    /**
     * Throttle function calls
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Start custom timing
     */
    startTiming(name) {
        this.timers.set(name, Date.now());
        
        if ('performance' in window && 'mark' in performance) {
            performance.mark(`${name}_start`);
        }
    }

    /**
     * End custom timing
     */
    endTiming(name) {
        const startTime = this.timers.get(name);
        if (!startTime) return;
        
        const duration = Date.now() - startTime;
        this.timers.delete(name);
        
        if ('performance' in window && 'mark' in performance && 'measure' in performance) {
            performance.mark(`${name}_end`);
            performance.measure(name, `${name}_start`, `${name}_end`);
        }
        
        this.recordMetric('custom_timing', { name, duration });
        return duration;
    }

    /**
     * Get analytics summary
     */
    getSummary() {
        return {
            sessionId: this.sessionId,
            events: this.events.length,
            metrics: this.metrics.size,
            vitals: Object.fromEntries(this.vitals),
            observers: this.observers.size,
            offlineQueue: this.offlineQueue.length,
            config: this.config,
            collectors: this.collectors
        };
    }

    /**
     * Generate analytics report
     */
    generateReport() {
        const summary = this.getSummary();
        const vitals = summary.vitals;
        
        console.group('📊 [ANALYTICS] Performance Report');
        console.log('Session ID:', summary.sessionId);
        console.log('Events Tracked:', summary.events);
        console.log('Metrics Collected:', summary.metrics);
        
        if (vitals.CLS) {
            const clsRating = vitals.CLS.value <= 0.1 ? 'Good' : vitals.CLS.value <= 0.25 ? 'Needs Improvement' : 'Poor';
            console.log(`CLS: ${vitals.CLS.value.toFixed(4)} (${clsRating})`);
        }
        
        if (vitals.LCP) {
            const lcpRating = vitals.LCP.value <= 2500 ? 'Good' : vitals.LCP.value <= 4000 ? 'Needs Improvement' : 'Poor';
            console.log(`LCP: ${vitals.LCP.value.toFixed(2)}ms (${lcpRating})`);
        }
        
        if (vitals.FID) {
            const fidRating = vitals.FID.value <= 100 ? 'Good' : vitals.FID.value <= 300 ? 'Needs Improvement' : 'Poor';
            console.log(`FID: ${vitals.FID.value.toFixed(2)}ms (${fidRating})`);
        }
        
        console.log('Active Observers:', summary.observers);
        console.log('Offline Queue:', summary.offlineQueue);
        console.groupEnd();
        
        return summary;
    }

    /**
     * Cleanup and disconnect observers
     */
    destroy() {
        this.observers.forEach(observer => {
            try {
                observer.disconnect();
            } catch (e) {
                // Observer already disconnected
            }
        });
        
        this.observers.clear();
        this.events.length = 0;
        this.metrics.clear();
        this.timers.clear();
        this.vitals.clear();
        
        console.log('📊 [ANALYTICS] Analytics monitor destroyed');
    }
}

// Create global instance
window.analyticsMonitor = new AnalyticsMonitor();

// Global utility functions
window.startTiming = (name) => window.analyticsMonitor.startTiming(name);
window.endTiming = (name) => window.analyticsMonitor.endTiming(name);
window.trackEvent = (type, data) => window.analyticsMonitor.trackEvent(type, data);
window.analyticsReport = () => window.analyticsMonitor.generateReport();

console.log('✅ [ANALYTICS] Analytics monitoring system ready');