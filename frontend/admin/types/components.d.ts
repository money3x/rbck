/**
 * 🧩 Component Type Definitions
 * Type definitions for dashboard components
 */

// Modal Manager Types
export interface ModalOptions {
  title: string;
  content: string;
  className?: string;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  buttons?: ModalButton[];
  onShow?: (modalId: string) => void;
  onHide?: (modalId: string) => void;
}

export interface ModalButton {
  text: string;
  className?: string;
  callback?: () => void | Promise<void>;
  closeModal?: boolean;
}

export interface ModalState {
  id: string;
  element: HTMLElement;
  options: ModalOptions;
  isVisible: boolean;
  createdAt: number;
}

// Chat Interface Types
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'error';
  content: string;
  timestamp: string;
  provider?: string;
  tokens?: number;
  cost?: number;
}

export interface ChatOptions {
  provider: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface ChatResponse {
  response: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  cost?: number;
  model?: string;
  provider: string;
}

export interface ChatExport {
  messages: ChatMessage[];
  exportedAt: string;
  totalMessages: number;
  provider: string;
  metadata: {
    version: string;
    source: 'rbck-admin-dashboard';
  };
}

// AI Provider Types
export interface AIProvider {
  name: string;
  displayName: string;
  apiKey: string;
  endpoint: string;
  models: string[];
  status: 'unknown' | 'working' | 'error' | 'rate_limited';
  lastTested?: string;
  responseTime?: number;
  errorMessage?: string;
  autoTest: boolean;
  costPer1kTokens: number;
}

export interface ProviderTestResult {
  success: boolean;
  responseTime: number;
  error?: string;
  message: string;
  tokens?: number;
  cost?: number;
}

export interface ProviderStats {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  averageTokens: number;
  averageResponseTime: number;
  successRate: number;
  lastUsed?: string;
}

export interface ProviderRecommendation {
  provider: string;
  reason: string;
  confidence: number;
  alternatives: string[];
}

// Module Loader Types
export interface ModuleConfig {
  url: string;
  scope: string;
  module: string;
  fallback?: () => Promise<any>;
}

export interface ModuleStatus {
  isLoaded: boolean;
  isLoading: boolean;
  isRegistered: boolean;
}

export interface ModuleStats {
  totalModules: number;
  loadedModules: number;
  loadingModules: number;
  moduleNames: string[];
  loadedModuleNames: string[];
}

export interface ModuleHealthResult {
  [moduleName: string]: {
    status: 'healthy' | 'unhealthy' | 'error';
    responseTime?: number;
    error?: string;
  };
}

// App Controller Types
export interface AppState {
  currentSection: string;
  theme: 'light' | 'dark';
  timestamp: number;
  version: string;
}

export interface PerformanceMetrics {
  sectionChangeTime?: number;
  moduleLoadTime?: number;
  chatResponseTime?: number;
  memoryUsage?: {
    used: number;
    total: number;
    limit: number;
  };
}

export interface ErrorInfo {
  message: string;
  stack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  timestamp: string;
  userAgent: string;
  url: string;
}

// Component Base Interface
export interface Component {
  container: HTMLElement;
  init(): void;
  destroy?(): void;
  render?(): void;
  on?(event: string, listener: EventListener): void;
  off?(event: string, listener: EventListener): void;
  emit?(event: string, data?: any): void;
}

// Event System Types
export interface ComponentEvent<T = any> extends CustomEvent<T> {
  detail: T;
}

export type ComponentEventListener<T = any> = (event: ComponentEvent<T>) => void;

// Theme Types
export interface ThemeConfig {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  requestId?: string;
}

// Form Types
export interface FormField {
  name: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'radio';
  label: string;
  placeholder?: string;
  required?: boolean;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    custom?: (value: string) => boolean | string;
  };
  options?: Array<{
    value: string;
    label: string;
  }>;
}

export interface FormData {
  [fieldName: string]: string | boolean | number;
}

// Animation Types
export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
  fill?: 'none' | 'forwards' | 'backwards' | 'both';
}

// Storage Types
export interface StorageManager {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
  has(key: string): boolean;
}

export {};