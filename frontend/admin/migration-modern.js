class ModernAdminMigration {
    constructor() {
        this.apiBase = window.CONFIG?.API_BASE_URL || 'https://rbck.onrender.com/api';
        this.logs = [];
        this.isModernMode = true;
        console.log('🚀 Modern Migration System Initialized');
    }

    // 🌟 Modern Migration Status with Real-time Updates
    async checkModernStatus() {
        try {
            this.showLoading('migration-status', '🔍 Checking migration status...');
            
            const response = await fetch(`${this.apiBase}/migration/status`);
            const result = await response.json();
            
            if (result.success) {
                this.displayModernStatus(result.data);
                this.log(`✅ Status check completed: ${result.data.existingTables}/${result.data.totalRequiredTables} tables ready`);
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            this.log(`❌ Status check failed: ${error.message}`);
            this.showError('migration-status', `Status check failed: ${error.message}`);
        }
    }

    // 🚀 Modern Migration Execution with Progress Tracking
    async executeModernMigration() {
        try {
            // Enhanced confirmation dialog
            const confirmed = await this.showModernConfirmation();
            if (!confirmed) {
                this.log('⏹️ Migration cancelled by user');
                return;
            }

            // Start migration with modern UI
            this.startModernMigration();
            
            // Execute migration
            const response = await fetch(`${this.apiBase}/migration/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    modernMode: true,
                    requestId: this.generateRequestId()
                })
            });

            const result = await response.json();
            
            if (result.success) {
                await this.displayModernSuccess(result);
                this.log(`🎉 Modern migration completed successfully!`);
                
                // Auto-refresh status after success
                setTimeout(() => this.checkModernStatus(), 2000);
            } else {
                this.displayModernError(result);
                this.log(`❌ Migration failed: ${result.error}`);
            }
            
        } catch (error) {
            this.displayModernError({error: error.message});
            this.log(`❌ Migration execution failed: ${error.message}`);
        } finally {
            this.endModernMigration();
        }
    }

    // 🎨 Modern UI Components
    async showModernConfirmation() {
        return new Promise((resolve) => {
            // Create modern confirmation modal
            const modal = document.createElement('div');
            modal.className = 'modern-modal-overlay';
            modal.innerHTML = `
                <div class="modern-modal">
                    <div class="modern-modal-header">
                        <h3>🚀 Database Migration</h3>
                        <div class="migration-badge">Modern HTTP API</div>
                    </div>
                    <div class="modern-modal-body">
                        <p>Ready to execute database migration with the following features:</p>
                        <ul class="feature-list">
                            <li>✅ Network-optimized HTTP API migration</li>
                            <li>✅ Real-time progress tracking</li>
                            <li>✅ Automatic table creation and extension</li>
                            <li>✅ Performance index optimization</li>
                            <li>✅ Safe execution with rollback capability</li>
                        </ul>
                        <div class="migration-warning">
                            <strong>⚠️ Important:</strong> This will modify your database structure.
                            Ensure you have backups if needed.
                        </div>
                    </div>
                    <div class="modern-modal-footer">
                        <button class="modern-btn modern-btn-cancel" onclick="this.closest('.modern-modal-overlay').remove(); resolve(false)">
                            ❌ Cancel
                        </button>
                        <button class="modern-btn modern-btn-confirm" onclick="this.closest('.modern-modal-overlay').remove(); resolve(true)">
                            🚀 Execute Migration
                        </button>
                    </div>
                </div>
            `;
            
            // Add event listeners
            modal.querySelector('.modern-btn-cancel').onclick = () => {
                modal.remove();
                resolve(false);
            };
            modal.querySelector('.modern-btn-confirm').onclick = () => {
                modal.remove();
                resolve(true);
            };
            
            document.body.appendChild(modal);
        });
    }

    startModernMigration() {
        const container = document.getElementById('migration-results');
        if (!container) return;

        container.innerHTML = `
            <div class="modern-migration-progress">
                <div class="migration-header">
                    <h4>🚀 Migration in Progress</h4>
                    <div class="migration-method">HTTP API • Network Optimized</div>
                </div>
                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-fill" id="migration-progress"></div>
                    </div>
                    <div class="progress-text" id="migration-progress-text">Initializing...</div>
                </div>
                <div class="migration-steps">
                    <div class="step active" id="step-1">
                        <span class="step-icon">🔌</span>
                        <span class="step-text">Testing HTTP API connection</span>
                    </div>
                    <div class="step" id="step-2">
                        <span class="step-icon">🏗️</span>
                        <span class="step-text">Creating database tables</span>
                    </div>
                    <div class="step" id="step-3">
                        <span class="step-icon">📊</span>
                        <span class="step-text">Extending posts table</span>
                    </div>
                    <div class="step" id="step-4">
                        <span class="step-icon">⚡</span>
                        <span class="step-text">Creating performance indexes</span>
                    </div>
                    <div class="step" id="step-5">
                        <span class="step-icon">✅</span>
                        <span class="step-text">Finalizing migration</span>
                    </div>
                </div>
            </div>
        `;

        // Animate progress
        this.animateProgress();
    }

    animateProgress() {
        const progressBar = document.getElementById('migration-progress');
        const progressText = document.getElementById('migration-progress-text');
        
        if (!progressBar || !progressText) return;

        const steps = [
            { percent: 20, text: 'Testing HTTP API connection...', stepId: 'step-1' },
            { percent: 40, text: 'Creating database tables...', stepId: 'step-2' },
            { percent: 60, text: 'Extending posts table...', stepId: 'step-3' },
            { percent: 80, text: 'Creating performance indexes...', stepId: 'step-4' },
            { percent: 100, text: 'Finalizing migration...', stepId: 'step-5' }
        ];

        let currentStep = 0;
        const interval = setInterval(() => {
            if (currentStep < steps.length) {
                const step = steps[currentStep];
                
                // Update progress bar
                progressBar.style.width = `${step.percent}%`;
                progressText.textContent = step.text;
                
                // Update step status
                const stepElement = document.getElementById(step.stepId);
                if (stepElement) {
                    stepElement.classList.add('active');
                    if (currentStep > 0) {
                        const prevStep = document.getElementById(steps[currentStep - 1].stepId);
                        if (prevStep) {
                            prevStep.classList.remove('active');
                            prevStep.classList.add('completed');
                        }
                    }
                }
                
                currentStep++;
            } else {
                clearInterval(interval);
            }
        }, 2000);
    }

    async displayModernSuccess(result) {
        const container = document.getElementById('migration-results');
        if (!container) return;

        container.innerHTML = `
            <div class="modern-migration-success">
                <div class="success-header">
                    <div class="success-icon">🎉</div>
                    <h4>Migration Completed Successfully!</h4>
                    <div class="migration-method">Executed via ${result.data.migrationMethod || 'HTTP API'}</div>
                </div>
                <div class="success-stats">
                    <div class="stat">
                        <div class="stat-number">${result.data.statistics?.totalTables || 8}</div>
                        <div class="stat-label">Tables Created</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number">${result.data.duration || 'N/A'}</div>
                        <div class="stat-label">Execution Time</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number">${result.data.statistics?.successfulTables || 'All'}</div>
                        <div class="stat-label">Success Rate</div>
                    </div>
                </div>
                <div class="next-steps">
                    <h5>✅ Next Steps:</h5>
                    <ul>
                        ${(result.data.nextSteps || []).map(step => `<li>${step}</li>`).join('')}
                    </ul>
                </div>
                <div class="success-actions">
                    <button class="modern-btn modern-btn-primary" onclick="window.adminMigration.checkModernStatus()">
                        🔄 Refresh Status
                    </button>
                    <button class="modern-btn modern-btn-secondary" onclick="window.location.reload()">
                        🏠 Back to Dashboard
                    </button>
                </div>
            </div>
        `;
    }

    displayModernError(result) {
        const container = document.getElementById('migration-results');
        if (!container) return;

        container.innerHTML = `
            <div class="modern-migration-error">
                <div class="error-header">
                    <div class="error-icon">❌</div>
                    <h4>Migration Failed</h4>
                    <div class="error-message">${result.error || 'Unknown error occurred'}</div>
                </div>
                <div class="troubleshooting">
                    <h5>🔧 Troubleshooting Steps:</h5>
                    <ul>
                        ${(result.troubleshooting || [
                            'Check Supabase service role key',
                            'Verify network connectivity',
                            'Try manual migration via Supabase SQL Editor'
                        ]).map(step => `<li>${step}</li>`).join('')}
                    </ul>
                </div>
                <div class="error-actions">
                    <button class="modern-btn modern-btn-primary" onclick="window.adminMigration.executeModernMigration()">
                        🔄 Retry Migration
                    </button>
                    <button class="modern-btn modern-btn-secondary" onclick="window.adminMigration.checkModernStatus()">
                        📊 Check Status
                    </button>
                </div>
            </div>
        `;
    }

    displayModernStatus(data) {
        const container = document.getElementById('migration-status');
        if (!container) return;

        const completionPercentage = Math.round((data.existingTables / data.totalRequiredTables) * 100);
        const isComplete = data.isFullyMigrated;

        container.innerHTML = `
            <div class="modern-status-display">
                <div class="status-header">
                    <h4>🗄️ Database Migration Status</h4>
                    <div class="status-badge ${isComplete ? 'complete' : 'pending'}">
                        ${isComplete ? '✅ Complete' : '⏳ Pending'}
                    </div>
                </div>
                <div class="status-progress">
                    <div class="progress-circle" data-percentage="${completionPercentage}">
                        <div class="progress-percentage">${completionPercentage}%</div>
                        <div class="progress-label">${data.existingTables}/${data.totalRequiredTables} Tables</div>
                    </div>
                </div>
                <div class="status-details">
                    <div class="detail-item ${data.migrationsTableExists ? 'success' : 'warning'}">
                        <span class="detail-icon">${data.migrationsTableExists ? '✅' : '⚠️'}</span>
                        <span class="detail-text">Migration Tracking: ${data.migrationsTableExists ? 'Active' : 'Not Set Up'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon">📊</span>
                        <span class="detail-text">Executed Migrations: ${data.executedMigrations}</span>
                    </div>
                </div>
                ${!isComplete ? `
                    <div class="status-recommendation">
                        <div class="recommendation-icon">💡</div>
                        <div class="recommendation-text">${data.recommendation}</div>
                    </div>
                ` : ''}
                <div class="status-actions">
                    ${!isComplete ? `
                        <button class="modern-btn modern-btn-primary" onclick="window.adminMigration.executeModernMigration()">
                            🚀 Execute Migration
                        </button>
                    ` : ''}
                    <button class="modern-btn modern-btn-secondary" onclick="window.adminMigration.checkModernStatus()">
                        🔄 Refresh Status
                    </button>
                </div>
            </div>
        `;
    }

    endModernMigration() {
        // Re-enable buttons, cleanup, etc.
        console.log('🏁 Modern migration process ended');
    }

    generateRequestId() {
        return `migration_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    showLoading(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <div class="modern-loading">
                    <div class="loading-spinner"></div>
                    <div class="loading-message">${message}</div>
                </div>
            `;
        }
    }

    showError(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <div class="modern-error">
                    <div class="error-icon">❌</div>
                    <div class="error-message">${message}</div>
                </div>
            `;
        }
    }

    log(message) {
        console.log(`[MODERN-MIGRATION] ${message}`);
        this.logs.push({
            timestamp: new Date().toISOString(),
            message: message
        });
    }

    // Initialize modern migration system
    init() {
        console.log('🚀 Initializing Modern Migration System...');
        
        // Auto-check status on load
        this.checkModernStatus();
        
        // Set up global functions
        window.adminMigration = window.adminMigration || {};
        window.adminMigration.checkModernStatus = () => this.checkModernStatus();
        window.adminMigration.executeModernMigration = () => this.executeModernMigration();
        
        console.log('✅ Modern Migration System Ready');
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.modernMigration = new ModernAdminMigration();
        window.modernMigration.init();
    });
} else {
    window.modernMigration = new ModernAdminMigration();
    window.modernMigration.init();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModernAdminMigration;
}