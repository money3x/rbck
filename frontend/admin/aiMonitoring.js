// ===== AI MONITORING SYSTEM =====
// Real-time monitoring and performance tracking for AI providers
// Tracks response times, success rates, usage statistics, and quality metrics

// FIXED: Removed ES6 imports to prevent module conflicts
// These will be loaded via global scope instead

/**
 * @typedef {Object} ProviderMetrics
 * @property {number} responseTime - Response time in milliseconds
 * @property {boolean} success - Whether the request was successful
 * @property {number} quality - Quality score (0-1)
 * @property {number} tokensUsed - Number of tokens used
 * @property {number} cost - Cost in currency units
 * @property {string} status - Provider status (healthy, degraded, error)
 * @property {number} successRate - Success rate percentage
 * @property {number} uptime - Uptime percentage
 * @property {number} totalRequests - Total number of requests
 * @property {number} successfulRequests - Number of successful requests
 * @property {number} failedRequests - Number of failed requests
 * @property {number} averageResponseTime - Average response time
 * @property {Array<{message: string, timestamp: Date}>} errors - Error history
 * @property {string} [error] - Error message if any
 * @property {number} totalResponseTime - Total response time for averaging
 * @property {number} lastResponseTime - Last response time recorded
 * @property {number} lastRequestTime - Timestamp of last request
 * @property {number} errorRate - Error rate percentage
 * @property {number[]} qualityScores - Array of quality scores
 * @property {number} averageQuality - Average quality score
 * @property {number} costEstimate - Estimated cost
 */

/**
 * @typedef {Object} PerformanceHistoryEntry
 * @property {string} provider - Provider name
 * @property {Date} timestamp - Timestamp of the entry
 * @property {number} responseTime - Response time in milliseconds
 * @property {boolean} success - Whether the request was successful
 * @property {number} quality - Quality score
 */

/**
 * @typedef {Object.<string, ProviderMetrics>} MetricsMap
 */

/**
 * @typedef {Object} AlertData
 * @property {string} type - Alert type
 * @property {string} provider - Provider name
 * @property {string} message - Alert message
 * @property {number} timestamp - Alert timestamp
 * @property {string} severity - Alert severity level
 */

/**
 * @typedef {Object} WindowExtensions
 * @property {function(string, string): void} [showNotification] - Show notification function
 * @property {Object} [rbckConfig] - RBCK configuration object
 * @property {string} rbckConfig.apiBase - API base URL
 * @property {AIMonitoringSystem} [aiMonitor] - AI monitoring instance
 * @property {typeof AIMonitoringSystem} [AIMonitoringSystem] - AI monitoring class
 */

// Extend window object type checking
/** @type {Window & WindowExtensions} */
const windowExt = window;

/**
 * AI Monitoring System - Tracks AI provider performance and usage
 * FIXED: Removed ES6 export for script loading compatibility
 */
class AIMonitoringSystem {
    constructor() {
        /** @type {string[]} */
        this.providers = ['gemini', 'openai', 'claude', 'deepseek', 'chinda'];
        
        /** @type {MetricsMap} */
        this.metrics = {};
        
        /** @type {boolean} */
        this.isMonitoring = false;
        
        /** @type {NodeJS.Timeout|null} */
        this.monitoringInterval = null;
        
        /** @type {{responseTime: number, successRate: number, errorRate: number}} */
        this.alertThresholds = {
            responseTime: 10000, // 10 seconds
            successRate: 0.85,   // 85%
            errorRate: 0.15      // 15%
        };
        
        /** @type {any} */
        this.realtimeChart = null;
        
        /** @type {PerformanceHistoryEntry[]} */
        this.performanceHistory = [];
        
        // Initialize metrics for each provider
        this.initializeMetrics();
    }

    /**
     * Initialize metrics tracking for all providers
     */
    initializeMetrics() {
        this.providers.forEach(provider => {
            this.metrics[provider] = {
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                totalResponseTime: 0,
                averageResponseTime: 0,
                successRate: 1.0,
                errorRate: 0.0,
                lastRequestTime: 0,
                lastResponseTime: 0,
                status: 'unknown',
                errors: [],
                uptime: 100,
                qualityScores: [],
                averageQuality: 0,
                tokensUsed: 0,
                costEstimate: 0
            };
        });
    }

    /**
     * Start monitoring system
     */
    async startMonitoring() {
        if (this.isMonitoring) {
            console.log('[AI MONITOR] Already monitoring');
            return;
        }

        console.log('📊 [AI MONITOR] Starting AI performance monitoring...');
        this.isMonitoring = true;

        try {
            // Setup monitoring UI
            this.setupMonitoringUI();
            
            // Start periodic monitoring
            this.startPeriodicMonitoring();
            
            // Setup real-time charts
            this.initializeCharts();
            
            // Load historical data
            await this.loadHistoricalData();
            
            console.log('✅ [AI MONITOR] Monitoring system activated');
            if (typeof windowExt.showNotification === 'function') {
                windowExt.showNotification('📊 AI Monitoring activated', 'success');
            }
            
        } catch (error) {
            console.error('❌ [AI MONITOR] Failed to start monitoring:', error);
            if (typeof windowExt.showNotification === 'function') {
                windowExt.showNotification('❌ AI Monitoring startup failed', 'error');
            }
            this.isMonitoring = false;
        }
    }

    /**
     * Stop monitoring system
     */
    stopMonitoring() {
        console.log('🛑 [AI MONITOR] Stopping monitoring...');
        this.isMonitoring = false;
        
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        if (typeof windowExt.showNotification === 'function') {
            windowExt.showNotification('🛑 AI Monitoring stopped', 'info');
        }
    }

    /**
     * Setup monitoring UI
     */
    setupMonitoringUI() {
        // AI monitoring UI is only available in the dedicated AI Monitoring section
        // Do not create monitoring panel in dashboard
        console.log('📊 [AI MONITOR] Monitoring UI available in AI Monitoring menu only');
        
        // Only update display if monitoring panel exists (in AI Monitoring section)
        const monitoringPanel = document.getElementById('aiMonitoringPanel');
        if (monitoringPanel) {
            this.updateMonitoringDisplay();
        }
    }

    /**
     * Generate monitoring panel HTML
     */
    generateMonitoringPanelHTML() {
        return `
            <div class="monitoring-header">
                <h3>📊 AI Performance Monitor</h3>
                <div class="monitoring-controls">
                    <button class="btn btn-sm btn-primary" onclick="windowExt.aiMonitor.refreshMetrics()" id="refreshMetricsBtn">
                        <i class="fas fa-sync"></i> Refresh
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="windowExt.aiMonitor.exportReport()" id="exportReportBtn">
                        <i class="fas fa-download"></i> Export
                    </button>
                    <div class="monitoring-status" id="monitoringStatus">
                        <span class="status-dot active"></span>
                        <span>Live Monitoring</span>
                    </div>
                </div>
            </div>

            <div class="monitoring-overview">
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-icon">⚡</div>
                        <div class="metric-content">
                            <div class="metric-value" id="avgResponseTime">--</div>
                            <div class="metric-label">Avg Response Time</div>
                        </div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-icon">✅</div>
                        <div class="metric-content">
                            <div class="metric-value" id="overallSuccessRate">--</div>
                            <div class="metric-label">Success Rate</div>
                        </div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-icon">🎯</div>
                        <div class="metric-content">
                            <div class="metric-value" id="avgQualityScore">--</div>
                            <div class="metric-label">Quality Score</div>
                        </div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-icon">💰</div>
                        <div class="metric-content">
                            <div class="metric-value" id="totalCostEstimate">--</div>
                            <div class="metric-label">Cost Estimate</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="monitoring-charts">
                <div class="chart-container">
                    <h4>Response Time Trends</h4>
                    <div class="chart-placeholder" id="responseTimeChart">
                        <canvas id="responseTimeCanvas" width="400" height="200"></canvas>
                    </div>
                </div>
                <div class="chart-container">
                    <h4>Success Rate Monitor</h4>
                    <div class="chart-placeholder" id="successRateChart">
                        <canvas id="successRateCanvas" width="400" height="200"></canvas>
                    </div>
                </div>
            </div>

            <div class="provider-details">
                <h4>Provider Performance Details</h4>
                <div class="provider-metrics-table" id="providerMetricsTable">
                    <div class="table-header">
                        <div>Provider</div>
                        <div>Status</div>
                        <div>Requests</div>
                        <div>Success Rate</div>
                        <div>Avg Time</div>
                        <div>Quality</div>
                        <div>Uptime</div>
                        <div>Actions</div>
                    </div>
                    ${this.providers.map(provider => this.generateProviderRow(provider)).join('')}
                </div>
            </div>

            <div class="monitoring-alerts" id="monitoringAlerts">
                <h4>🚨 Performance Alerts</h4>
                <div class="alerts-container" id="alertsContainer">
                    <div class="no-alerts">No active alerts</div>
                </div>
            </div>
        `;
    }

    /**
     * Generate provider row HTML
     * @param {string} provider - Provider name
     * @returns {string} HTML string for provider row
     */
    generateProviderRow(provider) {
        return `
            <div class="provider-row" id="providerRow-${provider}">
                <div class="provider-name">
                    <span class="provider-icon">${this.getProviderIcon(provider)}</span>
                    <span>${this.getProviderDisplayName(provider)}</span>
                </div>
                <div class="provider-status" id="status-${provider}">
                    <span class="status-indicator"></span>
                    <span class="status-text">--</span>
                </div>
                <div class="provider-requests" id="requests-${provider}">--</div>
                <div class="provider-success-rate" id="successRate-${provider}">--</div>
                <div class="provider-response-time" id="responseTime-${provider}">--</div>
                <div class="provider-quality" id="quality-${provider}">--</div>
                <div class="provider-uptime" id="uptime-${provider}">--</div>
                <div class="provider-actions">
                    <button class="btn btn-xs btn-info" onclick="windowExt.aiMonitor.showProviderDetails('${provider}')">
                        <i class="fas fa-info"></i>
                    </button>
                    <button class="btn btn-xs btn-warning" onclick="windowExt.aiMonitor.testProvider('${provider}')">
                        <i class="fas fa-play"></i>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Get provider icon
     * @param {string} provider - Provider name
     * @returns {string} Icon emoji for provider
     */
    getProviderIcon(provider) {
        /** @type {{[key: string]: string}} */
        const icons = {
            gemini: '⚡',
            openai: '🧠',
            claude: '🎭',
            deepseek: '🔍',
            chinda: '🧠'
        };
        return icons[provider] || '🤖';
    }

    /**
     * Get provider display name
     * @param {string} provider - Provider name
     * @returns {string} Display name for provider
     */
    getProviderDisplayName(provider) {
        /** @type {{[key: string]: string}} */
        const names = {
            gemini: 'Gemini 2.0',
            openai: 'OpenAI GPT',
            claude: 'Claude AI',
            deepseek: 'DeepSeek',
            chinda: 'ChindaX AI'
        };
        return names[provider] || provider;
    }

    /**
     * Start periodic monitoring
     */
    startPeriodicMonitoring() {
        // Monitor every 30 seconds
        this.monitoringInterval = setInterval(() => {
            this.collectMetrics();
        }, 30000);

        // Initial collection
        this.collectMetrics();
    }


    /**
     * Ping provider to test availability
     * @param {string} provider - Provider name
     * @returns {Promise<Object>} Provider response data
     */
    async pingProvider(_provider) {
        // Simulate provider ping with realistic responses
        const delay = 500 + Math.random() * 2000; // 0.5-2.5 seconds
        await new Promise(resolve => setTimeout(resolve, delay));
        
        const successRate = Math.random();
        const isSuccess = successRate > 0.1; // 90% success rate simulation
        
        return {
            success: isSuccess,
            quality: isSuccess ? 0.7 + Math.random() * 0.3 : 0,
            tokensUsed: isSuccess ? Math.floor(Math.random() * 1000) : 0,
            cost: isSuccess ? Math.random() * 0.05 : 0,
            timestamp: new Date()
        };
    }

    /**
     * Update provider metrics
     * @param {string} provider - Provider name
     * @param {ProviderMetrics} data - Metrics data to update
     */
    updateProviderMetrics(provider, data) {
        /** @type {ProviderMetrics} */
        const metrics = this.metrics[provider];
        if (!metrics) {
            console.error(`Metrics not found for provider: ${provider}`);
            return;
        }
        
        // Update request counts
        metrics.totalRequests++;
        if (data.success) {
            metrics.successfulRequests++;
        } else {
            metrics.failedRequests++;
            if (data.error) {
                metrics.errors.push({
                    message: data.error,
                    timestamp: new Date()
                });
                // Keep only last 10 errors
                if (metrics.errors.length > 10) {
                    metrics.errors = metrics.errors.slice(-10);
                }
            }
        }
        
        // Update response time
        metrics.totalResponseTime += data.responseTime;
        metrics.averageResponseTime = metrics.totalResponseTime / metrics.totalRequests;
        metrics.lastResponseTime = data.responseTime;
        metrics.lastRequestTime = Date.now();
        
        // Update rates
        metrics.successRate = metrics.successfulRequests / metrics.totalRequests;
        metrics.errorRate = metrics.failedRequests / metrics.totalRequests;
        
        // Update quality
        if (data.quality && data.success) {
            metrics.qualityScores.push(data.quality);
            // Keep only last 20 quality scores
            if (metrics.qualityScores.length > 20) {
                metrics.qualityScores = metrics.qualityScores.slice(-20);
            }
            metrics.averageQuality = metrics.qualityScores.reduce(
                /** @param {number} sum @param {number} score @returns {number} */
                (sum, score) => sum + score, 0
            ) / metrics.qualityScores.length;
        }
        
        // Update usage and cost
        if (data.tokensUsed) metrics.tokensUsed += data.tokensUsed;
        if (data.cost) metrics.costEstimate += data.cost;
        
        // Update status
        metrics.status = data.success ? 'healthy' : 'error';
        
        // Calculate uptime (simplified)
        metrics.uptime = metrics.successRate * 100;
        
        // Store in performance history
        this.performanceHistory.push({
            provider,
            timestamp: new Date(),
            responseTime: data.responseTime,
            success: data.success,
            quality: data.quality || 0
        });
        
        // Keep only last 100 entries per provider
        this.performanceHistory = this.performanceHistory.slice(-500);
    }

    /**
     * Record error for provider
     * @param {string} provider - Provider name
     * @param {Error} error - Error object
     */
    recordError(provider, error) {
        const metrics = this.metrics[provider];
        if (!metrics) {
            console.error(`Metrics not found for provider: ${provider}`);
            return;
        }
        
        metrics.errors.push({
            message: error.message,
            timestamp: new Date()
        });
        
        if (metrics.errors.length > 10) {
            metrics.errors = metrics.errors.slice(-10);
        }
        
        metrics.status = 'error';
    }

    /**
     * Update monitoring display
     */
    updateMonitoringDisplay() {
        this.updateOverviewMetrics();
        this.updateProviderTable();
    }

    /**
     * Update overview metrics
     */
    updateOverviewMetrics() {
        const allMetrics = Object.values(this.metrics);
        
        // Calculate overall averages
        const avgResponseTime = allMetrics.reduce((sum, m) => sum + (m.averageResponseTime || 0), 0) / allMetrics.length;
        const overallSuccessRate = allMetrics.reduce((sum, m) => sum + (m.successRate || 0), 0) / allMetrics.length;
        const avgQuality = allMetrics.reduce((sum, m) => sum + (m.averageQuality || 0), 0) / allMetrics.length;
        const totalCost = allMetrics.reduce((sum, m) => sum + (m.costEstimate || 0), 0);
        
        // Update UI elements
        const elements = {
            avgResponseTime: `${Math.round(avgResponseTime)}ms`,
            overallSuccessRate: `${Math.round(overallSuccessRate * 100)}%`,
            avgQualityScore: `${avgQuality.toFixed(2)}`,
            totalCostEstimate: `$${totalCost.toFixed(4)}`
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

    /**
     * Update provider table
     */
    updateProviderTable() {
        this.providers.forEach(provider => {
            const metrics = this.metrics[provider];
            if (!metrics) return;
            
            // Update status
            const statusElement = document.getElementById(`status-${provider}`);
            if (statusElement) {
                const indicator = statusElement.querySelector('.status-indicator');
                const text = statusElement.querySelector('.status-text');
                
                if (indicator && text) {
                    indicator.className = `status-indicator ${metrics.status}`;
                    text.textContent = metrics.status.charAt(0).toUpperCase() + metrics.status.slice(1);
                }
            }
            
            // Update other metrics
            const updates = {
                [`requests-${provider}`]: metrics.totalRequests,
                [`successRate-${provider}`]: `${Math.round(metrics.successRate * 100)}%`,
                [`responseTime-${provider}`]: `${Math.round(metrics.averageResponseTime)}ms`,
                [`quality-${provider}`]: metrics.averageQuality.toFixed(2),
                [`uptime-${provider}`]: `${Math.round(metrics.uptime)}%`
            };
            
            Object.entries(updates).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) element.textContent = String(value);
            });
        });
    }

    /**
     * Check for performance alerts
     */
    checkAlerts() {
        /** @type {AlertData[]} */
        const alerts = [];
        
        Object.entries(this.metrics).forEach(([provider, metrics]) => {
            // Check response time
            if (metrics.averageResponseTime > this.alertThresholds.responseTime) {
                alerts.push({
                    type: 'warning',
                    provider,
                    message: `High response time: ${Math.round(metrics.averageResponseTime)}ms`,
                    timestamp: new Date()
                });
            }
            
            // Check success rate
            if (metrics.successRate < this.alertThresholds.successRate) {
                alerts.push({
                    type: 'error',
                    provider,
                    message: `Low success rate: ${Math.round(metrics.successRate * 100)}%`,
                    timestamp: new Date()
                });
            }
            
            // Check error rate
            if (metrics.errorRate > this.alertThresholds.errorRate) {
                alerts.push({
                    type: 'warning',
                    provider,
                    message: `High error rate: ${Math.round(metrics.errorRate * 100)}%`,
                    timestamp: new Date()
                });
            }
        });
        
        this.updateAlertsDisplay(alerts);
    }

    /**
     * Update alerts display
     * @param {AlertData[]} alerts - Array of alerts to display
     */
    updateAlertsDisplay(alerts) {
        const alertsContainer = document.getElementById('alertsContainer');
        if (!alertsContainer) return;
        
        if (alerts.length === 0) {
            alertsContainer.innerHTML = '<div class="no-alerts">No active alerts</div>';
            return;
        }
        
        alertsContainer.innerHTML = alerts.map(alert => `
            <div class="alert alert-${alert.type}">
                <div class="alert-content">
                    <strong>${this.getProviderDisplayName(alert.provider)}</strong>
                    <span>${alert.message}</span>
                </div>
                <div class="alert-time">${new Date(alert.timestamp).toLocaleTimeString()}</div>
            </div>
        `).join('');
    }

    /**
     * Initialize charts (simplified implementation)
     */
    initializeCharts() {
        // This would integrate with a charting library like Chart.js
        console.log('[AI MONITOR] Charts initialized (placeholder)');
    }

    /**
     * Update charts with latest data
     */
    updateCharts() {
        // Update response time and success rate charts
        console.log('[AI MONITOR] Charts updated');
    }

    /**
     * Load historical performance data
     */
    async loadHistoricalData() {
        try {
            // In a real implementation, this would load from storage/API
            console.log('[AI MONITOR] Historical data loaded');
        } catch (error) {
            console.error('[AI MONITOR] Failed to load historical data:', error);
        }
    }

    /**
     * Collect metrics from all providers
     */
    async collectMetrics() {
        console.log('[AI MONITOR] Collecting metrics from all providers...');
        
        for (const provider of this.providers) {
            await this.collectProviderMetrics(provider);
        }
        
        this.updateMonitoringDisplay();
    }

    /**
     * Collect metrics from specific provider
     */
    /**
     * @param {string} provider - Provider name
     */
    async collectProviderMetrics(provider) {
        try {
            console.log(`[AI MONITOR] Checking ${provider} status...`);
            
            // Call real API endpoint
            const apiBase = windowExt.rbckConfig?.apiBase || 'https://rbck.onrender.com/api';
            const response = await fetch(`${apiBase}/ai/status/${provider}?t=${Date.now()}`, {
                method: 'GET',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`[AI MONITOR] ${provider} API response:`, data);
                
                // Update metrics with real data
                const currentMetrics = this.metrics[provider];
                if (currentMetrics) {
                    this.metrics[provider] = {
                        ...currentMetrics,
                        status: data.connected ? 'healthy' : 'error',
                        lastRequestTime: Date.now(),
                        lastResponseTime: data.responseTime || null,
                        averageResponseTime: data.responseTime || 0,
                        successRate: data.connected ? (data.successRate || 1.0) : 0,
                        errorRate: data.connected ? (1 - (data.successRate || 1.0)) : 1,
                        uptime: data.connected ? 100 : 0,
                        totalRequests: currentMetrics.totalRequests + 1,
                        successfulRequests: data.connected ? currentMetrics.successfulRequests + 1 : currentMetrics.successfulRequests
                    };
                }
                
                if (!data.connected) {
                    const metrics = this.metrics[provider];
                    if (metrics) {
                        metrics.failedRequests += 1;
                        metrics.errors.push({
                            message: 'Connection failed',
                            timestamp: new Date()
                        });
                        // Keep only last 10 errors
                        if (metrics.errors.length > 10) {
                            metrics.errors.shift();
                        }
                    }
                }
                
            } else {
                console.warn(`[AI MONITOR] ${provider} API returned ${response.status}`);
                // Mark as error
                const metrics = this.metrics[provider];
                if (metrics) {
                    metrics.status = 'error';
                    metrics.failedRequests += 1;
                    metrics.totalRequests += 1;
                    metrics.successRate = metrics.successfulRequests / metrics.totalRequests;
                }
            }
            
        } catch (error) {
            console.error(`[AI MONITOR] ${provider} check failed:`, error);
            // Mark as error
            const metrics = this.metrics[provider];
            if (metrics) {
                metrics.status = 'error';
                metrics.failedRequests += 1;
                metrics.totalRequests += 1;
                metrics.successRate = metrics.successfulRequests / metrics.totalRequests;
                metrics.errors.push({
                    message: error instanceof Error ? error.message : String(error),
                    timestamp: new Date()
                });
            }
        }
    }

    /**
     * Refresh metrics manually
     */
    async refreshMetrics() {
        if (typeof windowExt.showNotification === 'function') {
            windowExt.showNotification('🔄 Refreshing AI metrics...', 'info');
        }
        await this.collectMetrics();
        if (typeof windowExt.showNotification === 'function') {
            windowExt.showNotification('✅ Metrics refreshed', 'success');
        }
    }

    /**
     * Test specific provider
     * @param {string} provider - Provider name
     */
    async testProvider(provider) {
        if (typeof windowExt.showNotification === 'function') {
            windowExt.showNotification(`🧪 Testing ${this.getProviderDisplayName(provider)}...`, 'info');
        }
        
        try {
            await this.collectProviderMetrics(provider);
            this.updateMonitoringDisplay();
            if (typeof windowExt.showNotification === 'function') {
                windowExt.showNotification(`✅ ${this.getProviderDisplayName(provider)} test completed`, 'success');
            }
        } catch (error) {
            if (typeof windowExt.showNotification === 'function') {
                windowExt.showNotification(`❌ ${this.getProviderDisplayName(provider)} test failed`, 'error');
            }
        }
    }

    /**
     * Show detailed provider information
     * @param {string} provider - Provider name
     */
    showProviderDetails(provider) {
        const metrics = this.metrics[provider];
        if (!metrics) {
            alert(`No metrics available for ${provider}`);
            return;
        }
        
        const details = `
Provider: ${this.getProviderDisplayName(provider)}
Status: ${metrics.status}
Total Requests: ${metrics.totalRequests}
Success Rate: ${Math.round(metrics.successRate * 100)}%
Average Response Time: ${Math.round(metrics.averageResponseTime)}ms
Quality Score: ${metrics.averageQuality.toFixed(2)}
Uptime: ${Math.round(metrics.uptime)}%
Tokens Used: ${metrics.tokensUsed}
Cost Estimate: $${metrics.costEstimate.toFixed(4)}
Recent Errors: ${metrics.errors.length}
        `;
        
        alert(details); // In a real implementation, this would be a modal
    }

    /**
     * Export performance report
     */
    exportReport() {
        const report = {
            timestamp: new Date().toISOString(),
            overview: {
                monitoringDuration: 'Current Session',
                totalProviders: this.providers.length,
                activeProviders: Object.values(this.metrics).filter(m => m.status === 'healthy').length
            },
            providers: this.metrics,
            performanceHistory: this.performanceHistory.slice(-100), // Last 100 entries
            alerts: this.getCurrentAlerts()
        };
        
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-monitoring-report-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        if (typeof windowExt.showNotification === 'function') {
            windowExt.showNotification('📊 Monitoring report exported', 'success');
        }
    }

    /**
     * Get current alerts
     * @returns {AlertData[]} Array of current alerts
     */
    getCurrentAlerts() {
        /** @type {AlertData[]} */
        const alerts = [];
        
        Object.entries(this.metrics).forEach(([provider, metrics]) => {
            if (metrics.averageResponseTime > this.alertThresholds.responseTime) {
                alerts.push({ 
                    type: 'performance', 
                    provider, 
                    message: `High response time: ${metrics.averageResponseTime}ms`,
                    timestamp: Date.now(),
                    severity: 'warning'
                });
            }
            if (metrics.successRate < this.alertThresholds.successRate) {
                alerts.push({ 
                    type: 'reliability', 
                    provider, 
                    message: `Low success rate: ${(metrics.successRate * 100).toFixed(1)}%`,
                    timestamp: Date.now(),
                    severity: 'error'
                });
            }
        });
        
        return alerts;
    }

    /**
     * Get monitoring summary
     */
    getSummary() {
        const allMetrics = Object.values(this.metrics);
        const activeProviders = allMetrics.filter(m => m.status === 'healthy').length;
        const avgResponseTime = allMetrics.reduce((sum, m) => sum + (m.averageResponseTime || 0), 0) / allMetrics.length;
        const overallSuccessRate = allMetrics.reduce((sum, m) => sum + (m.successRate || 0), 0) / allMetrics.length;
        
        return {
            isMonitoring: this.isMonitoring,
            activeProviders,
            totalProviders: this.providers.length,
            avgResponseTime: Math.round(avgResponseTime),
            successRate: Math.round(overallSuccessRate * 100),
            alertCount: this.getCurrentAlerts().length,
            dataPoints: this.performanceHistory.length
        };
    }

    /**
     * Initialize global access
     */
    bindGlobalFunctions() {
        windowExt.aiMonitor = this;
    }
}

// Make AIMonitoringSystem available globally
windowExt.AIMonitoringSystem = AIMonitoringSystem;

console.log('✅ [AI MONITOR] AIMonitoringSystem class loaded and available globally');
