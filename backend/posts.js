// backend/posts.js
// REST API สำหรับบทความ (posts) เชื่อมต่อ Supabase
const express = require('express');
const router = express.Router();
const supabase = require('./supabaseClient');

// GET /api/posts - ดึงบทความทั้งหมด
router.get('/posts', async (req, res) => {
    const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// GET /api/posts/slug/:slug - ดึงบทความตาม slug
router.get('/posts/slug/:slug', async (req, res) => {
    const { slug } = req.params;
    const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('slug', slug)
        .single();
    if (error) return res.status(404).json({ error: error.message });
    res.json(data);
});

// GET /api/posts/:id - ดึงบทความตาม id
router.get('/posts/:id', async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();
    if (error) return res.status(404).json({ error: error.message });
    res.json(data);
});

// POST /api/posts - สร้างบทความใหม่
router.post('/posts', express.json(), async (req, res) => {
    let post = req.body;
    // Ensure tags is array (Supabase: text[])
    if (typeof post.tags === 'string') {
        post.tags = post.tags.split(',').map(t => t.trim()).filter(Boolean);
    }
    
    // Convert field names to match Supabase schema (all lowercase)
    const convertedPost = {
        titleth: post.titleTH,
        titleen: post.titleEN,
        content: post.content,
        metadescription: post.metaDescription,
        focuskeyword: post.focusKeyword,  // แปลงจาก camelCase เป็น lowercase
        category: post.category,
        tags: post.tags,
        excerpt: post.excerpt,
        author: post.author,
        metatitle: post.metaTitle,
        schematype: post.schemaType,
        status: post.status,
        slug: post.slug
    };
    
    console.log('[POST /api/posts] convertedPost:', convertedPost); // log postData ที่แปลงแล้ว
    const { data, error } = await supabase
        .from('posts')
        .insert([convertedPost])
        .select()
        .single();
    if (error) {
        console.error('[Supabase Error]', error); // log error ที่ได้จาก supabase
        return res.status(400).json({ error: error.message });
    }
    res.json(data);
});

// PUT /api/posts/:id - อัปเดตบทความ
router.put('/posts/:id', express.json(), async (req, res) => {
    const { id } = req.params;
    let post = req.body;
    // Ensure tags is array (Supabase: text[])
    if (typeof post.tags === 'string') {
        post.tags = post.tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    // Convert field names to match Supabase schema (all lowercase)
    const convertedPost = {
        titleth: post.titleTH,
        titleen: post.titleEN,
        content: post.content,
        metadescription: post.metaDescription,
        focuskeyword: post.focusKeyword,  // แปลงจาก camelCase เป็น lowercase
        category: post.category,
        tags: post.tags,
        excerpt: post.excerpt,
        author: post.author,
        metatitle: post.metaTitle,
        schematype: post.schemaType,
        status: post.status,
        slug: post.slug
    };
    
    console.log('[PUT /api/posts/:id] convertedPost:', convertedPost); // log postData ที่แปลงแล้ว
    const { data, error } = await supabase
        .from('posts')
        .update(convertedPost)
        .eq('id', id)
        .select()
        .single();
    if (error) {
        console.error('[Supabase Error]', error); // log error ที่ได้จาก supabase
        return res.status(400).json({ error: error.message });
    }
    res.json(data);
});

// DELETE /api/posts/:id - ลบบทความ
router.delete('/posts/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
});

module.exports = router;
