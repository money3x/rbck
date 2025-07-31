// ===== UNIFIED AI STATUS MANAGER =====
// Centralized status management to prevent flickering and conflicts
// Replaces multiple competing status monitoring systems

import { showNotification } from './uiHelpers.js';
import { API_BASE } from '../config.js';
import cacheManager from './cache-manager.js';

/**
 * Unified AI Status Manager - Single source of truth for all provider statuses
 * Prevents status flickering by coordinating all updates through one system
 */
export class UnifiedAIStatusManager {
    constructor() {
        this.providers = ['gemini', 'openai', 'claude', 'deepseek', 'chinda'];
        this.providerStatus = {};
        this.isMonitoring = false;
        this.updateInterval = null;
        this.pendingUpdates = new Set();
        this.lastUpdate = null;
        
        // Professional status management without artificial delays
        this.debounceDelay = 100; // Minimal delay for UI smoothness only
        this.statusLock = false;
        
        // Initialize status for all providers
        this.initializeProviderStatus();
        
        // Bind methods
        this.updateAllProviderStatus = this.updateAllProviderStatus.bind(this);
        this.startMonitoring = this.startMonitoring.bind(this);
        this.stopMonitoring = this.stopMonitoring.bind(this);
    }
    
    /**
     * Initialize status for all providers
     */
    initializeProviderStatus() {
        this.providers.forEach(provider => {
            this.providerStatus[provider] = {
                id: provider,
                name: this.getProviderDisplayName(provider),
                status: 'checking', // Professional loading state
                connected: false,
                configured: false,
                responseTime: null,
                successRate: 0,
                lastUpdate: null,
                isActive: false,
                errorCount: 0
            };
        });
    }
    
    /**
     * Get standardized provider display names
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
     * Start professional monitoring with intelligent intervals
     */
    async startMonitoring(updateIntervalMs = 5000) { // 5 seconds default - real-time performance like poe.com
        if (this.isMonitoring) {
            console.log('🔄 [UNIFIED STATUS] Already monitoring');
            return;
        }
        
        console.log('🚀 [UNIFIED STATUS] Starting unified status monitoring...');
        this.isMonitoring = true;
        
        // Initial status check
        await this.updateAllProviderStatus();
        
        // Set up periodic monitoring
        this.updateInterval = setInterval(async () => {
            if (!this.statusLock && this.pendingUpdates.size === 0) {
                await this.updateAllProviderStatus();
            } else {
                console.log('⏸️ [UNIFIED STATUS] Update skipped (locked or pending)');
            }
        }, updateIntervalMs);
        
        console.log('✅ [UNIFIED STATUS] Monitoring started');
        showNotification('🔄 AI Status monitoring activated', 'success');
    }
    
    /**
     * Stop monitoring
     */
    stopMonitoring() {
        console.log('🛑 [UNIFIED STATUS] Stopping monitoring...');
        this.isMonitoring = false;
        
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        this.pendingUpdates.clear();
        this.statusLock = false;
        
        console.log('✅ [UNIFIED STATUS] Monitoring stopped');
    }
    
    /**
     * Update all provider status with debouncing and instant feedback
     */
    async updateAllProviderStatus() {
        if (this.statusLock) {
            console.log('🔒 [UNIFIED STATUS] Update locked, skipping');
            return;
        }
        
        this.statusLock = true;
        
        // 🚀 INSTANT FEEDBACK: Show loading immediately
        this.showLoadingState();
        console.log('⚡ [REAL-TIME] Updating all provider status...');
        
        try {
            // 🚀 ULTRA-FAST CACHE: Try cache first (poe.com style)
            const cacheKey = `ai_metrics_${Date.now() - (Date.now() % 5000)}`; // 5-second cache buckets
            
            let data = cacheManager.get(cacheKey);
            
            if (data) {
                console.log('⚡ [CACHE] Using cached AI metrics (instant like poe.com)');
                this.processMetricsData(data);
                return;
            }
            
            // Cache miss - fetch from API
            const response = await fetch(`${API_BASE}/ai/metrics?t=${Date.now()}`);
            
            if (response.ok) {
                data = await response.json();
                console.log('📊 [UNIFIED STATUS] Backend response:', data);
                
                // 🚀 CACHE: Store for ultra-fast future access
                cacheManager.set(cacheKey, data, { ttl: 5000 }); // 5-second cache
                console.log('💾 [CACHE] AI metrics cached for instant access');
                
                this.processMetricsData(data);
            } else {
                console.error('❌ [UNIFIED STATUS] API request failed:', response.status);
            }
        } catch (error) {
            console.error('❌ [UNIFIED STATUS] Update failed:', error);
        } finally {
            // 🚀 INSTANT FEEDBACK: Hide loading immediately  
            this.hideLoadingState();
            
            // Release lock after minimal delay (reduced from 100ms to 10ms)
            setTimeout(() => {
                this.statusLock = false;
                console.log('🔓 [REAL-TIME] Status lock released (10ms delay)');
            }, 10); // Ultra-fast lock release like poe.com
        }
    }
    
    /**
     * Process metrics data (from cache or API)
     */
    processMetricsData(data) {
        console.log('🔍 [DEBUG] Processing metrics data:', {
            hasData: !!data,
            hasSuccess: !!data?.success,
            successValue: data?.success,
            hasMetrics: !!data?.metrics,
            metricsKeys: data?.metrics ? Object.keys(data.metrics) : null
        });
        
        if (data && data.success === true && data.metrics && typeof data.metrics === 'object') {
            console.log('✅ [UNIFIED STATUS] Valid response structure, processing...');
            
            // Update all providers from unified response
            this.providers.forEach(provider => {
                const backendData = data.metrics[provider];
                if (backendData) {
                    this.updateProviderStatus(provider, {
                        status: backendData.status,
                        connected: backendData.isActive && backendData.configured,
                        configured: backendData.configured,
                        responseTime: backendData.averageResponseTime,
                        successRate: backendData.successRate,
                        isActive: backendData.isActive,
                        totalRequests: backendData.totalRequests,
                        lastActive: backendData.lastActive
                    });
                } else {
                    console.warn(`⚠️ [UNIFIED STATUS] No data for ${provider}`);
                }
            });
            
            // Notify all registered listeners
            this.notifyStatusUpdate();
            this.lastUpdate = new Date();
            
            console.log('✅ [UNIFIED STATUS] Metrics processing completed');
        } else {
            console.error('❌ [UNIFIED STATUS] Invalid response structure:', {
                data: data,
                success: data?.success,
                successType: typeof data?.success,
                metrics: data?.metrics,
                metricsType: typeof data?.metrics
            });
        }
    }
    
    /**
     * Update individual provider status
     */
    updateProviderStatus(provider, statusData) {
        if (!this.providerStatus[provider]) {
            console.warn(`⚠️ [UNIFIED STATUS] Unknown provider: ${provider}`);
            return;
        }
        
        const currentStatus = this.providerStatus[provider];
        const wasConnected = currentStatus.connected;
        
        // Update status data
        Object.assign(currentStatus, {
            ...statusData,
            lastUpdate: new Date().toISOString()
        });
        
        // Log significant status changes
        if (wasConnected !== currentStatus.connected) {
            console.log(`🔄 [UNIFIED STATUS] ${provider}: ${wasConnected ? 'Connected' : 'Disconnected'} → ${currentStatus.connected ? 'Connected' : 'Disconnected'}`);
        }
        
        console.log(`📊 [UNIFIED STATUS] ${provider} updated:`, {
            status: currentStatus.status,
            connected: currentStatus.connected,
            configured: currentStatus.configured
        });
    }
    
    /**
     * Get current status for a provider
     */
    getProviderStatus(provider) {
        return this.providerStatus[provider] || null;
    }
    
    /**
     * Get status for all providers
     */
    getAllProviderStatus() {
        return { ...this.providerStatus };
    }
    
    /**
     * Test individual provider (manual trigger)
     */
    async testProvider(provider) {
        if (this.pendingUpdates.has(provider)) {
            console.log(`⏸️ [UNIFIED STATUS] ${provider} test already pending`);
            return;
        }
        
        this.pendingUpdates.add(provider);
        console.log(`🧪 [UNIFIED STATUS] Testing ${provider}...`);
        
        try {
            showNotification(`🧪 Testing ${this.getProviderDisplayName(provider)}...`, 'info');
            
            // Import auth functions
            const { authenticatedFetch } = await import('./auth.js');
            
            // Use authenticated fetch for testing
            const response = await authenticatedFetch(`${API_BASE}/ai/test/${provider}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: 'Status test from unified manager' })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log(`✅ [UNIFIED STATUS] ${provider} test successful:`, result);
                
                // Update status based on test result
                this.updateProviderStatus(provider, {
                    status: 'ready',
                    connected: result.success,
                    configured: true,
                    responseTime: result.responseTime,
                    successRate: result.success ? 100 : 0,
                    isActive: true,
                    lastActive: new Date().toISOString()
                });
                
                showNotification(`✅ ${this.getProviderDisplayName(provider)} test successful`, 'success');
            } else {
                console.error(`❌ [UNIFIED STATUS] ${provider} test failed:`, response.status);
                this.providerStatus[provider].errorCount++;
                showNotification(`❌ ${this.getProviderDisplayName(provider)} test failed`, 'error');
            }
        } catch (error) {
            console.error(`❌ [UNIFIED STATUS] ${provider} test error:`, error);
            this.providerStatus[provider].errorCount++;
            showNotification(`❌ ${this.getProviderDisplayName(provider)} test error`, 'error');
        } finally {
            this.pendingUpdates.delete(provider);
            // Trigger status update notification
            this.notifyStatusUpdate();
        }
    }
    
    /**
     * Test all providers in parallel (poe.com style ultra-fast)
     */
    async testAllProviders() {
        console.log('⚡ [PARALLEL] Testing all providers simultaneously...');
        
        const startTime = Date.now();
        showNotification('🚀 Testing all providers in parallel...', 'info');
        
        // Create parallel test operations
        const testPromises = this.providers.map(async (provider) => {
            try {
                const result = await this.testProviderParallel(provider);
                return { provider, success: true, result };
            } catch (error) {
                console.error(`❌ [PARALLEL] ${provider} failed:`, error);
                return { provider, success: false, error };
            }
        });
        
        // Execute all tests in parallel
        const results = await Promise.allSettled(testPromises);
        
        // Process results
        let successCount = 0;
        let failCount = 0;
        
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                const testResult = result.value;
                if (testResult.success) {
                    successCount++;
                } else {
                    failCount++;
                }
            } else {
                failCount++;
                console.error(`❌ [PARALLEL] Test ${index} rejected:`, result.reason);
            }
        });
        
        const totalTime = Date.now() - startTime;
        
        // Show results
        showNotification(
            `⚡ Parallel testing complete: ${successCount} success, ${failCount} failed (${totalTime}ms)`,
            successCount > failCount ? 'success' : 'warning'
        );
        
        console.log(`⚡ [PARALLEL] All tests completed in ${totalTime}ms (poe.com speed!)`);
        
        return {
            totalTime,
            successCount,
            failCount,
            results: results.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason })
        };
    }
    
    /**
     * Test provider optimized for parallel execution
     */
    async testProviderParallel(provider) {
        const cacheKey = `test_${provider}_${Date.now() - (Date.now() % 10000)}`; // 10-second cache
        
        // Check cache first
        const cached = cacheManager.get(cacheKey);
        if (cached) {
            console.log(`⚡ [CACHE] Using cached test result for ${provider}`);
            this.updateProviderStatus(provider, cached.status);
            return cached;
        }
        
        // Import auth functions
        const { authenticatedFetch } = await import('./auth.js');
        
        const startTime = Date.now();
        
        // Use timeout for faster failure detection
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        try {
            const response = await authenticatedFetch(`${API_BASE}/ai/test/${provider}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: 'Parallel test' }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const result = await response.json();
                const responseTime = Date.now() - startTime;
                
                const statusData = {
                    status: 'ready',
                    connected: result.success,
                    configured: true,
                    responseTime: responseTime,
                    successRate: result.success ? 100 : 0,
                    isActive: true,
                    lastActive: new Date().toISOString()
                };
                
                // Update status
                this.updateProviderStatus(provider, statusData);
                
                // Cache result for parallel efficiency
                const cacheData = { success: true, result, status: statusData, responseTime };
                cacheManager.set(cacheKey, cacheData, { ttl: 10000 });
                
                console.log(`⚡ [PARALLEL] ${provider}: ${responseTime}ms`);
                return cacheData;
                
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            const responseTime = Date.now() - startTime;
            
            // Update status for failed test
            this.updateProviderStatus(provider, {
                status: 'error',
                connected: false,
                configured: true,
                responseTime: responseTime,
                successRate: 0,
                isActive: false,
                lastActive: new Date().toISOString()
            });
            
            throw error;
        }
    }
    
    /**
     * Parallel fetch multiple API endpoints simultaneously
     */
    async parallelFetch(endpoints) {
        console.log(`⚡ [PARALLEL] Fetching ${endpoints.length} endpoints...`);
        
        const startTime = Date.now();
        
        const fetchPromises = endpoints.map(async (endpoint) => {
            try {
                const cacheKey = `fetch_${this.hashString(endpoint.url)}`;
                
                // Try cache first
                const cached = cacheManager.get(cacheKey);
                if (cached) {
                    return { ...endpoint, success: true, data: cached, cached: true };
                }
                
                // Fetch with timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout
                
                const response = await fetch(endpoint.url, {
                    ...endpoint.options,
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    const data = await response.json();
                    
                    // Cache successful response
                    cacheManager.set(cacheKey, data, { ttl: endpoint.cacheTTL || 30000 });
                    
                    return { ...endpoint, success: true, data, cached: false };
                } else {
                    throw new Error(`HTTP ${response.status}`);
                }
                
            } catch (error) {
                return { ...endpoint, success: false, error: error.message };
            }
        });
        
        const results = await Promise.allSettled(fetchPromises);
        const totalTime = Date.now() - startTime;
        
        console.log(`⚡ [PARALLEL] Fetched ${endpoints.length} endpoints in ${totalTime}ms`);
        
        return results.map(result => 
            result.status === 'fulfilled' ? result.value : { success: false, error: result.reason }
        );
    }
    
    /**
     * Simple hash function for cache keys
     */
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }
    
    /**
     * Register status update listeners
     */
    onStatusUpdate(callback) {
        if (!this.statusListeners) {
            this.statusListeners = [];
        }
        this.statusListeners.push(callback);
    }
    
    /**
     * Notify all registered listeners of status updates
     */
    notifyStatusUpdate() {
        if (this.statusListeners) {
            this.statusListeners.forEach(callback => {
                try {
                    callback(this.getAllProviderStatus());
                } catch (error) {
                    console.error('❌ [UNIFIED STATUS] Listener error:', error);
                }
            });
        }
        
        // Update UI elements directly
        this.updateUIElements();
    }
    
    /**
     * Update UI elements with current status
     */
    updateUIElements() {
        this.providers.forEach(provider => {
            const status = this.providerStatus[provider];
            
            // Update AI Swarm Council table
            const swarmStatusElement = document.getElementById(`status-${provider}`);
            if (swarmStatusElement) {
                const statusDot = swarmStatusElement.querySelector('.status-dot');
                const statusText = swarmStatusElement.querySelector('.status-text');
                
                if (statusDot && statusText) {
                    statusDot.className = `status-dot ${status.connected ? 'connected' : 'disconnected'}`;
                    statusText.className = `status-text ${status.connected ? 'connected' : 'disconnected'}`;
                    statusText.textContent = status.connected ? 'เชื่อมต่อแล้ว' : 'ไม่ได้เชื่อมต่อ';
                }
            }
            
            // Update AI Monitoring performance table with professional status
            const statusBadge = document.getElementById(`statusBadge-${provider}`);
            if (statusBadge) {
                let statusClass, statusText;
                
                if (status.status === 'checking') {
                    statusClass = 'warning';
                    statusText = 'กำลังตรวจสอบ';
                } else if (status.connected && status.configured) {
                    statusClass = 'healthy';
                    statusText = 'ปกติ';
                } else if (status.configured && !status.connected) {
                    statusClass = 'error';
                    statusText = 'ข้อผิดพลาด';
                } else {
                    statusClass = 'warning';
                    statusText = 'ไม่ได้กำหนดค่า';
                }
                
                statusBadge.className = `provider-status-badge ${statusClass}`;
                statusBadge.textContent = statusText;
            }
            
            // Update dashboard cards
            const dashboardCard = document.querySelector(`[data-provider="${provider}"]`);
            if (dashboardCard) {
                const statusElement = dashboardCard.querySelector('.provider-status');
                if (statusElement) {
                    statusElement.className = `provider-status ${status.connected ? 'connected' : 'disconnected'}`;
                    statusElement.textContent = status.connected ? 'Connected' : 'Disconnected';
                }
            }
        });
        
        console.log('🎨 [UNIFIED STATUS] UI elements updated');
    }
    
    /**
     * Get monitoring summary
     */
    getSummary() {
        const connectedCount = this.providers.filter(p => this.providerStatus[p].connected).length;
        const configuredCount = this.providers.filter(p => this.providerStatus[p].configured).length;
        
        return {
            isMonitoring: this.isMonitoring,
            totalProviders: this.providers.length,
            connectedProviders: connectedCount,
            configuredProviders: configuredCount,
            lastUpdate: this.lastUpdate,
            statusLocked: this.statusLock,
            pendingUpdates: this.pendingUpdates.size
        };
    }
    
    /**
     * Show loading state for instant feedback (poe.com style)
     */
    showLoadingState() {
        this.providers.forEach(provider => {
            // Update AI Monitoring badges with loading animation
            const statusBadge = document.getElementById(`statusBadge-${provider}`);
            if (statusBadge) {
                statusBadge.className = 'provider-status-badge loading';
                statusBadge.innerHTML = '<span class="loading-spinner">⏳</span> Checking...';
            }
            
            // Update AI Swarm Council with loading dots
            const swarmStatusElement = document.getElementById(`status-${provider}`);
            if (swarmStatusElement) {
                const statusDot = swarmStatusElement.querySelector('.status-dot');
                const statusText = swarmStatusElement.querySelector('.status-text');
                
                if (statusDot && statusText) {
                    statusDot.className = 'status-dot loading';
                    statusText.className = 'status-text loading';
                    statusText.textContent = 'กำลังตรวจสอบ...';
                }
            }
        });
        
        console.log('⚡ [REAL-TIME] Loading states activated');
    }
    
    /**
     * Hide loading state after update completes
     */
    hideLoadingState() {
        // Loading states will be replaced by actual status in updateUIElements()
        console.log('⚡ [REAL-TIME] Loading states deactivated');
    }
    
    /**
     * Reset all status (useful for debugging)
     */
    resetAllStatus() {
        console.log('🔄 [UNIFIED STATUS] Resetting all provider status...');
        this.initializeProviderStatus();
        this.notifyStatusUpdate();
    }
}

// Create singleton instance
const unifiedStatusManager = new UnifiedAIStatusManager();

// Global access
window.unifiedStatusManager = unifiedStatusManager;

// Export for module use
export default unifiedStatusManager;

console.log('✅ [UNIFIED STATUS] Unified AI Status Manager loaded');