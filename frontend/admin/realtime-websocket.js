/**
 * Real-Time WebSocket Client
 * Provides poe.com-style real-time updates for AI status and notifications
 * Ultra-fast response times with persistent connections
 */

class RealTimeWebSocket {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // Start with 1 second
        this.listeners = new Map();
        this.messageQueue = [];
        
        // Real-time performance settings (poe.com style)
        this.heartbeatInterval = null;
        this.heartbeatTimeout = 30000; // 30 seconds
        this.connectionTimeout = 5000; // 5 seconds to connect
        
        console.log('⚡ [WEBSOCKET] Real-time client initialized');
    }
    
    /**
     * Connect to WebSocket server with auto-reconnect
     */
    async connect() {
        // Don't attempt connection if max reconnects reached
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('⚠️ [WEBSOCKET] Max reconnect attempts reached, not attempting connection');
            return;
        }
        
        try {
            const wsUrl = this.getWebSocketUrl();
            console.log(`⚡ [WEBSOCKET] Connecting to ${wsUrl}...`);
            
            this.ws = new WebSocket(wsUrl);
            
            // Connection timeout
            const connectionTimer = setTimeout(() => {
                if (this.ws.readyState === WebSocket.CONNECTING) {
                    console.warn('⚠️ [WEBSOCKET] Connection timeout, retrying...');
                    this.ws.close();
                    this.handleReconnect();
                }
            }, this.connectionTimeout);
            
            this.ws.onopen = () => {
                clearTimeout(connectionTimer);
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.reconnectDelay = 1000;
                
                console.log('✅ [WEBSOCKET] Connected! Real-time updates active');
                this.startHeartbeat();
                this.processMessageQueue();
                this.emit('connected');
            };
            
            this.ws.onmessage = (event) => {
                this.handleMessage(event.data);
            };
            
            this.ws.onclose = (event) => {
                clearTimeout(connectionTimer);
                this.isConnected = false;
                this.stopHeartbeat();
                
                console.log(`⚠️ [WEBSOCKET] Connection closed (${event.code})`);
                
                if (event.code !== 1000) { // Not a normal closure
                    this.handleReconnect();
                }
                
                this.emit('disconnected', event);
            };
            
            this.ws.onerror = (error) => {
                console.error('❌ [WEBSOCKET] Connection error:', error);
                this.emit('error', error);
            };
            
        } catch (error) {
            console.error('❌ [WEBSOCKET] Failed to create connection:', error);
            this.handleReconnect();
        }
    }
    
    /**
     * Get WebSocket URL based on current environment
     */
    getWebSocketUrl() {
        const isHttps = window.location.protocol === 'https:';
        const wsProtocol = isHttps ? 'wss:' : 'ws:';
        
        // Try to get from config first
        if (window.rbckConfig?.wsBase) {
            return window.rbckConfig.wsBase;
        }
        
        // Fallback to API base conversion
        const apiBase = window.rbckConfig?.apiBase || '/api';
        if (apiBase.startsWith('http')) {
            return apiBase.replace(/^https?:/, wsProtocol).replace('/api', '/ws');
        }
        
        // Local development fallback
        const host = window.location.host;
        return `${wsProtocol}//${host}/ws`;
    }
    
    /**
     * Handle incoming WebSocket messages
     */
    handleMessage(data) {
        try {
            const message = JSON.parse(data);
            
            // Handle heartbeat/pong
            if (message.type === 'pong') {
                return;
            }
            
            console.log('⚡ [WEBSOCKET] Real-time message:', message.type);
            
            // Emit to specific listeners
            this.emit(message.type, message.data);
            
            // Handle common message types
            switch (message.type) {
                case 'ai_status_update':
                    this.handleAIStatusUpdate(message.data);
                    break;
                case 'provider_status_change':
                    this.handleProviderStatusChange(message.data);
                    break;
                case 'system_notification':
                    this.handleSystemNotification(message.data);
                    break;
                default:
                    console.log(`🔄 [WEBSOCKET] Unknown message type: ${message.type}`);
            }
            
        } catch (error) {
            console.error('❌ [WEBSOCKET] Failed to parse message:', error, data);
        }
    }
    
    /**
     * Handle AI status updates in real-time
     */
    handleAIStatusUpdate(data) {
        if (window.unifiedStatusManager) {
            // Update without API call - instant like poe.com
            Object.keys(data.providers || {}).forEach(provider => {
                const providerData = data.providers[provider];
                window.unifiedStatusManager.updateProviderStatus(provider, {
                    status: providerData.status,
                    connected: providerData.isActive && providerData.configured,
                    configured: providerData.configured,
                    responseTime: providerData.averageResponseTime,
                    successRate: providerData.successRate,
                    isActive: providerData.isActive
                });
            });
            
            window.unifiedStatusManager.notifyStatusUpdate();
            console.log('⚡ [WEBSOCKET] AI status updated instantly');
        }
    }
    
    /**
     * Handle individual provider status changes
     */
    handleProviderStatusChange(data) {
        if (window.unifiedStatusManager && data.provider) {
            window.unifiedStatusManager.updateProviderStatus(data.provider, data.status);
            window.unifiedStatusManager.notifyStatusUpdate();
            
            // Show instant notification
            if (window.showNotification) {
                const statusText = data.status.connected ? 'Connected' : 'Disconnected';
                const statusIcon = data.status.connected ? '✅' : '❌';
                window.showNotification(
                    `${statusIcon} ${data.provider}: ${statusText}`, 
                    data.status.connected ? 'success' : 'warning'
                );
            }
            
            console.log(`⚡ [WEBSOCKET] ${data.provider} status changed instantly`);
        }
    }
    
    /**
     * Handle system notifications
     */
    handleSystemNotification(data) {
        if (window.showNotification) {
            window.showNotification(data.message, data.type || 'info');
        }
        console.log('⚡ [WEBSOCKET] System notification:', data.message);
    }
    
    /**
     * Send message to server
     */
    send(type, data = {}) {
        const message = {
            type,
            data,
            timestamp: Date.now()
        };
        
        if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
            console.log(`⚡ [WEBSOCKET] Sent: ${type}`);
        } else {
            // Queue message for when connection is restored
            this.messageQueue.push(message);
            console.log(`📤 [WEBSOCKET] Queued: ${type} (not connected)`);
        }
    }
    
    /**
     * Process queued messages after reconnection
     */
    processMessageQueue() {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            this.ws.send(JSON.stringify(message));
            console.log(`📤 [WEBSOCKET] Sent queued: ${message.type}`);
        }
    }
    
    /**
     * Start heartbeat to keep connection alive
     */
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected) {
                this.send('ping');
            }
        }, this.heartbeatTimeout);
    }
    
    /**
     * Stop heartbeat
     */
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
    
    /**
     * Handle reconnection with exponential backoff
     */
    handleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ [WEBSOCKET] Max reconnection attempts reached - stopping reconnect attempts');
            this.emit('max_reconnect_attempts');
            this.isConnecting = false;
            return;
        }
        
        this.reconnectAttempts++;
        console.log(`🔄 [WEBSOCKET] Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        setTimeout(() => {
            this.connect();
        }, this.reconnectDelay);
        
        // Exponential backoff (like poe.com)
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
    }
    
    /**
     * Add event listener
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }
    
    /**
     * Remove event listener
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
    
    /**
     * Emit event to listeners
     */
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ [WEBSOCKET] Listener error for ${event}:`, error);
                }
            });
        }
    }
    
    /**
     * Close connection
     */
    disconnect() {
        if (this.ws) {
            this.ws.close(1000, 'Client disconnect');
        }
        this.stopHeartbeat();
        this.isConnected = false;
        console.log('✅ [WEBSOCKET] Disconnected');
    }
    
    /**
     * Get connection status
     */
    getStatus() {
        return {
            connected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            queuedMessages: this.messageQueue.length,
            readyState: this.ws ? this.ws.readyState : null
        };
    }
}

// Create singleton instance
const realTimeWS = new RealTimeWebSocket();

// Global access
window.realTimeWS = realTimeWS;

// Export for module use
export default realTimeWS;

console.log('⚡ [WEBSOCKET] Real-time WebSocket client loaded');