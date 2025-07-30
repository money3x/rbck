/**
 * WebSocket Server for Real-Time Updates
 * Provides poe.com-style real-time communication for AI status and notifications
 * Ultra-fast response times with persistent connections
 */

const WebSocket = require('ws');
const { EventEmitter } = require('events');

class RealTimeWebSocketServer extends EventEmitter {
    constructor(server) {
        super();
        
        this.wss = new WebSocket.Server({ 
            server,
            path: '/ws',
            clientTracking: true,
            maxPayload: 16 * 1024 // 16KB max payload
        });
        
        this.clients = new Map(); // Track clients with metadata
        this.rooms = new Map(); // Room-based messaging
        this.messageQueue = new Map(); // Queue messages for offline clients
        
        this.setupWebSocketServer();
        console.log('⚡ [WEBSOCKET] Real-time server initialized');
    }
    
    /**
     * Setup WebSocket server with all event handlers
     */
    setupWebSocketServer() {
        this.wss.on('connection', (ws, req) => {
            const clientId = this.generateClientId();
            const clientInfo = {
                id: clientId,
                ip: req.socket.remoteAddress,
                userAgent: req.headers['user-agent'],
                connectedAt: new Date(),
                isAlive: true,
                rooms: new Set(),
                lastActivity: new Date()
            };
            
            this.clients.set(ws, clientInfo);
            console.log(`⚡ [WEBSOCKET] Client ${clientId} connected (${this.clients.size} total)`);
            
            // Send welcome message
            this.sendToClient(ws, 'connected', {
                clientId,
                serverTime: new Date().toISOString(),
                features: ['ai_status', 'notifications', 'real_time_updates']
            });
            
            // Setup client event handlers
            this.setupClientHandlers(ws, clientInfo);
            
            // Auto-join to general room
            this.joinRoom(ws, 'general');
            
            this.emit('client_connected', { ws, clientInfo });
        });
        
        // Setup heartbeat to detect broken connections
        this.setupHeartbeat();
        
        console.log('✅ [WEBSOCKET] Server setup complete');
    }
    
    /**
     * Setup event handlers for individual client
     */
    setupClientHandlers(ws, clientInfo) {
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                this.handleClientMessage(ws, clientInfo, message);
            } catch (error) {
                console.error(`❌ [WEBSOCKET] Invalid message from ${clientInfo.id}:`, error);
                this.sendToClient(ws, 'error', { message: 'Invalid JSON format' });
            }
        });
        
        ws.on('pong', () => {
            clientInfo.isAlive = true;
            clientInfo.lastActivity = new Date();
        });
        
        ws.on('close', (code, reason) => {
            console.log(`⚠️ [WEBSOCKET] Client ${clientInfo.id} disconnected (${code}): ${reason}`);
            
            // Remove from all rooms
            clientInfo.rooms.forEach(room => {
                this.leaveRoom(ws, room);
            });
            
            this.clients.delete(ws);
            this.emit('client_disconnected', { clientInfo, code, reason });
        });
        
        ws.on('error', (error) => {
            console.error(`❌ [WEBSOCKET] Client ${clientInfo.id} error:`, error);
            this.emit('client_error', { clientInfo, error });
        });
    }
    
    /**
     * Handle incoming messages from clients
     */
    handleClientMessage(ws, clientInfo, message) {
        clientInfo.lastActivity = new Date();
        
        console.log(`📨 [WEBSOCKET] Message from ${clientInfo.id}: ${message.type}`);
        
        switch (message.type) {
            case 'ping':
                this.sendToClient(ws, 'pong', { timestamp: Date.now() });
                break;
                
            case 'subscribe_ai_status':
                this.joinRoom(ws, 'ai_status');
                this.sendToClient(ws, 'subscribed', { room: 'ai_status' });
                break;
                
            case 'unsubscribe_ai_status':
                this.leaveRoom(ws, 'ai_status');
                this.sendToClient(ws, 'unsubscribed', { room: 'ai_status' });
                break;
                
            case 'get_ai_status':
                this.handleAIStatusRequest(ws);
                break;
                
            case 'test_provider':
                this.handleProviderTest(ws, message.data);
                break;
                
            default:
                console.log(`🔄 [WEBSOCKET] Unknown message type: ${message.type}`);
                this.sendToClient(ws, 'unknown_type', { type: message.type });
        }
        
        this.emit('message', { ws, clientInfo, message });
    }
    
    /**
     * Handle AI status request
     */
    async handleAIStatusRequest(ws) {
        try {
            // Get current AI status from your existing system
            const AIProviderService = require('../services/AIProviderService');
            const status = await AIProviderService.getAllProviderStatus();
            
            this.sendToClient(ws, 'ai_status_update', {
                providers: status,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ [WEBSOCKET] Failed to get AI status:', error);
            this.sendToClient(ws, 'error', { 
                message: 'Failed to retrieve AI status',
                error: error.message 
            });
        }
    }
    
    /**
     * Handle provider test request
     */
    async handleProviderTest(ws, data) {
        if (!data.provider) {
            this.sendToClient(ws, 'error', { message: 'Provider name required' });
            return;
        }
        
        try {
            // Send immediate acknowledgment
            this.sendToClient(ws, 'test_started', { 
                provider: data.provider,
                timestamp: new Date().toISOString()
            });
            
            // Perform actual test (implement your existing test logic)
            const testResult = await this.testProvider(data.provider);
            
            // Send result
            this.sendToClient(ws, 'test_completed', {
                provider: data.provider,
                result: testResult,
                timestamp: new Date().toISOString()
            });
            
            // Broadcast to ai_status room
            this.broadcastToRoom('ai_status', 'provider_status_change', {
                provider: data.provider,
                status: testResult,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error(`❌ [WEBSOCKET] Provider test failed:`, error);
            this.sendToClient(ws, 'test_failed', {
                provider: data.provider,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
    
    /**
     * Test a provider (placeholder - implement your actual test logic)
     */
    async testProvider(providerName) {
        // This would call your existing provider test logic
        // For now, return a mock result
        return {
            connected: true,
            responseTime: Math.floor(Math.random() * 1000) + 200,
            successRate: 0.95,
            status: 'ready'
        };
    }
    
    /**
     * Send message to specific client
     */
    sendToClient(ws, type, data = {}) {
        if (ws.readyState === WebSocket.OPEN) {
            const message = {
                type,
                data,
                timestamp: new Date().toISOString()
            };
            
            ws.send(JSON.stringify(message));
            return true;
        }
        return false;
    }
    
    /**
     * Broadcast message to all connected clients
     */
    broadcast(type, data = {}) {
        let sentCount = 0;
        
        this.clients.forEach((clientInfo, ws) => {
            if (this.sendToClient(ws, type, data)) {
                sentCount++;
            }
        });
        
        console.log(`📡 [WEBSOCKET] Broadcast ${type} to ${sentCount} clients`);
        return sentCount;
    }
    
    /**
     * Broadcast message to clients in specific room
     */
    broadcastToRoom(roomName, type, data = {}) {
        let sentCount = 0;
        
        if (this.rooms.has(roomName)) {
            this.rooms.get(roomName).forEach(ws => {
                if (this.sendToClient(ws, type, data)) {
                    sentCount++;
                }
            });
        }
        
        console.log(`📡 [WEBSOCKET] Broadcast ${type} to room '${roomName}' (${sentCount} clients)`);
        return sentCount;
    }
    
    /**
     * Join client to room
     */
    joinRoom(ws, roomName) {
        if (!this.rooms.has(roomName)) {
            this.rooms.set(roomName, new Set());
        }
        
        this.rooms.get(roomName).add(ws);
        
        const clientInfo = this.clients.get(ws);
        if (clientInfo) {
            clientInfo.rooms.add(roomName);
            console.log(`➕ [WEBSOCKET] Client ${clientInfo.id} joined room '${roomName}'`);
        }
    }
    
    /**
     * Remove client from room
     */
    leaveRoom(ws, roomName) {
        if (this.rooms.has(roomName)) {
            this.rooms.get(roomName).delete(ws);
            
            // Remove empty rooms
            if (this.rooms.get(roomName).size === 0) {
                this.rooms.delete(roomName);
            }
        }
        
        const clientInfo = this.clients.get(ws);
        if (clientInfo) {
            clientInfo.rooms.delete(roomName);
            console.log(`➖ [WEBSOCKET] Client ${clientInfo.id} left room '${roomName}'`);
        }
    }
    
    /**
     * Setup heartbeat to detect broken connections
     */
    setupHeartbeat() {
        setInterval(() => {
            this.clients.forEach((clientInfo, ws) => {
                if (!clientInfo.isAlive) {
                    console.log(`💔 [WEBSOCKET] Terminating dead connection: ${clientInfo.id}`);
                    ws.terminate();
                    return;
                }
                
                clientInfo.isAlive = false;
                ws.ping();
            });
        }, 30000); // Check every 30 seconds
    }
    
    /**
     * Generate unique client ID
     */
    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Get server statistics
     */
    getStats() {
        const rooms = {};
        this.rooms.forEach((clients, roomName) => {
            rooms[roomName] = clients.size;
        });
        
        return {
            totalClients: this.clients.size,
            rooms,
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Broadcast AI status update to all subscribed clients
     */
    broadcastAIStatusUpdate(statusData) {
        return this.broadcastToRoom('ai_status', 'ai_status_update', {
            providers: statusData,
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * Broadcast system notification
     */
    broadcastNotification(message, type = 'info') {
        return this.broadcast('system_notification', {
            message,
            type,
            timestamp: new Date().toISOString()
        });
    }
}

module.exports = RealTimeWebSocketServer;