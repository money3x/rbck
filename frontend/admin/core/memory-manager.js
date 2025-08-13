/**
 * 🧠 MEMORY MANAGER
 * Prevents memory leaks and optimizes memory usage across the application
 */

class MemoryManager {
    constructor() {
        this.intervals = new Set();
        this.eventListeners = new Map();
        this.observers = new Set();
        this.caches = new Set();
        this.references = new WeakMap();
        
        this.config = {
            maxMemoryThreshold: 100 * 1024 * 1024, // 100MB
            cleanupInterval: 60000, // 1 minute
            memoryCheckInterval: 30000, // 30 seconds
            maxEventListeners: 1000,
            maxCacheSize: 500,
            gcSuggestThreshold: 0.8 // Suggest GC at 80% of threshold
        };

        this.stats = {
            intervalsCreated: 0,
            intervalsCleared: 0,
            listenersAdded: 0,
            listenersRemoved: 0,
            observersCreated: 0,
            observersDisconnected: 0,
            memoryLeaksDetected: 0,
            gcSuggestions: 0
        };

        this.initialize();
    }

    initialize() {
        console.log('🧠 [MEMORY MANAGER] Initializing memory management system...');
        
        // Start memory monitoring
        this.startMemoryMonitoring();
        
        // Setup cleanup routines
        this.setupCleanupRoutines();
        
        // Override global functions to track resources
        this.setupResourceTracking();
        
        // Setup page unload cleanup
        this.setupUnloadCleanup();
        
        console.log('✅ [MEMORY MANAGER] Memory manager ready');
    }

    /**
     * Start memory monitoring and leak detection
     */
    startMemoryMonitoring() {
        if (!('performance' in window) || !('memory' in performance)) {
            console.warn('⚠️ [MEMORY MANAGER] Performance.memory API not available');
            return;
        }

        const monitoringInterval = setInterval(() => {
            this.checkMemoryUsage();
            this.detectPotentialLeaks();
        }, this.config.memoryCheckInterval);

        this.trackInterval(monitoringInterval, 'memory-monitoring');
    }

    /**
     * Check current memory usage
     */
    checkMemoryUsage() {
        if (!performance.memory) return;

        const memory = performance.memory;
        const usage = {
            used: memory.usedJSHeapSize,
            total: memory.totalJSHeapSize,
            limit: memory.jsHeapSizeLimit,
            percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        };

        // Log memory stats periodically
        if (Date.now() % 300000 < this.config.memoryCheckInterval) { // Every 5 minutes
            console.log(`🧠 [MEMORY] Used: ${this.formatBytes(usage.used)}, Total: ${this.formatBytes(usage.total)}, Usage: ${usage.percentage.toFixed(1)}%`);
        }

        // Check if approaching memory limit
        if (usage.used > this.config.maxMemoryThreshold) {
            console.warn(`⚠️ [MEMORY MANAGER] High memory usage: ${this.formatBytes(usage.used)}`);
            this.triggerMemoryCleanup();
        }

        // Suggest garbage collection
        if (usage.percentage > this.config.gcSuggestThreshold * 100) {
            this.suggestGarbageCollection();
        }

        return usage;
    }

    /**
     * Detect potential memory leaks
     */
    detectPotentialLeaks() {
        const issues = [];

        // Check for excessive intervals
        if (this.intervals.size > 50) {
            issues.push(`Excessive intervals: ${this.intervals.size}`);
            console.warn(`⚠️ [MEMORY LEAK] Too many intervals: ${this.intervals.size}`);
        }

        // Check for excessive event listeners
        const totalListeners = Array.from(this.eventListeners.values())
            .reduce((sum, listeners) => sum + listeners.size, 0);
        
        if (totalListeners > this.config.maxEventListeners) {
            issues.push(`Excessive event listeners: ${totalListeners}`);
            console.warn(`⚠️ [MEMORY LEAK] Too many event listeners: ${totalListeners}`);
        }

        // Check for excessive observers
        if (this.observers.size > 20) {
            issues.push(`Excessive observers: ${this.observers.size}`);
            console.warn(`⚠️ [MEMORY LEAK] Too many observers: ${this.observers.size}`);
        }

        // Check for DOM node accumulation
        const nodeCount = document.querySelectorAll('*').length;
        if (nodeCount > 5000) {
            issues.push(`High DOM node count: ${nodeCount}`);
            console.warn(`⚠️ [MEMORY LEAK] High DOM node count: ${nodeCount}`);
        }

        if (issues.length > 0) {
            this.stats.memoryLeaksDetected++;
            console.error('❌ [MEMORY LEAK] Potential leaks detected:', issues);
            
            // Trigger cleanup
            this.triggerMemoryCleanup();
        }

        return issues;
    }

    /**
     * Setup resource tracking by overriding global functions
     */
    setupResourceTracking() {
        // Track setInterval
        const originalSetInterval = window.setInterval;
        window.setInterval = (callback, delay, ...args) => {
            const intervalId = originalSetInterval(callback, delay, ...args);
            this.trackInterval(intervalId, 'user-interval');
            return intervalId;
        };

        // Track clearInterval
        const originalClearInterval = window.clearInterval;
        window.clearInterval = (intervalId) => {
            this.untrackInterval(intervalId);
            return originalClearInterval(intervalId);
        };

        // Track setTimeout
        const originalSetTimeout = window.setTimeout;
        window.setTimeout = (callback, delay, ...args) => {
            const timeoutId = originalSetTimeout(() => {
                this.untrackTimeout(timeoutId);
                callback.apply(this, args);
            }, delay);
            this.trackTimeout(timeoutId, 'user-timeout');
            return timeoutId;
        };

        // Track addEventListener
        const originalAddEventListener = EventTarget.prototype.addEventListener;
        EventTarget.prototype.addEventListener = function(type, listener, options) {
            this.memoryManager_trackListener(this, type, listener);
            return originalAddEventListener.call(this, type, listener, options);
        };

        // Track removeEventListener
        const originalRemoveEventListener = EventTarget.prototype.removeEventListener;
        EventTarget.prototype.removeEventListener = function(type, listener, options) {
            this.memoryManager_untrackListener(this, type, listener);
            return originalRemoveEventListener.call(this, type, listener, options);
        };

        // Add tracking methods to EventTarget prototype
        EventTarget.prototype.memoryManager_trackListener = function(target, type, listener) {
            if (!window.memoryManager) return;
            window.memoryManager.trackEventListener(target, type, listener);
        };

        EventTarget.prototype.memoryManager_untrackListener = function(target, type, listener) {
            if (!window.memoryManager) return;
            window.memoryManager.untrackEventListener(target, type, listener);
        };
    }

    /**
     * Track intervals with metadata
     */
    trackInterval(intervalId, source = 'unknown') {
        this.intervals.add({
            id: intervalId,
            source,
            created: Date.now()
        });
        this.stats.intervalsCreated++;
    }

    /**
     * Untrack intervals
     */
    untrackInterval(intervalId) {
        for (const interval of this.intervals) {
            if (interval.id === intervalId) {
                this.intervals.delete(interval);
                this.stats.intervalsCleared++;
                break;
            }
        }
    }

    /**
     * Track timeouts
     */
    trackTimeout(timeoutId, source = 'unknown') {
        setTimeout(() => {
            this.untrackTimeout(timeoutId);
        }, 0);
    }

    untrackTimeout(timeoutId) {
        // Timeouts are self-cleaning, but we can track them for debugging
    }

    /**
     * Track event listeners
     */
    trackEventListener(target, type, listener) {
        if (!this.eventListeners.has(target)) {
            this.eventListeners.set(target, new Map());
        }
        
        const targetListeners = this.eventListeners.get(target);
        if (!targetListeners.has(type)) {
            targetListeners.set(type, new Set());
        }
        
        targetListeners.get(type).add(listener);
        this.stats.listenersAdded++;
    }

    /**
     * Untrack event listeners
     */
    untrackEventListener(target, type, listener) {
        if (!this.eventListeners.has(target)) return;
        
        const targetListeners = this.eventListeners.get(target);
        if (!targetListeners.has(type)) return;
        
        targetListeners.get(type).delete(listener);
        this.stats.listenersRemoved++;
        
        // Clean up empty maps
        if (targetListeners.get(type).size === 0) {
            targetListeners.delete(type);
        }
        
        if (targetListeners.size === 0) {
            this.eventListeners.delete(target);
        }
    }

    /**
     * Track observers (IntersectionObserver, MutationObserver, etc.)
     */
    trackObserver(observer, type = 'unknown') {
        this.observers.add({
            observer,
            type,
            created: Date.now()
        });
        this.stats.observersCreated++;
    }

    /**
     * Untrack observers
     */
    untrackObserver(observer) {
        for (const obs of this.observers) {
            if (obs.observer === observer) {
                this.observers.delete(obs);
                this.stats.observersDisconnected++;
                break;
            }
        }
    }

    /**
     * Setup automatic cleanup routines
     */
    setupCleanupRoutines() {
        // Cleanup old intervals
        const cleanupInterval = setInterval(() => {
            this.cleanupOldResources();
        }, this.config.cleanupInterval);
        
        this.trackInterval(cleanupInterval, 'memory-cleanup');

        // Cleanup on visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.performLightCleanup();
            }
        });

        // Cleanup before page unload
        this.setupUnloadCleanup();
    }

    /**
     * Cleanup old or orphaned resources
     */
    cleanupOldResources() {
        const now = Date.now();
        const maxAge = 300000; // 5 minutes
        let cleaned = 0;

        // Clean up old intervals (warning only)
        for (const interval of this.intervals) {
            if (now - interval.created > maxAge) {
                console.warn(`⚠️ [MEMORY CLEANUP] Long-running interval detected: ${interval.source} (${Math.round((now - interval.created) / 60000)} minutes)`);
            }
        }

        // Clean up orphaned event listeners
        for (const [target, listeners] of this.eventListeners) {
            if (!document.contains(target) && target !== window && target !== document) {
                // Target no longer in DOM
                this.eventListeners.delete(target);
                cleaned++;
            }
        }

        // Clean up orphaned observers
        for (const obs of this.observers) {
            if (now - obs.created > maxAge * 2) { // 10 minutes
                console.warn(`⚠️ [MEMORY CLEANUP] Long-running observer: ${obs.type}`);
            }
        }

        if (cleaned > 0) {
            console.log(`🧹 [MEMORY CLEANUP] Cleaned ${cleaned} orphaned resources`);
        }
    }

    /**
     * Perform light cleanup when page is hidden
     */
    performLightCleanup() {
        // Clear caches
        if (window.moduleLoader) {
            window.moduleLoader.clearCache();
        }
        
        if (window.unifiedMonitoringService) {
            // Reduce monitoring frequency when hidden
            console.log('📱 [MEMORY] Reducing monitoring frequency (page hidden)');
        }
        
        // Suggest garbage collection
        this.suggestGarbageCollection();
    }

    /**
     * Trigger emergency memory cleanup
     */
    triggerMemoryCleanup() {
        console.log('🚨 [MEMORY CLEANUP] Triggering emergency cleanup...');
        
        // Clear all caches
        this.clearAllCaches();
        
        // Clean up old DOM nodes
        this.cleanupDOMNodes();
        
        // Force garbage collection if available
        this.forceGarbageCollection();
        
        // Notify other systems
        this.notifyMemoryPressure();
        
        console.log('✅ [MEMORY CLEANUP] Emergency cleanup completed');
    }

    /**
     * Clear all managed caches
     */
    clearAllCaches() {
        const caches = [
            'moduleLoader',
            'unifiedMonitoringService', 
            'aiProviderOptimizer',
            'cssOptimizer',
            'advancedCache'
        ];

        caches.forEach(cacheName => {
            if (window[cacheName] && typeof window[cacheName].clearCache === 'function') {
                window[cacheName].clearCache();
                console.log(`🧹 [MEMORY] Cleared ${cacheName} cache`);
            }
        });
    }

    /**
     * Clean up unused DOM nodes
     */
    cleanupDOMNodes() {
        // Remove orphaned elements
        const orphans = document.querySelectorAll('[data-cleanup="true"], .temp-element, .removed');
        orphans.forEach(element => {
            element.remove();
        });

        // Clean up empty text nodes
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    return node.textContent.trim() === '' ? 
                        NodeFilter.FILTER_ACCEPT : 
                        NodeFilter.FILTER_REJECT;
                }
            }
        );

        const emptyTextNodes = [];
        let node;
        while (node = walker.nextNode()) {
            emptyTextNodes.push(node);
        }

        emptyTextNodes.forEach(textNode => {
            textNode.remove();
        });

        if (orphans.length > 0 || emptyTextNodes.length > 0) {
            console.log(`🧹 [MEMORY] Cleaned ${orphans.length} orphaned elements, ${emptyTextNodes.length} empty text nodes`);
        }
    }

    /**
     * Suggest garbage collection
     */
    suggestGarbageCollection() {
        this.stats.gcSuggestions++;
        
        // Use performance.measureUserAgentSpecificMemory if available (Chrome)
        if ('measureUserAgentSpecificMemory' in performance) {
            performance.measureUserAgentSpecificMemory()
                .then(result => {
                    console.log('🧠 [GC] Memory measurement:', result);
                })
                .catch(console.warn);
        }
        
        // Force garbage collection in development
        if (window.gc && typeof window.gc === 'function') {
            window.gc();
            console.log('🗑️ [GC] Manual garbage collection triggered');
        }
    }

    /**
     * Force garbage collection using available methods
     */
    forceGarbageCollection() {
        // Try manual GC if available (Chrome with --js-flags="--expose-gc")
        if (window.gc) {
            window.gc();
            console.log('🗑️ [GC] Manual garbage collection performed');
            return true;
        }

        // Create memory pressure to encourage GC
        const arrays = [];
        try {
            for (let i = 0; i < 100; i++) {
                arrays.push(new Array(10000).fill(null));
            }
            arrays.length = 0; // Clear references
        } catch (e) {
            // Memory pressure created
        }

        return false;
    }

    /**
     * Notify other systems of memory pressure
     */
    notifyMemoryPressure() {
        const event = new CustomEvent('memoryPressure', {
            detail: { timestamp: Date.now(), stats: this.getStats() }
        });
        
        window.dispatchEvent(event);
        
        // Notify service worker if available
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'MEMORY_PRESSURE',
                data: this.getStats()
            });
        }
    }

    /**
     * Setup cleanup on page unload
     */
    setupUnloadCleanup() {
        const cleanup = () => {
            console.log('🧹 [MEMORY] Page unload cleanup...');
            
            // Clear all intervals
            this.intervals.forEach(interval => {
                clearInterval(interval.id);
            });
            
            // Disconnect all observers
            this.observers.forEach(obs => {
                if (obs.observer.disconnect) {
                    obs.observer.disconnect();
                }
            });
            
            // Clear all caches
            this.clearAllCaches();
            
            console.log('✅ [MEMORY] Unload cleanup completed');
        };

        window.addEventListener('beforeunload', cleanup);
        window.addEventListener('pagehide', cleanup);
        window.addEventListener('unload', cleanup);
    }

    /**
     * Format bytes for human readable output
     */
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    /**
     * Get memory management statistics
     */
    getStats() {
        return {
            ...this.stats,
            resources: {
                intervals: this.intervals.size,
                eventListeners: Array.from(this.eventListeners.values())
                    .reduce((sum, listeners) => sum + listeners.size, 0),
                observers: this.observers.size,
                caches: this.caches.size
            },
            memory: performance.memory ? {
                used: this.formatBytes(performance.memory.usedJSHeapSize),
                total: this.formatBytes(performance.memory.totalJSHeapSize),
                limit: this.formatBytes(performance.memory.jsHeapSizeLimit)
            } : null
        };
    }

    /**
     * Generate memory report
     */
    generateReport() {
        const stats = this.getStats();
        const memoryUsage = this.checkMemoryUsage();
        const leakIssues = this.detectPotentialLeaks();
        
        console.group('🧠 [MEMORY MANAGER] Report');
        console.log('Memory Usage:', memoryUsage);
        console.log('Resources:', stats.resources);
        console.log('Statistics:', {
            intervalsCreated: stats.intervalsCreated,
            intervalsCleared: stats.intervalsCleared,
            listenersAdded: stats.listenersAdded,
            listenersRemoved: stats.listenersRemoved,
            memoryLeaksDetected: stats.memoryLeaksDetected,
            gcSuggestions: stats.gcSuggestions
        });
        
        if (leakIssues.length > 0) {
            console.warn('Potential Issues:', leakIssues);
        }
        
        console.groupEnd();
        
        return {
            memoryUsage,
            stats,
            issues: leakIssues
        };
    }

    /**
     * Cleanup all resources and stop memory manager
     */
    destroy() {
        console.log('🧹 [MEMORY MANAGER] Destroying memory manager...');
        
        // Clear all tracked intervals
        this.intervals.forEach(interval => {
            clearInterval(interval.id);
        });
        
        // Disconnect all observers
        this.observers.forEach(obs => {
            if (obs.observer.disconnect) {
                obs.observer.disconnect();
            }
        });
        
        // Clear all data structures
        this.intervals.clear();
        this.eventListeners.clear();
        this.observers.clear();
        this.caches.clear();
        
        console.log('✅ [MEMORY MANAGER] Destroyed');
    }
}

// Create global instance
window.memoryManager = new MemoryManager();

// Global debugging functions
window.memoryReport = () => window.memoryManager.generateReport();
window.triggerCleanup = () => window.memoryManager.triggerMemoryCleanup();
window.forceGC = () => window.memoryManager.forceGarbageCollection();

// Listen for memory pressure events
window.addEventListener('memoryPressure', (event) => {
    console.log('🚨 [MEMORY PRESSURE] Event received:', event.detail);
});

console.log('✅ [MEMORY MANAGER] Memory management system ready');