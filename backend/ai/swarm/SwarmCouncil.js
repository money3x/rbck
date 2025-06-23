const ProviderFactory = require('../providers/factory/ProviderFactory');
const { getEnabledProviders } = require('../providers/config/providers.config');

class SwarmCouncil {
    constructor() {
        this.providers = {};
        this.roles = {};
        this.isInitialized = false;
        this.initializeSwarm();
    }
    
    initializeSwarm() {
        try {
            const enabledProviders = getEnabledProviders();
            console.log('🤖 [Swarm] Initializing AI Swarm Council...');
            
            Object.entries(enabledProviders).forEach(([providerName, config]) => {
                try {
                    // Create provider instance
                    const provider = ProviderFactory.createProvider(providerName);
                    
                    // Set role and context
                    provider.setRole(config.role);
                    provider.setSpecialties(config.specialties);
                    provider.setCouncilContext(this);
                    
                    this.providers[providerName] = provider;
                    this.roles[config.role] = providerName;
                    
                    console.log(`✅ [Swarm] ${config.name} initialized as ${config.role}`);
                } catch (error) {
                    console.warn(`⚠️ [Swarm] Failed to initialize ${providerName}:`, error.message);
                }
            });
            
            this.isInitialized = true;
            console.log(`🎯 [Swarm] Council initialized with ${Object.keys(this.providers).length} active members`);
            
        } catch (error) {
            console.error('❌ [Swarm] Initialization failed:', error);
            this.isInitialized = false;
        }
    }
    
    async processContent(prompt, workflow = 'full') {
        if (!this.isInitialized) {
            throw new Error('Swarm Council not properly initialized');
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
                    return await this.fullSwarmWorkflow(prompt, result);
                case 'create':
                    return await this.creationWorkflow(prompt, result);
                case 'review':
                    return await this.reviewWorkflow(prompt, result);
                case 'optimize':
                    return await this.optimizationWorkflow(prompt, result);
                default:
                    throw new Error(`Unknown workflow: ${workflow}`);
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
}

module.exports = SwarmCouncil;
