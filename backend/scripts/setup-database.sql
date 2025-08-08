-- Database setup script for Supabase
-- This ensures the posts table exists with proper structure

-- Create posts table with proper field names
CREATE TABLE IF NOT EXISTS posts (
    id BIGSERIAL PRIMARY KEY,
    
    -- Title fields (support multiple formats)
    title TEXT,
    title_th TEXT,
    title_en TEXT,
    
    slug TEXT UNIQUE,
    content TEXT,
    excerpt TEXT,
    
    -- Author and status
    author TEXT DEFAULT 'ระเบียบการช่าง',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    category TEXT DEFAULT 'general',
    
    -- Arrays
    tags TEXT[] DEFAULT '{}',
    
    -- Metrics
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    
    -- SEO fields
    meta_title TEXT,
    meta_description TEXT,
    focus_keyword TEXT,
    canonical_url TEXT,
    schema_type TEXT DEFAULT 'Article',
    
    -- Dates
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data if table is empty
INSERT INTO posts (title, title_th, slug, content, excerpt, status, tags)
SELECT 
    'เทคนิคการดูแลรักษารถเกี่ยวข้าวเบื้องต้น',
    'เทคนิคการดูแลรักษารถเกี่ยวข้าวเบื้องต้น',
    'basic-rice-harvester-maintenance-tips',
    '<h3>🌾 การดูแลรักษารถเกี่ยวข้าวอย่างถูกต้อง</h3>
     <p>รถเกี่ยวข้าวเป็นเครื่องจักรที่สำคัญสำหรับเกษตรกร การดูแลรักษาอย่างเหมาะสมจะช่วยยืดอายุการใช้งานและรักษาประสิทธิภาพ</p>
     
     <h4>🔧 ขั้นตอนการดูแลรักษา</h4>
     <ol>
         <li><strong>ทำความสะอาดหลังใช้งาน</strong><br>เก็บเศษฟาง ธุลี และสิ่งสกปรกที่ติดเครื่อง</li>
         <li><strong>ตรวจสอบน้ำมันเครื่อง</strong><br>เช็คระดับน้ำมันเครื่องก่อนการใช้งานทุกครั้ง</li>
         <li><strong>ดูแลใบมีด</strong><br>ตรวจสอบความคมของใบมีด ลับคมเมื่อจำเป็น</li>
     </ol>',
    'เรียนรู้เทคนิคการดูแลรักษารถเกี่ยวข้าวอย่างถูกต้อง ตั้งแต่การทำความสะอาด การตรวจสอบ จนถึงการเก็บรักษา เพื่อให้เครื่องใช้งานได้นานและมีประสิทธิภาพสูงสุด',
    'published',
    ARRAY['รถเกี่ยวข้าว', 'การดูแลรักษา', 'เทคนิค', 'บำรุงรักษา']
WHERE NOT EXISTS (SELECT 1 FROM posts LIMIT 1);

-- Enable Row Level Security (RLS) for better security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to published posts
CREATE POLICY "Allow public read access to published posts" ON posts
    FOR SELECT
    USING (status = 'published');

-- Create policy to allow authenticated users to manage posts (modify as needed)
CREATE POLICY "Allow authenticated users to manage posts" ON posts
    FOR ALL
    USING (true);  -- Modify this based on your authentication setup

COMMENT ON TABLE posts IS 'Blog posts table with proper field mapping for Supabase integration';