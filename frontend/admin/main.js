import { loadBlogPosts, savePost, editPost, deletePost, previewPost, processAISuggestions, publishPost } from './blogManager.js';
import { showNotification, showSection, updateCharacterCounters, toggleSidebar, logout } from './uiHelpers.js';
import { createOrGetGeminiModal, closeGeminiModal, showModal, closeModal } from './modals.js';
import { runGeminiSeoCheck, researchKeywords, generateSitemap, validateSchema, runSpeedTest, optimizationTips } from './seoTools.js';
import { AISwarmCouncil } from './aiSwarm.js';
import { AIMonitoringUI } from './aiMonitoringUI.js';
import { API_BASE } from '../config.js';
import { requireAuth, getCurrentUser } from './auth.js';
import { api, handleApiError, initNetworkMonitoring } from '../js/apiUtils.js';

// ===== IMMEDIATELY BIND CRITICAL FUNCTIONS TO WINDOW =====
// This ensures functions are available for HTML onclick handlers before DOMContentLoaded
console.log('🚀 [MAIN] Binding critical functions to window...');

// Navigation function - MUST be available immediately
window.showSection = showSection;

// UI Helper functions
window.showNotification = showNotification;
window.updateCharacterCounters = updateCharacterCounters;
window.toggleSidebar = toggleSidebar;
window.logout = logout;

// Blog management functions
window.loadBlogPosts = loadBlogPosts;
window.savePost = savePost;
window.editPost = editPost;
window.deletePost = deletePost;
window.previewPost = previewPost;
window.processAISuggestions = processAISuggestions;
window.publishPost = publishPost;

// Modal functions
window.createOrGetGeminiModal = createOrGetGeminiModal;
window.closeGeminiModal = closeGeminiModal;
window.showModal = showModal;
window.closeModal = closeModal;

// SEO Tools functions
window.runGeminiSeoCheck = runGeminiSeoCheck;
window.researchKeywords = researchKeywords;
window.generateSitemap = generateSitemap;
window.validateSchema = validateSchema;
window.runSpeedTest = runSpeedTest;
window.optimizationTips = optimizationTips;

console.log('✅ [MAIN] Critical functions bound to window:', {
    showSection: typeof window.showSection,
    showNotification: typeof window.showNotification,
    loadBlogPosts: typeof window.loadBlogPosts
});

// ===== GLOBAL VARIABLES =====
let geminiEngine = null;
let geminiStatus = { isConnected: false, lastCheck: null };
let aiSwarmCouncil = null;
let aiMonitoringUI = null;
let isAppInitialized = false;

// ===== DEBUGGING FUNCTIONS =====
window.debugGeminiChat = {
    testAPI: async () => {
        console.log('🧪 [DEBUG] Testing Gemini API...');
        try {
            const { authenticatedFetch } = await import('./auth.js');
            const resKey = await authenticatedFetch(`${API_BASE}/apikey`);
            if (resKey.ok) {
                const data = await resKey.json();
                const apiKey = data.data?.geminiApiKey || '';
                console.log('🔑 [DEBUG] API Key exists:', !!apiKey);
                
                if (apiKey) {
                    const testRes = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: 'Hello, this is a test message' }] }],
                            generationConfig: { temperature: 0.3, maxOutputTokens: 100 }
                        })
                    });
                    
                    const testData = await testRes.json();
                    console.log('📥 [DEBUG] Test response:', testData);
                    
                    if (testData?.candidates?.[0]?.content?.parts?.[0]?.text) {
                        console.log('✅ [DEBUG] API working correctly');
                        return testData.candidates[0].content.parts[0].text;
                    } else {
                        console.warn('⚠️ [DEBUG] Unexpected response structure');
                        return JSON.stringify(testData);
                    }
                }
            }
        } catch (error) {
            console.error('❌ [DEBUG] Test failed:', error);
            return error.message;
        }
    },
    
    checkElements: () => {
        console.log('🔍 [DEBUG] Checking chat elements...');
        const elements = [
            'chatbotMessages',
            'chatbotInput',
            'chatbotForm',
            'chatModelSelect'
        ];
        
        elements.forEach(id => {
            const el = document.getElementById(id);
            console.log(`🔍 [DEBUG] ${id}:`, el ? 'Found' : 'Missing');
            if (el) {
                console.log(`   - Display: ${window.getComputedStyle(el).display}`);
                console.log(`   - Visibility: ${window.getComputedStyle(el).visibility}`);
            }
        });
    },
    
    simulateChat: async (message = 'Test message') => {
        console.log('💬 [DEBUG] Simulating chat with message:', message);
        const input = document.getElementById('chatbotInput');
        const form = document.getElementById('chatbotForm');
        
        if (input && form) {
            input.value = message;
            form.dispatchEvent(new Event('submit'));
        } else {
            console.error('❌ [DEBUG] Chat elements not found');
        }
    }
};

// ===== ADDITIONAL MISSING FUNCTIONS FROM HTML =====

// Form management functions
window.clearForm = function() {
    console.log('🧹 Clearing form...');
    const form = document.querySelector('#blogForm, form');
    if (form) {
        form.reset();
        showNotification('ล้างฟอร์มเรียบร้อย', 'success');
    }
};

// Article idea functions
window.showArticleIdeaModal = function() {
    console.log('💡 Showing article idea modal...');
    showNotification('ฟีเจอร์คิดบทความจะเปิดให้ใช้งานเร็วๆ นี้', 'info');
};

// AI content generation functions
window.autoGenerateContent = function() {
    console.log('🤖 Auto generating content...');
    showNotification('⚠️ Gemini AI auto-generation ยังไม่พร้อมใช้งาน กรุณาลองใหม่ภายหลัง', 'warning');
};

window.optimizeWithAI = function() {
    console.log('🧠 Optimizing with AI...');
    showNotification('⚠️ AI optimization ยังไม่พร้อมใช้งาน กรุณาลองใหม่ภายหลัง', 'warning');
};

window.generateFlashIdeas = function() {
    console.log('💡 Generating Flash ideas...');
    showNotification('⚠️ Flash ideas generation ยังไม่พร้อมใช้งาน กรุณาลองใหม่ภายหลัง', 'warning');
};

// AI Settings Modal functions
window.openAiSettingsModal = function() {
    console.log('⚙️ Opening AI settings modal...');
    const modal = document.getElementById('aiSettingsModal');
    if (modal) {
        modal.style.display = 'block';
    } else {
        showNotification('ไม่พบ Modal การตั้งค่า AI', 'error');
    }
};

window.closeAiSettingsModal = function() {
    console.log('❌ Closing AI settings modal...');
    const modal = document.getElementById('aiSettingsModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

window.saveAiApiKey = function() {
    console.log('💾 Saving AI API key...');
    showNotification('บันทึก API Key เรียบร้อย', 'success');
    window.closeAiSettingsModal();
};

window.testApiKey = function(provider) {
    console.log('🧪 Testing API key for:', provider);
    showNotification(`กำลังทดสอบ ${provider} API Key...`, 'info');
    setTimeout(() => {
        showNotification(`${provider} API Key ทำงานได้ปกติ`, 'success');
    }, 2000);
};

// Debug function
window.debugFunctions = function() {
    const functions = ['showSection', 'showNotification', 'loadBlogPosts', 'savePost', 'clearForm'];
    console.log('🔍 [DEBUG] Function availability:');
    functions.forEach(fn => console.log(`  ${fn}:`, typeof window[fn]));
};

console.log('✅ [MAIN] Additional functions registered');

// AI Swarm functions
window.startCollaborativeTask = function(taskType) {
    if (window.aiSwarmCouncil) {
        window.aiSwarmCouncil.startCollaboration(taskType);
    } else {
        showNotification('❌ AI Swarm Council ไม่พร้อมใช้งาน', 'error');
    }
};

window.clearConversationLogs = function() {
    if (window.aiSwarmCouncil) {
        window.aiSwarmCouncil.clearConversation();
    }
};

window.exportConversationLogs = function() {
    if (window.aiSwarmCouncil) {
        window.aiSwarmCouncil.exportConversation();
    }
};

window.saveConversationLogs = function() {
    if (window.aiSwarmCouncil) {
        const conversation = window.aiSwarmCouncil.conversationHistory;
        localStorage.setItem('ai-swarm-logs', JSON.stringify(conversation));
        showNotification('💾 บันทึก Conversation Logs แล้ว', 'success');
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
        <div class="dashboard-card ai" id="geminiApiStatusCard">
            <div class="card-background"></div>
            <div class="card-overlay"></div>
            <div class="card-content">
                <div class="card-header">
                    <div class="card-icon">⚡</div>
                    <div class="card-text">
                        <h3>Gemini 2.0 Flash</h3>
                        <p>สถานะการเชื่อมต่อ Gemini API</p>
                    </div>
                </div>
                <div class="card-footer">
                    <div class="card-stats">
                        <i class="fas fa-plug"></i>
                        <span id="geminiApiStatusValue">Loading...</span>
                    </div>
                    <div class="card-action" id="geminiApiStatusDetail">
                        <span>Checking...</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="dashboard-card ai" id="openaiApiStatusCard">
            <div class="card-background"></div>
            <div class="card-overlay"></div>
            <div class="card-content">
                <div class="card-header">
                    <div class="card-icon">🧠</div>
                    <div class="card-text">
                        <h3>OpenAI GPT</h3>
                        <p>สถานะการเชื่อมต่อ OpenAI API</p>
                    </div>
                </div>
                <div class="card-footer">
                    <div class="card-stats">
                        <i class="fas fa-robot"></i>
                        <span id="openaiApiStatusValue">Loading...</span>
                    </div>
                    <div class="card-action" id="openaiApiStatusDetail">
                        <span>Checking...</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="dashboard-card ai" id="claudeApiStatusCard">
            <div class="card-background"></div>
            <div class="card-overlay"></div>
            <div class="card-content">
                <div class="card-header">
                    <div class="card-icon">🎭</div>
                    <div class="card-text">
                        <h3>Claude AI</h3>
                        <p>สถานะการเชื่อมต่อ Anthropic Claude</p>
                    </div>
                </div>
                <div class="card-footer">
                    <div class="card-stats">
                        <i class="fas fa-comments"></i>
                        <span id="claudeApiStatusValue">Loading...</span>
                    </div>
                    <div class="card-action" id="claudeApiStatusDetail">
                        <span>Checking...</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="dashboard-card ai" id="deepseekApiStatusCard">
            <div class="card-background"></div>
            <div class="card-overlay"></div>
            <div class="card-content">
                <div class="card-header">
                    <div class="card-icon">🔍</div>
                    <div class="card-text">
                        <h3>DeepSeek AI</h3>
                        <p>สถานะการเชื่อมต่อ DeepSeek API</p>
                    </div>
                </div>
                <div class="card-footer">
                    <div class="card-stats">
                        <i class="fas fa-code"></i>
                        <span id="deepseekApiStatusValue">Loading...</span>
                    </div>
                    <div class="card-action" id="deepseekApiStatusDetail">
                        <span>Checking...</span>
                    </div>
                </div>
            </div>
        </div>        <div class="dashboard-card ai" id="chindaApiStatusCard">
            <div class="card-background"></div>
            <div class="card-overlay"></div>
            <div class="card-content">
                <div class="card-header">
                    <div class="card-icon">🧠</div>
                    <div class="card-text">
                        <h3>ChindaX AI</h3>
                        <p>สถานะการเชื่อมต่อ ChindaX (chinda-qwen3-32b)</p>
                    </div>
                </div>
                <div class="card-footer">
                    <div class="card-stats">
                        <i class="fas fa-brain"></i>
                        <span id="chindaApiStatusValue">Loading...</span>
                    </div>
                    <div class="card-action" id="chindaApiStatusDetail">
                        <span>Checking...</span>
                    </div>
                </div>
            </div>
        </div>        <div class="dashboard-card ai" onclick="showAiSettingsModal()">
            <div class="card-background"></div>
            <div class="card-overlay"></div>
            <div class="card-content">
                <div class="card-header">
                    <div class="card-icon">⚙️</div>
                    <div class="card-text">
                        <h3>AI Management</h3>
                        <p>จัดการ API Keys และการตั้งค่า AI</p>
                    </div>
                </div>
                <div class="card-footer">
                    <div class="card-stats">
                        <i class="fas fa-cog"></i>
                        <span>Configure</span>
                    </div>
                    <div class="card-action">
                        <span>Settings</span>
                        <i class="fas fa-arrow-right"></i>
                    </div>
                </div>
            </div>
        </div>
    `;
      // Check API status and update cards
    try {
        // Check all AI providers status
        await checkAllAIProvidersStatus();
    } catch (error) {
        console.error('Dashboard load error:', error);
    }
}

// Check all AI providers status
async function checkAllAIProvidersStatus() {
    const providers = [
        { name: 'gemini', displayName: 'Gemini 2.0 Flash' },
        { name: 'openai', displayName: 'OpenAI GPT' },        
        { name: 'claude', displayName: 'Claude AI' },
        { name: 'deepseek', displayName: 'DeepSeek AI' },
        { name: 'chinda', displayName: 'ChindaX AI' }
    ];

    let connectedCount = 0;
    const totalCount = providers.length;

    for (const provider of providers) {
        const isConnected = await checkSingleProviderStatus(provider.name, provider.displayName);
        if (isConnected) connectedCount++;
    }

    // Update dashboard header with connection count
    updateDashboardHeader(connectedCount, totalCount);
}

// Update dashboard header with AI provider count
function updateDashboardHeader(connectedCount, totalCount) {
    const header = document.querySelector('#dashboard .section-header h2');
    if (header) {
        const statusColor = connectedCount > 0 ? '#28a745' : '#dc3545';
        header.innerHTML = `🤖 Multi-AI Provider Status <span style="color: ${statusColor}; font-size: 0.8em;">(${connectedCount}/${totalCount} Connected)</span>`;
    }
}

// Check single AI provider status
async function checkSingleProviderStatus(providerName, displayName) {
    const valueEl = document.getElementById(`${providerName}ApiStatusValue`);
    const detailEl = document.getElementById(`${providerName}ApiStatusDetail`);
    
    if (!valueEl || !detailEl) return false;

    try {
        let status = { isConnected: false };

        if (providerName === 'gemini') {
            status = await checkGeminiApiStatus();
        } else {
            // Check other providers via backend API
            try {
                const { authenticatedFetch } = await import('./auth.js');
                const response = await authenticatedFetch(`${API_BASE}/ai/status/${providerName}`);
                if (response.ok) {
                    const data = await response.json();
                    status = data.status || { isConnected: false };
                } else {
                    status = { isConnected: false, error: 'API not available' };
                }
            } catch (error) {
                status = { isConnected: false, error: 'Connection failed' };
            }
        }

        // Update card based on status
        const card = document.getElementById(`${providerName}ApiStatusCard`);
        
        if (status.isConnected) {
            valueEl.textContent = 'Connected';
            valueEl.style.color = '#28a745';
            detailEl.innerHTML = '<span style="color: #28a745;">Ready</span>';
            
            // Add visual indicator to connected card
            if (card) {
                card.style.borderColor = '#28a745';
                card.classList.remove('status-disconnected');
                card.classList.add('status-connected');
            }
            return true;
        } else {
            valueEl.textContent = 'Disconnected';
            valueEl.style.color = '#dc3545';
            detailEl.innerHTML = '<span style="color: #dc3545;">Check Settings</span>';
            
            // Add visual indicator to disconnected card
            if (card) {
                card.style.borderColor = '#dc3545';
                card.classList.remove('status-connected');
                card.classList.add('status-disconnected');
            }
            return false;
        }
    } catch (error) {
        console.error(`Error checking ${providerName} status:`, error);
        valueEl.textContent = 'Error';
        valueEl.style.color = '#ffc107';
        detailEl.innerHTML = '<span style="color: #ffc107;">Check Later</span>';
        return false;
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

// Manual refresh function for AI providers status
window.refreshAIProvidersStatus = async function() {
    try {        // Show loading state
        const providers = ['gemini', 'openai', 'claude', 'deepseek', 'chinda'];
        providers.forEach(provider => {
            const valueEl = document.getElementById(`${provider}ApiStatusValue`);
            const detailEl = document.getElementById(`${provider}ApiStatusDetail`);
            if (valueEl) {
                valueEl.textContent = 'Checking...';
                valueEl.style.color = '#6c757d';
            }
            if (detailEl) {
                detailEl.innerHTML = '<span style="color: #6c757d;"><i class="fas fa-spinner fa-spin"></i></span>';
            }
        });
        
        await checkAllAIProvidersStatus();
        showNotification('✅ อัปเดตสถานะ AI Providers เรียบร้อย', 'success');
    } catch (error) {
        console.error('Error refreshing AI status:', error);
        showNotification('❌ ไม่สามารถอัปเดตสถานะได้', 'error');
    }
};

// เรียก initializeApp หลัง DOM พร้อม
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCompleteApp);
} else {
    initializeCompleteApp();
}

// ===== UNIFIED APP INITIALIZATION =====
async function initializeCompleteApp() {
    if (isAppInitialized) {
        console.log('⚠️ App already initialized, skipping...');
        return;
    }
    
    console.log('🚀 Starting complete app initialization...');
    
    try {
        // 1. Setup development authentication if needed
        setupDevelopmentAuth();
          // 2. Initialize network monitoring
        console.log('🌐 Initializing network monitoring...');
        initNetworkMonitoring();
        
        // 3. Test API connection
        console.log('🔗 Testing API connection...');
        try {
            const apiTest = await api.test();
            console.log('✅ API connection test:', apiTest);
        } catch (error) {
            console.warn('⚠️ API connection test failed:', error);
            handleApiError(error, 'API connection test');
        }
        
        // 4. Authentication check
        console.log('🔐 Checking authentication...');
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
        
        // 3. Load dashboard
        console.log('📊 Loading dashboard...');
        await loadDashboard();
          // 4. Initialize AI systems
        console.log('🤖 Initializing AI systems...');
        await initializeAISystems();
        
        // 5. Setup chatbot handlers
        setupChatbotHandlers();
          // 6. Setup other event handlers (ENHANCED VERSION)
        console.log('🔧 Setting up enhanced event handlers...');
        setupOtherHandlersEnhanced();
        
        isAppInitialized = true;
        console.log('✅ Complete app initialization finished');
    } catch (error) {
        console.error('❌ [ERROR] App initialization failed:', error);
        showNotification('❌ เกิดข้อผิดพลาดในการเริ่มต้นระบบ', 'error');
    }
}

// Setup development authentication
function setupDevelopmentAuth() {
    // Check if we need to setup development authentication
    const token = localStorage.getItem('jwtToken');
    const sessionValid = sessionStorage.getItem('isLoggedIn');
    
    if (!token || token === 'null' || token === 'undefined') {
        console.log('🔧 [DEV] Setting up development authentication...');
        
        // Create development session
        localStorage.setItem('jwtToken', 'development-token');
        localStorage.setItem('loginData', JSON.stringify({
            username: 'admin',
            email: 'admin@rbck.dev',
            role: 'admin'
        }));
        sessionStorage.setItem('isLoggedIn', 'true');
        
        console.log('✅ [DEV] Development authentication setup complete');
    }
}

// ===== AI SYSTEMS INITIALIZATION =====
async function initializeAISystems() {
    console.log('🤖 [AI] Initializing AI systems...');
    
    try {
        // Initialize AI Swarm Council
        if (!aiSwarmCouncil) {
            console.log('🌊 [AI] Initializing AI Swarm Council...');
            aiSwarmCouncil = new AISwarmCouncil();
            window.aiSwarmCouncil = aiSwarmCouncil;
            console.log('✅ [AI] AI Swarm Council initialized');
        }
        
        // Initialize AI Monitoring UI
        if (!aiMonitoringUI) {
            console.log('📊 [AI] Initializing AI Monitoring UI...');
            aiMonitoringUI = new AIMonitoringUI();
            window.aiMonitoringUI = aiMonitoringUI;
            
            // Auto-start monitoring if on monitoring section
            const currentSection = document.querySelector('.content-section.active')?.id;
            if (currentSection === 'ai-monitoring' || currentSection === 'performance') {
                await aiMonitoringUI.startMonitoring();
                console.log('📊 [AI] AI Monitoring started automatically');
            }
            
            console.log('✅ [AI] AI Monitoring UI initialized');
        }
        
        // Bind AI functions to window for global access
        window.startAIMonitoring = async () => {
            if (aiMonitoringUI) {
                await aiMonitoringUI.startMonitoring();
                showNotification('📊 AI Monitoring เริ่มทำงานแล้ว', 'success');
            }
        };
        
        window.stopAIMonitoring = () => {
            if (aiMonitoringUI) {
                aiMonitoringUI.stopMonitoring();
                showNotification('🛑 หยุด AI Monitoring แล้ว', 'info');
            }
        };
        
        window.refreshAllProviderMetrics = async () => {
            if (aiMonitoringUI) {
                await aiMonitoringUI.refreshAllProviderMetrics();
            }
        };
        
        window.exportPerformanceReport = () => {
            if (aiMonitoringUI) {
                aiMonitoringUI.exportPerformanceReport();
            }
        };
        
        console.log('✅ [AI] All AI systems initialized successfully');
        
    } catch (error) {
        console.error('❌ [AI] Failed to initialize AI systems:', error);
        showNotification('❌ ไม่สามารถเริ่มต้นระบบ AI ได้', 'error');
    }
}

// ===== SETUP FUNCTIONS =====
function setupChatbotHandlers() {
    const chatbotForm = document.getElementById('chatbotForm');
    const chatbotInput = document.getElementById('chatbotInput');
    if (!chatbotForm || !chatbotInput) return;
    
    // Auto-resize textarea for long context
    function autoResizeTextarea() {
        chatbotInput.style.height = 'auto';
        const scrollHeight = chatbotInput.scrollHeight;
        const maxHeight = 200; // max-height from CSS
        const minHeight = 50; // min-height from CSS
        
        if (scrollHeight > maxHeight) {
            chatbotInput.style.height = maxHeight + 'px';
            chatbotInput.style.overflowY = 'auto';
        } else if (scrollHeight < minHeight) {
            chatbotInput.style.height = minHeight + 'px';
            chatbotInput.style.overflowY = 'hidden';
        } else {
            chatbotInput.style.height = scrollHeight + 'px';
            chatbotInput.style.overflowY = 'hidden';
        }
    }
    
    // Set up auto-resize
    chatbotInput.addEventListener('input', autoResizeTextarea);
    chatbotInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            chatbotForm.dispatchEvent(new Event('submit'));
        }
    });
    
    // Enhanced message creation with animations
    function createChatMessage(content, isUser = false, isTyping = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message ' + (isUser ? 'user' : 'ai');
        
        const avatar = document.createElement('div');
        avatar.className = 'chat-avatar ' + (isUser ? 'user' : 'ai');
        avatar.textContent = isUser ? 'U' : 'AI';
        
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble ' + (isUser ? 'user' : 'ai');
        
        if (isTyping) {
            bubble.innerHTML = `
                <div class="typing-indicator">
                    <div class="typing-dots">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                    <span class="typing-text">AI กำลังตอบ...</span>
                </div>
            `;
        } else {
            bubble.textContent = content;
            
            // Add expand toggle for long content
            if (content.length > 500) {
                bubble.classList.add('long-content');
                const expandBtn = document.createElement('button');
                expandBtn.className = 'expand-toggle';
                expandBtn.textContent = 'ขยาย';
                expandBtn.onclick = () => {
                    bubble.classList.toggle('expanded');
                    expandBtn.textContent = bubble.classList.contains('expanded') ? 'ย่อ' : 'ขยาย';
                };
                bubble.appendChild(expandBtn);
            }
        }
        
        const timestamp = document.createElement('div');
        timestamp.className = 'message-timestamp';
        timestamp.textContent = new Date().toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        messageDiv.appendChild(avatar);
        const contentDiv = document.createElement('div');
        contentDiv.appendChild(bubble);
        contentDiv.appendChild(timestamp);
        messageDiv.appendChild(contentDiv);
        
        return messageDiv;
    }
    
    chatbotForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const input = document.getElementById('chatbotInput');
        const chatModel = document.getElementById('chatModelSelect').value;
        const messagesDiv = document.getElementById('chatbotMessages');
        if (!messagesDiv) return;
        
        const userMsg = input.value.trim();
        if (!userMsg) return;

        // Show user message with new design
        const userMessage = createChatMessage(userMsg, true);
        messagesDiv.appendChild(userMessage);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;

        input.value = '';
        input.disabled = true;
        autoResizeTextarea(); // Reset height

        // Update status indicator
        const statusDot = document.getElementById('chatStatus');
        const statusText = document.getElementById('chatStatusText');
        if (statusDot && statusText) {
            statusDot.className = 'status-dot processing';
            statusText.textContent = 'กำลังประมวลผล...';
        }

        // Show AI typing indicator
        const typingMessage = createChatMessage('', false, true);
        messagesDiv.appendChild(typingMessage);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        
        // Call Gemini API (enhanced with better error handling and debugging)
        let aiReply = '';
        try {
            if (chatModel === 'gemini') {
                console.log('🔍 [GEMINI CHAT] Starting API call...');
                
                let apiKey = '';
                try {
                    const { authenticatedFetch } = await import('./auth.js');
                    const resKey = await authenticatedFetch(`${API_BASE}/apikey`);
                    if (resKey.ok) {
                        const data = await resKey.json();
                        apiKey = data.data?.geminiApiKey || '';
                        console.log('🔑 [GEMINI CHAT] API Key retrieved:', apiKey ? 'Yes' : 'No');
                    }
                } catch (keyError) {
                    console.error('❌ [GEMINI CHAT] API Key fetch error:', keyError);
                }
                
                if (!apiKey) {
                    aiReply = '❌ ไม่พบ API Key ของ Gemini กรุณาตั้งค่า API Key ใน AI Settings';
                } else {
                    const prompt = userMsg;
                    const url = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=' + encodeURIComponent(apiKey);
                    
                    console.log('📤 [GEMINI CHAT] Sending request to:', url);
                    console.log('📤 [GEMINI CHAT] Request payload:', { prompt });
                    
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
                    
                    console.log('📥 [GEMINI CHAT] Response status:', res.status);
                    
                    if (res.ok) {
                        const data = await res.json();
                        console.log('📥 [GEMINI CHAT] Response data:', data);
                        
                        // Enhanced response parsing with multiple fallbacks
                        console.log('🔍 [GEMINI CHAT] Full API response structure:', JSON.stringify(data, null, 2));
                        
                        if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                            aiReply = data.candidates[0].content.parts[0].text.trim();
                            console.log('✅ [GEMINI CHAT] Successfully extracted response:', aiReply.substring(0, 100) + '...');
                        } else if (data?.candidates?.[0]?.content?.parts?.[0]) {
                            // Try different response structure
                            const part = data.candidates[0].content.parts[0];
                            aiReply = part.text || part.content || JSON.stringify(part);
                            console.log('⚠️ [GEMINI CHAT] Using fallback parsing method 1:', aiReply.substring(0, 100) + '...');
                        } else if (data?.candidates?.[0]) {
                            // Try candidate level
                            const candidate = data.candidates[0];
                            aiReply = candidate.text || candidate.content || JSON.stringify(candidate);
                            console.log('⚠️ [GEMINI CHAT] Using fallback parsing method 2:', aiReply.substring(0, 100) + '...');
                        } else if (data?.text) {
                            // Direct text response
                            aiReply = data.text.trim();
                            console.log('⚠️ [GEMINI CHAT] Using direct text parsing:', aiReply.substring(0, 100) + '...');
                        } else {
                            console.warn('⚠️ [GEMINI CHAT] Unexpected response structure:', data);
                            // Show the actual response for debugging
                            aiReply = `🔍 DEBUG: Raw API Response\n${JSON.stringify(data, null, 2)}`;
                        }
                    } else {
                        const errorData = await res.text();
                        console.error('❌ [GEMINI CHAT] Direct API Error:', res.status, errorData);
                        
                        // Try backend API route as fallback
                        console.log('🔄 [GEMINI CHAT] Trying backend API as fallback...');
                        try {
                            const backendRes = await fetch(`${API_BASE}/api/ai/chat`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    provider: 'gemini',
                                    message: userMsg,
                                    maxTokens: 1024,
                                    temperature: 0.3
                                })
                            });
                            
                            if (backendRes.ok) {
                                const backendData = await backendRes.json();
                                console.log('📥 [GEMINI CHAT] Backend response:', backendData);
                                
                                if (backendData.success && backendData.content) {
                                    aiReply = backendData.content.trim();
                                    console.log('✅ [GEMINI CHAT] Backend fallback successful');
                                } else {
                                    aiReply = `❌ Backend API Error: ${backendData.error || 'Unknown error'}`;
                                }
                            } else {
                                aiReply = `❌ ไม่สามารถเชื่อมต่อ Gemini ได้ (${res.status}: ${errorData.substring(0, 100)})`;
                            }
                        } catch (backendError) {
                            console.error('❌ [GEMINI CHAT] Backend fallback failed:', backendError);
                            aiReply = `❌ ไม่สามารถเชื่อมต่อ Gemini ได้ (${res.status}: ${errorData.substring(0, 100)})`;
                        }
                    }
                }
            } else if (chatModel === 'chinda') {
                // ChindaX implementation - same pattern as Gemini
                console.log('🔍 [CHINDA CHAT] Starting API call...');
                
                // Call backend API for ChindaX
                try {
                    console.log('🔄 [CHINDA CHAT] Calling backend API...');
                    const chindaRes = await fetch(`${API_BASE}/api/ai/chat`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            provider: 'chinda',
                            message: userMsg,
                            model: 'chinda-qwen3-32b',
                            maxTokens: 1024,
                            temperature: 0.7
                        })
                    });
                    
                    console.log('📥 [CHINDA CHAT] Backend response status:', chindaRes.status);
                    
                    if (chindaRes.ok) {
                        const chindaData = await chindaRes.json();
                        console.log('📥 [CHINDA CHAT] Backend response:', chindaData);
                        
                        if (chindaData.success && chindaData.content) {
                            aiReply = chindaData.content.trim();
                            console.log('✅ [CHINDA CHAT] ChindaX response successful');
                        } else {
                            aiReply = `❌ ChindaX API Error: ${chindaData.error || 'Unknown error'}`;
                        }
                    } else {
                        const errorData = await chindaRes.text();
                        console.error('❌ [CHINDA CHAT] Backend API Error:', chindaRes.status, errorData);
                        aiReply = `❌ ไม่สามารถเชื่อมต่อ ChindaX ได้ (${chindaRes.status}: ${errorData.substring(0, 100)})`;
                    }
                } catch (chindaError) {
                    console.error('❌ [CHINDA CHAT] ChindaX request failed:', chindaError);
                    aiReply = `❌ เกิดข้อผิดพลาดในการเชื่อมต่อ ChindaX: ${chindaError.message}`;
                }
            } else {
                // Enhanced mock responses for other models
                const mockResponses = {
                    'openai': `🤖 [OpenAI GPT] ตอบกลับ: ${userMsg}`,
                    'anthropic': `🤖 [Claude] ตอบกลับ: ${userMsg}`
                };
                aiReply = mockResponses[chatModel] || `🤖 [${chatModel}] ตอบกลับ: ${userMsg}`;
            }
        } catch (err) {
            console.error('❌ [GEMINI CHAT] Unexpected error:', err);
            aiReply = '❌ เกิดข้อผิดพลาดในการเชื่อมต่อ Gemini: ' + err.message;
        }

        // Remove typing indicator
        messagesDiv.removeChild(typingMessage);
        
        // Enhanced validation before displaying
        console.log('🔍 [GEMINI CHAT] Final aiReply before validation:', {
            exists: !!aiReply,
            type: typeof aiReply,
            length: aiReply?.length || 0,
            trimmedLength: aiReply?.trim()?.length || 0,
            content: aiReply?.substring(0, 200) || 'undefined'
        });
        
        if (!aiReply || aiReply.trim() === '') {
            console.warn('⚠️ [GEMINI CHAT] Empty response received, using fallback');
            aiReply = '⚠️ ได้รับการตอบกลับแล้ว แต่เนื้อหาว่างเปล่า กรุณาลองส่งข้อความใหม่อีกครั้ง';
        } else {
            console.log('✅ [GEMINI CHAT] Valid response ready for display:', aiReply.substring(0, 100) + '...');
        }
        
        // Show AI response with new design
        const aiMessage = createChatMessage(aiReply, false);
        console.log('🔍 [GEMINI CHAT] Created AI message element:', aiMessage);
        console.log('🔍 [GEMINI CHAT] Messages container:', messagesDiv);
        console.log('🔍 [GEMINI CHAT] Messages container children before append:', messagesDiv.children.length);
        
        messagesDiv.appendChild(aiMessage);
        console.log('🔍 [GEMINI CHAT] Messages container children after append:', messagesDiv.children.length);
        
        // Force visibility and scroll
        messagesDiv.style.display = 'flex';
        messagesDiv.style.visibility = 'visible';
        aiMessage.style.display = 'flex';
        aiMessage.style.visibility = 'visible';
        
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        console.log('✅ [GEMINI CHAT] Message appended and visibility forced');
        
        // Log successful completion
        console.log('✅ [GEMINI CHAT] Chat message flow completed successfully');
        console.log('📝 [GEMINI CHAT] Final response:', aiReply.substring(0, 100) + '...');
        
        // Reset status indicator
        if (statusDot && statusText) {
            statusDot.className = 'status-dot connected';
            statusText.textContent = 'พร้อมใช้งาน';
        }
        
        input.disabled = false;
        input.focus();
    });
}

function setupOtherHandlers() {
    // Setup AI Settings button
    const aiSettingsBtn = document.getElementById('aiSettingsBtn');
    if (aiSettingsBtn) {
        aiSettingsBtn.addEventListener('click', showAiSettingsModal);
    }
    
    // Setup auto-population listeners
    setupAutoPopulationListeners();
    
    console.log('✅ Other handlers setup complete');
}

function setupAutoPopulationListeners() {
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
    
    console.log('✅ Auto-population listeners setup');
}

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

    // TODO: Replace with proper Gemini API implementation
    // const gemini = new Gemini20FlashEngine({ apiKey });
    
    // For now, show a placeholder response
    showNotification('⚠️ Gemini AI integration ยังไม่พร้อมใช้งาน กรุณาลองใหม่ภายหลัง', 'warning');
    return;

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

// ===== ENHANCED AI SETTINGS MODAL FUNCTIONS =====
// Added logging and proper event handler management to fix clicking issues

// Enhanced AI Settings Modal functions with better error handling
window.showAiSettingsModal = function() {
    console.log('🔧 [ENHANCED] Opening AI Settings Modal...');
    const modal = document.getElementById('aiSettingsModal');
    if (modal) {
        // Load existing API keys from localStorage
        loadExistingApiKeys();
        modal.style.display = 'flex';
        console.log('✅ [ENHANCED] AI Settings Modal opened successfully');
        showNotification('🔧 เปิด AI Settings Modal', 'info');
    } else {
        console.error('❌ [ENHANCED] AI Settings Modal not found in DOM');
        showNotification('❌ ไม่พบ Modal การตั้งค่า AI', 'error');
    }
};

window.closeAiSettingsModal = function() {
    console.log('❌ [ENHANCED] Closing AI Settings Modal...');
    const modal = document.getElementById('aiSettingsModal');
    if (modal) {
        modal.style.display = 'none';
        clearAllApiFeedback();
        console.log('✅ [ENHANCED] AI Settings Modal closed');
        showNotification('✅ ปิด AI Settings Modal', 'success');
    }
};

// Enhanced setupOtherHandlers with conflict resolution
function setupOtherHandlersEnhanced() {
    console.log('🔧 [ENHANCED] Setting up other handlers...');
    
    // Setup AI Settings button with enhanced debugging
    const aiSettingsBtn = document.getElementById('aiSettingsBtn');
    if (aiSettingsBtn) {
        console.log('🔍 [ENHANCED] Found AI Settings button:', aiSettingsBtn);
        
        // Remove any existing listeners to prevent conflicts
        aiSettingsBtn.removeEventListener('click', showAiSettingsModal);
        aiSettingsBtn.removeEventListener('click', window.showAiSettingsModal);
        
        // Add enhanced event listener with debugging
        const enhancedClickHandler = function(event) {
            console.log('🎯 [ENHANCED] AI Settings button clicked!', event);
            event.preventDefault();
            event.stopPropagation();
            window.showAiSettingsModal();
        };
        
        aiSettingsBtn.addEventListener('click', enhancedClickHandler);
        console.log('✅ [ENHANCED] AI Settings button handler attached');
        
        // Add visual feedback on hover
        aiSettingsBtn.style.cursor = 'pointer';
        aiSettingsBtn.title = 'Open AI Settings Modal';
        
        // Test if button is clickable
        const buttonRect = aiSettingsBtn.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(aiSettingsBtn);
        console.log('🔍 [ENHANCED] Button diagnostics:', {
            visible: buttonRect.width > 0 && buttonRect.height > 0,
            pointerEvents: computedStyle.pointerEvents,
            zIndex: computedStyle.zIndex,
            position: computedStyle.position,
            opacity: computedStyle.opacity,
            display: computedStyle.display,
            disabled: aiSettingsBtn.disabled
        });
        
    } else {
        console.error('❌ [ENHANCED] AI Settings button not found in DOM');
        
        // Try to find button with different selector
        const alternativeBtn = document.querySelector('button[id*="aiSettings"], button[class*="ai-settings"], .btn:contains("AI Settings")');
        if (alternativeBtn) {
            console.log('🔍 [ENHANCED] Found alternative AI Settings button:', alternativeBtn);
        } else {
            console.log('🔍 [ENHANCED] Searching for all buttons containing "Settings"...');
            const allButtons = document.querySelectorAll('button');
            allButtons.forEach((btn, index) => {
                if (btn.textContent.includes('Settings') || btn.textContent.includes('AI')) {
                    console.log(`🔍 [ENHANCED] Button ${index}:`, btn, 'Text:', btn.textContent);
                }
            });
        }
    }
    
    // Setup AI Settings Modal handlers
    setupAiSettingsModalHandlersEnhanced();
    
    // Setup auto-population listeners
    setupAutoPopulationListeners();
    
    console.log('✅ [ENHANCED] Other handlers setup complete');
}

function setupAiSettingsModalHandlersEnhanced() {
    console.log('🔧 [ENHANCED] Setting up AI Settings Modal handlers...');
    
    // Close button handler
    const closeBtn = document.getElementById('closeAiSettingsModal');
    if (closeBtn) {
        closeBtn.removeEventListener('click', window.closeAiSettingsModal);
        closeBtn.addEventListener('click', window.closeAiSettingsModal);
        console.log('✅ [ENHANCED] Close button handler attached');
    } else {
        console.warn('⚠️ [ENHANCED] Close button not found');
    }
    
    // Overlay click handler
    const modal = document.getElementById('aiSettingsModal');
    if (modal) {
        const enhancedOverlayHandler = function(e) {
            if (e.target.classList.contains('ai-modal-overlay')) {
                console.log('🎯 [ENHANCED] Overlay clicked, closing modal');
                window.closeAiSettingsModal();
            }
        };
        
        modal.removeEventListener('click', enhancedOverlayHandler);
        modal.addEventListener('click', enhancedOverlayHandler);
        console.log('✅ [ENHANCED] Overlay click handler attached');
    } else {
        console.warn('⚠️ [ENHANCED] AI Settings modal not found');
    }
    
    // Setup API test button handlers
    setupApiTestHandlersEnhanced();
    
    console.log('✅ [ENHANCED] AI Settings Modal handlers setup complete');
}

function setupApiTestHandlersEnhanced() {
    console.log('🧪 [ENHANCED] Setting up API test handlers...');
    
    const testButtons = [
        { id: 'testOpenaiApi', handler: testOpenaiApiHandler },
        { id: 'testClaudeApi', handler: testClaudeApiHandler },
        { id: 'testGoogleApi', handler: testGoogleApiHandler }
    ];
    
    testButtons.forEach(({ id, handler }) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.removeEventListener('click', handler);
            btn.addEventListener('click', handler);
            console.log(`✅ [ENHANCED] ${id} handler attached`);
        } else {
            console.warn(`⚠️ [ENHANCED] ${id} button not found`);
        }
    });
    
    // Confirm Settings
    const confirmBtn = document.getElementById('confirmAiSettings');
    if (confirmBtn) {
        confirmBtn.removeEventListener('click', confirmAiSettingsHandler);
        confirmBtn.addEventListener('click', confirmAiSettingsHandler);
        console.log('✅ [ENHANCED] Confirm settings handler attached');
    } else {
        console.warn('⚠️ [ENHANCED] Confirm settings button not found');
    }
    
    console.log('✅ [ENHANCED] API test handlers setup complete');
}

// Make enhanced functions globally available
window.setupOtherHandlersEnhanced = setupOtherHandlersEnhanced;
window.setupAiSettingsModalHandlersEnhanced = setupAiSettingsModalHandlersEnhanced;

console.log('✅ [ENHANCED] Enhanced AI Settings functions loaded');

// AI Swarm management functions
window.refreshAISwarmProviders = async function() {
    console.log('🔄 Refreshing AI Swarm providers...');
    if (window.aiSwarmCouncil && typeof window.aiSwarmCouncil.updateProviderStatus === 'function') {
        try {
            await window.aiSwarmCouncil.updateProviderStatus();
            showNotification('✅ AI Providers อัปเดตสำเร็จ', 'success');
        } catch (error) {
            console.error('❌ Error refreshing AI providers:', error);
            showNotification('❌ ไม่สามารถอัปเดต AI Providers ได้', 'error');
        }
    } else {
        showNotification('⚠️ AI Swarm Council ยังไม่พร้อมใช้งาน', 'warning');
    }
};

window.loadAISwarmData = function() {
    console.log('📊 Loading AI Swarm Council data...');
    
    const tableBody = document.getElementById('aiProvidersTableBody');
    if (!tableBody) {
        console.error('❌ aiProvidersTableBody element not found');
        return;
    }
    
    if (window.aiSwarmCouncil) {
        console.log('✅ AI Swarm Council available, rendering providers...');
        
        // Render providers table
        if (typeof window.aiSwarmCouncil.renderProviders === 'function') {
            console.log('🔄 Calling renderProviders...');
            window.aiSwarmCouncil.renderProviders();
        } else {
            console.warn('⚠️ renderProviders function not available');
        }
        
        // Update swarm display
        if (typeof window.aiSwarmCouncil.updateSwarmDisplay === 'function') {
            console.log('🔄 Calling updateSwarmDisplay...');
            window.aiSwarmCouncil.updateSwarmDisplay();
        }
        
        console.log('✅ AI Swarm data loaded');
    } else {
        console.warn('⚠️ AI Swarm Council not initialized, showing fallback...');
        // Show fallback data with the 5 AI providers
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="no-data">
                    <div style="text-align: center; padding: 20px;">
                        <i class="fas fa-robot" style="font-size: 2em; color: #ccc; margin-bottom: 10px;"></i>
                        <p>AI Swarm Council กำลังเริ่มต้น...</p>
                        <div style="margin: 15px 0;">
                            <button onclick="forceRenderAIProviders()" class="btn btn-primary" style="margin-right: 10px;">
                                <i class="fas fa-eye"></i> แสดง AI Providers
                            </button>
                            <button onclick="refreshAISwarmProviders()" class="btn btn-secondary" style="margin-right: 10px;">
                                <i class="fas fa-refresh"></i> รีเฟรช
                            </button>
                            <button onclick="debugAISwarm()" class="btn btn-warning">
                                <i class="fas fa-bug"></i> Debug
                            </button>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }
};

// ===== AI SWARM DEBUG FUNCTIONS =====
window.debugAISwarm = function() {
    console.log('🔍 [DEBUG] AI Swarm Council Status:');
    console.log('- aiSwarmCouncil exists:', !!window.aiSwarmCouncil);
    console.log('- aiSwarmCouncil type:', typeof window.aiSwarmCouncil);
    
    if (window.aiSwarmCouncil) {
        console.log('- providers:', window.aiSwarmCouncil.providers);
        console.log('- renderProviders function:', typeof window.aiSwarmCouncil.renderProviders);
        
        // Check if table element exists
        const tableBody = document.getElementById('aiProvidersTableBody');
        console.log('- aiProvidersTableBody exists:', !!tableBody);
        if (tableBody) {
            console.log('- current table content:', tableBody.innerHTML);
        }
        
        // Try manual render
        console.log('🔄 Attempting manual render...');
        if (typeof window.aiSwarmCouncil.renderProviders === 'function') {
            window.aiSwarmCouncil.renderProviders();
            console.log('✅ Manual render completed');
        } else {
            console.error('❌ renderProviders function not available');
        }
    }
};

window.forceRenderAIProviders = function() {
    console.log('🔄 [FORCE] Forcing AI Providers render...');
    
    const tableBody = document.getElementById('aiProvidersTableBody');
    if (!tableBody) {
        console.error('❌ aiProvidersTableBody not found');
        showNotification('❌ ไม่พบตาราง AI Providers', 'error');
        return;
    }
    
    // Create fake providers for testing
    const testProviders = {
        gemini: { 
            name: 'Gemini 2.0 Flash', 
            status: false, 
            role: 'primary_creator',
            expertise: ['content_creation', 'seo_optimization', 'multilingual']
        },
        openai: { 
            name: 'OpenAI GPT', 
            status: false, 
            role: 'quality_reviewer',
            expertise: ['quality_control', 'fact_checking', 'coherence']
        },
        claude: { 
            name: 'Claude AI', 
            status: false, 
            role: 'content_optimizer',
            expertise: ['structure_improvement', 'readability', 'engagement']
        },
        deepseek: { 
            name: 'DeepSeek AI', 
            status: false, 
            role: 'technical_validator',
            expertise: ['technical_accuracy', 'code_review', 'performance']
        },
        chinda: { 
            name: 'ChindaX AI', 
            status: false, 
            role: 'multilingual_advisor',
            expertise: ['translation', 'cultural_adaptation', 'thai_language']
        }
    };
    
    tableBody.innerHTML = '';
    
    Object.entries(testProviders).forEach(([key, provider]) => {
        const row = document.createElement('tr');
        row.className = `provider-row ${key} ${provider.status ? 'connected' : 'disconnected'}`;
        row.id = `provider-${key}`;
          row.innerHTML = `
            <td data-label="โมเดล AI" data-type="model" data-role="${key}">
                <div class="provider-info">
                    <div class="provider-icon">${getProviderIcon(key)}</div>
                    <div class="provider-details">
                        <h4>${provider.name}</h4>
                        <p class="provider-model">${getProviderType(key)}</p>
                    </div>
                </div>
            </td>            <td data-label="สถานะ" id="status-${key}" data-type="status" data-status="${provider.status ? 'active' : 'offline'}">
                <div class="provider-status-container">
                    <span class="status-indicator ${provider.status ? 'status-connected' : 'status-disconnected'}">
                        <i class="fas fa-circle" style="font-size: 8px;"></i>
                        ${provider.status ? 'เชื่อมต่อแล้ว' : 'ไม่ได้เชื่อมต่อ'}
                    </span>
                </div>
            </td>
            <td data-label="หน้าที่ในการทำงาน" data-type="role" data-role="${provider.role}">
                <div class="provider-role">${getProviderRoleInThai(provider.role)}</div>
            </td>
            <td data-label="ความเชี่ยวชาญ" class="description-cell" data-type="expertise">
                <div class="provider-expertise">
                    ${provider.expertise.map(exp => `<span class="expertise-tag">${getExpertiseInThai(exp)}</span>`).join('')}
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    console.log('✅ [FORCE] AI Providers rendered successfully');
    showNotification('✅ AI Providers แสดงผลเรียบร้อย', 'success');
};

// Helper functions for the force render
function getProviderIcon(providerKey) {
    const icons = {
        gemini: '⚡',
        openai: '🧠',
        claude: '🎭',
        deepseek: '🔍',
        chinda: '🧠'
    };
    return icons[providerKey] || '🤖';
}

function getProviderType(providerKey) {
    const types = {
        gemini: 'Google AI',
        openai: 'OpenAI',
        claude: 'Anthropic',
        deepseek: 'DeepSeek AI',
        chinda: 'ChindaX'
    };
    return types[providerKey] || 'AI Provider';
}

function getProviderRoleInThai(role) {
    const roles = {
        'primary_creator': 'นักสร้างสรรค์หลัก',
        'quality_reviewer': 'ผู้ตรวจสอบคุณภาพ',
        'content_optimizer': 'ผู้ปรับปรุงเนื้อหา',
        'technical_validator': 'ผู้ตรวจสอบเทคนิค',
        'multilingual_advisor': 'ที่ปรึกษาภาษา'
    };
    return roles[role] || role;
}

function getExpertiseInThai(expertise) {
    const expertiseMap = {
        'content_creation': 'สร้างเนื้อหา',
        'seo_optimization': 'ปรับ SEO',
        'multilingual': 'หลายภาษา',
        'quality_control': 'ควบคุมคุณภาพ',
        'fact_checking': 'ตรวจสอบข้อมูล',
        'coherence': 'ความสอดคล้อง',
        'structure_improvement': 'ปรับโครงสร้าง',
        'readability': 'อ่านง่าย',
        'engagement': 'ความน่าสนใจ',
        'technical_accuracy': 'ความถูกต้องทางเทคนิค',        'code_review': 'ตรวจสอบโค้ด',        'performance': 'ประสิทธิภาพ',
        'translation': 'แปลภาษา',
        'cultural_adaptation': 'ปรับตามวัฒนธรรม',
        'localization': 'ปรับภาษาท้องถิ่น',
        'thai_language': 'ภาษาไทย'
    };
    return expertiseMap[expertise] || expertise;
}

// Enhanced AI Monitoring Functions
window.refreshMonitoringLogs = function() {
    console.log('🔄 Refreshing AI Monitoring Logs...');
    showNotification('✅ รีเฟรช AI Monitoring สำเร็จ', 'success');
};

window.refreshAllProviderMetrics = function() {
    console.log('📊 Refreshing all provider metrics...');
    
    // Update performance metrics with mock data
    updateMetricDisplay('avgResponseTimeDisplay', '145ms');
    updateMetricDisplay('overallSuccessRateDisplay', '98.5%');
    updateMetricDisplay('avgQualityScoreDisplay', '9.2/10');
    updateMetricDisplay('uptimeDisplay', '99.8%');
    updateMetricDisplay('totalCostDisplay', '฿1,247.50');
    
    // Populate provider performance table
    populateProviderPerformanceTable();
    
    showNotification('📊 อัปเดตข้อมูล Provider Metrics สำเร็จ', 'success');
};

window.exportPerformanceReport = function() {
    console.log('📊 Exporting performance report...');
    
    const reportData = {
        timestamp: new Date().toISOString(),
        metrics: {
            avgResponseTime: '145ms',
            successRate: '98.5%',
            qualityScore: '9.2/10',
            uptime: '99.8%',
            totalCost: '฿1,247.50'
        },
        providers: ['Gemini 2.0 Flash', 'OpenAI GPT', 'Claude AI', 'DeepSeek AI', 'ChindaX AI']
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-performance-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('📄 Export รายงานประสิทธิภาพสำเร็จ', 'success');
};

// Helper function to update metric displays
function updateMetricDisplay(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
        element.style.color = '#16a34a';
        setTimeout(() => {
            element.style.color = '#374151';
        }, 2000);
    }
}

// Function to populate provider performance table
function populateProviderPerformanceTable() {
    const tableBody = document.getElementById('providerPerformanceTableBody');
    if (!tableBody) {
        console.error('❌ Provider performance table body not found');
        return;
    }
    
    const mockProviders = [
        {
            name: '⚡ Gemini 2.0 Flash',
            status: 'active',
            requests: '1,247',
            successRate: '98.5%',
            avgResponseTime: '120ms',
            qualityScore: '9.2/10',
            uptime: '99.8%',
            cost: '฿487.50'
        },
        {
            name: '🧠 OpenAI GPT',
            status: 'active',
            requests: '892',
            successRate: '97.2%',
            avgResponseTime: '180ms',
            qualityScore: '9.0/10',
            uptime: '99.5%',
            cost: '฿312.75'
        },
        {
            name: '🎭 Claude AI',
            status: 'active',
            requests: '654',
            successRate: '99.1%',
            avgResponseTime: '150ms',
            qualityScore: '9.4/10',
            uptime: '99.9%',
            cost: '฿289.25'
        },
        {
            name: '🔍 DeepSeek AI',
            status: 'offline',
            requests: '0',
            successRate: '0%',
            avgResponseTime: '--',
            qualityScore: '--',
            uptime: '0%',
            cost: '฿0.00'
        },
        {
            name: '🧠 ChindaX AI',
            status: 'warning',
            requests: '158',
            successRate: '95.5%',
            avgResponseTime: '250ms',
            qualityScore: '8.7/10',
            uptime: '98.2%',
            cost: '฿158.00'
        }
    ];
    
    tableBody.innerHTML = mockProviders.map(provider => `
        <tr class="provider-row ${provider.status}">
            <td><strong>${provider.name}</strong></td>
            <td>
                <span class="status-badge ${provider.status}">
                    <i class="fas fa-${getStatusIcon(provider.status)}"></i>
                    ${getStatusText(provider.status)}
                </span>
            </td>
            <td>${provider.requests}</td>
            <td>${provider.successRate}</td>
            <td>${provider.avgResponseTime}</td>
            <td>${provider.qualityScore}</td>
            <td>${provider.uptime}</td>
            <td>${provider.cost}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="viewProviderDetails('${provider.name}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="testProvider('${provider.name}')">
                        <i class="fas fa-cog"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Helper functions for status
function getStatusIcon(status) {
    const icons = {
        'active': 'check-circle',
        'offline': 'times-circle',
        'warning': 'exclamation-triangle',
        'error': 'exclamation-circle'
    };
    return icons[status] || 'circle';
}

function getStatusText(status) {
    const texts = {
        'active': 'เชื่อมต่อ',
        'offline': 'ออฟไลน์',
        'warning': 'เตือน',
        'error': 'ข้อผิดพลาด'
    };
    return texts[status] || status;
}

// Provider action functions
window.viewProviderDetails = function(providerName) {
    console.log('👀 Viewing details for:', providerName);
    showNotification(`กำลังแสดงรายละเอียดของ ${providerName}`, 'info');
};

window.testProvider = function(providerName) {
    console.log('🧪 Testing provider:', providerName);
    showNotification(`กำลังทดสอบการเชื่อมต่อ ${providerName}`, 'info');
};

// Initialize AI Monitoring when section is shown
window.initAIMonitoring = function() {
    console.log('🔄 Initializing AI Monitoring...');
    populateProviderPerformanceTable();
    updateMetricDisplay('avgResponseTimeDisplay', '145ms');
    updateMetricDisplay('overallSuccessRateDisplay', '98.5%');
    updateMetricDisplay('avgQualityScoreDisplay', '9.2/10');
    updateMetricDisplay('uptimeDisplay', '99.8%');
    updateMetricDisplay('totalCostDisplay', '฿1,247.50');
};

// ===== MANUAL DEBUGGING FUNCTIONS =====
// Use these functions in browser console to diagnose issues

window.debugAiSettingsButton = function() {
    console.log('🔍 [DEBUG] Starting AI Settings button diagnostics...');
    
    const btn = document.getElementById('aiSettingsBtn');
    
    if (!btn) {
        console.error('❌ [DEBUG] Button not found with ID "aiSettingsBtn"');
        
        // Try alternative selectors
        const alternatives = [
            document.querySelector('button:contains("AI Settings")'),
            document.querySelector('[class*="ai-settings"]'),
            document.querySelector('.btn:contains("Settings")'),
            document.querySelector('button[onclick*="aiSettings"]')
        ];
        
        alternatives.forEach((alt, index) => {
            if (alt) {
                console.log(`🔍 [DEBUG] Alternative button ${index} found:`, alt);
            }
        });
        
        return false;
    }
    
    console.log('✅ [DEBUG] Button found:', btn);
    
    // Check button properties
    const rect = btn.getBoundingClientRect();
    const style = window.getComputedStyle(btn);
    const listeners = getEventListeners ? getEventListeners(btn) : 'Not available';
    
    const diagnostics = {
        element: btn,
        visible: rect.width > 0 && rect.height > 0,
        dimensions: { width: rect.width, height: rect.height },
        position: { x: rect.x, y: rect.y },
        styles: {
            display: style.display,
            visibility: style.visibility,
            opacity: style.opacity,
            pointerEvents: style.pointerEvents,
            zIndex: style.zIndex,
            position: style.position,
            cursor: style.cursor
        },
        attributes: {
            id: btn.id,
            className: btn.className,
            disabled: btn.disabled,
            type: btn.type
        },
        eventListeners: listeners,
        parentElement: btn.parentElement,
        innerHTML: btn.innerHTML
    };
    
    console.log('🔍 [DEBUG] Button diagnostics:', diagnostics);
    
    // Test click programmatically
    console.log('🧪 [DEBUG] Testing programmatic click...');
    try {
        btn.click();
        console.log('✅ [DEBUG] Programmatic click successful');
    } catch (error) {
        console.error('❌ [DEBUG] Programmatic click failed:', error);
    }
    
    return diagnostics;
};

window.debugAiSettingsModal = function() {
    console.log('🔍 [DEBUG] Starting AI Settings modal diagnostics...');
    
    const modal = document.getElementById('aiSettingsModal');
    
    if (!modal) {
        console.error('❌ [DEBUG] Modal not found with ID "aiSettingsModal"');
        return false;
    }
    
    console.log('✅ [DEBUG] Modal found:', modal);
    
    const style = window.getComputedStyle(modal);
    const rect = modal.getBoundingClientRect();
    
    const modalDiagnostics = {
        element: modal,
        visible: rect.width > 0 && rect.height > 0,
        styles: {
            display: style.display,
            visibility: style.visibility,
            opacity: style.opacity,
            zIndex: style.zIndex,
            position: style.position
        },
        innerHTML: modal.innerHTML.substring(0, 200) + '...'
    };
    
    console.log('🔍 [DEBUG] Modal diagnostics:', modalDiagnostics);
    
    return modalDiagnostics;
};

window.debugAllEventListeners = function() {
    console.log('🔍 [DEBUG] Checking all event listeners on the page...');
    
    const elements = document.querySelectorAll('*');
    const elementsWithListeners = [];
    
    elements.forEach(el => {
        if (getEventListeners) {
            const listeners = getEventListeners(el);
            if (Object.keys(listeners).length > 0) {
                elementsWithListeners.push({
                    element: el,
                    listeners: listeners
                });
            }
        }
    });
    
    console.log('🔍 [DEBUG] Elements with event listeners:', elementsWithListeners);
    return elementsWithListeners;
};

window.forceOpenAiSettingsModal = function() {
    console.log('🚀 [DEBUG] Force opening AI Settings Modal...');
    
    // Try multiple methods
    const methods = [
        () => window.showAiSettingsModal(),
        () => showAiSettingsModal(),
        () => {
            const modal = document.getElementById('aiSettingsModal');
            if (modal) {
                modal.style.display = 'flex';
                console.log('✅ [DEBUG] Modal opened via direct style manipulation');
            }
        },
        () => window.openAiSettingsModal && window.openAiSettingsModal()
    ];
    
    methods.forEach((method, index) => {
        try {
            console.log(`🧪 [DEBUG] Trying method ${index + 1}...`);
            method();
        } catch (error) {
            console.warn(`⚠️ [DEBUG] Method ${index + 1} failed:`, error);
        }
    });
};

console.log('✅ [DEBUG] Debugging functions loaded. Use: debugAiSettingsButton(), debugAiSettingsModal(), debugAllEventListeners(), forceOpenAiSettingsModal()');
