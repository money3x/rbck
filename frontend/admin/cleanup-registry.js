/**
 * RBCK CMS - Cleanup Registry System
 * Prevents memory leaks by tracking and cleaning up event listeners and resources
 */

class CleanupRegistry {
    constructor() {
        this.listeners = new Map();
        this.timers = new Set();
        this.observers = new Set();
        this.resources = new Map();
        this.initialized = false;
    }

    // Initialize the cleanup registry
    init() {
        if (this.initialized) return;
        
        console.log('🧹 [CLEANUP] Initializing cleanup registry...');
        
        // Clean up when page is unloaded
        window.addEventListener('beforeunload', () => {
            this.cleanupAll();
        });
        
        // Clean up on page visibility change (when tab becomes hidden)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.cleanupUnused();
            }
        });
        
        this.initialized = true;
        console.log('✅ [CLEANUP] Cleanup registry initialized');
    }

    // Add event listener with automatic cleanup tracking
    addListener(element, event, handler, options = {}) {
        if (!element || typeof handler !== 'function') {
            console.error('❌ [CLEANUP] Invalid element or handler for event listener');
            return;
        }

        element.addEventListener(event, handler, options);
        
        // Track for cleanup
        if (!this.listeners.has(element)) {
            this.listeners.set(element, []);
        }
        
        this.listeners.get(element).push({
            event,
            handler,
            options,
            timestamp: Date.now()
        });
        
        console.log(`🎯 [CLEANUP] Tracked event listener: ${event} on`, element.tagName || 'element');
    }

    // Remove specific event listener
    removeListener(element, event, handler) {
        if (!element) return;
        
        element.removeEventListener(event, handler);
        
        const elementListeners = this.listeners.get(element);
        if (elementListeners) {
            const index = elementListeners.findIndex(
                listener => listener.event === event && listener.handler === handler
            );
            if (index > -1) {
                elementListeners.splice(index, 1);
                console.log(`🗑️ [CLEANUP] Removed event listener: ${event}`);
            }
        }
    }

    // Clean up all listeners for a specific element
    cleanupElement(element) {
        if (!element || !this.listeners.has(element)) return;
        
        const elementListeners = this.listeners.get(element);
        elementListeners.forEach(({ event, handler, options }) => {
            element.removeEventListener(event, handler, options);
        });
        
        this.listeners.delete(element);
        console.log('🧹 [CLEANUP] Cleaned up element listeners for', element.tagName || 'element');
    }

    // Track timers (setTimeout, setInterval) for cleanup
    addTimer(timerId, type = 'timeout') {
        this.timers.add({ id: timerId, type, timestamp: Date.now() });
        console.log(`⏰ [CLEANUP] Tracked ${type}:`, timerId);
        return timerId;
    }

    // Clear specific timer
    clearTimer(timerId) {
        const timer = Array.from(this.timers).find(t => t.id === timerId);
        if (timer) {
            if (timer.type === 'interval') {
                clearInterval(timerId);
            } else {
                clearTimeout(timerId);
            }
            this.timers.delete(timer);
            console.log(`🗑️ [CLEANUP] Cleared ${timer.type}:`, timerId);
        }
    }

    // Track observers (MutationObserver, IntersectionObserver, etc.)
    addObserver(observer, type = 'mutation') {
        this.observers.add({ observer, type, timestamp: Date.now() });
        console.log(`👁️ [CLEANUP] Tracked ${type} observer`);
    }

    // Disconnect observer
    removeObserver(observer) {
        const observerEntry = Array.from(this.observers).find(o => o.observer === observer);
        if (observerEntry) {
            observer.disconnect();
            this.observers.delete(observerEntry);
            console.log('🗑️ [CLEANUP] Disconnected observer');
        }
    }

    // Track generic resources for cleanup
    addResource(key, resource, cleanupFn) {
        this.resources.set(key, {
            resource,
            cleanupFn: cleanupFn || (() => {}),
            timestamp: Date.now()
        });
        console.log('📦 [CLEANUP] Tracked resource:', key);
    }

    // Clean up specific resource
    cleanupResource(key) {
        const resourceEntry = this.resources.get(key);
        if (resourceEntry) {
            try {
                resourceEntry.cleanupFn(resourceEntry.resource);
                this.resources.delete(key);
                console.log('🗑️ [CLEANUP] Cleaned up resource:', key);
            } catch (error) {
                console.error('❌ [CLEANUP] Error cleaning up resource:', key, error);
            }
        }
    }

    // Clean up unused resources (older than 5 minutes and not recently accessed)
    cleanupUnused() {
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        let cleaned = 0;

        // Clean up old timers
        this.timers.forEach(timer => {
            if (timer.timestamp < fiveMinutesAgo) {
                this.clearTimer(timer.id);
                cleaned++;
            }
        });

        console.log(`🧹 [CLEANUP] Cleaned up ${cleaned} unused resources`);
    }

    // Clean up everything
    cleanupAll() {
        console.log('🧹 [CLEANUP] Performing complete cleanup...');

        // Clean up all event listeners
        this.listeners.forEach((listeners, element) => {
            this.cleanupElement(element);
        });

        // Clear all timers
        this.timers.forEach(timer => {
            this.clearTimer(timer.id);
        });

        // Disconnect all observers
        this.observers.forEach(observerEntry => {
            this.removeObserver(observerEntry.observer);
        });

        // Clean up all resources
        this.resources.forEach((_, key) => {
            this.cleanupResource(key);
        });

        console.log('✅ [CLEANUP] Complete cleanup finished');
    }

    // Get cleanup statistics
    getStats() {
        return {
            listeners: this.listeners.size,
            timers: this.timers.size,
            observers: this.observers.size,
            resources: this.resources.size,
            totalTracked: this.listeners.size + this.timers.size + this.observers.size + this.resources.size
        };
    }

    // Enhanced setTimeout with automatic tracking
    setTimeout(callback, delay) {
        const timerId = setTimeout(() => {
            callback();
            // Auto-remove from tracking after execution
            this.timers.forEach(timer => {
                if (timer.id === timerId) {
                    this.timers.delete(timer);
                }
            });
        }, delay);
        
        return this.addTimer(timerId, 'timeout');
    }

    // Enhanced setInterval with automatic tracking
    setInterval(callback, interval) {
        const timerId = setInterval(callback, interval);
        return this.addTimer(timerId, 'interval');
    }
}

// Create global instance
window.CleanupRegistry = window.CleanupRegistry || new CleanupRegistry();

// Initialize automatically
window.CleanupRegistry.init();

// Add to RBCK namespace if available
if (window.RBCK) {
    window.RBCK.perf.cleanup = window.CleanupRegistry;
}

console.log('✅ [CLEANUP] Cleanup registry loaded and ready');