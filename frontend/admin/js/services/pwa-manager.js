/**
 * 📱 Progressive Web App Manager
 * Handles PWA installation, updates, and offline functionality
 */

export class PWAManager {
    constructor() {
        this.isStandalone = false;
        this.deferredPrompt = null;
        this.registration = null;
        this.isOnline = navigator.onLine;
        this.init();
    }

    /**
     * Initialize PWA features
     */
    init() {
        this.checkStandaloneMode();
        this.setupInstallPrompt();
        this.setupServiceWorker();
        this.setupOnlineOfflineEvents();
        this.setupUpdateChecking();
        this.setupBeforeInstallPrompt();
        this.setupAppInstalled();
        
        console.log('✅ [PWA] PWA Manager initialized');
    }

    /**
     * Check if app is running in standalone mode
     */
    checkStandaloneMode() {
        this.isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                           window.navigator.standalone || 
                           document.referrer.includes('android-app://');
        
        if (this.isStandalone) {
            document.body.classList.add('pwa-standalone');
            console.log('📱 [PWA] Running in standalone mode');
        }
    }

    /**
     * Setup install prompt handling
     */
    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('📱 [PWA] Install prompt available');
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallBanner();
        });
    }

    /**
     * Setup service worker registration
     */
    async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                this.registration = await navigator.serviceWorker.register('/service-worker.js', {
                    scope: '/'
                });
                
                console.log('✅ [PWA] Service Worker registered:', this.registration.scope);
                
                // Handle service worker updates
                this.registration.addEventListener('updatefound', () => {
                    this.handleServiceWorkerUpdate();
                });
                
            } catch (error) {
                console.error('❌ [PWA] Service Worker registration failed:', error);
            }
        }
    }

    /**
     * Setup online/offline event handlers
     */
    setupOnlineOfflineEvents() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.handleOnlineStatus();
            console.log('🌐 [PWA] Back online');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.handleOfflineStatus();
            console.log('📴 [PWA] Gone offline');
        });
    }

    /**
     * Setup periodic update checking
     */
    setupUpdateChecking() {
        // Check for updates every hour
        setInterval(() => {
            if (this.registration) {
                this.registration.update();
            }
        }, 60 * 60 * 1000);
    }

    /**
     * Setup before install prompt event
     */
    setupBeforeInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            this.deferredPrompt = e;
            this.updateInstallButton(true);
        });
    }

    /**
     * Setup app installed event
     */
    setupAppInstalled() {
        window.addEventListener('appinstalled', () => {
            console.log('🎉 [PWA] App was installed successfully');
            this.deferredPrompt = null;
            this.updateInstallButton(false);
            this.showInstallSuccessMessage();
        });
    }

    /**
     * Show install banner
     */
    showInstallBanner() {
        const banner = document.createElement('div');
        banner.className = 'pwa-install-banner';
        banner.innerHTML = `
            <div class="pwa-banner-content">
                <div class="pwa-banner-text">
                    <h3>📱 Install RBCK Admin</h3>
                    <p>Get faster access and work offline</p>
                </div>
                <div class="pwa-banner-actions">
                    <button class="btn btn-primary" onclick="window.pwaManager.installApp()">
                        Install
                    </button>
                    <button class="btn btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">
                        Later
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(banner);
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (banner.parentNode) {
                banner.remove();
            }
        }, 10000);
    }

    /**
     * Install the app
     */
    async installApp() {
        if (!this.deferredPrompt) {
            console.warn('⚠️ [PWA] Install prompt not available');
            return false;
        }

        try {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                console.log('✅ [PWA] User accepted the install prompt');
            } else {
                console.log('❌ [PWA] User dismissed the install prompt');
            }
            
            this.deferredPrompt = null;
            return outcome === 'accepted';
            
        } catch (error) {
            console.error('❌ [PWA] Install failed:', error);
            return false;
        }
    }

    /**
     * Handle service worker updates
     */
    handleServiceWorkerUpdate() {
        const newWorker = this.registration.installing;
        
        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.showUpdateAvailableMessage();
            }
        });
    }

    /**
     * Show update available message
     */
    showUpdateAvailableMessage() {
        const updateBanner = document.createElement('div');
        updateBanner.className = 'pwa-update-banner';
        updateBanner.innerHTML = `
            <div class="pwa-banner-content">
                <div class="pwa-banner-text">
                    <h3>🔄 Update Available</h3>
                    <p>A new version is ready to install</p>
                </div>
                <div class="pwa-banner-actions">
                    <button class="btn btn-primary" onclick="window.pwaManager.applyUpdate()">
                        Update Now
                    </button>
                    <button class="btn btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">
                        Later
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(updateBanner);
    }

    /**
     * Apply service worker update
     */
    async applyUpdate() {
        if (this.registration?.waiting) {
            this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            
            // Listen for the controlling service worker change
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                window.location.reload();
            });
        }
    }

    /**
     * Handle online status
     */
    handleOnlineStatus() {
        // Remove offline indicators
        document.body.classList.remove('pwa-offline');
        
        // Show online notification
        this.showNotification('🌐 You\'re back online!', 'success');
        
        // Sync any pending data
        this.syncPendingData();
    }

    /**
     * Handle offline status
     */
    handleOfflineStatus() {
        // Add offline indicators
        document.body.classList.add('pwa-offline');
        
        // Show offline notification
        this.showNotification('📴 You\'re offline. Some features may be limited.', 'warning');
    }

    /**
     * Update install button visibility
     */
    updateInstallButton(show) {
        const installButtons = document.querySelectorAll('.pwa-install-button');
        installButtons.forEach(button => {
            button.style.display = show ? 'block' : 'none';
        });
    }

    /**
     * Show install success message
     */
    showInstallSuccessMessage() {
        this.showNotification('🎉 App installed successfully!', 'success');
    }

    /**
     * Sync pending data when back online
     */
    async syncPendingData() {
        try {
            // Check for pending chat messages
            const pendingChats = JSON.parse(localStorage.getItem('pendingChats') || '[]');
            if (pendingChats.length > 0) {
                console.log(`🔄 [PWA] Syncing ${pendingChats.length} pending chat messages`);
                // Sync implementation would go here
                localStorage.removeItem('pendingChats');
            }

            // Check for pending settings
            const pendingSettings = JSON.parse(localStorage.getItem('pendingSettings') || '[]');
            if (pendingSettings.length > 0) {
                console.log(`🔄 [PWA] Syncing ${pendingSettings.length} pending settings`);
                // Sync implementation would go here
                localStorage.removeItem('pendingSettings');
            }

        } catch (error) {
            console.error('❌ [PWA] Data sync failed:', error);
        }
    }

    /**
     * Store data for offline sync
     */
    storeForSync(type, data) {
        try {
            const storageKey = `pending${type.charAt(0).toUpperCase() + type.slice(1)}`;
            const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
            existing.push({
                ...data,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem(storageKey, JSON.stringify(existing));
            
            console.log(`💾 [PWA] Stored ${type} for offline sync`);
            
        } catch (error) {
            console.error(`❌ [PWA] Failed to store ${type} for sync:`, error);
        }
    }

    /**
     * Check if app can work offline
     */
    async checkOfflineCapability() {
        try {
            const cache = await caches.open('rbck-admin-v1');
            const keys = await cache.keys();
            return keys.length > 0;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get app installation status
     */
    getInstallationStatus() {
        return {
            isInstallable: !!this.deferredPrompt,
            isStandalone: this.isStandalone,
            isOnline: this.isOnline,
            hasServiceWorker: !!this.registration
        };
    }

    /**
     * Show notification helper
     */
    showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    /**
     * Share content using Web Share API
     */
    async shareContent(shareData) {
        if (navigator.share) {
            try {
                await navigator.share(shareData);
                console.log('✅ [PWA] Content shared successfully');
                return true;
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('❌ [PWA] Share failed:', error);
                }
                return false;
            }
        } else {
            // Fallback to clipboard
            if (navigator.clipboard && shareData.url) {
                try {
                    await navigator.clipboard.writeText(shareData.url);
                    this.showNotification('📋 Link copied to clipboard!', 'success');
                    return true;
                } catch (error) {
                    console.error('❌ [PWA] Clipboard write failed:', error);
                    return false;
                }
            }
        }
        return false;
    }

    /**
     * Get app statistics
     */
    getStats() {
        return {
            isInstalled: this.isStandalone,
            isOnline: this.isOnline,
            hasServiceWorker: !!this.registration,
            canInstall: !!this.deferredPrompt,
            registrationScope: this.registration?.scope,
            lastUpdateCheck: this.registration?.updateViaCache
        };
    }
}

// Export for global access
export default PWAManager;