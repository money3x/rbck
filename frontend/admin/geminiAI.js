import { API_BASE, GEMINI_MODEL } from '../config.js';

// ลบ API Key ออกจาก frontend, ใช้ config จาก backend หรือ .env
const DEFAULT_GEMINI_CONFIG = {
    // apiKey: '', // <-- ไม่ควรใส่ใน frontend
    model: 'gemini-2.0-flash',
    maxTokens: 2048,
    temperature: 0.3,
    enabled: true,
    rateLimits: {
        requestsPerMinute: 60,
        requestsPerDay: 1500
    },
    baseURL: 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent'
};

/**
 * Gemini 2.0 Flash Engine สำหรับเรียกใช้งาน Gemini API
 * @class
 */
export class Gemini20FlashEngine {
    /**
     * @param {object} config - ค่าตั้งค่า (ควรรับ apiKey จาก backend)
     */
    constructor(config = {}) {
        const cfg = { ...DEFAULT_GEMINI_CONFIG, ...config };
        this.apiKey = cfg.apiKey; // apiKey ควร inject จาก backend เท่านั้น
        this.baseURL = cfg.baseURL;
        this.maxRetries = 3;
        this.requestCount = 0;
        this.resetTime = Date.now() + 60000;
    }

    async generateRealAISuggestions(post, analysis) {
        try {
            await this.checkRateLimit();
            
            const prompt = this.createSEOPrompt(post, analysis);
            const response = await this.callGeminiAPI(prompt);
            
            return this.parseGeminiResponse(response);
        } catch (error) {
            console.error('Gemini 2.0 Flash AI Error:', error);
            return this.getFallbackSuggestions(analysis);
        }
    }

    async checkRateLimit() {
        const now = Date.now();
        
        if (now > this.resetTime) {
            this.requestCount = 0;
            this.resetTime = now + 60000;
        }
        
        if (this.requestCount >= 60) {
            const waitTime = this.resetTime - now;
            console.log(`🚀 Flash Rate limit reached. Waiting ${waitTime}ms...`);
            await this.wait(waitTime);
            this.requestCount = 0;
            this.resetTime = Date.now() + 60000;
        }
        
        this.requestCount++;
        this.updateUsageDisplay();
    }

    updateUsageDisplay() {
        const usageElement = document.getElementById('geminiUsage');
        if (usageElement) {
            usageElement.textContent = `${this.requestCount}/60`;
        }
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    createSEOPrompt(post, analysis) {
        return `กรุณาวิเคราะห์และให้คำแนะนำการปรับปรุง SEO สำหรับบทความภาษาไทยต่อไปนี้:

📝 ข้อมูลบทความ:
- ชื่อบทความ: "${post.titleTH || 'ไม่ระบุ'}"
- Focus Keyword: "${post.focusKeyword || 'ยังไม่ระบุ'}"
- คะแนน SEO ปัจจุบัน: ${analysis.totalScore}/100

กรุณาตอบในรูปแบบ JSON:
{
  "improvements": [
    {
      "type": "title|meta|content",
      "issue": "ปัญหาที่พบ",
      "current": "ค่าปัจจุบัน",
      "suggested": "ค่าที่แนะนำ",
      "reason": "เหตุผล",
      "priority": "high|medium|low",
      "autoFixable": true/false,
      "expectedImpact": "5-10 คะแนน"
    }
  ],
  "contentSuggestions": ["แนะนำเนื้อหา"],
  "technicalSEO": ["แนะนำเทคนิค"],
  "summary": "สรุปการปรับปรุง"
}`;
    }

    /**
     * Sanitize HTML ด้วย DOMPurify (ต้อง import DOMPurify ใน HTML/JS)
     * @param {string} html
     * @returns {string}
     */
    sanitize(html) {
        if (window.DOMPurify) {
            return window.DOMPurify.sanitize(html);
        }
        // fallback: return plain text
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }    async callGeminiAPI(prompt) {
        // Fetch API key from backend
        let apiKey = '';
        try {
            const { authenticatedFetch } = await import('./auth.js');
            const resKey = await authenticatedFetch(`${API_BASE}/apikey`);
            if (resKey.ok) {
                const data = await resKey.json();
                apiKey = data.data?.geminiApiKey || '';
                console.log('🔑 Gemini API Key length:', apiKey ? apiKey.length : 0);
            }
        } catch (error) {
            console.error('Failed to fetch API key:', error);
        }

        if (!apiKey) {
            throw new Error('Gemini API Key is missing. Please set it in the AI Settings.');
        }

        const url = `${this.baseURL}?key=${encodeURIComponent(apiKey)}`;
        
        try {
            console.log(`🚀 Calling Gemini 2.0 Flash API...`);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: 0.3,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 2048,
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Gemini Flash API Error: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                throw new Error('Invalid response structure from Gemini Flash API');
            }

            const responseText = data.candidates[0].content.parts[0].text;
            console.log('✅ Gemini 2.0 Flash Success');
            
            return responseText;
        } catch (error) {
            console.error(`❌ Gemini Flash API failed:`, error);
            throw error;
        }
    }

    parseGeminiResponse(responseText) {
        try {
            // ลบ markdown code blocks
            let cleanedText = responseText
                .replace(/```json\n?/gi, '')
                .replace(/```\n?/gi, '')
                .trim();
            
            // หาจุดเริ่มต้นและจุดสิ้นสุดของ JSON
            let jsonStart = cleanedText.indexOf('{');
            let jsonEnd = cleanedText.lastIndexOf('}');
            
            if (jsonStart === -1 || jsonEnd === -1) {
                throw new Error('No JSON found in response');
            }
            
            let jsonText = cleanedText.substring(jsonStart, jsonEnd + 1);
            const parsed = JSON.parse(jsonText);
            
            // ตรวจสอบและเพิ่มค่า default
            const result = {
                improvements: (parsed.improvements || []).map(improvement => ({
                    type: improvement.type || 'general',
                    issue: improvement.issue || 'ปัญหาทั่วไป',
                    current: improvement.current || 'ไม่ระบุ',
                    suggested: improvement.suggested || 'ปรับปรุงตามคำแนะนำ Flash',
                    reason: improvement.reason || 'เพื่อปรับปรุง SEO',
                    priority: improvement.priority || 'medium',
                    autoFixable: improvement.autoFixable || false,
                    expectedImpact: improvement.expectedImpact || '5-10 คะแนน'
                })),
                contentSuggestions: parsed.contentSuggestions || [
                    'เพิ่มหัวข้อย่อยที่เกี่ยวข้อง',
                    'เพิ่มรูปภาพประกอบพร้อม Alt text',
                    'เพิ่มลิงก์ภายในไปยังบทความที่เกี่ยวข้อง'
                ],
                technicalSEO: parsed.technicalSEO || [
                    'ปรับปรุง Schema Markup',
                    'เพิ่ม Internal Links',
                    'ตรวจสอบ Meta Tags'
                ],
                summary: parsed.summary || 'Gemini 2.0 Flash แนะนำให้ปรับปรุงตามข้อแนะนำข้างต้น'
            };
            
            return result;
            
        } catch (error) {
            console.error('❌ Error parsing Gemini Flash response:', error);
            return this.createFallbackFromResponse(responseText);
        }
    }

    createFallbackFromResponse(responseText) {
        const improvements = [{
            type: 'general',
            issue: 'SEO ทั่วไปต้องปรับปรุง',
            current: 'ตรวจพบปัญหาจาก Gemini Flash',
            suggested: 'ปรับปรุงตามคำแนะนำของ Gemini 2.0 Flash',
            reason: 'เพื่อเพิ่มประสิทธิภาพ SEO โดยรวม',
            priority: 'medium',
            autoFixable: false,
            expectedImpact: '10-15 คะแนน'
        }];

        return {
            improvements,
            contentSuggestions: [
                'เพิ่มหัวข้อย่อยที่เกี่ยวข้อง',
                'เพิ่มรูปภาพประกอบและใส่ Alt text',
                'เพิ่มลิงก์ภายในไปยังบทความที่เกี่ยวข้อง'
            ],
            technicalSEO: [
                'ปรับปรุง Schema Markup',
                'เพิ่ม Internal Links',
                'ตรวจสอบ Meta Tags'
            ],
            summary: `Gemini 2.0 Flash วิเคราะห์แล้วพบ ${improvements.length} จุดที่ควรปรับปรุง`
        };
    }

    getFallbackSuggestions(analysis) {
        const improvements = [{
            type: 'general',
            issue: 'ปรับปรุง SEO ทั่วไป',
            current: 'ตรวจพบปัญหาจากระบบ',
            suggested: 'ปรับปรุงตามคำแนะนำของ Flash AI',
            reason: 'เพื่อเพิ่มประสิทธิภาพ SEO',
            priority: 'medium',
            autoFixable: false,
            expectedImpact: '10-15 คะแนน'
        }];

        return {
            improvements,
            contentSuggestions: ['ปรับปรุงตาม SEO best practices (Flash Fallback)'],
            technicalSEO: ['ตรวจสอบ Technical SEO (Flash Mode)'],
            summary: 'ใช้คำแนะนำ fallback เนื่องจาก Gemini 2.0 Flash ไม่สามารถเชื่อมต่อได้'
        };
    }

    countWords(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        const text = div.textContent || div.innerText || '';
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }

    /**
     * Generate SEO content for a post using Gemini AI
     * @param {object} post - The post object
     * @returns {object} Generated SEO content
     */
    async generateSEOContent(post) {
        try {
            await this.checkRateLimit();
            
            const prompt = `สร้างเนื้อหา SEO สำหรับบทความ:
            
Title: ${post.title}
Content: ${post.content ? post.content.substring(0, 1000) : 'ไม่มีเนื้อหา'}...

กรุณาสร้าง:
1. Title ที่เหมาะสมสำหรับ SEO (ไม่เกิน 60 ตัวอักษร)
2. Meta Description ที่น่าสนใจ (ไม่เกิน 160 ตัวอักษร)
3. Keywords ที่เกี่ยวข้อง (5-10 คำ)

ตอบในรูปแบบ JSON:
{
  "title": "...",
  "metaDescription": "...",
  "keywords": "..."
}`;

            const response = await this.callGeminiAPI(prompt);
            
            try {
                // Try to parse JSON response
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
            } catch (parseError) {
                console.warn('Failed to parse Gemini JSON response:', parseError);
            }
            
            // Fallback: generate basic SEO content
            return this.generateFallbackSEOContent(post);
            
        } catch (error) {
            console.error('Error generating SEO content with Gemini:', error);
            return this.generateFallbackSEOContent(post);
        }
    }

    /**
     * Generate fallback SEO content when AI is not available
     * @param {object} post - The post object
     * @returns {object} Basic SEO content
     */
    generateFallbackSEOContent(post) {
        const title = post.title || 'บทความใหม่';
        const content = post.content || '';
        
        // Extract keywords from title and content
        const words = (title + ' ' + content).toLowerCase()
            .replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2)
            .slice(0, 10);
        
        const keywords = [...new Set(words)].join(', ');
        
        // Generate meta description from content
        let metaDescription = '';
        if (content) {
            const plainText = content.replace(/<[^>]*>/g, ' ').trim();
            metaDescription = plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');
        } else {
            metaDescription = `อ่านบทความ ${title} ที่น่าสนใจและได้ข้อมูลที่เป็นประโยชน์`;
        }
        
        return {
            title: title.length > 60 ? title.substring(0, 57) + '...' : title,
            metaDescription: metaDescription,
            keywords: keywords
        };
    }
}