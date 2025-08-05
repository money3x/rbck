// Advanced CMS Dashboard JavaScript
// Supporting SEO and SGE optimization

class CMSDashboard {
    constructor() {
        this.currentSection = 'dashboard';
        this.posts = [];
        this.stats = {};
        this.editingPostId = null;
        
        // Gemini 2.0 Flash Engine Integration
        this.geminiEngine = null;
        this.geminiStatus = { isConnected: false, lastCheck: null };
        
        this.init();
    }    async init() {
        this.setupEventListeners();
        this.setupRichEditor();
        await this.loadDashboardData();
        await this.initializeGeminiEngine();
        this.showSection('dashboard');
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.cms-sidebar nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('href').substring(1);
                this.showSection(section);
            });
        });

        // Modal controls
        document.querySelector('.close-btn')?.addEventListener('click', () => {
            this.closeEditor();
        });

        // Search and filters
        document.getElementById('searchPosts')?.addEventListener('input', (e) => {
            this.filterPosts();
        });

        document.getElementById('statusFilter')?.addEventListener('change', (e) => {
            this.filterPosts();
        });

        // Form submissions
        document.getElementById('postForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePost();
        });

        // Character counting for meta description
        document.getElementById('metaDescription')?.addEventListener('input', (e) => {
            this.updateCharCount(e.target);
        });

        // Real-time SEO analysis
        document.getElementById('titleTH')?.addEventListener('input', () => {
            this.realTimeSEOAnalysis();
        });

        document.getElementById('contentEditor')?.addEventListener('input', () => {
            this.realTimeSEOAnalysis();
        });
    }

    setupRichEditor() {
        // Initialize rich text editor (you can use Quill, TinyMCE, or similar)
        const editor = document.getElementById('contentEditor');
        if (editor) {
            // Placeholder for rich editor initialization
            editor.contentEditable = true;
            editor.style.minHeight = '300px';
            editor.style.border = '1px solid #dee2e6';
            editor.style.padding = '1rem';
            editor.style.borderRadius = '6px';
        }
    }

    async loadDashboardData() {
        try {
            this.showLoading();
            
            const response = await fetch('/api/posts');
            const data = await response.json();
            
            if (data.success) {
                this.posts = data.data || data.posts || []; // Handle both response formats
                this.stats = data.stats || { total: this.posts.length };
                this.updateDashboard();
                this.renderPosts();
            } else {
                this.showError('ไม่สามารถโหลดข้อมูลได้');
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        } finally {
            this.hideLoading();
        }
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.cms-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Update navigation
        document.querySelectorAll('.cms-sidebar nav a').forEach(link => {
            link.classList.remove('active');
        });

        const activeLink = document.querySelector(`.cms-sidebar nav a[href="#${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        this.currentSection = sectionId;        // Load section-specific data
        switch (sectionId) {
            case 'posts':
                this.renderPosts();
                break;
            case 'seo':
            case 'seo-tools':
                this.loadSEOTools();
                break;
            case 'sge':
                this.loadSGETools();
                break;
        }
    }

    updateDashboard() {
        // Update statistics
        document.getElementById('totalPosts').textContent = this.stats.total || 0;
        document.getElementById('avgSEOScore').textContent = this.stats.avgSEOScore || 0;
        document.getElementById('sgeReady').textContent = `${this.stats.sgeReady || 0}%`;
        document.getElementById('totalViews').textContent = '0'; // Placeholder

        // Update recent posts
        this.renderRecentPosts();
    }

    renderRecentPosts() {
        const container = document.getElementById('recentPostsList');
        if (!container) return;

        const recentPosts = this.posts.slice(0, 5);
        
        container.innerHTML = recentPosts.map(post => `
            <div class="recent-post-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border-bottom: 1px solid #dee2e6;">
                <div>
                    <h4 style="margin: 0; font-size: 0.9rem; color: var(--primary-color);">${post.titleth}</h4>
                    <small style="color: #6c757d;">${new Date(post.updated_at).toLocaleDateString('th-TH')}</small>
                </div>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <span class="score-indicator score-${this.getScoreClass(post.seoScore)}">
                        <span class="score-circle ${this.getScoreClass(post.seoScore)}">${post.seoScore}</span>
                        SEO
                    </span>
                    <span class="status-badge status-${post.status}">${this.getStatusText(post.status)}</span>
                </div>
            </div>
        `).join('');
    }

    renderPosts() {
        const container = document.getElementById('postsList');
        if (!container) return;

        const filteredPosts = this.getFilteredPosts();

        container.innerHTML = filteredPosts.map(post => `
            <div class="post-card">
                <div class="post-card-header">
                    <div class="post-card-title">${post.titleth}</div>
                    <div class="post-card-meta">
                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                            <span class="status-badge status-${post.status}">${this.getStatusText(post.status)}</span>
                            <span class="score-indicator score-${this.getScoreClass(post.seoScore)}">
                                <span class="score-circle ${this.getScoreClass(post.seoScore)}">${post.seoScore}</span>
                            </span>
                        </div>
                        <span>${new Date(post.updated_at).toLocaleDateString('th-TH')}</span>
                    </div>
                </div>
                <div class="post-card-body">
                    <div class="post-excerpt">${post.excerpt || 'ไม่มีสรุปย่อ'}</div>
                    <div class="post-actions">
                        <button class="edit-btn" onclick="cmsApp.editPost('${post.id}')">แก้ไข</button>
                        <button class="delete-btn" onclick="cmsApp.deletePost('${post.id}')">ลบ</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    getFilteredPosts() {
        let filtered = [...this.posts];

        // Filter by status
        const statusFilter = document.getElementById('statusFilter')?.value;
        if (statusFilter) {
            filtered = filtered.filter(post => post.status === statusFilter);
        }

        // Filter by search
        const searchTerm = document.getElementById('searchPosts')?.value.toLowerCase();
        if (searchTerm) {
            filtered = filtered.filter(post => 
                post.titleth.toLowerCase().includes(searchTerm) ||
                (post.excerpt && post.excerpt.toLowerCase().includes(searchTerm))
            );
        }

        return filtered;
    }

    filterPosts() {
        this.renderPosts();
    }

    createNewPost() {
        this.editingPostId = null;
        this.resetForm();
        document.getElementById('editorTitle').textContent = 'สร้างบทความใหม่';
        document.getElementById('postEditor').style.display = 'block';
    }

    editPost(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (!post) return;

        this.editingPostId = postId;
        this.populateForm(post);
        document.getElementById('editorTitle').textContent = 'แก้ไขบทความ';
        document.getElementById('postEditor').style.display = 'block';
    }

    async deletePost(postId) {
        if (!confirm('คุณแน่ใจหรือไม่ที่จะลบบทความนี้?')) return;

        try {
            const response = await fetch(`/cms/api/posts/${postId}`, {
                method: 'DELETE'
            });

            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('ลบบทความเรียบร้อยแล้ว');
                await this.loadDashboardData();
            } else {
                this.showError('ไม่สามารถลบบทความได้');
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            this.showError('เกิดข้อผิดพลาดในการลบบทความ');
        }
    }

    closeEditor() {
        document.getElementById('postEditor').style.display = 'none';
        this.editingPostId = null;
        this.resetForm();
    }

    resetForm() {
        document.getElementById('postForm').reset();
        document.getElementById('contentEditor').innerHTML = '';
        this.updateCharCount(document.getElementById('metaDescription'));
    }

    populateForm(post) {
        document.getElementById('titleTH').value = post.titleth || '';
        document.getElementById('titleEN').value = post.titleen || '';
        document.getElementById('excerpt').value = post.excerpt || '';
        document.getElementById('contentEditor').innerHTML = post.content || '';
        document.getElementById('tags').value = post.tags ? post.tags.join(', ') : '';
        document.getElementById('status').value = post.status || 'draft';
        
        // SEO fields
        document.getElementById('metaDescription').value = post.meta_description || '';
        document.getElementById('focusKeyword').value = post.focus_keyword || '';
        document.getElementById('canonicalUrl').value = post.canonical_url || '';
        
        // SGE fields
        document.getElementById('mainQuestion').value = post.main_question || '';
        document.getElementById('quickAnswer').value = post.quick_answer || '';
        document.getElementById('relatedEntities').value = post.related_entities ? post.related_entities.join(', ') : '';

        this.updateCharCount(document.getElementById('metaDescription'));
    }

    async savePost() {
        try {
            const formData = this.collectFormData();
            
            const url = this.editingPostId 
                ? `/cms/api/posts/${this.editingPostId}`
                : '/cms/api/posts';
            
            const method = this.editingPostId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            
            if (data.success) {
                this.showSuccess(this.editingPostId ? 'อัปเดตบทความเรียบร้อยแล้ว' : 'สร้างบทความเรียบร้อยแล้ว');
                this.closeEditor();
                await this.loadDashboardData();
            } else {
                this.showError('ไม่สามารถบันทึกบทความได้');
            }
        } catch (error) {
            console.error('Error saving post:', error);
            this.showError('เกิดข้อผิดพลาดในการบันทึกบทความ');
        }
    }    collectFormData() {
        return {
            titleth: document.getElementById('titleTH')?.value || '',
            titleen: document.getElementById('titleEN')?.value || '',
            excerpt: document.getElementById('excerpt')?.value || '',
            content: document.getElementById('contentEditor')?.innerHTML || '',
            tags: document.getElementById('tags')?.value.split(',').map(tag => tag.trim()).filter(tag => tag) || [],
            status: document.getElementById('status')?.value || 'draft',
            
            // SEO fields
            meta_description: document.getElementById('metaDescription')?.value || '',
            focus_keyword: document.getElementById('focusKeyword')?.value || '',
            canonical_url: document.getElementById('canonicalUrl')?.value || '',
            
            // SGE fields
            main_question: document.getElementById('mainQuestion')?.value || '',
            quick_answer: document.getElementById('quickAnswer')?.value || '',
            related_entities: document.getElementById('relatedEntities')?.value.split(',').map(entity => entity.trim()).filter(entity => entity) || []
        };
    }

    saveDraft() {
        document.getElementById('status').value = 'draft';
        this.savePost();
    }

    saveAndPublish() {
        document.getElementById('status').value = 'published';
        this.savePost();
    }

    async enhanceWithAI() {
        try {
            this.showLoading('กำลังปรับปรุงด้วย AI...');
            
            const content = this.collectFormData();
            
            const response = await fetch('/cms/api/ai-enhance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content })
            });

            const data = await response.json();
            
            if (data.success) {
                this.applyAIEnhancements(data.enhancements);
                this.showSuccess('ปรับปรุงด้วย AI เรียบร้อยแล้ว');
            } else {
                this.showError('ไม่สามารถปรับปรุงด้วย AI ได้');
            }
        } catch (error) {
            console.error('Error enhancing with AI:', error);
            this.showError('เกิดข้อผิดพลาดในการปรับปรุงด้วย AI');
        } finally {
            this.hideLoading();
        }
    }

    applyAIEnhancements(enhancements) {
        if (enhancements.metaDescription) {
            document.getElementById('metaDescription').value = enhancements.metaDescription;
        }
        
        if (enhancements.suggestedTags) {
            const currentTags = document.getElementById('tags').value;
            const newTags = currentTags ? currentTags + ', ' + enhancements.suggestedTags.join(', ') : enhancements.suggestedTags.join(', ');
            document.getElementById('tags').value = newTags;
        }
        
        if (enhancements.mainQuestion) {
            document.getElementById('mainQuestion').value = enhancements.mainQuestion;
        }
        
        if (enhancements.quickAnswer) {
            document.getElementById('quickAnswer').value = enhancements.quickAnswer;
        }
    }

    updateCharCount(element) {
        if (!element) return;
        
        const charCount = element.value.length;
        const maxLength = element.getAttribute('maxlength') || 160;
        const counter = element.parentNode.querySelector('.char-count');
        
        if (counter) {
            counter.textContent = `${charCount}/${maxLength} ตัวอักษร`;
            
            if (charCount > maxLength * 0.9) {
                counter.style.color = '#dc3545';
            } else if (charCount > maxLength * 0.7) {
                counter.style.color = '#ffc107';
            } else {
                counter.style.color = '#6c757d';
            }
        }
    }

    async realTimeSEOAnalysis() {
        // Debounce the analysis
        clearTimeout(this.seoTimeout);
        this.seoTimeout = setTimeout(async () => {
            const content = this.collectFormData();
            
            try {
                const response = await fetch('/cms/api/seo-analyze', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ content })
                });

                const data = await response.json();
                
                if (data.success) {
                    this.displaySEOAnalysis(data.analysis);
                }
            } catch (error) {
                console.error('Error in real-time SEO analysis:', error);
            }
        }, 1000);
    }

    displaySEOAnalysis(analysis) {
        // Create or update SEO analysis panel
        let panel = document.getElementById('seoAnalysisPanel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'seoAnalysisPanel';
            panel.style.cssText = 'position: fixed; top: 100px; right: 20px; width: 300px; background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1500;';
            document.body.appendChild(panel);
        }

        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h4 style="margin: 0; color: var(--primary-color);">📊 SEO Analysis</h4>
                <button onclick="document.getElementById('seoAnalysisPanel').style.display='none'" style="background: none; border: none; font-size: 1.2rem; cursor: pointer;">&times;</button>
            </div>
            
            <div style="margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>SEO Score:</span>
                    <span class="score-indicator score-${this.getScoreClass(analysis.seoScore)}">
                        <span class="score-circle ${this.getScoreClass(analysis.seoScore)}">${analysis.seoScore}</span>
                    </span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
                    <span>SGE Ready:</span>
                    <span class="score-indicator score-${this.getScoreClass(analysis.sgeScore)}">
                        <span class="score-circle ${this.getScoreClass(analysis.sgeScore)}">${analysis.sgeScore}</span>
                    </span>
                </div>
            </div>
            
            ${analysis.recommendations.length > 0 ? `
                <div>
                    <h5 style="margin: 0 0 0.5rem 0; color: var(--dark-color);">📝 คำแนะนำ:</h5>
                    <ul style="margin: 0; padding-left: 1.2rem; font-size: 0.85rem;">
                        ${analysis.recommendations.map(rec => `<li style="margin-bottom: 0.25rem; color: #6c757d;">${rec.message}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        `;
    }    loadSEOTools() {
        // Load SEO tools section
        console.log('Loading SEO tools...');
        this.populateSEOArticleSelect();
    }

    loadSGETools() {
        // Load SGE tools section
        console.log('Loading SGE tools...');
    }    // Flash SEO Analysis for selected article
    async flashSEOAnalysis() {
        const selectElement = document.getElementById('postSelectForSeo');
        const selectedPostId = selectElement ? selectElement.value : null;
        
        if (!selectedPostId) {
            this.showError('❌ กรุณาเลือกบทความที่ต้องการวิเคราะห์');
            return;
        }

        const selectedPost = this.posts.find(post => post.id == selectedPostId);
        if (!selectedPost) {
            this.showError('❌ ไม่พบบทความที่เลือก');
            return;
        }

        this.showLoading('🚀 Flash AI กำลังวิเคราะห์ SEO...');

        try {
            let analysisResult = null;

            // Try to get real AI analysis if connected
            if (this.geminiStatus.isConnected) {
                const prompt = `
                ในฐานะ SEO Expert โปรดวิเคราะห์บทความนี้อย่างละเอียด:

                หัวข้อ: "${selectedPost.titleth || selectedPost.title}"
                เนื้อหา: "${(selectedPost.content || '').replace(/<[^>]*>/g, ' ').substring(0, 1000)}..."
                Meta Description: "${selectedPost.meta_description || ''}"
                Focus Keyword: "${selectedPost.focus_keyword || ''}"

                โปรดวิเคราะห์:
                1. คะแนน SEO โดยรวม (0-100)
                2. จุดที่ต้องปรับปรุง
                3. ข้อเสนอแนะเฉพาะ
                4. คำหลักที่แนะนำ
                5. การปรับปรุง Meta Tags

                ตอบในรูปแบบ JSON:
                {
                    "seoScore": 85,
                    "improvements": [
                        {
                            "type": "Title",
                            "issue": "หัวข้อสั้นเกินไป",
                            "current": "หัวข้อปัจจุบัน",
                            "suggested": "หัวข้อที่แนะนำ",
                            "reason": "เหตุผล"
                        }
                    ],
                    "contentSuggestions": ["แนะนำเนื้อหาที่ควรเพิ่ม"],
                    "technicalSEO": ["การปรับปรุงด้านเทคนิค"],
                    "keywords": ["คำหลักแนะนำ"],
                    "summary": "สรุปผลการวิเคราะห์"
                }
                `;

                const response = await this.callGeminiAPI(prompt);
                
                if (response.success && response.content) {
                    try {
                        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            analysisResult = JSON.parse(jsonMatch[0]);
                        }
                    } catch (parseError) {
                        console.error('Error parsing SEO analysis:', parseError);
                    }
                }
            }

            // Fallback analysis if AI fails
            if (!analysisResult) {
                analysisResult = this.generateFallbackSEOAnalysis(selectedPost);
            }

            // Display results
            this.displaySEOAnalysisResults(analysisResult, selectedPost);
            this.showSuccess('✅ Flash SEO Analysis เสร็จสิ้น');
            
        } catch (error) {
            console.error('Error in Flash SEO analysis:', error);
            this.showError('❌ เกิดข้อผิดพลาดในการวิเคราะห์');
        } finally {
            this.hideLoading();
        }
    }

    // Generate fallback SEO analysis
    generateFallbackSEOAnalysis(post) {
        const title = post.titleth || post.title || '';
        const content = post.content || '';
        const metaDesc = post.meta_description || '';
        
        let score = 50; // Base score
        const improvements = [];
        
        // Check title length
        if (title.length < 30) {
            improvements.push({
                type: "Title",
                issue: "หัวข้อสั้นเกินไป",
                current: title,
                suggested: title + " - เพิ่มคำอธิบายเพิ่มเติม",
                reason: "หัวข้อควรมีความยาว 30-60 ตัวอักษร"
            });
        } else {
            score += 10;
        }

        // Check meta description
        if (!metaDesc) {
            improvements.push({
                type: "Meta Description",
                issue: "ไม่มี Meta Description",
                current: "ไม่มี",
                suggested: "เพิ่ม Meta Description 150-160 ตัวอักษร",
                reason: "Meta Description ช่วยให้ Google เข้าใจเนื้อหา"
            });
        } else {
            score += 15;
        }

        // Check content length
        if (content.length < 500) {
            improvements.push({
                type: "Content",
                issue: "เนื้อหาสั้นเกินไป",
                current: `${content.length} ตัวอักษร`,
                suggested: "เพิ่มเนื้อหาให้มากกว่า 500 คำ",
                reason: "เนื้อหาที่ยาวกว่าจะได้รับการจัดอันดับที่ดีกว่า"
            });
        } else {
            score += 20;
        }

        return {
            seoScore: Math.min(score, 100),
            improvements: improvements,
            contentSuggestions: [
                "เพิ่มหัวข้อย่อย (H2, H3) เพื่อโครงสร้างที่ดีขึ้น",
                "เพิ่มรูปภาพพร้อม Alt text",
                "เพิ่มลิงก์ภายในไปยังบทความอื่น",
                "เพิ่มข้อมูลการติดต่อหรือแหล่งอ้างอิง"
            ],
            technicalSEO: [
                "ตรวจสอบความเร็วในการโหลดหน้า",
                "เพิ่ม Schema Markup",
                "ปรับปรุงการแสดงผลบนมือถือ",
                "เพิ่ม Social Media Meta Tags"
            ],
            keywords: [
                post.focus_keyword || "คำหลักหลัก",
                `${title.split(' ')[0]} คืออะไร`,
                `วิธี${title.split(' ')[0]}`,
                `${title.split(' ')[0]} ดีไหม`
            ],
            summary: `บทความนี้มีคะแนน SEO ${Math.min(score, 100)} คะแนน ควรปรับปรุงในด้าน ${improvements.map(imp => imp.type).join(', ')}`
        };
    }

    // Display SEO analysis results
    displaySEOAnalysisResults(results, post) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 900px;">
                <div class="modal-header">
                    <h3><i class="fas fa-chart-line"></i> 🚀 Flash SEO Analysis: ${post.titleth || post.title}</h3>
                    <button onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div style="display: inline-block; position: relative;">
                            <canvas id="seoScoreChart" width="120" height="120"></canvas>
                            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 24px; font-weight: bold; color: ${this.getScoreColor(results.seoScore)};">
                                ${results.seoScore}
                            </div>
                        </div>
                        <h4 style="margin-top: 10px;">SEO Score: ${results.seoScore}/100</h4>
                    </div>

                    ${results.improvements && results.improvements.length > 0 ? `
                        <div style="margin: 20px 0;">
                            <h4>🔧 จุดที่ต้องปรับปรุง:</h4>
                            <div class="improvements-list">
                                ${results.improvements.map(imp => `
                                    <div style="background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #ffc107;">
                                        <h5 style="color: #495057; margin: 0 0 8px 0;">
                                            <i class="fas fa-exclamation-triangle" style="color: #ffc107;"></i> ${imp.type}
                                        </h5>
                                        <p style="margin: 5px 0; color: #6c757d;"><strong>ปัญหา:</strong> ${imp.issue}</p>
                                        <p style="margin: 5px 0; color: #dc3545;"><strong>ปัจจุบัน:</strong> ${imp.current}</p>
                                        <p style="margin: 5px 0; color: #28a745;"><strong>แนะนำ:</strong> ${imp.suggested}</p>
                                        <p style="margin: 5px 0; color: #17a2b8; font-size: 14px;"><strong>เหตุผล:</strong> ${imp.reason}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
                        ${results.contentSuggestions && results.contentSuggestions.length > 0 ? `
                            <div>
                                <h4>📝 เนื้อหาที่ควรเพิ่ม:</h4>
                                <ul style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 0;">
                                    ${results.contentSuggestions.map(suggestion => `<li style="margin: 5px 0;">${suggestion}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}

                        ${results.technicalSEO && results.technicalSEO.length > 0 ? `
                            <div>
                                <h4>⚙️ Technical SEO:</h4>
                                <ul style="background: #e8f4fd; padding: 15px; border-radius: 8px; margin: 0;">
                                    ${results.technicalSEO.map(tech => `<li style="margin: 5px 0;">${tech}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>

                    ${results.keywords && results.keywords.length > 0 ? `
                        <div style="margin: 20px 0;">
                            <h4>🎯 คำหลักที่แนะนำ:</h4>
                            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;">
                                ${results.keywords.map(keyword => `
                                    <span style="background: #007bff; color: white; padding: 4px 8px; border-radius: 4px; font-size: 14px;">${keyword}</span>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${results.summary ? `
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
                            <h4 style="color: #007bff; margin: 0 0 8px 0;">📊 สรุปผลการวิเคราะห์:</h4>
                            <p style="margin: 0; color: #495057;">${results.summary}</p>
                        </div>
                    ` : ''}
                </div>
                <div style="padding: 15px; border-top: 1px solid #dee2e6; text-align: right;">
                    <button onclick="this.closest('.modal').remove()" style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">ปิด</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Draw score chart after modal is added to DOM
        setTimeout(() => this.drawScoreChart(results.seoScore), 100);
    }

    // Draw circular score chart
    drawScoreChart(score) {
        const canvas = document.getElementById('seoScoreChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const centerX = 60;
        const centerY = 60;
        const radius = 45;
        
        // Clear canvas
        ctx.clearRect(0, 0, 120, 120);
        
        // Background circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = '#e9ecef';
        ctx.lineWidth = 8;
        ctx.stroke();
        
        // Score arc
        const startAngle = -Math.PI / 2; // Start from top
        const endAngle = startAngle + (score / 100) * 2 * Math.PI;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.strokeStyle = this.getScoreColor(score);
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.stroke();
    }

    // Get color based on score
    getScoreColor(score) {
        if (score >= 80) return '#28a745'; // Green
        if (score >= 60) return '#ffc107'; // Yellow
        if (score >= 40) return '#fd7e14'; // Orange
        return '#dc3545'; // Red
    }

    // Utility methods
    getScoreClass(score) {
        if (score >= 80) return 'high';
        if (score >= 60) return 'medium';
        return 'low';
    }

    getStatusText(status) {
        const statusMap = {
            'published': 'เผยแพร่แล้ว',
            'draft': 'ฉบับร่าง',
            'archived': 'เก็บถาวร'
        };
        return statusMap[status] || status;
    }

    showLoading(message = 'กำลังโหลด...') {
        const loading = document.createElement('div');
        loading.id = 'loadingOverlay';
        loading.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; color: white; font-size: 1.2rem;';
        loading.innerHTML = `<div>${message} <div class="loading"></div></div>`;
        document.body.appendChild(loading);
    }

    hideLoading() {
        const loading = document.getElementById('loadingOverlay');
        if (loading) {
            loading.remove();
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; 
            padding: 1rem 1.5rem; border-radius: 6px; 
            color: white; font-weight: 600; z-index: 9999;
            transform: translateX(100%); transition: transform 0.3s ease;
        `;
        
        switch (type) {
            case 'success':
                notification.style.background = '#28a745';
                break;
            case 'error':
                notification.style.background = '#dc3545';
                break;
            default:
                notification.style.background = '#17a2b8';
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
          // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // ===== GEMINI 2.0 FLASH ENGINE INTEGRATION =====
    
    // Initialize Gemini 2.0 Flash Engine
    async initializeGeminiEngine() {
        try {
            let apiKey = '';
            try {
                // Adjust API endpoint based on your backend structure
                const resKey = await fetch('/api/apikey');
                if (resKey.ok) {
                    const data = await resKey.json();
                    apiKey = data.geminiApiKey || '';
                }
            } catch (error) {
                console.error('Error fetching API key:', error);
            }

            if (!apiKey) {
                this.geminiStatus = { isConnected: false, lastCheck: new Date(), error: 'API key not configured' };
                this.updateGeminiStatus();
                return false;
            }

            // Test Gemini connection
            const testResponse = await this.testGeminiConnection(apiKey);
            
            this.geminiStatus = {
                isConnected: testResponse.success,
                lastCheck: new Date(),
                error: testResponse.success ? null : testResponse.error,
                model: 'gemini-2.0-flash'
            };

            this.updateGeminiStatus();
            return testResponse.success;
            
        } catch (error) {
            console.error('Error initializing Gemini engine:', error);
            this.geminiStatus = { 
                isConnected: false, 
                lastCheck: new Date(), 
                error: error.message || 'Unknown error'
            };
            this.updateGeminiStatus();
            return false;
        }
    }

    // Test Gemini API connection
    async testGeminiConnection(apiKey) {
        try {
            const url = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=' + encodeURIComponent(apiKey);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: 'Hello, are you working?' }] }],
                    generationConfig: {
                        temperature: 0.3,
                        maxOutputTokens: 100
                    }
                })
            });

            if (response.ok) {
                const data = await response.json();
                const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                return { success: true, content };
            } else {
                return { success: false, error: `API Error: ${response.status}` };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Update Gemini status in UI
    updateGeminiStatus() {
        const statusElement = document.getElementById('gemini-status');
        const statusDot = document.getElementById('gemini-status-dot');
        const statusText = document.getElementById('gemini-status-text');
        const statusTime = document.getElementById('gemini-status-time');

        if (statusElement) {
            if (this.geminiStatus.isConnected) {
                statusElement.className = 'engine-status connected';
                if (statusDot) statusDot.className = 'status-dot connected';
                if (statusText) statusText.textContent = `Connected - ${this.geminiStatus.model}`;
            } else {
                statusElement.className = 'engine-status disconnected';
                if (statusDot) statusDot.className = 'status-dot disconnected';
                if (statusText) statusText.textContent = this.geminiStatus.error || 'Disconnected';
            }
            
            if (statusTime && this.geminiStatus.lastCheck) {
                statusTime.textContent = `Last check: ${this.geminiStatus.lastCheck.toLocaleTimeString()}`;
            }
        }
    }

    // Auto-generate Flash content with AI
    async autoGenerateFlashContent(sourceText, contentType = 'blog') {
        if (!this.geminiStatus.isConnected) {
            await this.initializeGeminiEngine();
            if (!this.geminiStatus.isConnected) {
                return this.autoGenerateFlashContentFallback(sourceText, contentType);
            }
        }

        try {
            const prompt = `
            ในฐานะ AI Content Specialist สำหรับ ระเบียบการช่าง โปรดสร้างเนื้อหาที่มีคุณภาพสูงจากข้อมูลต้นฉบับนี้:

            ข้อมูลต้นฉบับ: "${sourceText}"
            ประเภทเนื้อหา: ${contentType}

            โปรดสร้าง:
            1. หัวข้อภาษาไทย (น่าสนใจและเป็น SEO-friendly)
            2. หัวข้อภาษาอังกฤษ (สำหรับ URL slug)
            3. Meta Description (ไม่เกิน 160 ตัวอักษร)
            4. เนื้อหาหลัก (ประมาณ 500-800 คำ)
            5. Tags ที่เกี่ยวข้อง (5-10 tags)

            ส่งผลลัพธ์ในรูปแบบ JSON:
            {
                "titleTH": "หัวข้อภาษาไทย",
                "titleEN": "English Title",
                "metaDescription": "Meta Description",
                "content": "เนื้อหาหลักในรูปแบบ HTML",
                "tags": ["tag1", "tag2", "tag3"],
                "summary": "สรุปสั้นๆ"
            }

            เนื้อหาต้องเป็นภาษาไทยที่ถูกต้อง มีคุณภาพสูง และเหมาะสมกับเว็บไซต์ ระเบียบการช่าง
            `;

            const response = await this.callGeminiAPI(prompt);
            
            if (response.success && response.content) {
                try {
                    // Try to parse JSON response
                    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const result = JSON.parse(jsonMatch[0]);
                        
                        // Validate required fields
                        if (result.titleTH && result.content) {
                            return {
                                success: true,
                                data: {
                                    titleTH: result.titleTH,
                                    titleEN: result.titleEN || this.generateSlugFromTitle(result.titleTH),
                                    metaDescription: result.metaDescription || result.summary || result.titleTH,
                                    content: result.content,
                                    tags: result.tags || [],
                                    summary: result.summary || ''
                                },
                                source: 'gemini-2.0-flash'
                            };
                        }
                    }
                } catch (parseError) {
                    console.error('Error parsing AI response:', parseError);
                }
            }

            // If AI parsing fails, try fallback
            return this.autoGenerateFlashContentFallback(sourceText, contentType);

        } catch (error) {
            console.error('Error generating Flash content:', error);
            return this.autoGenerateFlashContentFallback(sourceText, contentType);
        }
    }

    // Fallback content generation
    autoGenerateFlashContentFallback(sourceText, contentType) {
        const words = sourceText.split(' ').filter(word => word.length > 2);
        const titleWords = words.slice(0, 5).join(' ');
        
        return {
            success: true,
            data: {
                titleTH: `${titleWords} - ระเบียบการช่าง`,
                titleEN: this.generateSlugFromTitle(titleWords),
                metaDescription: `เรียนรู้เกี่ยวกับ ${titleWords} ในรูปแบบที่เข้าใจง่าย พร้อมข้อมูลครบถ้วนจากระเบียบการช่าง`,
                content: `<h2>${titleWords}</h2><p>${sourceText}</p><p>เนื้อหานี้ถูกสร้างขึ้นโดยระบบ AI เพื่อให้ข้อมูลเบื้องต้น กรุณาตรวจสอบและปรับแต่งตามความเหมาะสม</p>`,
                tags: words.slice(0, 5),
                summary: sourceText.substring(0, 150) + '...'
            },
            source: 'fallback'
        };
    }

    // Generate URL slug from title
    generateSlugFromTitle(title) {
        return title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/--+/g, '-')
            .trim();
    }

    // Call Gemini API
    async callGeminiAPI(prompt) {
        try {
            const resKey = await fetch('/api/apikey');
            if (!resKey.ok) throw new Error('Cannot fetch API key');
            
            const data = await resKey.json();
            const apiKey = data.geminiApiKey;
            
            if (!apiKey) throw new Error('API key not found');

            const url = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=' + encodeURIComponent(apiKey);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 4096
                    }
                })
            });

            if (response.ok) {
                const data = await response.json();
                const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                return { success: true, content };
            } else {
                return { success: false, error: `API Error: ${response.status}` };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Flash Keywords Research
    async flashKeywordsResearch(keyword) {
        if (!keyword) {
            this.showError('❌ กรุณาระบุ keyword ที่ต้องการวิเคราะห์');
            return;
        }

        this.showLoading('🔄 กำลังวิเคราะห์ keywords ด้วย Flash AI...');
        
        try {
            let keywordResults = null;

            // Try to get real AI analysis if connected
            if (this.geminiStatus.isConnected) {
                const prompt = `
                ในฐานะ SEO Expert โปรดวิเคราะห์ keyword "${keyword}" สำหรับเว็บไซต์ภาษาไทย และสร้างรายงานที่ครอบคลุม:

                1. คำค้นหาที่เกี่ยวข้อง (Related Keywords) 10 คำ
                2. คำค้นหาแบบ Long-tail 5 คำ
                3. คำค้นหาของคู่แข่ง 5 คำ
                4. ระดับความยาก (Difficulty): Easy/Medium/Hard
                5. ปริมาณการค้นหาประมาณ: High/Medium/Low
                6. Search Intent: Informational/Commercial/Navigational/Transactional
                7. แนะนำกลยุทธ์ SEO

                ตอบในรูปแบบ JSON:
                {
                    "mainKeyword": "${keyword}",
                    "difficulty": "Medium",
                    "searchVolume": "Medium",
                    "searchIntent": "Informational",
                    "relatedKeywords": ["คำ1", "คำ2", "คำ3"],
                    "longTailKeywords": ["คำยาว1", "คำยาว2"],
                    "competitorKeywords": ["คำคู่แข่ง1", "คำคู่แข่ง2"],
                    "seoStrategy": ["กลยุทธ์1", "กลยุทธ์2", "กลยุทธ์3"]
                }
                `;

                const response = await this.callGeminiAPI(prompt);
                
                if (response.success && response.content) {
                    try {
                        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            keywordResults = JSON.parse(jsonMatch[0]);
                        }
                    } catch (parseError) {
                        console.error('Error parsing keyword results:', parseError);
                    }
                }
            }

            // Fallback to simulated results if AI fails
            if (!keywordResults) {
                keywordResults = this.generateFallbackKeywordResults(keyword);
            }

            // Display results
            this.displayKeywordResults(keywordResults);
            this.showSuccess('✅ วิเคราะห์ keywords เสร็จสิ้น');
            
        } catch (error) {
            console.error('Error researching keywords:', error);
            this.showError('❌ เกิดข้อผิดพลาดในการวิเคราะห์');
        } finally {
            this.hideLoading();
        }
    }

    // Generate fallback keyword results
    generateFallbackKeywordResults(keyword) {
        const baseKeywords = [
            `${keyword} คืออะไร`,
            `${keyword} วิธีใช้`,
            `${keyword} ราคา`,
            `${keyword} รีวิว`,
            `${keyword} ขาย`,
            `${keyword} ดีไหม`,
            `${keyword} 2024`,
            `${keyword} แนะนำ`,
            `${keyword} เปรียบเทียบ`,
            `${keyword} ประโยชน์`
        ];

        const longTailKeywords = [
            `วิธีเลือก${keyword}ที่ดีที่สุด`,
            `${keyword}สำหรับมือใหม่`,
            `${keyword}ราคาถูกคุณภาพดี`,
            `${keyword}ยี่ห้อไหนดี`,
            `เทคนิค${keyword}เบื้องต้น`
        ];

        const competitorKeywords = [
            `${keyword} vs คู่แข่ง`,
            `ทางเลือกของ${keyword}`,
            `${keyword} หรือ อื่นๆ`,
            `เปรียบเทียบ${keyword}`,
            `${keyword} คุณภาพดี`
        ];

        return {
            mainKeyword: keyword,
            difficulty: ['Easy', 'Medium', 'Hard'][Math.floor(Math.random() * 3)],
            searchVolume: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
            searchIntent: ['Informational', 'Commercial', 'Navigational', 'Transactional'][Math.floor(Math.random() * 4)],
            relatedKeywords: baseKeywords.slice(0, 10),
            longTailKeywords: longTailKeywords,
            competitorKeywords: competitorKeywords,
            seoStrategy: [
                'สร้างเนื้อหาที่มีคุณภาพสูง',
                'ใช้ keyword ในหัวข้อและเนื้อหา',
                'สร้าง backlink คุณภาพ',
                'ปรับปรุง page speed',
                'เพิ่มเนื้อหาที่เกี่ยวข้อง'
            ]
        };
    }

    // Display keyword results in modal
    displayKeywordResults(results) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h3><i class="fas fa-search"></i> Flash Keywords Research: ${results.mainKeyword}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef;">
                            <h4>📊 Keyword Metrics</h4>
                            <div style="margin: 8px 0;">
                                <strong>Difficulty:</strong> 
                                <span style="background: #ffc107; color: #000; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${results.difficulty}</span>
                            </div>
                            <div style="margin: 8px 0;">
                                <strong>Search Volume:</strong> 
                                <span style="background: #28a745; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${results.searchVolume}</span>
                            </div>
                            <div style="margin: 8px 0;">
                                <strong>Search Intent:</strong> 
                                <span style="background: #007bff; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${results.searchIntent}</span>
                            </div>
                        </div>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef;">
                            <h4>🎯 SEO Strategy</h4>
                            <ul style="margin: 0; padding-left: 18px;">
                                ${results.seoStrategy.map(strategy => `<li>${strategy}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <h4>🔍 Related Keywords</h4>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;">
                            ${results.relatedKeywords.map(kw => `<span style="background: #e9ecef; padding: 4px 8px; border-radius: 4px; font-size: 14px; cursor: pointer;">${kw}</span>`).join('')}
                        </div>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <h4>📝 Long-tail Keywords</h4>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;">
                            ${results.longTailKeywords.map(kw => `<span style="background: #28a745; color: white; padding: 4px 8px; border-radius: 4px; font-size: 14px; cursor: pointer;">${kw}</span>`).join('')}
                        </div>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <h4>🏆 Competitor Keywords</h4>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;">
                            ${results.competitorKeywords.map(kw => `<span style="background: #ffc107; color: #000; padding: 4px 8px; border-radius: 4px; font-size: 14px; cursor: pointer;">${kw}</span>`).join('')}
                        </div>
                    </div>
                </div>
                <div style="padding: 15px; border-top: 1px solid #dee2e6; text-align: right;">
                    <button onclick="this.closest('.modal').remove()" style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">ปิด</button>
                </div>
            </div>
        `;        
        document.body.appendChild(modal);
    }
}

// Global functions for onclick handlers
window.createNewPost = () => cmsApp.createNewPost();
window.toggleSEOPanel = () => {
    const panel = document.getElementById('seoAnalysisPanel');
    if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
};

window.clearForm = () => {
    if (window.cmsApp) {
        document.getElementById('postTitleTH').value = '';
        document.getElementById('postTitleEN').value = '';
        document.getElementById('postSlug').value = '';
        document.getElementById('postExcerpt').value = '';
        document.getElementById('postContent').innerHTML = '';
        document.getElementById('postTags').value = '';
        document.getElementById('metaTitle').value = '';
        document.getElementById('metaDescription').value = '';
        document.getElementById('focusKeyword').value = '';
        window.cmsApp.showNotification('ล้างฟอร์มเรียบร้อย', 'success');
    }
};

// Initialize the CMS app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.cmsApp = new CMSDashboard();
});
