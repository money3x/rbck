const ProviderFactory = require('../providers/factory/ProviderFactory');
const { getEnabledProviders } = require('../providers/config/providers.config');

class EATOptimizedSwarmCouncil {
    constructor(autoInit = false) {
        this.providers = {};
        this.eatRoles = {};
        this.seoGuidelines = {};
        this.eatGuidelines = {};
        this.isInitialized = false;
        this.initializationErrors = [];
        this.lastInitializationAttempt = null;
        
        // Only auto-initialize if explicitly requested
        if (autoInit) {
            console.log('🎯 [E-A-T Swarm] Auto-initialization requested');
            this.initializeEATSwarm();
        } else {
            console.log('🎯 [E-A-T Swarm] Created without auto-initialization');
        }
    }
    
    async initializeEATSwarm() {
        this.lastInitializationAttempt = new Date().toISOString();
        this.initializationErrors = [];
        
        try {
            console.log('🎯 [E-A-T Swarm] Initializing E-A-T Optimized Council...');
            
            const enabledProviders = getEnabledProviders();
            
            if (!enabledProviders || Object.keys(enabledProviders).length === 0) {
                throw new Error('No enabled providers found for E-A-T Swarm initialization');
            }
            
            // Sort providers by priority for E-A-T workflow
            const sortedProviders = Object.entries(enabledProviders)
                .sort(([,a], [,b]) => (a.priority || 999) - (b.priority || 999));
            
            let successfulInitializations = 0;
            const totalProviders = sortedProviders.length;
            
            for (const [providerName, config] of sortedProviders) {
                try {
                    console.log(`🔄 [E-A-T Swarm] Initializing ${providerName} for E-A-T role...`);
                    
                    // Validate config
                    if (!config || !config.name) {
                        throw new Error(`Invalid E-A-T configuration for provider ${providerName}`);
                    }
                    
                    const provider = ProviderFactory.createProvider(providerName);
                    
                    if (!provider) {
                        throw new Error(`Failed to create E-A-T provider instance for ${providerName}`);
                    }
                    
                    // Set E-A-T specific role and capabilities with error handling
                    try {
                        if (typeof provider.setRole === 'function') {
                            provider.setRole(config.role || 'general');
                        }
                        if (typeof provider.setSpecialties === 'function') {
                            provider.setSpecialties(config.specialties || []);
                        }
                        if (typeof provider.setEATCapabilities === 'function') {
                            provider.setEATCapabilities(config.eatCapabilities || {});
                        }
                        if (typeof provider.setCouncilContext === 'function') {
                            provider.setCouncilContext(this);
                        }
                    } catch (setupError) {
                        console.warn(`⚠️ [E-A-T Swarm] Provider ${providerName} E-A-T setup incomplete:`, setupError.message);
                        // Continue with provider even if E-A-T setup fails
                    }
                    
                    this.providers[providerName] = provider;
                    if (config.role) {
                        this.eatRoles[config.role] = providerName;
                    }
                    
                    successfulInitializations++;
                    console.log(`✅ [E-A-T Swarm] ${config.name} assigned as ${config.role || 'general'} (Priority: ${config.priority || 999}, ${successfulInitializations}/${totalProviders})`);
                    
                } catch (error) {
                    const errorDetails = {
                        provider: providerName,
                        error: error.message,
                        timestamp: new Date().toISOString(),
                        config: config ? config.name : 'Unknown',
                        eatRole: config?.role || 'Unknown'
                    };
                    
                    this.initializationErrors.push(errorDetails);
                    console.error(`❌ [E-A-T Swarm] Failed to initialize ${providerName}:`, error.message);
                    
                    if (process.env.NODE_ENV === 'development') {
                        console.error(`❌ [E-A-T Swarm] ${providerName} debug info:`, {
                            configExists: !!config,
                            eatCapabilities: config?.eatCapabilities,
                            errorStack: error.stack
                        });
                    }
                }
            }
            
            // Initialize guidelines regardless of provider failures
            try {
                this.initializeSEOGuidelines();
                this.initializeEATGuidelines();
                console.log('✅ [E-A-T Swarm] E-A-T and SEO guidelines initialized');
            } catch (guidelineError) {
                console.warn('⚠️ [E-A-T Swarm] Guidelines initialization failed:', guidelineError.message);
                this.initializationErrors.push({
                    component: 'guidelines',
                    error: guidelineError.message,
                    timestamp: new Date().toISOString()
                });
            }
            
            // Determine initialization status
            if (successfulInitializations === 0) {
                this.isInitialized = false;
                const errorMsg = `No E-A-T providers could be initialized. Errors: ${this.initializationErrors.map(e => e.error).join(', ')}`;
                console.error(`❌ [E-A-T Swarm] Complete initialization failure:`, errorMsg);
                throw new Error(errorMsg);
            } else {
                this.isInitialized = true;
                if (successfulInitializations < totalProviders) {
                    console.warn(`⚠️ [E-A-T Swarm] Partial initialization: ${successfulInitializations}/${totalProviders} E-A-T specialists active`);
                } else {
                    console.log(`✅ [E-A-T Swarm] Complete initialization: ${successfulInitializations}/${totalProviders} E-A-T specialists active`);
                }
            }
            
            console.log(`🎯 [E-A-T Swarm] Council ready with ${Object.keys(this.providers).length} E-A-T specialists`);
            
        } catch (error) {
            this.isInitialized = false;
            const finalError = {
                component: 'E-A-T SwarmCouncil',
                error: error.message,
                timestamp: new Date().toISOString(),
                providerErrors: this.initializationErrors
            };
            
            this.initializationErrors.push(finalError);
            console.error('❌ [E-A-T Swarm] Fatal initialization error:', error.message);
            console.error('❌ [E-A-T Swarm] All errors:', this.initializationErrors);
        }
    }
    
    initializeSEOGuidelines() {
        this.seoGuidelines = {
            title: {
                minLength: 30,
                maxLength: 60,
                includeKeyword: true,
                compelling: true
            },
            metaDescription: {
                minLength: 120,
                maxLength: 160,
                includeKeyword: true,
                callToAction: true
            },
            headings: {
                h1: { count: 1, includeKeyword: true },
                h2: { minCount: 2, includeVariations: true },
                h3: { optimal: true, structured: true }
            },
            content: {
                minWords: 800,
                keywordDensity: { min: 0.5, max: 2.5 },
                readabilityScore: { min: 60 },
                internalLinks: { min: 2 },
                externalLinks: { min: 1 }
            },
            schema: {
                article: true,
                breadcrumbs: true,
                faq: 'conditional',
                organization: true
            }
        };
    }
    
    initializeEATGuidelines() {
        this.eatGuidelines = {
            expertise: {
                requirements: [
                    'ใช้ข้อมูลที่ถูกต้องและเป็นปัจจุบัน',
                    'แสดงความรู้เชิงลึกในหัวข้อ',
                    'ใช้ศัพท์เทคนิคที่เหมาะสม',
                    'ให้ตัวอย่างและกรณีศึกษา'
                ],
                indicators: ['technical terms', 'detailed analysis', 'case studies', 'professional insights']
            },
            experience: {
                requirements: [
                    'แชร์ประสบการณ์จริง',
                    'ให้คำแนะนำเชิงปฏิบัติ',
                    'แสดงผลลัพธ์ที่เกิดขึ้นจริง',
                    'ใช้ภาษาที่แสดงถึงประสบการณ์'
                ],
                indicators: ['personal experience', 'practical advice', 'real results', 'hands-on knowledge']
            },
            authoritativeness: {
                requirements: [
                    'อ้างอิงแหล่งข้อมูลที่น่าเชื่อถือ',
                    'ใช้สถิติและข้อมูลจากองค์กรชั้นนำ',
                    'แสดงความสามารถในการวิเคราะห์',
                    'สร้างเนื้อหาที่ครอบคลุมและละเอียด'
                ],
                indicators: ['credible sources', 'statistics', 'expert analysis', 'comprehensive coverage']
            },
            trustworthiness: {
                requirements: [
                    'ใช้ข้อมูลที่ตรวจสอบได้',
                    'เปิดเผยข้อมูลผู้เขียนหรือแหล่งที่มา',
                    'อัพเดทข้อมูลให้เป็นปัจจุบัน',
                    'แสดงความโปร่งใสและซื่อสัตย์'
                ],
                indicators: ['verifiable information', 'transparent sources', 'up-to-date content', 'honest assessment']
            }
        };
    }
    
    async createEATOptimizedContent(prompt, targetKeyword, contentType = 'article') {
        if (!this.isInitialized) {
            throw new Error('E-A-T Swarm Council not properly initialized');
        }
        
        console.log(`🎯 [E-A-T Swarm] Creating E-A-T optimized content for keyword: "${targetKeyword}"`);
        
        const eatPipeline = {
            originalPrompt: prompt,
            targetKeyword: targetKeyword,
            contentType: contentType,
            eatSteps: [],
            seoAnalysis: {},
            eatCompliance: {},
            finalContent: {},
            metadata: {
                timestamp: new Date().toISOString(),
                workflowType: 'eat-optimized',
                participatingProviders: Object.keys(this.providers)
            }
        };
        
        try {
            // Step 1: Claude - Chief E-A-T Content Creation
            if (this.providers.claude) {
                console.log('🏆 [E-A-T] Step 1: Chief E-A-T Content Specialist (Claude)');
                const eatPrompt = this.buildAdvancedEATPrompt(prompt, targetKeyword);
                const eatContent = await this.providers.claude.generateContent(eatPrompt);
                
                eatPipeline.eatSteps.push({
                    step: 1,
                    role: 'Chief E-E-A-T Content Specialist',
                    provider: 'claude',
                    focus: 'Trustworthiness, Experience Integration, Factual Accuracy',
                    output: eatContent,
                    eatContribution: ['trustworthiness', 'experience', 'accuracy'],
                    timestamp: new Date().toISOString()
                });
                eatPipeline.finalContent.body = eatContent;
            }
            
            // Step 2: OpenAI - Authority & SEO Structure
            if (this.providers.openai && eatPipeline.finalContent.body) {
                console.log('📚 [E-A-T] Step 2: Authority & SEO Structure Optimizer (OpenAI)');
                const authorityPrompt = this.buildAuthorityAndSEOPrompt(eatPipeline.finalContent.body, targetKeyword);
                const authorityEnhanced = await this.providers.openai.generateContent(authorityPrompt);
                
                // Parse structured output
                const seoStructure = this.parseSEOStructure(authorityEnhanced);
                
                eatPipeline.eatSteps.push({
                    step: 2,
                    role: 'Authority & SEO Structure Optimizer',
                    provider: 'openai',
                    focus: 'Authoritativeness, SEO Structure, Meta Optimization',
                    output: seoStructure,
                    eatContribution: ['authoritativeness', 'seo_structure', 'meta_optimization'],
                    timestamp: new Date().toISOString()
                });
                
                eatPipeline.finalContent = { ...eatPipeline.finalContent, ...seoStructure };
            }
            
            // Step 3: DeepSeek - Technical Expertise Validation
            if (this.providers.deepseek && eatPipeline.finalContent.body) {
                console.log('🔬 [E-A-T] Step 3: Technical Expertise Validator (DeepSeek)');
                const expertisePrompt = this.buildExpertiseValidationPrompt(eatPipeline.finalContent.body, targetKeyword);
                const expertiseValidated = await this.providers.deepseek.generateContent(expertisePrompt);
                
                eatPipeline.eatSteps.push({
                    step: 3,
                    role: 'Technical Expertise Validator',
                    provider: 'deepseek',
                    focus: 'Technical Accuracy, Expertise Validation, Schema Markup',
                    output: expertiseValidated,
                    eatContribution: ['expertise', 'technical_accuracy', 'schema_markup'],
                    timestamp: new Date().toISOString()
                });
                
                eatPipeline.finalContent.body = expertiseValidated;
                eatPipeline.finalContent.schemaMarkup = this.generateSchemaMarkup(eatPipeline.finalContent, contentType);
            }
            
            // Step 4: Gemini - Content Comprehensiveness (Limited Role)
            if (this.providers.gemini && eatPipeline.finalContent.body) {
                console.log('📝 [E-A-T] Step 4: Content Comprehensiveness Enhancer (Gemini)');
                const comprehensivePrompt = this.buildComprehensivenessPrompt(eatPipeline.finalContent.body, targetKeyword);
                const comprehensive = await this.providers.gemini.generateContent(comprehensivePrompt);
                
                eatPipeline.eatSteps.push({
                    step: 4,
                    role: 'Content Comprehensiveness Enhancer',
                    provider: 'gemini',
                    focus: 'Content Breadth, Comprehensive Coverage, User Engagement',
                    output: comprehensive,
                    eatContribution: ['comprehensiveness', 'coverage', 'engagement'],
                    timestamp: new Date().toISOString()
                });
                
                eatPipeline.finalContent.body = comprehensive;
            }
            
            // Step 5: ChindaX - Local Authority & Cultural Context
            if (this.providers.chinda && eatPipeline.finalContent.body) {
                console.log('🇹🇭 [E-A-T] Step 5: Local Authority & Cultural Expert (ChindaX)');
                const localAuthorityPrompt = this.buildLocalAuthorityPrompt(eatPipeline.finalContent.body, targetKeyword);
                const localAuthority = await this.providers.chinda.generateContent(localAuthorityPrompt);
                
                eatPipeline.eatSteps.push({
                    step: 5,
                    role: 'Local Authority & Cultural Expert',
                    provider: 'chinda',
                    focus: 'Local Expertise, Cultural Authority, Thai Context',
                    output: localAuthority,
                    eatContribution: ['local_expertise', 'cultural_authority', 'thai_context'],
                    timestamp: new Date().toISOString()
                });
                
                eatPipeline.finalContent.body = localAuthority;
            }
            
            // Final Analysis & Scoring
            eatPipeline.eatCompliance = this.analyzeEATCompliance(eatPipeline.finalContent);
            eatPipeline.seoAnalysis = this.analyzeSEOCompliance(eatPipeline.finalContent, targetKeyword);
            eatPipeline.overallScore = this.calculateOverallScore(eatPipeline);
            
            console.log(`✅ [E-A-T Swarm] Content creation completed!`);
            console.log(`   📊 E-A-T Score: ${eatPipeline.eatCompliance.overall}/100`);
            console.log(`   🔍 SEO Score: ${eatPipeline.seoAnalysis.score}/100`);
            console.log(`   🏆 Overall Score: ${eatPipeline.overallScore}/100`);
            
            eatPipeline.status = 'completed';
            return eatPipeline;
            
        } catch (error) {
            console.error('❌ [E-A-T Swarm] Error:', error);
            eatPipeline.error = error.message;
            eatPipeline.status = 'failed';
            return eatPipeline;
        }
    }
    
    buildAdvancedEATPrompt(prompt, keyword) {
        return `
คุณคือ Chief E-E-A-T Content Specialist ที่มีความเชี่ยวชาญสูงสุดในการสร้างเนื้อหาคุณภาพ

📝 **CONTENT REQUEST:**
หัวข้อ: "${prompt}"
Target Keyword: "${keyword}"

🎯 **E-E-A-T OPTIMIZATION REQUIREMENTS:**

🔬 **EXPERTISE (ความเชี่ยวชาญ) - เป้าหมาย 90/100:**
- ใช้ความรู้เชิงลึกและข้อมูลเทคนิคที่ถูกต้อง
- แสดงความเข้าใจในระดับผู้เชี่ยวชาญ
- ใช้ศัพท์เฉพาะทางและคำอธิบายที่แม่นยำ
- ให้การวิเคราะห์และ insights ที่มีคุณค่าสูง

👤 **EXPERIENCE (ประสบการณ์) - เป้าหมาย 85/100:**
- รวม first-hand experience และ practical insights
- ใช้ภาษาที่แสดงถึงการได้ปฏิบัติจริง
- ให้คำแนะนำที่มาจากประสบการณ์ตรง
- แชร์ lessons learned และ real-world applications

🏆 **AUTHORITATIVENESS (อำนาจ) - เป้าหมาย 88/100:**
- อ้างอิงข้อมูลจากแหล่งที่มีชื่อเสียงและเชื่อถือได้
- ใช้สถิติและข้อมูลจากองค์กรชั้นนำ
- แสดงความเป็น thought leader ในเรื่องนี้
- สร้าง authoritative tone ที่เหมาะสม

✅ **TRUSTWORTHINESS (ความไว้วางใจ) - เป้าหมาย 95/100:**
- ใช้ข้อมูลที่ตรวจสอบได้และเป็นความจริง
- แสดงความโปร่งใสในข้อมูลและแหล่งที่มา
- ให้คำเตือนหรือข้อควรระวังที่เหมาะสม
- ใช้ภาษาที่แสดงความรับผิดชอบและซื่อสัตย์

📏 **CONTENT SPECIFICATIONS:**
- ความยาวอย่างน้อย 1,200 คำ
- โครงสร้างที่ชัดเจนและอ่านง่าย
- ใช้หัวข้อย่อยที่เป็นระเบียบ
- เหมาะสำหรับการใช้ใน professional CMS

เริ่มสร้างเนื้อหาที่มีคุณภาพ E-E-A-T สูงสุดได้เลยครับ:
`;
    }
    
    buildAuthorityAndSEOPrompt(content, keyword) {
        return `
คุณคือ Authority & SEO Structure Optimizer ที่เชี่ยวชาญในการเพิ่ม authoritativeness และ SEO optimization

📄 **CONTENT TO ENHANCE:**
"${content.substring(0, 1000)}..."

🎯 **TARGET KEYWORD:** "${keyword}"

🔧 **OPTIMIZATION TASKS:**

📚 **AUTHORITY BUILDING:**
- เพิ่มการอ้างอิงแหล่งข้อมูลที่มีชื่อเสียงและน่าเชื่อถือ
- ใช้ข้อมูลจากองค์กรระดับโลก, universities, research institutions
- เพิ่มสถิติและข้อมูลที่ทันสมัยและตรวจสอบได้
- สร้าง expert positioning และ thought leadership tone

🔍 **SEO STRUCTURE OPTIMIZATION:**
- สร้าง compelling title (30-60 ตัวอักษร) ที่รวม target keyword
- เขียน meta description (120-160 ตัวอักษร) ที่น่าสนใจ
- จัดโครงสร้าง H1, H2, H3 ให้เหมาะสมกับ SEO
- ปรับ keyword density ให้อยู่ในช่วง 0.5-2.5%

📊 **STRUCTURED OUTPUT REQUIRED (JSON FORMAT):**
{
  "title": "SEO-optimized title with target keyword",
  "metaDescription": "Compelling meta description with keyword and CTA",
  "body": "Enhanced content with authority signals and SEO structure",
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "internalLinks": ["suggested internal link topics"],
  "externalSources": ["credible external sources to reference"],
  "keywordVariations": ["semantic keywords and variations"],
  "featuredSnippet": "Content optimized for featured snippet"
}

กรุณาปรับปรุงเนื้อหาให้มี authority สูงขึ้นและ SEO-ready ในรูปแบบ JSON ที่ระบุ:
`;
    }
    
    buildExpertiseValidationPrompt(content, keyword) {
        return `
คุณคือ Technical Expertise Validator ที่เชี่ยวชาญในการตรวจสอบและเพิ่มความถูกต้องทางเทคนิค

📄 **CONTENT TO VALIDATE:**
"${content.substring(0, 1000)}..."

🎯 **TARGET KEYWORD:** "${keyword}"

🔬 **VALIDATION & ENHANCEMENT TASKS:**

✅ **TECHNICAL ACCURACY CHECK:**
- ตรวจสอบความถูกต้องของข้อมูลเทคนิค
- แก้ไขข้อผิดพลาดหรือข้อมูลที่ไม่แม่นยำ
- เพิ่มรายละเอียดเทคนิคที่จำเป็น
- ใช้ศัพท์เทคนิคที่ถูกต้องและเหมาะสม

🧠 **EXPERTISE ENHANCEMENT:**
- เพิ่มความลึกในการวิเคราะห์
- ใส่ technical insights ที่มีคุณค่า
- ขยายการอธิบายสำหรับแนวคิดที่ซับซ้อน
- เพิ่ม expert-level perspectives

📐 **DEPTH ANALYSIS:**
- เพิ่มการวิเคราะห์เชิงลึกและ critical thinking
- แสดงความเข้าใจที่รอบด้าน
- ให้ข้อมูลที่ครอบคลุมและละเอียด
- สร้าง comprehensive coverage ของหัวข้อ

กรุณาปรับปรุงเนื้อหาให้มีความเชี่ยวชาญและความถูกต้องทางเทคนิคสูงขึ้น:
`;
    }
    
    buildComprehensivenessPrompt(content, keyword) {
        return `
คุณคือ Content Comprehensiveness Enhancer ที่เชี่ยวชาญในการขยายและปรับปรุงเนื้อหาให้ครอบคลุม

📄 **CONTENT TO ENHANCE:**
"${content.substring(0, 1000)}..."

🎯 **TARGET KEYWORD:** "${keyword}"

📈 **ENHANCEMENT TASKS:**

📚 **CONTENT BREADTH EXPANSION:**
- ขยายเนื้อหาให้ครอบคลุมหัวข้อที่เกี่ยวข้อง
- เพิ่มมุมมองและแง่มุมที่หลากหลาย
- รวมข้อมูลที่อาจมีประโยชน์เพิ่มเติม
- สร้าง comprehensive coverage ของหัวข้อ

🎯 **USER ENGAGEMENT IMPROVEMENT:**
- ปรับปรุงความน่าสนใจและการมีส่วนร่วม
- เพิ่มตัวอย่างที่เข้าใจง่ายและเกี่ยวข้อง
- ใช้การเปรียบเทียบและอุปมาที่เหมาะสม
- สร้างเนื้อหาที่ตอบคำถามของผู้อ่าน

📊 **COMPREHENSIVE COVERAGE:**
- ให้ข้อมูลที่ครบถ้วนและสมบูรณ์
- ครอบคลุมประเด็นสำคัญทั้งหมด
- เพิ่มข้อมูลที่ผู้อ่านอาจค้นหาต่อ
- สร้าง one-stop resource สำหรับหัวข้อนี้

⚠️ **CAUTION:** 
- ไม่เพิ่มข้อมูลที่ไม่ถูกต้องหรือ misleading
- รักษาคุณภาพและความน่าเชื่อถือของเนื้อหาเดิม
- โฟกัสที่การเพิ่มคุณค่าให้ผู้อ่าน

กรุณาขยายและปรับปรุงเนื้อหาให้ครอบคลุมและน่าสนใจยิ่งขึ้น:
`;
    }
    
    buildLocalAuthorityPrompt(content, keyword) {
        return `
คุณคือ Local Authority & Cultural Expert ที่เชี่ยวชาญในการปรับเนื้อหาให้เหมาะกับบริบทไทย

📄 **CONTENT TO LOCALIZE:**
"${content.substring(0, 1000)}..."

🎯 **TARGET KEYWORD:** "${keyword}"

🇹🇭 **LOCALIZATION & AUTHORITY TASKS:**

🏛️ **LOCAL EXPERTISE ENHANCEMENT:**
- เพิ่มข้อมูลที่เกี่ยวข้องกับประเทศไทย
- ใช้ตัวอย่างและกรณีศึกษาจากบริบทไทย
- อ้างอิงข้อมูลจากองค์กรไทยที่เชื่อถือได้
- เพิ่ม local insights และความเข้าใจเฉพาะท้องถิ่น

🎭 **CULTURAL AUTHORITY:**
- ปรับเนื้อหาให้สอดคล้องกับวัฒนธรรมไทย
- ใช้ภาษาที่เหมาะสมกับผู้อ่านไทย
- เพิ่มข้อมูลที่เกี่ยวข้องกับไลฟ์สไตล์คนไทย
- สร้างความเชื่อมโยงกับประสบการณ์ของคนไทย

🔍 **THAI CONTEXT OPTIMIZATION:**
- ปรับภาษาไทยให้ถูกต้องและเป็นธรรมชาติ
- ใช้คำศัพท์ที่คนไทยค้นหาและเข้าใจ
- เพิ่มข้อมูลที่ตอบโจทย์ความต้องการของคนไทย
- สร้าง local relevance และ relatability

🎯 **LOCAL SEO ENHANCEMENT:**
- เพิ่ม local keywords ที่เหมาะสม
- ปรับเนื้อหาให้ตอบ local search intent
- เพิ่มข้อมูลที่เกี่ยวข้องกับ "ในประเทศไทย"
- สร้าง content ที่เหมาะกับ local featured snippets

กรุณาปรับปรุงเนื้อหาให้มี local authority และ cultural relevance สูงขึ้น:
`;
    }
    
    // Utility methods for analysis and parsing
    parseSEOStructure(seoContent) {
        try {
            // Try to parse as JSON first
            return JSON.parse(seoContent);
        } catch (error) {
            // Fallback parsing if JSON fails
            console.warn('⚠️ [E-A-T] JSON parsing failed, using fallback parser');
            return {
                title: this.extractTitle(seoContent) || 'Generated Title',
                metaDescription: this.extractMetaDescription(seoContent) || 'Generated meta description',
                body: seoContent,
                suggestedTags: [],
                internalLinks: [],
                externalSources: [],
                keywordVariations: [],
                featuredSnippet: this.extractFeaturedSnippet(seoContent) || ''
            };
        }
    }
    
    generateSchemaMarkup(content, contentType) {
        const schema = {
            "@context": "https://schema.org",
            "@type": contentType === 'article' ? "Article" : "BlogPosting",
            "headline": content.title || "Untitled",
            "description": content.metaDescription || "",
            "datePublished": new Date().toISOString(),
            "dateModified": new Date().toISOString(),
            "author": {
                "@type": "Organization",
                "name": "RBCK CMS",
                "url": "https://rbck-cms.render.com"
            },
            "publisher": {
                "@type": "Organization",
                "name": "RBCK CMS",
                "url": "https://rbck-cms.render.com"
            },
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": "https://rbck-cms.render.com"
            }
        };
        
        if (content.featuredSnippet) {
            schema.abstract = content.featuredSnippet;
        }
        
        return JSON.stringify(schema, null, 2);
    }
    
    analyzeEATCompliance(content) {
        const compliance = {
            expertise: 0,
            experience: 0,
            authoritativeness: 0,
            trustworthiness: 0,
            overall: 0,
            details: {}
        };
        
        const contentText = (content.body || '').toLowerCase();
        
        // Expertise Analysis
        const expertiseIndicators = ['วิเคราะห์', 'ศึกษา', 'ข้อมูล', 'วิธีการ', 'เทคนิค', 'ผลการ'];
        const expertiseScore = this.calculateIndicatorScore(contentText, expertiseIndicators);
        compliance.expertise = Math.min(expertiseScore, 100);
        
        // Experience Analysis
        const experienceIndicators = ['ประสบการณ์', 'ได้ลอง', 'ปฏิบัติ', 'การใช้งาน', 'ผลลัพธ์'];
        const experienceScore = this.calculateIndicatorScore(contentText, experienceIndicators);
        compliance.experience = Math.min(experienceScore, 100);
        
        // Authoritativeness Analysis
        const authorityIndicators = ['อ้างอิง', 'แหล่งที่มา', 'สถิติ', 'การศึกษา', 'ผู้เชี่ยวชาญ'];
        const authorityScore = this.calculateIndicatorScore(contentText, authorityIndicators);
        compliance.authoritativeness = Math.min(authorityScore, 100);
        
        // Trustworthiness Analysis
        const trustIndicators = ['ตรวจสอบ', 'เชื่อถือได้', 'โปร่งใส', 'ข้อเท็จจริง', 'ความจริง'];
        const trustScore = this.calculateIndicatorScore(contentText, trustIndicators);
        compliance.trustworthiness = Math.min(trustScore, 100);
        
        // Overall Score
        compliance.overall = Math.round(
            (compliance.expertise + compliance.experience + compliance.authoritativeness + compliance.trustworthiness) / 4
        );
        
        return compliance;
    }
    
    analyzeSEOCompliance(content, keyword) {
        const analysis = {
            score: 0,
            details: {},
            recommendations: []
        };
        
        let score = 0;
        const keywordLower = keyword.toLowerCase();
        
        // Title Analysis (20 points)
        if (content.title) {
            if (content.title.length >= 30 && content.title.length <= 60) score += 10;
            if (content.title.toLowerCase().includes(keywordLower)) score += 10;
        }
        
        // Meta Description Analysis (15 points)
        if (content.metaDescription) {
            if (content.metaDescription.length >= 120 && content.metaDescription.length <= 160) score += 8;
            if (content.metaDescription.toLowerCase().includes(keywordLower)) score += 7;
        }
        
        // Content Analysis (35 points)
        if (content.body) {
            const wordCount = content.body.split(' ').length;
            if (wordCount >= 800) score += 15;
            else if (wordCount >= 500) score += 10;
            
            const keywordMatches = (content.body.toLowerCase().match(new RegExp(keywordLower, 'g')) || []).length;
            const keywordDensity = (keywordMatches / wordCount) * 100;
            if (keywordDensity >= 0.5 && keywordDensity <= 2.5) score += 20;
        }
        
        // Structure Analysis (15 points)
        if (content.body && (content.body.includes('#') || content.body.includes('<h'))) {
            score += 15;
        }
        
        // Additional Features (15 points)
        if (content.schemaMarkup) score += 5;
        if (content.suggestedTags && content.suggestedTags.length > 0) score += 5;
        if (content.internalLinks && content.internalLinks.length > 0) score += 5;
        
        analysis.score = Math.min(score, 100);
        return analysis;
    }
    
    calculateOverallScore(pipeline) {
        const eatWeight = 0.6;
        const seoWeight = 0.4;
        
        const eatScore = pipeline.eatCompliance?.overall || 0;
        const seoScore = pipeline.seoAnalysis?.score || 0;
        
        return Math.round((eatScore * eatWeight) + (seoScore * seoWeight));
    }
    
    calculateIndicatorScore(text, indicators) {
        let score = 0;
        indicators.forEach(indicator => {
            if (text.includes(indicator)) {
                score += 20;
            }
        });
        return score;
    }
    
    // Helper extraction methods
    extractTitle(content) {
        const titleMatch = content.match(/title['":\s]+([^'"\n]{10,60})/i);
        return titleMatch ? titleMatch[1].trim() : null;
    }
    
    extractMetaDescription(content) {
        const metaMatch = content.match(/meta[^:]*description['":\s]+([^'"\n]{50,160})/i);
        return metaMatch ? metaMatch[1].trim() : null;
    }
    
    extractFeaturedSnippet(content) {
        const snippetMatch = content.match(/snippet['":\s]+([^'"\n]{50,200})/i);
        return snippetMatch ? snippetMatch[1].trim() : null;
    }
    
    getCouncilStatus() {
        return {
            initialized: this.isInitialized,
            totalMembers: Object.keys(this.providers).length,
            eatSpecialists: this.eatRoles,
            capabilities: ['eat-optimized', 'seo-enhanced', 'authority-building', 'local-optimization'],
            guidelines: {
                seo: Object.keys(this.seoGuidelines).length,
                eat: Object.keys(this.eatGuidelines).length
            }
        };
    }
}

module.exports = EATOptimizedSwarmCouncil;
