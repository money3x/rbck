// ===== AI SWARM COUNCIL SYSTEM - REFACTORED =====
// Modular, secure, and performant AI collaboration system
// Addresses: Security, Performance, Architecture, Maintainability

import { showNotification } from './uiHelpers.js';
import { API_BASE } from '../config.js';

// ===== CONSTANTS =====
const CONSTANTS = {
    TIMEOUTS: {
        PROVIDER_CHECK: 3000,
        API_REQUEST: 5000,
        WEBSOCKET_RETRY: 30000
    },
    INTERVALS: {
        PRIMARY_MONITORING: 10000,  // Reduced from 5000ms for better performance
        CACHE_REFRESH: 30000,       // Increased for efficiency
        VISUAL_UPDATE: 5000         // Reduced frequency
    },
    CACHE: {
        PROVIDER_STATUS_TTL: 30000, // Increased from 10000ms
        MAX_CONVERSATION_HISTORY: 100
    },
    PERFORMANCE: {
        SCORE_THRESHOLD_EXCELLENT: 80,
        SCORE_THRESHOLD_GOOD: 60
    }
};

// ===== UTILITY FUNCTIONS =====
class SecurityUtils {
    static sanitizeHTML(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }

    static createSafeElement(tag, content, className = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (content) element.textContent = content;
        return element;
    }

    static validateAPIResponse(response) {
        if (!response || typeof response !== 'object') {
            throw new Error('Invalid API response format');
        }
        return response;
    }
}

class PerformanceUtils {
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// ===== CORE CLASSES =====

/**
 * Manages individual AI provider status and communication
 */
class AIProviderManager {
    constructor() {
        this.providers = this.initializeProviders();
        this.statusCache = new Map();
    }

    initializeProviders() {
        return {
            gemini: { 
                name: 'Gemini 2.0 Flash', 
                status: false, 
                role: 'primary_creator',
                expertise: ['content_creation', 'seo_optimization', 'multilingual'],
                priority: 1,
                icon: '⚡'
            },
            openai: { 
                name: 'OpenAI GPT', 
                status: false, 
                role: 'quality_reviewer',
                expertise: ['quality_control', 'fact_checking', 'coherence'],
                priority: 2,
                icon: '🧠'
            },
            claude: { 
                name: 'Claude AI', 
                status: false, 
                role: 'content_optimizer',
                expertise: ['structure_improvement', 'readability', 'engagement'],
                priority: 3,
                icon: '🎭'
            },
            deepseek: { 
                name: 'DeepSeek AI', 
                status: false, 
                role: 'technical_validator',
                expertise: ['technical_accuracy', 'code_review', 'performance'],
                priority: 4,
                icon: '🔍'
            },
            chinda: { 
                name: 'ChindaX AI', 
                status: false, 
                role: 'multilingual_advisor',
                expertise: ['translation', 'cultural_adaptation', 'localization', 'thai_language'],
                priority: 5,
                model: 'chinda-qwen3-32b',
                icon: '🧠'
            }
        };
    }

    async checkProviderStatus(providerKey) {
        try {
            // Check cache first
            const cacheKey = `status_${providerKey}`;
            if (this.statusCache.has(cacheKey)) {
                const cached = this.statusCache.get(cacheKey);
                if (Date.now() - cached.timestamp < CONSTANTS.CACHE.PROVIDER_STATUS_TTL) {
                    return cached.status;
                }
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONSTANTS.TIMEOUTS.PROVIDER_CHECK);

            let isConnected = false;

            try {
                if (providerKey === 'gemini') {
                    isConnected = await this.checkGeminiStatus(controller.signal);
                } else {
                    isConnected = await this.checkExternalProviderStatus(providerKey, controller.signal);
                }

                // Cache result
                this.statusCache.set(cacheKey, {
                    status: isConnected,
                    timestamp: Date.now()
                });

                return isConnected;
            } finally {
                clearTimeout(timeoutId);
            }
        } catch (error) {
            console.error(`Provider ${providerKey} check failed:`, error.message);
            return false;
        }
    }

    async checkGeminiStatus(signal) {
        try {
            const response = await fetch(`${API_BASE}/ai/status`, { 
                method: 'GET',
                signal,
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                const data = SecurityUtils.validateAPIResponse(await response.json());
                return data.success && data.data?.providers?.gemini?.isActive;
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    async checkExternalProviderStatus(providerKey, signal) {
        try {
            const response = await fetch(`${API_BASE}/ai/status/${providerKey}`, { 
                method: 'GET',
                signal,
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                const data = SecurityUtils.validateAPIResponse(await response.json());
                return data.connected || (data.success && data.data?.connected);
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    async updateAllProviderStatus() {
        const checkPromises = Object.keys(this.providers).map(async (key) => {
            try {
                const isConnected = await this.checkProviderStatus(key);
                return { key, connected: isConnected, success: true };
            } catch (error) {
                return { key, connected: false, success: false, error };
            }
        });
        
        const results = await Promise.allSettled(checkPromises);
        const connectedProviders = [];
        
        results.forEach((result, index) => {
            const key = Object.keys(this.providers)[index];
            
            if (result.status === 'fulfilled' && result.value.connected) {
                this.providers[key].status = true;
                connectedProviders.push(key);
            } else {
                this.providers[key].status = false;
            }
        });

        return connectedProviders;
    }

    getConnectedProviders() {
        return Object.entries(this.providers)
            .filter(([key, provider]) => provider.status)
            .map(([key, provider]) => ({ key, ...provider }));
    }

    getProvider(key) {
        return this.providers[key] || null;
    }

    clearCache() {
        this.statusCache.clear();
    }
}

/**
 * Manages conversation logging and display
 */
class ConversationLogger {
    constructor() {
        this.conversationHistory = [];
        this.maxHistory = CONSTANTS.CACHE.MAX_CONVERSATION_HISTORY;
    }

    addMessage(sender, message) {
        // Validate inputs
        if (!sender || !message) {
            console.warn('Invalid message parameters');
            return;
        }

        // Sanitize message content
        const sanitizedMessage = SecurityUtils.sanitizeHTML(message);
        
        // Add to history with size limit
        this.conversationHistory.push({
            sender,
            message: sanitizedMessage,
            timestamp: new Date()
        });

        // Maintain max history limit
        if (this.conversationHistory.length > this.maxHistory) {
            this.conversationHistory = this.conversationHistory.slice(-this.maxHistory);
        }

        // Update UI safely
        this.updateConversationDisplay(sender, sanitizedMessage);
        
        console.log(`[AI LOG] ${sender}: ${message}`);
    }

    updateConversationDisplay(sender, message) {
        const conversationFeed = document.getElementById('aiConversationLogs');
        if (!conversationFeed) {
            console.warn('Conversation feed element not found');
            return;
        }

        // Remove empty state if it exists
        const emptyState = conversationFeed.querySelector('.logs-empty');
        if (emptyState) {
            emptyState.remove();
        }

        // Create message element safely
        const messageDiv = SecurityUtils.createSafeElement('div', '', `conversation-message ${sender}`);
        
        const timestamp = new Date().toLocaleTimeString('th-TH');
        const senderIcon = this.getSenderIcon(sender);
        const senderName = this.getSenderDisplayName(sender);
        
        // Create header
        const headerDiv = SecurityUtils.createSafeElement('div', '', 'message-header');
        
        const senderDiv = SecurityUtils.createSafeElement('div', '', 'message-sender');
        senderDiv.appendChild(SecurityUtils.createSafeElement('span', senderIcon, 'sender-icon'));
        senderDiv.appendChild(SecurityUtils.createSafeElement('span', senderName));
        
        const timestampDiv = SecurityUtils.createSafeElement('div', timestamp, 'message-timestamp');
        
        headerDiv.appendChild(senderDiv);
        headerDiv.appendChild(timestampDiv);
        
        // Create content
        const contentDiv = SecurityUtils.createSafeElement('div', message, 'message-content');
        
        messageDiv.appendChild(headerDiv);
        messageDiv.appendChild(contentDiv);
        conversationFeed.appendChild(messageDiv);
        
        // Auto-scroll
        conversationFeed.scrollTop = conversationFeed.scrollHeight;
    }

    getSenderIcon(sender) {
        const icons = {
            system: '🤖',
            gemini: '⚡',
            openai: '🧠',
            claude: '🎭',
            deepseek: '🔍',
            chinda: '🧠'
        };
        return icons[sender] || '🤖';
    }

    getSenderDisplayName(sender) {
        const names = {
            system: 'ระบบ',
            gemini: 'Gemini 2.0 Flash',
            openai: 'OpenAI GPT',
            claude: 'Claude AI',
            deepseek: 'DeepSeek AI',
            chinda: 'ChindaX AI'
        };
        return names[sender] || sender;
    }

    clearConversation() {
        this.conversationHistory = [];
        const conversationFeed = document.getElementById('aiConversationLogs');
        if (conversationFeed) {
            conversationFeed.innerHTML = `
                <div class="logs-empty">
                    <div class="logs-empty-icon">💬</div>
                    <div class="logs-empty-text">รอการสนทนาของ AI</div>
                    <div class="logs-empty-subtext">เริ่มงานใดๆ เพื่อดูการทำงานร่วมกันของ AI</div>
                </div>
            `;
        }
    }

    exportConversation() {
        const data = {
            timestamp: new Date().toISOString(),
            conversation: this.conversationHistory,
            messageCount: this.conversationHistory.length
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-swarm-conversation-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        showNotification('💾 Conversation exported', 'success');
    }
}

/**
 * Handles UI rendering and updates efficiently
 */
class SwarmUIController {
    constructor(providerManager, conversationLogger) {
        this.providerManager = providerManager;
        this.conversationLogger = conversationLogger;
        this.cachedElements = new Map();
        
        // Debounced update methods for performance
        this.debouncedRenderProviders = PerformanceUtils.debounce(
            this.renderProviders.bind(this), 100
        );
    }

    getCachedElement(id) {
        if (!this.cachedElements.has(id)) {
            const element = document.getElementById(id);
            if (element) {
                this.cachedElements.set(id, element);
            }
        }
        return this.cachedElements.get(id);
    }

    renderProviders() {
        const providersTableBody = this.getCachedElement('aiProvidersTableBody');
        
        if (!providersTableBody) {
            console.error('aiProvidersTableBody element not found');
            return;
        }

        // Use DocumentFragment for efficient DOM manipulation
        const fragment = document.createDocumentFragment();
        
        Object.entries(this.providerManager.providers).forEach(([key, provider]) => {
            const providerRow = this.createProviderRow(key, provider);
            fragment.appendChild(providerRow);
        });
        
        // Single DOM update
        providersTableBody.innerHTML = '';
        providersTableBody.appendChild(fragment);
    }

    createProviderRow(key, provider) {
        const row = document.createElement('tr');
        row.className = `provider-row ${key} ${provider.status ? 'connected' : 'disconnected'}`;
        row.id = `provider-${key}`;
        
        // Create cells safely
        const modelCell = this.createModelCell(key, provider);
        const statusCell = this.createStatusCell(key, provider);
        const roleCell = this.createRoleCell(provider);
        const expertiseCell = this.createExpertiseCell(provider);
        
        row.appendChild(modelCell);
        row.appendChild(statusCell);
        row.appendChild(roleCell);
        row.appendChild(expertiseCell);
        
        return row;
    }

    createModelCell(key, provider) {
        const cell = document.createElement('td');
        cell.setAttribute('data-label', 'โมเดล AI');
        
        const providerInfo = SecurityUtils.createSafeElement('div', '', 'provider-info');
        const iconDiv = SecurityUtils.createSafeElement('div', provider.icon, 'provider-icon');
        const detailsDiv = SecurityUtils.createSafeElement('div', '', 'provider-details');
        
        const nameH4 = SecurityUtils.createSafeElement('h4', provider.name);
        const modelP = SecurityUtils.createSafeElement('p', this.getProviderType(key), 'provider-model');
        
        detailsDiv.appendChild(nameH4);
        detailsDiv.appendChild(modelP);
        providerInfo.appendChild(iconDiv);
        providerInfo.appendChild(detailsDiv);
        cell.appendChild(providerInfo);
        
        return cell;
    }

    createStatusCell(key, provider) {
        const cell = document.createElement('td');
        cell.setAttribute('data-label', 'สถานะ');
        cell.id = `status-${key}`;
        
        const statusDiv = SecurityUtils.createSafeElement('div', '', 'provider-status');
        const statusDot = SecurityUtils.createSafeElement('div', '', 
            `status-dot ${provider.status ? 'connected' : 'disconnected'}`);
        
        const detailsDiv = SecurityUtils.createSafeElement('div', '', 'status-details');
        const statusText = SecurityUtils.createSafeElement('span', 
            provider.status ? 'เชื่อมต่อแล้ว' : 'ไม่ได้เชื่อมต่อ',
            `status-text ${provider.status ? 'connected' : 'disconnected'}`);
        
        detailsDiv.appendChild(statusText);
        statusDiv.appendChild(statusDot);
        statusDiv.appendChild(detailsDiv);
        cell.appendChild(statusDiv);
        
        return cell;
    }

    createRoleCell(provider) {
        const cell = document.createElement('td');
        cell.setAttribute('data-label', 'หน้าที่ในการทำงาน');
        
        const roleDiv = SecurityUtils.createSafeElement('div', 
            this.getProviderRoleInThai(provider.role), 'provider-role');
        cell.appendChild(roleDiv);
        
        return cell;
    }

    createExpertiseCell(provider) {
        const cell = document.createElement('td');
        cell.setAttribute('data-label', 'ความเชี่ยวชาญ');
        
        const expertiseDiv = SecurityUtils.createSafeElement('div', '', 'provider-expertise');
        
        provider.expertise.forEach(exp => {
            const tag = SecurityUtils.createSafeElement('span', 
                this.getExpertiseInThai(exp), 'expertise-tag');
            expertiseDiv.appendChild(tag);
        });
        
        cell.appendChild(expertiseDiv);
        return cell;
    }

    getProviderType(providerKey) {
        const types = {
            gemini: 'Google AI',
            openai: 'OpenAI',
            claude: 'Anthropic',
            deepseek: 'DeepSeek AI',
            chinda: 'ChindaX'
        };
        return types[providerKey] || 'AI Provider';
    }

    getProviderRoleInThai(role) {
        const roles = {
            'primary_creator': 'นักสร้างสรรค์หลัก',
            'quality_reviewer': 'ผู้ตรวจสอบคุณภาพ',
            'content_optimizer': 'ผู้ปรับปรุงเนื้อหา',
            'technical_validator': 'ผู้ตรวจสอบเทคนิค',
            'multilingual_advisor': 'ที่ปรึกษาภาษา'
        };
        return roles[role] || role;
    }

    getExpertiseInThai(expertise) {
        const expertiseMap = {
            'content_creation': 'สร้างเนื้อหา',
            'seo_optimization': 'ปรับ SEO',
            'multilingual': 'หลายภาษา',
            'quality_control': 'ควบคุมคุณภาพ',
            'fact_checking': 'ตรวจสอบข้อมูล',
            'coherence': 'ความสอดคล้อง',
            'structure_improvement': 'ปรับโครงสร้าง',
            'readability': 'อ่านง่าย',
            'engagement': 'ดึงดูดใจ',
            'technical_accuracy': 'ความถูกต้องเทคนิค',
            'code_review': 'ตรวจโค้ด',
            'performance': 'ประสิทธิภาพ',
            'translation': 'แปลภาษา',
            'cultural_adaptation': 'ปรับวัฒนธรรม',
            'localization': 'ปรับท้องถิ่น'
        };
        return expertiseMap[expertise] || expertise;
    }

    updateStatusSummary() {
        const connectedCount = this.providerManager.getConnectedProviders().length;
        
        // Update active providers count
        const activeCountElement = this.getCachedElement('activeProvidersCount');
        if (activeCountElement) {
            activeCountElement.textContent = connectedCount;
        }

        // Update status card
        const activeCard = this.getCachedElement('activeProvidersCard');
        if (activeCard) {
            activeCard.className = 'status-card';
            if (connectedCount >= 3) {
                activeCard.classList.add('active');
            } else if (connectedCount >= 1) {
                activeCard.classList.add('warning');
            } else {
                activeCard.classList.add('error');
            }
        }
    }

    clearElementCache() {
        this.cachedElements.clear();
    }
}

/**
 * Manages monitoring intervals and performance optimization
 */
class MonitoringManager {
    constructor(providerManager, uiController) {
        this.providerManager = providerManager;
        this.uiController = uiController;
        this.intervals = new Map();
        this.isMonitoring = false;
    }

    startMonitoring() {
        if (this.isMonitoring) {
            console.warn('Monitoring already active');
            return;
        }

        console.log('Starting optimized monitoring system...');
        this.isMonitoring = true;

        // Primary status monitoring
        this.intervals.set('primary', setInterval(async () => {
            if (!this.isMonitoring) return;
            
            try {
                await this.providerManager.updateAllProviderStatus();
                this.uiController.debouncedRenderProviders();
                this.uiController.updateStatusSummary();
            } catch (error) {
                console.error('Primary monitoring error:', error);
            }
        }, CONSTANTS.INTERVALS.PRIMARY_MONITORING));

        // Cache refresh
        this.intervals.set('cache', setInterval(() => {
            if (!this.isMonitoring) return;
            this.providerManager.clearCache();
        }, CONSTANTS.INTERVALS.CACHE_REFRESH));

        // Visual updates
        this.intervals.set('visual', setInterval(() => {
            if (!this.isMonitoring) return;
            this.uiController.updateStatusSummary();
        }, CONSTANTS.INTERVALS.VISUAL_UPDATE));

        console.log('Monitoring system activated with optimized intervals');
    }

    stopMonitoring() {
        console.log('Stopping monitoring system...');
        this.isMonitoring = false;

        this.intervals.forEach((intervalId, key) => {
            clearInterval(intervalId);
            console.log(`Stopped ${key} monitoring`);
        });
        
        this.intervals.clear();
        console.log('All monitoring intervals cleared');
    }

    isActive() {
        return this.isMonitoring;
    }
}

/**
 * Main AI Swarm Council class - refactored for modularity and performance
 */
export class AISwarmCouncilRefactored {
    constructor() {
        this.providerManager = new AIProviderManager();
        this.conversationLogger = new ConversationLogger();
        this.uiController = new SwarmUIController(this.providerManager, this.conversationLogger);
        this.monitoringManager = new MonitoringManager(this.providerManager, this.uiController);
        
        this.isProcessing = false;
        this.currentTask = null;
        this.collaborationRules = {
            minProviders: 2,
            consensusThreshold: 0.7,
            maxIterations: 3,
            timeoutSeconds: 30
        };
    }

    async initialize() {
        try {
            console.log('🤖 [AI SWARM] Initializing refactored AI Swarm Council...');
            
            // Initialize provider status
            await this.providerManager.updateAllProviderStatus();
            
            // Setup UI
            this.setupUI();
            
            // Start monitoring
            this.monitoringManager.startMonitoring();
            
            // Bind global functions
            this.bindGlobalFunctions();
            
            console.log('✅ [AI SWARM] Refactored council initialized successfully');
            showNotification('🤖 AI Swarm Council (Refactored) activated', 'success');
            
        } catch (error) {
            console.error('❌ [AI SWARM] Initialization failed:', error);
            showNotification('❌ AI Swarm initialization failed', 'error');
            throw error;
        }
    }

    setupUI() {
        this.uiController.renderProviders();
        this.uiController.updateStatusSummary();
        console.log('✅ [AI SWARM] UI components setup completed');
    }

    async refreshProviderStatus() {
        this.conversationLogger.addMessage('system', '🔄 Refreshing AI provider status...');
        await this.providerManager.updateAllProviderStatus();
        this.uiController.debouncedRenderProviders();
        this.uiController.updateStatusSummary();
        this.conversationLogger.addMessage('system', '✅ Provider status updated');
        showNotification('🔄 AI provider status refreshed', 'info');
    }

    getStatusReport() {
        const connectedProviders = this.providerManager.getConnectedProviders();
        
        return {
            isActive: connectedProviders.length >= this.collaborationRules.minProviders,
            connectedCount: connectedProviders.length,
            totalCount: Object.keys(this.providerManager.providers).length,
            connectedProviders: connectedProviders.map(p => ({
                key: p.key,
                name: p.name,
                role: p.role
            })),
            isProcessing: this.isProcessing,
            currentTask: this.currentTask,
            conversationLength: this.conversationLogger.conversationHistory.length,
            monitoringActive: this.monitoringManager.isActive()
        };
    }

    bindGlobalFunctions() {
        // Make instance globally available
        window.aiSwarmCouncilRefactored = this;
        
        // Bind utility functions
        window.refreshAISwarmStatus = () => this.refreshProviderStatus();
        window.clearAIConversation = () => this.conversationLogger.clearConversation();
        window.exportAIConversation = () => this.conversationLogger.exportConversation();
        window.getAISwarmReport = () => this.getStatusReport();
        
        console.log('🔗 [GLOBAL] Refactored AI Swarm functions bound');
    }

    // Cleanup method for proper resource management
    destroy() {
        console.log('🧹 [AI SWARM] Cleaning up resources...');
        
        this.monitoringManager.stopMonitoring();
        this.providerManager.clearCache();
        this.uiController.clearElementCache();
        this.conversationLogger.clearConversation();
        
        // Clear global references
        if (window.aiSwarmCouncilRefactored === this) {
            delete window.aiSwarmCouncilRefactored;
        }
        
        console.log('✅ [AI SWARM] Cleanup completed');
    }
}

// Make class globally available
window.AISwarmCouncilRefactored = AISwarmCouncilRefactored;

console.log('✅ [AI SWARM] Refactored AISwarmCouncil loaded and available globally');