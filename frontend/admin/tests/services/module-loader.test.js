/**
 * 🧪 Module Loader Tests
 * Comprehensive testing for micro-frontend module loading
 */

import { ModuleLoader } from '../../js/services/module-loader.js';

describe('ModuleLoader', () => {
    let moduleLoader;

    beforeEach(() => {
        // Setup DOM
        global.testUtils.setupDOM(`
            <div id="app">
                <div id="module-container"></div>
            </div>
        `);

        // Mock webpack's share scopes
        global.__webpack_share_scopes__ = {
            default: {}
        };

        // Clear global event listeners
        global.window = Object.assign(global.window, {
            addEventListener: jest.fn(),
            removeEventListener: jest.fn()
        });

        moduleLoader = new ModuleLoader();

        // Clear fetch mock
        global.fetch.mockClear();
    });

    afterEach(() => {
        global.testUtils.cleanupDOM();
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        test('should initialize with empty module maps', () => {
            expect(moduleLoader.loadedModules).toBeInstanceOf(Map);
            expect(moduleLoader.moduleRegistry).toBeInstanceOf(Map);
            expect(moduleLoader.loadingPromises).toBeInstanceOf(Map);
            expect(moduleLoader.eventBus).toBeInstanceOf(EventTarget);
        });

        test('should setup module registry with default modules', () => {
            expect(moduleLoader.moduleRegistry.has('aiChat')).toBe(true);
            expect(moduleLoader.moduleRegistry.has('blogManager')).toBe(true);
            expect(moduleLoader.moduleRegistry.has('seoTools')).toBe(true);
            expect(moduleLoader.moduleRegistry.has('aiMonitoring')).toBe(true);
        });

        test('should setup global error handling', () => {
            expect(global.window.addEventListener).toHaveBeenCalledWith(
                'error',
                expect.any(Function)
            );
            expect(global.window.addEventListener).toHaveBeenCalledWith(
                'unhandledrejection',
                expect.any(Function)
            );
        });

        test('should make event bus globally available', () => {
            expect(global.window.moduleEventBus).toBe(moduleLoader.eventBus);
        });
    });

    describe('Module Loading', () => {
        test('should load module successfully', async () => {
            const mockModule = { 
                default: class TestModule {
                    render(container) {
                        container.innerHTML = '<div>Test Module Loaded</div>';
                    }
                }
            };

            // Mock successful script loading and module federation
            const mockScript = {
                onload: null,
                onerror: null
            };
            
            jest.spyOn(document, 'createElement').mockReturnValue(mockScript);
            jest.spyOn(document.head, 'appendChild').mockImplementation(() => {
                // Simulate successful script load
                setTimeout(() => mockScript.onload(), 0);
            });

            // Mock webpack module federation
            global.window.aiChatModule = {
                init: jest.fn().mockResolvedValue(),
                get: jest.fn().mockResolvedValue(() => mockModule)
            };

            const loadedModule = await moduleLoader.loadModule('aiChat');

            expect(loadedModule).toBe(mockModule);
            expect(moduleLoader.loadedModules.has('aiChat')).toBe(true);
            expect(moduleLoader.loadedModules.get('aiChat')).toBe(mockModule);
        });

        test('should return cached module if already loaded', async () => {
            const cachedModule = { test: 'cached' };
            moduleLoader.loadedModules.set('testModule', cachedModule);

            const result = await moduleLoader.loadModule('testModule');

            expect(result).toBe(cachedModule);
        });

        test('should return loading promise if module is being loaded', async () => {
            const loadingPromise = Promise.resolve({ test: 'loading' });
            moduleLoader.loadingPromises.set('testModule', loadingPromise);

            const result = await moduleLoader.loadModule('testModule');

            expect(result).toEqual({ test: 'loading' });
        });

        test('should throw error for unknown module', async () => {
            await expect(moduleLoader.loadModule('unknownModule'))
                .rejects.toThrow('Module unknownModule not found in registry');
        });

        test('should fallback to local module on remote failure', async () => {
            const fallbackModule = { fallback: true };
            
            // Override module registry for this test
            moduleLoader.moduleRegistry.set('testModule', {
                url: 'http://localhost:3002/remoteEntry.js',
                scope: 'testModule',
                module: './TestModule',
                fallback: jest.fn().mockResolvedValue(fallbackModule)
            });

            // Mock script loading failure
            const mockScript = {
                onload: null,
                onerror: null
            };
            
            jest.spyOn(document, 'createElement').mockReturnValue(mockScript);
            jest.spyOn(document.head, 'appendChild').mockImplementation(() => {
                // Simulate script load failure
                setTimeout(() => mockScript.onerror(), 0);
            });

            const result = await moduleLoader.loadModule('testModule');

            expect(result).toBe(fallbackModule);
            expect(moduleLoader.moduleRegistry.get('testModule').fallback).toHaveBeenCalled();
        });
    });

    describe('Script Loading', () => {
        test('should load script successfully', async () => {
            const mockScript = {
                onload: null,
                onerror: null,
                src: '',
                type: '',
                async: false
            };

            jest.spyOn(document, 'createElement').mockReturnValue(mockScript);
            jest.spyOn(document.head, 'appendChild').mockImplementation(() => {
                setTimeout(() => mockScript.onload(), 0);
            });

            await moduleLoader.loadScript('http://test.com/script.js');

            expect(document.createElement).toHaveBeenCalledWith('script');
            expect(mockScript.src).toBe('http://test.com/script.js');
            expect(mockScript.type).toBe('text/javascript');
            expect(mockScript.async).toBe(true);
        });

        test('should not reload existing script', async () => {
            // Mock existing script
            const existingScript = document.createElement('script');
            existingScript.src = 'http://test.com/existing.js';
            jest.spyOn(document, 'querySelector').mockReturnValue(existingScript);

            await moduleLoader.loadScript('http://test.com/existing.js');

            expect(document.createElement).not.toHaveBeenCalled();
        });

        test('should handle script loading errors', async () => {
            const mockScript = {
                onload: null,
                onerror: null
            };

            jest.spyOn(document, 'createElement').mockReturnValue(mockScript);
            jest.spyOn(document.head, 'appendChild').mockImplementation(() => {
                setTimeout(() => mockScript.onerror(), 0);
            });

            await expect(moduleLoader.loadScript('http://test.com/failing.js'))
                .rejects.toThrow('Failed to load script: http://test.com/failing.js');
        });
    });

    describe('Lazy Loading', () => {
        test('should lazy load module with loading indicator', async () => {
            const container = document.getElementById('module-container');
            const mockModule = {
                default: class TestModule {
                    render(containerEl) {
                        containerEl.innerHTML = '<div>Lazy Loaded Module</div>';
                    }
                }
            };

            // Mock successful module loading
            jest.spyOn(moduleLoader, 'loadModule').mockResolvedValue(mockModule);

            const result = await moduleLoader.lazyLoadModule('testModule', container);

            expect(container.innerHTML).toContain('Lazy Loaded Module');
            expect(result).toBe(mockModule);
        });

        test('should show error state on lazy load failure', async () => {
            const container = document.getElementById('module-container');

            // Mock module loading failure
            jest.spyOn(moduleLoader, 'loadModule').mockRejectedValue(new Error('Load failed'));

            await expect(moduleLoader.lazyLoadModule('testModule', container))
                .rejects.toThrow('Load failed');

            expect(container.innerHTML).toContain('Module Loading Failed');
            expect(container.innerHTML).toContain('Retry');
        });
    });

    describe('Event System', () => {
        test('should emit module events', async () => {
            const eventListener = jest.fn();
            moduleLoader.on('moduleLoaded', eventListener);

            const mockModule = { test: 'module' };
            moduleLoader.loadedModules.set('testModule', mockModule);
            
            moduleLoader.emitEvent('moduleLoaded', { 
                moduleName: 'testModule', 
                module: mockModule 
            });

            expect(eventListener).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: { moduleName: 'testModule', module: mockModule }
                })
            );
        });

        test('should broadcast events to loaded modules', () => {
            const mockModule1 = {
                onGlobalEvent: jest.fn()
            };
            const mockModule2 = {
                onGlobalEvent: jest.fn()
            };

            moduleLoader.loadedModules.set('module1', mockModule1);
            moduleLoader.loadedModules.set('module2', mockModule2);

            moduleLoader.broadcastToModules('testEvent', { data: 'test' });

            expect(mockModule1.onGlobalEvent).toHaveBeenCalledWith('testEvent', { data: 'test' });
            expect(mockModule2.onGlobalEvent).toHaveBeenCalledWith('testEvent', { data: 'test' });
        });

        test('should handle event broadcast errors gracefully', () => {
            const mockModule = {
                onGlobalEvent: jest.fn(() => {
                    throw new Error('Event handler error');
                })
            };

            moduleLoader.loadedModules.set('failingModule', mockModule);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            moduleLoader.broadcastToModules('testEvent', { data: 'test' });

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Event broadcast failed for failingModule'),
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });
    });

    describe('Module Management', () => {
        test('should get module status', () => {
            const mockModule = { test: 'module' };
            moduleLoader.loadedModules.set('loadedModule', mockModule);
            moduleLoader.loadingPromises.set('loadingModule', Promise.resolve());

            const loadedStatus = moduleLoader.getModuleStatus('loadedModule');
            const loadingStatus = moduleLoader.getModuleStatus('loadingModule');
            const unregisteredStatus = moduleLoader.getModuleStatus('unknownModule');

            expect(loadedStatus).toEqual({
                isLoaded: true,
                isLoading: false,
                isRegistered: true
            });

            expect(loadingStatus).toEqual({
                isLoaded: false,
                isLoading: true,
                isRegistered: true
            });

            expect(unregisteredStatus).toEqual({
                isLoaded: false,
                isLoading: false,
                isRegistered: false
            });
        });

        test('should get loaded modules list', () => {
            moduleLoader.loadedModules.set('module1', {});
            moduleLoader.loadedModules.set('module2', {});

            const loadedModules = moduleLoader.getLoadedModules();

            expect(loadedModules).toEqual(['module1', 'module2']);
        });

        test('should unload module with cleanup', () => {
            const mockModule = {
                cleanup: jest.fn()
            };

            moduleLoader.loadedModules.set('testModule', mockModule);

            moduleLoader.unloadModule('testModule');

            expect(mockModule.cleanup).toHaveBeenCalled();
            expect(moduleLoader.loadedModules.has('testModule')).toBe(false);
        });

        test('should handle cleanup errors gracefully', () => {
            const mockModule = {
                cleanup: jest.fn(() => {
                    throw new Error('Cleanup failed');
                })
            };

            moduleLoader.loadedModules.set('testModule', mockModule);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            moduleLoader.unloadModule('testModule');

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Cleanup failed for testModule'),
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });
    });

    describe('Health Check', () => {
        test('should perform health check on modules', async () => {
            global.fetch
                .mockResolvedValueOnce(global.testUtils.mockApiResponse({}, 200))
                .mockRejectedValueOnce(new Error('Network error'));

            const results = await moduleLoader.healthCheck();

            expect(results).toHaveProperty('aiChat');
            expect(results).toHaveProperty('blogManager');
            
            expect(results.aiChat.status).toBe('healthy');
            expect(results.blogManager.status).toBe('error');
        });
    });

    describe('Statistics', () => {
        test('should provide module loader statistics', () => {
            moduleLoader.loadedModules.set('module1', {});
            moduleLoader.loadedModules.set('module2', {});
            moduleLoader.loadingPromises.set('module3', Promise.resolve());

            const stats = moduleLoader.getStats();

            expect(stats).toEqual({
                totalModules: 4, // Default registered modules
                loadedModules: 2,
                loadingModules: 1,
                moduleNames: ['aiChat', 'blogManager', 'seoTools', 'aiMonitoring'],
                loadedModuleNames: ['module1', 'module2']
            });
        });
    });

    describe('Error Handling', () => {
        test('should handle global module errors', () => {
            const errorEvent = new ErrorEvent('error', {
                filename: 'http://localhost:3002/remoteEntry.js',
                error: new Error('Module error'),
                message: 'Module loading failed'
            });

            const emitSpy = jest.spyOn(moduleLoader, 'emitEvent');

            // Simulate error event
            global.window.addEventListener.mock.calls
                .find(call => call[0] === 'error')[1](errorEvent);

            expect(emitSpy).toHaveBeenCalledWith('moduleError', {
                filename: 'http://localhost:3002/remoteEntry.js',
                error: errorEvent.error,
                message: 'Module loading failed'
            });
        });

        test('should handle unhandled rejections', () => {
            const rejectionEvent = {
                reason: new Error('Module Federation error: Failed to load')
            };

            const emitSpy = jest.spyOn(moduleLoader, 'emitEvent');

            // Simulate unhandled rejection
            global.window.addEventListener.mock.calls
                .find(call => call[0] === 'unhandledrejection')[1](rejectionEvent);

            expect(emitSpy).toHaveBeenCalledWith('moduleError', {
                type: 'module-federation',
                error: rejectionEvent.reason
            });
        });
    });
});