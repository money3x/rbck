// Authentication utilities for RBCK Admin Dashboard
// Handles JWT token verification and user session management

// API Configuration
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:10000' 
    : 'https://rbck.onrender.com';

/**
 * Check if user is authenticated with valid JWT token
 * @returns {Promise<boolean>} True if authenticated, false otherwise
 */
export async function isAuthenticated() {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        console.log('🚫 No JWT token found');
        return false;
    }    try {        // Verify token with backend
        const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
            method: 'GET',
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
            // Token invalid, clear storage
            clearAuthData();
            return false;
        }
    } catch (error) {
        console.error('🚫 Token verification error:', error);
        // If it's a network error, don't clear auth data immediately
        // Check if we have recent session data as fallback
        const sessionValid = sessionStorage.getItem('isLoggedIn') === 'true';
        const loginData = localStorage.getItem('loginData');
        
        if (sessionValid && loginData) {
            console.log('⚠️ Using offline authentication fallback');
            return true; // Allow offline access
        } else {
            console.log('🚫 No valid fallback authentication');
            clearAuthData();
            return false;
        }
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
    
    const authenticated = await isAuthenticated();
    if (!authenticated) {
        console.log('🚫 Authentication required - redirecting to login');
        window.location.href = 'login.html';
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
