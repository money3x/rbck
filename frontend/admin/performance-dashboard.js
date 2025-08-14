/**
 * RBCK CMS - Performance Monitoring Dashboard
 * Real-time performance monitoring and analytics
 */

class PerformanceDashboard {
    constructor() {
        this.metrics = {
            pageLoad: {},
            navigation: {},
            resources: [],
            memory: {},
            network: {},
            userTiming: {},
            vitals: {}
        };
        this.observers = [];
        this.initialized = false;
        this.updateInterval = 5000; // 5 seconds
    }

    init() {
        if (this.initialized) return;

        console.log('📊 [PERF DASHBOARD] Initializing performance monitoring...');

        // Collect initial metrics
        this.collectPageLoadMetrics();
        this.collectNavigationMetrics();
        this.collectResourceMetrics();

        // Start continuous monitoring
        this.startContinuousMonitoring();

        // Set up performance observers
        this.setupPerformanceObservers();

        // Monitor Core Web Vitals
        this.monitorWebVitals();

        // Create dashboard UI (if not in production)
        if (this.shouldShowDashboard()) {
            this.createDashboardUI();
        }

        this.initialized = true;
        console.log('✅ [PERF DASHBOARD] Performance monitoring initialized');
    }

    collectPageLoadMetrics() {
        if (!window.performance) return;

        const perfData = performance.getEntriesByType('navigation')[0];
        if (perfData) {
            this.metrics.pageLoad = {
                domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
                domInteractive: perfData.domInteractive - perfData.navigationStart,
                firstPaint: this.getFirstPaint(),
                firstContentfulPaint: this.getFirstContentfulPaint(),
                timeToInteractive: this.calculateTTI(),
                totalLoadTime: perfData.loadEventEnd - perfData.navigationStart
            };
        }
    }

    collectNavigationMetrics() {
        if (!window.performance) return;

        const navData = performance.getEntriesByType('navigation')[0];
        if (navData) {
            this.metrics.navigation = {
                dns: navData.domainLookupEnd - navData.domainLookupStart,
                tcp: navData.connectEnd - navData.connectStart,
                ssl: navData.secureConnectionStart ? navData.connectEnd - navData.secureConnectionStart : 0,
                ttfb: navData.responseStart - navData.requestStart,
                download: navData.responseEnd - navData.responseStart,
                processing: navData.domComplete - navData.responseEnd
            };
        }
    }

    collectResourceMetrics() {
        if (!window.performance) return;

        const resources = performance.getEntriesByType('resource');
        
        this.metrics.resources = resources.map(resource => ({
            name: resource.name,
            type: this.getResourceType(resource),
            size: resource.transferSize,
            duration: resource.duration,
            cached: resource.transferSize === 0 && resource.decodedBodySize > 0
        }));

        // Summary statistics
        const totalSize = this.metrics.resources.reduce((sum, r) => sum + r.size, 0);
        const cachedResources = this.metrics.resources.filter(r => r.cached).length;
        
        this.metrics.resourceSummary = {
            totalResources: resources.length,
            totalSize,
            cachedResources,
            cacheHitRate: (cachedResources / resources.length * 100).toFixed(1) + '%',
            avgLoadTime: (this.metrics.resources.reduce((sum, r) => sum + r.duration, 0) / resources.length).toFixed(2)
        };
    }

    startContinuousMonitoring() {
        setInterval(() => {
            this.collectMemoryMetrics();
            this.collectNetworkMetrics();
            this.updateDashboard();
        }, this.updateInterval);
    }

    collectMemoryMetrics() {
        if ('memory' in performance) {
            const memory = performance.memory;
            this.metrics.memory = {
                used: memory.usedJSHeapSize,
                total: memory.totalJSHeapSize,
                limit: memory.jsHeapSizeLimit,
                usagePercent: (memory.usedJSHeapSize / memory.totalJSHeapSize * 100).toFixed(1)
            };
        }
    }

    collectNetworkMetrics() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            this.metrics.network = {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData
            };
        }
    }

    setupPerformanceObservers() {
        if (!window.PerformanceObserver) return;

        // Long Task Observer
        try {
            const longTaskObserver = new PerformanceObserver((list) => {
                const longTasks = list.getEntries();
                longTasks.forEach(task => {
                    if (task.duration > 50) { // Tasks longer than 50ms
                        console.warn(`🐌 [PERF] Long task detected: ${task.duration.toFixed(2)}ms`);
                        
                        // Track in vitals
                        this.metrics.vitals.longTasks = this.metrics.vitals.longTasks || [];
                        this.metrics.vitals.longTasks.push({
                            duration: task.duration,
                            startTime: task.startTime,
                            timestamp: Date.now()
                        });
                    }
                });
            });
            
            longTaskObserver.observe({ entryTypes: ['longtask'] });
            this.observers.push(longTaskObserver);
        } catch (e) {
            console.log('📊 [PERF] Long task observer not supported');
        }

        // Layout Shift Observer
        try {
            const layoutShiftObserver = new PerformanceObserver((list) => {
                let cls = 0;
                list.getEntries().forEach(entry => {
                    if (!entry.hadRecentInput) {
                        cls += entry.value;
                    }
                });
                
                if (cls > 0) {
                    this.metrics.vitals.cls = (this.metrics.vitals.cls || 0) + cls;
                    if (cls > 0.1) {
                        console.warn(`📏 [PERF] Cumulative Layout Shift: ${cls.toFixed(4)}`);
                    }
                }
            });
            
            layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
            this.observers.push(layoutShiftObserver);
        } catch (e) {
            console.log('📊 [PERF] Layout shift observer not supported');
        }

        // First Input Delay Observer
        try {
            const fidObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    const fid = entry.processingStart - entry.startTime;
                    this.metrics.vitals.fid = fid;
                    
                    if (fid > 100) {
                        console.warn(`⌨️ [PERF] High First Input Delay: ${fid.toFixed(2)}ms`);
                    }
                });
            });
            
            fidObserver.observe({ entryTypes: ['first-input'] });
            this.observers.push(fidObserver);
        } catch (e) {
            console.log('📊 [PERF] First input delay observer not supported');
        }
    }

    monitorWebVitals() {
        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.metrics.vitals.lcp = lastEntry.startTime;
            
            if (lastEntry.startTime > 2500) {
                console.warn(`🖼️ [PERF] Poor LCP: ${lastEntry.startTime.toFixed(2)}ms`);
            }
        });
        
        try {
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            this.observers.push(lcpObserver);
        } catch (e) {
            console.log('📊 [PERF] LCP observer not supported');
        }
    }

    getFirstPaint() {
        const fpEntry = performance.getEntriesByName('first-paint')[0];
        return fpEntry ? fpEntry.startTime : null;
    }

    getFirstContentfulPaint() {
        const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
        return fcpEntry ? fcpEntry.startTime : null;
    }

    calculateTTI() {
        // Simplified TTI calculation
        const navEntry = performance.getEntriesByType('navigation')[0];
        return navEntry ? navEntry.domContentLoadedEventEnd : null;
    }

    getResourceType(resource) {
        const url = new URL(resource.name);
        const extension = url.pathname.split('.').pop().toLowerCase();
        
        const types = {
            js: ['js'],
            css: ['css'],
            image: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'],
            font: ['woff', 'woff2', 'ttf', 'eot'],
            document: ['html'],
            xhr: []
        };
        
        for (const [type, extensions] of Object.entries(types)) {
            if (extensions.includes(extension)) return type;
        }
        
        return resource.initiatorType || 'other';
    }

    shouldShowDashboard() {
        return localStorage.getItem('rbck_show_perf_dashboard') === 'true' ||
               window.location.search.includes('perf=true') ||
               window.location.hostname === 'localhost';
    }

    createDashboardUI() {
        // Create floating performance dashboard
        const dashboard = document.createElement('div');
        dashboard.id = 'performance-dashboard';
        dashboard.innerHTML = `
            <div class="perf-header">
                <span>📊 Performance</span>
                <button id="perf-toggle" title="Toggle Dashboard">−</button>
                <button id="perf-close" title="Close Dashboard">×</button>
            </div>
            <div class="perf-content">
                <div class="perf-section">
                    <h4>Core Web Vitals</h4>
                    <div id="vitals-display"></div>
                </div>
                <div class="perf-section">
                    <h4>Memory Usage</h4>
                    <div id="memory-display"></div>
                </div>
                <div class="perf-section">
                    <h4>Network</h4>
                    <div id="network-display"></div>
                </div>
                <div class="perf-section">
                    <h4>Resources</h4>
                    <div id="resources-display"></div>
                </div>
            </div>
        `;

        // Add CSS
        const style = document.createElement('style');
        style.textContent = `
            #performance-dashboard {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 320px;
                background: #1a1a2e;
                color: #f0f6fc;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                z-index: 10000;
                font-family: 'Monaco', 'Menlo', monospace;
                font-size: 12px;
            }
            
            .perf-header {
                background: #0f172a;
                padding: 10px;
                border-radius: 8px 8px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: move;
            }
            
            .perf-header button {
                background: none;
                border: none;
                color: #f0f6fc;
                cursor: pointer;
                padding: 2px 6px;
                border-radius: 3px;
            }
            
            .perf-header button:hover {
                background: rgba(255,255,255,0.1);
            }
            
            .perf-content {
                padding: 10px;
                max-height: 400px;
                overflow-y: auto;
            }
            
            .perf-section {
                margin-bottom: 15px;
                border-bottom: 1px solid #374151;
                padding-bottom: 10px;
            }
            
            .perf-section h4 {
                margin: 0 0 8px 0;
                color: #60a5fa;
                font-size: 13px;
            }
            
            .perf-metric {
                display: flex;
                justify-content: space-between;
                margin: 4px 0;
                padding: 2px 0;
            }
            
            .perf-value {
                font-weight: bold;
            }
            
            .perf-good { color: #10b981; }
            .perf-warning { color: #f59e0b; }
            .perf-poor { color: #ef4444; }
            
            .perf-hidden .perf-content {
                display: none;
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(dashboard);

        // Add event handlers
        document.getElementById('perf-toggle').addEventListener('click', () => {
            dashboard.classList.toggle('perf-hidden');
        });

        document.getElementById('perf-close').addEventListener('click', () => {
            dashboard.remove();
            style.remove();
        });

        // Make draggable
        this.makeDraggable(dashboard);

        // Initial update
        this.updateDashboard();

        console.log('✅ [PERF DASHBOARD] Dashboard UI created');
    }

    updateDashboard() {
        const dashboard = document.getElementById('performance-dashboard');
        if (!dashboard) return;

        // Update vitals
        const vitalsDisplay = document.getElementById('vitals-display');
        if (vitalsDisplay) {
            vitalsDisplay.innerHTML = `
                <div class="perf-metric">
                    <span>LCP:</span>
                    <span class="perf-value ${this.getVitalClass('lcp', this.metrics.vitals.lcp)}">
                        ${this.metrics.vitals.lcp ? this.metrics.vitals.lcp.toFixed(0) + 'ms' : 'N/A'}
                    </span>
                </div>
                <div class="perf-metric">
                    <span>FID:</span>
                    <span class="perf-value ${this.getVitalClass('fid', this.metrics.vitals.fid)}">
                        ${this.metrics.vitals.fid ? this.metrics.vitals.fid.toFixed(1) + 'ms' : 'N/A'}
                    </span>
                </div>
                <div class="perf-metric">
                    <span>CLS:</span>
                    <span class="perf-value ${this.getVitalClass('cls', this.metrics.vitals.cls)}">
                        ${this.metrics.vitals.cls ? this.metrics.vitals.cls.toFixed(4) : 'N/A'}
                    </span>
                </div>
            `;
        }

        // Update memory
        const memoryDisplay = document.getElementById('memory-display');
        if (memoryDisplay && this.metrics.memory.used) {
            memoryDisplay.innerHTML = `
                <div class="perf-metric">
                    <span>Used:</span>
                    <span class="perf-value">${(this.metrics.memory.used / 1048576).toFixed(1)} MB</span>
                </div>
                <div class="perf-metric">
                    <span>Usage:</span>
                    <span class="perf-value ${this.getMemoryClass(this.metrics.memory.usagePercent)}">
                        ${this.metrics.memory.usagePercent}%
                    </span>
                </div>
            `;
        }

        // Update network
        const networkDisplay = document.getElementById('network-display');
        if (networkDisplay && this.metrics.network.effectiveType) {
            networkDisplay.innerHTML = `
                <div class="perf-metric">
                    <span>Connection:</span>
                    <span class="perf-value">${this.metrics.network.effectiveType}</span>
                </div>
                <div class="perf-metric">
                    <span>Downlink:</span>
                    <span class="perf-value">${this.metrics.network.downlink} Mbps</span>
                </div>
                <div class="perf-metric">
                    <span>RTT:</span>
                    <span class="perf-value">${this.metrics.network.rtt}ms</span>
                </div>
            `;
        }

        // Update resources
        const resourcesDisplay = document.getElementById('resources-display');
        if (resourcesDisplay && this.metrics.resourceSummary) {
            resourcesDisplay.innerHTML = `
                <div class="perf-metric">
                    <span>Total:</span>
                    <span class="perf-value">${this.metrics.resourceSummary.totalResources}</span>
                </div>
                <div class="perf-metric">
                    <span>Size:</span>
                    <span class="perf-value">${(this.metrics.resourceSummary.totalSize / 1024).toFixed(1)} KB</span>
                </div>
                <div class="perf-metric">
                    <span>Cache Hit:</span>
                    <span class="perf-value">${this.metrics.resourceSummary.cacheHitRate}</span>
                </div>
            `;
        }
    }

    getVitalClass(metric, value) {
        if (!value) return '';
        
        const thresholds = {
            lcp: { good: 2500, poor: 4000 },
            fid: { good: 100, poor: 300 },
            cls: { good: 0.1, poor: 0.25 }
        };
        
        const threshold = thresholds[metric];
        if (value <= threshold.good) return 'perf-good';
        if (value <= threshold.poor) return 'perf-warning';
        return 'perf-poor';
    }

    getMemoryClass(percentage) {
        const value = parseFloat(percentage);
        if (value < 60) return 'perf-good';
        if (value < 80) return 'perf-warning';
        return 'perf-poor';
    }

    makeDraggable(element) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        const header = element.querySelector('.perf-header');
        
        header.onmousedown = dragMouseDown;
        
        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }
        
        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
            element.style.right = 'auto';
        }
        
        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    // Public API methods
    getPerformanceReport() {
        return {
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            metrics: this.metrics,
            scores: {
                overall: this.calculateOverallScore(),
                webVitals: this.calculateWebVitalsScore(),
                resources: this.calculateResourceScore()
            }
        };
    }

    calculateOverallScore() {
        // Simplified scoring algorithm
        let score = 100;
        
        // Penalize for poor web vitals
        if (this.metrics.vitals.lcp > 4000) score -= 20;
        else if (this.metrics.vitals.lcp > 2500) score -= 10;
        
        if (this.metrics.vitals.fid > 300) score -= 20;
        else if (this.metrics.vitals.fid > 100) score -= 10;
        
        if (this.metrics.vitals.cls > 0.25) score -= 20;
        else if (this.metrics.vitals.cls > 0.1) score -= 10;
        
        // Penalize for high memory usage
        if (this.metrics.memory.usagePercent > 80) score -= 15;
        else if (this.metrics.memory.usagePercent > 60) score -= 5;
        
        return Math.max(0, score);
    }

    calculateWebVitalsScore() {
        let score = 100;
        let metrics = 0;
        
        if (this.metrics.vitals.lcp) {
            metrics++;
            if (this.metrics.vitals.lcp > 4000) score -= 33;
            else if (this.metrics.vitals.lcp > 2500) score -= 17;
        }
        
        if (this.metrics.vitals.fid) {
            metrics++;
            if (this.metrics.vitals.fid > 300) score -= 33;
            else if (this.metrics.vitals.fid > 100) score -= 17;
        }
        
        if (this.metrics.vitals.cls) {
            metrics++;
            if (this.metrics.vitals.cls > 0.25) score -= 33;
            else if (this.metrics.vitals.cls > 0.1) score -= 17;
        }
        
        return metrics > 0 ? Math.max(0, score) : null;
    }

    calculateResourceScore() {
        if (!this.metrics.resourceSummary) return null;
        
        let score = 100;
        const summary = this.metrics.resourceSummary;
        
        // Penalize for large bundle sizes
        if (summary.totalSize > 1000000) score -= 20; // > 1MB
        else if (summary.totalSize > 500000) score -= 10; // > 500KB
        
        // Reward good cache hit rate
        const cacheRate = parseFloat(summary.cacheHitRate);
        if (cacheRate < 50) score -= 15;
        else if (cacheRate > 80) score += 5;
        
        return Math.max(0, score);
    }

    exportReport() {
        const report = this.getPerformanceReport();
        const blob = new Blob([JSON.stringify(report, null, 2)], { 
            type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `performance-report-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    cleanup() {
        // Clean up observers
        this.observers.forEach(observer => {
            try {
                observer.disconnect();
            } catch (e) {
                // Observer might already be disconnected
            }
        });
        this.observers = [];
    }
}

// Create and initialize performance dashboard
window.PerformanceDashboard = window.PerformanceDashboard || new PerformanceDashboard();

// Add to RBCK namespace
if (window.RBCK) {
    RBCK.perf = RBCK.perf || {};
    RBCK.perf.dashboard = window.PerformanceDashboard;
}

// Auto-initialize
window.PerformanceDashboard.init();

// Expose useful methods globally
window.getPerformanceReport = () => window.PerformanceDashboard.getPerformanceReport();
window.exportPerformanceReport = () => window.PerformanceDashboard.exportReport();
window.showPerfDashboard = () => {
    localStorage.setItem('rbck_show_perf_dashboard', 'true');
    window.location.reload();
};

console.log('✅ [PERF DASHBOARD] Performance monitoring dashboard loaded and initialized');