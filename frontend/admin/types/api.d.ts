/**
 * 🌐 API Type Definitions
 * Type definitions for API interactions and data models
 */

// Base API Types
export interface APIConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
  retryAttempts: number;
  retryDelay: number;
}

export interface APIError {
  code: string;
  message: string;
  status: number;
  details?: any;
  timestamp: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// AI Chat API Types
export interface ChatRequest {
  message: string;
  provider: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  history?: ChatMessage[];
  stream?: boolean;
}

export interface ChatStreamChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason?: string;
  }>;
}

// OpenAI API Types
export interface OpenAIRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
}

export interface OpenAIResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: 'stop' | 'length' | 'function_call' | 'content_filter';
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Anthropic API Types
export interface AnthropicRequest {
  model: string;
  max_tokens: number;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  stream?: boolean;
  system?: string;
}

export interface AnthropicResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{
    type: 'text';
    text: string;
  }>;
  model: string;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence';
  stop_sequence?: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

// Google AI API Types
export interface GoogleAIRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
    role: 'user' | 'model';
  }>;
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
    candidateCount?: number;
    stopSequences?: string[];
  };
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
}

export interface GoogleAIResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
      role: 'model';
    };
    finishReason: 'FINISH_REASON_UNSPECIFIED' | 'STOP' | 'MAX_TOKENS' | 'SAFETY' | 'RECITATION' | 'OTHER';
    index: number;
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

// Blog Management API Types
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  categories: string[];
  featuredImage?: {
    url: string;
    alt: string;
    caption?: string;
  };
  seo: {
    title?: string;
    description?: string;
    keywords?: string[];
    canonicalUrl?: string;
  };
  metadata: {
    readTime: number;
    wordCount: number;
    views: number;
    likes: number;
    shares: number;
  };
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  postCount: number;
  createdAt: string;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  postCount: number;
  createdAt: string;
}

// SEO API Types
export interface SEOAnalysis {
  url: string;
  title: string;
  description: string;
  keywords: string[];
  score: number;
  issues: SEOIssue[];
  suggestions: SEOSuggestion[];
  metadata: {
    analyzedAt: string;
    tool: string;
    version: string;
  };
}

export interface SEOIssue {
  type: 'error' | 'warning' | 'info';
  category: 'title' | 'description' | 'keywords' | 'headers' | 'images' | 'links' | 'performance';
  message: string;
  impact: 'high' | 'medium' | 'low';
  location?: {
    element: string;
    line?: number;
    column?: number;
  };
}

export interface SEOSuggestion {
  category: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  impact: string;
}

export interface KeywordAnalysis {
  keyword: string;
  difficulty: number;
  volume: number;
  competition: 'high' | 'medium' | 'low';
  cpc: number;
  trends: Array<{
    month: string;
    volume: number;
  }>;
  related: string[];
  suggestions: string[];
}

// AI Monitoring API Types
export interface AIMetrics {
  providerId: string;
  timeframe: {
    start: string;
    end: string;
  };
  requests: {
    total: number;
    successful: number;
    failed: number;
    rate_limited: number;
  };
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  costs: {
    total: number;
    currency: string;
    breakdown: Array<{
      type: 'input' | 'output';
      tokens: number;
      cost: number;
    }>;
  };
  performance: {
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    uptime: number;
  };
  errors: Array<{
    timestamp: string;
    type: string;
    message: string;
    count: number;
  }>;
}

export interface AIUsageAlert {
  id: string;
  type: 'cost' | 'rate_limit' | 'error' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  provider: string;
  threshold: {
    value: number;
    unit: string;
  };
  current: {
    value: number;
    unit: string;
  };
  timestamp: string;
  acknowledged: boolean;
}

// User Management API Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'editor' | 'viewer';
  permissions: string[];
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      browser: boolean;
      sms: boolean;
    };
  };
  status: 'active' | 'inactive' | 'suspended';
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// File Upload API Types
export interface FileUpload {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  metadata: {
    width?: number;
    height?: number;
    duration?: number;
    bitrate?: number;
  };
  uploadedBy: string;
  uploadedAt: string;
}

export interface FileUploadRequest {
  file: File;
  folder?: string;
  public?: boolean;
  generateThumbnail?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export interface FileUploadProgress {
  fileId: string;
  loaded: number;
  total: number;
  percentage: number;
  speed: number;
  timeRemaining: number;
}

// Settings API Types
export interface AppSettings {
  general: {
    siteName: string;
    siteUrl: string;
    timezone: string;
    language: string;
    dateFormat: string;
    timeFormat: string;
  };
  ai: {
    defaultProvider: string;
    defaultModel: string;
    maxTokens: number;
    temperature: number;
    rateLimits: Record<string, number>;
  };
  seo: {
    defaultTitle: string;
    defaultDescription: string;
    defaultKeywords: string[];
    googleAnalyticsId?: string;
    googleSearchConsoleId?: string;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSymbols: boolean;
    };
    twoFactorAuth: boolean;
  };
  notifications: {
    emailSettings: {
      host: string;
      port: number;
      secure: boolean;
      username: string;
      from: string;
    };
    templates: Record<string, {
      subject: string;
      body: string;
    }>;
  };
}

// Webhook API Types
export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
  lastTriggered?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookEvent {
  id: string;
  webhookId: string;
  event: string;
  payload: any;
  status: 'pending' | 'success' | 'failed';
  attempts: number;
  lastAttempt?: string;
  response?: {
    status: number;
    body: string;
    headers: Record<string, string>;
  };
  createdAt: string;
}

export {};