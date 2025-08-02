/**
 * 💬 Chat Interface System
 * Modern chatbot interface with multi-provider support
 * Extracted from index.html for better maintainability
 */

export class ChatInterface {
    constructor() {
        this.currentConversationId = null;
        this.messageHistory = [];
        this.isTyping = false;
        this.apiClient = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupAutoResize();
        this.initializeElements();
    }

    /**
     * Initialize chat interface elements
     */
    initializeElements() {
        const chatbotForm = document.getElementById('chatbotForm');
        const chatbotInput = document.getElementById('chatbotInput');
        const chatbotMessages = document.getElementById('chatbotMessages');
        
        if (!chatbotForm || !chatbotInput || !chatbotMessages) {
            console.warn('⚠️ [Chat] Required chat elements not found');
            return;
        }

        // Clear any existing messages
        this.clearChat();
        
        // Add welcome message
        this.addWelcomeMessage();
        
        console.log('✅ [Chat] Interface initialized');
    }

    /**
     * Setup event listeners for chat functionality
     */
    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            const chatbotForm = document.getElementById('chatbotForm');
            const chatbotInput = document.getElementById('chatbotInput');
            
            if (chatbotForm) {
                chatbotForm.addEventListener('submit', (e) => this.handleChatSubmit(e));
            }
            
            if (chatbotInput) {
                // Submit on Ctrl+Enter
                chatbotInput.addEventListener('keydown', (e) => {
                    if (e.ctrlKey && e.key === 'Enter') {
                        e.preventDefault();
                        this.handleChatSubmit(e);
                    }
                });
            }
        });
    }

    /**
     * Setup auto-resize for textarea
     */
    setupAutoResize() {
        document.addEventListener('DOMContentLoaded', () => {
            const chatbotInput = document.getElementById('chatbotInput');
            if (chatbotInput) {
                chatbotInput.addEventListener('input', function() {
                    this.style.height = 'auto';
                    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
                });
            }
        });
    }

    /**
     * Handle chat form submission
     */
    async handleChatSubmit(e) {
        e.preventDefault();
        
        const input = document.getElementById('chatbotInput');
        const messages = document.getElementById('chatbotMessages');
        const modelSelect = document.getElementById('chatModelSelect');
        
        if (!input || !messages || !modelSelect) {
            console.error('❌ [CHATBOT] Required elements not found');
            return;
        }
        
        const message = input.value.trim();
        if (!message) return;
        
        const selectedModel = modelSelect.value;
        
        console.log('🤖 [CHATBOT] Sending message to backend:', selectedModel);
        
        // Add user message to chat
        this.addMessageToChat('user', message);
        
        // Clear input and reset height
        input.value = '';
        input.style.height = 'auto';
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Send to backend API
            const response = await this.sendMessageToAPI(message, selectedModel);
            
            // Hide typing indicator
            this.hideTypingIndicator();
            
            if (response.success) {
                // Add AI response to chat
                this.addMessageToChat('ai', response.response, selectedModel);
                
                // Store in conversation history
                this.storeConversation(message, response.response, selectedModel);
                
                console.log('✅ [CHATBOT] Message sent successfully');
            } else {
                this.addMessageToChat('error', `Error: ${response.error || 'Failed to send message'}`);
                console.error('❌ [CHATBOT] API Error:', response.error);
            }
            
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessageToChat('error', 'Connection error. Please try again.');
            console.error('❌ [CHATBOT] Network Error:', error);
        }
    }

    /**
     * Send message to backend API
     */
    async sendMessageToAPI(message, model) {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    message: message,
                    model: model,
                    conversationId: this.currentConversationId,
                    timestamp: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Update conversation ID if provided
            if (data.conversationId) {
                this.currentConversationId = data.conversationId;
            }
            
            return data;
            
        } catch (error) {
            console.error('❌ [CHATBOT] API Request Failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Add message to chat interface
     */
    addMessageToChat(type, content, model = null) {
        const messages = document.getElementById('chatbotMessages');
        if (!messages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}-message`;
        
        const timestamp = new Date().toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit'
        });

        let messageHTML = '';
        
        switch (type) {
            case 'user':
                messageHTML = `
                    <div class="message-header">
                        <span class="message-sender">You</span>
                        <span class="message-time">${timestamp}</span>
                    </div>
                    <div class="message-content">${this.escapeHtml(content)}</div>
                `;
                break;
                
            case 'ai':
                const modelIcon = this.getModelIcon(model);
                messageHTML = `
                    <div class="message-header">
                        <span class="message-sender">
                            ${modelIcon} ${this.getModelName(model)}
                        </span>
                        <span class="message-time">${timestamp}</span>
                    </div>
                    <div class="message-content">${this.formatAIResponse(content)}</div>
                `;
                break;
                
            case 'error':
                messageHTML = `
                    <div class="message-header">
                        <span class="message-sender">❌ Error</span>
                        <span class="message-time">${timestamp}</span>
                    </div>
                    <div class="message-content error-content">${this.escapeHtml(content)}</div>
                `;
                break;
        }
        
        messageDiv.innerHTML = messageHTML;
        messages.appendChild(messageDiv);
        
        // Scroll to bottom
        this.scrollToBottom();
        
        // Add to message history
        this.messageHistory.push({
            type,
            content,
            model,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Show typing indicator
     */
    showTypingIndicator() {
        const messages = document.getElementById('chatbotMessages');
        if (!messages) return;

        // Remove existing typing indicator
        this.hideTypingIndicator();

        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-message ai-message typing-indicator';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = `
            <div class="message-header">
                <span class="message-sender">🤖 AI is typing...</span>
            </div>
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        messages.appendChild(typingDiv);
        this.scrollToBottom();
        this.isTyping = true;
    }

    /**
     * Hide typing indicator
     */
    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
        this.isTyping = false;
    }

    /**
     * Scroll chat to bottom
     */
    scrollToBottom() {
        const messages = document.getElementById('chatbotMessages');
        if (messages) {
            messages.scrollTop = messages.scrollHeight;
        }
    }

    /**
     * Clear chat messages
     */
    clearChat() {
        const messages = document.getElementById('chatbotMessages');
        if (messages) {
            messages.innerHTML = '';
        }
        this.messageHistory = [];
        this.currentConversationId = null;
    }

    /**
     * Add welcome message
     */
    addWelcomeMessage() {
        const welcomeMessage = `สวัสดีครับ! ผมพร้อมช่วยเหลือคุณแล้ว 🤖

เลือกโมเดล AI ที่ต้องการใช้งาน:
• **Gemini** - Google's latest AI model
• **OpenAI GPT** - Advanced language model  
• **Claude** - Anthropic's helpful AI
• **DeepSeek** - Specialized coding AI
• **ChindaX** - Local Thai AI model

พิมพ์ข้อความของคุณด้านล่าง หรือใช้ Ctrl+Enter เพื่อส่งข้อความ`;

        this.addMessageToChat('ai', welcomeMessage, 'system');
    }

    /**
     * Format AI response with markdown support
     */
    formatAIResponse(content) {
        // Basic markdown formatting
        let formatted = content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
        
        return formatted;
    }

    /**
     * Get model icon
     */
    getModelIcon(model) {
        const icons = {
            'gemini': '💎',
            'openai': '🧠',
            'claude': '🎭',
            'deepseek': '🔍',
            'chinda': '🇹🇭',
            'system': '🤖'
        };
        return icons[model] || '🤖';
    }

    /**
     * Get model display name
     */
    getModelName(model) {
        const names = {
            'gemini': 'Gemini',
            'openai': 'OpenAI GPT',
            'claude': 'Claude',
            'deepseek': 'DeepSeek',
            'chinda': 'ChindaX',
            'system': 'System'
        };
        return names[model] || model;
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Get authentication token
     */
    getAuthToken() {
        // Use secure auth from SecurityFramework if available
        if (window.SecurityFramework?.Auth?.getToken) {
            return window.SecurityFramework.Auth.getToken();
        }
        // Fallback to localStorage (less secure)
        return localStorage.getItem('authToken') || '';
    }

    /**
     * Store conversation in local storage and send to backend
     */
    storeConversation(userMessage, aiResponse, model) {
        const conversation = {
            id: this.currentConversationId,
            userMessage,
            aiResponse,
            model,
            timestamp: new Date().toISOString()
        };

        // Store locally
        const conversations = JSON.parse(localStorage.getItem('chatHistory') || '[]');
        conversations.push(conversation);
        
        // Keep only last 100 conversations
        if (conversations.length > 100) {
            conversations.splice(0, conversations.length - 100);
        }
        
        localStorage.setItem('chatHistory', JSON.stringify(conversations));

        // Send to backend for persistent storage
        this.saveToBa ckend(conversation);
    }

    /**
     * Save conversation to backend
     */
    async saveToBackend(conversation) {
        try {
            await fetch('/api/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify(conversation)
            });
        } catch (error) {
            console.warn('⚠️ [Chat] Failed to save conversation to backend:', error);
        }
    }

    /**
     * Load chat history
     */
    loadChatHistory() {
        const conversations = JSON.parse(localStorage.getItem('chatHistory') || '[]');
        const recent = conversations.slice(-10); // Show last 10 conversations
        
        recent.forEach(conv => {
            this.addMessageToChat('user', conv.userMessage);
            this.addMessageToChat('ai', conv.aiResponse, conv.model);
        });
    }

    /**
     * Export chat history
     */
    exportChatHistory() {
        const data = {
            history: this.messageHistory,
            conversationId: this.currentConversationId,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-history-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Get current conversation statistics
     */
    getConversationStats() {
        return {
            totalMessages: this.messageHistory.length,
            userMessages: this.messageHistory.filter(m => m.type === 'user').length,
            aiMessages: this.messageHistory.filter(m => m.type === 'ai').length,
            currentConversationId: this.currentConversationId,
            isTyping: this.isTyping
        };
    }
}

// Export for global access
export default ChatInterface;