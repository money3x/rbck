/**
 * 📝 Main Type Definitions Index
 * Centralized exports for all type definitions
 */

// Re-export all types for easier imports
export * from './components';
export * from './services';
export * from './api';
export * from './global';

// Main application types
export interface RBCKAdminConfig {
  theme: {
    default: 'light' | 'dark' | 'auto';
    enableCustomThemes: boolean;
    persistTheme: boolean;
  };
  ai: {
    providers: string[];
    defaultProvider: string;
    enableAutoTesting: boolean;
    rateLimits: Record<string, number>;
  };
  modules: {
    enableLazyLoading: boolean;
    preloadModules: string[];
    fallbackUrls: Record<string, string>;
  };
  security: {
    enableCSP: boolean;
    trustedDomains: string[];
    maxPayloadSize: number;
  };
  performance: {
    enableMonitoring: boolean;
    samplingRate: number;
    reportingEndpoint?: string;
  };
  pwa: {
    enableInstallPrompt: boolean;
    enableOfflineMode: boolean;
    cacheStrategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';
  };
}

export interface ApplicationState {
  config: RBCKAdminConfig;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    preferences: Record<string, any>;
  };
  session: {
    id: string;
    startTime: string;
    lastActivity: string;
    isAuthenticated: boolean;
  };
  ui: {
    currentSection: string;
    theme: string;
    sidebarCollapsed: boolean;
    modalsOpen: string[];
  };
  modules: {
    loaded: string[];
    loading: string[];
    failed: string[];
  };
}

// Utility types for enhanced development experience
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type NonNullable<T> = T extends null | undefined ? never : T;

export type Awaited<T> = T extends PromiseLike<infer U> ? U : T;

export type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;

export type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any;

// Event system types
export interface TypedEventMap {
  'app:init': { timestamp: string };
  'app:ready': { duration: number };
  'app:error': { error: Error; context: string };
  'section:change': { from: string; to: string };
  'theme:change': { theme: string; previous: string };
  'modal:show': { modalId: string; options: any };
  'modal:hide': { modalId: string };
  'module:load': { moduleName: string; duration: number };
  'module:error': { moduleName: string; error: Error };
  'chat:message': { message: string; provider: string };
  'chat:response': { response: string; tokens: number; cost: number };
  'ai:test': { provider: string; success: boolean; responseTime: number };
  'performance:metric': { name: string; value: number; rating: string };
}

export type TypedEventListener<K extends keyof TypedEventMap> = (
  event: CustomEvent<TypedEventMap[K]>
) => void;

// Component lifecycle
export interface ComponentLifecycle {
  init?(): void | Promise<void>;
  mount?(): void | Promise<void>;
  unmount?(): void | Promise<void>;
  destroy?(): void | Promise<void>;
}

// Plugin system
export interface Plugin {
  name: string;
  version: string;
  dependencies?: string[];
  install(app: any): void | Promise<void>;
  uninstall?(): void | Promise<void>;
}

// Error boundaries
export interface ErrorBoundary {
  catchError(error: Error, errorInfo: any): void;
  recoverFromError?(): void;
}

// Performance monitoring
export interface PerformanceObserver {
  observe(metric: string, value: number): void;
  getMetrics(): Record<string, number>;
  reset(): void;
}

// Feature flags
export interface FeatureFlags {
  [key: string]: boolean;
}

// Development tools
export interface DevTools {
  enabled: boolean;
  components: {
    stateInspector: boolean;
    performanceMonitor: boolean;
    eventLogger: boolean;
    typeChecker: boolean;
  };
}

// Build configuration
export interface BuildConfig {
  mode: 'development' | 'production';
  target: string[];
  optimization: {
    minify: boolean;
    treeshake: boolean;
    splitChunks: boolean;
  };
  output: {
    path: string;
    publicPath: string;
    filename: string;
  };
}

export {};