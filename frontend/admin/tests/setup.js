/**
 * 🧪 Test Setup Configuration
 * Global test setup and utilities
 */

import { jest } from '@jest/globals';

// Mock global objects
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.sessionStorage = sessionStorageMock;

// Mock fetch
global.fetch = jest.fn();

// Mock performance API
global.performance = {
  ...global.performance,
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  memory: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000,
    jsHeapSizeLimit: 4000000
  }
};

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock MutationObserver
global.MutationObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  disconnect: jest.fn()
}));

// Mock PerformanceObserver
global.PerformanceObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  disconnect: jest.fn()
}));

// Mock CSS functions
global.CSS = {
  supports: jest.fn(() => true)
};

// Mock crypto
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: jest.fn().mockReturnValue(new Uint32Array(10))
  }
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
});

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(callback => setTimeout(callback, 16));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

// Mock HTMLElement methods
Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
  configurable: true,
  value: 100
});

Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
  configurable: true,
  value: 100
});

Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
  configurable: true,
  value: jest.fn()
});

// Test utilities
global.testUtils = {
  // Create a mock DOM element
  createElement: (tag = 'div', attributes = {}) => {
    const element = document.createElement(tag);
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    return element;
  },
  
  // Wait for next tick
  nextTick: () => new Promise(resolve => setTimeout(resolve, 0)),
  
  // Wait for animation frame
  nextFrame: () => new Promise(resolve => requestAnimationFrame(resolve)),
  
  // Simulate user event
  simulateEvent: (element, eventType, options = {}) => {
    const event = new Event(eventType, { bubbles: true, ...options });
    element.dispatchEvent(event);
  },
  
  // Mock API response
  mockApiResponse: (data, status = 200) => {
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data))
    });
  },
  
  // Setup DOM for testing
  setupDOM: (html = '<div id="app"></div>') => {
    document.body.innerHTML = html;
    return document.body;
  },
  
  // Clean up DOM after test
  cleanupDOM: () => {
    document.body.innerHTML = '';
  }
};

// Setup default DOM
document.body.innerHTML = '<div id="app"></div>';

// Clean up after each test
afterEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset localStorage
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  
  // Reset sessionStorage
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();
  
  // Reset fetch
  global.fetch.mockClear();
  
  // Clean up DOM
  global.testUtils.cleanupDOM();
});

// Setup before all tests
beforeAll(() => {
  // Suppress console logs in tests (unless debugging)
  if (!process.env.DEBUG_TESTS) {
    global.console.log = jest.fn();
    global.console.warn = jest.fn();
    global.console.error = jest.fn();
  }
});

// Cleanup after all tests
afterAll(() => {
  // Final cleanup
  jest.clearAllTimers();
});