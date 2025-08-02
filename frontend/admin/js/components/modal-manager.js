/**
 * 🎭 Modal Management System
 * Centralized modal handling with modern ES6 modules
 * Extracted from index.html for better maintainability
 * @typedef {import('../../types/components').ModalOptions} ModalOptions
 * @typedef {import('../../types/components').ModalState} ModalState
 */

export class ModalManager {
    /**
     * @param {HTMLElement} [container] - Modal container element
     */
    constructor(container) {
        /** @type {Map<string, ModalState>} */
        this.activeModals = new Map();
        /** @type {string[]} */
        this.modalStack = [];
        /** @type {HTMLElement} */
        this.container = container || document.body;
        /** @type {EventTarget} */
        this.eventBus = new EventTarget();
        this.init();
    }

    init() {
        this.setupGlobalListeners();
        this.createModalContainer();
    }

    /**
     * Show modal with modern animation support
     * @param {ModalOptions} options - Modal configuration options
     * @returns {Promise<string>} Modal ID
     */
    async showModal(options) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.warn(`⚠️ [Modal] Modal ${modalId} not found`);
            return false;
        }

        try {
            // Use View Transitions API if available
            if (window.ViewTransitionManager) {
                await window.ViewTransitionManager.showModal(modalId);
            } else {
                // Fallback animation
                this.showModalFallback(modal, options);
            }

            this.activeModals.add(modalId);
            this.modalStack.push(modalId);
            
            // Disable body scroll
            document.body.style.overflow = 'hidden';
            
            // Setup close handlers
            this.setupModalCloseHandlers(modal, modalId);
            
            console.log(`✅ [Modal] ${modalId} shown successfully`);
            return true;
            
        } catch (error) {
            console.error(`❌ [Modal] Error showing ${modalId}:`, error);
            return false;
        }
    }

    /**
     * Hide modal with smooth transitions
     * @param {string} modalId - Modal element ID
     */
    async hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return false;

        try {
            // Use View Transitions API if available
            if (window.ViewTransitionManager) {
                await window.ViewTransitionManager.hideModal(modalId);
            } else {
                // Fallback animation
                this.hideModalFallback(modal);
            }

            this.activeModals.delete(modalId);
            this.modalStack = this.modalStack.filter(id => id !== modalId);
            
            // Re-enable body scroll if no modals active
            if (this.activeModals.size === 0) {
                document.body.style.overflow = '';
            }
            
            console.log(`✅ [Modal] ${modalId} hidden successfully`);
            return true;
            
        } catch (error) {
            console.error(`❌ [Modal] Error hiding ${modalId}:`, error);
            return false;
        }
    }

    /**
     * Close AI Settings Modal (specific implementation)
     */
    closeAISettingsModal() {
        console.log('🔧 [AI Settings] Closing modal...');
        const modal = document.getElementById('aiSettingsModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
            
            // Re-enable other modal handlers
            const existingHandlers = document.querySelectorAll('[data-modal-handler]');
            existingHandlers.forEach(handler => {
                handler.style.pointerEvents = '';
            });
            
            this.activeModals.delete('aiSettingsModal');
            console.log('🔧 [AI Settings] Modal closed successfully');
        }
    }

    /**
     * Create fallback modal if not found
     */
    createFallbackModal() {
        console.log('🔧 [AI Settings] Creating fallback modal...');
        
        const modalHTML = `
            <div id="aiSettingsModal" class="ai-settings-modal" style="display: none;">
                <div class="ai-modal">
                    <div class="modal-header">
                        <h3>AI Settings</h3>
                        <button class="modal-close" onclick="window.modalManager.closeAISettingsModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <!-- Modal content will be loaded here -->
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        console.log('✅ [AI Settings] Fallback modal created');
    }

    /**
     * Open AI Configuration Modal
     */
    openAIConfigModal() {
        console.log('🔧 [AI Config] Opening configuration modal...');
        
        let modal = document.getElementById('aiConfigModal');
        if (!modal) {
            this.createAIConfigModal();
            modal = document.getElementById('aiConfigModal');
        }
        
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            this.activeModals.add('aiConfigModal');
            
            this.setupModalHandlers();
            console.log('✅ [AI Config] Modal opened successfully');
        }
    }

    /**
     * Close AI Configuration Modal
     */
    closeAIConfigModal() {
        const modal = document.getElementById('aiConfigModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
            this.activeModals.delete('aiConfigModal');
            console.log('✅ [AI Config] Modal closed');
        }
    }

    /**
     * Create AI Configuration Modal
     */
    createAIConfigModal() {
        const modalHTML = `
            <div id="aiConfigModal" class="ai-modal-overlay" style="display: none;">
                <div class="ai-modal">
                    <div class="ai-modal-header">
                        <h3>🤖 AI Configuration</h3>
                        <button class="modal-close" onclick="window.modalManager.closeAIConfigModal()">×</button>
                    </div>
                    <div class="ai-modal-body">
                        <!-- Configuration content -->
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    /**
     * Setup modal event handlers
     */
    setupModalHandlers() {
        // Handle overlay clicks
        document.querySelectorAll('.ai-modal-overlay').forEach(modal => {
            const modalContent = modal.querySelector('.ai-modal');
            if (modalContent) {
                modalContent.addEventListener('click', (event) => {
                    event.stopPropagation();
                });
                
                modal.addEventListener('click', (event) => {
                    if (event.target === modal) {
                        const modalId = modal.id;
                        this.hideModal(modalId);
                    }
                });
            }
        });
    }

    /**
     * Setup global modal listeners
     */
    setupGlobalListeners() {
        // ESC key handler
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.modalStack.length > 0) {
                const topModal = this.modalStack[this.modalStack.length - 1];
                this.hideModal(topModal);
            }
        });
    }

    /**
     * Create modal container if not exists
     */
    createModalContainer() {
        if (!document.getElementById('modal-container')) {
            const container = document.createElement('div');
            container.id = 'modal-container';
            container.style.cssText = 'position: fixed; top: 0; left: 0; z-index: 9999;';
            document.body.appendChild(container);
        }
    }

    /**
     * Fallback animation for browsers without View Transitions
     */
    showModalFallback(modal, options) {
        modal.style.display = 'flex';
        modal.style.opacity = '0';
        modal.style.transform = 'scale(0.95)';
        
        requestAnimationFrame(() => {
            modal.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            modal.style.opacity = '1';
            modal.style.transform = 'scale(1)';
        });
    }

    /**
     * Fallback hide animation
     */
    hideModalFallback(modal) {
        modal.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        modal.style.opacity = '0';
        modal.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }

    /**
     * Setup close handlers for specific modal
     */
    setupModalCloseHandlers(modal, modalId) {
        // Close buttons
        const closeButtons = modal.querySelectorAll('.modal-close, [data-dismiss="modal"]');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => this.hideModal(modalId));
        });

        // Overlay click
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                this.hideModal(modalId);
            }
        });
    }

    /**
     * Get currently active modals
     */
    getActiveModals() {
        return Array.from(this.activeModals);
    }

    /**
     * Check if any modal is active
     */
    hasActiveModal() {
        return this.activeModals.size > 0;
    }

    /**
     * Close all modals
     */
    closeAllModals() {
        const modalsToClose = Array.from(this.activeModals);
        modalsToClose.forEach(modalId => this.hideModal(modalId));
    }
}

// Export for global access
export default ModalManager;