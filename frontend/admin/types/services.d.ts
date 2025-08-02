/**
 * 🔧 Service Type Definitions
 * Type definitions for service layer components
 */

// PWA Manager Types
export interface PWAConfig {
  enableInstallPrompt: boolean;
  enableUpdatePrompt: boolean;
  enableOfflineMode: boolean;
  cacheStrategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';
  skipWaiting: boolean;
}

export interface PWAStatus {
  isInstalled: boolean;
  isOnline: boolean;
  hasUpdate: boolean;
  isInstallable: boolean;
  installation?: {
    platform: string;
    source: 'automatic' | 'manual';
    timestamp: string;
  };
}

export interface PWAInstallPrompt {
  show(): Promise<void>;
  outcome: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

// Security Framework Types
export interface SecurityConfig {
  enableCSP: boolean;
  enableXSS: boolean;
  enableSanitization: boolean;
  trustedDomains: string[];
  maxPayloadSize: number;
  rateLimiting: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
  };
}

export interface SecurityViolation {
  type: 'csp' | 'xss' | 'injection' | 'rate-limit';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  source: string;
  timestamp: string;
  blocked: boolean;
}

export interface CSPReport {
  'csp-report': {
    'document-uri': string;
    referrer: string;
    'violated-directive': string;
    'effective-directive': string;
    'original-policy': string;
    disposition: string;
    'blocked-uri': string;
    'line-number': number;
    'column-number': number;
    'source-file': string;
  };
}

// Theme Manager Types
export interface ThemeManagerConfig {
  defaultTheme: 'light' | 'dark' | 'auto';
  enableSystemTheme: boolean;
  enableCustomThemes: boolean;
  transitionDuration: number;
  persistTheme: boolean;
}

export interface CustomTheme {
  id: string;
  name: string;
  colors: Record<string, string>;
  fonts?: Record<string, string>;
  spacing?: Record<string, string>;
  borderRadius?: Record<string, string>;
  shadows?: Record<string, string>;
  animations?: Record<string, string>;
}

export interface ThemeState {
  current: string;
  available: string[];
  systemPreference: 'light' | 'dark';
  customThemes: CustomTheme[];
}

// Performance Monitor Types
export interface PerformanceConfig {
  enableMonitoring: boolean;
  samplingRate: number;
  thresholds: {
    fcp: number; // First Contentful Paint
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
    ttfb: number; // Time to First Byte
  };
  reportingEndpoint?: string;
}

export interface PerformanceEntry {
  name: string;
  entryType: string;
  startTime: number;
  duration: number;
  transferSize?: number;
  encodedBodySize?: number;
  decodedBodySize?: number;
}

export interface WebVital {
  name: 'FCP' | 'LCP' | 'FID' | 'CLS' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

export interface PerformanceReport {
  timestamp: string;
  url: string;
  userAgent: string;
  connection: {
    effectiveType: string;
    downlink: number;
    rtt: number;
  };
  vitals: WebVital[];
  resources: PerformanceEntry[];
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

// Analytics Service Types
export interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  customDimensions?: Record<string, string>;
}

export interface AnalyticsConfig {
  trackingId?: string;
  enableAutoTracking: boolean;
  trackPageViews: boolean;
  trackClicks: boolean;
  trackErrors: boolean;
  trackPerformance: boolean;
  anonymizeIP: boolean;
  cookieConsent: boolean;
}

export interface PageView {
  page: string;
  title: string;
  timestamp: string;
  referrer?: string;
  userId?: string;
  sessionId: string;
}

export interface UserSession {
  sessionId: string;
  userId?: string;
  startTime: string;
  endTime?: string;
  pageViews: number;
  events: number;
  bounceRate: number;
  avgSessionDuration: number;
}

// Notification Service Types
export interface NotificationConfig {
  enableBrowser: boolean;
  enableToast: boolean;
  defaultDuration: number;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  maxVisible: number;
}

export interface NotificationOptions {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  persistent?: boolean;
  actions?: NotificationAction[];
  icon?: string;
  badge?: string;
  tag?: string;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
  callback?: () => void;
}

export interface ToastNotification extends NotificationOptions {
  id: string;
  timestamp: string;
  dismissed: boolean;
}

// Data Service Types
export interface DataServiceConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  enableCaching: boolean;
  cacheStrategy: 'memory' | 'localStorage' | 'sessionStorage' | 'indexedDB';
  cacheTTL: number;
}

export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
  cache?: boolean;
  cacheTTL?: number;
  retries?: number;
}

export interface ResponseData<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  cached?: boolean;
  timestamp: string;
  requestId: string;
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
  size: number;
}

// State Management Types
export interface StateManager<T = any> {
  getState(): T;
  setState(newState: Partial<T>): void;
  subscribe(listener: StateListener<T>): () => void;
  dispatch(action: StateAction): void;
}

export interface StateAction {
  type: string;
  payload?: any;
  meta?: Record<string, any>;
}

export type StateListener<T> = (state: T, prevState: T, action: StateAction) => void;

export type StateReducer<T> = (state: T, action: StateAction) => T;

export interface StateMiddleware<T = any> {
  (state: T, action: StateAction, next: (action: StateAction) => void): void;
}

// Logger Service Types
export interface LoggerConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  enablePersistence: boolean;
  maxLogSize: number;
  batchSize: number;
  flushInterval: number;
}

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  source?: string;
  data?: any;
  stack?: string;
  userId?: string;
  sessionId: string;
}

export interface Logger {
  debug(message: string, data?: any): void;
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, error?: Error, data?: any): void;
  setLevel(level: LoggerConfig['level']): void;
  setContext(context: Record<string, any>): void;
}

// Validation Service Types
export interface ValidationRule {
  type: 'required' | 'email' | 'url' | 'pattern' | 'minLength' | 'maxLength' | 'min' | 'max' | 'custom';
  message: string;
  value?: any;
  validator?: (value: any) => boolean | Promise<boolean>;
}

export interface ValidationSchema {
  [fieldName: string]: ValidationRule | ValidationRule[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  value: any;
  rule: string;
}

// Utility Service Types
export interface UtilityService {
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    immediate?: boolean
  ): T;
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): T;
  deepClone<T>(obj: T): T;
  deepMerge<T extends object>(target: T, ...sources: Partial<T>[]): T;
  formatDate(date: Date | string, format: string): string;
  formatFileSize(bytes: number): string;
  generateId(length?: number): string;
  sanitizeHTML(html: string): string;
  escapeRegExp(string: string): string;
}

export {};