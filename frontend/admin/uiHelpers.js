// uiHelpers.js

export function showNotification(message, type = 'info') {
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

export function showSection(sectionId) {
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
                break;
            default:
                title = 'Dashboard';
        }
        pageTitle.textContent = title;
    }
}

export function updateCharacterCounters() {
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

export function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('mobile-open');
    }
}

export function logout() {
    if (confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
        // Call backend logout endpoint
        const token = localStorage.getItem('jwtToken');
        if (token) {
            const API_BASE_URL = window.location.hostname === 'localhost' 
                ? 'http://localhost:3000' 
                : 'https://rbck-backend.onrender.com';
                
            fetch(`${API_BASE_URL}/auth/logout`, {
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