/**
 * 🌐 Global Type Definitions
 * Global types and interfaces for the admin dashboard
 */

// Module Federation types
declare const __webpack_share_scopes__: {
  default: Record<string, any>;
};

// Global window extensions
declare global {
  interface Window {
    moduleEventBus: EventTarget;
    moduleLoader: import('@services/module-loader').ModuleLoader;
    adminDashboard: import('../js/app-controller').AdminDashboard;
  }

  // Performance API extensions
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }

  // CSS API for feature detection
  interface CSS {
    supports(property: string, value?: string): boolean;
  }

  // View Transitions API
  interface Document {
    startViewTransition?: (callback: () => void) => {
      finished: Promise<void>;
      ready: Promise<void>;
      updateCallbackDone: Promise<void>;
    };
  }
}

// Environment variables
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    DEBUG_TESTS?: string;
  }
}

// Module Federation remote modules
declare module 'aiChatModule/ChatInterface' {
  const component: any;
  export default component;
}

declare module 'blogModule/BlogManager' {
  const component: any;
  export default component;
}

declare module 'seoModule/SEOTools' {
  const component: any;
  export default component;
}

declare module 'aiMonitoringModule/AIMonitoring' {
  const component: any;
  export default component;
}

// Service Worker types
interface ServiceWorkerRegistration {
  update(): Promise<void>;
  unregister(): Promise<boolean>;
}

// PWA Installation
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export {};