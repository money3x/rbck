-- ========================================
-- RBCK SUPABASE MIGRATION PLAN
-- Pro-Level Database Setup
-- ========================================

-- Step 1: Essential Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Migration Tracking
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) UNIQUE NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Core User Management
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Content Categories (Normalized)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7),
    icon VARCHAR(50),
    parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Tags System (Normalized)
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    color VARCHAR(7),
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Post-Tag Relationships
CREATE TABLE IF NOT EXISTS post_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, tag_id)
);

-- Step 7: Extend Posts Table (Keep existing bilingual features)
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS featured_image_url TEXT,
ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS generated_by_ai BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS ai_prompt TEXT,
ADD COLUMN IF NOT EXISTS ai_confidence_score DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

-- Step 8: AI Tracking System
CREATE TABLE IF NOT EXISTS ai_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    provider VARCHAR(50) NOT NULL,
    request_type VARCHAR(50) NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT,
    model_used VARCHAR(100),
    temperature DECIMAL(3,2),
    max_tokens INTEGER,
    tokens_used INTEGER,
    response_time_ms INTEGER,
    success BOOLEAN DEFAULT false,
    error_message TEXT,
    estimated_cost DECIMAL(10,6),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_swarm_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES ai_requests(id) ON DELETE CASCADE,
    topic_analysis JSONB,
    roles_assigned JSONB,
    expert_responses JSONB,
    critic_review TEXT,
    final_synthesis TEXT,
    confidence_score DECIMAL(3,2),
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 9: Settings System
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    type VARCHAR(20) DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 10: Performance Indexes
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_category_id ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_ai_requests_user_id ON ai_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_requests_provider ON ai_requests(provider);
CREATE INDEX IF NOT EXISTS idx_ai_requests_created_at ON ai_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_tags_post_id ON post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON post_tags(tag_id);

-- Step 11: Updated At Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 12: Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public read access for published posts" ON posts
    FOR SELECT USING (status = 'published');

CREATE POLICY "Public read access for active categories" ON categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public read access for tags" ON tags
    FOR SELECT USING (true);

CREATE POLICY "Public read access for public settings" ON settings
    FOR SELECT USING (is_public = true);

-- Admin full access policies
CREATE POLICY "Service role full access on users" ON users
    FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access on posts" ON posts
    FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access on categories" ON categories
    FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access on tags" ON tags
    FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access on settings" ON settings
    FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access on ai_requests" ON ai_requests
    FOR ALL TO service_role USING (true);

-- Step 13: Initial Data
INSERT INTO users (email, username, password_hash, role, first_name, last_name, is_active, email_verified)
VALUES ('admin@rbck.local', 'admin', '$2b$10$example.hash.here', 'admin', 'Admin', 'User', true, true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO categories (name, slug, description, is_active) VALUES 
('Technology', 'technology', 'Tech articles and tutorials', true),
('Business', 'business', 'Business insights and strategies', true),
('Lifestyle', 'lifestyle', 'Life and wellness content', true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO tags (name, slug) VALUES 
('AI', 'ai'),
('Web Development', 'web-development'),
('Marketing', 'marketing'),
('Tutorial', 'tutorial')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO settings (key, value, type, description, is_public) VALUES 
('site_title', 'RBCK CMS', 'string', 'Site title', true),
('site_description', 'AI-Powered Content Management System', 'string', 'Site description', true),
('posts_per_page', '10', 'number', 'Posts per page', true),
('enable_ai_features', 'true', 'boolean', 'Enable AI features', false),
('ai_default_provider', 'gemini', 'string', 'Default AI provider', false),
('seo_meta_title', 'RBCK CMS - AI-Powered Content Management', 'string', 'Default meta title', true),
('seo_meta_description', 'Advanced CMS with AI integration for content creation', 'string', 'Default meta description', true)
ON CONFLICT (key) DO NOTHING;

-- Step 14: Record Migration
INSERT INTO migrations (filename) VALUES ('rbck_supabase_migration.sql') ON CONFLICT (filename) DO NOTHING;

-- ========================================
-- MIGRATION COMPLETE
-- ========================================