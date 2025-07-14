// ===== UNIFIED AI STATUS MANAGER =====
// Centralized status management to prevent flickering and conflicts
// Replaces multiple competing status monitoring systems

import { showNotification } from './uiHelpers.js';
import { API_BASE } from '../config.js';

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
        
        // Debouncing to prevent rapid status changes
        this.debounceDelay = 2000; // 2 seconds
        this.statusLock = false;
        
        // Initialize status for all providers
        this.initializeProviderStatus();
        
        // Bind methods
        this.updateStatus = this.updateStatus.bind(this);
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
                status: 'unknown',
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
     * Start unified monitoring with debouncing
     */
    async startMonitoring(updateIntervalMs = 120000) { // 2 minutes default
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
     * Update all provider status with debouncing
     */
    async updateAllProviderStatus() {
        if (this.statusLock) {
            console.log('🔒 [UNIFIED STATUS] Update locked, skipping');
            return;
        }
        
        this.statusLock = true;
        console.log('🔄 [UNIFIED STATUS] Updating all provider status...');
        
        try {
            // Fetch unified metrics from backend
            const response = await fetch(`${API_BASE}/ai/metrics?t=${Date.now()}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log('📊 [UNIFIED STATUS] Backend response:', data);
                
                if (data.success && data.metrics) {
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
                } else {
                    console.error('❌ [UNIFIED STATUS] Invalid response structure:', data);
                }
            } else {
                console.error('❌ [UNIFIED STATUS] API request failed:', response.status);
            }
        } catch (error) {
            console.error('❌ [UNIFIED STATUS] Update failed:', error);
        } finally {
            // Release lock after debounce delay
            setTimeout(() => {
                this.statusLock = false;
                console.log('🔓 [UNIFIED STATUS] Status lock released');
            }, this.debounceDelay);
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
            
            // Update AI Monitoring performance table
            const statusBadge = document.getElementById(`statusBadge-${provider}`);
            if (statusBadge) {
                const statusClass = status.connected ? 'healthy' : 'error';
                const statusTextMap = {
                    healthy: 'ปกติ',
                    error: 'ข้อผิดพลาด'
                };
                
                statusBadge.className = `provider-status-badge ${statusClass}`;
                statusBadge.textContent = statusTextMap[statusClass] || 'ไม่ทราบ';
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