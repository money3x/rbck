/**
 * API Utility Functions for RBCK CMS
 * Handles API calls with proper error handling and retry logic
 */

import { API_BASE, CONFIG } from '../config.js';

// API call wrapper with error handling and retry logic
export async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        timeout: CONFIG.apiTimeout || 30000
    };

    const finalOptions = { ...defaultOptions, ...options };

    // Add Authorization header if token exists
    const token = localStorage.getItem('jwtToken');
    if (token) {
        finalOptions.headers.Authorization = `Bearer ${token}`;
    }

    let lastError = null;
    
    // Retry logic
    for (let attempt = 1; attempt <= (CONFIG.retryAttempts || 3); attempt++) {
        try {
            console.log(`🔄 API Call (Attempt ${attempt}): ${finalOptions.method} ${url}`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), finalOptions.timeout);
            
            const response = await fetch(url, {
                ...finalOptions,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            // Handle different response types
            if (response.ok) {
                const contentType = response.headers.get('content-type');
                
                if (contentType && contentType.includes('application/json')) {
                    const data = await response.json();
                    console.log(`✅ API Success: ${finalOptions.method} ${url}`, data);
                    return data;
                } else {
                    const text = await response.text();
                    console.log(`✅ API Success (Text): ${finalOptions.method} ${url}`);
                    return text;
                }
            } else {
                // Handle HTTP errors
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.message || errorMessage;
                } catch (e) {
                    // If response is not JSON, use status text
                }
                
                throw new Error(errorMessage);
            }
            
        } catch (error) {
            lastError = error;
            console.warn(`⚠️ API Call Failed (Attempt ${attempt}):`, error.message);
            
            // Don't retry on authentication errors
            if (error.message.includes('401') || error.message.includes('403')) {
                break;
            }
            
            // Don't retry on client errors (4xx)
            if (error.message.includes('400') && !error.message.includes('timeout')) {
                break;
            }
            
            // Wait before retry (exponential backoff)
            if (attempt < (CONFIG.retryAttempts || 3)) {
                const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
                console.log(`⏳ Retrying in ${delay/1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    // All attempts failed
    console.error(`❌ API Call Failed After All Attempts: ${finalOptions.method} ${url}`, lastError);
    throw lastError;
}

// Convenience methods
export const api = {
    get: (endpoint) => apiCall(endpoint, { method: 'GET' }),
    
    post: (endpoint, data) => apiCall(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    
    put: (endpoint, data) => apiCall(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    
    delete: (endpoint) => apiCall(endpoint, { method: 'DELETE' }),
    
    // Health check
    healthCheck: async () => {
        try {
            const response = await apiCall('/health');
            return response;
        } catch (error) {
            console.error('❌ Health check failed:', error);
            return { status: 'unhealthy', error: error.message };
        }
    },
    
    // Test API connection
    test: async () => {
        try {
            const response = await apiCall('/test');
            return response;
        } catch (error) {
            console.error('❌ API test failed:', error);
            return { success: false, error: error.message };
        }
    }
};

// Error handling utility
export function handleApiError(error, context = 'API call') {
    console.error(`❌ ${context} failed:`, error);
    
    let userMessage = 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง';
    
    if (error.message.includes('Failed to fetch') || error.name === 'AbortError') {
        userMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
    } else if (error.message.includes('401')) {
        userMessage = 'กรุณาเข้าสู่ระบบใหม่อีกครั้ง';
        // Clear auth data
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('loginData');
        // Redirect to login
        window.location.href = '/admin/login.html';
    } else if (error.message.includes('403')) {
        userMessage = 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้';
    } else if (error.message.includes('404')) {
        userMessage = 'ไม่พบข้อมูลที่ต้องการ';
    } else if (error.message.includes('500')) {
        userMessage = 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ กรุณาลองใหม่ในภายหลัง';
    }
    
    // Show notification if available
    if (typeof window.showNotification === 'function') {
        window.showNotification(`❌ ${userMessage}`, 'error');
    } else {
        alert(userMessage);
    }
    
    return userMessage;
}

// Network status monitoring
export function initNetworkMonitoring() {
    let isOnline = navigator.onLine;
    
    window.addEventListener('online', () => {
        if (!isOnline) {
            console.log('🌐 Network connection restored');
            if (typeof window.showNotification === 'function') {
                window.showNotification('✅ เชื่อมต่ออินเทอร์เน็ตแล้ว', 'success');
            }
            isOnline = true;
        }
    });
    
    window.addEventListener('offline', () => {
        console.log('📴 Network connection lost');
        if (typeof window.showNotification === 'function') {
            window.showNotification('⚠️ การเชื่อมต่ออินเทอร์เน็ตขาดหาย', 'warning');
        }
        isOnline = false;
    });
    
    return { isOnline: () => isOnline };
}

export default api;
