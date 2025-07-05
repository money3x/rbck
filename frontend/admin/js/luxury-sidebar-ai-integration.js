/* ========================================
   LUXURY SIDEBAR AI INTEGRATION ENHANCEMENT
   Advanced AI Settings Integration Layer
======================================== */

console.log('🤖 [SIDEBAR AI] Loading AI integration enhancements...');

/**
 * LuxurySidebarAIIntegration Class
 * Enhanced integration between luxury sidebar and AI Settings modal
 * Features: Dynamic AI status, real-time feedback, smart notifications
 */
class LuxurySidebarAIIntegration {
    constructor(sidebarInstance) {
        this.sidebar = sidebarInstance;
        this.aiSettingsButton = null;
        this.statusIndicator = null;
        this.isInitialized = false;
        this.aiSystemStatus = {
            active: false,
            providers: new Map(),
            lastUpdate: null
        };
        
        console.log('🤖 [SIDEBAR AI] Initializing AI integration...');
        this.init();
    }
    
    /**
     * Initialize AI integration features
     */
    init() {
        try {
            this.setupAISettingsButton();
            this.createStatusIndicator();
            this.setupStatusMonitoring();
            this.setupEnhancedInteractions();
            this.monitorAISystemHealth();
            
            this.isInitialized = true;
            console.log('✅ [SIDEBAR AI] AI integration initialized successfully');
        } catch (error) {
            console.error('❌ [SIDEBAR AI] Initialization failed:', error);
        }
    }
    
    /**
     * Setup enhanced AI Settings button with dynamic states
     */
    setupAISettingsButton() {
        this.aiSettingsButton = document.querySelector('#aiSettingsLink');
        if (!this.aiSettingsButton) {
            console.warn('⚠️ [SIDEBAR AI] AI Settings button not found');
            return;
        }
        
        // Add enhanced classes for styling
        this.aiSettingsButton.classList.add('ai-enhanced-button');
        this.aiSettingsButton.setAttribute('data-ai-status', 'unknown');
        
        // Enhanced click handler with performance tracking
        const originalClick = this.aiSettingsButton.onclick;
        this.aiSettingsButton.onclick = (event) => {
            this.handleAISettingsClick(event, originalClick);
        };
        
        console.log('🤖 [SIDEBAR AI] AI Settings button enhanced');
    }
    
    /**
     * Create dynamic status indicator for AI systems
     */
    createStatusIndicator() {
        if (!this.aiSettingsButton) return;
        
        // Create status indicator element
        const indicator = document.createElement('div');
        indicator.className = 'ai-status-indicator';
        indicator.innerHTML = `
            <div class="status-dot" data-status="unknown"></div>
            <div class="status-pulse"></div>
        `;
        
        // Add to AI Settings button
        this.aiSettingsButton.appendChild(indicator);
        this.statusIndicator = indicator;
        
        // Add CSS for indicator
        this.addStatusIndicatorStyles();
        
        console.log('🤖 [SIDEBAR AI] Status indicator created');
    }
    
    /**
     * Add CSS styles for status indicator
     */
    addStatusIndicatorStyles() {
        if (document.querySelector('#ai-status-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'ai-status-styles';
        styles.textContent = `
            .ai-enhanced-button {
                position: relative;
                overflow: visible;
            }
            
            .ai-status-indicator {
                position: absolute;
                top: 8px;
                right: 8px;
                width: 12px;
                height: 12px;
                pointer-events: none;
            }
            
            .status-dot {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                border: 2px solid rgba(255, 255, 255, 0.8);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                z-index: 2;
            }
            
            .status-dot[data-status="active"] {
                background: linear-gradient(45deg, #10b981, #059669);
                box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
            }
            
            .status-dot[data-status="inactive"] {
                background: linear-gradient(45deg, #f59e0b, #d97706);
            }
            
            .status-dot[data-status="error"] {
                background: linear-gradient(45deg, #ef4444, #dc2626);
                animation: errorPulse 2s ease-in-out infinite;
            }
            
            .status-dot[data-status="unknown"] {
                background: linear-gradient(45deg, #6b7280, #4b5563);
            }
            
            .status-pulse {
                position: absolute;
                top: 0;
                left: 0;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: inherit;
                opacity: 0;
                z-index: 1;
            }
            
            .status-dot[data-status="active"] + .status-pulse {
                animation: statusPulse 2s ease-in-out infinite;
                background: rgba(16, 185, 129, 0.6);
            }
            
            @keyframes statusPulse {
                0% { transform: scale(1); opacity: 0.7; }
                50% { transform: scale(1.5); opacity: 0.3; }
                100% { transform: scale(2); opacity: 0; }
            }
            
            @keyframes errorPulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.6; }
            }
            
            /* Enhanced hover state for AI button */
            .ai-enhanced-button:hover .status-dot {
                transform: scale(1.2);
                box-shadow: 0 0 12px rgba(255, 215, 0, 0.4);
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    /**
     * Enhanced AI Settings click handler
     */
    handleAISettingsClick(event, originalHandler) {
        // Performance tracking
        const startTime = performance.now();
        
        // Add visual feedback
        this.aiSettingsButton.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.aiSettingsButton.style.transform = '';
        }, 150);
        
        // Update status
        this.updateStatus('opening');
        
        // Call original handler
        if (originalHandler) {
            const result = originalHandler.call(this.aiSettingsButton, event);
            
            // Log performance
            const duration = performance.now() - startTime;
            console.log(`🤖 [SIDEBAR AI] Settings opened in ${duration.toFixed(2)}ms`);
            
            return result;
        }
    }
    
    /**
     * Setup real-time status monitoring
     */
    setupStatusMonitoring() {
        // Monitor AI system status every 30 seconds
        setInterval(() => {
            this.checkAISystemStatus();
        }, 30000);
        
        // Initial status check
        setTimeout(() => {
            this.checkAISystemStatus();
        }, 2000);
        
        console.log('🤖 [SIDEBAR AI] Status monitoring activated');
    }
    
    /**
     * Check AI system status and update indicator
     */
    async checkAISystemStatus() {
        try {
            // Check if AI providers are configured
            const hasGemini = localStorage.getItem('geminiApiKey');
            const hasOpenAI = localStorage.getItem('openaiApiKey');
            const hasClaude = localStorage.getItem('claudeApiKey');
            
            const activeProviders = [hasGemini, hasOpenAI, hasClaude].filter(Boolean).length;
            
            if (activeProviders > 0) {
                this.updateStatus('active');
                this.aiSystemStatus.active = true;
            } else {
                this.updateStatus('inactive');
                this.aiSystemStatus.active = false;
            }
            
            this.aiSystemStatus.lastUpdate = new Date();
            
        } catch (error) {
            console.error('🤖 [SIDEBAR AI] Status check failed:', error);
            this.updateStatus('error');
        }
    }
    
    /**
     * Update status indicator
     */
    updateStatus(status) {
        if (!this.statusIndicator) return;
        
        const dot = this.statusIndicator.querySelector('.status-dot');
        if (dot) {
            dot.setAttribute('data-status', status);
            
            // Update button tooltip
            const tooltips = {
                active: 'AI Systems Active',
                inactive: 'AI Systems Inactive - Configure API Keys',
                error: 'AI Systems Error - Check Configuration',
                opening: 'Opening AI Settings...',
                unknown: 'AI System Status Unknown'
            };
            
            this.aiSettingsButton.setAttribute('title', tooltips[status] || tooltips.unknown);
        }
    }
    
    /**
     * Setup enhanced interactions
     */
    setupEnhancedInteractions() {
        if (!this.aiSettingsButton) return;
        
        // Enhanced hover effects
        this.aiSettingsButton.addEventListener('mouseenter', () => {
            this.handleAIButtonHover();
        });
        
        // Keyboard accessibility
        this.aiSettingsButton.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                this.aiSettingsButton.click();
            }
        });
        
        console.log('🤖 [SIDEBAR AI] Enhanced interactions configured');
    }
    
    /**
     * Handle AI button hover with dynamic information
     */
    handleAIButtonHover() {
        // Create or update hover tooltip with AI status
        let tooltip = document.querySelector('#ai-hover-tooltip');
        
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'ai-hover-tooltip';
            tooltip.className = 'ai-hover-tooltip';
            document.body.appendChild(tooltip);
            
            // Add tooltip styles
            this.addTooltipStyles();
        }
        
        // Update tooltip content
        const activeCount = Array.from(this.aiSystemStatus.providers.values())
            .filter(status => status.active).length;
            
        tooltip.innerHTML = `
            <div class="tooltip-header">AI System Status</div>
            <div class="tooltip-content">
                <div class="status-row">
                    <span>Active Providers:</span>
                    <span class="status-value">${activeCount}/5</span>
                </div>
                <div class="status-row">
                    <span>System Health:</span>
                    <span class="status-value ${this.aiSystemStatus.active ? 'healthy' : 'needs-attention'}">
                        ${this.aiSystemStatus.active ? 'Healthy' : 'Needs Attention'}
                    </span>
                </div>
                ${this.aiSystemStatus.lastUpdate ? `
                <div class="status-row">
                    <span>Last Check:</span>
                    <span class="status-value">${this.formatTime(this.aiSystemStatus.lastUpdate)}</span>
                </div>
                ` : ''}
            </div>
        `;
        
        // Position tooltip
        this.positionTooltip(tooltip, this.aiSettingsButton);
    }
    
    /**
     * Add tooltip styles
     */
    addTooltipStyles() {
        if (document.querySelector('#ai-tooltip-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'ai-tooltip-styles';
        styles.textContent = `
            .ai-hover-tooltip {
                position: fixed;
                z-index: 10001;
                background: rgba(10, 10, 10, 0.95);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 215, 0, 0.2);
                border-radius: 8px;
                padding: 12px 16px;
                min-width: 200px;
                max-width: 300px;
                color: #ffffff;
                font-size: 0.875rem;
                opacity: 0;
                transform: translateY(10px);
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                pointer-events: none;
            }
            
            .ai-hover-tooltip.visible {
                opacity: 1;
                transform: translateY(0);
            }
            
            .tooltip-header {
                font-weight: 600;
                color: #FFD700;
                margin-bottom: 8px;
                border-bottom: 1px solid rgba(255, 215, 0, 0.2);
                padding-bottom: 4px;
            }
            
            .status-row {
                display: flex;
                justify-content: space-between;
                margin: 4px 0;
            }
            
            .status-value {
                font-weight: 500;
            }
            
            .status-value.healthy {
                color: #10b981;
            }
            
            .status-value.needs-attention {
                color: #f59e0b;
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    /**
     * Position tooltip relative to button
     */
    positionTooltip(tooltip, button) {
        const rect = button.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let left = rect.right + 10;
        let top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
        
        // Ensure tooltip stays on screen
        if (left + tooltipRect.width > window.innerWidth) {
            left = rect.left - tooltipRect.width - 10;
        }
        
        if (top < 10) top = 10;
        if (top + tooltipRect.height > window.innerHeight - 10) {
            top = window.innerHeight - tooltipRect.height - 10;
        }
        
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
        tooltip.classList.add('visible');
        
        // Hide tooltip after delay
        clearTimeout(this.tooltipTimeout);
        this.tooltipTimeout = setTimeout(() => {
            tooltip.classList.remove('visible');
        }, 3000);
    }
    
    /**
     * Monitor AI system health with intelligent checks
     */
    monitorAISystemHealth() {
        // Performance observer for AI operations
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    if (entry.name.includes('ai') || entry.name.includes('modal')) {
                        console.log(`🤖 [SIDEBAR AI] Performance: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
                    }
                });
            });
            
            observer.observe({ entryTypes: ['measure'] });
        }
        
        console.log('🤖 [SIDEBAR AI] Health monitoring activated');
    }
    
    /**
     * Format time for display
     */
    formatTime(date) {
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);
        
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        return `${Math.floor(diff / 3600)}h ago`;
    }
    
    /**
     * Public method to update provider status
     */
    updateProviderStatus(providerId, status) {
        this.aiSystemStatus.providers.set(providerId, status);
        this.checkAISystemStatus();
    }
    
    /**
     * Public method to get system status
     */
    getSystemStatus() {
        return this.aiSystemStatus;
    }
    
    /**
     * Destroy AI integration
     */
    destroy() {
        // Remove event listeners
        if (this.aiSettingsButton) {
            this.aiSettingsButton.classList.remove('ai-enhanced-button');
            this.aiSettingsButton.removeAttribute('data-ai-status');
        }
        
        // Remove status indicator
        if (this.statusIndicator) {
            this.statusIndicator.remove();
        }
        
        // Remove tooltips
        const tooltip = document.querySelector('#ai-hover-tooltip');
        if (tooltip) tooltip.remove();
        
        // Clear timeouts
        clearTimeout(this.tooltipTimeout);
        
        this.isInitialized = false;
        console.log('🤖 [SIDEBAR AI] AI integration destroyed');
    }
}

// ========================================
// AUTO-INITIALIZATION
// ========================================

/**
 * Initialize AI integration when luxury sidebar is ready
 */
function initializeSidebarAIIntegration() {
    // Wait for luxury sidebar to be initialized
    const sidebar = document.querySelector('.sidebar-luxury');
    if (!sidebar || !sidebar.luxurySidebarInstance) {
        setTimeout(initializeSidebarAIIntegration, 500);
        return;
    }
    
    // Avoid double initialization
    if (sidebar.aiIntegrationInstance) {
        console.log('🤖 [SIDEBAR AI] Already initialized, skipping...');
        return sidebar.aiIntegrationInstance;
    }
    
    const instance = new LuxurySidebarAIIntegration(sidebar.luxurySidebarInstance);
    sidebar.aiIntegrationInstance = instance;
    
    console.log('✅ [SIDEBAR AI] Auto-initialization complete');
    return instance;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeSidebarAIIntegration, 1000);
    });
} else {
    // DOM is already ready
    setTimeout(initializeSidebarAIIntegration, 1000);
}

// Expose to global scope
window.LuxurySidebarAIIntegration = LuxurySidebarAIIntegration;
window.initializeSidebarAIIntegration = initializeSidebarAIIntegration;

console.log('🤖 [SIDEBAR AI] AI integration module loaded successfully');