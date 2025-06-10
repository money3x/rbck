import { loadBlogPosts, savePost, editPost, deletePost, previewPost, processAISuggestions, publishPost } from './blogManager.js';
import { showNotification, showSection, updateCharacterCounters, toggleSidebar, logout } from './uiHelpers.js';
import { createOrGetGeminiModal, closeGeminiModal, showModal, closeModal } from './modals.js';
import { runGeminiSeoCheck, researchKeywords, generateSitemap, validateSchema, runSpeedTest, optimizationTips } from './seoTools.js';
import { Gemini20FlashEngine } from './geminiAI.js'
import { API_BASE } from '../config.js';
import { requireAuth, isAuthenticated, getCurrentUser } from './auth.js';

// ===== AUTHENTICATION CHECK =====
// Check authentication on page load
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔐 Admin Dashboard - Checking authentication...');
    
    // Require authentication to access admin dashboard
    const authenticated = await requireAuth();
    if (!authenticated) {
        return; // Will be redirected to login
    }
    
    // Update UI with user info
    const user = getCurrentUser();
    if (user && user.username) {
        const userSpan = document.querySelector('.user-menu span');
        if (userSpan) {
            userSpan.textContent = user.username;
        }
    }
    
    console.log('✅ Admin Dashboard authenticated and ready');
});

// ===== GEMINI 2.0 FLASH ENGINE INTEGRATION =====
let geminiEngine = null;
let geminiStatus = { isConnected: false, lastCheck: null };


// Bind to window for HTML onclick - Updated to work with cms-script.js
window.loadBlogPosts = loadBlogPosts;
window.savePost = savePost;
window.editPost = editPost;
window.deletePost = deletePost;
window.previewPost = previewPost;
window.processAISuggestions = processAISuggestions;
window.publishPost = publishPost;

window.showNotification = showNotification;
window.showSection = showSection;
window.updateCharacterCounters = updateCharacterCounters;
window.toggleSidebar = toggleSidebar;
window.logout = logout;

window.createOrGetGeminiModal = createOrGetGeminiModal;
window.closeGeminiModal = closeGeminiModal;
window.showModal = showModal;
window.closeModal = closeModal;

window.runGeminiSeoCheck = runGeminiSeoCheck;
window.researchKeywords = researchKeywords;
window.generateSitemap = generateSitemap;
window.validateSchema = validateSchema;
window.runSpeedTest = runSpeedTest;
window.optimizationTips = optimizationTips;

// Additional Flash AI functions
window.seoReport = function() {
    if (window.cmsApp) {
        window.cmsApp.showNotification('📊 SEO Report กำลังสร้าง...', 'info');
        return runGeminiSeoCheck();
    }
};

window.analyzeBacklinks = function() {
    if (window.cmsApp) {
        window.cmsApp.showNotification('🔗 Backlinks Analysis พร้อมใช้งาน', 'success');
    }
};

window.generateBacklinks = function() {
    if (window.cmsApp) {
        window.cmsApp.showNotification('🔗 Backlinks Generation พร้อมใช้งาน', 'success');
    }
};

window.generateSchema = function() {
    if (window.cmsApp) {
        window.cmsApp.showNotification('📋 Schema Generation พร้อมใช้งาน', 'success');
    }
};

window.autoGenerateSchema = function() {
    if (window.cmsApp) {
        window.cmsApp.showNotification('🤖 Auto Schema Generation พร้อมใช้งาน', 'success');
    }
};

window.checkPerformance = function() {
    if (window.cmsApp) {
        window.cmsApp.showNotification('⚡ Performance Check พร้อมใช้งาน', 'success');
        return runSpeedTest();
    }
};

window.getFlashTips = function() {
    if (window.cmsApp) {
        return optimizationTips();
    }
};

// Utility: Check Gemini API status (returns { isConnected, statusCode, error })
async function checkGeminiApiStatus() {
    let apiKey = '';
    try {
        const { authenticatedFetch } = await import('./auth.js');
        const resKey = await authenticatedFetch(`${API_BASE}/apikey`);
        if (resKey.ok) {
            const data = await resKey.json();
            apiKey = data.data?.geminiApiKey || '';
        }    } catch (error) {
        console.error('Failed to fetch API key:', error);
    }
    // API key fetched for status check
    if (!apiKey) {
        return {
            isConnected: false,
            statusCode: 403,
            error: 'Gemini API Key is missing. Please set it in the AI Settings.'
        };
    }
    const url = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=' + encodeURIComponent(apiKey);
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "API Status Check" }] }]
            })
        });
        return {
            isConnected: res.ok,
            statusCode: res.status,
            error: res.ok ? null : (await res.text())
        };
    } catch (err) {
        return {
            isConnected: false,
            statusCode: null,
            error: err.message
        };
    }
}

// Dashboard card loader
async function loadDashboard() {
    const dashboardCards = document.getElementById('dashboardCards');
    if (!dashboardCards) return;
    dashboardCards.innerHTML = `
        <div class="analytics-card" id="geminiApiStatusCard">
            <h3>🤖 Gemini API Status</h3>
            <div class="analytics-value" id="geminiApiStatusValue">Loading...</div>
            <div class="analytics-change" id="geminiApiStatusDetail"></div>
        </div>
        <!-- ...you can add more dashboard cards here... -->
    `;
    // Check API status and update card
    const status = await checkGeminiApiStatus();
    const valueEl = document.getElementById('geminiApiStatusValue');
    const detailEl = document.getElementById('geminiApiStatusDetail');
    if (status.isConnected) {
        valueEl.textContent = 'Connected';
        valueEl.style.color = '#28a745';
        detailEl.textContent = 'Gemini API พร้อมใช้งาน (Status: ' + status.statusCode + ')';
    } else {
        valueEl.textContent = 'Disconnected';
        valueEl.style.color = '#dc3545';
        detailEl.textContent = 'Error: ' + (status.error || 'ไม่สามารถเชื่อมต่อ API');
    }
}

// Initialize app
function initializeApp() {
    // Section loader logic: load section-specific data when section changes
    window.showSection = function(sectionId) {
        import('./uiHelpers.js').then(({ showSection }) => {
            showSection(sectionId);
            switch (sectionId) {
                case 'dashboard':
                    loadDashboard();
                    break;
                case 'blog-manage':
                    if (typeof loadBlogPosts === 'function') loadBlogPosts();
                    break;
                case 'analytics':
                    if (typeof loadAnalytics === 'function') loadAnalytics();
                    break;
            }
        });
    };

    // Load dashboard by default on first load
    loadDashboard();
}

// เรียก initializeApp หลัง DOM พร้อม
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// ====== Chatbot Panel Handler ======
document.addEventListener('DOMContentLoaded', () => {
    const chatbotForm = document.getElementById('chatbotForm');
    if (!chatbotForm) return;
    chatbotForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const input = document.getElementById('chatbotInput');
        const chatModel = document.getElementById('chatModelSelect').value;
        const messagesDiv = document.getElementById('chatbotMessages');
        if (!messagesDiv) return;
        const userMsg = input.value.trim();
        if (!userMsg) return;

        // Show user message
        const userBubble = document.createElement('div');
        userBubble.className = 'chatbot-bubble user';
        userBubble.textContent = userMsg;
        messagesDiv.appendChild(userBubble);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;

        input.value = '';
        input.disabled = true;

        // Show AI loading bubble
        const aiBubble = document.createElement('div');
        aiBubble.className = 'chatbot-bubble ai';
        aiBubble.innerHTML = '<span style="opacity:0.7;"><i class="fas fa-spinner fa-spin"></i> Gemini กำลังตอบ...</span>';
        messagesDiv.appendChild(aiBubble);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;        // Call Gemini API (only for Gemini model, others can be mocked)
        let aiReply = '';
        try {
            if (chatModel === 'gemini') {
                let apiKey = '';
                try {
                    const { authenticatedFetch } = await import('./auth.js');
                    const resKey = await authenticatedFetch(`${API_BASE}/apikey`);
                    if (resKey.ok) {
                        const data = await resKey.json();
                        apiKey = data.data?.geminiApiKey || '';
                    }
                } catch {}
                const prompt = userMsg;
                const url = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=' + encodeURIComponent(apiKey);
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.3,
                            topK: 40,
                            topP: 0.95,
                            maxOutputTokens: 1024
                        }
                    })
                });
                if (res.ok) {
                    const data = await res.json();
                    aiReply = (data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
                } else {
                    aiReply = '❌ ไม่สามารถเชื่อมต่อ Gemini ได้ (API Key อาจผิดหรือหมดโควต้า)';
                }
            } else {
                // Mock for other models
                aiReply = '🤖 (Mock) ตอบกลับจาก ' + chatModel + ': ' + userMsg;
            }
        } catch (err) {
            aiReply = '❌ เกิดข้อผิดพลาดในการเชื่อมต่อ Gemini';
        }

        aiBubble.innerHTML = aiReply.replace(/\n/g, '<br>');
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        input.disabled = false;
        input.focus();
    });
});

/**
 * แสดง modal แบบ reusable
 * @param {string} modalId
 * @param {string} htmlBody
 * @param {string} title
 */
function showReusableModal(modalId, htmlBody, title = '') {
    let modal = document.getElementById(modalId);
    if (!modal) {
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width:600px;">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="closeModal('${modalId}')">&times;</button>
                </div>
                <div class="modal-body" id="${modalId}Body"></div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal('${modalId}')">ปิด</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    const bodyEl = document.getElementById(`${modalId}Body`);
    if (bodyEl) bodyEl.innerHTML = htmlBody;
    modal.style.display = 'flex';
}

// ====== Show Article Idea Modal Handler ======
window.showArticleIdeaModal = function() {
    let modal = document.getElementById('articleIdeaModal');
    if (modal) {
        modal.style.display = 'flex';
    }
};

window.closeArticleIdeaModal = function() {
    let modal = document.getElementById('articleIdeaModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

window.generateArticleIdea = async function() {
    const input = document.getElementById('articleIdeaInput');
    const idea = input ? input.value.trim() : '';
    if (!idea) {
        showNotification('กรุณาระบุหัวข้อหรือคำสำคัญ', 'warning');
        return;
    }
    showNotification('🚀 กำลังสร้างไอเดียบทความด้วย Gemini...', 'info');
// เดิม
// const apiKey = localStorage.getItem('geminiApiKey') || '';
// const gemini = new Gemini20FlashEngine({ apiKey });

// แก้ไขเป็น async function (หรือในฟังก์ชัน async ที่คุณใช้งาน)
    let apiKey = '';
    try {
        const { authenticatedFetch } = await import('./auth.js');
        const resKey = await authenticatedFetch(`${API_BASE}/apikey`);
        if (resKey.ok) {
            const data = await resKey.json();
            apiKey = data.data?.geminiApiKey || '';
        }
    } catch (e) {
        // error handling เผื่อ fetch ไม่สำเร็จ
        console.error('Error fetching API key:', e);
        apiKey = '';
    }

    const gemini = new Gemini20FlashEngine({ apiKey });

    const promptIdea = `ช่วยคิดหัวข้อบทความหรือไอเดียสำหรับ "${idea}" (ภาษาไทย) พร้อมสรุปสั้นๆ 2-3 บรรทัด และตัวอย่างชื่อบทความ, meta description, focus keyword, หมวดหมู่, แท็ก, excerpt, และ outline หัวข้อย่อย (ตอบกลับเป็น JSON) เช่น:
{
  "title": "...",
  "metaDescription": "...",
  "focusKeyword": "...",
  "category": "...",
  "tags": ["...", "..."],
  "excerpt": "...",
  "outline": ["...", "..."],
  "summary": "..."
}
`;
    try {
        // เรียก Gemini API ผ่าน engine
        let ideaText = await gemini.callGeminiAPI(promptIdea);

        // ลบ markdown code block ถ้ามี
        ideaText = ideaText.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();

        // หา JSON จริงจากข้อความ (รองรับทั้ง array และ object)
        let aiData = null;
        let jsonStart = ideaText.indexOf('[');
        let jsonEnd = ideaText.lastIndexOf(']');
        if (jsonStart !== -1 && jsonEnd !== -1) {
            try {
                const arr = JSON.parse(ideaText.substring(jsonStart, jsonEnd + 1));
                if (Array.isArray(arr) && arr.length > 0 && typeof arr[0] === 'object') {
                    aiData = arr[0];
                }
            } catch {}
        }
        if (!aiData) {
            jsonStart = ideaText.indexOf('{');
            jsonEnd = ideaText.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1) {
                try {
                    const obj = JSON.parse(ideaText.substring(jsonStart, jsonEnd + 1));
                    if (typeof obj === 'object' && !Array.isArray(obj)) {
                        aiData = obj;
                    }
                } catch {}
            }
        }

        // ======= Force autofill even if tags are empty array or missing =======
        if (aiData && typeof aiData === 'object' && !Array.isArray(aiData)) {
            if (document.getElementById('postTitleTH')) {
                document.getElementById('postTitleTH').value = aiData.title || '';
            }
            if (document.getElementById('metaDescription')) {
                document.getElementById('metaDescription').value = aiData.metaDescription || '';
            }
            if (document.getElementById('focusKeyword')) {
                document.getElementById('focusKeyword').value = aiData.focusKeyword || '';
            }
            if (document.getElementById('postCategory')) {
                document.getElementById('postCategory').value = aiData.category || '';
            }
            if (document.getElementById('postTags')) {
                if (Array.isArray(aiData.tags)) {
                    document.getElementById('postTags').value = aiData.tags.join(', ');
                } else if (typeof aiData.tags === 'string') {
                    document.getElementById('postTags').value = aiData.tags;
                } else {
                    document.getElementById('postTags').value = '';
                }
            }
            if (document.getElementById('postExcerpt')) {
                document.getElementById('postExcerpt').value = aiData.excerpt || '';
            }
        }

        // 2. ถ้าได้ outline/ไอเดีย ให้ขอเนื้อหาบทความเต็มจาก AI
        let generatedContent = '';
        if (aiData && aiData.outline && Array.isArray(aiData.outline)) {
            showNotification('🚀 กำลังสร้างเนื้อหาบทความอัตโนมัติ...', 'info');
            const promptContent = `เขียนบทความภาษาไทยเต็มรูปแบบในหัวข้อ "${aiData.title || idea}" โดยใช้ outline ต่อไปนี้:
${aiData.outline.map((h, i) => `${i + 1}. ${h}`).join('\n')}
เนื้อหาควรมีความยาว 800-1200 คำ มีบทนำ สาระครบถ้วน และสรุปตอนท้าย (ตอบกลับเป็น HTML)`;
            generatedContent = await gemini.callGeminiAPI(promptContent);
        }

        // 3. Auto fill ฟอร์มสร้างบทความ
        if (aiData && typeof aiData === 'object' && !Array.isArray(aiData)) {
            if (generatedContent && document.getElementById('postContent')) {
                document.getElementById('postContent').innerHTML = generatedContent;
            } else if (aiData.outline && Array.isArray(aiData.outline) && document.getElementById('postContent')) {
                document.getElementById('postContent').innerHTML =
                    '<ul>' + aiData.outline.map(h => `<li>${h}</li>`).join('') + '</ul>';
            }
            showNotification('✅ เติมฟอร์มบทความอัตโนมัติด้วย AI สำเร็จ', 'success');
            window.closeArticleIdeaModal();
        } else {
            // fallback: แสดงผลลัพธ์แบบเดิม
            let resultText = '';
            if (ideaText) {
                resultText = `<div style="margin-top:18px;">${ideaText}</div>`;
            } else {
                resultText = 'ไม่พบไอเดียเพิ่มเติมจาก AI';
            }
            let modal = document.getElementById('articleIdeaModal');
            if (modal) {
                const body = modal.querySelector('.modal-body');
                if (body) {
                    body.innerHTML += resultText;
                }
            }
            showNotification('⚠️ ไม่สามารถเติมฟอร์มอัตโนมัติ, แสดงไอเดียแทน', 'warning');
        }
    } catch (err) {
        showNotification('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ AI', 'error');
    }
};

// ====== AI Settings Modal Logic ======
window.closeAiSettingsModal = function() {
    document.getElementById('aiSettingsModal').style.display = 'none';
};

window.showAiSettingsModal = async function() {
    // Load API keys from backend with authentication (masked for display)
    try {
        const { authenticatedFetch } = await import('./auth.js');
        const response = await authenticatedFetch(`${API_BASE}/apikey/display`);
        if (response.ok) {
            const data = await response.json();
            const apiKeys = data.data || {};
            
            // Populate form fields with masked values (for display only)
            document.getElementById('openaiApiKeyInput').value = apiKeys.openaiApiKey || '';
            document.getElementById('claudeApiKeyInput').value = apiKeys.claudeApiKey || '';
            document.getElementById('qwenApiKeyInput').value = apiKeys.qwenApiKey || '';
            document.getElementById('geminiApiKeyInput').value = apiKeys.geminiApiKey || '';
        }
    } catch (error) {
        console.error('Error loading API keys:', error);
        // Fall back to localStorage values
        document.getElementById('openaiApiKeyInput').value = localStorage.getItem('openaiApiKey') || '';
        document.getElementById('claudeApiKeyInput').value = localStorage.getItem('claudeApiKey') || '';
        document.getElementById('qwenApiKeyInput').value = localStorage.getItem('qwenApiKey') || '';
        document.getElementById('geminiApiKeyInput').value = localStorage.getItem('geminiApiKey') || '';
    }
    
    // Clear status messages
    ['openai','claude','qwen','gemini'].forEach(k => {
        document.getElementById(`${k}ApiKeyStatus`).textContent = '';
    });
    document.getElementById('aiSettingsModal').style.display = 'flex';
};

window.saveAiApiKey = async function() {
    // Collect all API keys
    const apiKeys = {
        openaiApiKey: document.getElementById('openaiApiKeyInput').value.trim(),
        claudeApiKey: document.getElementById('claudeApiKeyInput').value.trim(),
        qwenApiKey: document.getElementById('qwenApiKeyInput').value.trim(),
        geminiApiKey: document.getElementById('geminiApiKeyInput').value.trim()
    };
    
    // Filter out empty keys
    const keysToUpdate = {};
    Object.entries(apiKeys).forEach(([key, value]) => {
        if (value && value.length > 0) {
            keysToUpdate[key] = value;
        }
    });
    
    if (Object.keys(keysToUpdate).length === 0) {
        showNotification('❌ กรุณาใส่ API Key อย่างน้อย 1 ตัว', 'warning');
        return;
    }
    
    try {
        const { authenticatedFetch } = await import('./auth.js');
        const response = await authenticatedFetch(`${API_BASE}/apikey`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(keysToUpdate)
        });
        
        if (response.ok) {
            // Also save to localStorage as backup
            Object.entries(apiKeys).forEach(([key, value]) => {
                const localKey = key.replace('ApiKey', 'ApiKey');
                localStorage.setItem(localKey, value);
            });
            
            showNotification('✅ บันทึก API Key สำเร็จ', 'success');
            closeAiSettingsModal();
        } else {
            const errorData = await response.json();
            showNotification('❌ บันทึก API Key ไม่สำเร็จ: ' + (errorData.message || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error saving API keys:', error);
        showNotification('❌ ไม่สามารถเชื่อมต่อ backend', 'error');
    }
};

// เพิ่มฟังก์ชันบันทึก API Key ทีละตัวไป backend
window.saveSingleApiKey = async function(type) {
    const inputId = `${type}ApiKeyInput`;
    const key = document.getElementById(inputId).value.trim();
    if (!key) {
        showNotification('กรุณาใส่ API Key', 'warning');
        return;
    }
    const body = {};
    body[`${type}ApiKey`] = key;
    try {
        const { authenticatedFetch } = await import('./auth.js');
        const res = await authenticatedFetch(`${API_BASE}/apikey`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (res.ok) {
            showNotification('✅ บันทึก API Key สำเร็จ', 'success');
        } else {
            showNotification('❌ บันทึก API Key ไม่สำเร็จ', 'error');
        }
    } catch (error) {
        console.error('API Key save error:', error);
        showNotification('❌ ไม่สามารถเชื่อมต่อ backend', 'error');
    }
};

// ปุ่มเปิด modal
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('aiSettingsBtn');
    if (btn) btn.onclick = window.showAiSettingsModal;
});

// ====== Test API Key Logic ======
window.testApiKey = async function(type) {
    let key = '';
    let statusEl = document.getElementById(`${type}ApiKeyStatus`);
    statusEl.textContent = 'กำลังทดสอบ...';
    statusEl.style.color = '#6c757d';

    if (type === 'openai') {
        key = document.getElementById('openaiApiKeyInput').value.trim();
        if (!key) { statusEl.textContent = 'กรุณาใส่ API Key'; statusEl.style.color = '#dc3545'; return; }
        try {
            const res = await fetch('https://api.openai.com/v1/models', {
                headers: { 'Authorization': 'Bearer ' + key }
            });
            if (res.ok) {
                statusEl.textContent = 'เชื่อมต่อได้ ✔️';
                statusEl.style.color = '#28a745';
            } else {
                statusEl.textContent = 'API Key ไม่ถูกต้อง หรือหมดโควต้า';
                statusEl.style.color = '#dc3545';
            }
        } catch {
            statusEl.textContent = 'เชื่อมต่อไม่ได้';
            statusEl.style.color = '#dc3545';
        }
    } else if (type === 'claude') {
        key = document.getElementById('claudeApiKeyInput').value.trim();
        if (!key) { statusEl.textContent = 'กรุณาใส่ API Key'; statusEl.style.color = '#dc3545'; return; }
        try {
            // Claude (Anthropic) API v1 test
            const res = await fetch('https://api.anthropic.com/v1/complete', {
                method: 'POST',
                headers: {
                    'x-api-key': key,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json'
                },
                body: JSON.stringify({ prompt: '\n\nHuman: hello\n\nAssistant:', model: 'claude-instant-1', max_tokens_to_sample: 5 })
            });
            if (res.ok) {
                statusEl.textContent = 'เชื่อมต่อได้ ✔️';
                statusEl.style.color = '#28a745';
            } else {
                statusEl.textContent = 'API Key ไม่ถูกต้อง หรือหมดโควต้า';
                statusEl.style.color = '#dc3545';
            }
        } catch {
            statusEl.textContent = 'เชื่อมต่อไม่ได้';
            statusEl.style.color = '#dc3545';
        }
    } else if (type === 'qwen') {
        key = document.getElementById('qwenApiKeyInput').value.trim();
        if (!key) { statusEl.textContent = 'กรุณาใส่ API Key'; statusEl.style.color = '#dc3545'; return; }
        try {
            // Qwen (Alibaba) API test (public endpoint may differ)
            const res = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + key,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({ model: 'qwen-turbo', input: { prompt: 'hello' } })
            });
            if (res.ok) {
                statusEl.textContent = 'เชื่อมต่อได้ ✔️';
                statusEl.style.color = '#28a745';
            } else {
                statusEl.textContent = 'API Key ไม่ถูกต้อง หรือหมดโควต้า';
                statusEl.style.color = '#dc3545';
            }
        } catch {
            statusEl.textContent = 'เชื่อมต่อไม่ได้';
            statusEl.style.color = '#dc3545';
        }
    } else if (type === 'gemini') {
        key = document.getElementById('geminiApiKeyInput').value.trim();
        if (!key) { statusEl.textContent = 'กรุณาใส่ API Key'; statusEl.style.color = '#dc3545'; return; }
        try {
            const res = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=' + encodeURIComponent(key), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: 'ping' }] }],
                    generationConfig: { maxOutputTokens: 8 }
                })
            });
            if (res.ok) {
                statusEl.textContent = 'เชื่อมต่อได้ ✔️';
                statusEl.style.color = '#28a745';
            } else {
                statusEl.textContent = 'API Key ไม่ถูกต้อง หรือหมดโควต้า';
                statusEl.style.color = '#dc3545';
            }
        } catch {
            statusEl.textContent = 'เชื่อมต่อไม่ได้';
            statusEl.style.color = '#dc3545';
        }
    }
};

// ====== FLASH AI CONTENT GENERATION ======

/**
 * Auto-generate Flash content using Gemini 2.0 Flash AI
 * This function provides AI suggestions for the current article
 */
window.autoGenerateFlashContent = async function() {
    try {
        showNotification('🚀 Gemini 2.0 Flash กำลังวิเคราะห์...', 'info');
        
        // Get current form data
        const formData = {
            title: document.getElementById('postTitleTH')?.value || '',
            content: document.getElementById('postContent')?.innerHTML || '',
            category: document.getElementById('postCategory')?.value || '',
            tags: document.getElementById('postTags')?.value || '',
            excerpt: document.getElementById('postExcerpt')?.value || ''
        };
        
        if (!formData.title && !formData.content) {
            showNotification('❌ กรุณาใส่ชื่อบทความหรือเนื้อหาก่อน', 'error');
            return;
        }
        
        // Check Gemini API status
        const apiStatus = await checkGeminiApiStatus();
        if (!apiStatus.isConnected) {
            showNotification('❌ ไม่สามารถเชื่อมต่อ Gemini 2.0 Flash API ได้', 'error');
            return;
        }
        
        // Initialize Gemini engine
        const gemini = new Gemini20FlashEngine();
        
        // Create prompt for AI suggestions
        const prompt = `วิเคราะห์และให้คำแนะนำสำหรับบทความภาษาไทยต่อไปนี้:

ชื่อบทความ: "${formData.title}"
หมวดหมู่: "${formData.category}"
เนื้อหา: "${formData.content.replace(/<[^>]*>/g, ' ').substring(0, 500)}..."

กรุณาให้คำแนะนำในรูปแบบ JSON:
{
  "suggestions": {
    "titleImprovements": ["คำแนะนำปรับปรุงชื่อบทความ"],
    "contentStructure": ["แนะนำโครงสร้างเนื้อหา"],
    "seoOptimization": ["คำแนะนำ SEO"],
    "keywordSuggestions": ["คำหลักที่ควรเพิ่ม"],
    "metaDescriptionSuggestion": "คำอธิบายที่แนะนำ"
  },
  "autoFillData": {
    "improvedTitle": "ชื่อบทความที่ปรับปรุงแล้ว",
    "titleEN": "English title",
    "metaTitle": "Meta title ที่เหมาะสม",
    "urlSlug": "suggested-url-slug",
    "suggestedTags": ["tag1", "tag2", "tag3"],
    "improvedExcerpt": "บทคัดย่อที่ปรับปรุงแล้ว"
  }
}`;
        
        // Call Gemini API
        const response = await gemini.callGeminiAPI(prompt);
        
        // Parse response
        let aiData = null;
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                aiData = JSON.parse(jsonMatch[0]);
            }
        } catch (parseError) {
            console.warn('Failed to parse AI response as JSON');
        }
        
        if (aiData && aiData.suggestions) {
            // Show AI suggestions in modal
            showFlashSuggestionsModal(aiData.suggestions, aiData.autoFillData);
            showNotification('✅ Gemini 2.0 Flash วิเคราะห์เสร็จสิ้น', 'success');
        } else {
            // Fallback suggestions
            showFlashSuggestionsModal({
                titleImprovements: ['ใช้คำหลักในชื่อบทความ', 'ทำให้ชื่อน่าสนใจขึ้น', 'เพิ่มตัวเลขหรือปี'],
                contentStructure: ['เพิ่มหัวข้อย่อย (H2, H3)', 'เพิ่มจุดสำคัญเป็น bullet points', 'เพิ่มตัวอย่างที่เป็นรูปธรรม'],
                seoOptimization: ['ใช้คำหลักใน 100 คำแรก', 'เพิ่ม internal links', 'ปรับปรุงความยาวเนื้อหา'],
                keywordSuggestions: ['เพิ่มคำหลักที่เกี่ยวข้อง', 'ใช้ long-tail keywords', 'เพิ่มคำพ้องความหมาย'],
                metaDescriptionSuggestion: 'สร้าง meta description ที่น่าสนใจและมีคำหลัก'
            }, formData);
            showNotification('✅ แสดงคำแนะนำ Flash AI (Fallback Mode)', 'success');
        }
        
    } catch (error) {
        console.error('Error in autoGenerateFlashContent:', error);
        showNotification('❌ เกิดข้อผิดพลาดในการใช้ Flash AI', 'error');
    }
};

/**
 * Show Flash AI suggestions modal
 */
function showFlashSuggestionsModal(suggestions, autoFillData) {
    createOrGetGeminiModal();
    const modal = document.getElementById('geminiModal');
    const modalContent = modal.querySelector('.gemini-modal-content');
    
    modalContent.innerHTML = `
        <div class="gemini-modal-header">
            <h3><i class="fas fa-robot"></i> 🚀 Gemini 2.0 Flash AI Suggestions</h3>
            <button class="gemini-modal-close" onclick="closeGeminiModal()">&times;</button>
        </div>
        <div class="gemini-modal-body" style="max-height: 600px; overflow-y: auto;">
            <div class="flash-suggestions">
                <div class="suggestion-section">
                    <h4><i class="fas fa-heading"></i> ปรับปรุงชื่อบทความ</h4>
                    <ul>
                        ${suggestions.titleImprovements.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="suggestion-section">
                    <h4><i class="fas fa-list"></i> โครงสร้างเนื้อหา</h4>
                    <ul>
                        ${suggestions.contentStructure.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="suggestion-section">
                    <h4><i class="fas fa-search"></i> การปรับปรุง SEO</h4>
                    <ul>
                        ${suggestions.seoOptimization.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="suggestion-section">
                    <h4><i class="fas fa-tags"></i> คำหลักแนะนำ</h4>
                    <ul>
                        ${suggestions.keywordSuggestions.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="suggestion-section">
                    <h4><i class="fas fa-file-alt"></i> Meta Description แนะนำ</h4>
                    <p style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff;">
                        ${suggestions.metaDescriptionSuggestion}
                    </p>
                </div>
                
                ${autoFillData ? `
                    <div class="suggestion-section">
                        <h4><i class="fas fa-magic"></i> Auto-Fill ข้อมูล</h4>
                        <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 10px 0;">
                            <p><strong>ชื่อบทความที่ปรับปรุง:</strong> ${autoFillData.improvedTitle || 'ไม่มีข้อมูล'}</p>
                            <p><strong>ชื่อภาษาอังกฤษ:</strong> ${autoFillData.titleEN || 'ไม่มีข้อมูล'}</p>
                            <p><strong>Meta Title:</strong> ${autoFillData.metaTitle || 'ไม่มีข้อมูล'}</p>
                            <p><strong>URL Slug:</strong> ${autoFillData.urlSlug || 'ไม่มีข้อมูล'}</p>
                            <p><strong>Tags แนะนำ:</strong> ${(autoFillData.suggestedTags || []).join(', ') || 'ไม่มีข้อมูล'}</p>
                            <button class="btn btn-primary" onclick="applyAutoFillData(${JSON.stringify(autoFillData).replace(/"/g, '&quot;')})">
                                <i class="fas fa-magic"></i> นำไปใช้ Auto-Fill ทั้งหมด
                            </button>
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

/**
 * Apply auto-fill data to form
 */
window.applyAutoFillData = function(autoFillData) {
    try {
        if (autoFillData.improvedTitle && document.getElementById('postTitleTH')) {
            document.getElementById('postTitleTH').value = autoFillData.improvedTitle;
        }
        
        if (autoFillData.titleEN && document.getElementById('postTitleEN')) {
            document.getElementById('postTitleEN').value = autoFillData.titleEN;
        }
        
        if (autoFillData.metaTitle && document.getElementById('metaTitle')) {
            document.getElementById('metaTitle').value = autoFillData.metaTitle;
        }
        
        if (autoFillData.urlSlug && document.getElementById('postSlug')) {
            document.getElementById('postSlug').value = autoFillData.urlSlug;
        }
        
        if (autoFillData.suggestedTags && autoFillData.suggestedTags.length > 0) {
            const currentTags = document.getElementById('postTags')?.value || '';
            const newTags = autoFillData.suggestedTags.join(', ');
            const combinedTags = currentTags ? `${currentTags}, ${newTags}` : newTags;
            if (document.getElementById('postTags')) {
                document.getElementById('postTags').value = combinedTags;
            }
        }
        
        if (autoFillData.improvedExcerpt && document.getElementById('postExcerpt')) {
            document.getElementById('postExcerpt').value = autoFillData.improvedExcerpt;
        }
        
        showNotification('✅ นำข้อมูล Auto-Fill ไปใช้เรียบร้อย', 'success');
        closeGeminiModal();
        
    } catch (error) {
        console.error('Error applying auto-fill data:', error);
        showNotification('❌ เกิดข้อผิดพลาดในการนำข้อมูลไปใช้', 'error');
    }
};

/**
 * Clear form function
 */
window.clearForm = function() {
    if (confirm('คุณต้องการล้างข้อมูลในฟอร์มทั้งหมดหรือไม่?')) {
        // Clear main fields
        if (document.getElementById('postTitleTH')) document.getElementById('postTitleTH').value = '';
        if (document.getElementById('postTitleEN')) document.getElementById('postTitleEN').value = '';
        if (document.getElementById('postSlug')) document.getElementById('postSlug').value = '';
        if (document.getElementById('postExcerpt')) document.getElementById('postExcerpt').value = '';
        if (document.getElementById('postCategory')) document.getElementById('postCategory').value = '';
        if (document.getElementById('postTags')) document.getElementById('postTags').value = '';
        if (document.getElementById('postContent')) document.getElementById('postContent').innerHTML = '<p>เริ่มเขียนบทความของคุณที่นี่...</p>';
        
        // Clear SEO fields
        if (document.getElementById('metaTitle')) document.getElementById('metaTitle').value = '';
        if (document.getElementById('metaDescription')) document.getElementById('metaDescription').value = '';
        if (document.getElementById('focusKeyword')) document.getElementById('focusKeyword').value = '';
        if (document.getElementById('schemaType')) document.getElementById('schemaType').value = 'Article';
        
        // Update character counters
        updateCharacterCounters();
        
        showNotification('✅ ล้างฟอร์มเรียบร้อย', 'success');
    }
};

/**
 * Auto-generate URL slug from title
 */
function autoGenerateSlug() {
    const titleTH = document.getElementById('postTitleTH')?.value || '';
    const titleEN = document.getElementById('postTitleEN')?.value || '';
    
    // Use English title if available, otherwise use Thai title
    const sourceTitle = titleEN || titleTH;
    
    if (sourceTitle) {
        const slug = sourceTitle
            .toLowerCase()
            .replace(/[^\wก-๙\s-]+/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Remove multiple hyphens
            .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
            .substring(0, 50); // Limit length
        
        if (document.getElementById('postSlug')) {
            document.getElementById('postSlug').value = slug;
        }
    }
}

/**
 * Auto-generate meta title from main title
 */
function autoGenerateMetaTitle() {
    const titleTH = document.getElementById('postTitleTH')?.value || '';
    
    if (titleTH) {
        // Limit to 60 characters for SEO
        const metaTitle = titleTH.length > 60 ? titleTH.substring(0, 57) + '...' : titleTH;
        
        if (document.getElementById('metaTitle')) {
            document.getElementById('metaTitle').value = metaTitle;
        }
    }
}

// ====== AUTO-POPULATION EVENT LISTENERS ======

// Set up auto-population when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Auto-generate slug when title changes
    const titleTHInput = document.getElementById('postTitleTH');
    const titleENInput = document.getElementById('postTitleEN');
    
    if (titleTHInput) {
        titleTHInput.addEventListener('input', function() {
            autoGenerateSlug();
            autoGenerateMetaTitle();
        });
    }
    
    if (titleENInput) {
        titleENInput.addEventListener('input', function() {
            autoGenerateSlug();
        });
    }
});

// ====== DUPLICATE CONTENT PREVENTION ======

/**
 * Check for duplicate content before saving
 */
async function checkDuplicateContent(title, content) {
    try {
        // Simple duplicate check - can be enhanced with more sophisticated algorithms
        const posts = await loadBlogPosts() || [];
        
        for (const post of posts) {
            // Check title similarity (exact match)
            if (post.titleth && post.titleth.toLowerCase() === title.toLowerCase()) {
                return {
                    isDuplicate: true,
                    type: 'title',
                    conflictPost: post
                };
            }
            
            // Check content similarity (basic check for now)
            if (post.content && content) {
                const postContentWords = post.content.replace(/<[^>]*>/g, ' ').toLowerCase().split(/\s+/).filter(word => word.length > 3);
                const newContentWords = content.replace(/<[^>]*>/g, ' ').toLowerCase().split(/\s+/).filter(word => word.length > 3);
                
                // Count common words
                const commonWords = postContentWords.filter(word => newContentWords.includes(word));
                const similarity = commonWords.length / Math.max(postContentWords.length, newContentWords.length);
                
                if (similarity > 0.8) { // 80% similarity threshold
                    return {
                        isDuplicate: true,
                        type: 'content',
                        similarity: Math.round(similarity * 100),
                        conflictPost: post
                    };
                }
            }
        }
        
        return { isDuplicate: false };
        
    } catch (error) {
        console.error('Error checking duplicate content:', error);
        return { isDuplicate: false };
    }
}

// Make functions available globally
window.checkDuplicateContent = checkDuplicateContent;

// ===== GEMINI 2.0 FLASH ENGINE FUNCTIONS =====
async function initializeGeminiEngine() {
    try {
        let apiKey = '';
        try {
            const { authenticatedFetch } = await import('./auth.js');
            const resKey = await authenticatedFetch(`${API_BASE}/apikey`);
            if (resKey.ok) {
                const data = await resKey.json();
                apiKey = data.data?.geminiApiKey || '';
            }
        } catch (error) {
            console.error('Error fetching API key:', error);
        }

        if (!apiKey) {
            geminiStatus = { isConnected: false, lastCheck: new Date(), error: 'API key not configured' };
            updateGeminiStatus();
            return false;
        }

        const config = {
            apiKey: apiKey,
            model: 'gemini-2.0-flash',
            maxTokens: 4096,
            temperature: 0.7,
            enabled: true
        };

        geminiEngine = new Gemini20FlashEngine(config);
        
        // Test connection
        const testResponse = await geminiEngine.testConnection();
        
        geminiStatus = {
            isConnected: testResponse.success,
            lastCheck: new Date(),
            error: testResponse.success ? null : testResponse.error,
            model: 'gemini-2.0-flash'
        };

        updateGeminiStatus();
        return testResponse.success;
        
    } catch (error) {
        console.error('Error initializing Gemini engine:', error);
        geminiStatus = { 
            isConnected: false, 
            lastCheck: new Date(), 
            error: error.message || 'Unknown error'
        };
        updateGeminiStatus();
        return false;
    }
}

function updateGeminiStatus() {
    const statusElement = document.getElementById('gemini-status');
    const statusDot = document.getElementById('gemini-status-dot');
    const statusText = document.getElementById('gemini-status-text');
    const statusTime = document.getElementById('gemini-status-time');

    if (statusElement) {
        if (geminiStatus.isConnected) {
            statusElement.className = 'engine-status connected';
            if (statusDot) statusDot.className = 'status-dot connected';
            if (statusText) statusText.textContent = `Connected - ${geminiStatus.model}`;
        } else {
            statusElement.className = 'engine-status disconnected';
            if (statusDot) statusDot.className = 'status-dot disconnected';
            if (statusText) statusText.textContent = geminiStatus.error || 'Disconnected';
        }
        
        if (statusTime && geminiStatus.lastCheck) {
            statusTime.textContent = `Last check: ${geminiStatus.lastCheck.toLocaleTimeString()}`;
        }
    }

    // Update dashboard card if exists
    updateDashboardGeminiStatus();
}

function updateDashboardGeminiStatus() {
    const valueEl = document.getElementById('geminiApiStatusValue');
    const detailEl = document.getElementById('geminiApiStatusDetail');
    
    if (valueEl && detailEl) {
        if (geminiStatus.isConnected) {
            valueEl.textContent = 'Connected';
            valueEl.style.color = '#28a745';
            detailEl.textContent = `Gemini 2.0 Flash API พร้อมใช้งาน - ${geminiStatus.model}`;
        } else {
            valueEl.textContent = 'Disconnected';
            valueEl.style.color = '#dc3545';
            detailEl.textContent = geminiStatus.error || 'Gemini API ไม่พร้อมใช้งาน';
        }
    }
}

// Advanced Auto-Generate Flash Content with AI Analysis
async function autoGenerateFlashContent(sourceText, contentType = 'blog') {
    if (!geminiEngine || !geminiStatus.isConnected) {
        await initializeGeminiEngine();
        if (!geminiStatus.isConnected) {
            return autoGenerateFlashContentFallback(sourceText, contentType);
        }
    }

    try {
        const prompt = `
        ในฐานะ AI Content Specialist สำหรับ ระเบียบการช่าง โปรดสร้างเนื้อหาที่มีคุณภาพสูงจากข้อมูลต้นฉบับนี้:

        ข้อมูลต้นฉบับ: "${sourceText}"
        ประเภทเนื้อหา: ${contentType}

        โปรดสร้าง:
        1. หัวข้อภาษาไทย (น่าสนใจและเป็น SEO-friendly)
        2. หัวข้อภาษาอังกฤษ (สำหรับ URL slug)
        3. Meta Title (ไม่เกิน 60 ตัวอักษร)
        4. Meta Description (ไม่เกิน 160 ตัวอักษร)
        5. เนื้อหาหลัก (ประมาณ 500-800 คำ)
        6. Tags ที่เกี่ยวข้อง (5-10 tags)
        7. URL Slug ที่เหมาะสม

        ส่งผลลัพธ์ในรูปแบบ JSON:
        {
            "titleTH": "หัวข้อภาษาไทย",
            "titleEN": "English Title",
            "metaTitle": "Meta Title",
            "metaDescription": "Meta Description",
            "content": "เนื้อหาหลักในรูปแบบ HTML",
            "tags": ["tag1", "tag2", "tag3"],
            "urlSlug": "url-slug-here",
            "summary": "สรุปสั้นๆ"
        }

        เนื้อหาต้องเป็นภาษาไทยที่ถูกต้อง มีคุณภาพสูง และเหมาะสมกับเว็บไซต์ ระเบียบการช่าง
        `;

        const response = await geminiEngine.generateContent(prompt);
        
        if (response.success && response.content) {
            try {
                // Try to parse JSON response
                const jsonMatch = response.content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const result = JSON.parse(jsonMatch[0]);
                    
                    // Validate required fields
                    if (result.titleTH && result.content) {
                        return {
                            success: true,
                            data: {
                                titleTH: result.titleTH,
                                titleEN: result.titleEN || generateSlugFromTitle(result.titleTH),
                                metaTitle: result.metaTitle || result.titleTH.substring(0, 60),
                                metaDescription: result.metaDescription || result.summary || result.titleTH,
                                content: result.content,
                                tags: result.tags || [],
                                urlSlug: result.urlSlug || generateSlugFromTitle(result.titleTH),
                                summary: result.summary || ''
                            },
                            source: 'gemini-2.0-flash'
                        };
                    }
                }
            } catch (parseError) {
                console.error('Error parsing AI response:', parseError);
            }
        }

        // If AI parsing fails, try fallback
        return autoGenerateFlashContentFallback(sourceText, contentType);

    } catch (error) {
        console.error('Error generating Flash content:', error);
        return autoGenerateFlashContentFallback(sourceText, contentType);
    }
}

// Fallback content generation when AI is not available
function autoGenerateFlashContentFallback(sourceText, contentType) {
    // Safely handle undefined sourceText
    const safeSourceText = sourceText && typeof sourceText === 'string' ? sourceText : 'ข้อมูลเนื้อหาเบื้องต้น';
    const words = safeSourceText.split(' ').filter(word => word.length > 2);
    const titleWords = words.slice(0, 5).join(' ') || 'เนื้อหาใหม่';
    
    return {
        success: true,
        data: {
            titleTH: `${titleWords} - ระเบียบการช่าง`,
            titleEN: generateSlugFromTitle(titleWords),
            metaTitle: `${titleWords} | ระเบียบการช่าง`,
            metaDescription: `เรียนรู้เกี่ยวกับ ${titleWords} ในรูปแบบที่เข้าใจง่าย พร้อมข้อมูลครบถ้วนจากระเบียบการช่าง`,
            content: `<h2>${titleWords}</h2><p>${safeSourceText}</p><p>เนื้อหานี้ถูกสร้างขึ้นโดยระบบ AI เพื่อให้ข้อมูลเบื้องต้น กรุณาตรวจสอบและปรับแต่งตามความเหมาะสม</p>`,
            tags: words.slice(0, 5),
            urlSlug: generateSlugFromTitle(titleWords),
            summary: sourceText.substring(0, 150) + '...'
        },
        source: 'fallback'
    };
}

// Make new functions available globally
window.initializeGeminiEngine = initializeGeminiEngine;
window.updateGeminiStatus = updateGeminiStatus;
window.autoGenerateFlashContent = autoGenerateFlashContent;

// ====== Analytics Functions ======
/**
 * Refresh analytics data from Google Analytics
 */
window.refreshAnalytics = function() {
    console.log('🔄 Refreshing analytics data...');
    
    // Show loading notification
    showNotification('🔄 กำลังโหลดข้อมูล Analytics...', 'info');
    
    // Simulate analytics refresh (replace with real API call when available)
    setTimeout(() => {
        // Update analytics display with mock data
        const elements = {
            totalUsers: document.getElementById('totalUsers'),
            pageViews: document.getElementById('pageViews'),
            sessionDuration: document.getElementById('sessionDuration')
        };
        
        if (elements.totalUsers) elements.totalUsers.textContent = Math.floor(Math.random() * 1000) + 500;
        if (elements.pageViews) elements.pageViews.textContent = Math.floor(Math.random() * 5000) + 2000;
        if (elements.sessionDuration) elements.sessionDuration.textContent = Math.floor(Math.random() * 300) + 120 + 's';
        
        showNotification('✅ อัปเดตข้อมูล Analytics เรียบร้อย', 'success');
        console.log('✅ Analytics data refreshed');
    }, 1500);
};

/**
 * Refresh Google Search Console data
 */
window.refreshSearchConsole = function() {
    console.log('🔄 Refreshing Search Console data...');
    
    // Show loading notification
    showNotification('🔄 กำลังโหลดข้อมูล Search Console...', 'info');
    
    // Simulate search console refresh (replace with real API call when available)
    setTimeout(() => {
        // Update search console display with mock data
        const elements = {
            totalClicks: document.getElementById('totalClicks'),
            totalImpressions: document.getElementById('totalImpressions'),
            avgCTR: document.getElementById('avgCTR')
        };
        
        if (elements.totalClicks) elements.totalClicks.textContent = Math.floor(Math.random() * 500) + 200;
        if (elements.totalImpressions) elements.totalImpressions.textContent = Math.floor(Math.random() * 10000) + 5000;
        if (elements.avgCTR) elements.avgCTR.textContent = (Math.random() * 5 + 2).toFixed(1) + '%';
        
        showNotification('✅ อัปเดตข้อมูล Search Console เรียบร้อย', 'success');
        console.log('✅ Search Console data refreshed');
    }, 1500);
};

// ====== End of Additional Functions ======
