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
            // Hide all sections
            const sections = document.querySelectorAll('.dashboard-section');
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
        // Setup sidebar navigation
        const navLinks = document.querySelectorAll('.nav-link[data-action="show-section"]');
        navLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const section = link.getAttribute('data-section');
                this.showSection(section);
            });
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
            if (link.getAttribute('data-section') === sectionId) {
                link.classList.add('active');
            }
        });
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

// Export for module system
export default AdminDashboard;