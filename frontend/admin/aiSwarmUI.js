// ===== AI SWARM COUNCIL - SEPARATED UI VERSION =====
// Enhanced AI Swarm Council with dedicated menu and conversation logs
// Supports separate UI sections for better organization

import { showNotification } from './uiHelpers.js';
import { API_BASE } from '../config.js';

/**
 * Enhanced AI Swarm Council for Dedicated Menu System
 */
export class AISwarmCouncilUI {
    constructor() {
        this.providers = {
            gemini: { 
                name: 'Gemini 2.0 Flash', 
                icon: '⚡',
                status: false, 
                role: 'primary_creator',
                expertise: ['content_creation', 'seo_optimization', 'multilingual'],
                priority: 1,
                color: '#4285f4'
            },
            openai: { 
                name: 'OpenAI GPT', 
                icon: '🧠',
                status: false, 
                role: 'quality_reviewer',
                expertise: ['quality_control', 'fact_checking', 'coherence'],
                priority: 2,
                color: '#00a67e'
            },
            claude: { 
                name: 'Claude AI', 
                icon: '🎭',
                status: false, 
                role: 'content_optimizer',
                expertise: ['structure_improvement', 'readability', 'engagement'],
                priority: 3,
                color: '#ff6b35'
            },
            deepseek: { 
                name: 'DeepSeek AI', 
                icon: '🔍',
                status: false, 
                role: 'technical_validator',
                expertise: ['technical_accuracy', 'code_review', 'performance'],
                priority: 4,
                color: '#7c3aed'
            },            chinda: { 
                name: 'ChindaX AI', 
                icon: '🧠',
                status: false, 
                role: 'multilingual_advisor',
                expertise: ['translation', 'cultural_adaptation', 'localization', 'thai_language'],
                priority: 5,
                color: '#10b981',
                model: 'chinda-qwen3-4b'
            }
        };
        
        this.conversationHistory = [];
        this.currentTask = null;
        this.isProcessing = false;
        this.messageCount = 0;
        this.activeAICount = 0;
        
        this.collaborationRules = {
            minProviders: 2,
            consensusThreshold: 0.7,
            maxIterations: 3,
            timeoutSeconds: 30
        };
    }

    /**
     * Initialize the AI Swarm Council UI
     */
    async initialize() {
        console.log('🤖 [AI SWARM UI] Initializing AI Swarm Council...');
        
        try {
            // Update provider status
            await this.updateProviderStatus();
            
            // Setup UI components
            this.setupProviderStatusGrid();
            this.setupConversationWindow();
            this.setupEventHandlers();
            
            // Start status monitoring
            this.startStatusMonitoring();
            
            // Bind global functions
            this.bindGlobalFunctions();
            
            console.log('✅ [AI SWARM UI] Council initialized successfully');
            showNotification('🤖 AI Swarm Council พร้อมใช้งาน', 'success');
            
        } catch (error) {
            console.error('❌ [AI SWARM UI] Initialization failed:', error);
            showNotification('❌ เกิดข้อผิดพลาดในการเริ่มต้น AI Swarm Council', 'error');
        }
    }

    /**
     * Setup provider status grid
     */
    setupProviderStatusGrid() {
        const grid = document.getElementById('providersStatusGrid');
        if (!grid) return;

        grid.innerHTML = Object.entries(this.providers).map(([key, provider]) => `
            <div class="provider-status-card ${provider.status ? 'connected' : 'disconnected'}" id="providerCard-${key}">
                <div class="provider-card-icon">${provider.icon}</div>
                <div class="provider-card-name">${provider.name}</div>
                <div class="provider-card-role">${this.formatRole(provider.role)}</div>
                <div class="provider-card-status" id="providerCardStatus-${key}">
                    <span class="status-dot ${provider.status ? 'connected' : 'disconnected'}"></span>
                    <span class="status-text">${provider.status ? 'เชื่อมต่อแล้ว' : 'ออฟไลน์'}</span>
                </div>
            </div>
        `).join('');
    }

    /**
     * Setup conversation window
     */
    setupConversationWindow() {
        this.updateConversationStats();
    }

    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        // Task buttons
        document.querySelectorAll('.task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const taskType = btn.onclick?.toString().match(/'([^']+)'/)?.[1];
                if (taskType && !this.isProcessing) {
                    this.startCollaborativeTask(taskType);
                }
            });
        });
    }

    /**
     * Update provider status
     */
    async updateProviderStatus() {
        console.log('🔄 [AI SWARM UI] Updating provider status...');
        
        const connectedProviders = [];
        
        for (const [key, provider] of Object.entries(this.providers)) {
            try {
                const isConnected = await this.checkProviderStatus(key);
                this.providers[key].status = isConnected;
                
                if (isConnected) {
                    connectedProviders.push(key);
                }
            } catch (error) {
                console.error(`[AI SWARM UI] Error checking ${key} status:`, error);
                this.providers[key].status = false;
            }
        }
        
        this.activeAICount = connectedProviders.length;
        console.log(`🔗 [AI SWARM UI] Connected providers: ${connectedProviders.length}/5`);
        
        // Update UI
        this.updateProviderCards();
        this.updateConversationStats();
        
        return connectedProviders;
    }

    /**
     * Check individual provider status
     */
    async checkProviderStatus(providerKey) {
        try {
            // Simulate realistic status check
            const response = await fetch(`${API_BASE}/ai/status/${providerKey}`);
            if (response.ok) {
                const data = await response.json();
                return data.connected || false;
            }
        } catch (error) {
            console.error(`[AI SWARM UI] ${providerKey} check failed:`, error);
        }
        
        // Fallback: simulate random status for demo
        return Math.random() > 0.2; // 80% chance of being online
    }

    /**
     * Update provider cards in UI
     */
    updateProviderCards() {
        Object.entries(this.providers).forEach(([key, provider]) => {
            const card = document.getElementById(`providerCard-${key}`);
            const status = document.getElementById(`providerCardStatus-${key}`);
            
            if (card) {
                card.className = `provider-status-card ${provider.status ? 'connected' : 'disconnected'}`;
            }
            
            if (status) {
                const statusDot = status.querySelector('.status-dot');
                const statusText = status.querySelector('.status-text');
                
                if (statusDot) {
                    statusDot.className = `status-dot ${provider.status ? 'connected' : 'disconnected'}`;
                }
                
                if (statusText) {
                    statusText.textContent = provider.status ? 'เชื่อมต่อแล้ว' : 'ออฟไลน์';
                }
            }
        });
    }

    /**
     * Start collaborative task
     */
    async startCollaborativeTask(taskType) {
        if (this.isProcessing) {
            showNotification('⚠️ AI Swarm กำลังทำงานอยู่ กรุณารอสักครู่', 'warning');
            return;
        }

        const connectedProviders = Object.entries(this.providers)
            .filter(([key, provider]) => provider.status)
            .map(([key, provider]) => ({ key, ...provider }));

        if (connectedProviders.length < this.collaborationRules.minProviders) {
            showNotification(`❌ ต้องการ AI อย่างน้อย ${this.collaborationRules.minProviders} ตัวสำหรับงานร่วมมือ`, 'error');
            return;
        }

        this.isProcessing = true;
        this.currentTask = {
            type: taskType,
            startTime: new Date(),
            participants: connectedProviders.map(p => p.key)
        };

        try {
            // Update UI state
            this.setTaskButtonsEnabled(false);
            this.updateCurrentTaskStatus(this.getTaskDisplayName(taskType));
            
            // Add initial message
            this.addConversationMessage('system', `🚀 เริ่มต้นงาน "${this.getTaskDisplayName(taskType)}" ด้วย AI ${connectedProviders.length} ตัว`);
            
            // Execute collaboration
            await this.executeCollaborativeTask(taskType, connectedProviders);
            
        } catch (error) {
            console.error('[AI SWARM UI] Collaboration error:', error);
            this.addConversationMessage('system', `❌ เกิดข้อผิดพลาด: ${error.message}`);
            showNotification('❌ งาน AI Swarm ล้มเหลว', 'error');
        } finally {
            this.isProcessing = false;
            this.setTaskButtonsEnabled(true);
            this.updateCurrentTaskStatus('ว่าง');
        }
    }

    /**
     * Execute collaborative task
     */
    async executeCollaborativeTask(taskType, connectedProviders) {
        console.log(`[AI SWARM UI] Executing ${taskType} with providers:`, connectedProviders.map(p => p.key));
        
        const sortedProviders = this.sortProvidersByTaskType(taskType, connectedProviders);
        
        try {
            switch (taskType) {
                case 'content_review':
                    await this.executeContentReview(sortedProviders);
                    break;
                case 'content_creation':
                    await this.executeContentCreation(sortedProviders);
                    break;
                case 'seo_optimization':
                    await this.executeSEOOptimization(sortedProviders);
                    break;
                default:
                    throw new Error(`ไม่รู้จักประเภทงาน: ${taskType}`);
            }
        } catch (error) {
            throw new Error(`การทำงานล้มเหลว: ${error.message}`);
        }
    }

    /**
     * Execute content review collaboration
     */
    async executeContentReview(providers) {
        this.addConversationMessage('system', '📝 เริ่มวิเคราะห์เนื้อหาแบบร่วมมือ...');
        
        const reviews = [];
        
        // Each AI reviews the content
        for (const provider of providers) {
            this.addConversationMessage(provider.key, `กำลังวิเคราะห์เนื้อหาในมุมมอง ${this.formatRole(provider.role)}...`);
            
            const review = await this.simulateProviderReview(provider);
            reviews.push(review);
            
            this.addConversationMessage(provider.key, review.summary);
            await this.delay(1500);
        }

        // Build consensus
        const consensus = await this.buildConsensus(reviews, 'review');
        this.addConversationMessage('system', `✅ สรุปผลการวิเคราะห์: ${consensus.conclusion}`);
        
        showNotification('📝 วิเคราะห์เนื้อหาเสร็จสิ้น', 'success');
    }

    /**
     * Execute content creation collaboration
     */
    async executeContentCreation(providers) {
        this.addConversationMessage('system', '✨ เริ่มสร้างเนื้อหาแบบร่วมมือ...');
        
        const creationPhases = [
            { phase: 'brainstorming', leader: providers[0], name: 'ระดมความคิด' },
            { phase: 'drafting', leader: providers.find(p => p.role === 'primary_creator') || providers[0], name: 'ร่างเนื้อหา' },
            { phase: 'optimization', leader: providers.find(p => p.role === 'content_optimizer') || providers[1], name: 'ปรับปรุง' },
            { phase: 'review', leader: providers.find(p => p.role === 'quality_reviewer') || providers[2], name: 'ตรวจสอบ' }
        ];

        let content = {};
        
        for (const { phase, leader, name } of creationPhases) {
            this.addConversationMessage('system', `🔄 ขั้นตอน: ${name.toUpperCase()}`);
            this.addConversationMessage(leader.key, `รับผิดชอบขั้นตอน${name}...`);
            
            const phaseResult = await this.simulateCreationPhase(phase, leader, content);
            content = { ...content, ...phaseResult };
            
            this.addConversationMessage(leader.key, phaseResult.summary);
            
            // Other AIs provide feedback
            const otherProviders = providers.filter(p => p.key !== leader.key).slice(0, 2);
            for (const provider of otherProviders) {
                const feedback = await this.simulateProviderFeedback(provider, phaseResult);
                this.addConversationMessage(provider.key, feedback.comment);
                await this.delay(1000);
            }
            
            await this.delay(2000);
        }

        this.addConversationMessage('system', '🎉 การสร้างเนื้อหาร่วมมือเสร็จสิ้น!');
        showNotification('✨ สร้างเนื้อหาร่วมมือเสร็จสิ้น', 'success');
    }

    /**
     * Execute SEO optimization collaboration
     */
    async executeSEOOptimization(providers) {
        this.addConversationMessage('system', '🔍 เริ่มปรับปรุง SEO แบบร่วมมือ...');
        
        const optimizations = [];
        
        // Each AI suggests SEO improvements
        for (const provider of providers) {
            this.addConversationMessage(provider.key, `กำลังวิเคราะห์โอกาส SEO ในมุมมอง ${this.formatRole(provider.role)}...`);
            
            const seoSuggestion = await this.simulateSEOAnalysis(provider);
            optimizations.push(seoSuggestion);
            
            this.addConversationMessage(provider.key, seoSuggestion.summary);
            await this.delay(1500);
        }

        // Combine and prioritize optimizations
        const finalOptimization = await this.combineOptimizations(optimizations);
        this.addConversationMessage('system', `🚀 แผนปรับปรุง SEO: ${finalOptimization.conclusion}`);
        
        showNotification('🔍 ปรับปรุง SEO เสร็จสิ้น', 'success');
    }

    /**
     * Add message to conversation feed
     */
    addConversationMessage(sender, message) {
        const conversationFeed = document.getElementById('aiConversationFeed');
        if (!conversationFeed) return;

        // Remove welcome message if exists
        const welcome = conversationFeed.querySelector('.welcome-conversation-message');
        if (welcome) {
            welcome.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message ${sender}`;
        
        const timestamp = new Date().toLocaleTimeString('th-TH');
        const senderIcon = sender === 'system' ? '🤖' : this.providers[sender]?.icon || '🤖';
        const senderName = sender === 'system' ? 'ระบบ' : this.providers[sender]?.name || sender;
        
        messageDiv.innerHTML = `
            <div class="message-header-info">
                <div class="ai-sender">
                    <span class="ai-sender-icon">${senderIcon}</span>
                    <span>${senderName}</span>
                </div>
                <div class="message-timestamp">${timestamp}</div>
            </div>
            <div class="message-content">${message}</div>
        `;

        conversationFeed.appendChild(messageDiv);
        conversationFeed.scrollTop = conversationFeed.scrollHeight;

        // Store in conversation history
        this.conversationHistory.push({
            sender,
            message,
            timestamp: new Date()
        });

        this.messageCount++;
        this.updateConversationStats();
    }

    /**
     * Update conversation statistics
     */
    updateConversationStats() {
        const activeAIElement = document.getElementById('activeAICount');
        const messageCountElement = document.getElementById('messageCount');
        const currentTaskElement = document.getElementById('currentTaskStatus');
        
        if (activeAIElement) activeAIElement.textContent = this.activeAICount;
        if (messageCountElement) messageCountElement.textContent = this.messageCount;
        if (currentTaskElement && !this.currentTask) {
            currentTaskElement.textContent = 'ว่าง';
        }
    }

    /**
     * Update current task status
     */
    updateCurrentTaskStatus(status) {
        const currentTaskElement = document.getElementById('currentTaskStatus');
        if (currentTaskElement) {
            currentTaskElement.textContent = status;
        }
    }

    /**
     * Set task buttons enabled/disabled state
     */
    setTaskButtonsEnabled(enabled) {
        document.querySelectorAll('.task-btn').forEach(button => {
            button.disabled = !enabled;
            if (enabled) {
                button.classList.remove('processing');
            } else {
                button.classList.add('processing');
            }
        });
    }

    /**
     * Clear conversation logs
     */
    clearConversationLogs() {
        const conversationFeed = document.getElementById('aiConversationFeed');
        if (conversationFeed) {
            conversationFeed.innerHTML = `
                <div class="welcome-conversation-message">
                    <div class="system-message">
                        <i class="fas fa-robot"></i>
                        <span>🤖 AI Swarm Council พร้อมทำงาน... เลือกงานที่ต้องการให้ AI ร่วมมือกัน</span>
                    </div>
                </div>
            `;
        }
        
        this.conversationHistory = [];
        this.messageCount = 0;
        this.updateConversationStats();
        
        showNotification('🗑️ ล้าง Conversation Logs แล้ว', 'info');
    }

    /**
     * Export conversation logs
     */
    exportConversationLogs() {
        const data = {
            timestamp: new Date().toISOString(),
            task: this.currentTask,
            conversation: this.conversationHistory,
            participants: Object.entries(this.providers)
                .filter(([key, provider]) => provider.status)
                .map(([key, provider]) => ({ key, name: provider.name, role: provider.role })),
            statistics: {
                messageCount: this.messageCount,
                activeAI: this.activeAICount,
                sessionDuration: this.conversationHistory.length > 0 ? 
                    new Date() - this.conversationHistory[0].timestamp : 0
            }
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-swarm-conversation-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        showNotification('💾 Export Conversation Logs สำเร็จ', 'success');
    }

    /**
     * Toggle conversation window size
     */
    toggleConversationWindow() {
        const conversationWindow = document.getElementById('conversationWindow');
        const toggleBtn = document.getElementById('toggleConversationBtn');
        
        if (conversationWindow && toggleBtn) {
            conversationWindow.classList.toggle('expanded');
            
            const isExpanded = conversationWindow.classList.contains('expanded');
            toggleBtn.innerHTML = isExpanded ? 
                '<i class="fas fa-compress"></i> ย่อ' : 
                '<i class="fas fa-expand"></i> ขยาย';
        }
    }

    // Helper methods (same as original implementation)
    sortProvidersByTaskType(taskType, providers) {
        const taskExpertise = {
            'content_creation': ['content_creation', 'seo_optimization', 'multilingual'],
            'content_review': ['quality_control', 'fact_checking', 'coherence'],
            'seo_optimization': ['seo_optimization', 'content_creation', 'structure_improvement']
        };

        const relevantExpertise = taskExpertise[taskType] || [];
        
        return providers.sort((a, b) => {
            const aScore = a.expertise.filter(exp => relevantExpertise.includes(exp)).length;
            const bScore = b.expertise.filter(exp => relevantExpertise.includes(exp)).length;
            
            if (aScore !== bScore) return bScore - aScore;
            return a.priority - b.priority;
        });
    }

    async simulateProviderReview(provider) {
        await this.delay(2000 + Math.random() * 2000);
        
        const reviewTemplates = {
            'quality_reviewer': [
                'คุณภาพเนื้อหาดีเยี่ยม มีโครงสร้างชัดเจนและน่าสนใจ',
                'ความถูกต้องของข้อมูลดี แต่ควรเพิ่มหลักฐานสนับสนุน',
                'รูปแบบการเขียนเป็นมืออาชีพและเข้าถึงผู้อ่านได้ดี'
            ],
            'content_optimizer': [
                'คะแนนการอ่าน: 8.5/10 ควรใช้ย่อหน้าสั้นๆ สำหรับมือถือ',
                'โครงสร้างเนื้อหาเป็นระบบ มีการเชื่อมโยงระหว่างส่วนที่ดี',
                'ความน่าสนใจสามารถปรับปรุงได้ด้วยองค์ประกอบเชิงโต้ตอบ'
            ],
            'technical_validator': [
                'ความถูกต้องทางเทคนิคผ่านการตรวจสอบแล้ว ข้อมูลทั้งหมดมีแหล่งอ้างอิง',
                'ตัวอย่างโค้ดถูกต้องและใช้หลักการที่ดี',
                'ผลกระทบด้านประสิทธิภาพน้อยและยอมรับได้'
            ],
            'primary_creator': [
                'เนื้อหาสอดคล้องกับกลยุทธ์แบรนด์และข้อความที่ต้องการสื่อ',
                'คำหลัก SEO ถูกรวมเข้ามาอย่างเป็นธรรมชาติ',
                'การวางตำแหน่ง Call-to-action มีกลยุทธ์และมีประสิทธิภาพ'
            ]
        };

        const templates = reviewTemplates[provider.role] || ['การวิเคราะห์เสร็จสิ้น เนื้อหาผ่านมาตรฐานคุณภาพ'];
        const summary = templates[Math.floor(Math.random() * templates.length)];
        
        return {
            provider: provider.key,
            role: provider.role,
            score: 0.7 + Math.random() * 0.3,
            summary,
            timestamp: new Date()
        };
    }

    async simulateCreationPhase(phase, leader, previousContent) {
        await this.delay(3000 + Math.random() * 2000);
        
        const phaseTemplates = {
            'brainstorming': {
                summary: 'สร้างไอเดียเนื้อหา 5 แนวทาง เน้นการมีส่วนร่วมของผู้ใช้และการปรับปรุง search',
                topics: ['ประสบการณ์ผู้ใช้', 'ประสิทธิภาพ', 'การเข้าถึง', 'SEO', 'Mobile Design']
            },
            'drafting': {
                summary: 'สร้างร่างเนื้อหาครบถ้วน มีบทนำที่แข็งแกร่ง ส่วนรายละเอียด และสรุปที่ชัดเจน',
                wordCount: 1200 + Math.floor(Math.random() * 800)
            },
            'optimization': {
                summary: 'ปรับปรุงความสามารถในการอ่าน ปรับปรุงโครงสร้าง และปรับแต่งคำหลักเป้าหมาย',
                improvements: ['หัวข้อที่ดีขึ้น', 'ย่อหน้าสั้นลง', 'เพิ่มการเชื่อมต่อ']
            },
            'review': {
                summary: 'การตรวจสอบขั้นสุดท้ายเสร็จสิ้น เนื้อหาพร้อมเผยแพร่ด้วยคะแนนคุณภาพ 95%',
                finalScore: 0.9 + Math.random() * 0.1
            }
        };

        return phaseTemplates[phase] || { summary: `ขั้นตอน ${phase} เสร็จสิ้นเรียบร้อย` };
    }

    async simulateProviderFeedback(provider, content) {
        await this.delay(1000 + Math.random() * 1000);
        
        const feedbackTemplates = [
            'ยอดเยี่ยม! แนวทางนี้สอดคล้องกับหลักการที่ดี',
            'ควรพิจารณาเพิ่มตัวอย่างเฉพาะเจาะจงเพื่อเสริมประเด็น',
            'โทนเสียงเหมาะสมกับกลุ่มเป้าหมายของเรา',
            'ความคืบหน้าดี การปรับแต่งเล็กน้อยสามารถเพิ่มความชัดเจน',
            'โครงสร้างยอดเยี่ยม การไหลเป็นไปอย่างมีเหตุผล',
            'สิ่งนี้ตรงตามมาตรฐานคุณภาพ พร้อมสำหรับขั้นตอนต่อไป'
        ];

        return {
            provider: provider.key,
            comment: feedbackTemplates[Math.floor(Math.random() * feedbackTemplates.length)],
            sentiment: 'positive'
        };
    }

    async simulateSEOAnalysis(provider, content) {
        await this.delay(2500 + Math.random() * 1500);
        
        const seoTemplates = {
            'primary_creator': {
                summary: 'ความหนาแน่นคำหลักเหมาะสม คำหลักเป้าหมายรวมเข้าไปได้ดี',
                suggestions: ['เพิ่มคำหลักหางยาว', 'ปรับปรุง meta description']
            },
            'content_optimizer': {
                summary: 'โครงสร้างหัวข้อดีขึ้น การใช้ HTML เชิงความหมายดีขึ้น',
                suggestions: ['เพิ่มลิงก์ภายใน', 'ปรับแต่ง alt text ของรูปภาพ']
            },
            'technical_validator': {
                summary: 'ความเร็วหน้าเพจปรับแต่งแล้ว Core Web Vitals ดูดี',
                suggestions: ['บีบอัดรูปภาพเพิ่มเติม', 'ปรับแต่งการโหลด JavaScript']
            }
        };

        const template = seoTemplates[provider.role] || {
            summary: 'การวิเคราะห์ SEO เสร็จสิ้นพร้อมคำแนะนำที่ปฏิบัติได้',
            suggestions: ['ปรับปรุงคุณภาพเนื้อหา', 'เพิ่มคำหลักที่เกี่ยวข้อง']
        };

        return {
            provider: provider.key,
            score: 0.75 + Math.random() * 0.25,
            ...template,
            timestamp: new Date()
        };
    }

    async buildConsensus(items, type) {
        await this.delay(1000);
        
        const avgScore = items.reduce((sum, item) => sum + (item.score || 0), 0) / items.length;
        const conclusions = {
            'review': {
                excellent: 'เนื้อหาเกินมาตรฐานคุณภาพ พร้อมเผยแพร่',
                good: 'คุณภาพเนื้อหาดีพร้อมข้อเสนอแนะการปรับปรุงเล็กน้อย',
                needs_work: 'เนื้อหาต้องการการปรับปรุงที่สำคัญก่อนเผยแพร่'
            }
        };

        let category = 'needs_work';
        if (avgScore >= 0.85) category = 'excellent';
        else if (avgScore >= 0.7) category = 'good';

        return {
            score: avgScore,
            conclusion: conclusions[type]?.[category] || 'การวิเคราะห์เสร็จสิ้นเรียบร้อย',
            participantCount: items.length,
            timestamp: new Date()
        };
    }

    async combineOptimizations(optimizations) {
        await this.delay(1500);
        
        const allSuggestions = optimizations.flatMap(opt => opt.suggestions || []);
        const uniqueSuggestions = [...new Set(allSuggestions)];
        const avgScore = optimizations.reduce((sum, opt) => sum + (opt.score || 0), 0) / optimizations.length;

        return {
            score: avgScore,
            conclusion: `พบโอกาสปรับปรุง ${uniqueSuggestions.length} ข้อ ระดับผลกระทบ: ${avgScore > 0.8 ? 'สูง' : 'ปานกลาง'}`,
            suggestions: uniqueSuggestions.slice(0, 5),
            timestamp: new Date()
        };
    }

    formatRole(role) {
        const roleNames = {
            'primary_creator': 'ผู้สร้างหลัก',
            'quality_reviewer': 'ผู้ตรวจสอบคุณภาพ',
            'content_optimizer': 'ผู้ปรับปรุงเนื้อหา',
            'technical_validator': 'ผู้ตรวจสอบเทคนิค',
            'multilingual_advisor': 'ที่ปรึกษาหลายภาษา'
        };
        return roleNames[role] || role;
    }

    getTaskDisplayName(taskType) {
        const taskNames = {
            'content_review': 'วิเคราะห์เนื้อหา',
            'content_creation': 'สร้างเนื้อหาร่วมกัน',
            'seo_optimization': 'ปรับปรุง SEO'
        };
        return taskNames[taskType] || taskType;
    }

    startStatusMonitoring() {
        setInterval(async () => {
            if (!this.isProcessing) {
                await this.updateProviderStatus();
            }
        }, 60000); // Check every minute
    }

    bindGlobalFunctions() {
        // Make the instance and functions globally available
        window.aiSwarmCouncilUI = this;
        window.startCollaborativeTask = (taskType) => this.startCollaborativeTask(taskType);
        window.clearConversationLogs = () => this.clearConversationLogs();
        window.exportConversationLogs = () => this.exportConversationLogs();
        window.toggleConversationWindow = () => this.toggleConversationWindow();
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getStatusReport() {
        return {
            isActive: this.activeAICount >= this.collaborationRules.minProviders,
            activeAICount: this.activeAICount,
            totalProviders: Object.keys(this.providers).length,
            isProcessing: this.isProcessing,
            currentTask: this.currentTask,
            messageCount: this.messageCount,
            conversationLength: this.conversationHistory.length
        };
    }
}
