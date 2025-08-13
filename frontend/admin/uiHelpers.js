// uiHelpers.js

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    if (!notification || !notificationText) return;
    
    notification.className = 'notification';
    notification.classList.add(type);
    notificationText.textContent = message;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

function showSection(sectionId) {
    console.log('🔄 [DEBUG] Showing section:', sectionId);
    
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show selected section
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.classList.add('active');
    }
    
    // Update active nav link
    const navLink = document.querySelector(`.nav-link[onclick*="${sectionId}"]`);
    if (navLink) {
        navLink.classList.add('active');
    }
      // Update page title and handle section-specific actions
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
                break;            case 'analytics':
                title = '📊 Flash Analytics';
                // Load analytics data when analytics section is shown
                if (typeof window.loadAnalytics === 'function') {
                    window.loadAnalytics();
                }
                break;            case 'ai-swarm':
                title = '🤖 AI Swarm Council';
                // Load AI Swarm data when section is shown
                console.log('🔄 Loading AI Swarm Council section...');
                if (typeof window.loadAISwarmData === 'function') {
                    window.loadAISwarmData();
                } else if (window.aiSwarmCouncil && typeof window.aiSwarmCouncil.renderProviders === 'function') {
                    console.log('🔄 Direct call to renderProviders...');
                    window.aiSwarmCouncil.renderProviders();
                    window.aiSwarmCouncil.updateSwarmDisplay();
                } else {
                    console.warn('⚠️ AI Swarm Council not available');
                }
                break;
            default:
                title = 'Dashboard';
        }
        pageTitle.textContent = title;
    }
}

function updateCharacterCounters() {
    const metaTitle = document.getElementById('metaTitle');
    const metaDesc = document.getElementById('metaDescription');
    const titleCount = document.getElementById('metaTitleCount');
    const descCount = document.getElementById('metaDescriptionCount');

    if (metaTitle && titleCount) {
        const len = metaTitle.value.length;
        titleCount.textContent = `${len}/60 characters`;
        titleCount.style.color = len > 60 ? '#dc3545' : '#6c757d';
    }

    if (metaDesc && descCount) {
        const len = metaDesc.value.length;
        descCount.textContent = `${len}/160 characters`;
        descCount.style.color = len > 160 ? '#dc3545' : '#6c757d';
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('mobile-open');
    }
}

// Removed ES6 import - using global API_BASE instead

function logout() {
    if (confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
        // Call backend logout endpoint
        const token = localStorage.getItem('jwtToken');
        if (token) {
            fetch(`${API_BASE}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }).catch(error => {
                console.log('Logout request failed:', error.message);
            });
        }
        
        // Clear local storage and session
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('loginData');
        sessionStorage.removeItem('isLoggedIn');
        
        // Redirect to login
        window.location.href = 'login.html';
    }
}

// Make functions globally available (replacing ES6 exports)
window.showNotification = showNotification;
window.showSection = showSection;
window.updateCharacterCounters = updateCharacterCounters;
window.toggleSidebar = toggleSidebar;
window.logout = logout;

console.log('✅ [UI HELPERS] UI helper functions loaded and available globally');