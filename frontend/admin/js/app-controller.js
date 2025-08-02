/**
 * 🚀 Application Controller
 * Orchestrates all modules and initializes the admin dashboard
 * Replaces the massive inline JavaScript in index.html
 */

// Import all our modular components
import ModalManager from './components/modal-manager.js';
import ChatInterface from './components/chat-interface.js';
import AIProvidersService from './services/ai-providers.js';

class AdminDashboard {
    constructor() {
        this.modules = {};
        this.isInitialized = false;
        this.currentSection = 'dashboard';
    }

    /**
     * Initialize the entire application
     */
    async init() {
        console.log('🚀 [AdminDashboard] Initializing application...');
        
        try {
            // Initialize theme system first
            await this.initializeTheme();
            
            // Initialize core modules
            await this.initializeModules();
            
            // Setup global event listeners
            this.setupGlobalEventListeners();
            
            // Initialize navigation
            this.initializeNavigation();
            
            // Load existing modules from index.html
            await this.loadExistingModules();
            
            // Setup security framework
            this.initializeSecurityFramework();
            
            // Mark as initialized
            this.isInitialized = true;
            
            console.log('✅ [AdminDashboard] Application initialized successfully');
            
            // Dispatch ready event for queued navigation
            window.dispatchEvent(new CustomEvent('dashboard-ready'));
            
            // Show dashboard by default
            this.showSection('dashboard');
            
        } catch (error) {
            console.error('❌ [AdminDashboard] Initialization failed:', error);
            this.showErrorMessage('Failed to initialize application');
        }
    }

    /**
     * Initialize theme management
     */
    async initializeTheme() {
        if (window.ThemeManager) {
            window.ThemeManager.init();
            console.log('✅ [Theme] Theme manager initialized');
        }
        
        if (window.ViewTransitionManager) {
            console.log('✅ [Transitions] View transitions available');
        }
    }

    /**
     * Initialize all modular components
     */
    async initializeModules() {
        // Initialize Modal Manager
        this.modules.modalManager = new ModalManager();
        window.modalManager = this.modules.modalManager;
        
        // Initialize Chat Interface
        this.modules.chatInterface = new ChatInterface();
        window.chatInterface = this.modules.chatInterface;
        
        // Initialize AI Providers Service
        this.modules.aiProviders = new AIProvidersService();
        window.aiProviders = this.modules.aiProviders;
        
        console.log('✅ [Modules] All modular components initialized');
    }

    /**
     * Show specific section of the application
     */
    showSection(sectionId) {
        console.log(`🔄 [Navigation] Switching to section: ${sectionId}`);

        try {
            // Hide all sections - FIX: use correct selector
            const sections = document.querySelectorAll('.content-section, .dashboard-section, .section');
            sections.forEach(section => {
                section.style.display = 'none';
                section.classList.remove('active');
            });

            // Show target section
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                // Use View Transitions if available
                if (window.ViewTransitionManager) {
                    window.ViewTransitionManager.navigateToSection(sectionId);
                } else {
                    targetSection.style.display = 'block';
                    targetSection.classList.add('active');
                }

                // Update navigation state
                this.updateNavigationState(sectionId);
                this.currentSection = sectionId;

                console.log(`✅ [Navigation] Section ${sectionId} activated`);
            } else {
                console.warn(`⚠️ [Navigation] Section ${sectionId} not found`);
            }

        } catch (error) {
            console.error(`❌ [Navigation] Error showing section ${sectionId}:`, error);
        }
    }

    /**
     * Setup global event listeners
     */
    setupGlobalEventListeners() {
        // Navigation event delegation
        document.addEventListener('click', (event) => {
            const target = event.target.closest('[data-action]');
            if (target) {
                this.handleGlobalAction(target, event);
            }
        });

        console.log('✅ [Events] Global event listeners setup');
    }

    /**
     * Handle global actions via data-action attributes
     */
    handleGlobalAction(element, event) {
        const action = element.getAttribute('data-action');
        const data = element.dataset;

        switch (action) {
            case 'show-section':
                event.preventDefault();
                this.showSection(data.section);
                break;
            
            case 'open-modal':
                event.preventDefault();
                this.modules.modalManager.showModal(data.modal);
                break;
            
            case 'test-provider':
                event.preventDefault();
                this.modules.aiProviders.testProvider(data.provider);
                break;

            default:
                console.log(`🔧 [Action] Unhandled action: ${action}`);
        }
    }

    /**
     * Initialize navigation system
     */
    initializeNavigation() {
        // Setup sidebar navigation - handle both data-action and onclick approaches
        const navLinks = document.querySelectorAll('.nav-link, [data-action="show-section"]');
        navLinks.forEach(link => {
            // Remove existing onclick handlers and replace with unified system
            if (link.onclick) {
                link.onclick = null;
            }
            
            link.addEventListener('click', (event) => {
                event.preventDefault();
                
                // Get section from data-section attribute or onclick attribute
                let section = link.getAttribute('data-section');
                
                // If no data-section, try to extract from onclick
                if (!section && link.getAttribute('onclick')) {
                    const onclickContent = link.getAttribute('onclick');
                    const match = onclickContent.match(/showSection\(['"]([^'"]+)['"]\)/);
                    if (match) {
                        section = match[1];
                    }
                }
                
                if (section) {
                    this.showSection(section);
                    this.updateNavigationState(section);
                } else {
                    console.warn('⚠️ [Navigation] No section found for link:', link);
                }
            });
        });

        // Also handle direct button clicks
        const actionButtons = document.querySelectorAll('[onclick*="showSection"]');
        actionButtons.forEach(button => {
            const onclickContent = button.getAttribute('onclick');
            const match = onclickContent.match(/showSection\(['"]([^'"]+)['"]\)/);
            if (match) {
                const section = match[1];
                button.onclick = null; // Remove old handler
                button.addEventListener('click', (event) => {
                    event.preventDefault();
                    this.showSection(section);
                });
            }
        });

        console.log('✅ [Navigation] Navigation system initialized');
    }

    /**
     * Update navigation state
     */
    updateNavigationState(sectionId) {
        // Update active nav link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            
            // Check data-section attribute
            if (link.getAttribute('data-section') === sectionId) {
                link.classList.add('active');
            }
            
            // Also check onclick attribute for legacy links
            const onclickContent = link.getAttribute('onclick');
            if (onclickContent) {
                const match = onclickContent.match(/showSection\(['"]([^'"]+)['"]\)/);
                if (match && match[1] === sectionId) {
                    link.classList.add('active');
                }
            }
        });
        
        // Update page title if needed
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            const sectionTitles = {
                'dashboard': '🚀 Gemini 2.0 Flash Dashboard',
                'ai-chatbot': '💬 AI Chatbot',
                'blog-manage': '📝 Blog Management',
                'blog-create': '✍️ Create Article',
                'seo-tools': '🔍 SEO Tools',
                'analytics': '📊 Analytics',
                'ai-swarm': '🤖 AI Swarm Council',
                'ai-monitoring': '📊 AI Monitoring',
                'migration': '🗄️ Database Migration',
                'security-dashboard': '🛡️ Security Dashboard',
                'auth-logs': '🔒 Authentication Logs',
                'blocked-ips': '🚫 Blocked IPs',
                'security-alerts': '⚠️ Security Alerts'
            };
            
            if (sectionTitles[sectionId]) {
                pageTitle.textContent = sectionTitles[sectionId];
            }
        }
    }

    /**
     * Show error message to user
     */
    showErrorMessage(message) {
        if (window.showNotification) {
            window.showNotification(message, 'error');
        } else {
            console.error(`Error: ${message}`);
        }
    }
}

// Make available globally
window.AdminDashboard = AdminDashboard;

// Expose global showSection function for backward compatibility
window.showSection = function(sectionId) {
    if (window.adminDashboard && window.adminDashboard.showSection) {
        window.adminDashboard.showSection(sectionId);
    } else {
        console.warn('⚠️ [Navigation] AdminDashboard not ready, queuing navigation to:', sectionId);
        // Queue the navigation for when dashboard is ready
        window.addEventListener('dashboard-ready', () => {
            if (window.adminDashboard) {
                window.adminDashboard.showSection(sectionId);
            }
        });
    }
};

// Export for module system
export default AdminDashboard;