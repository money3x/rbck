// Database Models and Schema Definitions
// Defines data structures for Supabase integration

/**
 * Database Tables Schema for Supabase
 * 
 * Execute these SQL commands in your Supabase SQL editor to create the required tables
 */

const DATABASE_SCHEMA = `
-- ==================================================================
-- USERS TABLE - User management and authentication
-- ==================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT false,
    full_name VARCHAR(100),
    avatar_url TEXT,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- ==================================================================
-- BLOG POSTS TABLE - Content management (Updated for compatibility)
-- ==================================================================
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    titleTH VARCHAR(255) NOT NULL,           -- แก้ไขชื่อให้ตรงกับระบบ
    titleEN VARCHAR(255),                    -- เพิ่ม English title
    title VARCHAR(255),                      -- Backward compatibility
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image_url TEXT,
    author VARCHAR(100) DEFAULT 'ระเบียบการช่าง',  -- เปลี่ยนเป็น string
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    
    -- SEO Fields
    metaTitle VARCHAR(255),                  -- แก้ไขชื่อให้ตรง
    metaDescription TEXT,                    -- แก้ไขชื่อให้ตรง
    keywords TEXT,                           -- เปลี่ยนเป็น TEXT แทน array
    focusKeyword VARCHAR(100),               -- เพิ่ม focus keyword
    
    -- Analytics Fields
    views INTEGER DEFAULT 0,                 -- แก้ไขชื่อให้ตรง
    likes INTEGER DEFAULT 0,                 -- แก้ไขชื่อให้ตรง
    reading_time INTEGER,                    -- in minutes
    
    -- Schema & Technical SEO
    schemaType VARCHAR(50) DEFAULT 'Article',
    canonicalUrl TEXT,
    
    -- Timestamps
    publishedAt TIMESTAMP WITH TIME ZONE,    -- แก้ไขชื่อให้ตรง camelCase
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  -- แก้ไขชื่อให้ตรง
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()   -- แก้ไขชื่อให้ตรง
);

-- ==================================================================
-- AI USAGE TRACKING - Track AI API usage and costs (Updated for ChindaX)
-- ==================================================================
CREATE TABLE IF NOT EXISTS ai_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    provider VARCHAR(50) NOT NULL,           -- 'openai', 'claude', 'gemini', 'deepseek', 'chinda'
    model VARCHAR(100),                      -- 'chinda-qwen3-4b', 'gpt-4', etc.
    operation_type VARCHAR(50) NOT NULL,     -- 'chat', 'analyze', 'generate', etc.
    tokens_used INTEGER NOT NULL DEFAULT 0,
    cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
    cost_thb DECIMAL(10, 2) NOT NULL DEFAULT 0,
    response_time_ms INTEGER,
    quality_score DECIMAL(3, 2),
    
    -- ChindaX specific fields
    jwt_token_used BOOLEAN DEFAULT false,    -- Track JWT token usage
    api_endpoint TEXT,                       -- Store actual endpoint used
    
    request_data JSONB,
    response_data JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================================================================
-- AI CONVERSATIONS - Store AI chat conversations
-- ==================================================================
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    total_tokens INTEGER DEFAULT 0,
    total_cost_thb DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================================================================
-- AI MESSAGES - Individual messages in conversations
-- ==================================================================
CREATE TABLE IF NOT EXISTS ai_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    cost_thb DECIMAL(10, 2) DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================================================================
-- CONTENT ANALYSIS - Store AI content analysis results
-- ==================================================================
CREATE TABLE IF NOT EXISTS content_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    analysis_type VARCHAR(50) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    analysis_data JSONB NOT NULL,
    score DECIMAL(3, 2),
    recommendations TEXT[],
    cost_thb DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================================================================
-- API KEYS MANAGEMENT - Secure storage of API keys (Updated for ChindaX)
-- ==================================================================
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider VARCHAR(50) NOT NULL,           -- 'openai', 'claude', 'gemini', 'deepseek', 'chinda'
    key_name VARCHAR(100) NOT NULL,          -- 'api_key', 'jwt_token'
    encrypted_key TEXT NOT NULL,
    
    -- ChindaX specific fields  
    key_type VARCHAR(20) DEFAULT 'api_key',  -- 'api_key', 'jwt_token', 'secret'
    jwt_token TEXT,                          -- For ChindaX JWT token storage
    
    is_active BOOLEAN DEFAULT true,
    usage_limit INTEGER,
    current_usage INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique combination
    UNIQUE(provider, key_type)
);

-- ==================================================================
-- SYSTEM SETTINGS - Application configuration
-- ==================================================================
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(20) DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================================================================
-- ==================================================================
-- INDEXES FOR PERFORMANCE (Updated for new field names)
-- ==================================================================
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(publishedAt);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author);
CREATE INDEX IF NOT EXISTS idx_posts_views ON posts(views);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_provider ON ai_usage(provider);
CREATE INDEX IF NOT EXISTS idx_ai_usage_model ON ai_usage(model);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_usage(created_at);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_session_id ON ai_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_provider ON ai_conversations(provider);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created_at ON ai_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_api_keys_provider ON api_keys(provider);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_type ON api_keys(key_type);

-- ==================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users
    FOR ALL USING (auth.uid() = id);

-- Posts are publicly readable, but only admin can modify
CREATE POLICY "Posts are publicly readable" ON posts
    FOR SELECT USING (status = 'published' OR auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage posts" ON posts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = true
        )
    );

-- AI usage is private to each user
CREATE POLICY "Users can view own AI usage" ON ai_usage
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own conversations" ON ai_conversations
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own messages" ON ai_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM ai_conversations 
            WHERE ai_conversations.id = conversation_id 
            AND ai_conversations.user_id = auth.uid()
        )
    );

-- ==================================================================
-- FUNCTIONS AND TRIGGERS
-- ==================================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON ai_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate reading time
CREATE OR REPLACE FUNCTION calculate_reading_time(content_text TEXT)
RETURNS INTEGER AS $$
BEGIN
    -- Assume average reading speed of 200 words per minute
    RETURN GREATEST(1, (array_length(string_to_array(content_text, ' '), 1) / 200)::INTEGER);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate reading time
CREATE OR REPLACE FUNCTION set_reading_time()
RETURNS TRIGGER AS $$
BEGIN
    NEW.reading_time = calculate_reading_time(NEW.content);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_post_reading_time BEFORE INSERT OR UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION set_reading_time();
`;

module.exports = {
    DATABASE_SCHEMA,
    
    // User model helpers
    User: {
        tableName: 'users',
        fields: ['id', 'username', 'email', 'is_admin', 'full_name', 'avatar_url', 'last_login', 'created_at', 'is_active']
    },
    
    // Post model helpers (Updated field names)
    Post: {
        tableName: 'posts',
        fields: [
            'id', 'titleTH', 'titleEN', 'title', 'slug', 'content', 'excerpt', 
            'featured_image_url', 'author', 'status', 'metaTitle', 'metaDescription', 
            'keywords', 'focusKeyword', 'views', 'likes', 'reading_time', 
            'schemaType', 'canonicalUrl', 'publishedAt', 'createdAt', 'updatedAt'
        ]
    },
    
    // AI Usage model helpers (Updated with ChindaX fields)
    AIUsage: {
        tableName: 'ai_usage',
        fields: [
            'id', 'user_id', 'provider', 'model', 'operation_type', 'tokens_used', 
            'cost_usd', 'cost_thb', 'response_time_ms', 'quality_score', 
            'jwt_token_used', 'api_endpoint', 'request_data', 'response_data', 
            'error_message', 'created_at'
        ]
    },
    
    // AI Conversation model helpers
    AIConversation: {
        tableName: 'ai_conversations',
        fields: ['id', 'user_id', 'session_id', 'provider', 'title', 'total_tokens', 'total_cost_thb', 'created_at', 'updated_at']
    },
    
    // AI Message model helpers
    AIMessage: {
        tableName: 'ai_messages',
        fields: ['id', 'conversation_id', 'role', 'content', 'tokens_used', 'cost_thb', 'metadata', 'created_at']
    },
    
    // API Keys model helpers (Updated with ChindaX support)
    APIKey: {
        tableName: 'api_keys',
        fields: [
            'id', 'provider', 'key_name', 'encrypted_key', 'key_type', 'jwt_token',
            'is_active', 'usage_limit', 'current_usage', 'expires_at', 
            'created_by', 'created_at', 'updated_at'
        ]
    },
    
    // Helper functions
    getSupportedProviders: () => ['openai', 'claude', 'gemini', 'deepseek', 'chinda'],
    getSupportedModels: (provider) => {
        const models = {
            openai: ['gpt-4', 'gpt-3.5-turbo'],
            claude: ['claude-3-sonnet-20240229', 'claude-3-opus-20240229'],
            gemini: ['gemini-pro', 'gemini-2.0-flash'],
            deepseek: ['deepseek-chat', 'deepseek-coder'],
            chinda: ['chinda-qwen3-4b']
        };
        return models[provider] || [];
    }
};
