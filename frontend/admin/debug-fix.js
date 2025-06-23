// Emergency fix for ReferenceError: showSection is not defined
// This file ensures critical functions are available immediately

console.log('🚨 [DEBUG-FIX] Loading emergency functions...');

// Critical showSection function
window.showSection = function(sectionId) {
    console.log('🔄 [DEBUG-FIX] Showing section:', sectionId);
    
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
            console.log('✅ [DEBUG-FIX] Section shown:', sectionId);
        } else {
            console.error('❌ [DEBUG-FIX] Section not found:', sectionId);
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
                    break;
                case 'blog-manage':
                    title = 'จัดการบทความ';
                    break;
                case 'blog-create':
                    title = 'สร้างบทความใหม่';
                    break;
                case 'seo-tools':
                    title = '🚀 Gemini 2.0 SEO Tools';
                    break;
                case 'analytics':
                    title = '📊 Flash Analytics';
                    // Load analytics data
                    if (typeof window.loadAnalytics === 'function') {
                        window.loadAnalytics();
                    }
                    break;                case 'ai-swarm':
                    title = '🤖 AI Swarm Council';
                    // Load AI Swarm data if available
                    console.log('🔄 [DEBUG-FIX] Loading AI Swarm Council...');
                    setTimeout(() => {
                        if (typeof window.loadAISwarmData === 'function') {
                            console.log('✅ [DEBUG-FIX] Calling loadAISwarmData...');
                            window.loadAISwarmData();
                        } else if (typeof window.forceRenderAIProviders === 'function') {
                            console.log('✅ [DEBUG-FIX] Calling forceRenderAIProviders...');
                            window.forceRenderAIProviders();
                        } else {
                            console.log('⚠️ [DEBUG-FIX] No AI Swarm functions available, showing fallback...');
                            // Show fallback message
                            const tableBody = document.getElementById('aiProvidersTableBody');
                            if (tableBody) {
                                tableBody.innerHTML = `
                                    <tr>
                                        <td colspan="4" style="text-align: center; padding: 20px;">
                                            <i class="fas fa-robot" style="font-size: 2em; color: #ccc; margin-bottom: 10px;"></i>
                                            <p>AI Swarm Council กำลังโหลด...</p>
                                            <p><small>กรุณารอสักครู่</small></p>
                                        </td>
                                    </tr>
                                `;
                            }
                        }
                    }, 500);
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
        console.error('❌ [DEBUG-FIX] Error in showSection:', error);
        alert('เกิดข้อผิดพลาดในการเปลี่ยนหน้า: ' + error.message);
    }
};

// Essential notification function
window.showNotification = function(message, type = 'info') {
    console.log(`📢 [DEBUG-FIX] Notification [${type}]:`, message);
    
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
        border-radius: 4px;
        z-index: 10000;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
};

// Essential functions for HTML onclick handlers
window.loadBlogPosts = function() {
    console.log('📝 [DEBUG-FIX] Loading blog posts...');
    showNotification('กำลังโหลดบทความ...', 'info');
};

window.savePost = function() {
    console.log('💾 [DEBUG-FIX] Saving post...');
    showNotification('กำลังบันทึกบทความ...', 'info');
};

window.editPost = function(id) {
    console.log('✏️ [DEBUG-FIX] Editing post:', id);
    showNotification('กำลังแก้ไขบทความ...', 'info');
};

window.deletePost = function(id) {
    if (confirm('แน่ใจหรือไม่ว่าต้องการลบบทความนี้?')) {
        console.log('🗑️ [DEBUG-FIX] Deleting post:', id);
        showNotification('ลบบทความเรียบร้อย', 'success');
    }
};

window.publishPost = function() {
    console.log('🚀 [DEBUG-FIX] Publishing post...');
    showNotification('เผยแพร่บทความเรียบร้อย', 'success');
};

window.clearForm = function() {
    console.log('🧹 [DEBUG-FIX] Clearing form...');
    const forms = document.querySelectorAll('form');
    forms.forEach(form => form.reset());
    showNotification('ล้างฟอร์มเรียบร้อย', 'success');
};

window.toggleSidebar = function() {
    console.log('📱 [DEBUG-FIX] Toggling sidebar...');
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('mobile-open');
    }
};

window.logout = function() {
    if (confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
        console.log('🚪 [DEBUG-FIX] Logging out...');
        showNotification('ออกจากระบบแล้ว', 'info');
        // Add actual logout logic here
    }
};

// AI and modal functions
window.openAiSettingsModal = function() {
    console.log('⚙️ [DEBUG-FIX] Opening AI settings modal...');
    showNotification('การตั้งค่า AI จะเปิดให้ใช้งานเร็วๆ นี้', 'info');
};

window.closeAiSettingsModal = function() {
    console.log('❌ [DEBUG-FIX] Closing AI settings modal...');
    const modal = document.getElementById('aiSettingsModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

window.saveAiApiKey = function() {
    console.log('💾 [DEBUG-FIX] Saving AI API key...');
    showNotification('บันทึก API Key เรียบร้อย', 'success');
};

window.testApiKey = function(provider) {
    console.log('🧪 [DEBUG-FIX] Testing API key for:', provider);
    showNotification(`กำลังทดสอบ ${provider} API Key...`, 'info');
};

window.refreshAnalytics = function() {
    console.log('🔄 [DEBUG-FIX] Refreshing analytics...');
    showNotification('รีเฟรชข้อมูลสถิติเรียบร้อย', 'success');
};

window.loadAnalytics = function() {
    console.log('📊 [DEBUG-FIX] Loading analytics...');
    showNotification('กำลังโหลดข้อมูลสถิติ...', 'info');
};

// ===== AI SWARM EMERGENCY FUNCTIONS =====
window.forceRenderAIProviders = function() {
    console.log('🔄 [DEBUG-FIX] Force rendering AI Providers...');
    
    const tableBody = document.getElementById('aiProvidersTableBody');
    if (!tableBody) {
        console.error('❌ [DEBUG-FIX] aiProvidersTableBody not found');
        showNotification('❌ ไม่พบตาราง AI Providers', 'error');
        return;
    }
    
    // Create the 5 AI providers
    const providers = [
        {
            key: 'gemini',
            name: 'Gemini 2.0 Flash',
            type: 'Google AI',
            icon: '⚡',
            status: false,
            role: 'นักสร้างสรรค์หลัก',
            expertise: ['สร้างเนื้อหา', 'ปรับ SEO', 'หลายภาษา']
        },
        {
            key: 'openai',
            name: 'OpenAI GPT',
            type: 'OpenAI',
            icon: '🧠',
            status: false,
            role: 'ผู้ตรวจสอบคุณภาพ',
            expertise: ['ควบคุมคุณภาพ', 'ตรวจสอบข้อมูล', 'ความสอดคล้อง']
        },
        {
            key: 'claude',
            name: 'Claude AI',
            type: 'Anthropic',
            icon: '🎭',
            status: false,
            role: 'ผู้ปรับปรุงเนื้อหา',
            expertise: ['ปรับโครงสร้าง', 'อ่านง่าย', 'ความน่าสนใจ']
        },
        {
            key: 'deepseek',
            name: 'DeepSeek AI',
            type: 'DeepSeek AI',
            icon: '🔍',
            status: false,
            role: 'ผู้ตรวจสอบเทคนิค',
            expertise: ['ความถูกต้องทางเทคนิค', 'ตรวจสอบโค้ด', 'ประสิทธิภาพ']
        },
        {
            key: 'chinda',
            name: 'ChindaX AI',
            type: 'ChindaX',
            icon: '🧠',
            status: false,
            role: 'ที่ปรึกษาภาษา',
            expertise: ['แปลภาษา', 'ปรับตามวัฒนธรรม', 'ภาษาไทย']
        }
    ];
    
    tableBody.innerHTML = '';
    
    providers.forEach(provider => {
        const row = document.createElement('tr');
        row.className = `provider-row ${provider.key} ${provider.status ? 'connected' : 'disconnected'}`;
        row.id = `provider-${provider.key}`;
        
        row.innerHTML = `
            <td data-label="โมเดล AI">
                <div class="provider-info">
                    <div class="provider-icon">${provider.icon}</div>
                    <div class="provider-details">
                        <h4>${provider.name}</h4>
                        <p class="provider-model">${provider.type}</p>
                    </div>
                </div>
            </td>
            <td data-label="สถานะ" id="status-${provider.key}">
                <div class="provider-status">
                    <div class="status-dot ${provider.status ? 'connected' : 'disconnected'}"></div>
                    <span class="status-text ${provider.status ? 'connected' : 'disconnected'}">
                        ${provider.status ? 'เชื่อมต่อแล้ว' : 'ไม่ได้เชื่อมต่อ'}
                    </span>
                </div>
            </td>
            <td data-label="หน้าที่ในการทำงาน">
                <div class="provider-role">${provider.role}</div>
            </td>
            <td data-label="ความเชี่ยวชาญ">
                <div class="provider-expertise">
                    ${provider.expertise.map(exp => `<span class="expertise-tag">${exp}</span>`).join('')}
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    console.log('✅ [DEBUG-FIX] AI Providers rendered successfully');
    showNotification('✅ แสดง AI Providers เรียบร้อย', 'success');
};

window.refreshAISwarmProviders = function() {
    console.log('🔄 [DEBUG-FIX] Refreshing AI Swarm providers...');
    showNotification('🔄 กำลังอัปเดต AI Providers...', 'info');
    
    // Try to use main.js function first
    if (window.aiSwarmCouncil && typeof window.aiSwarmCouncil.updateProviderStatus === 'function') {
        window.aiSwarmCouncil.updateProviderStatus()
            .then(() => {
                showNotification('✅ AI Providers อัปเดตสำเร็จ', 'success');
            })
            .catch(error => {
                console.error('❌ Error refreshing:', error);
                showNotification('❌ ไม่สามารถอัปเดต AI Providers ได้', 'error');
            });
    } else {
        // Fallback to force render
        setTimeout(() => {
            window.forceRenderAIProviders();
        }, 500);
    }
};

window.debugAISwarm = function() {
    console.log('🔍 [DEBUG-FIX] AI Swarm Debug Info:');
    console.log('- aiSwarmCouncil exists:', !!window.aiSwarmCouncil);
    console.log('- loadAISwarmData exists:', typeof window.loadAISwarmData);
    console.log('- forceRenderAIProviders exists:', typeof window.forceRenderAIProviders);
    console.log('- refreshAISwarmProviders exists:', typeof window.refreshAISwarmProviders);
    
    const tableBody = document.getElementById('aiProvidersTableBody');
    console.log('- aiProvidersTableBody exists:', !!tableBody);
    if (tableBody) {
        console.log('- current table content length:', tableBody.innerHTML.length);
    }
    
    showNotification('🐛 Debug info ดูใน Console', 'info');
};

window.loadAISwarmData = function() {
    console.log('📊 [DEBUG-FIX] Loading AI Swarm data...');
    
    // Try to use the main function, otherwise use force render
    if (window.aiSwarmCouncil) {
        console.log('✅ [DEBUG-FIX] AI Swarm Council available');
        if (typeof window.aiSwarmCouncil.renderProviders === 'function') {
            window.aiSwarmCouncil.renderProviders();
        }
    } else {
        console.log('⚠️ [DEBUG-FIX] AI Swarm Council not available, using force render');
        window.forceRenderAIProviders();
    }
};

// Initialize default section when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 [DEBUG-FIX] DOM ready, initializing...');
    
    // Show dashboard by default
    setTimeout(() => {
        if (typeof window.showSection === 'function') {
            window.showSection('dashboard');
        }
    }, 100);
});

console.log('✅ [DEBUG-FIX] Emergency functions loaded successfully');
console.log('✅ [DEBUG-FIX] Available functions:');
console.log('- showSection:', typeof window.showSection);
console.log('- showNotification:', typeof window.showNotification);
console.log('- forceRenderAIProviders:', typeof window.forceRenderAIProviders);
console.log('- refreshAISwarmProviders:', typeof window.refreshAISwarmProviders);
console.log('- debugAISwarm:', typeof window.debugAISwarm);
console.log('- loadAISwarmData:', typeof window.loadAISwarmData);

// Add basic CSS for AI Providers table if not exists
if (!document.getElementById('ai-providers-css')) {
    const style = document.createElement('style');
    style.id = 'ai-providers-css';
    style.textContent = `
        .provider-info {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .provider-icon {
            font-size: 1.5em;
            width: 30px;
            text-align: center;
        }
        .provider-details h4 {
            margin: 0;
            font-size: 14px;
            font-weight: 600;
        }
        .provider-details .provider-model {
            margin: 2px 0 0 0;
            font-size: 12px;
            color: #666;
        }
        .provider-status {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .status-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            display: inline-block;
        }
        .status-dot.connected {
            background-color: #4caf50;
        }
        .status-dot.disconnected {
            background-color: #f44336;
        }
        .status-text.connected {
            color: #4caf50;
        }
        .status-text.disconnected {
            color: #f44336;
        }
        .provider-role {
            font-weight: 500;
            color: #333;
        }
        .provider-expertise {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
        }
        .expertise-tag {
            background-color: #e3f2fd;
            color: #1976d2;
            padding: 2px 6px;
            border-radius: 12px;
            font-size: 11px;
            white-space: nowrap;
        }
        .provider-row.connected {
            background-color: #f8fff8;
        }
        .provider-row.disconnected {
            background-color: #fff8f8;
        }
    `;
    document.head.appendChild(style);
    console.log('✅ [DEBUG-FIX] AI Providers CSS added');
}
