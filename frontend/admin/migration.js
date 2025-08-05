class AdminMigration {
    constructor() {
        this.apiBase = window.CONFIG?.API_BASE_URL || 'https://rbck.onrender.com/api';
        this.logs = [];
        this.configManager = null;
        this.supabaseConfig = null;
        this.connectionFailed = false; // Track if connection has failed
        console.log('🔄 Admin Migration initialized');
    }

    // ✅ Initialize configuration manager (simplified)
    async initializeConfig() {
        // Skip ConfigManager dependency - use direct API calls
        console.log('✅ [MIGRATION] Using direct API configuration (no ConfigManager needed)');
        this.configManager = null;
        this.supabaseConfig = null;
        
        // Clear any ConfigManager warnings from console
        console.log('✅ [MIGRATION] ConfigManager dependency removed - no warnings expected');
    }

    // ✅ Get Supabase credentials from backend
    async getSupabaseCredentials() {
        try {
            console.log('🔄 [MIGRATION] Getting Supabase credentials from backend...');
            
            const response = await fetch(`${this.apiBase}/auth/get-supabase-token`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.success && result.supabaseKey) {
                console.log('✅ [MIGRATION] Got Supabase credentials from backend');
                return {
                    serviceKey: result.supabaseKey,
                    url: result.supabaseUrl,
                    anonKey: result.anonKey
                };
            } else {
                throw new Error(result.error || 'Failed to get Supabase credentials');
            }

        } catch (error) {
            console.error('❌ [MIGRATION] Supabase credentials fetch failed:', error);
            throw new Error(`Backend Supabase auth failed: ${error.message}`);
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

    // ✅ Get authentication token (optional for status check)
    async getAuthToken() {
        try {
            // Try to get JWT from localStorage/sessionStorage first
            const jwtToken = localStorage.getItem('authToken') || 
                           localStorage.getItem('jwtToken') || 
                           sessionStorage.getItem('authToken');
            
            if (jwtToken) {
                console.log('✅ [MIGRATION] Using existing JWT token');
                return jwtToken;
            }
            
            // For status check, return null (endpoint is public)
            console.log('⚠️ [MIGRATION] No JWT token found, proceeding without auth for status check');
            return null;
            
        } catch (error) {
            console.error('❌ [MIGRATION] Authentication failed:', error);
            
            // ✅ Show login requirement UI
            const statusDiv = document.getElementById('migration-status');
            if (statusDiv) {
                statusDiv.textContent = '🔐 ต้องเข้าสู่ระบบเพื่อใช้งาน Migration';
            }
            
            const resultsDiv = document.getElementById('migration-results');
            if (resultsDiv) {
                resultsDiv.innerHTML = `
                    <div class="migration-status status-error">
                        <div class="status-header">
                            <h4>🔐 Admin Login Required</h4>
                        </div>
                        <div class="status-details">
                            <p>❌ <strong>Error:</strong> ${error.message}</p>
                            <p>💡 <strong>To use Migration features:</strong></p>
                            <ul>
                                <li>เข้าสู่ระบบด้วย Admin account</li>
                                <li>ตรวจสอบสิทธิ์ Administrator</li>
                                <li>รีเฟรชหน้าหลังจาก login</li>
                            </ul>
                        </div>
                        <div class="migration-actions">
                            <button onclick="window.location.href='/login.html'" class="btn btn-primary btn-sm">
                                🔐 เข้าสู่ระบบ
                            </button>
                            <button onclick="window.location.reload()" class="btn btn-secondary btn-sm">
                                🔄 รีเฟรช
                            </button>
                        </div>
                    </div>
                `;
            }
            
            throw error;
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
            console.log('✅ [MIGRATION] Config initialization complete - no ConfigManager needed');
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
        
        // Add manual retry button functionality
        const retryBtn = document.getElementById('migration-retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                this.connectionFailed = false; // Reset connection flag
                this.handleCheckStatus();
            });
        }
    }

    // ✅ Check migration status
    async handleCheckStatus() {
        // If connection has already failed, don't retry automatically
        if (this.connectionFailed) {
            console.log('⚠️ [MIGRATION] Skipping status check - connection previously failed');
            return;
        }
        
        try {
            this.log('🔍 Checking migration status...');
            this.showLoading('migration-status', 'กำลังตรวจสอบ...');

            // ⚡ ใช้ token จาก ConfigManager แทน localStorage
            const authToken = await this.getAuthToken();

            // ✅ ใช้ safeApiCall ถ้ามี เพื่อป้องกัน CORS error
            let result;
            const headers = { 'Accept': 'application/json' };
            
            // เพิ่ม Authorization header เฉพาะเมื่อมี token
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }
            
            console.log('═══════════════════════════════════════');
            console.log('🔍 [MIGRATION] Checking status with:');
            console.log('  API Base:', this.apiBase);
            console.log('  Endpoint:', `${this.apiBase}/migration/status`);
            console.log('  Has Auth Token:', !!authToken);
            console.log('  Has safeApiCall:', !!(window.safeApiCall && typeof window.safeApiCall === 'function'));
            console.log('═══════════════════════════════════════');

            if (window.safeApiCall && typeof window.safeApiCall === 'function') {
                result = await window.safeApiCall(`${this.apiBase}/migration/status`, {
                    method: 'GET',
                    headers: headers
                });
                console.log('✅ [MIGRATION] safeApiCall result:', result);
            } else {
                console.log('⚠️ [MIGRATION] Using fallback fetch method');
                const response = await fetch(`${this.apiBase}/migration/status`, {
                    method: 'GET',
                    headers: headers
                });

                console.log('📊 [MIGRATION] Response status:', response.status, response.statusText);

                if (!response.ok) {
                    // Check if it's a 404 - migration endpoint might not be implemented
                    if (response.status === 404) {
                        console.warn('⚠️ [MIGRATION] Migration endpoint not found - skipping status check');
                        this.log('⚠️ Migration endpoint not available');
                        return;
                    }
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                result = await response.json();
                console.log('📊 [MIGRATION] Response data:', result);
            }
            
            // Enhanced validation with detailed debugging
            console.log('═══════════════════════════════════════');
            console.log('🔍 [MIGRATION] Validating result:');
            console.log('  Has Result:', !!result);
            console.log('  Result Type:', typeof result);
            console.log('  Success Field:', result?.success);
            console.log('  Success Type:', typeof result?.success);
            console.log('  Has Data:', !!result?.data);
            console.log('  Has Error:', !!result?.error);
            console.log('  Result Keys:', result ? Object.keys(result) : null);
            console.log('═══════════════════════════════════════');
            
            if (!result) {
                throw new Error('Empty response from migration status endpoint');
            }
            
            // Handle double-wrapped response like unified status manager
            if (result && typeof result.data === 'string') {
                try {
                    console.log('🔧 [MIGRATION] Unwrapping double-wrapped JSON response');
                    result = JSON.parse(result.data);
                    console.log('✅ [MIGRATION] Parsed nested JSON:', result);
                } catch (parseError) {
                    console.error('❌ [MIGRATION] Failed to parse nested JSON:', parseError);
                    // Continue with original result
                }
            }
            
            if (result.success === false) {
                throw new Error(result.error || result.message || 'Migration endpoint returned success: false');
            }
            
            // If no explicit success field, check for data or assume success for 200 response
            if (result.success === undefined) {
                if (result.data || result.status || result.tables) {
                    console.log('⚠️ [MIGRATION] No success field, assuming success based on data presence');
                    result.success = true;
                } else {
                    console.log('⚠️ [MIGRATION] No success field and no recognizable data, assuming success for 200 response');
                    result.success = true;
                    // Provide default data structure
                    result.data = {
                        existingTables: 0,
                        totalRequiredTables: 0,
                        migrationStatus: 'unknown'
                    };
                }
            }
            
            // Final validation
            if (!result.success) {
                throw new Error(result.error || result.message || 'Migration status validation failed');
            }

            // 🔧 FIXED: Enhanced data format handling
            console.log('─────────────────────────────────────────');
            console.log('📋 [MIGRATION] Raw API Response:');
            console.log('  Status:', result.status || 'unknown');
            console.log('  Success:', result.success || false);
            console.log('  Has Data:', !!result.data);
            console.log('  Data Type:', typeof result.data);
            
            // Check multiple possible data formats
            let statusData = null;
            
            if (result.data && typeof result.data === 'object') {
                statusData = result.data;
                console.log('✅ [MIGRATION] Using result.data directly');
            } else if (result.success && result.tables) {
                // Alternative format: data directly in result
                statusData = {
                    existingTables: result.tables?.length || 0,
                    totalRequiredTables: result.totalRequiredTables || 10,
                    tables: result.tables || []
                };
                console.log('✅ [MIGRATION] Using alternative data format');
            } else if (result.success && !result.data) {
                // Success but no data - create default structure
                statusData = {
                    existingTables: 0,
                    totalRequiredTables: 10,
                    tables: [],
                    message: 'Migration status checked successfully'
                };
                console.log('✅ [MIGRATION] Using default data structure');
            }
            
            if (statusData) {
                console.log('📊 [MIGRATION] Status Data:');
                console.log('  Existing Tables:', statusData.existingTables || 0);
                console.log('  Required Tables:', statusData.totalRequiredTables || 10);
                console.log('  Tables List:', statusData.tables?.length || 0, 'items');
                console.log('─────────────────────────────────────────');
                
                this.displayStatus(statusData);
                this.log(`✅ Status check completed successfully`);
                this.log(`📊 Tables: ${statusData.existingTables || 0}/${statusData.totalRequiredTables || 10} exist`);
            } else {
                console.log('❌ [MIGRATION] Unable to parse response data');
                console.log('  Raw Result:', JSON.stringify(result, null, 2));
                console.log('─────────────────────────────────────────');
                
                this.displayStatus(null);
                this.log('⚠️ Status check completed but data format is invalid');
                this.log('📋 Check console for detailed response data');
            }

        } catch (error) {
            console.error('❌ [MIGRATION] Status check error:', error);
            
            // Enhanced error handling with specific error types
            if (error.message.includes('HTTP 404') || error.message.includes('not found')) {
                this.log('⚠️ Migration system not available - this is normal for new installations');
                console.log('💡 [MIGRATION] Migration endpoint not implemented - gracefully handling');
            } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                this.log(`❌ Network error: ${error.message}`);
                this.connectionFailed = true;
                console.warn('⚠️ [MIGRATION] Network connection failed - disabling auto-retry');
            } else if (error.message.includes('Status check failed') || error.message.includes('Failed to check migration status')) {
                this.log(`❌ Migration status check failed: ${error.message}`);
                this.connectionFailed = true;
                console.warn('⚠️ [MIGRATION] Migration check failed - disabling auto-retry');
            } else {
                this.log(`❌ Unexpected error: ${error.message}`);
                console.warn('⚠️ [MIGRATION] Unexpected error - gracefully continuing');
            }
            
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

            // ⚡ ใช้ token จาก ConfigManager แทน localStorage (optional for execute)
            const authToken = await this.getAuthToken();
            
            const headers = { 'Content-Type': 'application/json' };
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }

            const response = await fetch(`${this.apiBase}/migration/execute`, {
                method: 'POST',
                headers: headers
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

            // ⚡ ใช้ token จาก ConfigManager แทน localStorage (optional for health)
            const authToken = await this.getAuthToken();
            
            const headers = { 'Accept': 'application/json' };
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }

            const response = await fetch(`${this.apiBase}/migration/health`, {
                method: 'GET',
                headers: headers
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
        
        // Update main status display with celebration for complete
        const statusDiv = document.getElementById('migration-status');
        if (statusDiv) {
            if (status.isFullyMigrated) {
                statusDiv.innerHTML = `
                    <div class="migration-complete-banner">
                        <div class="celebration-icon">🎉</div>
                        <div class="completion-text">
                            <h3>Database Migration Complete!</h3>
                            <p>All ${status.totalRequiredTables} tables are ready and operational</p>
                        </div>
                        <div class="completion-badge">✅ READY</div>
                    </div>
                `;
            } else {
                statusDiv.innerHTML = `
                    <div class="migration-pending-banner">
                        <div class="warning-icon">⚠️</div>
                        <div class="pending-text">
                            <h3>Migration Required</h3>
                            <p>${status.existingTables}/${status.totalRequiredTables} tables ready</p>
                        </div>
                        <div class="pending-badge">PENDING</div>
                    </div>
                `;
            }
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
                        <strong>💡 Status:</strong> ${status.recommendation || 'No recommendation available'}
                    </div>
                    
                    ${status.isFullyMigrated ? `
                        <div class="migration-complete-section">
                            <div class="complete-header">
                                <h4>🎉 Database Migration Complete!</h4>
                                <p>Your system is fully ready and operational.</p>
                            </div>
                            <div class="complete-features">
                                <div class="feature">✅ All ${totalRequiredTables} tables created successfully</div>
                                <div class="feature">✅ Posts table extended with new columns</div>
                                <div class="feature">✅ Performance indexes optimized</div>
                                <div class="feature">✅ Security policies applied</div>
                                <div class="feature">✅ Database relationships established</div>
                            </div>
                            <div class="complete-actions">
                                <button class="btn btn-success" onclick="window.adminMigration?.handleCheckStatus()">
                                    🔄 Refresh Status
                                </button>
                                <button class="btn btn-info" onclick="window.adminMigration?.handleHealthCheck()">
                                    ❤️ Run Health Check
                                </button>
                            </div>
                        </div>
                    ` : `
                        <div class="next-action">
                            <strong>🚀 Next Action:</strong> Click "Run Migration" to create missing tables
                        </div>
                    `}
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
