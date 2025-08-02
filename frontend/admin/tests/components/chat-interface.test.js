/**
 * 🧪 Chat Interface Tests
 * Comprehensive testing for chat functionality
 */

import { ChatInterface } from '../../js/components/chat-interface.js';

describe('ChatInterface', () => {
    let chatInterface;
    let mockContainer;

    beforeEach(() => {
        // Setup DOM
        global.testUtils.setupDOM(`
            <div id="app">
                <div id="chat-container">
                    <div class="chat-messages" id="chat-messages"></div>
                    <form class="chat-form" id="chat-form">
                        <textarea class="chat-input" id="chat-input" placeholder="Type your message..."></textarea>
                        <button type="submit" class="send-btn">Send</button>
                    </form>
                </div>
            </div>
        `);

        mockContainer = document.getElementById('chat-container');
        chatInterface = new ChatInterface(mockContainer);

        // Mock fetch for API calls
        global.fetch.mockClear();
    });

    afterEach(() => {
        global.testUtils.cleanupDOM();
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        test('should initialize with correct container', () => {
            expect(chatInterface.container).toBe(mockContainer);
            expect(chatInterface.messagesContainer).toBeTruthy();
            expect(chatInterface.chatForm).toBeTruthy();
            expect(chatInterface.chatInput).toBeTruthy();
        });

        test('should setup event listeners', () => {
            const form = document.getElementById('chat-form');
            const input = document.getElementById('chat-input');
            
            expect(form).toBeTruthy();
            expect(input).toBeTruthy();
        });

        test('should initialize with empty message history', () => {
            expect(chatInterface.messageHistory).toEqual([]);
            expect(chatInterface.currentProvider).toBe('openai');
        });
    });

    describe('Message Handling', () => {
        test('should add user message to chat', () => {
            const testMessage = 'Hello, this is a test message';
            
            chatInterface.addMessageToChat(testMessage, 'user');
            
            const messages = document.querySelectorAll('.message');
            expect(messages).toHaveLength(1);
            expect(messages[0].classList.contains('user')).toBe(true);
            expect(messages[0].textContent).toContain(testMessage);
        });

        test('should add assistant message to chat', () => {
            const testResponse = 'Hello! How can I help you today?';
            
            chatInterface.addMessageToChat(testResponse, 'assistant');
            
            const messages = document.querySelectorAll('.message');
            expect(messages).toHaveLength(1);
            expect(messages[0].classList.contains('assistant')).toBe(true);
            expect(messages[0].textContent).toContain(testResponse);
        });

        test('should handle markdown in messages', () => {
            const markdownMessage = '**Bold text** and *italic text*';
            
            chatInterface.addMessageToChat(markdownMessage, 'assistant');
            
            const messageElement = document.querySelector('.message.assistant .message-content');
            expect(messageElement.innerHTML).toContain('<strong>Bold text</strong>');
            expect(messageElement.innerHTML).toContain('<em>italic text</em>');
        });

        test('should handle code blocks in messages', () => {
            const codeMessage = '```javascript\nconst test = "hello";\n```';
            
            chatInterface.addMessageToChat(codeMessage, 'assistant');
            
            const messageElement = document.querySelector('.message.assistant .message-content');
            expect(messageElement.innerHTML).toContain('<code>');
            expect(messageElement.innerHTML).toContain('const test = "hello";');
        });

        test('should update message history', () => {
            const userMessage = 'Test user message';
            const assistantMessage = 'Test assistant response';
            
            chatInterface.addMessageToChat(userMessage, 'user');
            chatInterface.addMessageToChat(assistantMessage, 'assistant');
            
            expect(chatInterface.messageHistory).toHaveLength(2);
            expect(chatInterface.messageHistory[0]).toEqual({
                role: 'user',
                content: userMessage,
                timestamp: expect.any(String)
            });
            expect(chatInterface.messageHistory[1]).toEqual({
                role: 'assistant',
                content: assistantMessage,
                timestamp: expect.any(String)
            });
        });
    });

    describe('Chat Submission', () => {
        test('should handle form submission', async () => {
            const testMessage = 'Test form submission';
            const mockResponse = 'Mock API response';
            
            // Mock successful API response
            global.fetch.mockResolvedValueOnce(
                global.testUtils.mockApiResponse({
                    response: mockResponse,
                    usage: { total_tokens: 100 }
                })
            );

            const chatInput = document.getElementById('chat-input');
            const chatForm = document.getElementById('chat-form');
            
            chatInput.value = testMessage;
            
            // Simulate form submission
            const submitEvent = new Event('submit');
            chatForm.dispatchEvent(submitEvent);
            
            // Wait for async operations
            await global.testUtils.nextTick();
            
            expect(chatInput.value).toBe(''); // Input should be cleared
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/chat'),
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: expect.stringContaining(testMessage)
                })
            );
        });

        test('should prevent submission of empty messages', () => {
            const chatInput = document.getElementById('chat-input');
            const chatForm = document.getElementById('chat-form');
            
            chatInput.value = '   '; // Whitespace only
            
            const submitEvent = new Event('submit');
            chatForm.dispatchEvent(submitEvent);
            
            expect(global.fetch).not.toHaveBeenCalled();
        });

        test('should handle API errors gracefully', async () => {
            const testMessage = 'Test error handling';
            
            // Mock API error
            global.fetch.mockRejectedValueOnce(new Error('Network error'));
            
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            const chatInput = document.getElementById('chat-input');
            const chatForm = document.getElementById('chat-form');
            
            chatInput.value = testMessage;
            
            const submitEvent = new Event('submit');
            chatForm.dispatchEvent(submitEvent);
            
            await global.testUtils.nextTick();
            
            // Should show error message in chat
            const errorMessage = document.querySelector('.message.error');
            expect(errorMessage).toBeTruthy();
            expect(errorMessage.textContent).toContain('Sorry, there was an error');
            
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Chat submission error'),
                expect.any(Error)
            );
            
            consoleSpy.mockRestore();
        });
    });

    describe('Provider Management', () => {
        test('should switch providers', () => {
            chatInterface.switchProvider('anthropic');
            expect(chatInterface.currentProvider).toBe('anthropic');
            
            chatInterface.switchProvider('google');
            expect(chatInterface.currentProvider).toBe('google');
        });

        test('should include provider in API requests', async () => {
            const testMessage = 'Test provider inclusion';
            
            global.fetch.mockResolvedValueOnce(
                global.testUtils.mockApiResponse({ response: 'Test response' })
            );
            
            chatInterface.switchProvider('anthropic');
            
            const chatInput = document.getElementById('chat-input');
            const chatForm = document.getElementById('chat-form');
            
            chatInput.value = testMessage;
            
            const submitEvent = new Event('submit');
            chatForm.dispatchEvent(submitEvent);
            
            await global.testUtils.nextTick();
            
            expect(global.fetch).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    body: expect.stringContaining('"provider":"anthropic"')
                })
            );
        });
    });

    describe('UI State Management', () => {
        test('should show loading state during API call', async () => {
            const testMessage = 'Test loading state';
            
            // Create a promise that we can control
            let resolveApiCall;
            const apiPromise = new Promise(resolve => {
                resolveApiCall = resolve;
            });
            
            global.fetch.mockReturnValueOnce(apiPromise);
            
            const chatInput = document.getElementById('chat-input');
            const chatForm = document.getElementById('chat-form');
            const sendBtn = document.querySelector('.send-btn');
            
            chatInput.value = testMessage;
            
            const submitEvent = new Event('submit');
            chatForm.dispatchEvent(submitEvent);
            
            // Check loading state
            expect(sendBtn.disabled).toBe(true);
            expect(sendBtn.textContent).toContain('Sending...');
            
            // Resolve the API call
            resolveApiCall(global.testUtils.mockApiResponse({ response: 'Test response' }));
            
            await global.testUtils.nextTick();
            
            // Check that loading state is cleared
            expect(sendBtn.disabled).toBe(false);
            expect(sendBtn.textContent).toBe('Send');
        });

        test('should auto-scroll to latest message', () => {
            const messagesContainer = document.getElementById('chat-messages');
            const scrollToSpy = jest.spyOn(messagesContainer, 'scrollTo');
            
            chatInterface.addMessageToChat('Test message', 'user');
            
            expect(scrollToSpy).toHaveBeenCalledWith({
                top: messagesContainer.scrollHeight,
                behavior: 'smooth'
            });
        });
    });

    describe('Keyboard Shortcuts', () => {
        test('should submit on Ctrl+Enter', () => {
            const chatInput = document.getElementById('chat-input');
            const submitSpy = jest.spyOn(chatInterface, 'handleChatSubmit');
            
            chatInput.value = 'Test Ctrl+Enter';
            
            const keyEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                ctrlKey: true
            });
            
            chatInput.dispatchEvent(keyEvent);
            
            expect(submitSpy).toHaveBeenCalled();
        });

        test('should not submit on Enter without Ctrl', () => {
            const chatInput = document.getElementById('chat-input');
            const submitSpy = jest.spyOn(chatInterface, 'handleChatSubmit');
            
            chatInput.value = 'Test Enter only';
            
            const keyEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                ctrlKey: false
            });
            
            chatInput.dispatchEvent(keyEvent);
            
            expect(submitSpy).not.toHaveBeenCalled();
        });
    });

    describe('Message Export', () => {
        test('should export chat history', () => {
            chatInterface.addMessageToChat('User message 1', 'user');
            chatInterface.addMessageToChat('Assistant response 1', 'assistant');
            chatInterface.addMessageToChat('User message 2', 'user');
            
            const exportedData = chatInterface.exportChatHistory();
            
            expect(exportedData).toHaveProperty('messages');
            expect(exportedData).toHaveProperty('exportedAt');
            expect(exportedData).toHaveProperty('totalMessages', 3);
            expect(exportedData.messages).toHaveLength(3);
            
            expect(exportedData.messages[0]).toEqual({
                role: 'user',
                content: 'User message 1',
                timestamp: expect.any(String)
            });
        });

        test('should clear chat history', () => {
            chatInterface.addMessageToChat('Message to be cleared', 'user');
            
            expect(chatInterface.messageHistory).toHaveLength(1);
            expect(document.querySelectorAll('.message')).toHaveLength(1);
            
            chatInterface.clearChatHistory();
            
            expect(chatInterface.messageHistory).toHaveLength(0);
            expect(document.querySelectorAll('.message')).toHaveLength(0);
        });
    });

    describe('Error Recovery', () => {
        test('should retry failed requests', async () => {
            const testMessage = 'Test retry functionality';
            
            // First call fails, second succeeds
            global.fetch
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce(
                    global.testUtils.mockApiResponse({ response: 'Retry success' })
                );
            
            const chatInput = document.getElementById('chat-input');
            chatInput.value = testMessage;
            
            // Simulate initial submission
            await chatInterface.handleChatSubmit(new Event('submit'));
            
            // Should show error message with retry button
            const retryBtn = document.querySelector('.retry-btn');
            expect(retryBtn).toBeTruthy();
            
            // Click retry button
            retryBtn.click();
            
            await global.testUtils.nextTick();
            
            // Should have made two fetch calls
            expect(global.fetch).toHaveBeenCalledTimes(2);
            
            // Should show success message
            const successMessage = document.querySelector('.message.assistant');
            expect(successMessage.textContent).toContain('Retry success');
        });
    });
});