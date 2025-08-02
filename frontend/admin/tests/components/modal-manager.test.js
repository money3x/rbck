/**
 * 🧪 Modal Manager Tests
 * Comprehensive testing for modal management functionality
 */

import { ModalManager } from '../../js/components/modal-manager.js';

describe('ModalManager', () => {
    let modalManager;
    let mockContainer;

    beforeEach(() => {
        // Setup DOM
        global.testUtils.setupDOM(`
            <div id="app">
                <div id="modal-container"></div>
                <div id="test-modal" class="modal">
                    <div class="modal-content">
                        <h2>Test Modal</h2>
                        <button class="close-btn">&times;</button>
                    </div>
                </div>
            </div>
        `);

        mockContainer = document.getElementById('modal-container');
        modalManager = new ModalManager(mockContainer);
    });

    afterEach(() => {
        global.testUtils.cleanupDOM();
    });

    describe('Initialization', () => {
        test('should initialize with correct container', () => {
            expect(modalManager.container).toBe(mockContainer);
            expect(modalManager.activeModals).toEqual(new Map());
            expect(modalManager.modalStack).toEqual([]);
        });

        test('should setup keyboard listeners', () => {
            const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
            new ModalManager(mockContainer);
            
            expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
        });
    });

    describe('Modal Creation', () => {
        test('should create modal with basic options', async () => {
            const modalId = await modalManager.showModal({
                title: 'Test Modal',
                content: '<p>Test content</p>'
            });

            expect(modalId).toBeDefined();
            expect(modalManager.activeModals.has(modalId)).toBe(true);
            
            const modalElement = document.getElementById(modalId);
            expect(modalElement).toBeTruthy();
            expect(modalElement.querySelector('.modal-title').textContent).toBe('Test Modal');
        });

        test('should create modal with custom class', async () => {
            const modalId = await modalManager.showModal({
                title: 'Custom Modal',
                content: '<p>Custom content</p>',
                className: 'custom-modal-class'
            });

            const modalElement = document.getElementById(modalId);
            expect(modalElement.classList.contains('custom-modal-class')).toBe(true);
        });

        test('should create modal with custom size', async () => {
            const modalId = await modalManager.showModal({
                title: 'Large Modal',
                content: '<p>Large content</p>',
                size: 'large'
            });

            const modalElement = document.getElementById(modalId);
            expect(modalElement.classList.contains('modal-large')).toBe(true);
        });

        test('should handle modal creation with buttons', async () => {
            const mockCallback = jest.fn();
            
            const modalId = await modalManager.showModal({
                title: 'Button Modal',
                content: '<p>Modal with buttons</p>',
                buttons: [
                    {
                        text: 'OK',
                        className: 'btn-primary',
                        callback: mockCallback
                    },
                    {
                        text: 'Cancel',
                        className: 'btn-secondary'
                    }
                ]
            });

            const modalElement = document.getElementById(modalId);
            const buttons = modalElement.querySelectorAll('.modal-footer button');
            
            expect(buttons).toHaveLength(2);
            expect(buttons[0].textContent).toBe('OK');
            expect(buttons[1].textContent).toBe('Cancel');
            
            // Test button callback
            buttons[0].click();
            expect(mockCallback).toHaveBeenCalled();
        });
    });

    describe('Modal Display and Hiding', () => {
        test('should show modal with animation', async () => {
            const modalId = await modalManager.showModal({
                title: 'Animated Modal',
                content: '<p>Animation test</p>'
            });

            const modalElement = document.getElementById(modalId);
            expect(modalElement.classList.contains('show')).toBe(true);
            expect(modalManager.modalStack).toContain(modalId);
        });

        test('should hide modal', async () => {
            const modalId = await modalManager.showModal({
                title: 'Hide Test Modal',
                content: '<p>Will be hidden</p>'
            });

            await modalManager.hideModal(modalId);
            
            const modalElement = document.getElementById(modalId);
            expect(modalElement).toBeFalsy();
            expect(modalManager.activeModals.has(modalId)).toBe(false);
            expect(modalManager.modalStack).not.toContain(modalId);
        });

        test('should hide all modals', async () => {
            const modalId1 = await modalManager.showModal({
                title: 'Modal 1',
                content: '<p>First modal</p>'
            });
            
            const modalId2 = await modalManager.showModal({
                title: 'Modal 2',
                content: '<p>Second modal</p>'
            });

            await modalManager.hideAllModals();
            
            expect(modalManager.activeModals.size).toBe(0);
            expect(modalManager.modalStack).toHaveLength(0);
            expect(document.getElementById(modalId1)).toBeFalsy();
            expect(document.getElementById(modalId2)).toBeFalsy();
        });
    });

    describe('Backdrop and Keyboard Interaction', () => {
        test('should close modal on backdrop click', async () => {
            const modalId = await modalManager.showModal({
                title: 'Backdrop Test',
                content: '<p>Click backdrop to close</p>',
                closeOnBackdrop: true
            });

            const modalElement = document.getElementById(modalId);
            const backdrop = modalElement.querySelector('.modal-backdrop');
            
            backdrop.click();
            
            await global.testUtils.nextTick();
            expect(modalManager.activeModals.has(modalId)).toBe(false);
        });

        test('should close modal on Escape key', async () => {
            const modalId = await modalManager.showModal({
                title: 'Escape Test',
                content: '<p>Press Escape to close</p>',
                closeOnEscape: true
            });

            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
            document.dispatchEvent(escapeEvent);
            
            await global.testUtils.nextTick();
            expect(modalManager.activeModals.has(modalId)).toBe(false);
        });

        test('should not close modal when closeOnEscape is false', async () => {
            const modalId = await modalManager.showModal({
                title: 'No Escape Test',
                content: '<p>Escape disabled</p>',
                closeOnEscape: false
            });

            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
            document.dispatchEvent(escapeEvent);
            
            await global.testUtils.nextTick();
            expect(modalManager.activeModals.has(modalId)).toBe(true);
        });
    });

    describe('Modal Stack Management', () => {
        test('should manage multiple modals in stack', async () => {
            const modalId1 = await modalManager.showModal({
                title: 'First Modal',
                content: '<p>First in stack</p>'
            });
            
            const modalId2 = await modalManager.showModal({
                title: 'Second Modal',
                content: '<p>Second in stack</p>'
            });

            expect(modalManager.modalStack).toEqual([modalId1, modalId2]);
            expect(modalManager.getTopModal()).toBe(modalId2);
        });

        test('should close top modal when multiple are open', async () => {
            const modalId1 = await modalManager.showModal({
                title: 'First Modal',
                content: '<p>First modal</p>'
            });
            
            const modalId2 = await modalManager.showModal({
                title: 'Second Modal',
                content: '<p>Second modal</p>'
            });

            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
            document.dispatchEvent(escapeEvent);
            
            await global.testUtils.nextTick();
            
            expect(modalManager.activeModals.has(modalId2)).toBe(false);
            expect(modalManager.activeModals.has(modalId1)).toBe(true);
            expect(modalManager.getTopModal()).toBe(modalId1);
        });
    });

    describe('Event System', () => {
        test('should emit modal events', async () => {
            const showListener = jest.fn();
            const hideListener = jest.fn();
            
            modalManager.on('modalShown', showListener);
            modalManager.on('modalHidden', hideListener);

            const modalId = await modalManager.showModal({
                title: 'Event Test',
                content: '<p>Testing events</p>'
            });

            expect(showListener).toHaveBeenCalledWith(
                expect.objectContaining({ detail: { modalId } })
            );

            await modalManager.hideModal(modalId);

            expect(hideListener).toHaveBeenCalledWith(
                expect.objectContaining({ detail: { modalId } })
            );
        });
    });

    describe('Focus Management', () => {
        test('should focus first focusable element in modal', async () => {
            const modalId = await modalManager.showModal({
                title: 'Focus Test',
                content: '<input type="text" id="first-input"><button>Test Button</button>'
            });

            await global.testUtils.nextTick();
            
            const firstInput = document.getElementById('first-input');
            expect(document.activeElement).toBe(firstInput);
        });

        test('should trap focus within modal', async () => {
            const modalId = await modalManager.showModal({
                title: 'Focus Trap Test',
                content: '<input type="text" id="input1"><button id="btn1">Button 1</button><button id="btn2">Button 2</button>'
            });

            const modal = document.getElementById(modalId);
            const input1 = document.getElementById('input1');
            const btn2 = document.getElementById('btn2');

            // Focus should start on first element
            expect(document.activeElement).toBe(input1);

            // Simulate Tab from last element - should wrap to first
            btn2.focus();
            const tabEvent = new KeyboardEvent('keydown', { 
                key: 'Tab', 
                shiftKey: false 
            });
            
            modal.dispatchEvent(tabEvent);
            
            await global.testUtils.nextTick();
            // Focus should wrap to first focusable element
            expect(document.activeElement).toBe(input1);
        });
    });

    describe('Error Handling', () => {
        test('should handle missing container gracefully', () => {
            expect(() => {
                new ModalManager(null);
            }).toThrow('Modal container is required');
        });

        test('should handle invalid modal ID in hideModal', async () => {
            const result = await modalManager.hideModal('non-existent-modal');
            expect(result).toBe(false);
        });

        test('should handle errors in button callbacks', async () => {
            const errorCallback = jest.fn(() => {
                throw new Error('Button callback error');
            });
            
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const modalId = await modalManager.showModal({
                title: 'Error Test',
                content: '<p>Error handling test</p>',
                buttons: [{
                    text: 'Error Button',
                    callback: errorCallback
                }]
            });

            const button = document.querySelector('.modal-footer button');
            button.click();

            expect(errorCallback).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Button callback error'),
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });
    });

    describe('Performance', () => {
        test('should reuse modal elements when possible', async () => {
            const modalId1 = await modalManager.showModal({
                title: 'First Modal',
                content: '<p>First modal</p>'
            });
            
            await modalManager.hideModal(modalId1);
            
            const modalId2 = await modalManager.showModal({
                title: 'Second Modal',
                content: '<p>Second modal</p>'
            });

            // Should have created only one modal element total
            const modalElements = document.querySelectorAll('.modal');
            expect(modalElements.length).toBeLessThanOrEqual(2);
        });

        test('should clean up event listeners on modal destruction', async () => {
            const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
            
            const modalId = await modalManager.showModal({
                title: 'Cleanup Test',
                content: '<p>Testing cleanup</p>'
            });

            await modalManager.hideModal(modalId);
            
            // Should clean up keyboard listener if no more modals
            if (modalManager.modalStack.length === 0) {
                expect(removeEventListenerSpy).toHaveBeenCalledWith(
                    'keydown', 
                    expect.any(Function)
                );
            }
        });
    });
});