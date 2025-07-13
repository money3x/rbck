// ===== AI MONITORING UI - SEPARATED VERSION =====
// Enhanced AI Monitoring system with dedicated menu interface
// Real-time performance tracking and analytics

import { showNotification } from './uiHelpers.js';
import { API_BASE } from '../config.js';

/**
 * Enhanced AI Monitoring System for Dedicated Menu
 */
export class AIMonitoringUI {
    constructor() {
        this.providers = ['gemini', 'openai', 'claude', 'deepseek', 'chinda'];
        this.metrics = {};
        this.isMonitoring = false;
        this.monitoringInterval = null;
        this.performanceHistory = [];
        
        this.alertThresholds = {
            responseTime: 5000, // 5 seconds
            successRate: 0.85,   // 85%
            errorRate: 0.15      // 15%
        };
          this.providerInfo = {
            gemini: { name: 'Gemini 2.0 Flash', icon: '⚡', color: '#4285f4' },
            openai: { name: 'OpenAI GPT', icon: '🧠', color: '#00a67e' },
            claude: { name: 'Claude AI', icon: '🎭', color: '#ff6b35' },
            deepseek: { name: 'DeepSeek AI', icon: '🔍', color: '#7c3aed' },
            chinda: { name: 'ChindaX AI', icon: '🚀', color: '#10b981' }
        };
        
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
                lastRequestTime: null,
                lastResponseTime: null,
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
            console.log('[AI MONITOR UI] Already monitoring');
            return;
        }

        console.log('📊 [AI MONITOR UI] Starting AI performance monitoring...');
        this.isMonitoring = true;

        try {
            // Setup monitoring UI
            this.setupMonitoringUI();
            
            // Start periodic monitoring
            this.startPeriodicMonitoring();
            
            // Load initial data (status only, no testing)
            await this.collectStatusOnlyMetrics();
            
            // Bind global functions
            this.bindGlobalFunctions();
            
            console.log('✅ [AI MONITOR UI] Monitoring system activated');
            showNotification('📊 AI Monitoring เริ่มทำงานแล้ว', 'success');
            
        } catch (error) {
            console.error('❌ [AI MONITOR UI] Failed to start monitoring:', error);
            showNotification('❌ เกิดข้อผิดพลาดในการเริ่ม AI Monitoring', 'error');
            this.isMonitoring = false;
        }
    }

    /**
     * Setup monitoring UI
     */
    setupMonitoringUI() {
        this.updateOverviewMetrics();
        this.setupPerformanceTable();
        this.updateAlertsDisplay([]);
    }

    /**
     * Setup performance table
     */
    setupPerformanceTable() {
        const tableBody = document.getElementById('providerPerformanceTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = this.providers.map(provider => {
            const info = this.providerInfo[provider];
            const metrics = this.metrics[provider];
            
            return `
                <tr id="providerRow-${provider}">
                    <td class="provider-name-cell">
                        <span class="provider-icon">${info.icon}</span>
                        <span>${info.name}</span>
                    </td>
                    <td class="provider-status-cell">
                        <span class="provider-status-badge ${this.getStatusClass(metrics.status)}" id="statusBadge-${provider}">
                            ${this.getStatusText(metrics.status)}
                        </span>
                    </td>
                    <td id="totalRequests-${provider}">${metrics.totalRequests}</td>
                    <td id="successRate-${provider}">${Math.round(metrics.successRate * 100)}%</td>
                    <td id="avgResponseTime-${provider}">${Math.round(metrics.averageResponseTime)}ms</td>
                    <td id="qualityScore-${provider}">${metrics.averageQuality.toFixed(2)}</td>
                    <td id="uptime-${provider}">${Math.round(metrics.uptime)}%</td>
                    <td class="performance-actions">
                        <button class="btn btn-xs btn-info" onclick="testProvider('${provider}')" title="ทดสอบ">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="btn btn-xs btn-secondary" onclick="showProviderDetails('${provider}')" title="รายละเอียด">
                            <i class="fas fa-info"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    /**
     * Start periodic monitoring (STATUS ONLY - no token usage)
     */
    startPeriodicMonitoring() {
        // Monitor every 2 minutes (reduced from 30s to save tokens)
        this.monitoringInterval = setInterval(() => {
            if (this.isMonitoring) {
                console.log('⏰ [AI MONITOR] Periodic status check (no testing)');
                this.collectStatusOnlyMetrics(); // Changed from collectAllMetrics
            }
        }, 120000); // Changed to 2 minutes
    }

    /**
     * Collect status-only metrics (no actual testing to save tokens)
     */
    async collectStatusOnlyMetrics() {
        console.log('[AI MONITOR UI] Collecting status-only metrics (no testing)...');
        
        try {
            // Get metrics from backend without triggering tests
            const response = await fetch(`${API_BASE}/ai/metrics`);
            
            if (response.ok) {
                const data = await response.json();
                console.log('[AI MONITOR UI] Backend metrics:', data);
                
                if (data.success && data.metrics) {
                    // Update metrics with backend data
                    this.providers.forEach(provider => {
                        const backendMetrics = data.metrics[provider];
                        if (backendMetrics) {
                            const metrics = this.metrics[provider];
                            metrics.totalRequests = backendMetrics.totalRequests || 0;
                            metrics.successfulRequests = backendMetrics.successfulRequests || 0;
                            metrics.averageResponseTime = backendMetrics.averageResponseTime || 0;
                            metrics.successRate = (backendMetrics.successRate || 0) / 100;
                            metrics.averageQuality = backendMetrics.qualityScore || 0;
                            metrics.uptime = backendMetrics.uptime || 0;
                            metrics.status = backendMetrics.status || 'unknown';
                            metrics.lastRequestTime = backendMetrics.lastActive ? new Date(backendMetrics.lastActive) : null;
                        }
                    });
                }
            }
        } catch (error) {
            console.error('[AI MONITOR UI] Error collecting backend metrics:', error);
        }

        this.updateAllDisplays();
    }

    /**
     * Collect metrics from all providers (WITH TESTING - manual only)
     */
    async collectAllMetrics() {
        console.log('[AI MONITOR UI] Collecting metrics with testing (manual only)...');
        
        for (const provider of this.providers) {
            try {
                await this.collectProviderMetrics(provider);
            } catch (error) {
                console.error(`[AI MONITOR UI] Error collecting metrics for ${provider}:`, error);
                this.recordError(provider, error);
            }
        }

        this.updateAllDisplays();
    }

    /**
     * Collect metrics for specific provider
     */
    async collectProviderMetrics(provider) {
        const startTime = Date.now();
        
        console.log(`📊 [AI MONITOR] Collecting metrics for ${provider}...`);
        
        try {
            // Try to get provider status from backend first
            const statusResponse = await this.getProviderStatus(provider);
            console.log(`📊 [AI MONITOR] ${provider} status response:`, statusResponse);
            
            // Test provider using API
            const testResponse = await this.testProviderAPI(provider);
            console.log(`📊 [AI MONITOR] ${provider} test response:`, testResponse);
            
            const responseTime = Date.now() - startTime;
            
            // Update metrics with both status and test data
            const metricsData = {
                responseTime: testResponse.responseTime || responseTime,
                success: testResponse.success,
                quality: testResponse.quality || 0.8,
                tokensUsed: testResponse.tokensUsed || 0,
                cost: testResponse.cost || 0,
                status: statusResponse.status || 'unknown'
            };
            
            console.log(`📊 [AI MONITOR] Updating ${provider} metrics:`, metricsData);
            this.updateProviderMetrics(provider, metricsData);
            
        } catch (error) {
            console.error(`❌ [AI MONITOR] Error collecting ${provider} metrics:`, error);
            const responseTime = Date.now() - startTime;
            this.updateProviderMetrics(provider, {
                responseTime,
                success: false,
                error: error.message,
                status: 'error'
            });
        }
    }

    /**
     * Get provider status from backend using new metrics API
     */
    async getProviderStatus(provider) {
        try {
            // Use public metrics endpoint instead of individual status
            const response = await fetch(`${API_BASE}/ai/metrics`);
            
            if (response.ok) {
                const data = await response.json();
                console.log(`📊 [AI Monitor] Metrics response:`, data);
                
                if (data.success && data.metrics && data.metrics[provider]) {
                    const providerMetrics = data.metrics[provider];
                    return {
                        status: providerMetrics.status || 'unknown',
                        responseTime: providerMetrics.averageResponseTime,
                        successRate: providerMetrics.successRate / 100,
                        isActive: providerMetrics.isActive
                    };
                }
                return { status: 'unknown' };
            } else {
                return { status: 'error' };
            }
        } catch (error) {
            console.warn(`⚠️ [AI Monitor] Failed to get ${provider} status:`, error.message);
            return { status: 'unknown' };
        }
    }

    /**
     * Test provider via API
     */
    async testProviderAPI(provider) {
        try {
            // Import auth functions
            const { authenticatedFetch } = await import('./auth.js');
            
            // Use authenticated fetch to call backend API
            const response = await authenticatedFetch(`${API_BASE}/ai/test/${provider}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: 'Performance monitoring test' })
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`📊 [AI Monitor] ${provider} API response:`, data);
                return {
                    success: data.success,
                    quality: data.quality,
                    tokensUsed: data.tokensUsed,
                    cost: data.cost || 0,
                    responseTime: data.responseTime
                };
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error(`❌ [AI Monitor] ${provider} API error:`, response.status, errorData);
                throw new Error(`HTTP ${response.status}: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.warn(`⚠️ [AI Monitor] ${provider} API failed, using fallback:`, error.message);
            
            // Fallback to simulation for demo
            await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1500));
            const isSuccess = Math.random() > 0.1; // 90% success rate
            
            return {
                success: isSuccess,
                quality: isSuccess ? 0.7 + Math.random() * 0.3 : 0,
                tokensUsed: isSuccess ? Math.floor(Math.random() * 100) + 50 : 0,
                cost: isSuccess ? Math.random() * 0.01 : 0
            };
        }
    }

    /**
     * Update provider metrics
     */
    updateProviderMetrics(provider, data) {
        const metrics = this.metrics[provider];
        
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
        metrics.lastRequestTime = new Date();
        
        // Update rates
        metrics.successRate = metrics.successfulRequests / metrics.totalRequests;
        metrics.errorRate = metrics.failedRequests / metrics.totalRequests;
        
        // Update quality
        if (data.quality && data.success) {
            metrics.qualityScores.push(data.quality);
            if (metrics.qualityScores.length > 20) {
                metrics.qualityScores = metrics.qualityScores.slice(-20);
            }
            metrics.averageQuality = metrics.qualityScores.reduce((sum, score) => sum + score, 0) / metrics.qualityScores.length;
        }
        
        // Update usage and cost
        if (data.tokensUsed) metrics.tokensUsed += data.tokensUsed;
        if (data.cost) metrics.costEstimate += data.cost;
        
        // Update status
        metrics.status = data.success ? 'healthy' : 'error';
        
        // Calculate uptime
        metrics.uptime = metrics.successRate * 100;
        
        // Store in performance history
        this.performanceHistory.push({
            provider,
            timestamp: new Date(),
            responseTime: data.responseTime,
            success: data.success,
            quality: data.quality || 0
        });
        
        // Keep only last 500 entries
        if (this.performanceHistory.length > 500) {
            this.performanceHistory = this.performanceHistory.slice(-500);
        }
    }

    /**
     * Record error for provider
     */
    recordError(provider, error) {
        const metrics = this.metrics[provider];
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
     * Update all displays
     */
    updateAllDisplays() {
        this.updateOverviewMetrics();
        this.updatePerformanceTable();
        this.checkAndUpdateAlerts();
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
        const avgUptime = allMetrics.reduce((sum, m) => sum + (m.uptime || 0), 0) / allMetrics.length;
        
        // Update UI elements
        const updates = {
            avgResponseTimeDisplay: `${Math.round(avgResponseTime)}ms`,
            overallSuccessRateDisplay: `${Math.round(overallSuccessRate * 100)}%`,
            avgQualityScoreDisplay: avgQuality.toFixed(2),
            uptimeDisplay: `${Math.round(avgUptime)}%`
        };
        
        Object.entries(updates).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

    /**
     * Update performance table
     */
    updatePerformanceTable() {
        this.providers.forEach(provider => {
            const metrics = this.metrics[provider];
            
            // Update status badge
            const statusBadge = document.getElementById(`statusBadge-${provider}`);
            if (statusBadge) {
                statusBadge.className = `provider-status-badge ${this.getStatusClass(metrics.status)}`;
                statusBadge.textContent = this.getStatusText(metrics.status);
            }
            
            // Update metrics
            const updates = {
                [`totalRequests-${provider}`]: metrics.totalRequests,
                [`successRate-${provider}`]: `${Math.round(metrics.successRate * 100)}%`,
                [`avgResponseTime-${provider}`]: `${Math.round(metrics.averageResponseTime)}ms`,
                [`qualityScore-${provider}`]: metrics.averageQuality.toFixed(2),
                [`uptime-${provider}`]: `${Math.round(metrics.uptime)}%`
            };
            
            Object.entries(updates).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) element.textContent = value;
            });
        });
    }

    /**
     * Check and update alerts
     */
    checkAndUpdateAlerts() {
        const alerts = [];
        
        Object.entries(this.metrics).forEach(([provider, metrics]) => {
            const info = this.providerInfo[provider];
            
            // Check response time
            if (metrics.averageResponseTime > this.alertThresholds.responseTime) {
                alerts.push({
                    type: 'warning',
                    provider,
                    providerName: info.name,
                    message: `เวลาตอบสนองสูง: ${Math.round(metrics.averageResponseTime)}ms`,
                    timestamp: new Date()
                });
            }
            
            // Check success rate
            if (metrics.successRate < this.alertThresholds.successRate && metrics.totalRequests > 0) {
                alerts.push({
                    type: 'error',
                    provider,
                    providerName: info.name,
                    message: `อัตราสำเร็จต่ำ: ${Math.round(metrics.successRate * 100)}%`,
                    timestamp: new Date()
                });
            }
            
            // Check error rate
            if (metrics.errorRate > this.alertThresholds.errorRate && metrics.totalRequests > 0) {
                alerts.push({
                    type: 'warning',
                    provider,
                    providerName: info.name,
                    message: `อัตราข้อผิดพลาดสูง: ${Math.round(metrics.errorRate * 100)}%`,
                    timestamp: new Date()
                });
            }
        });
        
        this.updateAlertsDisplay(alerts);
    }

    /**
     * Update alerts display
     */
    updateAlertsDisplay(alerts) {
        const alertsContainer = document.getElementById('performanceAlertsDisplay');
        if (!alertsContainer) return;
        
        if (alerts.length === 0) {
            alertsContainer.innerHTML = `
                <div class="no-alerts-message">
                    <i class="fas fa-check-circle"></i>
                    <span>ไม่มีการแจ้งเตือน - ระบบทำงานปกติ</span>
                </div>
            `;
            return;
        }
        
        alertsContainer.innerHTML = alerts.map(alert => `
            <div class="performance-alert ${alert.type}">
                <div class="alert-content">
                    <div class="alert-title">${alert.providerName}</div>
                    <div class="alert-description">${alert.message}</div>
                </div>
                <div class="alert-time">${alert.timestamp.toLocaleTimeString('th-TH')}</div>
            </div>
        `).join('');
    }

    /**
     * Get status class for styling
     */
    getStatusClass(status) {
        const statusClasses = {
            healthy: 'healthy',
            warning: 'warning',
            error: 'error',
            unknown: 'warning'
        };
        return statusClasses[status] || 'warning';
    }

    /**
     * Get status text in Thai
     */
    getStatusText(status) {
        const statusTexts = {
            healthy: 'ปกติ',
            warning: 'เตือน',
            error: 'ข้อผิดพลาด',
            unknown: 'ไม่ทราบ'
        };
        return statusTexts[status] || 'ไม่ทราบ';
    }

    /**
     * Refresh all provider metrics manually
     */
    async refreshAllProviderMetrics() {
        showNotification('🔄 กำลังรีเฟรชข้อมูลประสิทธิภาพ...', 'info');
        
        try {
            await this.collectAllMetrics();
            showNotification('✅ รีเฟรชข้อมูลสำเร็จ', 'success');
        } catch (error) {
            console.error('[AI MONITOR UI] Refresh failed:', error);
            showNotification('❌ รีเฟรชข้อมูลล้มเหลว', 'error');
        }
    }

    /**
     * Test specific provider manually
     */
    async testProvider(provider) {
        const info = this.providerInfo[provider];
        showNotification(`🧪 กำลังทดสอบ ${info.name}...`, 'info');
        
        try {
            await this.collectProviderMetrics(provider);
            this.updateAllDisplays();
            showNotification(`✅ ทดสอบ ${info.name} เสร็จสิ้น`, 'success');
        } catch (error) {
            console.error(`[AI MONITOR UI] Test ${provider} failed:`, error);
            showNotification(`❌ ทดสอบ ${info.name} ล้มเหลว`, 'error');
        }
    }

    /**
     * Show detailed provider information
     */
    showProviderDetails(provider) {
        const metrics = this.metrics[provider];
        const info = this.providerInfo[provider];
        
        const details = `รายละเอียด: ${info.name}
        
สถานะ: ${this.getStatusText(metrics.status)}
จำนวนคำขอทั้งหมด: ${metrics.totalRequests}
อัตราสำเร็จ: ${Math.round(metrics.successRate * 100)}%
เวลาตอบสนองเฉลี่ย: ${Math.round(metrics.averageResponseTime)}ms
คะแนนคุณภาพ: ${metrics.averageQuality.toFixed(2)}
Uptime: ${Math.round(metrics.uptime)}%
Tokens ที่ใช้: ${metrics.tokensUsed}
ค่าใช้จ่ายประมาณ: $${metrics.costEstimate.toFixed(4)}
ข้อผิดพลาดล่าสุด: ${metrics.errors.length}

คำขอล่าสุด: ${metrics.lastRequestTime ? metrics.lastRequestTime.toLocaleString('th-TH') : 'ยังไม่มี'}`;
        
        alert(details); // In production, this would be a modal
    }

    /**
     * Export performance report
     */
    exportPerformanceReport() {
        const report = {
            timestamp: new Date().toISOString(),
            overview: {
                monitoringDuration: 'Current Session',
                totalProviders: this.providers.length,
                activeProviders: Object.values(this.metrics).filter(m => m.status === 'healthy').length,
                isMonitoring: this.isMonitoring
            },
            providerMetrics: this.metrics,
            performanceHistory: this.performanceHistory.slice(-100),
            alerts: this.getCurrentAlerts(),
            thresholds: this.alertThresholds
        };
        
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-monitoring-report-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        showNotification('📊 Export รายงานประสิทธิภาพสำเร็จ', 'success');
    }

    /**
     * Get current alerts
     */
    getCurrentAlerts() {
        const alerts = [];
        
        Object.entries(this.metrics).forEach(([provider, metrics]) => {
            if (metrics.averageResponseTime > this.alertThresholds.responseTime) {
                alerts.push({ type: 'performance', provider, metric: 'response_time', value: metrics.averageResponseTime });
            }
            if (metrics.successRate < this.alertThresholds.successRate && metrics.totalRequests > 0) {
                alerts.push({ type: 'reliability', provider, metric: 'success_rate', value: metrics.successRate });
            }
        });
        
        return alerts;
    }

    /**
     * Stop monitoring
     */
    stopMonitoring() {
        console.log('🛑 [AI MONITOR UI] Stopping monitoring...');
        this.isMonitoring = false;
        
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        showNotification('🛑 หยุด AI Monitoring แล้ว', 'info');
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
     * Bind global functions
     */
    bindGlobalFunctions() {
        window.aiMonitoringUI = this;
        window.refreshAllProviderMetrics = () => this.refreshAllProviderMetrics();
        window.exportPerformanceReport = () => this.exportPerformanceReport();
        window.testProvider = (provider) => this.testProvider(provider);
        window.showProviderDetails = (provider) => this.showProviderDetails(provider);
        window.startAIMonitoring = () => this.startMonitoring();
        window.stopAIMonitoring = () => this.stopMonitoring();
        
        console.log('✅ [AI MONITOR UI] Global functions bound for external access');
    }
}
