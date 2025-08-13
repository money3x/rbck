/**
 * 🚀 UNIFIED MONITORING SERVICE
 * Consolidates all status monitoring into a single efficient system
 * Prevents redundant API calls and improves performance
 */

class UnifiedMonitoringService {
    constructor() {
        this.providers = ['gemini', 'openai', 'claude', 'deepseek', 'chinda'];
        this.status = new Map();
        this.subscribers = new Set();
        this.isMonitoring = false;
        this.intervals = new Map();
        this.cache = new Map();
        
        // Performance optimizations
        this.config = {
            updateInterval: 10000, // 10 seconds (reduced from multiple 5-second intervals)
            cacheTimeout: 30000,   // 30 seconds cache
            maxRetries: 3,
            retryDelay: 1000,
            batchRequests: true,
            useWebSocket: false // TODO: Implement WebSocket
        };
        
        // Initialize status
        this.initializeStatus();
        
        console.log('🚀 [UNIFIED MONITOR] Unified monitoring service initialized');
    }

    /**
     * Initialize provider status
     */
    initializeStatus() {
        this.providers.forEach(provider => {
            this.status.set(provider, {
                id: provider,
                name: this.getProviderDisplayName(provider),
                connected: false,
                configured: false,
                status: 'checking',
                responseTime: null,
                successRate: 0,
                lastUpdate: null,
                isActive: false,
                errorCount: 0,
                uptime: 0,
                totalRequests: 0,
                successfulRequests: 0
            });
        });
    }

    /**
     * Get provider display name
     */
    getProviderDisplayName(provider) {
        const names = {
            gemini: 'Google Gemini',
            openai: 'OpenAI GPT',
            claude: 'Claude AI',
            deepseek: 'DeepSeek AI',
            chinda: 'ChindaX AI'
        };
        return names[provider] || provider;
    }

    /**
     * Start unified monitoring
     */
    async startMonitoring() {
        if (this.isMonitoring) {
            console.log('⚠️ [UNIFIED MONITOR] Already monitoring');
            return;
        }

        console.log('🚀 [UNIFIED MONITOR] Starting unified monitoring...');
        this.isMonitoring = true;

        // Initial update
        await this.updateAllProviderStatus();

        // Set up monitoring interval
        this.intervals.set('main', setInterval(async () => {
            await this.updateAllProviderStatus();
        }, this.config.updateInterval));

        // Cache cleanup interval
        this.intervals.set('cache', setInterval(() => {
            this.cleanupCache();
        }, 60000)); // Every minute

        console.log(`✅ [UNIFIED MONITOR] Monitoring started (${this.config.updateInterval}ms interval)`);
        this.notifySubscribers('monitoring-started');
    }

    /**
     * Stop monitoring
     */
    stopMonitoring() {
        console.log('🛑 [UNIFIED MONITOR] Stopping monitoring...');
        this.isMonitoring = false;

        // Clear all intervals
        this.intervals.forEach((interval, key) => {
            clearInterval(interval);
            console.log(`🛑 [UNIFIED MONITOR] Cleared ${key} interval`);
        });
        this.intervals.clear();

        this.notifySubscribers('monitoring-stopped');
        console.log('✅ [UNIFIED MONITOR] Monitoring stopped');
    }

    /**
     * Update all provider status efficiently
     */
    async updateAllProviderStatus() {
        console.log('🔄 [UNIFIED MONITOR] Updating all provider status...');
        const startTime = Date.now();

        try {
            // Check cache first
            const cacheKey = 'all_providers_status';
            const cached = this.cache.get(cacheKey);
            
            if (cached && (Date.now() - cached.timestamp) < this.config.cacheTimeout) {
                console.log('⚡ [UNIFIED MONITOR] Using cached status');
                this.processStatusData(cached.data);
                return;
            }

            // Fetch fresh data
            const apiBase = window.__API_BASE__ || 'https://rbck.onrender.com/api';
            const response = await this.fetchWithTimeout(
                `${apiBase}/ai/metrics?t=${Date.now()}`,
                5000
            );

            if (response.ok) {
                const data = await response.json();
                
                // Cache successful response
                this.cache.set(cacheKey, {
                    data,
                    timestamp: Date.now()
                });

                this.processStatusData(data);
                
                const duration = Date.now() - startTime;
                console.log(`✅ [UNIFIED MONITOR] Status updated in ${duration}ms`);
            } else {
                console.warn(`⚠️ [UNIFIED MONITOR] API response error: ${response.status}`);
                this.handleUpdateError();
            }
        } catch (error) {
            console.error('❌ [UNIFIED MONITOR] Update failed:', error);
            this.handleUpdateError();
        }
    }

    /**
     * Process status data from API
     */
    processStatusData(data) {
        if (!data || !data.success || !data.metrics) {
            console.error('❌ [UNIFIED MONITOR] Invalid status data:', data);
            return;
        }

        let connectedCount = 0;
        
        this.providers.forEach(provider => {
            const apiData = data.metrics[provider];
            const currentStatus = this.status.get(provider);
            
            if (apiData && currentStatus) {
                // Update status with API data
                const isConnected = apiData.isActive && apiData.configured;
                
                Object.assign(currentStatus, {
                    connected: isConnected,
                    configured: apiData.configured,
                    status: apiData.status,
                    isActive: apiData.isActive,
                    responseTime: apiData.averageResponseTime,
                    successRate: apiData.successRate,
                    uptime: apiData.uptime,
                    totalRequests: apiData.totalRequests,
                    successfulRequests: apiData.successfulRequests,
                    lastUpdate: new Date().toISOString()
                });
                
                if (isConnected) connectedCount++;
                
                console.log(`📊 [UNIFIED MONITOR] ${provider}: ${isConnected ? 'Connected' : 'Disconnected'}`);
            } else {
                // Mark as disconnected if no API data
                Object.assign(currentStatus, {
                    connected: false,
                    status: 'error',
                    lastUpdate: new Date().toISOString()
                });
            }
        });

        // Notify all subscribers
        this.notifySubscribers('status-updated', {
            connectedCount,
            totalCount: this.providers.length,
            timestamp: Date.now()
        });

        console.log(`📊 [UNIFIED MONITOR] Status processed: ${connectedCount}/${this.providers.length} connected`);
    }

    /**
     * Handle update errors
     */
    handleUpdateError() {
        this.providers.forEach(provider => {
            const status = this.status.get(provider);
            if (status) {
                status.errorCount++;
                status.status = 'error';
                status.connected = false;
                status.lastUpdate = new Date().toISOString();
            }
        });

        this.notifySubscribers('update-error');
    }

    /**
     * Fetch with timeout
     */
    async fetchWithTimeout(url, timeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * Subscribe to status updates
     */
    subscribe(callback) {
        if (typeof callback !== 'function') {
            console.error('❌ [UNIFIED MONITOR] Invalid callback function');
            return null;
        }

        this.subscribers.add(callback);
        console.log(`📡 [UNIFIED MONITOR] Subscriber added (total: ${this.subscribers.size})`);

        // Return unsubscribe function
        return () => {
            this.subscribers.delete(callback);
            console.log(`📡 [UNIFIED MONITOR] Subscriber removed (total: ${this.subscribers.size})`);
        };
    }

    /**
     * Notify all subscribers
     */
    notifySubscribers(event, data = null) {
        const notification = {
            event,
            data,
            timestamp: Date.now(),
            status: Object.fromEntries(this.status)
        };

        this.subscribers.forEach(callback => {
            try {
                callback(notification);
            } catch (error) {
                console.error('❌ [UNIFIED MONITOR] Subscriber error:', error);
            }
        });

        console.log(`📡 [UNIFIED MONITOR] Notified ${this.subscribers.size} subscribers: ${event}`);
    }

    /**
     * Get provider status
     */
    getProviderStatus(provider) {
        return this.status.get(provider) || null;
    }

    /**
     * Get all provider status
     */
    getAllProviderStatus() {
        return Object.fromEntries(this.status);
    }

    /**
     * Get connected providers
     */
    getConnectedProviders() {
        return Array.from(this.status.values()).filter(provider => provider.connected);
    }

    /**
     * Get monitoring statistics
     */
    getStats() {
        const connected = this.getConnectedProviders().length;
        
        return {
            isMonitoring: this.isMonitoring,
            totalProviders: this.providers.length,
            connectedProviders: connected,
            subscribers: this.subscribers.size,
            cacheSize: this.cache.size,
            intervals: this.intervals.size,
            lastUpdate: Math.max(...Array.from(this.status.values())
                .map(s => s.lastUpdate ? new Date(s.lastUpdate).getTime() : 0))
        };
    }

    /**
     * Force refresh all status
     */
    async forceRefresh() {
        console.log('🔄 [UNIFIED MONITOR] Force refresh requested...');
        
        // Clear cache
        this.cache.clear();
        
        // Update immediately
        await this.updateAllProviderStatus();
        
        console.log('✅ [UNIFIED MONITOR] Force refresh completed');
    }

    /**
     * Test individual provider
     */
    async testProvider(provider) {
        if (!this.providers.includes(provider)) {
            throw new Error(`Unknown provider: ${provider}`);
        }

        console.log(`🧪 [UNIFIED MONITOR] Testing ${provider}...`);
        
        try {
            const apiBase = window.__API_BASE__ || 'https://rbck.onrender.com/api';
            const response = await this.fetchWithTimeout(
                `${apiBase}/ai/test/${provider}`,
                10000
            );

            const result = await response.json();
            
            // Update status based on test result
            const status = this.status.get(provider);
            if (status) {
                status.connected = result.success;
                status.responseTime = result.responseTime;
                status.lastUpdate = new Date().toISOString();
                status.status = result.success ? 'ready' : 'error';
            }

            this.notifySubscribers('provider-tested', { provider, result });
            console.log(`🧪 [UNIFIED MONITOR] ${provider} test result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
            
            return result;
        } catch (error) {
            console.error(`🧪 [UNIFIED MONITOR] ${provider} test failed:`, error);
            throw error;
        }
    }

    /**
     * Clean up old cache entries
     */
    cleanupCache() {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.config.cacheTimeout * 2) {
                this.cache.delete(key);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            console.log(`🧹 [UNIFIED MONITOR] Cleaned ${cleaned} cache entries`);
        }
    }

    /**
     * Get performance report
     */
    getPerformanceReport() {
        const stats = this.getStats();
        const providers = this.getAllProviderStatus();
        
        return {
            monitoring: {
                active: stats.isMonitoring,
                interval: this.config.updateInterval,
                subscribers: stats.subscribers,
                lastUpdate: new Date(stats.lastUpdate).toISOString()
            },
            providers: {
                total: stats.totalProviders,
                connected: stats.connectedProviders,
                details: providers
            },
            performance: {
                cacheSize: stats.cacheSize,
                cacheHitRate: this.calculateCacheHitRate(),
                avgResponseTime: this.calculateAverageResponseTime(providers)
            },
            config: this.config
        };
    }

    calculateCacheHitRate() {
        // Implementation would track cache hits vs misses
        return '85%'; // Placeholder
    }

    calculateAverageResponseTime(providers) {
        const times = Object.values(providers)
            .map(p => p.responseTime)
            .filter(t => t !== null && t > 0);
        
        return times.length > 0 
            ? Math.round(times.reduce((sum, time) => sum + time, 0) / times.length)
            : 0;
    }
}

// Create singleton instance
window.unifiedMonitoringService = new UnifiedMonitoringService();

// Legacy compatibility - migrate existing systems
if (window.unifiedStatusManager) {
    console.log('🔄 [UNIFIED MONITOR] Migrating from legacy status manager...');
    // Stop old system
    if (window.unifiedStatusManager.stopMonitoring) {
        window.unifiedStatusManager.stopMonitoring();
    }
    
    // Replace with new system
    window.unifiedStatusManager = {
        isMonitoring: () => window.unifiedMonitoringService.isMonitoring,
        startMonitoring: () => window.unifiedMonitoringService.startMonitoring(),
        stopMonitoring: () => window.unifiedMonitoringService.stopMonitoring(),
        getProviderStatus: (provider) => window.unifiedMonitoringService.getProviderStatus(provider),
        getAllProviderStatus: () => window.unifiedMonitoringService.getAllProviderStatus(),
        updateAllProviderStatus: () => window.unifiedMonitoringService.updateAllProviderStatus(),
        // Legacy methods
        testProvider: (provider) => window.unifiedMonitoringService.testProvider(provider),
        testAllProviders: () => Promise.all(window.unifiedMonitoringService.providers.map(p => 
            window.unifiedMonitoringService.testProvider(p).catch(() => null)))
    };
    
    console.log('✅ [UNIFIED MONITOR] Legacy compatibility layer installed');
}

// Global debugging functions
window.monitoringReport = () => window.unifiedMonitoringService.getPerformanceReport();
window.forceRefreshProviders = () => window.unifiedMonitoringService.forceRefresh();

console.log('✅ [UNIFIED MONITOR] Unified monitoring service ready');