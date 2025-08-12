// ===== REAL-TIME CONVERSATION LOGS SYSTEM =====
// Comprehensive solution for AI conversation logging and real-time monitoring
// Addresses missing conversation logs and real-time monitoring functionality

import { showNotification } from './uiHelpers.js';
import { API_BASE } from '../config.js';

/**
 * Real-time Conversation Logs Manager
 * Provides live monitoring of AI conversations and interactions
 */
export class RealTimeConversationLogs {
    constructor() {
        this.conversations = [];
        this.isMonitoring = false;
        this.pollInterval = null;
        this.pollFrequency = 30000; // 30 seconds - professional balance of real-time vs efficiency
        this.maxDisplayLogs = 50;
        this.listeners = [];
        
        // UI Elements
        this.logContainer = null;
        this.logCounter = null;
        this.statusIndicator = null;
        
        // Filter options
        this.filters = {
            provider: 'all',
            type: 'all',
            timeRange: '1h'
        };
        
        this.initializeUI();
    }
    
    /**
     * Initialize UI elements and event handlers
     */
    initializeUI() {
        // Find or create log container
        this.logContainer = document.getElementById('aiConversationLogs');
        if (!this.logContainer) {
            console.warn('⚠️ [CONVERSATION LOGS] aiConversationLogs container not found');
            return;
        }
        
        // Add real-time controls
        this.createRealtimeControls();
        
        // Initialize display
        this.updateDisplay();
        
        console.log('🎨 [CONVERSATION LOGS] UI initialized');
    }
    
    /**
     * Create real-time monitoring controls
     */
    createRealtimeControls() {
        const controlsHTML = `
            <div class="conversation-logs-controls" style="padding: 15px; border-bottom: 1px solid #e1e5e9; background: #f8f9fa;">
                <div class="row">
                    <div class="col-md-6">
                        <div class="d-flex align-items-center gap-3">
                            <button id="toggleLogMonitoring" class="btn btn-sm btn-success">
                                <i class="fas fa-play"></i> Start Real-time
                            </button>
                            <button id="refreshLogs" class="btn btn-sm btn-info">
                                <i class="fas fa-refresh"></i> Refresh
                            </button>
                            <button id="clearLogs" class="btn btn-sm btn-warning">
                                <i class="fas fa-trash"></i> Clear
                            </button>
                            <div id="logsStatusIndicator" class="d-flex align-items-center">
                                <span class="badge badge-secondary">Stopped</span>
                                <span id="logsCounter" class="text-muted ms-2">0 logs</span>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="d-flex gap-2">
                            <select id="providerFilter" class="form-select form-select-sm">
                                <option value="all">All Providers</option>
                                <option value="gemini">Gemini</option>
                                <option value="openai">OpenAI</option>
                                <option value="claude">Claude</option>
                                <option value="deepseek">DeepSeek</option>
                                <option value="chinda">ChindaX</option>
                            </select>
                            <select id="typeFilter" class="form-select form-select-sm">
                                <option value="all">All Types</option>
                                <option value="chat">Chat</option>
                                <option value="test">Test</option>
                                <option value="browser_test">Browser Test</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            <div id="conversationLogsDisplay" class="conversation-logs-display" style="max-height: 500px; overflow-y: auto;">
                <div class="text-center text-muted p-4">
                    <i class="fas fa-comments fa-2x mb-3"></i>
                    <p>No conversation logs found. Click "Start Real-time" to begin monitoring.</p>
                </div>
            </div>
        `;
        
        this.logContainer.innerHTML = controlsHTML;
        
        // Cache references
        this.logDisplay = document.getElementById('conversationLogsDisplay');
        this.statusIndicator = document.getElementById('logsStatusIndicator');
        this.logCounter = document.getElementById('logsCounter');
        
        // Bind event handlers
        this.bindEventHandlers();
    }
    
    /**
     * Bind event handlers for controls
     */
    bindEventHandlers() {
        // Start/Stop monitoring
        const toggleBtn = document.getElementById('toggleLogMonitoring');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                if (this.isMonitoring) {
                    this.stopMonitoring();
                } else {
                    this.startMonitoring();
                }
            });
        }
        
        // Manual refresh
        const refreshBtn = document.getElementById('refreshLogs');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.fetchConversationLogs());
        }
        
        // Clear logs
        const clearBtn = document.getElementById('clearLogs');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearLogs());
        }
        
        // Filter changes
        const providerFilter = document.getElementById('providerFilter');
        const typeFilter = document.getElementById('typeFilter');
        
        if (providerFilter) {
            providerFilter.addEventListener('change', (e) => {
                this.filters.provider = e.target.value;
                this.updateDisplay();
            });
        }
        
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.filters.type = e.target.value;
                this.updateDisplay();
            });
        }
    }
    
    /**
     * Start real-time monitoring
     */
    async startMonitoring() {
        if (!(window.__ADMIN_ENABLE_AI_MONITORING__ === true)) {
            console.warn('ℹ️ [CONVERSATION LOGS] Monitoring disabled by flag');
            // Do not poll /ai/conversations
            return;
        }
        
        if (this.isMonitoring) {
            console.log('🔄 [CONVERSATION LOGS] Already monitoring');
            return;
        }
        
        console.log('🚀 [CONVERSATION LOGS] Starting real-time monitoring...');
        this.isMonitoring = true;
        
        // Initial fetch
        await this.fetchConversationLogs();
        
        // Set up polling
        this.pollInterval = setInterval(() => {
            this.fetchConversationLogs();
        }, this.pollFrequency);
        
        // Update UI
        this.updateMonitoringStatus();
        
        showNotification('🔄 Real-time conversation logs started', 'success');
        console.log('✅ [CONVERSATION LOGS] Real-time monitoring started');
    }
    
    /**
     * Stop real-time monitoring
     */
    stopMonitoring() {
        console.log('🛑 [CONVERSATION LOGS] Stopping real-time monitoring...');
        this.isMonitoring = false;
        
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
        
        // Update UI
        this.updateMonitoringStatus();
        
        showNotification('🛑 Real-time conversation logs stopped', 'info');
        console.log('✅ [CONVERSATION LOGS] Real-time monitoring stopped');
    }
    
    /**
     * Fetch conversation logs from backend
     */
    async fetchConversationLogs() {
        try {
            console.log('📡 [CONVERSATION LOGS] Fetching logs from backend...');
            
            const response = await fetch(`${API_BASE}/ai/conversations?limit=${this.maxDisplayLogs}&t=${Date.now()}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log('📊 [CONVERSATION LOGS] Backend response:', data);
                
                if (data.success && data.conversations) {
                    const newLogs = data.conversations;
                    
                    // Check for new conversations
                    const hasNewLogs = this.updateConversations(newLogs);
                    
                    if (hasNewLogs && this.isMonitoring) {
                        showNotification(`📝 ${newLogs.length} conversation logs loaded`, 'success');
                    }
                    
                    // Update display
                    this.updateDisplay();
                    
                    // Notify listeners
                    this.notifyListeners();
                } else {
                    console.warn('⚠️ [CONVERSATION LOGS] No conversations in response');
                }
            } else {
                console.error('❌ [CONVERSATION LOGS] API request failed:', response.status);
                if (this.isMonitoring) {
                    showNotification('❌ Failed to fetch conversation logs', 'error');
                }
            }
        } catch (error) {
            console.error('❌ [CONVERSATION LOGS] Fetch error:', error);
            if (this.isMonitoring) {
                showNotification('❌ Error fetching conversation logs', 'error');
            }
        }
    }
    
    /**
     * Update conversations array with new data
     */
    updateConversations(newLogs) {
        const previousCount = this.conversations.length;
        
        // Replace conversations with new data (keeping most recent)
        this.conversations = [...newLogs];
        
        // Sort by timestamp (most recent first)
        this.conversations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Limit to max display count
        if (this.conversations.length > this.maxDisplayLogs) {
            this.conversations = this.conversations.slice(0, this.maxDisplayLogs);
        }
        
        return this.conversations.length !== previousCount;
    }
    
    /**
     * Update monitoring status UI
     */
    updateMonitoringStatus() {
        const toggleBtn = document.getElementById('toggleLogMonitoring');
        
        if (toggleBtn) {
            if (this.isMonitoring) {
                toggleBtn.innerHTML = '<i class="fas fa-pause"></i> Stop Real-time';
                toggleBtn.className = 'btn btn-sm btn-danger';
            } else {
                toggleBtn.innerHTML = '<i class="fas fa-play"></i> Start Real-time';
                toggleBtn.className = 'btn btn-sm btn-success';
            }
        }
        
        if (this.statusIndicator) {
            const statusBadge = this.statusIndicator.querySelector('.badge');
            if (statusBadge) {
                if (this.isMonitoring) {
                    statusBadge.className = 'badge badge-success';
                    statusBadge.textContent = 'Live';
                } else {
                    statusBadge.className = 'badge badge-secondary';
                    statusBadge.textContent = 'Stopped';
                }
            }
        }
        
        if (this.logCounter) {
            this.logCounter.textContent = `${this.conversations.length} logs`;
        }
    }
    
    /**
     * Update conversation logs display
     */
    updateDisplay() {
        if (!this.logDisplay) return;
        
        // Apply filters
        const filteredLogs = this.applyFilters(this.conversations);
        
        if (filteredLogs.length === 0) {
            this.logDisplay.innerHTML = `
                <div class="text-center text-muted p-4">
                    <i class="fas fa-comments fa-2x mb-3"></i>
                    <p>No conversation logs match current filters.</p>
                    <small>Try adjusting filters or start real-time monitoring.</small>
                </div>
            `;
            return;
        }
        
        // Generate log entries HTML
        const logsHTML = filteredLogs.map(log => this.createLogEntryHTML(log)).join('');
        
        this.logDisplay.innerHTML = `
            <div class="conversation-logs-list">
                ${logsHTML}
            </div>
        `;
        
        // Update counter
        this.updateMonitoringStatus();
        
        console.log(`🎨 [CONVERSATION LOGS] Display updated with ${filteredLogs.length} logs`);
    }
    
    /**
     * Apply current filters to conversation logs
     */
    applyFilters(logs) {
        return logs.filter(log => {
            // Provider filter
            if (this.filters.provider !== 'all' && log.provider !== this.filters.provider) {
                return false;
            }
            
            // Type filter
            if (this.filters.type !== 'all' && log.type !== this.filters.type) {
                return false;
            }
            
            // Time range filter (simplified)
            if (this.filters.timeRange !== 'all') {
                const logTime = new Date(log.timestamp);
                const now = new Date();
                const hoursDiff = (now - logTime) / (1000 * 60 * 60);
                
                if (this.filters.timeRange === '1h' && hoursDiff > 1) return false;
                if (this.filters.timeRange === '6h' && hoursDiff > 6) return false;
                if (this.filters.timeRange === '24h' && hoursDiff > 24) return false;
            }
            
            return true;
        });
    }
    
    /**
     * Create HTML for a single log entry
     */
    createLogEntryHTML(log) {
        const timestamp = new Date(log.timestamp).toLocaleString('th-TH');
        const providerIcon = this.getProviderIcon(log.provider);
        const typeColor = this.getTypeColor(log.type);
        const qualityPercent = Math.round((log.quality || 0) * 100);
        
        return `
            <div class="conversation-log-entry" style="border: 1px solid #e1e5e9; border-radius: 8px; padding: 15px; margin-bottom: 10px; background: white;">
                <div class="log-header d-flex justify-content-between align-items-center mb-2">
                    <div class="d-flex align-items-center gap-2">
                        <span class="provider-icon">${providerIcon}</span>
                        <strong>${log.providerName || log.provider}</strong>
                        <span class="badge ${typeColor}">${log.type}</span>
                        <small class="text-muted">${timestamp}</small>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge badge-info">${log.responseTime}ms</span>
                        <span class="badge badge-success">${qualityPercent}%</span>
                        ${log.success ? '<i class="fas fa-check-circle text-success"></i>' : '<i class="fas fa-times-circle text-danger"></i>'}
                    </div>
                </div>
                <div class="log-content">
                    <div class="log-prompt mb-2">
                        <strong>📤 Prompt:</strong>
                        <div class="text-muted small" style="max-height: 60px; overflow-y: auto;">
                            ${this.escapeHtml(log.prompt || 'N/A')}
                        </div>
                    </div>
                    <div class="log-response">
                        <strong>📥 Response:</strong>
                        <div class="text-dark small" style="max-height: 80px; overflow-y: auto;">
                            ${this.escapeHtml(log.response || 'N/A')}
                        </div>
                    </div>
                </div>
                <div class="log-metrics mt-2 pt-2 border-top d-flex justify-content-between text-muted small">
                    <span>Tokens: ${log.tokensUsed || 0}</span>
                    <span>Cost: $${(log.cost || 0).toFixed(4)}</span>
                    <span>ID: ${log.id}</span>
                </div>
            </div>
        `;
    }
    
    /**
     * Get provider icon
     */
    getProviderIcon(provider) {
        const icons = {
            gemini: '⚡',
            openai: '🧠',
            claude: '🎭',
            deepseek: '🔍',
            chinda: '🚀'
        };
        return icons[provider] || '🤖';
    }
    
    /**
     * Get type color for badges
     */
    getTypeColor(type) {
        const colors = {
            chat: 'badge-primary',
            test: 'badge-info',
            browser_test: 'badge-warning'
        };
        return colors[type] || 'badge-secondary';
    }
    
    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Clear all logs
     */
    clearLogs() {
        if (confirm('Are you sure you want to clear all conversation logs?')) {
            this.conversations = [];
            this.updateDisplay();
            showNotification('🗑️ Conversation logs cleared', 'info');
            console.log('🗑️ [CONVERSATION LOGS] Logs cleared');
        }
    }
    
    /**
     * Register listener for log updates
     */
    onLogsUpdate(callback) {
        this.listeners.push(callback);
    }
    
    /**
     * Notify all listeners of log updates
     */
    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.conversations);
            } catch (error) {
                console.error('❌ [CONVERSATION LOGS] Listener error:', error);
            }
        });
    }
    
    /**
     * Get current logs for external access
     */
    getLogs() {
        return [...this.conversations];
    }
    
    /**
     * Get summary statistics
     */
    getSummary() {
        const totalLogs = this.conversations.length;
        const providers = [...new Set(this.conversations.map(log => log.provider))];
        const avgResponseTime = totalLogs > 0 
            ? this.conversations.reduce((sum, log) => sum + (log.responseTime || 0), 0) / totalLogs 
            : 0;
        
        return {
            totalLogs,
            uniqueProviders: providers.length,
            avgResponseTime: Math.round(avgResponseTime),
            isMonitoring: this.isMonitoring,
            lastUpdate: this.conversations[0]?.timestamp || null
        };
    }
}

// Create singleton instance
const conversationLogs = new RealTimeConversationLogs();

// Global access
window.conversationLogs = conversationLogs;

// Professional initialization - only when user explicitly requests
// Note: No auto-start to prevent unnecessary server load
console.log('✅ [CONVERSATION LOGS] Ready for manual activation');

// Export for module use
export default conversationLogs;

console.log('✅ [CONVERSATION LOGS] Real-time Conversation Logs system loaded');