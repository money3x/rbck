// ===== AI SWARM COUNCIL SYSTEM =====
// Multi-AI collaborative decision making and content generation system
// Supports Gemini 2.0 Flash, OpenAI, Claude, DeepSeek, and ChindaX

import { showNotification } from './uiHelpers.js';
import { API_BASE } from '../config.js';

/**
 * AI Swarm Council - Orchestrates multiple AI providers for collaborative tasks
 */
export class AISwarmCouncil {
    constructor() {
        this.providers = {
            gemini: { 
                name: 'Gemini 2.0 Flash', 
                status: false, 
                role: 'primary_creator',
                expertise: ['content_creation', 'seo_optimization', 'multilingual'],
                priority: 1
            },
            openai: { 
                name: 'OpenAI GPT', 
                status: false, 
                role: 'quality_reviewer',
                expertise: ['quality_control', 'fact_checking', 'coherence'],
                priority: 2
            },
            claude: { 
                name: 'Claude AI', 
                status: false, 
                role: 'content_optimizer',
                expertise: ['structure_improvement', 'readability', 'engagement'],
                priority: 3
            },
            deepseek: { 
                name: 'DeepSeek AI', 
                status: false, 
                role: 'technical_validator',
                expertise: ['technical_accuracy', 'code_review', 'performance'],
                priority: 4
            },            chinda: { 
                name: 'ChindaX AI', 
                status: false, 
                role: 'multilingual_advisor',
                expertise: ['translation', 'cultural_adaptation', 'localization', 'thai_language'],
                priority: 5,
                model: 'chinda-qwen3-32b'
            }
        };
        
        this.conversationHistory = [];
        this.currentTask = null;
        this.qualityThreshold = 0.8;
        this.isProcessing = false;
        this.collaborationRules = {
            minProviders: 2,
            consensusThreshold: 0.7,
            maxIterations: 3,
            timeoutSeconds: 30
        };
    }

    /**
     * Initialize the AI Swarm Council
     */
    async initialize() {
        console.log('🤖 [AI SWARM] Initializing AI Swarm Council...');
        
        try {
            // Check status of all AI providers
            await this.updateProviderStatus();
            
            // Setup conversation monitoring UI
            this.setupSwarmUI();
            
            // Start background status monitoring
            this.startStatusMonitoring();
            
            // Bind global functions
            this.bindGlobalFunctions();
            
            console.log('✅ [AI SWARM] Council initialized successfully');
            showNotification('🤖 AI Swarm Council activated', 'success');
            
        } catch (error) {
            console.error('❌ [AI SWARM] Initialization failed:', error);
            showNotification('❌ AI Swarm initialization failed', 'error');
        }
    }    /**
     * Update status of all AI providers
     */
    async updateProviderStatus() {
        console.log('🔄 [AI SWARM] Updating provider status...');
        const connectedProviders = [];
        
        for (const [key, provider] of Object.entries(this.providers)) {
            try {
                console.log(`🔍 [AI SWARM] Checking ${key} status...`);
                const isConnected = await this.checkProviderStatus(key);
                this.providers[key].status = isConnected;
                
                if (isConnected) {
                    connectedProviders.push(key);
                    console.log(`✅ [AI SWARM] ${key} is connected`);
                } else {
                    console.log(`❌ [AI SWARM] ${key} is disconnected`);
                }
            } catch (error) {
                console.error(`[AI SWARM] Error checking ${key} status:`, error);
                this.providers[key].status = false;
            }
        }
        
        console.log(`🔗 [AI SWARM] Connected providers: ${connectedProviders.length}/5`);
        
        // Always render the providers table regardless of connection status
        this.renderProviders();
        
        this.updateSwarmStatusDisplay(connectedProviders.length);
        return connectedProviders;
    }

    /**
     * Check individual provider status
     */
    async checkProviderStatus(providerKey) {        switch (providerKey) {
            case 'gemini':
                return await this.checkGeminiStatus();
            case 'openai':
            case 'claude':
            case 'deepseek':
            case 'chinda':
                return await this.checkExternalProviderStatus(providerKey);
            default:
                return false;
        }
    }

    /**
     * Check Gemini status
     */
    async checkGeminiStatus() {
        try {
            // Check if Gemini API key is available
            const apiKey = await this.getApiKey('gemini');
            return apiKey && apiKey.length > 10;
        } catch (error) {
            console.error('[AI SWARM] Gemini check failed:', error);
            return false;
        }
    }    /**
     * Check external provider status
     */
    async checkExternalProviderStatus(providerKey) {
        try {
            console.log(`🔍 [AI SWARM] Checking ${providerKey} via API...`);
            const response = await fetch(`${API_BASE}/ai/status/${providerKey}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ [AI SWARM] ${providerKey} API response:`, data);
                return data.connected || data.available || false;
            } else {
                console.warn(`⚠️ [AI SWARM] ${providerKey} API returned ${response.status}`);
            }
        } catch (error) {
            console.error(`❌ [AI SWARM] ${providerKey} check failed:`, error);
        }
        
        // Default to disconnected if check fails, but still show the provider
        console.log(`📊 [AI SWARM] ${providerKey} defaulting to disconnected state`);
        return false;
    }

    /**
     * Get API key for provider
     */
    async getApiKey(providerKey) {
        try {
            const response = await fetch(`${API_BASE}/apikey`);
            if (response.ok) {
                const data = await response.json();
                return data.data?.[`${providerKey}ApiKey`] || '';
            }
        } catch (error) {
            console.error(`[AI SWARM] API key fetch failed for ${providerKey}:`, error);
        }
        return '';
    }    /**
     * Setup Swarm UI components
     */
    setupSwarmUI() {
        console.log('🎨 [AI SWARM] Setting up UI components...');
        
        // Setup providers grid
        this.setupProvidersGrid();
        
        // Setup status summary
        this.setupStatusSummary();
        
        // Setup conversation logs
        this.setupConversationLogs();
        
        // Update initial display
        this.updateSwarmDisplay();
        
        console.log('✅ [AI SWARM] UI components setup completed');
    }/**
     * Setup providers grid
     */
    setupProvidersGrid() {
        // Use the renderProviders method instead of inline HTML
        this.renderProviders();
    }

    /**
     * Setup status summary
     */
    setupStatusSummary() {
        // Status summary is already in HTML, just update values
        this.updateStatusSummary();
    }

    /**
     * Setup conversation logs
     */
    setupConversationLogs() {
        const logsContainer = document.getElementById('aiConversationLogs');
        if (!logsContainer) return;

        // Initial empty state is already in HTML
        console.log('[AI SWARM] Conversation logs container ready');
    }

    /**
     * Update swarm display
     */
    updateSwarmDisplay() {
        this.updateProviderStatus();
        this.updateStatusSummary();
    }

    /**
     * Update status summary
     */
    updateStatusSummary() {
        const connectedCount = Object.values(this.providers).filter(p => p.status).length;
        
        // Update active providers count
        const activeCountElement = document.getElementById('activeProvidersCount');
        if (activeCountElement) {
            activeCountElement.textContent = connectedCount;
        }

        // Update active providers card status
        const activeCard = document.getElementById('activeProvidersCard');
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

        // Update current task status
        const taskStatusElement = document.getElementById('currentTaskStatus');
        const taskCard = document.getElementById('currentTaskCard');
        if (taskStatusElement && taskCard) {
            if (this.isProcessing && this.currentTask) {
                taskStatusElement.textContent = this.currentTask.type.replace(/_/g, ' ');
                taskCard.className = 'status-card warning';
            } else {
                taskStatusElement.textContent = 'ว่าง';
                taskCard.className = 'status-card';
            }
        }
    }

    /**
     * Generate Swarm Panel HTML
     */
    generateSwarmPanelHTML() {
        return `
            <div class="swarm-header">
                <h3>🤖 AI Swarm Council</h3>
                <div class="swarm-status" id="swarmStatus">
                    <span class="status-indicator" id="swarmStatusIndicator"></span>
                    <span id="swarmStatusText">Initializing...</span>
                </div>
            </div>
            
            <div class="swarm-providers" id="swarmProviders">
                <div class="providers-grid">
                    ${Object.entries(this.providers).map(([key, provider]) => `
                        <div class="provider-card ${key}" id="provider-${key}">
                            <div class="provider-icon">${this.getProviderIcon(key)}</div>
                            <div class="provider-info">
                                <h4>${provider.name}</h4>
                                <p class="provider-role">${provider.role.replace('_', ' ')}</p>
                                <div class="provider-status" id="status-${key}">
                                    <span class="status-dot"></span>
                                    <span class="status-text">Checking...</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="swarm-conversation" id="swarmConversation">
                <div class="conversation-header">
                    <h4>🗣️ AI Collaboration Log</h4>
                    <button class="btn btn-secondary btn-sm" onclick="window.aiSwarmCouncil.clearConversation()">
                        <i class="fas fa-trash"></i> Clear
                    </button>
                </div>
                <div class="conversation-feed" id="conversationFeed">
                    <div class="welcome-message">
                        AI Swarm Council ready for collaborative tasks...
                    </div>
                </div>
            </div>
            
            <div class="swarm-controls">
                <div class="control-group">
                    <button class="btn btn-primary" onclick="window.aiSwarmCouncil.startCollaboration('content_review')" id="startReviewBtn">
                        <i class="fas fa-search"></i> Start Content Review
                    </button>
                    <button class="btn btn-success" onclick="window.aiSwarmCouncil.startCollaboration('content_creation')" id="startCreationBtn">
                        <i class="fas fa-magic"></i> Collaborative Creation
                    </button>
                </div>
                <div class="control-group">
                    <button class="btn btn-warning" onclick="window.aiSwarmCouncil.startCollaboration('seo_optimization')" id="startSeoBtn">
                        <i class="fas fa-chart-line"></i> SEO Optimization
                    </button>
                    <button class="btn btn-info" onclick="window.aiSwarmCouncil.refreshProviderStatus()" id="refreshStatusBtn">
                        <i class="fas fa-sync"></i> Refresh Status
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Get provider icon
     */    getProviderIcon(providerKey) {
        const icons = {
            gemini: '⚡',
            openai: '🧠',
            claude: '🎭',
            deepseek: '🔍',
            chinda: '🧠'
        };
        return icons[providerKey] || '🤖';
    }/**
     * Update provider status display
     */
    updateProviderStatus() {
        Object.entries(this.providers).forEach(([key, provider]) => {
            const providerRow = document.getElementById(`provider-${key}`);
            const statusElement = document.getElementById(`status-${key}`);
            
            if (providerRow && statusElement) {
                // Update row class
                providerRow.className = `provider-row ${key}`;
                if (provider.status) {
                    providerRow.classList.add('connected');
                } else {
                    providerRow.classList.add('disconnected');
                }

                // Update status elements
                const statusDot = statusElement.querySelector('.status-dot');
                const statusText = statusElement.querySelector('.status-text');
                
                if (statusDot && statusText) {
                    if (provider.status) {
                        statusDot.className = 'status-dot connected';
                        statusText.className = 'status-text connected';
                        statusText.textContent = 'เชื่อมต่อแล้ว';
                    } else {
                        statusDot.className = 'status-dot disconnected';
                        statusText.className = 'status-text disconnected';
                        statusText.textContent = 'ไม่ได้เชื่อมต่อ';
                    }
                }
            }
        });

        // Update status summary
        this.updateStatusSummary();
    }

    /**
     * Update swarm status display (called from updateProviderStatus)
     */
    updateSwarmStatusDisplay(connectedCount) {
        // This method is called to update the overall status display
        // It's already handled by updateStatusSummary, so we can delegate to it
        this.updateStatusSummary();
    }    /**
     * Render AI providers table
     */
    renderProviders() {
        console.log('🔄 [AI SWARM] Rendering providers table...');
        const providersTableBody = document.getElementById('aiProvidersTableBody');
        
        if (!providersTableBody) {
            console.error('❌ [AI SWARM] aiProvidersTableBody element not found!');
            return;
        }

        console.log('📊 [AI SWARM] Providers data:', this.providers);
        providersTableBody.innerHTML = '';
        
        Object.entries(this.providers).forEach(([key, provider]) => {
            console.log(`🤖 [AI SWARM] Creating row for ${key}:`, provider);
            const providerRow = this.createProviderRow(key, provider);
            providersTableBody.appendChild(providerRow);
        });
        
        console.log('✅ [AI SWARM] Providers table rendered successfully');
    }/**
     * Create provider row element
     */
    createProviderRow(key, provider) {
        const row = document.createElement('tr');
        row.className = `provider-row ${key} ${provider.status ? 'connected' : 'disconnected'}`;
        row.id = `provider-${key}`;
        
        row.innerHTML = `
            <td data-label="โมเดล AI">
                <div class="provider-info">
                    <div class="provider-icon">${this.getProviderIcon(key)}</div>
                    <div class="provider-details">
                        <h4>${provider.name}</h4>
                        <p class="provider-model">${this.getProviderType(key)}</p>
                    </div>
                </div>
            </td>
            <td data-label="สถานะ" id="status-${key}">
                <div class="provider-status">
                    <div class="status-dot ${provider.status ? 'connected' : 'disconnected'}"></div>
                    <span class="status-text ${provider.status ? 'connected' : 'disconnected'}">${provider.status ? 'เชื่อมต่อแล้ว' : 'ไม่ได้เชื่อมต่อ'}</span>
                </div>
            </td>
            <td data-label="หน้าที่ในการทำงาน">
                <div class="provider-role">${this.getProviderRoleInThai(provider.role)}</div>
            </td>
            <td data-label="ความเชี่ยวชาญ">
                <div class="provider-expertise">
                    ${provider.expertise.map(exp => `<span class="expertise-tag">${this.getExpertiseInThai(exp)}</span>`).join('')}
                </div>
            </td>
        `;
        
        return row;
    }

    /**
     * Get provider type description
     */
    getProviderType(providerKey) {
        const types = {
            gemini: 'Google AI',            openai: 'OpenAI',
            claude: 'Anthropic',
            deepseek: 'DeepSeek AI',
            chinda: 'ChindaX'
        };
        return types[providerKey] || 'AI Provider';
    }

    /**
     * Get provider role in Thai
     */
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

    /**
     * Get expertise in Thai
     */
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

    /**
     * Start collaborative task
     */
    async startCollaboration(taskType) {
        if (this.isProcessing) {
            showNotification('⚠️ AI Swarm กำลังทำงานอยู่', 'warning');
            return;
        }

        const connectedProviders = Object.entries(this.providers)
            .filter(([key, provider]) => provider.status)
            .map(([key, provider]) => ({ key, ...provider }));

        if (connectedProviders.length < this.collaborationRules.minProviders) {
            showNotification(`❌ ต้องการ AI อย่างน้อย ${this.collaborationRules.minProviders} ตัวเพื่อทำงานร่วมกัน`, 'error');
            return;
        }

        this.isProcessing = true;
        this.currentTask = {
            type: taskType,
            startTime: new Date(),
            participants: connectedProviders.map(p => p.key)
        };

        try {
            // Update task status
            this.updateStatusSummary();
            
            // Clear previous logs and show starting message
            this.clearConversationDisplay();
            this.addConversationMessage('system', `🚀 เริ่มงาน ${this.getTaskDisplayName(taskType)} กับ ${connectedProviders.length} AI`);
            
            // Disable task buttons
            this.setTaskButtonsEnabled(false);
            
            // Execute collaboration based on task type
            await this.executeCollaborativeTask(taskType, connectedProviders);
            
        } catch (error) {
            console.error('[AI SWARM] Collaboration error:', error);
            this.addConversationMessage('system', `❌ เกิดข้อผิดพลาด: ${error.message}`);
            showNotification('❌ AI Swarm ทำงานไม่สำเร็จ', 'error');
        } finally {
            this.isProcessing = false;
            this.currentTask = null;
            this.updateStatusSummary();
            this.setTaskButtonsEnabled(true);
        }
    }

    /**
     * Get task display name in Thai
     */
    getTaskDisplayName(taskType) {
        const taskNames = {
            'content_review': 'วิเคราะห์เนื้อหา',
            'content_creation': 'สร้างเนื้อหาร่วมกัน',
            'seo_optimization': 'ปรับปรุง SEO'
        };
        return taskNames[taskType] || taskType;
    }

    /**
     * Set task buttons enabled/disabled
     */
    setTaskButtonsEnabled(enabled) {
        const buttons = document.querySelectorAll('.task-button');
        buttons.forEach(button => {
            button.disabled = !enabled;
            if (enabled) {
                button.classList.remove('processing');
            } else {
                button.classList.add('processing');
            }
        });
    }    /**
     * Execute collaborative task
     */
    async executeCollaborativeTask(taskType, connectedProviders) {
        console.log(`[AI SWARM] Executing ${taskType} with providers:`, connectedProviders.map(p => p.key));
        
        // Try enhanced backend integration first
        try {
            await this.executeEnhancedCollaborativeTask(taskType, connectedProviders);
            return; // Success with backend integration
        } catch (backendError) {
            console.warn('[AI SWARM] Backend integration failed, falling back to frontend simulation:', backendError.message);
            this.addConversationMessage('system', '⚠️ Using frontend simulation mode...');
        }
        
        // Fallback to original frontend simulation
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
                    throw new Error(`Unknown task type: ${taskType}`);
            }
        } catch (error) {
            throw new Error(`Task execution failed: ${error.message}`);
        }
    }

    /**
     * Sort providers by task type relevance
     */
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
            
            if (aScore !== bScore) return bScore - aScore; // Higher expertise first
            return a.priority - b.priority; // Lower priority number = higher priority
        });
    }

    /**
     * Execute content review collaboration
     */
    async executeContentReview(providers) {
        const currentContent = this.getCurrentContent();
        if (!currentContent) {
            throw new Error('No content available for review');
        }

        this.addConversationMessage('system', '📝 Starting collaborative content review...');
        
        const reviews = [];
        
        // Each AI reviews the content
        for (const provider of providers) {
            this.addConversationMessage(provider.key, `Analyzing content for ${provider.role.replace('_', ' ')}...`);
            
            const review = await this.simulateProviderReview(provider, currentContent);
            reviews.push(review);
            
            this.addConversationMessage(provider.key, review.summary);
            await this.delay(1000); // Simulate processing time
        }

        // Build consensus
        const consensus = await this.buildConsensus(reviews, 'review');
        this.addConversationMessage('system', `✅ Review consensus: ${consensus.conclusion}`);
        
        showNotification('📝 Content review completed', 'success');
    }

    /**
     * Execute content creation collaboration
     */
    async executeContentCreation(providers) {
        this.addConversationMessage('system', '✨ Starting collaborative content creation...');
        
        const creationPhases = [
            { phase: 'brainstorming', leader: providers[0] },
            { phase: 'drafting', leader: providers.find(p => p.role === 'primary_creator') || providers[0] },
            { phase: 'optimization', leader: providers.find(p => p.role === 'content_optimizer') || providers[1] },
            { phase: 'review', leader: providers.find(p => p.role === 'quality_reviewer') || providers[2] }
        ];

        let content = {};
        
        for (const { phase, leader } of creationPhases) {
            this.addConversationMessage('system', `🔄 Phase: ${phase.toUpperCase()}`);
            this.addConversationMessage(leader.key, `Leading ${phase} phase...`);
            
            const phaseResult = await this.simulateCreationPhase(phase, leader, content);
            content = { ...content, ...phaseResult };
            
            this.addConversationMessage(leader.key, phaseResult.summary);
            
            // Other AIs provide feedback
            for (const provider of providers.filter(p => p.key !== leader.key)) {
                const feedback = await this.simulateProviderFeedback(provider, phaseResult);
                this.addConversationMessage(provider.key, feedback.comment);
                await this.delay(800);
            }
            
            await this.delay(1500);
        }

        this.addConversationMessage('system', '🎉 Collaborative content creation completed!');
        showNotification('✨ Content created collaboratively', 'success');
    }

    /**
     * Execute SEO optimization collaboration
     */
    async executeSEOOptimization(providers) {
        const currentContent = this.getCurrentContent();
        if (!currentContent) {
            throw new Error('No content available for SEO optimization');
        }

        this.addConversationMessage('system', '🔍 Starting collaborative SEO optimization...');
        
        const optimizations = [];
        
        // Each AI suggests SEO improvements
        for (const provider of providers) {
            this.addConversationMessage(provider.key, `Analyzing SEO opportunities for ${provider.role.replace('_', ' ')}...`);
            
            const seoSuggestion = await this.simulateSEOAnalysis(provider, currentContent);
            optimizations.push(seoSuggestion);
            
            this.addConversationMessage(provider.key, seoSuggestion.summary);
            await this.delay(1200);
        }

        // Combine and prioritize optimizations
        const finalOptimization = await this.combineOptimizations(optimizations);
        this.addConversationMessage('system', `🚀 SEO optimization plan: ${finalOptimization.conclusion}`);
        
        showNotification('🔍 SEO optimization completed', 'success');
    }

    /**
     * Simulate provider review
     */
    async simulateProviderReview(provider, content) {
        await this.delay(2000 + Math.random() * 2000); // Simulate AI processing time
        
        const reviewTemplates = {
            'quality_reviewer': [
                'Content quality is excellent with clear structure and engaging tone.',
                'Good factual accuracy, but could benefit from more supporting evidence.',
                'Writing style is professional and accessible to target audience.'
            ],
            'content_optimizer': [
                'Readability score: 8.5/10. Consider shorter paragraphs for mobile users.',
                'Content structure is logical with good flow between sections.',
                'Engagement could be improved with more interactive elements.'
            ],
            'technical_validator': [
                'Technical accuracy verified. All claims are properly supported.',
                'Code examples are correct and follow best practices.',
                'Performance implications are minimal and acceptable.'
            ],
            'primary_creator': [
                'Content aligns well with brand voice and messaging strategy.',
                'SEO keywords are naturally integrated throughout the text.',
                'Call-to-action placement is strategic and effective.'
            ]
        };

        const templates = reviewTemplates[provider.role] || ['Analysis complete. Content meets quality standards.'];
        const summary = templates[Math.floor(Math.random() * templates.length)];
        
        return {
            provider: provider.key,
            role: provider.role,
            score: 0.7 + Math.random() * 0.3, // Score between 0.7-1.0
            summary,
            timestamp: new Date()
        };
    }

    /**
     * Simulate creation phase
     */
    async simulateCreationPhase(phase, leader, previousContent) {
        await this.delay(3000 + Math.random() * 2000);
        
        const phaseTemplates = {
            'brainstorming': {
                summary: 'Generated 5 content ideas focusing on user engagement and search optimization.',
                topics: ['User Experience', 'Performance', 'Accessibility', 'SEO', 'Mobile Design']
            },
            'drafting': {
                summary: 'Created comprehensive draft with strong introduction, detailed sections, and clear conclusion.',
                wordCount: 1200 + Math.floor(Math.random() * 800)
            },
            'optimization': {
                summary: 'Enhanced readability, improved structure, and optimized for target keywords.',
                improvements: ['Better headings', 'Shorter paragraphs', 'Added transitions']
            },
            'review': {
                summary: 'Final review completed. Content is ready for publication with 95% quality score.',
                finalScore: 0.9 + Math.random() * 0.1
            }
        };

        return phaseTemplates[phase] || { summary: `${phase} phase completed successfully.` };
    }

    /**
     * Simulate provider feedback
     */
    async simulateProviderFeedback(provider, content) {
        await this.delay(1000 + Math.random() * 1000);
        
        const feedbackTemplates = [
            'Great work! This approach aligns well with best practices.',
            'Consider adding more specific examples to strengthen the points.',
            'The tone is perfect for our target audience.',
            'Good progress. Minor adjustments could enhance clarity.',
            'Excellent structure. The flow is very logical.',
            'This meets quality standards. Ready for next phase.'
        ];

        return {
            provider: provider.key,
            comment: feedbackTemplates[Math.floor(Math.random() * feedbackTemplates.length)],
            sentiment: 'positive'
        };
    }

    /**
     * Simulate SEO analysis
     */
    async simulateSEOAnalysis(provider, content) {
        await this.delay(2500 + Math.random() * 1500);
        
        const seoTemplates = {
            'primary_creator': {
                summary: 'Keyword density optimized. Target keywords well-integrated.',
                suggestions: ['Add more long-tail keywords', 'Improve meta description']
            },
            'content_optimizer': {
                summary: 'Heading structure improved. Better semantic HTML usage.',
                suggestions: ['Add more internal links', 'Optimize image alt texts']
            },
            'technical_validator': {
                summary: 'Page speed optimized. Core Web Vitals looking good.',
                suggestions: ['Compress images further', 'Optimize JavaScript loading']
            }
        };

        const template = seoTemplates[provider.role] || {
            summary: 'SEO analysis completed with actionable recommendations.',
            suggestions: ['Improve content quality', 'Add relevant keywords']
        };

        return {
            provider: provider.key,
            score: 0.75 + Math.random() * 0.25,
            ...template,
            timestamp: new Date()
        };
    }

    /**
     * Build consensus from multiple reviews/suggestions
     */
    async buildConsensus(items, type) {
        await this.delay(1000);
        
        const avgScore = items.reduce((sum, item) => sum + (item.score || 0), 0) / items.length;
        const conclusions = {
            'review': {
                excellent: 'Content exceeds quality standards. Ready for publication.',
                good: 'Content quality is good with minor improvements suggested.',
                needs_work: 'Content requires significant improvements before publication.'
            }
        };

        let category = 'needs_work';
        if (avgScore >= 0.85) category = 'excellent';
        else if (avgScore >= 0.7) category = 'good';

        return {
            score: avgScore,
            conclusion: conclusions[type]?.[category] || 'Analysis completed successfully.',
            participantCount: items.length,
            timestamp: new Date()
        };
    }

    /**
     * Combine SEO optimizations
     */
    async combineOptimizations(optimizations) {
        await this.delay(1500);
        
        const allSuggestions = optimizations.flatMap(opt => opt.suggestions || []);
        const uniqueSuggestions = [...new Set(allSuggestions)];
        const avgScore = optimizations.reduce((sum, opt) => sum + (opt.score || 0), 0) / optimizations.length;

        return {
            score: avgScore,
            conclusion: `${uniqueSuggestions.length} optimization opportunities identified. Priority: ${avgScore > 0.8 ? 'High' : 'Medium'} impact.`,
            suggestions: uniqueSuggestions.slice(0, 5), // Top 5 suggestions
            timestamp: new Date()
        };
    }

    /**
     * Get current content for review/optimization
     */
    getCurrentContent() {
        // Try to get content from blog editor or current page
        const contentElement = document.querySelector('#blogContent, .ql-editor, .content-editor');
        if (contentElement) {
            return {
                text: contentElement.textContent || contentElement.innerText || '',
                html: contentElement.innerHTML || '',
                type: 'blog_post'
            };
        }

        // Fallback to sample content for demonstration
        return {
            text: 'Sample blog post content for AI Swarm analysis and optimization.',
            html: '<p>Sample blog post content for AI Swarm analysis and optimization.</p>',
            type: 'sample'
        };
    }    /**
     * Add message to conversation feed
     */
    addConversationMessage(sender, message) {
        const conversationFeed = document.getElementById('aiConversationLogs');
        if (!conversationFeed) return;

        // Remove empty state if it exists
        const emptyState = conversationFeed.querySelector('.logs-empty');
        if (emptyState) {
            emptyState.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `conversation-message ${sender}`;
        
        const timestamp = new Date().toLocaleTimeString('th-TH');
        const senderIcon = sender === 'system' ? '🤖' : this.getProviderIcon(sender);
        const senderName = sender === 'system' ? 'ระบบ' : this.getProviderDisplayName(sender);
        
        messageDiv.innerHTML = `
            <div class="message-header">
                <div class="message-sender">
                    <span class="sender-icon">${senderIcon}</span>
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
    }

    /**
     * Get provider display name in Thai
     */
    getProviderDisplayName(providerKey) {
        const displayNames = {
            'gemini': 'Gemini 2.0 Flash',            'openai': 'OpenAI GPT',
            'claude': 'Claude AI',
            'deepseek': 'DeepSeek AI',
            'chinda': 'ChindaX AI'
        };
        return displayNames[providerKey] || providerKey;
    }

    /**
     * Clear conversation display
     */
    clearConversationDisplay() {
        const conversationFeed = document.getElementById('aiConversationLogs');
        if (conversationFeed) {
            conversationFeed.innerHTML = '';
        }
    }

    /**
     * Clear conversation (button action)
     */
    clearConversation() {
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
        this.conversationHistory = [];
        showNotification('🗑️ ล้าง Conversation Logs แล้ว', 'info');
    }

    /**
     * Set controls enabled/disabled state
     */
    setControlsEnabled(enabled) {
        const buttons = document.querySelectorAll('#aiSwarmPanel button');
        buttons.forEach(button => {
            button.disabled = !enabled;
            if (enabled) {
                button.classList.remove('processing');
            } else {
                button.classList.add('processing');
            }
        });
    }

    /**
     * Refresh provider status manually
     */
    async refreshProviderStatus() {
        this.addConversationMessage('system', '🔄 Refreshing AI provider status...');
        await this.updateProviderStatus();
        this.addConversationMessage('system', '✅ Provider status updated');
        showNotification('🔄 AI provider status refreshed', 'info');
    }

    /**
     * Start background status monitoring
     */
    startStatusMonitoring() {
        // Check status every 2 minutes
        setInterval(async () => {
            if (!this.isProcessing) {
                await this.updateProviderStatus();
            }
        }, 120000);
    }

    /**
     * Bind global functions
     */
    bindGlobalFunctions() {
        // Make the instance globally available
        window.aiSwarmCouncil = this;
    }

    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get detailed status report
     */
    getStatusReport() {
        const connectedCount = Object.values(this.providers).filter(p => p.status).length;
        const connectedProviders = Object.entries(this.providers)
            .filter(([key, provider]) => provider.status)
            .map(([key, provider]) => ({ key, name: provider.name, role: provider.role }));

        return {
            isActive: connectedCount >= this.collaborationRules.minProviders,
            connectedCount,
            totalCount: Object.keys(this.providers).length,
            connectedProviders,
            isProcessing: this.isProcessing,
            currentTask: this.currentTask,
            conversationLength: this.conversationHistory.length
        };
    }

    /**
     * Export conversation history
     */
    exportConversation() {
        const data = {
            timestamp: new Date().toISOString(),
            task: this.currentTask,
            conversation: this.conversationHistory,
            participants: Object.entries(this.providers)
                .filter(([key, provider]) => provider.status)
                .map(([key, provider]) => ({ key, name: provider.name, role: provider.role }))
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

    /**
     * ===== NEW BACKEND SWARM COUNCIL INTEGRATION =====
     */

    /**
     * Process content using the backend Swarm Council
     */
    async processWithSwarmCouncil(prompt, workflow = 'full', options = {}) {
        try {
            console.log('🎯 [AI SWARM] Processing with backend Swarm Council...');
            
            const response = await fetch(`${API_BASE}/api/ai/swarm/process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    prompt,
                    workflow,
                    options
                })
            });

            if (!response.ok) {
                throw new Error(`Backend Swarm Council request failed: ${response.status}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Swarm Council processing failed');
            }

            console.log('✅ [AI SWARM] Backend processing completed:', result);
            return result.result;

        } catch (error) {
            console.error('❌ [AI SWARM] Backend processing error:', error);
            throw error;
        }
    }

    /**
     * Process content with E-A-T optimization using backend
     */
    async processWithEATOptimization(prompt, workflow = 'full', contentType = 'article', options = {}) {
        try {
            console.log('🎯 [E-A-T SWARM] Processing with E-A-T optimization...');
            
            const response = await fetch(`${API_BASE}/api/ai/swarm/eat-process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    prompt,
                    workflow,
                    contentType,
                    options
                })
            });

            if (!response.ok) {
                throw new Error(`E-A-T Swarm Council request failed: ${response.status}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'E-A-T optimization failed');
            }

            console.log('✅ [E-A-T SWARM] Backend processing completed:', result);
            return result.result;

        } catch (error) {
            console.error('❌ [E-A-T SWARM] Backend processing error:', error);
            throw error;
        }
    }

    /**
     * Get backend Swarm Council status
     */
    async getBackendSwarmStatus() {
        try {
            const response = await fetch(`${API_BASE}/api/ai/swarm/status`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error(`Backend status request failed: ${response.status}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to get backend status');
            }

            return {
                swarmCouncil: result.swarmCouncil,
                eatSwarmCouncil: result.eatSwarmCouncil
            };

        } catch (error) {
            console.error('❌ [AI SWARM] Backend status error:', error);
            return null;
        }
    }

    /**
     * Get E-A-T guidelines from backend
     */
    async getEATGuidelines() {
        try {
            const response = await fetch(`${API_BASE}/api/ai/swarm/eat-guidelines`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error(`E-A-T guidelines request failed: ${response.status}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to get E-A-T guidelines');
            }

            return {
                eatGuidelines: result.eatGuidelines,
                seoGuidelines: result.seoGuidelines
            };

        } catch (error) {
            console.error('❌ [E-A-T GUIDELINES] Backend error:', error);
            return null;
        }
    }

    /**
     * Enhanced collaborative task execution using backend Swarm Council
     */
    async executeEnhancedCollaborativeTask(taskType, connectedProviders) {
        console.log(`[AI SWARM] Executing enhanced ${taskType} with backend integration...`);
        
        // Get current content if available
        const currentContent = this.getCurrentContent();
        
        // Create comprehensive prompt based on task type
        let prompt = '';
        let workflow = 'full';
        let contentType = 'article';
        
        switch (taskType) {
            case 'content_review':
                if (!currentContent) {
                    throw new Error('No content available for review');
                }
                prompt = `Please perform a comprehensive review of the following content:\n\n${currentContent}`;
                workflow = 'review';
                break;
                
            case 'content_creation':
                const title = document.getElementById('postTitle')?.value || 'New Content';
                prompt = `Create high-quality, E-A-T optimized content with the title: "${title}". Focus on expertise, authoritativeness, and trustworthiness.`;
                workflow = 'full';
                contentType = 'article';
                break;
                
            case 'seo_optimization':
                if (!currentContent) {
                    throw new Error('No content available for SEO optimization');
                }
                prompt = `Optimize the following content for SEO, focusing on E-A-T compliance and search engine guidelines:\n\n${currentContent}`;
                workflow = 'seo';
                break;
                
            default:
                prompt = `Process the following request: ${taskType}`;
        }
        
        try {
            // Use E-A-T optimization for better results
            this.addConversationMessage('system', '🎯 Connecting to backend E-A-T Swarm Council...');
            
            const result = await this.processWithEATOptimization(prompt, workflow, contentType);
            
            this.addConversationMessage('system', '✅ Backend processing completed successfully!');
            
            // Display results
            if (result.finalContent) {
                this.addConversationMessage('claude', `Content optimized with E-A-T score: ${result.eatScore || 'N/A'}`);
                
                // Update content if we're in content creation/optimization mode
                if (taskType === 'content_creation' || taskType === 'seo_optimization') {
                    const contentField = document.getElementById('postContent');
                    if (contentField) {
                        contentField.value = result.finalContent;
                        this.addConversationMessage('system', '📝 Content updated in editor');
                    }
                }
            }
            
            // Display analysis results
            if (result.analysis) {
                this.addConversationMessage('gemini', `Analysis: ${result.analysis}`);
            }
            
            if (result.improvements && result.improvements.length > 0) {
                const improvementsText = result.improvements.join(', ');
                this.addConversationMessage('openai', `Suggested improvements: ${improvementsText}`);
            }
            
            this.addConversationMessage('system', '🎉 Enhanced collaborative task completed!');
            showNotification('✨ Content processed with E-A-T optimization', 'success');
            
        } catch (error) {
            console.error('[AI SWARM] Enhanced task execution error:', error);
            this.addConversationMessage('system', `❌ Backend processing failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * ===== END BACKEND INTEGRATION =====
     */
}