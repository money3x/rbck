const ProviderFactory = require('../providers/factory/ProviderFactory');
const { getEnabledProviders } = require('../providers/config/providers.config');

class SwarmCouncil {
    constructor(options = {}) {
        // Handle both old boolean parameter and new options object
        const autoInit = typeof options === 'boolean' ? options : options.autoInit || false;
        this.providerPool = options.providerPool || null;
        
        this.providers = {};
        this.roles = {};
        this.isInitialized = false;
        this.initializationErrors = [];
        this.lastInitializationAttempt = null;
        this.healthChecks = new Map();
        
        // Only auto-initialize if explicitly requested
        if (autoInit) {
            console.log('🤖 [Swarm] Auto-initialization requested');
            this.initializeSwarm();
        } else {
            console.log('🤖 [Swarm] Created without auto-initialization');
        }
    }
    
    async initializeSwarm() {
        this.lastInitializationAttempt = new Date().toISOString();
        this.initializationErrors = [];
        
        try {
            console.log('🤖 [Swarm] Initializing AI Swarm Council...');
            
            const enabledProviders = getEnabledProviders();
            
            if (!enabledProviders || Object.keys(enabledProviders).length === 0) {
                throw new Error('No enabled providers found in configuration');
            }
            
            let successfulInitializations = 0;
            let totalProviders = Object.keys(enabledProviders).length;
            
            for (const [providerName, config] of Object.entries(enabledProviders)) {
                try {
                    console.log(`🔄 [Swarm] Initializing ${providerName}...`);
                    
                    // Validate provider config
                    if (!config || !config.name) {
                        throw new Error(`Invalid configuration for provider ${providerName}`);
                    }
                    
                    // Create provider instance with timeout
                    const provider = await this.createProviderWithTimeout(providerName, 10000);
                    
                    if (!provider) {
                        throw new Error(`Failed to create provider instance for ${providerName}`);
                    }
                    
                    // Set provider properties with error handling
                    try {
                        if (typeof provider.setRole === 'function') {
                            provider.setRole(config.role || 'general');
                        }
                        if (typeof provider.setSpecialties === 'function') {
                            provider.setSpecialties(config.specialties || []);
                        }
                        if (typeof provider.setCouncilContext === 'function') {
                            provider.setCouncilContext(this);
                        }
                    } catch (setupError) {
                        console.warn(`⚠️ [Swarm] Provider ${providerName} setup incomplete:`, setupError.message);
                        // Continue with provider even if setup fails
                    }
                    
                    // Store provider
                    this.providers[providerName] = provider;
                    if (config.role) {
                        this.roles[config.role] = providerName;
                    }
                    
                    // Initialize health check
                    this.healthChecks.set(providerName, {
                        lastCheck: new Date(),
                        status: 'healthy',
                        responseTime: 0
                    });
                    
                    successfulInitializations++;
                    console.log(`✅ [Swarm] ${config.name} initialized as ${config.role || 'general'} (${successfulInitializations}/${totalProviders})`);
                    
                } catch (error) {
                    const errorDetails = {
                        provider: providerName,
                        error: error.message,
                        timestamp: new Date().toISOString(),
                        config: config ? config.name : 'Unknown'
                    };
                    
                    this.initializationErrors.push(errorDetails);
                    console.error(`❌ [Swarm] Failed to initialize ${providerName}:`, error.message);
                    
                    // Log additional debug info for troubleshooting
                    if (process.env.NODE_ENV === 'development') {
                        console.error(`❌ [Swarm] ${providerName} debug info:`, {
                            configExists: !!config,
                            configKeys: config ? Object.keys(config) : [],
                            errorStack: error.stack
                        });
                    }
                }
            }
            
            // Determine initialization status
            if (successfulInitializations === 0) {
                this.isInitialized = false;
                const errorMsg = `No providers could be initialized. Errors: ${this.initializationErrors.map(e => e.error).join(', ')}`;
                console.error(`❌ [Swarm] Complete initialization failure:`, errorMsg);
                throw new Error(errorMsg);
            } else if (successfulInitializations < totalProviders) {
                this.isInitialized = true; // Partial success is still operational
                console.warn(`⚠️ [Swarm] Partial initialization: ${successfulInitializations}/${totalProviders} providers active`);
                console.warn(`⚠️ [Swarm] Failed providers: ${this.initializationErrors.map(e => e.provider).join(', ')}`);
            } else {
                this.isInitialized = true;
                console.log(`✅ [Swarm] Complete initialization: ${successfulInitializations}/${totalProviders} providers active`);
            }
            
            console.log(`🎯 [Swarm] Council ready with ${Object.keys(this.providers).length} active members`);
            
            // Start periodic health checks
            this.startHealthMonitoring();
            
        } catch (error) {
            this.isInitialized = false;
            const finalError = {
                general: 'SwarmCouncil initialization failed',
                error: error.message,
                timestamp: new Date().toISOString(),
                providerErrors: this.initializationErrors
            };
            
            this.initializationErrors.push(finalError);
            console.error('❌ [Swarm] Fatal initialization error:', error.message);
            console.error('❌ [Swarm] All errors:', this.initializationErrors);
        }
    }
    
    /**
     * Initialize SwarmCouncil using shared provider pool from manager
     */
    async initializeWithSharedPool() {
        if (!this.providerPool) {
            console.warn('⚠️ [Swarm] No provider pool available, falling back to standard initialization');
            return await this.initializeSwarm();
        }
        
        console.log('🤖 [Swarm] Initializing with shared provider pool...');
        this.lastInitializationAttempt = new Date().toISOString();
        this.initializationErrors = [];
        
        try {
            // Get providers from shared pool
            const poolStatus = this.providerPool.getStatus();
            const availableProviders = poolStatus.providers || {};
            
            if (Object.keys(availableProviders).length === 0) {
                throw new Error('No providers available in shared pool');
            }
            
            console.log(`🤖 [Swarm] Found ${Object.keys(availableProviders).length} providers in pool`);
            
            // Use providers from the pool
            let successfulInitializations = 0;
            for (const [providerName, providerInfo] of Object.entries(availableProviders)) {
                try {
                    if (providerInfo.status === 'healthy') {
                        // Get provider instance from pool (sync method)
                        const provider = this.providerPool.getProvider(providerName);
                        
                        if (provider) {
                            this.providers[providerName] = provider;
                            
                            // Set role based on provider configuration  
                            const enabledProviders = require('../providers/config/providers.config').getEnabledProviders();
                            const config = enabledProviders[providerName] || {};
                            if (config.role) {
                                this.roles[config.role] = providerName;
                            }
                            
                            // Initialize health check
                            this.healthChecks.set(providerName, {
                                lastCheck: new Date(),
                                status: 'healthy',
                                responseTime: 0
                            });
                            
                            successfulInitializations++;
                            console.log(`✅ [Swarm] Shared provider ${providerName} added to council`);
                        } else {
                            throw new Error(`Provider ${providerName} not available from pool`);
                        }
                    } else {
                        console.warn(`⚠️ [Swarm] Skipping unhealthy provider ${providerName}: ${providerInfo.status}`);
                    }
                } catch (error) {
                    console.warn(`⚠️ [Swarm] Failed to add shared provider ${providerName}:`, error.message);
                    this.initializationErrors.push({
                        provider: providerName,
                        error: error.message,
                        timestamp: new Date().toISOString()
                    });
                }
            }
            
            // Determine initialization status
            if (successfulInitializations === 0) {
                this.isInitialized = false;
                throw new Error('No providers could be initialized from shared pool');
            } else {
                this.isInitialized = true;
                console.log(`✅ [Swarm] Shared pool initialization complete: ${successfulInitializations} providers active`);
                
                // Start health monitoring
                this.startHealthMonitoring();
            }
            
        } catch (error) {
            this.isInitialized = false;
            console.error('❌ [Swarm] Shared pool initialization failed:', error.message);
            this.initializationErrors.push({
                general: 'Shared pool initialization failed',
                error: error.message,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }
    
    async processContent(prompt, workflow = 'full') {
        if (!this.isInitialized) {
            const errorDetails = {
                message: 'Swarm Council not properly initialized',
                errors: this.initializationErrors,
                lastAttempt: this.lastInitializationAttempt,
                availableProviders: Object.keys(this.providers)
            };
            throw new Error(`Swarm Council not ready: ${JSON.stringify(errorDetails)}`);
        }
        
        // Validate workflow input
        if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
            throw new Error('Invalid prompt: must be a non-empty string');
        }
        
        const result = {
            originalPrompt: prompt,
            workflow: workflow,
            steps: [],
            finalContent: null,
            metadata: {
                timestamp: new Date().toISOString(),
                participatingProviders: Object.keys(this.providers),
                workflowType: workflow
            }
        };
        
        try {
            console.log(`🎯 [Swarm] Starting ${workflow} workflow for: "${prompt.substring(0, 50)}..."`);
            
            switch (workflow) {
                case 'full':
                    return await this.executeWorkflowSafely(() => this.fullSwarmWorkflow(prompt, result), 'full', result);
                case 'create':
                    return await this.executeWorkflowSafely(() => this.creationWorkflow(prompt, result), 'create', result);
                case 'review':
                    return await this.executeWorkflowSafely(() => this.reviewWorkflow(prompt, result), 'review', result);
                case 'optimize':
                    return await this.executeWorkflowSafely(() => this.optimizationWorkflow(prompt, result), 'optimize', result);
                default:
                    throw new Error(`Unknown workflow: ${workflow}. Available workflows: full, create, review, optimize`);
            }
        } catch (error) {
            console.error('❌ [Swarm] Processing error:', error);
            result.error = error.message;
            result.status = 'failed';
            return result;
        }
    }
    
    async fullSwarmWorkflow(prompt, result) {
        console.log('🔄 [Swarm] Executing full council workflow...');
        
        // Step 1: Content Creation
        if (this.providers.gemini) {
            console.log('📝 [Swarm] Step 1: Content Creation (Gemini)');
            const creationPrompt = `${prompt}\n\nRole: นักสร้างสรรค์หลัก - สร้างเนื้อหาที่สร้างสรรค์และครอบคลุม`;
            const createdContent = await this.providers.gemini.generateContent(creationPrompt);
            
            result.steps.push({
                step: 1,
                role: 'นักสร้างสรรค์หลัก',
                provider: 'gemini',
                output: createdContent,
                timestamp: new Date().toISOString()
            });
            result.finalContent = createdContent;
        }
        
        // Step 2: Quality Review
        if (this.providers.openai && result.finalContent) {
            console.log('🔍 [Swarm] Step 2: Quality Review (OpenAI)');
            const reviewPrompt = `กรุณาตรวจสอบและปรับปรุงคุณภาพของเนื้อหาต่อไปนี้:\n\n${result.finalContent}\n\nRole: ผู้ตรวจสอบคุณภาพ - ตรวจสอบความถูกต้อง ความสอดคล้อง และคุณภาพโดยรวม`;
            const reviewedContent = await this.providers.openai.generateContent(reviewPrompt);
            
            result.steps.push({
                step: 2,
                role: 'ผู้ตรวจสอบคุณภาพ',
                provider: 'openai',
                output: reviewedContent,
                timestamp: new Date().toISOString()
            });
            result.finalContent = reviewedContent;
        }
        
        // Step 3: Content Enhancement
        if (this.providers.claude && result.finalContent) {
            console.log('✨ [Swarm] Step 3: Content Enhancement (Claude)');
            const enhancePrompt = `กรุณาปรับปรุงโครงสร้างและความน่าสนใจของเนื้อหาต่อไปนี้:\n\n${result.finalContent}\n\nRole: ผู้ปรับปรุงเนื้อหา - ปรับโครงสร้างให้อ่านง่ายและน่าสนใจยิ่งขึ้น`;
            const enhancedContent = await this.providers.claude.generateContent(enhancePrompt);
            
            result.steps.push({
                step: 3,
                role: 'ผู้ปรับปรุงเนื้อหา',
                provider: 'claude',
                output: enhancedContent,
                timestamp: new Date().toISOString()
            });
            result.finalContent = enhancedContent;
        }
        
        // Step 4: Technical Review
        if (this.providers.deepseek && result.finalContent) {
            console.log('🔬 [Swarm] Step 4: Technical Review (DeepSeek)');
            const techPrompt = `กรุณาตรวจสอบความถูกต้องทางเทคนิคของเนื้อหาต่อไปนี้:\n\n${result.finalContent}\n\nRole: ผู้ตรวจสอบเทคนิค - ตรวจสอบความถูกต้องทางเทคนิคและประสิทธิภาพ`;
            const techReview = await this.providers.deepseek.generateContent(techPrompt);
            
            result.steps.push({
                step: 4,
                role: 'ผู้ตรวจสอบเทคนิค',
                provider: 'deepseek',
                output: techReview,
                timestamp: new Date().toISOString()
            });
            result.finalContent = techReview;
        }
        
        // Step 5: Cultural Optimization
        if (this.providers.chinda && result.finalContent) {
            console.log('🇹🇭 [Swarm] Step 5: Cultural Optimization (ChindaX)');
            const culturalPrompt = `กรุณาปรับปรุงภาษาไทยและความเหมาะสมทางวัฒนธรรมของเนื้อหาต่อไปนี้:\n\n${result.finalContent}\n\nRole: ที่ปรึกษาภาษา - ปรับภาษาไทยและความเหมาะสมทางวัฒนธรรม`;
            const culturalOptimized = await this.providers.chinda.generateContent(culturalPrompt);
            
            result.steps.push({
                step: 5,
                role: 'ที่ปรึกษาภาษา',
                provider: 'chinda',
                output: culturalOptimized,
                timestamp: new Date().toISOString()
            });
            result.finalContent = culturalOptimized;
        }
        
        result.status = 'completed';
        console.log(`✅ [Swarm] Full workflow completed with ${result.steps.length} steps`);
        return result;
    }
    
    async creationWorkflow(prompt, result) {
        console.log('📝 [Swarm] Executing creation workflow...');
        
        if (this.providers.gemini) {
            const content = await this.providers.gemini.generateContent(
                `${prompt}\n\nRole: นักสร้างสรรค์หลัก - โฟกัสที่การสร้างเนื้อหาที่สร้างสรรค์และมีคุณภาพ`
            );
            
            result.steps.push({
                step: 1,
                role: 'นักสร้างสรรค์หลัก',
                provider: 'gemini',
                output: content,
                timestamp: new Date().toISOString()
            });
            result.finalContent = content;
        }
        
        result.status = 'completed';
        return result;
    }
    
    async reviewWorkflow(prompt, result) {
        console.log('🔍 [Swarm] Executing review workflow...');
        
        if (this.providers.openai) {
            const review = await this.providers.openai.generateContent(
                `${prompt}\n\nRole: ผู้ตรวจสอบคุณภาพ - ทำการตรวจสอบและให้ข้อเสนอแนะที่สร้างสรรค์`
            );
            
            result.steps.push({
                step: 1,
                role: 'ผู้ตรวจสอบคุณภาพ',
                provider: 'openai',
                output: review,
                timestamp: new Date().toISOString()
            });
            result.finalContent = review;
        }
        
        result.status = 'completed';
        return result;
    }
    
    async optimizationWorkflow(prompt, result) {
        console.log('⚡ [Swarm] Executing optimization workflow...');
        
        if (this.providers.claude) {
            const optimized = await this.providers.claude.generateContent(
                `${prompt}\n\nRole: ผู้ปรับปรุงเนื้อหา - ปรับปรุงและเพิ่มประสิทธิภาพของเนื้อหา`
            );
            
            result.steps.push({
                step: 1,
                role: 'ผู้ปรับปรุงเนื้อหา',
                provider: 'claude',
                output: optimized,
                timestamp: new Date().toISOString()
            });
            result.finalContent = optimized;
        }
        
        result.status = 'completed';
        return result;
    }
    
    getCouncilStatus() {
        const status = {
            initialized: this.isInitialized,
            totalMembers: Object.keys(this.providers).length,
            activeMembers: {},
            roles: {},
            capabilities: []
        };
        
        Object.entries(this.providers).forEach(([name, provider]) => {
            status.activeMembers[name] = {
                available: true,
                role: provider.role || 'Unknown',
                specialties: provider.specialties || []
            };
        });
        
        Object.entries(this.roles).forEach(([role, provider]) => {
            status.roles[role] = provider;
        });
        
        status.capabilities = [
            'full', 'create', 'review', 'optimize'
        ];
        
        return status;
    }
    
    async consultMember(memberRole, question) {
        const memberProvider = this.roles[memberRole];
        if (!memberProvider || !this.providers[memberProvider]) {
            throw new Error(`No member found with role: ${memberRole}`);
        }
        
        return await this.providers[memberProvider].generateContent(question);
    }
    
    /**
     * Create provider with timeout protection
     */
    async createProviderWithTimeout(providerName, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Provider ${providerName} initialization timeout after ${timeout}ms`));
            }, timeout);
            
            try {
                const provider = ProviderFactory.createProvider(providerName);
                clearTimeout(timeoutId);
                resolve(provider);
            } catch (error) {
                clearTimeout(timeoutId);
                reject(error);
            }
        });
    }
    
    /**
     * Execute workflow with comprehensive error handling
     */
    async executeWorkflowSafely(workflowFunction, workflowName, result) {
        try {
            const startTime = Date.now();
            const workflowResult = await workflowFunction();
            const duration = Date.now() - startTime;
            
            workflowResult.metadata = workflowResult.metadata || {};
            workflowResult.metadata.executionTime = duration;
            workflowResult.metadata.workflowName = workflowName;
            
            return workflowResult;
        } catch (error) {
            console.error(`❌ [Swarm] ${workflowName} workflow failed:`, error.message);
            
            result.status = 'failed';
            result.error = error.message;
            result.metadata = result.metadata || {};
            result.metadata.failedWorkflow = workflowName;
            result.metadata.errorTimestamp = new Date().toISOString();
            
            // Attempt graceful degradation
            if (Object.keys(this.providers).length > 0) {
                console.log(`🔄 [Swarm] Attempting graceful degradation for ${workflowName}...`);
                result.fallbackContent = await this.attemptFallbackContent(result.originalPrompt);
                result.status = 'degraded';
            }
            
            return result;
        }
    }
    
    /**
     * Attempt fallback content generation with any available provider
     */
    async attemptFallbackContent(prompt) {
        const availableProviders = Object.keys(this.providers);
        
        for (const providerName of availableProviders) {
            try {
                console.log(`🔄 [Swarm] Trying fallback with ${providerName}...`);
                const provider = this.providers[providerName];
                
                if (provider && typeof provider.generateContent === 'function') {
                    const content = await provider.generateContent(`${prompt}\n\n[Fallback mode - simple response requested]`);
                    console.log(`✅ [Swarm] Fallback successful with ${providerName}`);
                    return content;
                }
            } catch (error) {
                console.warn(`⚠️ [Swarm] Fallback failed with ${providerName}:`, error.message);
                continue;
            }
        }
        
        return 'Unable to generate content - all providers failed';
    }
    
    /**
     * Start periodic health monitoring for providers
     */
    startHealthMonitoring() {
        if (this.healthMonitoringInterval) {
            clearInterval(this.healthMonitoringInterval);
        }
        
        this.healthMonitoringInterval = setInterval(async () => {
            await this.performHealthChecks();
        }, 300000); // Check every 5 minutes
        
        console.log('📊 [Swarm] Health monitoring started (5min intervals)');
    }
    
    /**
     * Perform health checks on all providers
     */
    async performHealthChecks() {
        console.log('💓 [Swarm] Performing health checks...');
        
        for (const [providerName, provider] of Object.entries(this.providers)) {
            try {
                const startTime = Date.now();
                
                // Simple health check
                if (typeof provider.checkHealth === 'function') {
                    await provider.checkHealth();
                } else if (typeof provider.generateContent === 'function') {
                    await provider.generateContent('Health check');
                }
                
                const responseTime = Date.now() - startTime;
                
                this.healthChecks.set(providerName, {
                    lastCheck: new Date(),
                    status: 'healthy',
                    responseTime: responseTime
                });
                
                console.log(`✅ [Swarm] ${providerName} health check passed (${responseTime}ms)`);
                
            } catch (error) {
                this.healthChecks.set(providerName, {
                    lastCheck: new Date(),
                    status: 'unhealthy',
                    error: error.message,
                    responseTime: null
                });
                
                console.warn(`❌ [Swarm] ${providerName} health check failed:`, error.message);
            }
        }
    }
    
    /**
     * Get basic status (alias for getCouncilStatus for compatibility)
     */
    getStatus() {
        return this.getCouncilStatus();
    }
    
    /**
     * Get comprehensive swarm status including health and errors
     */
    getDetailedStatus() {
        const basicStatus = this.getCouncilStatus();
        
        return {
            ...basicStatus,
            initialization: {
                isInitialized: this.isInitialized,
                lastAttempt: this.lastInitializationAttempt,
                errors: this.initializationErrors,
                successfulProviders: Object.keys(this.providers),
                failedProviders: this.initializationErrors.map(e => e.provider).filter(Boolean)
            },
            health: {
                checks: Object.fromEntries(this.healthChecks),
                lastMonitoringCheck: new Date().toISOString(),
                overallHealth: this.calculateOverallHealth()
            },
            capabilities: {
                workflows: ['full', 'create', 'review', 'optimize'],
                fallbackEnabled: Object.keys(this.providers).length > 0,
                healthMonitoring: !!this.healthMonitoringInterval
            }
        };
    }
    
    /**
     * Calculate overall health percentage
     */
    calculateOverallHealth() {
        if (this.healthChecks.size === 0) return 0;
        
        let healthyCount = 0;
        for (const [providerName, health] of this.healthChecks) {
            if (health.status === 'healthy') healthyCount++;
        }
        
        return Math.round((healthyCount / this.healthChecks.size) * 100);
    }
    
    /**
     * Reinitialize the swarm council
     */
    async reinitialize() {
        console.log('🔄 [Swarm] Reinitializing SwarmCouncil...');
        
        // Stop health monitoring
        if (this.healthMonitoringInterval) {
            clearInterval(this.healthMonitoringInterval);
            this.healthMonitoringInterval = null;
        }
        
        // Clear existing state
        this.providers = {};
        this.roles = {};
        this.isInitialized = false;
        this.initializationErrors = [];
        this.healthChecks.clear();
        
        // Reinitialize
        await this.initializeSwarm();
        
        return this.getDetailedStatus();
    }
    
    /**
     * Cleanup resources
     */
    destroy() {
        console.log('🗑️ [Swarm] Destroying SwarmCouncil...');
        
        if (this.healthMonitoringInterval) {
            clearInterval(this.healthMonitoringInterval);
        }
        
        // Cleanup providers if they have cleanup methods
        for (const [providerName, provider] of Object.entries(this.providers)) {
            if (typeof provider.destroy === 'function') {
                try {
                    provider.destroy();
                } catch (error) {
                    console.warn(`⚠️ [Swarm] Provider ${providerName} cleanup failed:`, error.message);
                }
            }
        }
        
        this.providers = {};
        this.roles = {};
        this.healthChecks.clear();
        this.isInitialized = false;
    }
}

module.exports = SwarmCouncil;
