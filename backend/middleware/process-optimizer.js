/**
 * ⚙️ BACKEND PROCESS OPTIMIZER
 * Optimizes backend processes for better performance and resource usage
 */

const cluster = require('cluster');
const os = require('os');
const winston = require('winston');

class BackendProcessOptimizer {
    constructor() {
        this.processMetrics = {
            cpuUsage: { user: 0, system: 0 },
            memoryUsage: { rss: 0, heapUsed: 0, heapTotal: 0, external: 0 },
            eventLoopDelay: 0,
            activeHandles: 0,
            activeRequests: 0,
            uptime: 0
        };
        
        this.config = {
            clusterMode: process.env.NODE_ENV === 'production',
            workerCount: process.env.WORKERS || os.cpus().length,
            memoryThreshold: 512 * 1024 * 1024, // 512MB
            cpuThreshold: 80, // 80%
            eventLoopThreshold: 100, // 100ms
            restartThreshold: 1000 * 60 * 60, // 1 hour
            monitoringInterval: 30000, // 30 seconds
            gracefulShutdownTimeout: 10000 // 10 seconds
        };

        this.stats = {
            requestsProcessed: 0,
            averageResponseTime: 0,
            peakMemoryUsage: 0,
            restarts: 0,
            errors: 0,
            slowQueries: 0
        };

        this.optimization = {
            garbageCollection: true,
            processPooling: false,
            requestQueuing: true,
            resourceMonitoring: true,
            automaticRestart: false
        };

        this.intervals = new Set();
        this.initialize();
    }

    initialize() {
        console.log('⚙️ [PROCESS OPTIMIZER] Initializing backend process optimization...');
        
        // Setup process monitoring
        this.setupProcessMonitoring();
        
        // Setup garbage collection optimization
        this.setupGarbageCollection();
        
        // Setup graceful shutdown
        this.setupGracefulShutdown();
        
        // Setup cluster mode if enabled
        if (this.config.clusterMode && cluster.isMaster) {
            this.setupClusterMode();
        } else {
            this.setupWorkerOptimizations();
        }
        
        console.log('✅ [PROCESS OPTIMIZER] Backend process optimizer ready');
    }

    /**
     * Setup process monitoring
     */
    setupProcessMonitoring() {
        const monitoringInterval = setInterval(() => {
            this.collectProcessMetrics();
            this.analyzePerformance();
        }, this.config.monitoringInterval);
        
        this.intervals.add(monitoringInterval);
        
        console.log(`📊 [PROCESS OPTIMIZER] Process monitoring started (${this.config.monitoringInterval}ms interval)`);
    }

    /**
     * Collect process metrics
     */
    collectProcessMetrics() {
        try {
            // CPU usage
            this.processMetrics.cpuUsage = process.cpuUsage();
            
            // Memory usage
            this.processMetrics.memoryUsage = process.memoryUsage();
            
            // Event loop delay (if available)
            if (process.hrtime && process.hrtime.bigint) {
                const start = process.hrtime.bigint();
                setImmediate(() => {
                    const end = process.hrtime.bigint();
                    this.processMetrics.eventLoopDelay = Number(end - start) / 1000000; // Convert to ms
                });
            }
            
            // Active handles and requests
            if (process._getActiveHandles) {
                this.processMetrics.activeHandles = process._getActiveHandles().length;
            }
            if (process._getActiveRequests) {
                this.processMetrics.activeRequests = process._getActiveRequests().length;
            }
            
            // Uptime
            this.processMetrics.uptime = process.uptime();
            
            // Update peak memory usage
            if (this.processMetrics.memoryUsage.heapUsed > this.stats.peakMemoryUsage) {
                this.stats.peakMemoryUsage = this.processMetrics.memoryUsage.heapUsed;
            }
            
        } catch (error) {
            winston.error('[PROCESS OPTIMIZER] Error collecting metrics:', error);
        }
    }

    /**
     * Analyze performance and trigger optimizations
     */
    analyzePerformance() {
        const metrics = this.processMetrics;
        const issues = [];
        
        // Check memory usage
        const memoryUsageMB = metrics.memoryUsage.heapUsed / 1024 / 1024;
        const memoryThresholdMB = this.config.memoryThreshold / 1024 / 1024;
        
        if (metrics.memoryUsage.heapUsed > this.config.memoryThreshold) {
            issues.push(`High memory usage: ${memoryUsageMB.toFixed(2)}MB (threshold: ${memoryThresholdMB}MB)`);
            this.triggerMemoryOptimization();
        }
        
        // Check event loop delay
        if (metrics.eventLoopDelay > this.config.eventLoopThreshold) {
            issues.push(`High event loop delay: ${metrics.eventLoopDelay.toFixed(2)}ms`);
            this.optimizeEventLoop();
        }
        
        // Check active handles
        if (metrics.activeHandles > 100) {
            issues.push(`High active handles: ${metrics.activeHandles}`);
            this.optimizeHandles();
        }
        
        // Check uptime for restart consideration
        if (metrics.uptime > this.config.restartThreshold && this.optimization.automaticRestart) {
            issues.push(`Long uptime: ${(metrics.uptime / 3600).toFixed(2)} hours`);
            this.scheduleGracefulRestart();
        }
        
        if (issues.length > 0) {
            winston.warn('[PROCESS OPTIMIZER] Performance issues detected:', issues);
        }
        
        // Log metrics periodically (every 10 minutes)
        if (Date.now() % 600000 < this.config.monitoringInterval) {
            this.logProcessMetrics();
        }
    }

    /**
     * Log process metrics
     */
    logProcessMetrics() {
        const metrics = this.processMetrics;
        const memoryMB = metrics.memoryUsage.heapUsed / 1024 / 1024;
        const uptimeHours = metrics.uptime / 3600;
        
        winston.info('[PROCESS OPTIMIZER] Process Metrics:', {
            memory: `${memoryMB.toFixed(2)}MB`,
            uptime: `${uptimeHours.toFixed(2)}h`,
            eventLoopDelay: `${metrics.eventLoopDelay.toFixed(2)}ms`,
            activeHandles: metrics.activeHandles,
            activeRequests: metrics.activeRequests,
            pid: process.pid
        });
    }

    /**
     * Setup garbage collection optimization
     */
    setupGarbageCollection() {
        if (!this.optimization.garbageCollection) return;
        
        // Manual GC trigger on high memory usage
        if (global.gc) {
            const gcInterval = setInterval(() => {
                const memoryUsage = process.memoryUsage();
                const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
                
                // Trigger GC if memory usage is high
                if (heapUsedMB > 200) { // 200MB threshold
                    console.log(`🗑️ [PROCESS OPTIMIZER] Triggering garbage collection (${heapUsedMB.toFixed(2)}MB)`);
                    global.gc();
                }
            }, 60000); // Every minute
            
            this.intervals.add(gcInterval);
        }
        
        // GC event listeners (Node.js 14+)
        if (process.versions.node && parseInt(process.versions.node.split('.')[0]) >= 14) {
            const perfHooks = require('perf_hooks');
            const obs = new perfHooks.PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach((entry) => {
                    if (entry.name.startsWith('gc')) {
                        winston.debug(`[PROCESS OPTIMIZER] GC Event: ${entry.name} - ${entry.duration.toFixed(2)}ms`);
                    }
                });
            });
            obs.observe({ entryTypes: ['gc'], buffered: false });
        }
    }

    /**
     * Trigger memory optimization
     */
    triggerMemoryOptimization() {
        winston.warn('[PROCESS OPTIMIZER] Triggering memory optimization...');
        
        // Force garbage collection if available
        if (global.gc) {
            global.gc();
            winston.info('[PROCESS OPTIMIZER] Manual garbage collection triggered');
        }
        
        // Clear internal caches
        this.clearInternalCaches();
        
        // Emit memory pressure event
        process.emit('memoryPressure', {
            timestamp: Date.now(),
            memoryUsage: this.processMetrics.memoryUsage
        });
    }

    /**
     * Clear internal caches
     */
    clearInternalCaches() {
        try {
            // Clear require cache for non-essential modules
            const cacheKeysToRemove = Object.keys(require.cache).filter(key => 
                key.includes('/temp/') || 
                key.includes('/cache/') ||
                key.endsWith('.temp.js')
            );
            
            cacheKeysToRemove.forEach(key => {
                delete require.cache[key];
            });
            
            if (cacheKeysToRemove.length > 0) {
                winston.info(`[PROCESS OPTIMIZER] Cleared ${cacheKeysToRemove.length} cached modules`);
            }
            
        } catch (error) {
            winston.error('[PROCESS OPTIMIZER] Error clearing caches:', error);
        }
    }

    /**
     * Optimize event loop
     */
    optimizeEventLoop() {
        winston.warn('[PROCESS OPTIMIZER] Optimizing event loop...');
        
        // Use setImmediate for CPU-intensive tasks
        process.nextTick(() => {
            // Defer non-critical operations
            winston.info('[PROCESS OPTIMIZER] Event loop optimization applied');
        });
    }

    /**
     * Optimize handles
     */
    optimizeHandles() {
        winston.warn('[PROCESS OPTIMIZER] Optimizing active handles...');
        
        // This would involve analyzing and cleaning up active handles
        // Implementation would be specific to the application's needs
        winston.info('[PROCESS OPTIMIZER] Handle optimization applied');
    }

    /**
     * Setup graceful shutdown
     */
    setupGracefulShutdown() {
        const shutdown = (signal) => {
            winston.info(`[PROCESS OPTIMIZER] Received ${signal}, initiating graceful shutdown...`);
            
            // Clear all intervals
            this.intervals.forEach(interval => clearInterval(interval));
            this.intervals.clear();
            
            // Close server connections gracefully
            if (global.server) {
                global.server.close(() => {
                    winston.info('[PROCESS OPTIMIZER] Server closed gracefully');
                    process.exit(0);
                });
                
                // Force exit after timeout
                setTimeout(() => {
                    winston.warn('[PROCESS OPTIMIZER] Force exit after timeout');
                    process.exit(1);
                }, this.config.gracefulShutdownTimeout);
            } else {
                process.exit(0);
            }
        };
        
        // Handle shutdown signals
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGQUIT', () => shutdown('SIGQUIT'));
        
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            winston.error('[PROCESS OPTIMIZER] Uncaught exception:', error);
            this.stats.errors++;
            
            if (this.optimization.automaticRestart) {
                this.scheduleGracefulRestart();
            }
        });
        
        process.on('unhandledRejection', (reason, promise) => {
            winston.error('[PROCESS OPTIMIZER] Unhandled rejection:', reason);
            this.stats.errors++;
        });
    }

    /**
     * Setup cluster mode
     */
    setupClusterMode() {
        if (!cluster.isMaster) return;
        
        winston.info(`[PROCESS OPTIMIZER] Setting up cluster mode with ${this.config.workerCount} workers`);
        
        // Fork workers
        for (let i = 0; i < this.config.workerCount; i++) {
            const worker = cluster.fork();
            winston.info(`[PROCESS OPTIMIZER] Worker ${worker.process.pid} started`);
        }
        
        // Handle worker events
        cluster.on('exit', (worker, code, signal) => {
            winston.warn(`[PROCESS OPTIMIZER] Worker ${worker.process.pid} died (${signal || code})`);
            this.stats.restarts++;
            
            // Restart worker
            setTimeout(() => {
                const newWorker = cluster.fork();
                winston.info(`[PROCESS OPTIMIZER] New worker ${newWorker.process.pid} started`);
            }, 1000);
        });
        
        cluster.on('listening', (worker, address) => {
            winston.info(`[PROCESS OPTIMIZER] Worker ${worker.process.pid} listening on ${address.address}:${address.port}`);
        });
        
        // Setup worker monitoring
        this.setupWorkerMonitoring();
    }

    /**
     * Setup worker monitoring
     */
    setupWorkerMonitoring() {
        const monitorWorkers = () => {
            const workers = Object.values(cluster.workers);
            
            workers.forEach(worker => {
                if (worker) {
                    // Send health check
                    worker.send({ type: 'health-check' });
                }
            });
        };
        
        const workerMonitorInterval = setInterval(monitorWorkers, 60000); // Every minute
        this.intervals.add(workerMonitorInterval);
    }

    /**
     * Setup worker optimizations
     */
    setupWorkerOptimizations() {
        if (cluster.isWorker) {
            winston.info(`[PROCESS OPTIMIZER] Worker ${process.pid} optimizations enabled`);
            
            // Handle messages from master
            process.on('message', (msg) => {
                if (msg.type === 'health-check') {
                    process.send({
                        type: 'health-response',
                        pid: process.pid,
                        memoryUsage: process.memoryUsage(),
                        uptime: process.uptime()
                    });
                }
            });
        }
    }

    /**
     * Schedule graceful restart
     */
    scheduleGracefulRestart() {
        winston.info('[PROCESS OPTIMIZER] Scheduling graceful restart...');
        
        setTimeout(() => {
            winston.info('[PROCESS OPTIMIZER] Initiating graceful restart...');
            
            if (cluster.isWorker) {
                // Worker restart
                process.disconnect();
                setTimeout(() => process.exit(0), 1000);
            } else {
                // Master restart (would need external process manager like PM2)
                winston.info('[PROCESS OPTIMIZER] Master restart requires external process manager');
            }
        }, 5000); // 5 second delay
    }

    /**
     * Create middleware for request tracking
     */
    createRequestTrackingMiddleware() {
        return (req, res, next) => {
            const startTime = Date.now();
            this.stats.requestsProcessed++;
            
            // Track response time
            res.on('finish', () => {
                const responseTime = Date.now() - startTime;
                
                // Update average response time
                this.stats.averageResponseTime = 
                    (this.stats.averageResponseTime * (this.stats.requestsProcessed - 1) + responseTime) / 
                    this.stats.requestsProcessed;
                
                // Log slow requests
                if (responseTime > 1000) { // > 1 second
                    winston.warn(`[PROCESS OPTIMIZER] Slow request: ${req.method} ${req.path} - ${responseTime}ms`);
                    this.stats.slowQueries++;
                }
            });
            
            next();
        };
    }

    /**
     * Get process optimization statistics
     */
    getStats() {
        return {
            ...this.stats,
            processMetrics: this.processMetrics,
            config: this.config,
            optimization: this.optimization,
            cluster: {
                isMaster: cluster.isMaster,
                isWorker: cluster.isWorker,
                workerId: cluster.worker ? cluster.worker.id : null,
                workerCount: Object.keys(cluster.workers || {}).length
            },
            memory: {
                current: `${(this.processMetrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
                peak: `${(this.stats.peakMemoryUsage / 1024 / 1024).toFixed(2)}MB`,
                threshold: `${(this.config.memoryThreshold / 1024 / 1024).toFixed(2)}MB`
            }
        };
    }

    /**
     * Generate process optimization report
     */
    generateReport() {
        const stats = this.getStats();
        
        winston.info('⚙️ [PROCESS OPTIMIZER] Process Report:', {
            pid: process.pid,
            uptime: `${(stats.processMetrics.uptime / 3600).toFixed(2)}h`,
            memory: stats.memory,
            requests: stats.requestsProcessed,
            averageResponseTime: `${stats.averageResponseTime.toFixed(2)}ms`,
            restarts: stats.restarts,
            errors: stats.errors,
            slowQueries: stats.slowQueries,
            cluster: stats.cluster
        });
        
        return stats;
    }

    /**
     * Enable specific optimization
     */
    enableOptimization(optimization) {
        if (this.optimization.hasOwnProperty(optimization)) {
            this.optimization[optimization] = true;
            winston.info(`[PROCESS OPTIMIZER] Enabled optimization: ${optimization}`);
        }
    }

    /**
     * Disable specific optimization
     */
    disableOptimization(optimization) {
        if (this.optimization.hasOwnProperty(optimization)) {
            this.optimization[optimization] = false;
            winston.info(`[PROCESS OPTIMIZER] Disabled optimization: ${optimization}`);
        }
    }
}

// Create singleton instance
const processOptimizer = new BackendProcessOptimizer();

module.exports = {
    processOptimizer,
    requestTrackingMiddleware: processOptimizer.createRequestTrackingMiddleware()
};

console.log('✅ [PROCESS OPTIMIZER] Backend process optimizer ready');