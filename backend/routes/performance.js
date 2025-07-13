// Performance Monitoring Routes
// Handles frontend performance metrics collection and analysis

const express = require('express');
const router = express.Router();
const winston = require('winston');

// In-memory storage for metrics (in production, use a database)
let performanceMetrics = [];
const MAX_METRICS_STORAGE = 1000;

// Performance metrics endpoint
router.post('/metrics', async (req, res) => {
    try {
        const { metrics, userAgent, url, timestamp, sessionId } = req.body;
        
        // Validate required fields
        if (!metrics || !sessionId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: metrics, sessionId'
            });
        }
        
        // Create performance entry
        const performanceEntry = {
            sessionId,
            metrics,
            userAgent,
            url,
            timestamp: timestamp || Date.now(),
            receivedAt: Date.now(),
            id: generateMetricId()
        };
        
        // Store metrics
        performanceMetrics.push(performanceEntry);
        
        // Keep only latest metrics to prevent memory bloat
        if (performanceMetrics.length > MAX_METRICS_STORAGE) {
            performanceMetrics = performanceMetrics.slice(-MAX_METRICS_STORAGE);
        }
        
        // Log performance summary
        winston.info('Performance metrics received', {
            sessionId,
            url,
            coreWebVitals: {
                lcp: metrics.pageLoad?.lcp?.value,
                fid: metrics.pageLoad?.fid?.value,
                cls: metrics.pageLoad?.cls?.value
            },
            errors: metrics.errors?.length || 0,
            service: 'rbck-cms'
        });
        
        // Analyze and alert on poor performance
        analyzePerformanceMetrics(performanceEntry);
        
        res.json({
            success: true,
            message: 'Performance metrics stored successfully',
            metricsId: performanceEntry.id
        });
        
    } catch (error) {
        winston.error('Error storing performance metrics', {
            error: error.message,
            stack: error.stack,
            service: 'rbck-cms'
        });
        
        res.status(500).json({
            success: false,
            error: 'Failed to store performance metrics'
        });
    }
});

// Get performance analytics
router.get('/analytics', async (req, res) => {
    try {
        const { timeRange = '24h', sessionId } = req.query;
        
        // Filter metrics by time range
        const cutoffTime = Date.now() - getTimeRangeMs(timeRange);
        let filteredMetrics = performanceMetrics.filter(entry => 
            entry.timestamp >= cutoffTime
        );
        
        // Filter by session if specified
        if (sessionId) {
            filteredMetrics = filteredMetrics.filter(entry => 
                entry.sessionId === sessionId
            );
        }
        
        // Generate analytics
        const analytics = generateAnalytics(filteredMetrics);
        
        res.json({
            success: true,
            analytics,
            dataPoints: filteredMetrics.length,
            timeRange
        });
        
    } catch (error) {
        winston.error('Error generating performance analytics', {
            error: error.message,
            service: 'rbck-cms'
        });
        
        res.status(500).json({
            success: false,
            error: 'Failed to generate analytics'
        });
    }
});

// Get performance dashboard data
router.get('/dashboard', async (req, res) => {
    try {
        const last24h = Date.now() - (24 * 60 * 60 * 1000);
        const recentMetrics = performanceMetrics.filter(entry => 
            entry.timestamp >= last24h
        );
        
        const dashboard = {
            overview: {
                totalSessions: new Set(recentMetrics.map(m => m.sessionId)).size,
                totalPageViews: recentMetrics.length,
                averageLoadTime: calculateAverageLoadTime(recentMetrics),
                errorRate: calculateErrorRate(recentMetrics)
            },
            coreWebVitals: calculateCoreWebVitals(recentMetrics),
            topPages: getTopPages(recentMetrics),
            performanceScore: calculateOverallPerformanceScore(recentMetrics),
            alerts: getPerformanceAlerts(recentMetrics)
        };
        
        res.json({
            success: true,
            dashboard,
            lastUpdated: Date.now()
        });
        
    } catch (error) {
        winston.error('Error generating performance dashboard', {
            error: error.message,
            service: 'rbck-cms'
        });
        
        res.status(500).json({
            success: false,
            error: 'Failed to generate dashboard'
        });
    }
});

// Real-time performance alerts
router.get('/alerts', async (req, res) => {
    try {
        const last1h = Date.now() - (60 * 60 * 1000);
        const recentMetrics = performanceMetrics.filter(entry => 
            entry.timestamp >= last1h
        );
        
        const alerts = generatePerformanceAlerts(recentMetrics);
        
        res.json({
            success: true,
            alerts,
            timestamp: Date.now()
        });
        
    } catch (error) {
        winston.error('Error generating performance alerts', {
            error: error.message,
            service: 'rbck-cms'
        });
        
        res.status(500).json({
            success: false,
            error: 'Failed to generate alerts'
        });
    }
});

// Helper Functions

function generateMetricId() {
    return 'metric_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function getTimeRangeMs(timeRange) {
    const ranges = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
    };
    return ranges[timeRange] || ranges['24h'];
}

function analyzePerformanceMetrics(entry) {
    const { metrics } = entry;
    
    // Check for performance issues
    const issues = [];
    
    // LCP threshold: good < 2.5s, poor > 4s
    if (metrics.pageLoad?.lcp?.value > 4000) {
        issues.push({
            type: 'lcp',
            severity: 'high',
            value: metrics.pageLoad.lcp.value,
            message: 'Largest Contentful Paint is too slow'
        });
    }
    
    // FID threshold: good < 100ms, poor > 300ms
    if (metrics.pageLoad?.fid?.value > 300) {
        issues.push({
            type: 'fid',
            severity: 'high',
            value: metrics.pageLoad.fid.value,
            message: 'First Input Delay is too high'
        });
    }
    
    // CLS threshold: good < 0.1, poor > 0.25
    if (metrics.pageLoad?.cls?.value > 0.25) {
        issues.push({
            type: 'cls',
            severity: 'medium',
            value: metrics.pageLoad.cls.value,
            message: 'Cumulative Layout Shift is too high'
        });
    }
    
    // Error rate check
    if (metrics.errors?.length > 5) {
        issues.push({
            type: 'errors',
            severity: 'high',
            value: metrics.errors.length,
            message: 'High number of JavaScript errors'
        });
    }
    
    // Log issues
    if (issues.length > 0) {
        winston.warn('Performance issues detected', {
            sessionId: entry.sessionId,
            url: entry.url,
            issues,
            service: 'rbck-cms'
        });
    }
}

function generateAnalytics(metrics) {
    if (metrics.length === 0) {
        return {
            coreWebVitals: null,
            loadTime: null,
            errorRate: 0,
            userInteractions: 0
        };
    }
    
    return {
        coreWebVitals: calculateCoreWebVitals(metrics),
        loadTime: calculateAverageLoadTime(metrics),
        errorRate: calculateErrorRate(metrics),
        userInteractions: calculateAverageInteractions(metrics),
        topErrors: getTopErrors(metrics),
        slowestComponents: getSlowestComponents(metrics)
    };
}

function calculateCoreWebVitals(metrics) {
    const vitals = {
        lcp: [],
        fid: [],
        cls: []
    };
    
    metrics.forEach(entry => {
        if (entry.metrics.pageLoad?.lcp?.value) {
            vitals.lcp.push(entry.metrics.pageLoad.lcp.value);
        }
        if (entry.metrics.pageLoad?.fid?.value) {
            vitals.fid.push(entry.metrics.pageLoad.fid.value);
        }
        if (entry.metrics.pageLoad?.cls?.value) {
            vitals.cls.push(entry.metrics.pageLoad.cls.value);
        }
    });
    
    return {
        lcp: {
            average: average(vitals.lcp),
            p75: percentile(vitals.lcp, 75),
            p90: percentile(vitals.lcp, 90)
        },
        fid: {
            average: average(vitals.fid),
            p75: percentile(vitals.fid, 75),
            p90: percentile(vitals.fid, 90)
        },
        cls: {
            average: average(vitals.cls),
            p75: percentile(vitals.cls, 75),
            p90: percentile(vitals.cls, 90)
        }
    };
}

function calculateAverageLoadTime(metrics) {
    const loadTimes = metrics
        .map(entry => entry.metrics.pageLoad?.loadComplete)
        .filter(time => time != null);
    
    return loadTimes.length > 0 ? average(loadTimes) : null;
}

function calculateErrorRate(metrics) {
    if (metrics.length === 0) return 0;
    
    const totalErrors = metrics.reduce((sum, entry) => 
        sum + (entry.metrics.errors?.length || 0), 0
    );
    
    return (totalErrors / metrics.length) * 100;
}

function calculateAverageInteractions(metrics) {
    const interactionCounts = metrics.map(entry => 
        entry.metrics.userInteractions?.length || 0
    );
    
    return average(interactionCounts);
}

function getTopErrors(metrics) {
    const errorCounts = {};
    
    metrics.forEach(entry => {
        entry.metrics.errors?.forEach(error => {
            const key = error.message || 'Unknown error';
            errorCounts[key] = (errorCounts[key] || 0) + 1;
        });
    });
    
    return Object.entries(errorCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([message, count]) => ({ message, count }));
}

function getSlowestComponents(metrics) {
    const componentTimes = {};
    
    metrics.forEach(entry => {
        entry.metrics.componentLoads?.forEach(load => {
            if (!componentTimes[load.component]) {
                componentTimes[load.component] = [];
            }
            componentTimes[load.component].push(load.loadTime);
        });
    });
    
    return Object.entries(componentTimes)
        .map(([component, times]) => ({
            component,
            averageTime: average(times),
            maxTime: Math.max(...times),
            loadCount: times.length
        }))
        .sort((a, b) => b.averageTime - a.averageTime)
        .slice(0, 5);
}

function getTopPages(metrics) {
    const pageCounts = {};
    
    metrics.forEach(entry => {
        const url = entry.url || 'Unknown';
        pageCounts[url] = (pageCounts[url] || 0) + 1;
    });
    
    return Object.entries(pageCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([url, count]) => ({ url, count }));
}

function calculateOverallPerformanceScore(metrics) {
    if (metrics.length === 0) return null;
    
    const scores = metrics.map(entry => {
        let score = 100;
        
        // LCP scoring
        const lcp = entry.metrics.pageLoad?.lcp?.value;
        if (lcp > 4000) score -= 30;
        else if (lcp > 2500) score -= 15;
        
        // FID scoring
        const fid = entry.metrics.pageLoad?.fid?.value;
        if (fid > 300) score -= 25;
        else if (fid > 100) score -= 10;
        
        // CLS scoring
        const cls = entry.metrics.pageLoad?.cls?.value;
        if (cls > 0.25) score -= 25;
        else if (cls > 0.1) score -= 10;
        
        // Error penalty
        const errorCount = entry.metrics.errors?.length || 0;
        score -= errorCount * 5;
        
        return Math.max(0, Math.min(100, score));
    });
    
    return average(scores);
}

function getPerformanceAlerts(metrics) {
    const alerts = [];
    const recent = metrics.slice(-10); // Last 10 entries
    
    // Check for recent performance degradation
    const recentLCPs = recent
        .map(m => m.metrics.pageLoad?.lcp?.value)
        .filter(v => v != null);
    
    if (recentLCPs.length > 0 && average(recentLCPs) > 3000) {
        alerts.push({
            type: 'performance',
            severity: 'warning',
            message: 'Page load times are slower than usual',
            value: average(recentLCPs)
        });
    }
    
    return alerts;
}

function generatePerformanceAlerts(metrics) {
    const alerts = [];
    
    // High error rate alert
    const errorRate = calculateErrorRate(metrics);
    if (errorRate > 10) {
        alerts.push({
            type: 'error_rate',
            severity: 'high',
            message: `High error rate detected: ${errorRate.toFixed(1)}%`,
            threshold: 10,
            value: errorRate
        });
    }
    
    // Poor Core Web Vitals
    const vitals = calculateCoreWebVitals(metrics);
    if (vitals.lcp.average > 2500) {
        alerts.push({
            type: 'lcp',
            severity: 'medium',
            message: `LCP is slower than recommended: ${vitals.lcp.average.toFixed(0)}ms`,
            threshold: 2500,
            value: vitals.lcp.average
        });
    }
    
    return alerts;
}

// Utility functions
function average(arr) {
    return arr.length > 0 ? arr.reduce((sum, val) => sum + val, 0) / arr.length : 0;
}

function percentile(arr, p) {
    if (arr.length === 0) return 0;
    const sorted = arr.slice().sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * (p / 100)) - 1;
    return sorted[Math.max(0, index)];
}

module.exports = router;