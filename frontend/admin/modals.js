function createOrGetGeminiModal() {
    let modal = document.getElementById('geminiAiModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'geminiAiModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width:600px;">
                <div class="modal-header">
                    <h3>🚀 Flash AI วิเคราะห์ & แนะนำ SEO</h3>
                    <button class="modal-close" onclick="closeGeminiModal()">&times;</button>
                </div>
                <div class="modal-body" id="geminiAiModalBody">
                    <div style="text-align:center;padding:30px;">
                        <div class="loading-spinner"></div>
                        <div class="loading-text">กำลังวิเคราะห์ด้วย Gemini 2.0 Flash...</div>
                    </div>
                </div>
                <div class="modal-footer" id="geminiAiModalFooter" style="display:none;">
                    <button class="btn btn-gemini" onclick="autoGenerateFromGemini()" id="geminiAutoGenBtn">
                        <i class="fas fa-magic"></i> เติมเนื้อหา/SEO อัตโนมัติ
                    </button>
                    <button class="btn btn-secondary" onclick="closeGeminiModal()">ปิด</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    return modal;
}

function closeGeminiModal() {
    const modal = document.getElementById('geminiAiModal');
    if (modal) modal.style.display = 'none';
}

// showModal: show modal by id
function showModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'flex';
}

// closeModal: close modal by id
function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
}

// Make functions globally available
window.createOrGetGeminiModal = createOrGetGeminiModal;
window.closeGeminiModal = closeGeminiModal;
window.showModal = showModal;
window.closeModal = closeModal;

console.log('✅ [MODALS] Modal functions loaded');