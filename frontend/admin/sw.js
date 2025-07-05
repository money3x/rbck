// Service Worker for RBCK CMS - Performance Optimization
// Implements aggressive caching strategy for maximum performance

const CACHE_NAME = 'rbck-cms-v1.0.0';
const STATIC_CACHE = 'rbck-static-v1.0.0';
const DYNAMIC_CACHE = 'rbck-dynamic-v1.0.0';
const API_CACHE = 'rbck-api-v1.0.0';

// Resources to cache immediately (critical path)
const CRITICAL_ASSETS = [
  '/frontend/admin/dist/js/runtime.8591e8daa7636ae8e378.js',
  '/frontend/admin/dist/js/main.47234b74d8640c5c6aed.js',
  '/frontend/admin/dist/js/performance-optimizer.d39e23e134c6eb96e8fc.js',
  '/frontend/admin/css/critical.css',
  '/frontend/admin/dist/index.html'
];

// Static assets for background caching
const STATIC_ASSETS = [
  '/frontend/admin/dist/js/component-loader.f9bf3d66edc7cd6e65b0.js',
  '/frontend/admin/dist/js/api-utils.cf0943b0b19dca0381d8.js',
  '/frontend/admin/css/ai-modal.css',
  '/frontend/admin/components/ai-modal/modal-header.html'
];

// API endpoints to cache
const API_ROUTES = [
  '/api/ai/providers/status',
  '/api/performance/dashboard',
  '/api/health'
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('🔧 [SW] Installing service worker...');
  
  event.waitUntil(
    (async () => {
      try {
        // Cache critical assets first
        const criticalCache = await caches.open(CACHE_NAME);
        await criticalCache.addAll(CRITICAL_ASSETS);
        
        // Cache static assets in background
        const staticCache = await caches.open(STATIC_CACHE);
        await staticCache.addAll(STATIC_ASSETS);
        
        console.log('✅ [SW] Critical and static assets cached');
        
        // Skip waiting to activate immediately
        self.skipWaiting();
      } catch (error) {
        console.error('❌ [SW] Cache installation failed:', error);
      }
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 [SW] Activating service worker...');
  
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name => 
        name.startsWith('rbck-') && 
        !name.includes('v1.0.0')
      );
      
      await Promise.all(
        oldCaches.map(name => caches.delete(name))
      );
      
      console.log('🧹 [SW] Old caches cleaned up');
      
      // Take control of all pages
      self.clients.claim();
    })()
  );
});

// Fetch event - intelligent caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip cross-origin requests (except for known APIs)
  if (url.origin !== self.location.origin && !isAllowedOrigin(url.origin)) {
    return;
  }
  
  event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Strategy 1: Critical assets - Cache First
    if (isCriticalAsset(url.pathname)) {
      return await cacheFirst(request, CACHE_NAME);
    }
    
    // Strategy 2: Static assets - Cache First with background update
    if (isStaticAsset(url.pathname)) {
      return await cacheFirstWithUpdate(request, STATIC_CACHE);
    }
    
    // Strategy 3: API routes - Network First with cache fallback
    if (isApiRoute(url.pathname)) {
      return await networkFirstWithCache(request, API_CACHE);
    }
    
    // Strategy 4: HTML pages - Network First with cache fallback
    if (isHtmlRequest(request)) {
      return await networkFirstWithCache(request, DYNAMIC_CACHE);
    }
    
    // Strategy 5: Other resources - Cache with background refresh
    return await cacheWithRefresh(request, DYNAMIC_CACHE);
    
  } catch (error) {
    console.error('❌ [SW] Request handling failed:', error);
    return await handleOffline(request);
  }
}

// Cache First strategy - for critical assets
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    console.log('📦 [SW] Serving from cache:', request.url);
    return cached;
  }
  
  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }
  
  return response;
}

// Cache First with background update
async function cacheFirstWithUpdate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  // Background update
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => {});
  
  if (cached) {
    fetchPromise; // Don't await, let it run in background
    return cached;
  }
  
  return await fetchPromise;
}

// Network First with cache fallback
async function networkFirstWithCache(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache successful responses
      cache.put(request, response.clone());
      console.log('🌐 [SW] Network response cached:', request.url);
    }
    
    return response;
  } catch (error) {
    // Network failed, try cache
    const cached = await cache.match(request);
    
    if (cached) {
      console.log('📦 [SW] Network failed, serving from cache:', request.url);
      return cached;
    }
    
    throw error;
  }
}

// Cache with background refresh
async function cacheWithRefresh(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  // Always try to fetch fresh version
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  });
  
  // Return cached version immediately if available
  if (cached) {
    fetchPromise.catch(() => {}); // Don't let fetch errors break the promise chain
    return cached;
  }
  
  // If no cache, wait for network
  return await fetchPromise;
}

// Offline fallback
async function handleOffline(request) {
  if (isHtmlRequest(request)) {
    // Return cached main page for HTML requests
    const cache = await caches.open(CACHE_NAME);
    return await cache.match('/frontend/admin/dist/index.html');
  }
  
  // Return basic offline response
  return new Response('Offline', { 
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/plain' }
  });
}

// Helper functions
function isCriticalAsset(pathname) {
  return CRITICAL_ASSETS.some(asset => pathname.includes(asset.split('/').pop()));
}

function isStaticAsset(pathname) {
  return pathname.includes('/dist/') || 
         pathname.includes('/css/') || 
         pathname.includes('/components/') ||
         pathname.match(/\.(js|css|html|png|jpg|jpeg|gif|svg|woff|woff2)$/);
}

function isApiRoute(pathname) {
  return pathname.startsWith('/api/') || 
         API_ROUTES.some(route => pathname.startsWith(route));
}

function isHtmlRequest(request) {
  return request.headers.get('accept')?.includes('text/html');
}

function isAllowedOrigin(origin) {
  const allowedOrigins = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://api.openai.com',
    'https://api.anthropic.com'
  ];
  
  return allowedOrigins.some(allowed => origin.startsWith(allowed));
}

// Performance monitoring
self.addEventListener('message', (event) => {
  if (event.data?.type === 'PERFORMANCE_REPORT') {
    console.log('📊 [SW] Performance metrics received:', event.data.metrics);
    
    // Could send to analytics here
    // analytics.track('performance', event.data.metrics);
  }
});

// Background sync for performance data
self.addEventListener('sync', (event) => {
  if (event.tag === 'performance-sync') {
    event.waitUntil(syncPerformanceData());
  }
});

async function syncPerformanceData() {
  try {
    // Sync performance data when connection is restored
    console.log('🔄 [SW] Syncing performance data...');
    
    // Implementation would depend on your analytics setup
    // const data = await getStoredPerformanceData();
    // await sendToAnalytics(data);
    
  } catch (error) {
    console.error('❌ [SW] Performance sync failed:', error);
  }
}

console.log('✅ [SW] Service Worker script loaded - RBCK CMS Performance Optimization Active');