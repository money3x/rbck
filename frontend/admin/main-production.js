// ===== PRODUCTION-READY RBCK CMS ADMIN PANEL =====
// All-in-one JavaScript file for production deployment
// No ES6 modules, all functions available in global scope

console.log('🚀 [MAIN] Loading RBCK CMS Admin Panel...');

// ===== CONFIGURATION =====
// Smart configuration ที่ตรวจจับ environment อัตโนมัติ
const config = {
    apiBase: (() => {
        const hostname = window.location.hostname;
        const port = window.location.port;
        const protocol = window.location.protocol;
        
        console.log('🔍 [CONFIG] Detecting environment...');
        console.log('🔍 [CONFIG] Hostname:', hostname);
        console.log('🔍 [CONFIG] Port:', port);
        console.log('🔍 [CONFIG] Protocol:', protocol);
          // Local development (localhost with any port)
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            console.log('🏠 [CONFIG] Local development detected');
            return 'http://localhost:10000/api';  // ✅ ใช้ port 10000 ตาม backend
        }
        
        // Check if we're on Netlify (frontend) calling Render (backend)
        if (hostname.includes('netlify.app') || hostname.includes('rbck')) {
            console.log('☁️ [CONFIG] Production (Netlify->Render) detected');
            return 'https://rbck.onrender.com/api';
        }
        
        // Fallback for production
        console.log('🌐 [CONFIG] Production fallback');
        return 'https://rbck.onrender.com/api';
    })(),
    version: '2025-06-19-production-v2'
};

console.log('🔧 [CONFIG] API Base:', config.apiBase);

// ===== GLOBAL VARIABLES =====
let currentUser = null;
let authToken = localStorage.getItem('authToken');
let aiSwarmCouncil = null;
let isAppInitialized = false;

// ===== AI PROVIDERS DATA =====
const AI_PROVIDERS = [
    {
        id: 'gemini',
        name: 'Gemini 2.0 Flash',
        type: 'Google AI',
        icon: '⚡',
        role: 'นักสร้างสรรค์หลัก',
        specialties: ['สร้างเนื้อหา', 'ปรับ SEO', 'หลายภาษา'],
        description: 'AI สำหรับสร้างเนื้อหาคุณภาพสูงและปรับแต่ง SEO อัตโนมัติ'
    },
    {
        id: 'openai',
        name: 'OpenAI GPT',
        type: 'OpenAI',
        icon: '🧠',
        role: 'ผู้ตรวจสอบคุณภาพ',
        specialties: ['ควบคุมคุณภาพ', 'ตรวจสอบข้อมูล', 'ความสอดคล้อง'],
        description: 'AI สำหรับตรวจสอบและประกันคุณภาพเนื้อหาให้มีมาตรฐาน'
    },
    {
        id: 'claude',
        name: 'Claude AI',
        type: 'Anthropic',
        icon: '🎭',
        role: 'ผู้ปรับปรุงเนื้อหา',
        specialties: ['ปรับโครงสร้าง', 'อ่านง่าย', 'ความน่าสนใจ'],
        description: 'AI สำหรับปรับปรุงโครงสร้างและเพิ่มความน่าสนใจของเนื้อหา'
    },
    {
        id: 'deepseek',
        name: 'DeepSeek AI',
        type: 'DeepSeek AI',
        icon: '🔍',
        role: 'ผู้ตรวจสอบเทคนิค',
        specialties: ['ความถูกต้องทางเทคนิค', 'ตรวจสอบโค้ด', 'ประสิทธิภาพ'],
        description: 'AI สำหรับตรวจสอบความถูกต้องทางเทคนิคและประสิทธิภาพระบบ'
    },
    {
        id: 'chindax',
        name: 'ChindaX AI',
        type: 'ChindaX',
        icon: '🧠',
        role: 'ที่ปรึกษาภาษา',
        specialties: ['แปลภาษา', 'ปรับตามวัฒนธรรม', 'ภาษาไทย'],
        description: 'AI สำหรับการแปลภาษาและปรับให้เหมาะสมกับวัฒนธรรมไทย'
    }
];

// ===== UTILITY FUNCTIONS =====
async function apiRequest(endpoint, options = {}) {
    const url = `${config.apiBase}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (authToken) {
        defaultOptions.headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const finalOptions = { ...defaultOptions, ...options };
    
    try {
        console.log(`🔄 [API] ${finalOptions.method || 'GET'} ${url}`);
        const response = await fetch(url, finalOptions);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`✅ [API] Response:`, data);
        return data;
    } catch (error) {
        console.error(`❌ [API] Error:`, error);
        throw error;
    }
}

// ===== NOTIFICATION SYSTEM =====
window.showNotification = function(message, type = 'info') {
    console.log(`📢 [NOTIFICATION] [${type}]:`, message);
    
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : type === 'warning' ? '#ff9800' : '#2196f3'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-family: 'Sarabun', sans-serif;
        font-size: 14px;
        max-width: 350px;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `;
    
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    notification.innerHTML = `${icon} ${message}`;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
};

// ===== NAVIGATION SYSTEM =====
window.showSection = function(sectionId) {
    console.log('🔄 [NAV] Showing section:', sectionId);
    
    try {
        // Hide all sections
        document.querySelectorAll('.content-section, .section').forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none';
        });
        
        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Show selected section
        const selectedSection = document.getElementById(sectionId);
        if (selectedSection) {
            selectedSection.classList.add('active');
            selectedSection.style.display = 'block';
            console.log('✅ [NAV] Section shown:', sectionId);
        } else {
            console.error('❌ [NAV] Section not found:', sectionId);
            showNotification('ไม่พบหน้าที่ต้องการ: ' + sectionId, 'error');
            return;
        }
        
        // Update active nav link
        const navLink = document.querySelector(`.nav-link[onclick*="${sectionId}"]`);
        if (navLink) {
            navLink.classList.add('active');
        }
        
        // Update page title
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            let title = '';
            switch(sectionId) {
                case 'dashboard':
                    title = '🚀 Gemini 2.0 Flash Dashboard';
                    loadDashboard();
                    break;
                case 'blog-manage':
                    title = 'จัดการบทความ';
                    loadPosts();
                    break;
                case 'blog-create':
                    title = 'สร้างบทความใหม่';
                    break;
                case 'seo-tools':
                    title = '🚀 Gemini 2.0 SEO Tools';
                    break;
                case 'analytics':
                    title = '📊 Flash Analytics';
                    loadAnalytics();
                    break;
                case 'ai-swarm':
                    title = '🤖 AI Swarm Council';
                    loadAISwarmData();
                    break;
                case 'ai-monitoring':
                    title = '📊 AI Monitoring';
                    break;
                case 'migration':
                    title = '🔄 Migration';
                    break;
                default:
                    title = sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
            }
            pageTitle.textContent = title;
        }
        
    } catch (error) {
        console.error('❌ [NAV] Error in showSection:', error);
        showNotification('เกิดข้อผิดพลาดในการเปลี่ยนหน้า: ' + error.message, 'error');
    }
};

// ===== AI SWARM COUNCIL FUNCTIONS =====
window.loadAISwarmData = function() {
    console.log('📊 [AI SWARM] Loading AI Swarm data...');
    forceRenderAIProviders();
};

window.forceRenderAIProviders = function() {
    console.log('🔄 [AI SWARM] Force rendering AI Providers...');
    
    const tableBody = document.getElementById('aiProvidersTableBody');
    if (!tableBody) {
        console.error('❌ [AI SWARM] aiProvidersTableBody not found');
        showNotification('❌ ไม่พบตาราง AI Providers', 'error');
        return;
    }
    
    tableBody.innerHTML = '';
    
    AI_PROVIDERS.forEach(provider => {
        const row = document.createElement('tr');
        row.className = 'provider-row';
        row.id = `provider-${provider.id}`;
        
        const specialtyTags = provider.specialties.map(spec => 
            `<span class="specialty-tag">${spec}</span>`
        ).join('');
        
        row.innerHTML = `
            <td>
                <div class="provider-info">
                    <span class="provider-icon">${provider.icon}</span>
                    <div>
                        <div class="provider-name">${provider.name}</div>
                        <div class="provider-role">${provider.role}</div>
                    </div>
                </div>
            </td>
            <td>
                <span class="status-indicator status-checking" id="status-${provider.id}">
                    <i class="fas fa-spinner fa-spin"></i> กำลังตรวจสอบ
                </span>
            </td>
            <td>${provider.role}</td>
            <td>
                <div class="provider-specialties">
                    ${specialtyTags}
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    console.log('✅ [AI SWARM] AI Providers rendered successfully');
    showNotification('✅ แสดง AI Providers เรียบร้อย', 'success');
    
    // Check status after rendering
    setTimeout(() => {
        checkAIProvidersStatus();
    }, 1000);
};

async function checkAIProvidersStatus() {
    console.log('🔍 [AI SWARM] Checking AI Providers status...');
    
    for (const provider of AI_PROVIDERS) {
        const statusElement = document.getElementById(`status-${provider.id}`);
        if (!statusElement) continue;
        
        try {
            // Try to check real status from backend
            const response = await fetch(`${config.apiBase}/ai/status`);
            if (response.ok) {
                const data = await response.json();
                const providerStatus = data.providers?.[provider.id];
                
                if (providerStatus?.status === 'connected' || providerStatus?.available) {
                    statusElement.innerHTML = '<i class="fas fa-check-circle"></i> เชื่อมต่อแล้ว';
                    statusElement.className = 'status-indicator status-connected';
                } else {
                    statusElement.innerHTML = '<i class="fas fa-times-circle"></i> ไม่ได้เชื่อมต่อ';
                    statusElement.className = 'status-indicator status-disconnected';
                }
            } else {
                throw new Error('API not available');
            }
        } catch (error) {
            console.warn(`⚠️ [AI SWARM] Could not check ${provider.id} status:`, error.message);
            // Show disconnected status
            statusElement.innerHTML = '<i class="fas fa-times-circle"></i> ไม่ได้เชื่อมต่อ';
            statusElement.className = 'status-indicator status-disconnected';
        }
    }
    
    console.log('✅ [AI SWARM] Status check completed');
}

window.refreshAISwarmProviders = function() {
    console.log('🔄 [AI SWARM] Refreshing AI Swarm providers...');
    showNotification('🔄 กำลังอัปเดต AI Providers...', 'info');
    
    setTimeout(() => {
        forceRenderAIProviders();
    }, 500);
};

window.debugAISwarm = function() {
    console.log('🔍 [AI SWARM] Debug Info:');
    console.log('- AI_PROVIDERS count:', AI_PROVIDERS.length);
    console.log('- forceRenderAIProviders type:', typeof window.forceRenderAIProviders);
    console.log('- refreshAISwarmProviders type:', typeof window.refreshAISwarmProviders);
    
    const tableBody = document.getElementById('aiProvidersTableBody');
    console.log('- aiProvidersTableBody exists:', !!tableBody);
    if (tableBody) {
        console.log('- current table rows:', tableBody.children.length);
    }
    
    showNotification('🐛 Debug info ดูใน Console (F12)', 'info');
};

// ===== DASHBOARD FUNCTIONS =====
async function loadDashboard() {
    console.log('📊 [DASHBOARD] Loading dashboard...');
    
    try {
        const [healthResponse, postsResponse] = await Promise.allSettled([
            apiRequest('/health'),
            apiRequest('/posts')
        ]);
        
        // Update system status
        if (healthResponse.status === 'fulfilled') {
            const health = healthResponse.value;
            const statusElement = document.getElementById('system-status');
            if (statusElement) {
                statusElement.textContent = health.status || 'unknown';
                statusElement.className = `status-${health.status}`;
            }
        }
        
        // Update posts count
        if (postsResponse.status === 'fulfilled' && postsResponse.value.success) {
            const posts = postsResponse.value.data || [];
            const totalElement = document.getElementById('total-posts');
            if (totalElement) {
                totalElement.textContent = posts.length;
            }
        }
        
        console.log('✅ [DASHBOARD] Dashboard loaded');
    } catch (error) {
        console.error('❌ [DASHBOARD] Error loading dashboard:', error);
        showNotification('ไม่สามารถโหลดข้อมูล Dashboard ได้', 'error');
    }
}

// ===== POSTS FUNCTIONS =====
async function loadPosts() {
    console.log('📝 [POSTS] Loading posts...');
    
    try {
        const response = await apiRequest('/posts');
        const postsContainer = document.getElementById('posts-list');
        
        if (!postsContainer) {
            console.warn('⚠️ [POSTS] posts-list container not found');
            return;
        }
        
        if (response.success && response.data && response.data.length > 0) {
            postsContainer.innerHTML = response.data.map(post => `
                <div class="post-item" data-id="${post.id}">
                    <h3>${post.title || 'ไม่มีชื่อ'}</h3>
                    <p>${(post.content || '').substring(0, 100)}${post.content && post.content.length > 100 ? '...' : ''}</p>
                    <div class="post-meta">
                        <span>โดย: ${post.author || 'ไม่ทราบ'}</span>
                        <span>${post.created_at ? new Date(post.created_at).toLocaleDateString('th-TH') : 'ไม่ทราบวันที่'}</span>
                        <span class="status ${post.published ? 'published' : 'draft'}">
                            ${post.published ? 'เผยแพร่แล้ว' : 'ร่าง'}
                        </span>
                    </div>
                    <div class="post-actions">
                        <button onclick="editPost(${post.id})" class="btn-edit">แก้ไข</button>
                        <button onclick="deletePost(${post.id})" class="btn-delete">ลบ</button>
                    </div>
                </div>
            `).join('');
        } else {
            postsContainer.innerHTML = '<div class="no-data"><p>ไม่พบโพสต์</p></div>';
        }
        
        console.log('✅ [POSTS] Posts loaded successfully');
    } catch (error) {
        console.error('❌ [POSTS] Error loading posts:', error);
        const postsContainer = document.getElementById('posts-list');
        if (postsContainer) {
            postsContainer.innerHTML = '<div class="error"><p>ไม่สามารถโหลดโพสต์ได้</p></div>';
        }
        showNotification('ไม่สามารถโหลดโพสต์ได้', 'error');
    }
}

// ===== ANALYTICS FUNCTIONS =====
async function loadAnalytics() {
    console.log('📊 [ANALYTICS] Loading analytics...');
    
    try {
        const [healthResponse, cacheResponse] = await Promise.allSettled([
            apiRequest('/health'),
            apiRequest('/cache/stats')
        ]);
        
        // Update system metrics
        if (healthResponse.status === 'fulfilled') {
            const health = healthResponse.value;
            updateElement('systemStatus', health.status || 'unknown');
            updateElement('uptime', health.uptime ? `${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m` : '0h 0m');
            updateElement('memoryUsage', health.memory ? `${health.memory.used}MB / ${health.memory.total}MB` : 'N/A');
            updateElement('databaseStatus', health.database || 'unknown');
        }
        
        // Update cache metrics
        if (cacheResponse.status === 'fulfilled' && cacheResponse.value.success) {
            const cache = cacheResponse.value.data;
            let totalKeys = 0;
            let totalHits = 0;
            let totalMisses = 0;
            
            Object.values(cache).forEach(cacheData => {
                if (typeof cacheData === 'object' && cacheData.keys !== undefined) {
                    totalKeys += cacheData.keys || 0;
                    totalHits += cacheData.hits || 0;
                    totalMisses += cacheData.misses || 0;
                }
            });
            
            const hitRate = totalHits + totalMisses > 0 ? 
                ((totalHits / (totalHits + totalMisses)) * 100).toFixed(1) : '0.0';
            
            updateElement('cacheHitRate', `${hitRate}%`);
            updateElement('cacheSize', totalKeys.toString());
            updateElement('cacheKeys', totalKeys.toString());
        }
        
        console.log('✅ [ANALYTICS] Analytics loaded successfully');
    } catch (error) {
        console.error('❌ [ANALYTICS] Error loading analytics:', error);
        showNotification('ไม่สามารถโหลดข้อมูลสถิติได้', 'error');
    }
}

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

// ===== BLOG MANAGEMENT FUNCTIONS =====
window.loadBlogPosts = async function() {
    console.log('📝 [BLOG] Loading blog posts...');
    
    try {
        const response = await apiRequest('/posts');
        const postsContainer = document.getElementById('posts-list');
        
        if (!postsContainer) {
            console.warn('⚠️ [BLOG] posts-list container not found');
            showNotification('⚠️ ไม่พบตาราง Posts', 'warning');
            return;
        }
        
        if (response.success && response.data && response.data.length > 0) {
            postsContainer.innerHTML = response.data.map(post => `
                <div class="post-item" data-id="${post.id}">
                    <h3>${post.title || 'ไม่มีชื่อ'}</h3>
                    <p>${(post.content || '').substring(0, 100)}${post.content && post.content.length > 100 ? '...' : ''}</p>
                    <div class="post-meta">
                        <span>โดย: ${post.author || 'ไม่ทราบ'}</span>
                        <span>${post.created_at ? new Date(post.created_at).toLocaleDateString('th-TH') : 'ไม่ทราบวันที่'}</span>
                        <span class="status ${post.published ? 'published' : 'draft'}">
                            ${post.published ? 'เผยแพร่แล้ว' : 'ร่าง'}
                        </span>
                    </div>
                    <div class="post-actions">
                        <button onclick="editPost(${post.id})" class="btn-edit">แก้ไข</button>
                        <button onclick="deletePost(${post.id})" class="btn-delete">ลบ</button>
                    </div>
                </div>
            `).join('');
            
            console.log(`✅ [BLOG] Loaded ${response.data.length} posts`);
            showNotification(`✅ โหลด ${response.data.length} โพสต์เรียบร้อย`, 'success');
        } else {
            postsContainer.innerHTML = '<div class="no-data"><p>ไม่พบโพสต์</p></div>';
            console.log('📝 [BLOG] No posts found');
            showNotification('📝 ไม่พบโพสต์', 'info');
        }
        
    } catch (error) {
        console.error('❌ [BLOG] Error loading posts:', error);
        const postsContainer = document.getElementById('posts-list');
        if (postsContainer) {
            postsContainer.innerHTML = '<div class="error"><p>ไม่สามารถโหลดโพสต์ได้</p></div>';
        }
        showNotification('❌ ไม่สามารถโหลดโพสต์ได้: ' + error.message, 'error');
    }
};

window.savePost = async function() {
    console.log('💾 [BLOG] Saving post...');
    
    try {
        const titleElement = document.getElementById('postTitle');
        const contentElement = document.getElementById('postContent');
        const publishedElement = document.getElementById('postPublished');
        
        if (!titleElement || !contentElement) {
            throw new Error('ไม่พบฟอร์มเพื่อบันทึกโพสต์');
        }
        
        const postData = {
            title: titleElement.value.trim(),
            content: contentElement.value.trim(),
            published: publishedElement ? publishedElement.checked : false
        };
        
        // Validation
        if (!postData.title) {
            throw new Error('กรุณาระบุชื่อโพสต์');
        }
        
        if (!postData.content) {
            throw new Error('กรุณาระบุเนื้อหาโพสต์');
        }
        
        showNotification('💾 กำลังบันทึกโพสต์...', 'info');
        
        const response = await apiRequest('/posts', {
            method: 'POST',
            body: JSON.stringify(postData)
        });
        
        if (response.success) {
            console.log('✅ [BLOG] Post saved successfully');
            showNotification('✅ บันทึกโพสต์เรียบร้อย', 'success');
            clearForm();
            
            // Switch to blog manage section and reload posts
            showSection('blog-manage');
            setTimeout(() => {
                loadBlogPosts();
            }, 500);
        } else {
            throw new Error(response.error || 'ไม่สามารถบันทึกโพสต์ได้');
        }
        
    } catch (error) {
        console.error('❌ [BLOG] Error saving post:', error);
        showNotification('❌ ไม่สามารถบันทึกโพสต์ได้: ' + error.message, 'error');
    }
};

window.clearForm = function() {
    console.log('🧹 [BLOG] Clearing form...');
    
    try {
        const titleElement = document.getElementById('postTitle');
        const contentElement = document.getElementById('postContent');
        const publishedElement = document.getElementById('postPublished');
        
        if (titleElement) titleElement.value = '';
        if (contentElement) contentElement.value = '';
        if (publishedElement) publishedElement.checked = false;
        
        console.log('✅ [BLOG] Form cleared');
        showNotification('✅ ล้างฟอร์มเรียบร้อย', 'success');
        
    } catch (error) {
        console.error('❌ [BLOG] Error clearing form:', error);
        showNotification('❌ ไม่สามารถล้างฟอร์มได้: ' + error.message, 'error');
    }
};

// ===== ADDITIONAL MISSING FUNCTIONS =====
window.exportData = function() {
    console.log('📤 [EXPORT] Exporting data...');
    showNotification('📤 การส่งออกข้อมูลยังไม่พร้อมใช้งาน', 'info');
};

window.formatText = function(command) {
    console.log('📝 [EDITOR] Format text:', command);
    try {
        document.execCommand(command, false, null);
    } catch (error) {
        console.warn('⚠️ [EDITOR] Format command failed:', error);
    }
};

window.insertHeading = function() {
    console.log('📝 [EDITOR] Insert heading...');
    try {
        const text = prompt('กรุณาระบุข้อความหัวข้อ:');
        if (text) {
            document.execCommand('insertHTML', false, `<h3>${text}</h3>`);
        }
    } catch (error) {
        console.warn('⚠️ [EDITOR] Insert heading failed:', error);
    }
};

window.insertList = function() {
    console.log('📝 [EDITOR] Insert list...');
    try {
        document.execCommand('insertUnorderedList', false, null);
    } catch (error) {
        console.warn('⚠️ [EDITOR] Insert list failed:', error);
    }
};

window.insertLink = function() {
    console.log('📝 [EDITOR] Insert link...');
    try {
        const url = prompt('กรุณาระบุ URL:');
        if (url) {
            document.execCommand('createLink', false, url);
        }
    } catch (error) {
        console.warn('⚠️ [EDITOR] Insert link failed:', error);
    }
};

window.showArticleIdeaModal = function() {
    console.log('💡 [GEMINI] Show article idea modal...');
    showNotification('💡 Gemini Article Ideas ยังไม่พร้อมใช้งาน', 'info');
};

window.autoGenerateContent = function() {
    console.log('🤖 [GEMINI] Auto generate content...');
    showNotification('🤖 การสร้างเนื้อหาอัตโนมัติยังไม่พร้อมใช้งาน', 'info');
};

window.toggleSidebar = function() {
    console.log('📱 [UI] Toggle sidebar...');
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('mobile-open');
    }
};

// Update function list in initialization
window.debugFunctions = function() {
    console.log('🔍 [DEBUG] Available functions:', {
        // Navigation & Core
        showSection: typeof window.showSection,
        showNotification: typeof window.showNotification,
        
        // Blog Management
        loadBlogPosts: typeof window.loadBlogPosts,
        savePost: typeof window.savePost,
        clearForm: typeof window.clearForm,
        editPost: typeof window.editPost,
        deletePost: typeof window.deletePost,
        
        // AI Swarm
        loadAISwarmData: typeof window.loadAISwarmData,
        forceRenderAIProviders: typeof window.forceRenderAIProviders,
        refreshAISwarmProviders: typeof window.refreshAISwarmProviders,
        debugAISwarm: typeof window.debugAISwarm,
        
        // Editor Functions
        formatText: typeof window.formatText,
        insertHeading: typeof window.insertHeading,
        insertList: typeof window.insertList,
        insertLink: typeof window.insertLink,
        
        // Gemini Functions
        showArticleIdeaModal: typeof window.showArticleIdeaModal,
        autoGenerateContent: typeof window.autoGenerateContent,
        
        // UI Functions
        toggleSidebar: typeof window.toggleSidebar,
        exportData: typeof window.exportData,
        logout: typeof window.logout
    });
    
    showNotification('🔍 Check console for function debug info', 'info');
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 [INIT] DOM loaded, initializing admin panel...');
    
    // Check if all required elements exist
    const requiredElements = ['dashboard'];
    const missingElements = [];
    
    requiredElements.forEach(id => {
        if (!document.getElementById(id)) {
            missingElements.push(id);
        }
    });
    
    if (missingElements.length > 0) {
        console.warn('⚠️ [INIT] Missing elements:', missingElements);
    }
    
    // Initialize default view
    showSection('dashboard');
      console.log('✅ [INIT] Admin panel initialized successfully');
    console.log('✅ [INIT] Available functions:', {
        // Navigation & Core
        showSection: typeof window.showSection,
        showNotification: typeof window.showNotification,
        
        // Blog Management  
        loadBlogPosts: typeof window.loadBlogPosts,
        savePost: typeof window.savePost,
        clearForm: typeof window.clearForm,
        editPost: typeof window.editPost,
        deletePost: typeof window.deletePost,
        
        // AI Swarm
        forceRenderAIProviders: typeof window.forceRenderAIProviders,
        refreshAISwarmProviders: typeof window.refreshAISwarmProviders,
        debugAISwarm: typeof window.debugAISwarm,
        loadAISwarmData: typeof window.loadAISwarmData,
        
        // Additional Functions
        toggleSidebar: typeof window.toggleSidebar,
        exportData: typeof window.exportData,
        logout: typeof window.logout,
        debugFunctions: typeof window.debugFunctions
    });
    
    showNotification('🚀 RBCK CMS พร้อมใช้งาน', 'success');
    isAppInitialized = true;
});

console.log('✅ [MAIN] Production-ready RBCK CMS loaded successfully');
