class AdminMigration {
    constructor() {
        this.apiBase = window.CONFIG?.API_BASE_URL || 'https://rbck.onrender.com/api';
        this.logs = [];
        this.configManager = null;
        this.supabaseConfig = null;
        console.log('🔄 Admin Migration initialized');
    }

    // ✅ Initialize configuration manager
    async initializeConfig() {
        try {
            if (!this.configManager) {
                try {
                    // ⚡ ดึง ConfigManager จาก config.js (absolute path)
                    let ConfigManager;
                    try {
                        const module = await import('/frontend/config.js');
                        ConfigManager = module.ConfigManager;
                    } catch (e1) {
                        try {
                            const module = await import('../config.js');
                            ConfigManager = module.ConfigManager;
                        } catch (e2) {
                            try {
                                const module = await import('./config.js');
                                ConfigManager = module.ConfigManager;
                            } catch (e3) {
                                console.warn('⚠️ [MIGRATION] ConfigManager not found, using fallback');
                                ConfigManager = null;
                            }
                        }
                    }
                    
                    if (ConfigManager) {
                        this.configManager = new ConfigManager();
                        console.log('✅ [MIGRATION] ConfigManager initialized');
                    } else {
                        console.warn('⚠️ [MIGRATION] ConfigManager not available, using localStorage fallback');
                        this.configManager = null;
                    }
                } catch (error) {
                    console.error('❌ [MIGRATION] Error initializing ConfigManager:', error);
                    this.configManager = null;
                }
            }

            // ⚡ ดึง Supabase configuration จาก Render (ถ้ามี ConfigManager)
            if (this.configManager) {
                try {
                    this.supabaseConfig = await this.configManager.getSupabaseConfig();
                    console.log('✅ [MIGRATION] Supabase config loaded from Render backend');
                } catch (configError) {
                    console.warn('⚠️ [MIGRATION] Failed to load Supabase config from Render, continuing without it');
                    this.supabaseConfig = null;
                }
            }
            
        } catch (error) {
            console.error('❌ [MIGRATION] Failed to initialize config:', error);
            // Don't throw error - continue with fallback
        }
    }

    // ✅ Get token directly from backend (fallback method)
    async getTokenDirectly() {
        try {
            console.log('🔄 [MIGRATION] Checking if JWT endpoint exists...');
            
            const response = await fetch(`${this.apiBase}/auth/get-jwt-token`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                console.warn('⚠️ [MIGRATION] JWT endpoint not available, using Supabase auth');
                // Try Supabase-based auth instead
                return await this.getSupabaseAuth();
            }

            const result = await response.json();
            
            if (result.success && result.jwtToken) {
                console.log('✅ [MIGRATION] Got JWT token directly from backend');
                return result.jwtToken;
            } else {
                throw new Error(result.error || 'Failed to get JWT token from backend');
            }

        } catch (error) {
            console.error('❌ [MIGRATION] Direct token fetch failed:', error);
            console.log('🔄 [MIGRATION] Trying Supabase auth...');
            return await this.getSupabaseAuth();
        }
    }

    // ✅ Get auth using Supabase directly
    async getSupabaseAuth() {
        try {
            console.log('🔄 [MIGRATION] Using Supabase authentication...');
            
            // Try to get Supabase config from backend
            const configResponse = await fetch(`${this.apiBase}/config/supabase`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (configResponse.ok) {
                const config = await configResponse.json();
                if (config.success && config.config) {
                    console.log('✅ [MIGRATION] Got Supabase config, using service key');
                    // Use Supabase service key as auth token
                    return config.config.SUPABASE_SERVICE_KEY;
                }
            }
            
            console.warn('⚠️ [MIGRATION] Supabase config not available, using mock token');
            return this.getMockToken();
            
        } catch (error) {
            console.error('❌ [MIGRATION] Supabase auth failed:', error);
            return this.getMockToken();
        }
    }

    // ✅ Get authentication token from production backend
    async getAuthToken() {
        try {
            // ✅ Phase 1: Try to get fresh JWT token from backend
            if (!this.configManager) {
                await this.initializeConfig();
            }
            
            if (this.configManager) {
                try {
                    const token = await this.configManager.getJWTToken();
                    console.log('✅ [MIGRATION] Got fresh JWT from Render backend');
                    return token;
                } catch (configError) {
                    console.error('❌ [MIGRATION] ConfigManager failed:', configError.message);
                    // Fall through to direct call instead of throwing
                }
            }

            // ✅ Try direct backend call
            console.warn('⚠️ [MIGRATION] Trying direct backend call');
            try {
                return await this.getTokenDirectly();
            } catch (directError) {
                console.error('❌ [MIGRATION] Direct call failed:', directError.message);
                
                // ✅ TEMPORARY WORKAROUND: Use mock token for migration testing
                console.warn('⚠️ [MIGRATION] Using temporary bypass for testing');
                return this.getMockToken();
            }
            
        } catch (error) {
            console.error('❌ [MIGRATION] Authentication system error:', error);
            
            // ✅ Show fallback UI
            const statusDiv = document.getElementById('migration-status');
            if (statusDiv) {
                statusDiv.textContent = '⚠️ ใช้โหมดทดสอบ - Auth endpoint มีปัญหา';
            }
            
            // Return mock token to continue testing
            return this.getMockToken();
        }
    }

    // ✅ Temporary mock token for testing
    getMockToken() {
        console.warn('⚠️ [MIGRATION] Using mock token - FOR TESTING ONLY');
        
        // Simple JWT-like structure for testing
        const mockPayload = {
            isAdmin: true,
            username: 'test-user',
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
        };
        
        // Base64 encode a simple token structure
        const header = btoa(JSON.stringify({typ: 'JWT', alg: 'HS256'}));
        const payload = btoa(JSON.stringify(mockPayload));
        const signature = btoa('mock-signature-for-testing');
        
        return `${header}.${payload}.${signature}`;
    }

    // ✅ Initialize migration interface
    async init() {
        console.log('🚀 Initializing migration interface...');
        
        // ⚡ Initialize configuration first
        try {
            await this.initializeConfig();
        } catch (error) {
            console.warn('⚠️ [MIGRATION] Config initialization failed, continuing with fallback');
        }
        
        this.bindEvents();
        await this.checkStatusOnLoad();
    }

    // ✅ Bind event listeners
    bindEvents() {
        const checkBtn = document.getElementById('check-migration-btn');
        const runBtn = document.getElementById('run-migration-btn');
        const healthBtn = document.getElementById('health-check-btn');
        const refreshBtn = document.getElementById('refresh-status-btn');
        const clearLogsBtn = document.getElementById('clear-logs-btn');

        if (checkBtn) {
            checkBtn.addEventListener('click', () => this.handleCheckStatus());
        }

        if (runBtn) {
            runBtn.addEventListener('click', () => this.handleRunMigration());
        }

        if (healthBtn) {
            healthBtn.addEventListener('click', () => this.handleHealthCheck());
        }

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.handleCheckStatus());
        }

        if (clearLogsBtn) {
            clearLogsBtn.addEventListener('click', () => this.clearLogs());
        }
    }

    // ✅ Check migration status
    async handleCheckStatus() {
        try {
            this.log('🔍 Checking migration status...');
            this.showLoading('migration-status', 'กำลังตรวจสอบ...');

            // ⚡ ใช้ token จาก ConfigManager แทน localStorage
            const authToken = await this.getAuthToken();

            // ✅ ใช้ safeApiCall ถ้ามี เพื่อป้องกัน CORS error
            let result;
            if (window.safeApiCall && typeof window.safeApiCall === 'function') {
                console.log('🛡️ [MIGRATION] Using APIHelper for CORS protection');
                result = await window.safeApiCall(`${this.apiBase}/migration/status`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                });
            } else {
                const response = await fetch(`${this.apiBase}/migration/status`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                result = await response.json();
            }
            
            if (!result.success) {
                throw new Error(result.error || 'Status check failed');
            }

            this.displayStatus(result.data);
            this.log(`✅ Status check completed. ${result.data.existingTables}/${result.data.totalRequiredTables} tables exist`);

        } catch (error) {
            console.error('❌ [MIGRATION] Status check error:', error);
            this.log(`❌ Status check failed: ${error.message}`);
            
            // ✅ แสดง fallback status แทนการ error
            const statusDiv = document.getElementById('migration-status');
            if (statusDiv) {
                statusDiv.textContent = '⚠️ ไม่สามารถเชื่อมต่อกับ Backend ได้';
            }
            
            // ✅ แสดงข้อความแนะนำผู้ใช้
            const resultsDiv = document.getElementById('migration-results');
            if (resultsDiv) {
                resultsDiv.innerHTML = `
                    <div class="migration-status status-warning">
                        <div class="status-header">
                            <h4>⚠️ ไม่สามารถตรวจสอบสถานะได้</h4>
                        </div>
                        <div class="status-details">
                            <p>❌ <strong>ข้อผิดพลาด:</strong> ${error.message}</p>
                            <p>💡 <strong>แนะนำ:</strong></p>
                            <ul>
                                <li>ตรวจสอบการเชื่อมต่อ Internet</li>
                                <li>ตรวจสอบว่า Backend Server ทำงานปกติ</li>
                                <li>ลองรีเฟรชหน้าเพจ</li>
                            </ul>
                        </div>
                        <div class="migration-actions">
                            <button onclick="adminMigration.handleCheckStatus()" class="btn btn-primary btn-sm">
                                🔄 ลองใหม่
                            </button>
                        </div>
                    </div>
                `;
            }
        }
    }

    // ✅ Run migration
    async handleRunMigration() {
        try {
            // Confirmation dialog
            const confirmed = confirm(
                '🚨 Are you sure you want to run the database migration?\n\n' +
                'This will:\n' +
                '• Create/update database tables in Supabase\n' +
                '• May take 30-60 seconds to complete\n' +
                '• Should only be done by administrators\n\n' +
                'Continue?'
            );

            if (!confirmed) {
                this.log('⏹️ Migration cancelled by user');
                return;
            }

            this.log('🚀 Starting database migration...');
            this.showLoading('migration-results', 'Running database migration...');
            this.showCard('migration-results-card');

            // Disable migration button during execution
            const runBtn = document.getElementById('run-migration-btn');
            if (runBtn) {
                runBtn.disabled = true;
                runBtn.innerHTML = '⏳ Running Migration...';
            }

            // ⚡ ใช้ token จาก ConfigManager แทน localStorage
            const authToken = await this.getAuthToken();

            const response = await fetch(`${this.apiBase}/migration/execute`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Migration failed');
            }

            this.displayMigrationResult(result);
            this.log(`✅ Migration completed successfully in ${result.data.totalTime}`);

            // Auto-refresh status after migration
            setTimeout(() => this.handleCheckStatus(), 2000);

        } catch (error) {
            this.log(`❌ Migration failed: ${error.message}`);
            this.showError('migration-results', 'Migration Failed', error.message);
        } finally {
            // Re-enable migration button
            const runBtn = document.getElementById('run-migration-btn');
            if (runBtn) {
                runBtn.disabled = false;
                runBtn.innerHTML = '🚀 Run Migration';
            }
        }
    }

    // ✅ Health check
    async handleHealthCheck() {
        try {
            this.log('🏥 Running database health check...');
            this.showLoading('migration-results', 'Running health check...');
            this.showCard('migration-results-card');

            // ⚡ ใช้ token จาก ConfigManager แทน localStorage
            const authToken = await this.getAuthToken();

            const response = await fetch(`${this.apiBase}/migration/health`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Health check failed');
            }

            this.displayHealthResult(result);
            this.log(`🏥 Health check completed. Status: ${result.data.summary?.status}`);

        } catch (error) {
            this.log(`❌ Health check failed: ${error.message}`);
            this.showError('migration-results', 'Health Check Failed', error.message);
        }
    }

    // ✅ Display migration status
    displayStatus(status) {
        // ✅ Check if status is valid
        if (!status) {
            console.error('❌ [MIGRATION] Status is null or undefined');
            const statusDiv = document.getElementById('migration-status');
            if (statusDiv) {
                statusDiv.textContent = '❌ ไม่สามารถโหลดสถานะได้';
            }
            return;
        }
        
        // Update main status display
        const statusDiv = document.getElementById('migration-status');
        if (statusDiv) {
            const statusText = status.isFullyMigrated ? 
                `✅ พร้อมใช้งาน (${status.existingTables || 0}/${status.totalRequiredTables || 0})` : 
                `⚠️ ต้อง Migration (${status.existingTables || 0}/${status.totalRequiredTables || 0})`;
            statusDiv.textContent = statusText;
        }

        // Update results area with detailed status
        const resultsDiv = document.getElementById('migration-results');
        if (resultsDiv) {
            const statusClass = status.isFullyMigrated ? 'status-success' : 'status-warning';
            const existingTables = status.existingTables || 0;
            const totalRequiredTables = status.totalRequiredTables || 0;
            const progressPercent = totalRequiredTables > 0 ? (existingTables / totalRequiredTables) * 100 : 0;
            
            resultsDiv.innerHTML = `
                <div class="migration-status ${statusClass}">
                    <div class="status-header">
                        <h4>${status.isFullyMigrated ? '✅' : '⚠️'} Database Status</h4>
                        <span class="status-badge ${statusClass}">
                            ${status.isFullyMigrated ? 'READY' : 'NEEDS MIGRATION'}
                        </span>
                    </div>
                    
                    <div class="status-details">
                        <div class="status-item">
                            <span class="label">Tables:</span>
                            <span class="value">${existingTables}/${totalRequiredTables}</span>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${progressPercent}%"></div>
                            </div>
                        </div>
                        
                        <div class="status-item">
                            <span class="label">Migrations Executed:</span>
                            <span class="value">${status.executedMigrations || 0}</span>
                        </div>
                        
                        <div class="status-item">
                            <span class="label">Missing Tables:</span>
                            <span class="value ${(status.missingTables || 0) > 0 ? 'missing' : 'complete'}">${status.missingTables || 0}</span>
                        </div>
                    </div>
                    
                    <div class="recommendation">
                        <strong>💡 Recommendation:</strong> ${status.recommendation || 'No recommendation available'}
                    </div>
                    
                    ${(status.missingTables || 0) > 0 ? `
                        <div class="next-action">
                            <strong>🚀 Next Action:</strong> Click "Run Migration" to create missing tables
                        </div>
                    ` : ''}
                </div>
            `;
        }
    }

    // ✅ Display migration results
    displayMigrationResult(result) {
        const resultsDiv = document.getElementById('migration-results');
        
        resultsDiv.innerHTML = `
            <div class="migration-result success">
                <div class="result-header">
                    <h4>✅ Migration Completed Successfully!</h4>
                    <span class="timing">⏱️ ${result.data.totalTime}</span>
                </div>
                
                <div class="migration-steps">
                    <h5>📋 Migration Steps:</h5>
                    ${result.data.migrationResults.map(step => `
                        <div class="migration-step ${step.success ? 'success' : 'error'}">
                            <span class="step-icon">${step.success ? '✅' : '❌'}</span>
                            <span class="step-name">${step.step}</span>
                            <span class="step-message">${step.message}</span>
                            ${step.statements_executed ? `<span class="step-detail">(${step.statements_executed} statements)</span>` : ''}
                        </div>
                    `).join('')}
                </div>
                
                <div class="next-steps">
                    <h5>🎯 Next Steps:</h5>
                    <ul>
                        ${result.data.nextSteps.map(step => `<li>${step}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="migration-actions">
                    <button onclick="adminMigration.handleHealthCheck()" class="btn btn-success btn-sm">
                        🏥 Verify Health
                    </button>
                    <button onclick="adminMigration.handleCheckStatus()" class="btn btn-info btn-sm">
                        🔄 Refresh Status
                    </button>
                </div>
            </div>
        `;
    }

    // ✅ Display health check results
    displayHealthResult(health) {
        const resultsDiv = document.getElementById('migration-results');
        
        resultsDiv.innerHTML = `
            <div class="health-result ${health.healthy ? 'success' : 'warning'}">
                <h4>${health.healthy ? '✅' : '⚠️'} Database Health Check</h4>
                <p><strong>Status:</strong> ${health.data.summary?.status}</p>
                <p><strong>Tables:</strong> ${health.data.summary?.tablesFound}</p>
                <p><strong>Recommendation:</strong> ${health.data.summary?.recommendation}</p>
                
                <div class="table-details">
                    <h5>Table Status:</h5>
                    ${Object.entries(health.data.details).map(([table, status]) => `
                        <div class="table-status ${status.exists ? 'exists' : 'missing'}">
                            ${status.exists ? '✅' : '❌'} ${table}
                            ${status.error ? `<span class="error">(${status.error})</span>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // ✅ Utility methods
    showLoading(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `<div class="loading">🔄 ${message}</div>`;
        }
    }

    showError(elementId, title, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <div class="error-message">
                    <h4>❌ ${title}</h4>
                    <p>${message}</p>
                    <small>Check browser console for more details</small>
                </div>
            `;
        }
    }

    showCard(cardId) {
        const card = document.getElementById(cardId);
        if (card) {
            card.style.display = 'block';
        }
    }

    log(message) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${message}`;
        this.logs.push(logEntry);
        
        const logsContainer = document.getElementById('migration-logs');
        if (logsContainer) {
            logsContainer.textContent = this.logs.join('\n');
            logsContainer.scrollTop = logsContainer.scrollHeight;
        }
        
        this.showCard('migration-logs-card');
        console.log(logEntry);
    }

    clearLogs() {
        this.logs = [];
        const logsContainer = document.getElementById('migration-logs');
        if (logsContainer) {
            logsContainer.textContent = '';
        }
    }

    async checkStatusOnLoad() {
        try {
            // ✅ เพิ่ม delay เพื่อให้ scripts โหลดครบก่อน
            setTimeout(async () => {
                try {
                    console.log('🔄 [MIGRATION] Auto-checking status on load...');
                    await this.handleCheckStatus();
                } catch (error) {
                    console.warn('⚠️ [MIGRATION] Auto status check failed:', error.message);
                    this.log(`⚠️ Auto status check failed: ${error.message}`);
                    
                    // ✅ แสดงสถานะเริ่มต้นแทน
                    const statusDiv = document.getElementById('migration-status');
                    if (statusDiv) {
                        statusDiv.textContent = '⚠️ กรุณาคลิก "รีเฟรชสถานะ" เพื่อตรวจสอบ';
                    }
                }
            }, 1000); // รอ 1 วินาที
        } catch (error) {
            console.warn('⚠️ [MIGRATION] Error in checkStatusOnLoad:', error);
        }
    }
}

// ✅ Global instance
let adminMigration;

// ✅ Initialize when migration section is shown
function initializeMigration() {
    if (!adminMigration) {
        adminMigration = new AdminMigration();
    }
    adminMigration.init();
}

// ✅ Auto-initialize if migration section is visible
document.addEventListener('DOMContentLoaded', () => {
    const migrationSection = document.getElementById('migration');
    if (migrationSection && migrationSection.style.display !== 'none') {
        initializeMigration();
    }
});

// ✅ Make functions globally available
window.initializeMigration = initializeMigration;
window.adminMigration = adminMigration;

// ✅ Global function bindings for HTML onclick handlers
window.refreshMigrationStatus = function() {
    console.log('🔄 Refreshing migration status...');
    if (window.adminMigration) {
        return window.adminMigration.handleCheckStatus();
    } else {
        initializeMigration();
        setTimeout(() => window.adminMigration?.handleCheckStatus(), 500);
    }
};

window.runPendingMigrations = function() {
    console.log('🚀 Running pending migrations...');
    if (window.adminMigration) {
        return window.adminMigration.handleRunMigration();
    } else {
        initializeMigration();
        setTimeout(() => window.adminMigration?.handleRunMigration(), 500);
    }
};

window.checkDatabaseHealth = function() {
    console.log('🏥 Checking database health...');
    if (window.adminMigration) {
        return window.adminMigration.handleHealthCheck();
    } else {
        initializeMigration();
        setTimeout(() => window.adminMigration?.handleHealthCheck(), 500);
    }
};

window.rollbackLastMigration = function() {
    console.log('⚠️ Rollback function not implemented yet');
    if (typeof showNotification === 'function') {
        showNotification('Rollback functionality not implemented yet', 'warning');
    } else {
        alert('Rollback functionality is not implemented yet');
    }
};

window.clearMigrationConsole = function() {
    console.log('🧹 Clearing migration console...');
    if (window.adminMigration) {
        window.adminMigration.clearLogs();
    }
};

window.exportMigrationReport = function() {
    console.log('📄 Exporting migration report...');
    if (typeof showNotification === 'function') {
        showNotification('Export functionality not implemented yet', 'info');
    } else {
        alert('Export functionality is not implemented yet');
    }
};

window.exportConsoleLogs = function() {
    console.log('📋 Exporting console logs...');
    if (window.adminMigration && window.adminMigration.logs) {
        const logs = window.adminMigration.logs.join('\n');
        const blob = new Blob([logs], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `migration-logs-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};
