/**
 * Force Refresh ChindaX Provider Status
 * เรียกใช้ script นี้เพื่อแก้ไข "ChindaX Not Available" ใน UI
 */

(function() {
    console.log('🔄 [FORCE REFRESH] Starting ChindaX UI refresh...');
    
    // Force refresh provider status from backend
    async function forceRefreshChindaStatus() {
        try {
            console.log('📡 [FORCE REFRESH] Fetching fresh provider status...');
            
            // Clear any existing cache
            if ('caches' in window) {
                caches.delete('api-cache');
            }
            
            // Fetch fresh data with cache-busting
            const response = await fetch('/api/ai/status?' + Date.now(), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('✅ [FORCE REFRESH] Fresh data received:', data);
            
            // Extract providers data
            const providersData = data.data?.providers || data.providers || {};
            
            // Check ChindaX specifically
            const chindaData = providersData.chinda;
            console.log('🔍 [FORCE REFRESH] ChindaX data:', chindaData);
            
            if (chindaData?.configured && chindaData?.status === 'ready') {
                console.log('✅ [FORCE REFRESH] ChindaX is ready! Updating UI...');
                updateChatbotUI(providersData);
                return true;
            } else {
                console.log('❌ [FORCE REFRESH] ChindaX not ready:', chindaData);
                return false;
            }
            
        } catch (error) {
            console.error('❌ [FORCE REFRESH] Error:', error);
            return false;
        }
    }
    
    // Update chatbot UI with fresh data
    function updateChatbotUI(providersData) {
        const modelSelect = document.getElementById('chatModelSelect');
        if (!modelSelect) {
            console.log('⚠️ [FORCE REFRESH] Chatbot dropdown not found');
            return;
        }
        
        console.log('🔄 [FORCE REFRESH] Updating chatbot dropdown...');
        
        // Define options with fresh data
        const options = [
            { value: 'openai', text: 'OpenAI (GPT-4/3.5)', enabled: providersData.openai?.configured && providersData.openai?.status === 'ready' },
            { value: 'anthropic', text: 'Anthropic (Claude)', enabled: providersData.claude?.configured && providersData.claude?.status === 'ready' },
            { value: 'gemini', text: 'Gemini 2.0 Flash', enabled: providersData.gemini?.configured && providersData.gemini?.status === 'ready' },
            { value: 'deepseek', text: 'DeepSeek AI', enabled: providersData.deepseek?.configured && providersData.deepseek?.status === 'ready' },
            { value: 'chinda', text: 'ChindaX (qwen3-32b)', enabled: providersData.chinda?.configured && providersData.chinda?.status === 'ready' }
        ];
        
        // Clear existing options
        modelSelect.innerHTML = '';
        
        // Add updated options
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.text + (option.enabled ? '' : ' (Not Available)');
            optionElement.disabled = !option.enabled;
            modelSelect.appendChild(optionElement);
            
            console.log(`🔍 [FORCE REFRESH] ${option.value}: ${option.enabled ? 'Available ✅' : 'Not Available ❌'}`);
        });
        
        // Select ChindaX if available
        const chindaOption = options.find(opt => opt.value === 'chinda' && opt.enabled);
        if (chindaOption) {
            modelSelect.value = 'chinda';
            console.log('✅ [FORCE REFRESH] ChindaX selected as default!');
        } else {
            // Select first available provider
            const firstAvailable = options.find(opt => opt.enabled);
            if (firstAvailable) {
                modelSelect.value = firstAvailable.value;
                console.log(`✅ [FORCE REFRESH] Selected: ${firstAvailable.value}`);
            }
        }
        
        // Visual feedback
        modelSelect.style.border = '2px solid #4CAF50';
        modelSelect.style.boxShadow = '0 0 10px rgba(76, 175, 80, 0.5)';
        modelSelect.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            modelSelect.style.border = '';
            modelSelect.style.boxShadow = '';
        }, 3000);
        
        // Show success message
        showSuccessMessage('ChindaX provider status updated!');
    }
    
    // Show success message
    function showSuccessMessage(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = '✅ ' + message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // Auto-run the refresh
    async function autoRefresh() {
        console.log('🚀 [FORCE REFRESH] Auto-refreshing ChindaX status...');
        
        const success = await forceRefreshChindaStatus();
        
        if (success) {
            console.log('🎉 [FORCE REFRESH] ChindaX is now available!');
        } else {
            console.log('⚠️ [FORCE REFRESH] ChindaX still not available, retrying in 5 seconds...');
            setTimeout(autoRefresh, 5000);
        }
    }
    
    // Run immediately if page is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoRefresh);
    } else {
        autoRefresh();
    }
    
    // Export for manual use
    window.forceRefreshChindaStatus = forceRefreshChindaStatus;
    
    console.log('🔧 [FORCE REFRESH] Script loaded! Use window.forceRefreshChindaStatus() to manually refresh.');
})();

// Add CSS for animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);