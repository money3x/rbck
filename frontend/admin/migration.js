class AdminMigration {
    constructor() {
        this.apiBase = window.CONFIG?.API_BASE_URL || 'https://rbck.onrender.com/api';
        this.logs = [];
        console.log('🔄 Admin Migration initialized');
    }

    // ✅ Initialize migration interface
    async init() {
        console.log('🚀 Initializing migration interface...');
        
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
            this.showLoading('migration-status', 'Checking database status...');

            const response = await fetch(`${this.apiBase}/migration/status`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken') || sessionStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Status check failed');
            }

            this.displayStatus(result.data);
            this.log(`✅ Status check completed. ${result.data.existingTables}/${result.data.totalRequiredTables} tables exist`);

        } catch (error) {
            this.log(`❌ Status check failed: ${error.message}`);
            this.showError('migration-status', 'Status Check Failed', error.message);
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

            const response = await fetch(`${this.apiBase}/migration/execute`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken') || sessionStorage.getItem('authToken')}`,
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

            const response = await fetch(`${this.apiBase}/migration/health`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken') || sessionStorage.getItem('authToken')}`,
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
        // Update main status display
        const statusDiv = document.getElementById('migration-status');
        if (statusDiv) {
            const statusText = status.isFullyMigrated ? 
                `✅ พร้อมใช้งาน (${status.existingTables}/${status.totalRequiredTables})` : 
                `⚠️ ต้อง Migration (${status.existingTables}/${status.totalRequiredTables})`;
            statusDiv.textContent = statusText;
        }

        // Update results area with detailed status
        const resultsDiv = document.getElementById('migration-results');
        if (resultsDiv) {
            const statusClass = status.isFullyMigrated ? 'status-success' : 'status-warning';
            
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
                            <span class="value">${status.existingTables}/${status.totalRequiredTables}</span>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${(status.existingTables/status.totalRequiredTables)*100}%"></div>
                            </div>
                        </div>
                        
                        <div class="status-item">
                            <span class="label">Migrations Executed:</span>
                            <span class="value">${status.executedMigrations}</span>
                        </div>
                        
                        <div class="status-item">
                            <span class="label">Missing Tables:</span>
                            <span class="value ${status.missingTables > 0 ? 'missing' : 'complete'}">${status.missingTables}</span>
                        </div>
                    </div>
                    
                    <div class="recommendation">
                        <strong>💡 Recommendation:</strong> ${status.recommendation}
                    </div>
                    
                    ${status.missingTables > 0 ? `
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
            await this.handleCheckStatus();
        } catch (error) {
            this.log(`⚠️ Auto status check failed: ${error.message}`);
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
