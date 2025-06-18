// Authentication utilities for RBCK Admin Dashboard
// Handles JWT token verification and user session management

import { API_BASE } from '../config.js';

/**
 * Check if user is authenticated with valid JWT token
 * @returns {Promise<boolean>} True if authenticated, false otherwise
 */
export async function isAuthenticated() {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        console.log('🚫 No JWT token found');
        return false;
    }
    
    // Development mode - check for mock tokens or local session
    if (token.startsWith('dev-mock-token-') || token === 'development-token') {
        console.log('🔧 [DEV] Using development authentication bypass');
        return true;
    }
    
    // Check for local session data as fallback (for development)
    const sessionValid = sessionStorage.getItem('isLoggedIn') === 'true';
    const loginData = localStorage.getItem('loginData');
    
    if (sessionValid && loginData) {
        console.log('✅ Using local session authentication');
        return true;
    }
    
    try {
        // Verify token with backend (only if backend is available)
        const response = await fetch(`${API_BASE}/auth/verify`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ JWT token verified:', data.user?.username);
            return data.valid === true;
        } else {
            console.log('❌ JWT token verification failed:', response.status);
            // Don't clear auth data immediately - use fallback
            return false;
        }
    } catch (error) {
        console.error('🚫 Token verification error (backend may be unavailable):', error);
        
        // In development, if backend is unavailable, allow access with local session
        if (sessionValid || token) {
            console.log('⚠️ Using offline authentication fallback (development mode)');
            return true;
        }
        
        return false;
    }
}

/**
 * Get current user info from stored JWT token
 * @returns {Object|null} User info or null if not authenticated
 */
export function getCurrentUser() {
    const loginData = localStorage.getItem('loginData');
    if (!loginData) return null;
    
    try {
        return JSON.parse(loginData);
    } catch (error) {
        console.error('Error parsing login data:', error);
        return null;
    }
}

/**
 * Get JWT token for API requests
 * @returns {string|null} JWT token or null if not authenticated
 */
export function getAuthToken() {
    return localStorage.getItem('jwtToken');
}

/**
 * Get authorization headers for API requests
 * @returns {Object} Headers object with Authorization
 */
export function getAuthHeaders() {
    const token = getAuthToken();
    if (!token) return {};
    
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

/**
 * Clear all authentication data
 */
export function clearAuthData() {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('loginData');
    sessionStorage.removeItem('isLoggedIn');
}

/**
 * Redirect to login page if not authenticated
 * Call this on pages that require authentication
 */
export async function requireAuth() {
    console.log('🔐 Checking authentication...');
    
    // Check if we're already on the login page to prevent redirect loops
    if (window.location.pathname.includes('login.html')) {
        console.log('📝 Already on login page, skipping auth check');
        return true;
    }
    
    const authenticated = await isAuthenticated();
    if (!authenticated) {
        console.log('🚫 Authentication required - redirecting to login');
        
        // Add a delay to prevent immediate redirect loops
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 100);
        return false;
    }
    
    console.log('✅ User authenticated');
    return true;
}

/**
 * Make authenticated API request
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
export async function authenticatedFetch(url, options = {}) {
    const token = getAuthToken();
    if (!token) {
        throw new Error('No authentication token available');
    }
    
    // Merge auth headers with provided headers
    const headers = {
        ...getAuthHeaders(),
        ...(options.headers || {})
    };
    
    return fetch(url, {
        ...options,
        headers
    });
}
