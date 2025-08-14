/**
 * RBCK CMS - Client-Side Error Tracking System
 * Monitors and reports JavaScript errors for debugging
 */

class ErrorTracker {
    constructor() {
        this.errors = [];
        this.maxErrors = 100; // Prevent memory issues
        this.reportingEndpoint = this.getReportingEndpoint();
        this.sessionId = this.generateSessionId();
        this.initialized = false;
        this.debugMode = this.isDebugMode();
    }

    init() {
        if (this.initialized) return;

        console.log('🔍 [ERROR TRACKER] Initializing error tracking system...');

        // Catch unhandled JavaScript errors
        window.addEventListener('error', (event) => {
            this.captureError({
                type: 'javascript',
                message: event.error?.message || event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent
            });
        });

        // Catch unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.captureError({
                type: 'promise_rejection',
                message: event.reason?.message || String(event.reason),
                stack: event.reason?.stack,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent
            });
        });

        // Catch network errors
        this.interceptFetch();
        this.interceptXHR();

        // Track performance issues
        this.monitorPerformance();

        this.initialized = true;
        console.log('✅ [ERROR TRACKER] Error tracking system initialized');
    }

    captureError(errorData) {
        // Add session information
        const enrichedError = {
            ...errorData,
            sessionId: this.sessionId,
            timestamp: errorData.timestamp || new Date().toISOString(),
            page: window.location.pathname,
            referrer: document.referrer,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };

        // Store locally (with size limit)
        if (this.errors.length >= this.maxErrors) {
            this.errors.shift(); // Remove oldest error
        }
        this.errors.push(enrichedError);

        // Log in debug mode
        if (this.debugMode) {
            console.group('🔍 [ERROR TRACKER] New Error Captured');
            console.error('Type:', enrichedError.type);
            console.error('Message:', enrichedError.message);
            if (enrichedError.stack) {
                console.error('Stack:', enrichedError.stack);
            }
            console.error('Full Error Data:', enrichedError);
            console.groupEnd();
        }

        // Report to server (if endpoint configured)
        this.reportError(enrichedError);

        // Store in localStorage for persistence
        this.persistError(enrichedError);
    }

    async reportError(errorData) {
        if (!this.reportingEndpoint) return;

        try {
            await fetch(this.reportingEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    error: errorData,
                    context: this.getContextData()
                })
            });
        } catch (reportingError) {
            // Don't create infinite loop - just log if debug mode
            if (this.debugMode) {
                console.warn('🔍 [ERROR TRACKER] Failed to report error:', reportingError);
            }
        }
    }

    persistError(errorData) {
        try {
            const persistedErrors = this.getPersistedErrors();
            persistedErrors.push(errorData);

            // Keep only last 50 errors in localStorage
            if (persistedErrors.length > 50) {
                persistedErrors.splice(0, persistedErrors.length - 50);
            }

            localStorage.setItem('rbck_error_log', JSON.stringify(persistedErrors));
        } catch (storageError) {
            // localStorage might be full or disabled
            if (this.debugMode) {
                console.warn('🔍 [ERROR TRACKER] Failed to persist error:', storageError);
            }
        }
    }

    getPersistedErrors() {
        try {
            const stored = localStorage.getItem('rbck_error_log');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    interceptFetch() {
        const originalFetch = window.fetch;
        const tracker = this;

        window.fetch = async function(...args) {
            try {
                const response = await originalFetch.apply(this, args);
                
                // Track HTTP errors
                if (!response.ok) {
                    tracker.captureError({
                        type: 'network',
                        subtype: 'http_error',
                        message: `HTTP ${response.status}: ${response.statusText}`,
                        url: args[0],
                        status: response.status,
                        statusText: response.statusText
                    });
                }
                
                return response;
            } catch (error) {
                tracker.captureError({
                    type: 'network',
                    subtype: 'fetch_error',
                    message: error.message,
                    url: args[0],
                    stack: error.stack
                });
                throw error;
            }
        };
    }

    interceptXHR() {
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;
        const tracker = this;

        XMLHttpRequest.prototype.open = function(method, url, ...args) {
            this._trackingData = { method, url };
            return originalOpen.call(this, method, url, ...args);
        };

        XMLHttpRequest.prototype.send = function(...args) {
            const trackingData = this._trackingData;

            this.addEventListener('error', () => {
                tracker.captureError({
                    type: 'network',
                    subtype: 'xhr_error',
                    message: 'XMLHttpRequest failed',
                    method: trackingData?.method,
                    url: trackingData?.url,
                    status: this.status,
                    statusText: this.statusText
                });
            });

            this.addEventListener('load', () => {
                if (this.status >= 400) {
                    tracker.captureError({
                        type: 'network',
                        subtype: 'xhr_http_error',
                        message: `HTTP ${this.status}: ${this.statusText}`,
                        method: trackingData?.method,
                        url: trackingData?.url,
                        status: this.status,
                        statusText: this.statusText
                    });
                }
            });

            return originalSend.call(this, ...args);
        };
    }

    monitorPerformance() {
        // Monitor for performance issues
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        // Track long tasks (>50ms)
                        if (entry.entryType === 'longtask') {
                            this.captureError({
                                type: 'performance',
                                subtype: 'long_task',
                                message: `Long task detected: ${entry.duration}ms`,
                                duration: entry.duration,
                                startTime: entry.startTime
                            });
                        }
                    }
                });

                observer.observe({ entryTypes: ['longtask'] });
                
                // Also add to cleanup registry
                if (window.CleanupRegistry) {
                    CleanupRegistry.addObserver(observer, 'performance');
                }
            } catch (error) {
                // PerformanceObserver might not be supported
                if (this.debugMode) {
                    console.warn('🔍 [ERROR TRACKER] Performance monitoring not available:', error);
                }
            }
        }

        // Monitor memory usage (if available)
        this.monitorMemory();
    }

    monitorMemory() {
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                const usagePercent = (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100;

                if (usagePercent > 90) {
                    this.captureError({
                        type: 'performance',
                        subtype: 'memory_warning',
                        message: `High memory usage: ${usagePercent.toFixed(1)}%`,
                        memoryUsage: {
                            used: memory.usedJSHeapSize,
                            total: memory.totalJSHeapSize,
                            limit: memory.jsHeapSizeLimit,
                            usagePercent: usagePercent
                        }
                    });
                }
            }, 30000); // Check every 30 seconds
        }
    }

    getContextData() {
        return {
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            rbckVersion: window.RBCK?.config?.version || 'unknown',
            sessionId: this.sessionId,
            errorCount: this.errors.length
        };
    }

    getReportingEndpoint() {
        // Configure based on environment
        if (window.location.hostname === 'localhost') {
            return 'http://localhost:10000/api/errors';
        } else {
            return 'https://rbck.onrender.com/api/errors';
        }
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    isDebugMode() {
        return localStorage.getItem('rbck_debug') === 'true' || 
               window.location.search.includes('debug=true') ||
               window.location.hostname === 'localhost';
    }

    // Public API methods
    getErrors() {
        return [...this.errors];
    }

    getErrorsSummary() {
        const errorTypes = {};
        const errorsByHour = {};

        this.errors.forEach(error => {
            // Count by type
            errorTypes[error.type] = (errorTypes[error.type] || 0) + 1;

            // Count by hour
            const hour = new Date(error.timestamp).toISOString().slice(0, 13);
            errorsByHour[hour] = (errorsByHour[hour] || 0) + 1;
        });

        return {
            totalErrors: this.errors.length,
            errorTypes,
            errorsByHour,
            lastError: this.errors[this.errors.length - 1],
            sessionId: this.sessionId
        };
    }

    clearErrors() {
        this.errors = [];
        localStorage.removeItem('rbck_error_log');
        console.log('🔍 [ERROR TRACKER] Error log cleared');
    }

    exportErrorLog() {
        const errorLog = {
            summary: this.getErrorsSummary(),
            errors: this.errors,
            context: this.getContextData(),
            exportedAt: new Date().toISOString()
        };

        // Create downloadable JSON file
        const blob = new Blob([JSON.stringify(errorLog, null, 2)], { 
            type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rbck-error-log-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('🔍 [ERROR TRACKER] Error log exported');
    }
}

// Create and initialize error tracker
window.ErrorTracker = window.ErrorTracker || new ErrorTracker();

// Add to RBCK namespace
if (window.RBCK) {
    RBCK.monitoring = RBCK.monitoring || {};
    RBCK.monitoring.errorTracker = window.ErrorTracker;
}

// Auto-initialize
window.ErrorTracker.init();

// Expose useful methods globally
window.getErrorSummary = () => window.ErrorTracker.getErrorsSummary();
window.exportErrorLog = () => window.ErrorTracker.exportErrorLog();
window.clearErrorLog = () => window.ErrorTracker.clearErrors();

console.log('✅ [ERROR TRACKER] Error tracking system loaded and initialized');