/**
 * 🧪 App Controller Tests
 * Comprehensive testing for main application orchestration
 */

import { AdminDashboard } from '../js/app-controller.js';

describe('AdminDashboard', () => {
    let adminDashboard;

    beforeEach(() => {
        // Setup DOM
        global.testUtils.setupDOM(`
            <div id="app">
                <nav class="sidebar">
                    <ul class="nav-menu">
                        <li><a href="#ai-chat" data-section="ai-chat">AI Chat</a></li>
                        <li><a href="#blog-manager" data-section="blog-manager">Blog Manager</a></li>
                        <li><a href="#seo-tools" data-section="seo-tools">SEO Tools</a></li>
                        <li><a href="#ai-monitoring" data-section="ai-monitoring">AI Monitoring</a></li>
                    </ul>
                </nav>
                <main class="main-content">
                    <section id="ai-chat" class="content-section">AI Chat Content</section>
                    <section id="blog-manager" class="content-section">Blog Manager Content</section>
                    <section id="seo-tools" class="content-section">SEO Tools Content</section>
                    <section id="ai-monitoring" class="content-section">AI Monitoring Content</section>
                </main>
                <div id="modal-container"></div>
            </div>
        `);

        adminDashboard = new AdminDashboard();

        // Clear localStorage and mocks
        global.localStorage.clear();
        jest.clearAllMocks();
    });

    afterEach(() => {
        global.testUtils.cleanupDOM();
    });

    describe('Initialization', () => {
        test('should initialize core components', () => {
            expect(adminDashboard.modalManager).toBeDefined();
            expect(adminDashboard.chatInterface).toBeDefined();
            expect(adminDashboard.aiProviders).toBeDefined();
            expect(adminDashboard.moduleLoader).toBeDefined();
        });

        test('should setup navigation event listeners', () => {
            const navLinks = document.querySelectorAll('[data-section]');
            expect(navLinks).toHaveLength(4);
            
            // Each nav link should have click listener
            navLinks.forEach(link => {
                expect(link.onclick).toBeTruthy();
            });
        });

        test('should show default section on initialization', () => {
            const activeSection = document.querySelector('.content-section.active');
            expect(activeSection).toBeTruthy();
            expect(activeSection.id).toBe('ai-chat'); // Default section
        });

        test('should setup error boundary', () => {
            expect(global.window.addEventListener).toHaveBeenCalledWith(
                'error',
                expect.any(Function)
            );
            expect(global.window.addEventListener).toHaveBeenCalledWith(
                'unhandledrejection',
                expect.any(Function)
            );
        });
    });

    describe('Section Navigation', () => {
        test('should show section and update navigation', () => {
            adminDashboard.showSection('blog-manager');

            const activeSection = document.querySelector('.content-section.active');
            const activeNavLink = document.querySelector('.nav-menu a.active');

            expect(activeSection.id).toBe('blog-manager');
            expect(activeNavLink.dataset.section).toBe('blog-manager');
        });

        test('should hide other sections when showing new section', () => {
            adminDashboard.showSection('seo-tools');

            const activeSections = document.querySelectorAll('.content-section.active');
            expect(activeSections).toHaveLength(1);
            expect(activeSections[0].id).toBe('seo-tools');
        });

        test('should handle navigation clicks', () => {
            const navLink = document.querySelector('[data-section="ai-monitoring"]');
            const showSectionSpy = jest.spyOn(adminDashboard, 'showSection');

            global.testUtils.simulateEvent(navLink, 'click');

            expect(showSectionSpy).toHaveBeenCalledWith('ai-monitoring');
        });

        test('should update URL hash on section change', () => {
            adminDashboard.showSection('blog-manager');
            expect(global.window.location.hash).toBe('#blog-manager');
        });

        test('should restore section from URL hash', () => {
            global.window.location.hash = '#seo-tools';
            
            const newDashboard = new AdminDashboard();
            
            const activeSection = document.querySelector('.content-section.active');
            expect(activeSection.id).toBe('seo-tools');
        });
    });

    describe('Component Integration', () => {
        test('should initialize chat interface in AI chat section', () => {
            adminDashboard.showSection('ai-chat');
            
            expect(adminDashboard.chatInterface).toBeDefined();
            expect(adminDashboard.chatInterface.container).toBeTruthy();
        });

        test('should load modules for dynamic sections', async () => {
            const loadModuleSpy = jest.spyOn(adminDashboard.moduleLoader, 'lazyLoadModule')
                .mockResolvedValue({ default: class MockModule {} });

            await adminDashboard.showSection('blog-manager');

            expect(loadModuleSpy).toHaveBeenCalledWith(
                'blogManager',
                expect.any(HTMLElement)
            );
        });

        test('should handle module loading errors gracefully', async () => {
            const loadModuleSpy = jest.spyOn(adminDashboard.moduleLoader, 'lazyLoadModule')
                .mockRejectedValue(new Error('Module load failed'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await adminDashboard.showSection('seo-tools');

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Error loading module'),
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });
    });

    describe('Theme Management', () => {
        test('should apply saved theme on initialization', () => {
            global.localStorage.setItem('admin_theme', 'dark');
            
            const newDashboard = new AdminDashboard();
            
            expect(document.documentElement.dataset.theme).toBe('dark');
        });

        test('should toggle theme', () => {
            adminDashboard.toggleTheme();
            
            expect(document.documentElement.dataset.theme).toBe('dark');
            expect(global.localStorage.setItem).toHaveBeenCalledWith('admin_theme', 'dark');
            
            adminDashboard.toggleTheme();
            
            expect(document.documentElement.dataset.theme).toBe('light');
            expect(global.localStorage.setItem).toHaveBeenCalledWith('admin_theme', 'light');
        });

        test('should broadcast theme changes to modules', () => {
            const broadcastSpy = jest.spyOn(adminDashboard.moduleLoader, 'broadcastToModules');
            
            adminDashboard.toggleTheme();
            
            expect(broadcastSpy).toHaveBeenCalledWith('themeChanged', {
                theme: 'dark'
            });
        });
    });

    describe('State Management', () => {
        test('should save application state', () => {
            adminDashboard.currentSection = 'blog-manager';
            adminDashboard.saveState();

            expect(global.localStorage.setItem).toHaveBeenCalledWith(
                'admin_state',
                expect.stringContaining('blog-manager')
            );
        });

        test('should restore application state', () => {
            const mockState = {
                currentSection: 'seo-tools',
                theme: 'dark',
                timestamp: Date.now()
            };

            global.localStorage.getItem.mockReturnValue(JSON.stringify(mockState));

            adminDashboard.restoreState();

            expect(adminDashboard.currentSection).toBe('seo-tools');
            expect(document.documentElement.dataset.theme).toBe('dark');
        });

        test('should handle corrupted state gracefully', () => {
            global.localStorage.getItem.mockReturnValue('invalid-json');

            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            adminDashboard.restoreState();

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Failed to restore state'),
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });
    });

    describe('Error Handling', () => {
        test('should handle global errors', () => {
            const mockError = new Error('Test error');
            const showModalSpy = jest.spyOn(adminDashboard.modalManager, 'showModal');

            // Simulate global error
            const errorEvent = new ErrorEvent('error', {
                error: mockError,
                message: 'Test error',
                filename: 'test.js',
                lineno: 1
            });

            adminDashboard.handleGlobalError(errorEvent);

            expect(showModalSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'Application Error',
                    content: expect.stringContaining('Test error')
                })
            );
        });

        test('should handle unhandled promise rejections', () => {
            const mockRejection = new Error('Promise rejection');
            const showModalSpy = jest.spyOn(adminDashboard.modalManager, 'showModal');

            const rejectionEvent = {
                reason: mockRejection,
                preventDefault: jest.fn()
            };

            adminDashboard.handleUnhandledRejection(rejectionEvent);

            expect(showModalSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'Unhandled Error',
                    content: expect.stringContaining('Promise rejection')
                })
            );
            expect(rejectionEvent.preventDefault).toHaveBeenCalled();
        });
    });

    describe('Performance Monitoring', () => {
        test('should track performance metrics', () => {
            const mockPerformanceEntry = {
                name: 'section-change',
                duration: 150,
                startTime: 1000
            };

            global.performance.getEntriesByName.mockReturnValue([mockPerformanceEntry]);

            const metrics = adminDashboard.getPerformanceMetrics();

            expect(metrics).toHaveProperty('sectionChangeTime');
            expect(metrics.sectionChangeTime).toBe(150);
        });

        test('should mark performance milestones', () => {
            adminDashboard.markPerformance('app-init');

            expect(global.performance.mark).toHaveBeenCalledWith('app-init');
        });
    });

    describe('Accessibility', () => {
        test('should manage focus properly on section change', () => {
            const targetSection = document.getElementById('blog-manager');
            targetSection.tabIndex = -1;

            const focusSpy = jest.spyOn(targetSection, 'focus');

            adminDashboard.showSection('blog-manager');

            expect(focusSpy).toHaveBeenCalled();
        });

        test('should announce section changes to screen readers', () => {
            adminDashboard.showSection('ai-monitoring');

            const announcement = document.querySelector('[aria-live="polite"]');
            expect(announcement).toBeTruthy();
            expect(announcement.textContent).toContain('AI Monitoring section loaded');
        });

        test('should handle keyboard navigation', () => {
            const showSectionSpy = jest.spyOn(adminDashboard, 'showSection');
            
            // Simulate Ctrl+1 for first section
            const keyEvent = new KeyboardEvent('keydown', {
                key: '1',
                ctrlKey: true
            });

            document.dispatchEvent(keyEvent);

            expect(showSectionSpy).toHaveBeenCalledWith('ai-chat');
        });
    });

    describe('Cleanup', () => {
        test('should cleanup resources on destroy', () => {
            const removeEventListenerSpy = jest.spyOn(global.window, 'removeEventListener');
            
            adminDashboard.destroy();

            expect(removeEventListenerSpy).toHaveBeenCalledWith(
                'error',
                expect.any(Function)
            );
            expect(removeEventListenerSpy).toHaveBeenCalledWith(
                'unhandledrejection',
                expect.any(Function)
            );
        });

        test('should save state before destroy', () => {
            const saveStateSpy = jest.spyOn(adminDashboard, 'saveState');
            
            adminDashboard.destroy();

            expect(saveStateSpy).toHaveBeenCalled();
        });
    });

    describe('Integration Tests', () => {
        test('should handle complete user workflow', async () => {
            // User navigates to AI chat
            adminDashboard.showSection('ai-chat');
            
            expect(document.querySelector('.content-section.active').id).toBe('ai-chat');
            
            // User sends a chat message
            const chatInput = document.querySelector('.chat-input');
            if (chatInput) {
                chatInput.value = 'Test message';
                global.testUtils.simulateEvent(chatInput, 'input');
            }
            
            // User switches to blog manager
            await adminDashboard.showSection('blog-manager');
            
            expect(document.querySelector('.content-section.active').id).toBe('blog-manager');
            
            // User toggles theme
            adminDashboard.toggleTheme();
            
            expect(document.documentElement.dataset.theme).toBe('dark');
        });

        test('should maintain state across page reloads', () => {
            // Set up initial state
            adminDashboard.showSection('seo-tools');
            adminDashboard.toggleTheme(); // Switch to dark theme
            adminDashboard.saveState();

            // Simulate page reload by creating new instance
            const reloadedDashboard = new AdminDashboard();

            expect(reloadedDashboard.currentSection).toBe('seo-tools');
            expect(document.documentElement.dataset.theme).toBe('dark');
        });
    });
});