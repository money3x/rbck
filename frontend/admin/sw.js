/**
 * 🚀 SERVICE WORKER - RBCK CMS Performance Optimization
 * Implements caching, offline support, and performance improvements
 */

const CACHE_NAME = 'rbck-cms-v1.0.0';
const STATIC_CACHE = 'rbck-static-v1.0.0';
const API_CACHE = 'rbck-api-v1.0.0';

// Assets to cache immediately
const PRECACHE_ASSETS = [
    '/',
    '/admin/index.html',
    '/admin/core/bootstrap.js',
    '/admin/core/auth.js',
    '/admin/core/module-loader.js',
    '/admin/core/performance-optimizer.js',
    '/admin/core/production-optimizer.js',
    '/admin/core/unified-monitoring-service.js',
    '/admin/css/luxury-sidebar.css',
    '/admin/uiHelpers.js'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
    /\/api\/ai\/status/,
    /\/api\/ai\/metrics/,
    /\/api\/ai\/providers/
];

// Cache strategies
const CACHE_STRATEGIES = {
    CACHE_FIRST: 'cache-first',
    NETWORK_FIRST: 'network-first',
    STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
    NETWORK_ONLY: 'network-only',
    CACHE_ONLY: 'cache-only'
};

/**
 * Service Worker Installation
 */
self.addEventListener('install', (event) => {
    console.log('🚀 [SERVICE WORKER] Installing...');
    
    event.waitUntil(
        Promise.all([
            // Cache static assets
            caches.open(STATIC_CACHE).then((cache) => {
                console.log('📦 [SERVICE WORKER] Caching static assets');
                return cache.addAll(PRECACHE_ASSETS);
            }),
            
            // Skip waiting to activate immediately
            self.skipWaiting()
        ])
    );
});

/**
 * Service Worker Activation
 */
self.addEventListener('activate', (event) => {
    console.log('✅ [SERVICE WORKER] Activating...');
    
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            cleanupOldCaches(),
            
            // Take control of all pages
            self.clients.claim()
        ])
    );
});

/**
 * Fetch Event Handler - Main caching logic
 */
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension and other non-HTTP requests
    if (!url.protocol.startsWith('http')) {
        return;
    }
    
    event.respondWith(handleFetch(request, url));
});

/**
 * Handle fetch requests with appropriate caching strategy
 */
async function handleFetch(request, url) {
    // Determine caching strategy based on request
    if (isStaticAsset(url)) {
        return handleStaticAsset(request);
    } else if (isAPIRequest(url)) {
        return handleAPIRequest(request);
    } else if (isHTMLRequest(request)) {
        return handleHTMLRequest(request);
    } else {
        return handleDefaultRequest(request);
    }
}

/**
 * Check if request is for static assets
 */
function isStaticAsset(url) {
    return /\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i.test(url.pathname);
}

/**
 * Check if request is for API
 */
function isAPIRequest(url) {
    return url.pathname.startsWith('/api/') || API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
}

/**
 * Check if request is for HTML
 */
function isHTMLRequest(request) {
    return request.headers.get('Accept')?.includes('text/html');
}

/**
 * Handle static assets - Cache First strategy
 */
async function handleStaticAsset(request) {
    try {
        // Try cache first
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Fetch from network and cache
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('❌ [SERVICE WORKER] Static asset error:', error);
        
        // Return cached version if available
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

/**
 * Handle API requests - Network First with cache fallback
 */
async function handleAPIRequest(request) {
    const cache = await caches.open(API_CACHE);
    
    try {
        // Try network first for fresh data
        const networkResponse = await fetch(request.clone());
        
        if (networkResponse.ok) {
            // Cache successful responses
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }
        
        throw new Error(`Network response not ok: ${networkResponse.status}`);
    } catch (error) {
        console.warn('⚠️ [SERVICE WORKER] Network failed, trying cache:', error);
        
        // Fallback to cache
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            // Add header to indicate cached response
            const response = cachedResponse.clone();
            response.headers.set('X-Served-By', 'ServiceWorker-Cache');
            return response;
        }
        
        // Return offline response for API requests
        return new Response(JSON.stringify({
            success: false,
            error: 'Offline - data not available',
            cached: false
        }), {
            status: 503,
            headers: {
                'Content-Type': 'application/json',
                'X-Served-By': 'ServiceWorker-Offline'
            }
        });
    }
}

/**
 * Handle HTML requests - Network First with fallback
 */
async function handleHTMLRequest(request) {
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache HTML pages
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }
        
        throw new Error(`Network response not ok: ${networkResponse.status}`);
    } catch (error) {
        console.warn('⚠️ [SERVICE WORKER] HTML network failed, trying cache');
        
        // Try cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline page
        return new Response(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>RBCK CMS - Offline</title>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    .offline { color: #666; }
                    .retry { margin-top: 20px; }
                    .retry button { padding: 10px 20px; font-size: 16px; }
                </style>
            </head>
            <body>
                <h1>🌐 RBCK CMS</h1>
                <div class="offline">
                    <h2>You're offline</h2>
                    <p>Check your internet connection and try again.</p>
                </div>
                <div class="retry">
                    <button onclick="window.location.reload()">Retry</button>
                </div>
            </body>
            </html>
        `, {
            headers: {
                'Content-Type': 'text/html',
                'X-Served-By': 'ServiceWorker-Offline'
            }
        });
    }
}

/**
 * Handle other requests - Network only
 */
async function handleDefaultRequest(request) {
    return fetch(request);
}

/**
 * Clean up old caches
 */
async function cleanupOldCaches() {
    const cacheNames = await caches.keys();
    const validCaches = [CACHE_NAME, STATIC_CACHE, API_CACHE];
    
    const deletionPromises = cacheNames
        .filter(cacheName => !validCaches.includes(cacheName))
        .map(cacheName => {
            console.log('🗑️ [SERVICE WORKER] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
        });
    
    return Promise.all(deletionPromises);
}

/**
 * Background sync for offline actions
 */
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        console.log('🔄 [SERVICE WORKER] Background sync triggered');
        event.waitUntil(handleBackgroundSync());
    }
});

/**
 * Handle background sync
 */
async function handleBackgroundSync() {
    // Implement offline action queue processing
    console.log('🔄 [SERVICE WORKER] Processing background sync');
}

/**
 * Push notifications (future feature)
 */
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        
        event.waitUntil(
            self.registration.showNotification(data.title, {
                body: data.body,
                icon: '/admin/icon-192.png',
                badge: '/admin/badge-72.png',
                actions: data.actions || []
            })
        );
    }
});

/**
 * Notification click handler
 */
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('/admin/')
    );
});

/**
 * Message handler for communication with main thread
 */
self.addEventListener('message', (event) => {
    if (event.data && event.data.type) {
        switch (event.data.type) {
            case 'CACHE_STATUS':
                handleCacheStatusRequest(event);
                break;
            case 'CLEAR_CACHE':
                handleClearCacheRequest(event);
                break;
            case 'UPDATE_CHECK':
                handleUpdateCheckRequest(event);
                break;
        }
    }
});

/**
 * Handle cache status request
 */
async function handleCacheStatusRequest(event) {
    const cacheNames = await caches.keys();
    const status = {
        caches: cacheNames.length,
        size: await getCacheSize(),
        version: CACHE_NAME
    };
    
    event.ports[0].postMessage(status);
}

/**
 * Handle clear cache request
 */
async function handleClearCacheRequest(event) {
    await cleanupOldCaches();
    event.ports[0].postMessage({ success: true });
}

/**
 * Handle update check request
 */
async function handleUpdateCheckRequest(event) {
    // Force update check
    await self.registration.update();
    event.ports[0].postMessage({ updateChecked: true });
}

/**
 * Get total cache size
 */
async function getCacheSize() {
    const cacheNames = await caches.keys();
    let totalSize = 0;
    
    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        for (const request of keys) {
            const response = await cache.match(request);
            if (response) {
                const blob = await response.blob();
                totalSize += blob.size;
            }
        }
    }
    
    return totalSize;
}

console.log('✅ [SERVICE WORKER] RBCK CMS Service Worker loaded');