// ===== AI SWARM COUNCIL SYSTEM - ENTERPRISE GRADE =====
// Type-safe, secure, and high-performance AI collaboration system
// Features: Advanced caching, error boundaries, performance monitoring, security

import { showNotification } from './uiHelpers.js';
import { API_BASE } from '../config.js';

// @ts-check

/**
 * @typedef {'qwen3'|'openai'|'deepseek'|'gemini'|'chinda'} ProviderKey
 * @typedef {Object} ProviderConfig
 * @property {string} name
 * @property {boolean} status
 * @property {string} role
 * @property {string[]} expertise
 * @property {number} priority
 * @property {string} icon
 */

// ===== CONSTANTS =====
const CONSTANTS = {
    TIMEOUTS: {
        PROVIDER_CHECK: 3000,
        API_REQUEST: 5000,
        WEBSOCKET_RETRY: 30000
    },
    INTERVALS: {
        PRIMARY_MONITORING: 10000,
        CACHE_REFRESH: 30000,
        VISUAL_UPDATE: 5000
    },
    CACHE: {
        PROVIDER_STATUS_TTL: 30000,
        MAX_CONVERSATION_HISTORY: 100
    },
    PERFORMANCE: {
        SCORE_THRESHOLD_EXCELLENT: 80,
        SCORE_THRESHOLD_GOOD: 60
    }
};

class SecurityUtils {
    /**
     * @param {string} html
     * @returns {string}
     */
    static sanitizeHTML(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }

    /**
     * @param {string} tag
     * @param {string} content
     * @param {string} className
     * @returns {HTMLElement}
     */
    static createSafeElement(tag, content = '', className = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (content) element.textContent = content;
        return element;
    }

    /**
     * @param {any} response
     * @returns {any}
     */
    static validateAPIResponse(response) {
        if (!response || typeof response !== 'object') {
            throw new Error('Invalid API response format');
        }
        return response;
    }
}

class PerformanceUtils {
    /**
     * @param {Function} func
     * @param {number} wait
     * @returns {Function}
     */
    static debounce(func, wait) {
        /** @type {number|undefined} */
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

    /**
     * @param {Function} func
     * @param {number} limit
     * @returns {Function}
     */
    static throttle(func, limit) {
        /** @type {boolean|undefined} */
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
                model: 'chinda-qwen3-4b',
                icon: '🧠'
            }
        };
    }

    async checkProviderStatus(providerKey) {
        try {
            // 🚀 PRIMARY: Try unified status manager first (same as AI Monitoring)
            if (window.unifiedStatusManager && window.unifiedStatusManager.isMonitoring) {
                const unifiedStatus = window.unifiedStatusManager.getProviderStatus(providerKey);
                if (unifiedStatus && unifiedStatus.lastUpdate) {
                    const isConnected = unifiedStatus.connected && unifiedStatus.configured;
                    console.log(`✅ [UNIFIED SYNC] ${providerKey}: ${isConnected ? 'Connected' : 'Disconnected'} from unified manager`);
                    return isConnected;
                }
            }

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
                // 🔧 FIXED: Use unified metrics endpoint like AI Monitoring
                isConnected = await this.checkProviderViaMetrics(providerKey, controller.signal);

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

    /**
     * 🔧 FIXED: Check provider status via real backend metrics (same as unified manager)
     */
    async checkProviderViaMetrics(providerKey, signal) {
        try {
            // 🔧 FIX: Use same API base as unified status manager
            const apiBase = window.rbckConfig?.apiBase || 'https://rbck.onrender.com/api';
            const response = await fetch(`${apiBase}/ai/metrics?t=${Date.now()}`, { 
                method: 'GET',
                signal,
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = SecurityUtils.validateAPIResponse(await response.json());
                
                console.log(`🔍 [AI SWARM FIXED] Raw metrics response:`, data);
                console.log(`🔍 [AI SWARM FIXED] Provider ${providerKey} data:`, data.metrics?.[providerKey]);
                
                if (data.success && data.metrics && data.metrics[providerKey]) {
                    const providerData = data.metrics[providerKey];
                    
                    // 🔧 FIX: Use EXACT same logic as unified status manager (line 216)
                    const isConnected = providerData.isActive && providerData.configured;
                    
                    console.log(`📊 [AI SWARM FIXED] ${providerKey} connection check:`, {
                        name: providerData.name,
                        status: providerData.status,
                        isActive: providerData.isActive,
                        configured: providerData.configured,
                        connected: isConnected,
                        uptime: providerData.uptime,
                        successRate: providerData.successRate
                    });
                    
                    // 🔧 FIX: Treat ready status as configured
                    if (providerData.status === 'ready' && !providerData.hasOwnProperty('configured')) {
                        console.log(`🔧 [AI SWARM FIXED] ${providerKey}: Treating 'ready' status as configured`);
                        return true;
                    }
                    
                    return isConnected;
                } else {
                    // 🔧 FIX: Also check simple status endpoint as fallback
                    console.log(`🔧 [AI SWARM FIXED] No metrics data for ${providerKey}, checking status endpoint...`);
                    return await this.checkProviderViaStatus(providerKey, signal, apiBase);
                }
            }
            console.warn(`⚠️ [AI SWARM FIXED] Bad metrics response: ${response.status}`);
            return false;
        } catch (error) {
            console.error(`❌ [AI SWARM FIXED] ${providerKey} metrics check failed:`, error);
            // 🔧 FIX: Fallback to status endpoint
            try {
                const apiBase = window.rbckConfig?.apiBase || 'https://rbck.onrender.com/api';
                return await this.checkProviderViaStatus(providerKey, signal, apiBase);
            } catch (fallbackError) {
                console.error(`❌ [AI SWARM FIXED] ${providerKey} fallback failed:`, fallbackError);
                return false;
            }
        }
    }

    /**
     * 🔧 FIX: New fallback method to check via status endpoint
     */
    async checkProviderViaStatus(providerKey, signal, apiBase) {
        try {
            const response = await fetch(`${apiBase}/ai/status`, { 
                method: 'GET',
                signal,
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = SecurityUtils.validateAPIResponse(await response.json());
                console.log(`🔧 [AI SWARM FALLBACK] Status response:`, data);
                
                if (data.success && data.data?.providers?.[providerKey]) {
                    const providerData = data.data.providers[providerKey];
                    const isConnected = providerData.status === 'ready' && providerData.configured;
                    
                    console.log(`📊 [AI SWARM FALLBACK] ${providerKey}:`, {
                        status: providerData.status,
                        configured: providerData.configured,
                        connected: isConnected
                    });
                    
                    return isConnected;
                }
            }
            return false;
        } catch (error) {
            console.error(`❌ [AI SWARM FALLBACK] ${providerKey} status check failed:`, error);
            return false;
        }
    }

    async checkExternalProviderStatus(providerKey, signal) {
        // 🔧 DEPRECATED: Fallback to old individual endpoint method
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
        console.log('🔄 [AI SWARM FIXED] Updating all provider status...');
        
        // 🔧 FIX: Priority order - try unified manager first, then direct API
        if (window.unifiedStatusManager && window.unifiedStatusManager.isMonitoring) {
            console.log('⚡ [UNIFIED SYNC FIXED] Using unified status manager data...');
            
            const allStatus = window.unifiedStatusManager.getAllProviderStatus();
            const connectedProviders = [];
            
            console.log('📊 [UNIFIED SYNC FIXED] Got unified status data:', allStatus);
            
            // ✅ FIXED: Use proper provider keys with enhanced sync logic
            const providerKeys = ['qwen3', 'openai', 'deepseek', 'gemini', 'chinda'];
            let hasValidData = false;
            
            providerKeys.forEach(providerKey => {
                const unifiedData = allStatus[providerKey];
                if (unifiedData && this.providers[providerKey]) {
                    // 🔧 FIX: Enhanced connection logic with multiple checks
                    let isConnected = false;
                    
                    // Primary check: unified manager logic
                    if (unifiedData.connected !== undefined && unifiedData.configured !== undefined) {
                        isConnected = unifiedData.connected && unifiedData.configured;
                        hasValidData = true;
                    }
                    // Fallback: check isActive and configured
                    else if (unifiedData.isActive !== undefined && unifiedData.configured !== undefined) {
                        isConnected = unifiedData.isActive && unifiedData.configured;
                        hasValidData = true;
                    }
                    // Fallback: check status directly
                    else if (unifiedData.status === 'ready' || unifiedData.status === 'healthy') {
                        isConnected = true;
                        hasValidData = true;
                    }
                    
                    // Update provider with enhanced data  
                    this.providers[providerKey].status = isConnected;
                    this.providers[providerKey].connected = unifiedData.connected || isConnected;
                    this.providers[providerKey].configured = unifiedData.configured || isConnected;
                    this.providers[providerKey].isActive = unifiedData.isActive || isConnected;
                    this.providers[providerKey].responseTime = unifiedData.responseTime;
                    this.providers[providerKey].successRate = unifiedData.successRate;
                    this.providers[providerKey].lastUpdate = unifiedData.lastUpdate || new Date().toISOString();
                    this.providers[providerKey].backendStatus = unifiedData.status;
                    
                    if (isConnected) {
                        connectedProviders.push(providerKey);
                    }
                    
                    console.log(`🔄 [UNIFIED SYNC FIXED] ${providerKey}: ${isConnected ? 'Connected' : 'Disconnected'} (status: ${unifiedData.status}, connected: ${unifiedData.connected}, configured: ${unifiedData.configured}, isActive: ${unifiedData.isActive})`);
                } else {
                    if (this.providers[providerKey]) {
                        this.providers[providerKey].status = false;
                    }
                    console.log(`⚠️ [UNIFIED SYNC FIXED] ${providerKey}: No unified manager data`);
                }
            });
            
            // 🔧 FIX: If we got valid data from unified manager, use it
            if (hasValidData) {
                console.log(`✅ [UNIFIED SYNC FIXED] AI Swarm synced with unified manager (${connectedProviders.length}/${Object.keys(this.providers).length} connected)`);
                return connectedProviders;
            } else {
                console.log(`⚠️ [UNIFIED SYNC FIXED] No valid unified data, falling back to direct API...`);
            }
        }
        
        // 🔧 FIX: Direct API fallback when unified manager not available
        console.log('🔄 [DIRECT API FALLBACK] Checking providers directly...');
        
        const providerKeys = ['qwen3', 'openai', 'deepseek', 'gemini', 'chinda'];
        const connectedProviders = [];
        
        // Check each provider directly via API
        const checkPromises = providerKeys.map(async (providerKey) => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), CONSTANTS.TIMEOUTS.PROVIDER_CHECK);
                
                const isConnected = await this.checkProviderViaMetrics(providerKey, controller.signal);
                clearTimeout(timeoutId);
                
                if (this.providers[providerKey]) {
                    this.providers[providerKey].status = isConnected;
                    this.providers[providerKey].connected = isConnected;
                    this.providers[providerKey].lastUpdate = new Date().toISOString();
                }
                
                if (isConnected) {
                    connectedProviders.push(providerKey);
                }
                
                console.log(`🔄 [DIRECT API FALLBACK] ${providerKey}: ${isConnected ? 'Connected' : 'Disconnected'}`);
                return { providerKey, isConnected };
            } catch (error) {
                console.error(`❌ [DIRECT API FALLBACK] ${providerKey} failed:`, error);
                if (this.providers[providerKey]) {
                    this.providers[providerKey].status = false;
                }
                return { providerKey, isConnected: false };
            }
        });
        
        // Wait for all checks to complete
        await Promise.allSettled(checkPromises);
        
        console.log(`✅ [DIRECT API FALLBACK] Completed: ${connectedProviders.length}/${providerKeys.length} connected`);
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
        
        // ✅ FIXED: Use immediate updates like aiMonitoring.js (no debouncing)
        // Immediate UI updates for real-time status sync
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

        // Primary status monitoring with immediate UI updates
        this.intervals.set('primary', setInterval(async () => {
            if (!this.isMonitoring) return;
            
            try {
                console.log('⚡ [MONITORING] Starting status update cycle...');
                await this.providerManager.updateAllProviderStatus();
                
                // ✅ FIXED: Immediate UI updates like aiMonitoring.js
                console.log('⚡ [MONITORING] Triggering immediate UI update...');
                this.uiController.renderProviders();
                this.uiController.updateStatusSummary();
                console.log('✅ [MONITORING] Status update cycle completed');
            } catch (error) {
                console.error('❌ [MONITORING] Primary monitoring error:', error);
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
            console.log('🤖 [AI SWARM] Initializing AI Swarm Council with unified backend sync...');
            
            // 🔧 WAIT: Ensure unified status manager is ready first
            if (window.unifiedStatusManager) {
                if (!window.unifiedStatusManager.isMonitoring) {
                    console.log('⏳ [INIT] Starting unified status manager...');
                    await window.unifiedStatusManager.startMonitoring();
                    // Brief delay to ensure data is populated
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } else {
                    console.log('✅ [INIT] Unified status manager already running');
                }
            } else {
                console.warn('⚠️ [INIT] Unified status manager not available');
            }
            
            // Initialize provider status
            await this.providerManager.updateAllProviderStatus();
            
            // Setup UI
            this.setupUI();
            
            // Start monitoring
            this.monitoringManager.startMonitoring();
            
            // Bind global functions
            this.bindGlobalFunctions();
            
            console.log('✅ [AI SWARM] Council initialized with unified backend sync');
            showNotification('🤖 AI Swarm Council (Unified Sync) activated', 'success');
            
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
        
        // Force unified status manager update first
        if (window.unifiedStatusManager && window.unifiedStatusManager.isMonitoring) {
            console.log('🔄 [REFRESH] Forcing unified status manager update...');
            await window.unifiedStatusManager.updateAllProviderStatus();
            await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay for data sync
        }
        
        await this.providerManager.updateAllProviderStatus();
        
        // ✅ FIXED: Immediate UI updates
        this.uiController.renderProviders();
        this.uiController.updateStatusSummary();
        
        const connectedCount = this.providerManager.getConnectedProviders().length;
        this.conversationLogger.addMessage('system', `✅ Provider status updated (${connectedCount} connected)`);
        showNotification(`🔄 AI provider status refreshed (${connectedCount} connected)`, 'info');
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
        
        // 🔧 NEW: Add backend sync testing functions
        window.testAISwarmSync = () => this.testBackendSync();
        window.forceAISwarmSync = () => this.forceRealBackendSync();
        window.testRealBackendData = () => this.testRealBackendData();
        window.quickStatusTest = () => this.quickStatusTest();
        
        console.log('🔗 [GLOBAL] AI Swarm functions bound with backend sync support');
    }

    /**
     * 🔧 NEW: Test backend sync functionality
     */
    async testBackendSync() {
        console.log('🧪 [TEST SYNC] Testing AI Swarm backend synchronization...');
        this.conversationLogger.addMessage('system', '🧪 Testing backend sync...');
        
        try {
            // Test unified status manager connection
            if (window.unifiedStatusManager) {
                await window.unifiedStatusManager.updateAllProviderStatus();
                const allStatus = window.unifiedStatusManager.getAllProviderStatus();
                console.log('✅ [TEST SYNC] Unified status manager data:', allStatus);
                this.conversationLogger.addMessage('system', `✅ Unified manager: ${Object.keys(allStatus).length} providers`);
            } else {
                this.conversationLogger.addMessage('system', '❌ Unified status manager not available');
            }
            
            // Test AI Swarm sync
            const connectedProviders = await this.providerManager.updateAllProviderStatus();
            this.conversationLogger.addMessage('system', `🔄 AI Swarm sync: ${connectedProviders.length} providers connected`);
            
            // ✅ FIXED: Immediate UI updates
            this.uiController.renderProviders();
            this.uiController.updateStatusSummary();
            
            showNotification('🧪 Backend sync test completed', 'success');
            
        } catch (error) {
            console.error('❌ [TEST SYNC] Test failed:', error);
            this.conversationLogger.addMessage('system', `❌ Sync test failed: ${error.message}`);
            showNotification('❌ Backend sync test failed', 'error');
        }
    }

    /**
     * 🔧 NEW: Force real backend sync
     */
    async forceRealBackendSync() {
        console.log('🔄 [FORCE BACKEND SYNC] Forcing real backend synchronization...');
        this.conversationLogger.addMessage('system', '🔄 Forcing real backend sync...');
        
        try {
            await this.providerManager.updateAllProviderStatus();
            // ✅ FIXED: Immediate UI updates like aiMonitoring.js
            this.uiController.renderProviders();
            this.uiController.updateStatusSummary();
            
            const report = this.getStatusReport();
            this.conversationLogger.addMessage('system', `✅ Real backend sync complete: ${report.connectedCount}/${report.totalCount} connected`);
            this.conversationLogger.addMessage('system', `Connected: ${report.connectedProviders.map(p => p.name).join(', ')}`);
            
            showNotification('🔄 Real backend sync completed', 'success');
        } catch (error) {
            console.error('❌ [FORCE BACKEND SYNC] Failed:', error);
            this.conversationLogger.addMessage('system', `❌ Backend sync failed: ${error.message}`);
            showNotification('❌ Backend sync failed', 'error');
        }
    }

    /**
     * 🔧 NEW: Quick status test for debugging
     */
    async quickStatusTest() {
        console.log('🧪 [QUICK TEST] Testing AI Swarm status fix...');
        this.conversationLogger.addMessage('system', '🧪 Quick status test started...');
        
        try {
            // Test direct API connection
            await this.providerManager.updateAllProviderStatus();
            
            // Update UI immediately
            this.uiController.renderProviders();
            this.uiController.updateStatusSummary();
            
            const report = this.getStatusReport();
            
            this.conversationLogger.addMessage('system', `🔧 Status Fix Results:`);
            this.conversationLogger.addMessage('system', `   Total providers: ${report.totalCount}`);
            this.conversationLogger.addMessage('system', `   Connected: ${report.connectedCount}`);
            this.conversationLogger.addMessage('system', `   Connected providers: ${report.connectedProviders.map(p => p.name).join(', ') || 'None'}`);
            
            console.log('✅ [QUICK TEST] Status fix test completed:', report);
            showNotification(`🔧 Status fix: ${report.connectedCount}/${report.totalCount} connected`, 'success');
            
            return report;
        } catch (error) {
            console.error('❌ [QUICK TEST] Test failed:', error);
            this.conversationLogger.addMessage('system', `❌ Status test failed: ${error.message}`);
            showNotification('❌ Status test failed', 'error');
            return null;
        }
    }

    /**
     * 🧪 NEW: Test real backend data connection
     */
    async testRealBackendData() {
        console.log('🧪 [TEST BACKEND] Testing real backend data connection...');
        this.conversationLogger.addMessage('system', '🧪 Testing real backend data...');
        
        try {
            const apiBase = 'https://rbck.onrender.com/api';
            const response = await fetch(`${apiBase}/ai/metrics?t=${Date.now()}`, { 
                method: 'GET',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                
                console.log('🎯 [TEST BACKEND] Raw backend response:', data);
                
                if (data.success && data.metrics) {
                    const connectedCount = Object.values(data.metrics).filter(p => p.isActive && p.configured).length;
                    const totalCount = Object.keys(data.metrics).length;
                    
                    this.conversationLogger.addMessage('system', `✅ Backend connection successful`);
                    this.conversationLogger.addMessage('system', `📊 Found ${totalCount} providers, ${connectedCount} connected`);
                    
                    Object.entries(data.metrics).forEach(([key, provider]) => {
                        const status = provider.isActive && provider.configured ? '✅ Connected' : '❌ Not connected';
                        this.conversationLogger.addMessage('system', `${key}: ${status} (${provider.status})`);
                    });
                    
                    showNotification('🧪 Backend test successful', 'success');
                    return { success: true, data, connectedCount, totalCount };
                } else {
                    throw new Error('Invalid response structure');
                }
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('❌ [TEST BACKEND] Test failed:', error);
            this.conversationLogger.addMessage('system', `❌ Backend test failed: ${error.message}`);
            showNotification('❌ Backend test failed', 'error');
            return { success: false, error: error.message };
        }
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