import { RealisticSeoAnalyzer } from './seoAnalyzer.js';
// Add this import if you want to use Gemini modal or AI logic
import { runGeminiSeoCheck } from './seoTools.js';
import { showNotification, showSection } from './uiHelpers.js'; // Add showSection for navigation
import { API_BASE } from '../config.js';

// Remove localStorage loading, fetch from backend API instead
export let posts = [];
export let currentEditingPostId = null;

const seoAnalyzer = new RealisticSeoAnalyzer();

// Helper: generate slug from title
function generateSlug(title) {
    return (title || '')
        .toLowerCase()
        .replace(/[^\wก-๙\s-]+/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

export async function loadBlogPosts() {
    try {
        const res = await fetch(`${API_BASE}/posts`);
        if (!res.ok) throw new Error('Failed to fetch posts');
        posts = await res.json();
        console.log('📋 [DEBUG] Loaded posts:', posts);
        // Debug: show structure of first post
        if (posts.length > 0) {
            console.log('📋 [DEBUG] First post structure:', posts[0]);
        }
    } catch (e) {
        console.error('❌ [DEBUG] Error loading posts:', e);
        posts = [];
        showNotification('เกิดข้อผิดพลาดในการโหลดบทความ', 'error');
    }
    const blogGrid = document.getElementById('blogManageGrid');
    if (!blogGrid) {
        console.error('❌ [DEBUG] Blog grid element not found');
        return;
    }
    if (posts.length === 0) {
        blogGrid.innerHTML = `
            <div class="error-container" style="grid-column: 1 / -1;">
                <div style="font-size: 3em;">📝</div>
                <div class="error-title">ยังไม่มีบทความ</div>
                <div class="error-message">เริ่มสร้างบทความแรกของคุณ</div>
                <button class="btn btn-gemini" onclick="showSection('blog-create')">
                    <i class="fas fa-plus"></i> สร้างบทความใหม่
                </button>
            </div>
        `;
        return;
    }    // Update post select for SEO analysis
    const postSelect = document.getElementById('postSelectForSeo');
    if (postSelect) {
        postSelect.innerHTML = `
            <option value="">เลือกบทความเพื่อวิเคราะห์</option>
            ${posts.map(post => {
                const postId = post.id || post._id || post.postId || post.slug;
                return `<option value="${postId}">${post.titleTH || post.titleth || 'ไม่มีชื่อ'}</option>`;
            }).join('')}
        `;
    }// Display posts
    blogGrid.innerHTML = posts.map(post => {
        const analysis = seoAnalyzer.analyzePost(post);
        // Debug log each post structure and ID
        console.log('🔍 [DEBUG] Rendering post:', { 
            fullPost: post, 
            id: post.id, 
            title: post.titleTH || post.titleth,
            allKeys: Object.keys(post)
        });
        
        // Try to find the correct ID field
        const postId = post.id || post._id || post.postId || post.slug;
        console.log('🆔 [DEBUG] Using post ID:', postId);
        
        return `
            <div class="blog-card">
                <div class="blog-card-header">
                    <div class="blog-card-title">${post.titleTH || post.titleth || 'ไม่มีชื่อ'}</div>
                    <div class="blog-card-meta">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span class="status-badge status-${post.status}">${post.status === 'published' ? 'เผยแพร่แล้ว' : 'ฉบับร่าง'}</span>
                            <span class="gemini-badge">🚀 ${analysis.totalScore}/100</span>
                        </div>
                        <span>${post.updated_at ? new Date(post.updated_at).toLocaleDateString('th-TH') : ''}</span>
                    </div>
                </div>
                <div class="blog-card-body">
                    <div class="blog-card-excerpt">${post.excerpt || 'ไม่มีบทคัดย่อ'}</div>
                    <div style="margin: 10px 0; font-size: 0.85em; color: #6c757d;">
                        <i class="fas fa-user"></i> ${post.author} | 
                        <i class="fas fa-folder"></i> ${post.category || 'ไม่ระบุ'} |
                        <span style="color: ${analysis.grade.color}">
                            <i class="fas fa-chart-line"></i> Grade ${analysis.grade.grade}
                        </span>
                    </div>
                    <div class="blog-card-actions">
                        <button class="btn btn-primary" onclick="editPost('${postId}')">
                            <i class="fas fa-edit"></i> แก้ไข
                        </button>
                        <button class="btn btn-gemini" onclick="processAISuggestions('${postId}')">
                            <i class="fas fa-robot"></i> Flash AI
                        </button>
                        <button class="btn btn-secondary" onclick="previewPost('${postId}')">
                            <i class="fas fa-eye"></i> ดูตัวอย่าง
                        </button>
                        <button class="btn btn-danger" onclick="deletePost('${postId}')">
                            <i class="fas fa-trash"></i> ลบ
                        </button>
                        ${post.status !== 'published' ? `<button class="btn btn-success" onclick="publishPost('${postId}')"><i class="fas fa-upload"></i> เผยแพร่</button>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    console.log('✅ [DEBUG] Blog posts loaded successfully');
}

function getInputValue(id) {
    const el = document.getElementById(id);
    if (!el) {
        showNotification(`ไม่พบ input: ${id}`, 'error');
        throw new Error(`Element not found: ${id}`);
    }
    return el.value;
}
function getContentValue(id) {
    const el = document.getElementById(id);
    if (!el) {
        showNotification(`ไม่พบ content: ${id}`, 'error');
        throw new Error(`Element not found: ${id}`);
    }
    return el.innerHTML;
}

export async function savePost() {
    console.log('💾 [DEBUG] Saving post...');
    try {
        let slug = getInputValue('postSlug').trim();
        if (!slug) {
            slug = generateSlug(getInputValue('postTitleTH'));
        }
        let tags = getInputValue('postTags');
        if (typeof tags === 'string') {
            tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        }
        const postData = {
            titleTH: getInputValue('postTitleTH'),
            titleEN: getInputValue('postTitleEN'),
            slug,
            content: getContentValue('postContent'),
            excerpt: getInputValue('postExcerpt'),
            category: getInputValue('postCategory'),
            tags,
            author: getInputValue('postAuthor') || 'ระเบียบการช่าง',
            metaTitle: getInputValue('metaTitle'),
            metaDescription: getInputValue('metaDescription'),
            focuskeyword: getInputValue('focusKeyword'), // ใช้ตัวเล็ก
            schemaType: getInputValue('schemaType'),
            status: 'draft',
        };
        if (!postData.titleTH || !postData.excerpt) {
            showNotification('กรุณากรอกชื่อบทความและบทคัดย่อ', 'error');
            return;
        }
        let res, savedPost;
        if (currentEditingPostId) {
            postData.id = currentEditingPostId;
            res = await fetch(`${API_BASE}/posts/${currentEditingPostId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData)
            });
        } else {
            res = await fetch(`${API_BASE}/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData)
            });
        }
        if (!res.ok) throw new Error('Failed to save post');
        savedPost = await res.json();
        currentEditingPostId = savedPost.id;
        // Refresh posts from backend
        await loadBlogPosts();
        // Run SEO analysis
        const analysis = seoAnalyzer.analyzePost(savedPost);
        document.getElementById('createEditTitle').textContent = 'แก้ไขบทความ';
        showNotification(`✅ บันทึกเรียบร้อย! Flash AI Score: ${analysis.totalScore}/100`, 'success');
        return true;
    } catch (error) {
        console.error('❌ [DEBUG] Error saving post:', error);
        showNotification('เกิดข้อผิดพลาดในการบันทึก', 'error');
        return false;
    }
}

export async function editPost(id) {
    console.log('✏️ [DEBUG] Editing post with ID:', id);
    try {
        const res = await fetch(`${API_BASE}/posts/${id}`);
        if (!res.ok) throw new Error('ไม่พบบทความ');
        const post = await res.json();
        
        currentEditingPostId = id;
        document.getElementById('postTitleTH').value = post.titleTH || post.titleth || '';
        document.getElementById('postTitleEN').value = post.titleEN || post.titleen || '';
        document.getElementById('postSlug').value = post.slug || '';
        document.getElementById('postContent').innerHTML = post.content || '';
        document.getElementById('postExcerpt').value = post.excerpt || '';
        document.getElementById('postCategory').value = post.category || '';
        document.getElementById('postTags').value = (post.tags || []).join(', ');
        document.getElementById('postAuthor').value = post.author || '';
        document.getElementById('metaTitle').value = post.metaTitle || post.metatitle || '';
        document.getElementById('metaDescription').value = post.metaDescription || post.metadescription || '';
        document.getElementById('focusKeyword').value = post.focusKeyword || post.focuskeyword || '';
        document.getElementById('schemaType').value = post.schemaType || post.schematype || 'Article';
        document.getElementById('createEditTitle').textContent = 'แก้ไขบทความ';
        showSection('blog-create');
    } catch (e) {
        showNotification('ไม่พบบทความที่ต้องการแก้ไข', 'error');
    }
}

export function previewPost(id) {
    console.log('👁️ [DEBUG] Previewing post with ID:', id);
    const post = posts.find(p => (p.id || p._id || p.postId || p.slug) === id);
    if (!post) {
        showNotification('ไม่พบบทความสำหรับดูตัวอย่าง', 'error');
        return;
    }
    // Use clean URL structure as confirmed in backend
    window.open(`/blog/${encodeURIComponent(post.slug)}`, '_blank');
}

export async function deletePost(id) {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบบทความนี้?')) return;
    try {
        const res = await fetch(`${API_BASE}/posts/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete');
        showNotification('🗑️ ลบบทความเรียบร้อย', 'success');
        await loadBlogPosts();
    } catch (e) {
        showNotification('เกิดข้อผิดพลาดในการลบ', 'error');
    }
}

// ฟังก์ชันสำหรับ publish post
export async function publishPost(id) {
    console.log('🚀 [DEBUG] Publishing post with ID:', id);
    if (!id || id === 'undefined') {
        showNotification('ไม่พบ ID ของบทความ', 'error');
        return;
    }
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการเผยแพร่บทความนี้?')) return;
    try {
        // ดึงโพสต์เดิมมาก่อน
        const resGet = await fetch(`${API_BASE}/posts/${id}`);
        if (!resGet.ok) throw new Error('ไม่พบบทความ');
        const post = await resGet.json();
        // อัปเดต status เป็น published
        const updated = { ...post, status: 'published' };
        const res = await fetch(`${API_BASE}/posts/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
        });
        if (!res.ok) throw new Error('Failed to publish');
        showNotification('✅ เผยแพร่บทความเรียบร้อย', 'success');
        await loadBlogPosts();
    } catch (e) {
        console.error('❌ [DEBUG] Error publishing post:', e);
        showNotification('เกิดข้อผิดพลาดในการเผยแพร่', 'error');
    }
}

// Example: set the post in the select and run Gemini SEO check
export function processAISuggestions(postId) {
    console.log('🤖 [DEBUG] Processing AI suggestions for post ID:', postId);
    const select = document.getElementById('postSelectForSeo');
    if (select) {
        select.value = postId;
        // ดึงโพสต์ที่เลือกมา
        const post = posts.find(p => (p.id || p._id || p.postId || p.slug) === postId);
        if (!post) {
            showNotification('ไม่พบบทความสำหรับวิเคราะห์', 'error');
            return;
        }
        // สร้าง analysis แบบย่อ (ลดขนาด prompt)
        const analysis = seoAnalyzer.analyzePost(post);
        // สร้าง prompt แบบสั้น (เฉพาะ title, excerpt, focuskeyword)
        const safePrompt = `กรุณาวิเคราะห์ SEO สำหรับบทความนี้:\n- ชื่อบทความ: ${post.titleTH || ''}\n- Focus Keyword: ${post.focuskeyword || ''}\n- บทคัดย่อ: ${post.excerpt || ''}`;
        console.log('Prompt for Gemini:', safePrompt); // log prompt ที่ส่งไป
        // เรียก Gemini ด้วย prompt สั้น (ผ่าน runGeminiSeoCheck หรือ Gemini20FlashEngine โดยตรง)
        if (typeof window.Gemini20FlashEngine === 'function') {
            const engine = new window.Gemini20FlashEngine({ apiKey: window.geminiApiKey });
            engine.callGeminiAPI(safePrompt)
                .then(result => {
                    showNotification('AI วิเคราะห์ SEO สำเร็จ', 'success');
                    // สามารถนำ result ไปแสดงผลต่อได้
                })
                .catch(err => {
                    showNotification('AI วิเคราะห์ SEO ไม่สำเร็จ', 'error');
                });
        } else {
            runGeminiSeoCheck(); // fallback เดิม
        }
    } else {
        if (typeof showNotification === 'function') {
            showNotification('ไม่พบเครื่องมือวิเคราะห์ SEO', 'error');
        }
    }
}