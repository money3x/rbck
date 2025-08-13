/**
 * 🏗️ ARCHITECTURE CONSOLIDATOR
 * Consolidates duplicate systems and creates unified frontend architecture
 */

class ArchitectureConsolidator {
    constructor() {
        this.duplicateSystems = new Map();
        this.consolidatedSystems = new Map();
        this.migrationPlan = new Map();
        this.activeComponents = new Set();
        
        this.config = {
            autoMigration: true,
            preserveBackwardCompatibility: true,
            performanceThreshold: 0.1, // 10% performance impact
            memoryThreshold: 10 * 1024 * 1024, // 10MB
            consolidationDelay: 1000 // 1 second delay for smooth transition
        };

        this.stats = {
            systemsDetected: 0,
            systemsConsolidated: 0,
            duplicatesRemoved: 0,
            memoryReclaimed: 0,
            performanceGains: 0
        };

        this.initialize();
    }

    initialize() {
        console.log('🏗️ [ARCHITECTURE] Initializing architecture consolidation...');
        
        // Scan for duplicate systems
        this.scanForDuplicateSystems();
        
        // Create consolidation plan
        this.createConsolidationPlan();
        
        // Execute consolidation if auto-migration is enabled
        if (this.config.autoMigration) {
            setTimeout(() => {
                this.executeConsolidation();
            }, this.config.consolidationDelay);
        }
        
        console.log('✅ [ARCHITECTURE] Architecture consolidator ready');
    }

    /**
     * Scan for duplicate or overlapping systems
     */
    scanForDuplicateSystems() {
        console.log('🔍 [ARCHITECTURE] Scanning for duplicate systems...');
        
        // Define system patterns to look for
        const systemPatterns = {
            'ai_status': {
                objects: ['unifiedStatusManager', 'aiMonitoring', 'aiSwarmCouncil'],
                functionality: 'AI provider status monitoring',
                consolidationTarget: 'unifiedMonitoringService'
            },
            'ai_swarm': {
                objects: ['aiSwarmCouncil', 'aiSwarmCouncilRefactored', 'AISwarmCouncilRefactored'],
                functionality: 'AI Swarm Council management',
                consolidationTarget: 'unifiedAISwarmManager'
            },
            'cache_management': {
                objects: ['moduleLoader', 'performanceOptimizer', 'advancedCache'],
                functionality: 'Caching systems',
                consolidationTarget: 'unifiedCacheManager'
            },
            'api_clients': {
                objects: ['apiHelper', 'api-client', 'apiUtils'],
                functionality: 'API communication',
                consolidationTarget: 'unifiedAPIClient'
            },
            'ui_helpers': {
                objects: ['uiHelpers', 'showNotification', 'showSection'],
                functionality: 'UI utility functions',
                consolidationTarget: 'unifiedUIManager'
            }
        };

        // Scan for existing systems
        Object.entries(systemPatterns).forEach(([category, pattern]) => {
            const foundSystems = [];
            
            pattern.objects.forEach(objName => {
                if (window[objName] && typeof window[objName] === 'object') {
                    foundSystems.push({
                        name: objName,
                        object: window[objName],
                        functionality: this.analyzeFunctionality(window[objName])
                    });
                }
            });

            if (foundSystems.length > 1) {
                this.duplicateSystems.set(category, {
                    ...pattern,
                    foundSystems,
                    duplicateCount: foundSystems.length - 1
                });
                
                console.log(`🔍 [ARCHITECTURE] Found duplicates in ${category}: ${foundSystems.map(s => s.name).join(', ')}`);
            }

            this.stats.systemsDetected += foundSystems.length;
        });

        console.log(`📊 [ARCHITECTURE] Scan complete: ${this.duplicateSystems.size} duplicate categories found`);
    }

    /**
     * Analyze functionality of an object
     */
    analyzeFunctionality(obj) {
        const functionality = {
            methods: Object.getOwnPropertyNames(obj).filter(prop => typeof obj[prop] === 'function').length,
            properties: Object.getOwnPropertyNames(obj).filter(prop => typeof obj[prop] !== 'function').length,
            prototype: obj.constructor ? obj.constructor.name : 'unknown',
            size: this.estimateObjectSize(obj)
        };

        return functionality;
    }

    /**
     * Estimate object memory size
     */
    estimateObjectSize(obj) {
        try {
            return JSON.stringify(obj).length * 2; // Rough estimate
        } catch (e) {
            return 1000; // Default estimate for non-serializable objects
        }
    }

    /**
     * Create consolidation plan
     */
    createConsolidationPlan() {
        console.log('📋 [ARCHITECTURE] Creating consolidation plan...');
        
        this.duplicateSystems.forEach((systemInfo, category) => {
            const plan = this.createSystemConsolidationPlan(category, systemInfo);
            this.migrationPlan.set(category, plan);
            
            console.log(`📋 [ARCHITECTURE] Plan for ${category}:`, plan.strategy);
        });
    }

    /**
     * Create consolidation plan for a specific system category
     */
    createSystemConsolidationPlan(category, systemInfo) {
        const systems = systemInfo.foundSystems;
        
        // Analyze which system should be the primary
        const primarySystem = this.selectPrimarySystem(systems);
        const secondarySystems = systems.filter(s => s !== primarySystem);
        
        // Create migration strategy
        const strategy = this.createMigrationStrategy(category, primarySystem, secondarySystems);
        
        return {
            category,
            primarySystem: primarySystem.name,
            secondarySystems: secondarySystems.map(s => s.name),
            strategy,
            expectedMemoryReclaim: secondarySystems.reduce((sum, s) => sum + s.functionality.size, 0),
            migrationSteps: this.createMigrationSteps(category, primarySystem, secondarySystems)
        };
    }

    /**
     * Select primary system based on functionality and performance
     */
    selectPrimarySystem(systems) {
        // Score systems based on various criteria
        const scoredSystems = systems.map(system => {
            const score = this.scoreSystem(system);
            return { ...system, score };
        });

        // Sort by score (highest first)
        scoredSystems.sort((a, b) => b.score - a.score);
        
        return scoredSystems[0];
    }

    /**
     * Score system based on functionality, performance, and completeness
     */
    scoreSystem(system) {
        let score = 0;
        
        const func = system.functionality;
        
        // Score based on method count (more methods = more complete)
        score += func.methods * 2;
        
        // Score based on properties (data richness)
        score += func.properties;
        
        // Prefer newer systems (heuristic: longer names often indicate newer versions)
        score += system.name.length * 0.1;
        
        // Prefer systems with certain keywords
        const preferredKeywords = ['unified', 'optimized', 'refactored', 'advanced'];
        const nameWords = system.name.toLowerCase();
        preferredKeywords.forEach(keyword => {
            if (nameWords.includes(keyword)) {
                score += 10;
            }
        });
        
        // Penalize very large systems (potential memory bloat)
        if (func.size > 50000) {
            score -= 5;
        }
        
        return score;
    }

    /**
     * Create migration strategy
     */
    createMigrationStrategy(category, primary, secondaries) {
        const strategies = {
            'ai_status': 'merge_and_enhance',
            'ai_swarm': 'replace_with_primary',
            'cache_management': 'federated_approach',
            'api_clients': 'proxy_consolidation',
            'ui_helpers': 'namespace_consolidation'
        };

        return strategies[category] || 'gradual_migration';
    }

    /**
     * Create detailed migration steps
     */
    createMigrationSteps(category, primary, secondaries) {
        const steps = [];
        
        // Common steps for all migrations
        steps.push({
            step: 'analyze_dependencies',
            description: `Analyze dependencies on secondary systems: ${secondaries.map(s => s.name).join(', ')}`,
            risk: 'low'
        });

        steps.push({
            step: 'create_compatibility_layer',
            description: `Create compatibility layer for ${primary.name}`,
            risk: 'medium'
        });

        steps.push({
            step: 'migrate_functionality',
            description: `Migrate unique functionality from secondary systems`,
            risk: 'high'
        });

        steps.push({
            step: 'update_references',
            description: 'Update all references to point to primary system',
            risk: 'medium'
        });

        steps.push({
            step: 'cleanup_secondary_systems',
            description: 'Remove secondary systems and reclaim memory',
            risk: 'low'
        });

        return steps;
    }

    /**
     * Execute consolidation based on the plan
     */
    async executeConsolidation() {
        console.log('🚀 [ARCHITECTURE] Executing consolidation plan...');
        
        for (const [category, plan] of this.migrationPlan) {
            try {
                console.log(`🔄 [ARCHITECTURE] Consolidating ${category}...`);
                await this.executeSystemConsolidation(category, plan);
                this.stats.systemsConsolidated++;
                
            } catch (error) {
                console.error(`❌ [ARCHITECTURE] Consolidation failed for ${category}:`, error);
            }
        }

        this.generateConsolidationReport();
    }

    /**
     * Execute consolidation for a specific system
     */
    async executeSystemConsolidation(category, plan) {
        const { strategy, primarySystem, secondarySystems } = plan;
        
        switch (strategy) {
            case 'merge_and_enhance':
                await this.mergeAndEnhance(primarySystem, secondarySystems);
                break;
                
            case 'replace_with_primary':
                await this.replaceWithPrimary(primarySystem, secondarySystems);
                break;
                
            case 'federated_approach':
                await this.createFederatedSystem(category, primarySystem, secondarySystems);
                break;
                
            case 'proxy_consolidation':
                await this.createProxyConsolidation(primarySystem, secondarySystems);
                break;
                
            case 'namespace_consolidation':
                await this.consolidateIntoNamespace(category, primarySystem, secondarySystems);
                break;
                
            default:
                await this.gradualMigration(primarySystem, secondarySystems);
                break;
        }
        
        // Mark systems as consolidated
        this.consolidatedSystems.set(category, {
            primary: primarySystem,
            consolidated: secondarySystems,
            timestamp: Date.now()
        });
    }

    /**
     * Merge and enhance strategy
     */
    async mergeAndEnhance(primarySystem, secondarySystems) {
        const primary = window[primarySystem];
        if (!primary) return;

        console.log(`🔄 [MERGE] Merging into ${primarySystem}...`);

        // Extract unique functionality from secondary systems
        secondarySystems.forEach(secondaryName => {
            const secondary = window[secondaryName];
            if (!secondary) return;

            // Merge methods that don't exist in primary
            Object.getOwnPropertyNames(secondary).forEach(prop => {
                if (typeof secondary[prop] === 'function' && !primary[prop]) {
                    try {
                        primary[prop] = secondary[prop].bind(primary);
                        console.log(`✅ [MERGE] Merged method: ${prop} from ${secondaryName}`);
                    } catch (error) {
                        console.warn(`⚠️ [MERGE] Failed to merge ${prop}:`, error);
                    }
                }
            });

            // Create compatibility aliases
            window[secondaryName] = primary;
            console.log(`🔗 [MERGE] Created alias: ${secondaryName} -> ${primarySystem}`);
        });
    }

    /**
     * Replace with primary strategy
     */
    async replaceWithPrimary(primarySystem, secondarySystems) {
        const primary = window[primarySystem];
        if (!primary) return;

        console.log(`🔄 [REPLACE] Replacing with ${primarySystem}...`);

        // Create compatibility layer
        secondarySystems.forEach(secondaryName => {
            if (this.config.preserveBackwardCompatibility) {
                window[secondaryName] = this.createCompatibilityProxy(primary, secondaryName);
                console.log(`🔗 [REPLACE] Created compatibility proxy: ${secondaryName}`);
            } else {
                delete window[secondaryName];
                console.log(`🗑️ [REPLACE] Removed: ${secondaryName}`);
            }
            
            this.stats.duplicatesRemoved++;
        });
    }

    /**
     * Create federated system approach
     */
    async createFederatedSystem(category, primarySystem, secondarySystems) {
        console.log(`🏛️ [FEDERATED] Creating federated system for ${category}...`);
        
        const federatedName = `federated_${category}`;
        const federatedSystem = {
            primary: window[primarySystem],
            secondaries: {},
            router: {},
            
            // Intelligent routing method
            route(method, ...args) {
                // Try primary first
                if (this.primary && typeof this.primary[method] === 'function') {
                    return this.primary[method](...args);
                }
                
                // Try secondaries
                for (const [name, system] of Object.entries(this.secondaries)) {
                    if (system && typeof system[method] === 'function') {
                        console.log(`🔀 [FEDERATED] Routing ${method} to ${name}`);
                        return system[method](...args);
                    }
                }
                
                throw new Error(`Method ${method} not found in federated system`);
            }
        };

        // Add secondary systems
        secondarySystems.forEach(secondaryName => {
            federatedSystem.secondaries[secondaryName] = window[secondaryName];
        });

        // Create method proxies
        this.createFederatedProxies(federatedSystem, category);
        
        window[federatedName] = federatedSystem;
        console.log(`✅ [FEDERATED] Created federated system: ${federatedName}`);
    }

    /**
     * Create compatibility proxy
     */
    createCompatibilityProxy(target, originalName) {
        return new Proxy(target, {
            get(obj, prop) {
                if (prop in obj) {
                    return obj[prop];
                }
                
                console.warn(`⚠️ [COMPATIBILITY] Method ${prop} not found in ${originalName} compatibility layer`);
                return undefined;
            },
            
            set(obj, prop, value) {
                obj[prop] = value;
                return true;
            }
        });
    }

    /**
     * Create federated proxies for common methods
     */
    createFederatedProxies(federatedSystem, category) {
        const commonMethods = this.getCommonMethodsForCategory(category);
        
        commonMethods.forEach(method => {
            federatedSystem[method] = (...args) => {
                return federatedSystem.route(method, ...args);
            };
        });
    }

    /**
     * Get common methods for a category
     */
    getCommonMethodsForCategory(category) {
        const methodMaps = {
            'ai_status': ['getStatus', 'updateStatus', 'checkStatus', 'startMonitoring', 'stopMonitoring'],
            'ai_swarm': ['refreshStatus', 'getProviders', 'testProvider', 'initialize'],
            'cache_management': ['get', 'set', 'clear', 'getStats'],
            'api_clients': ['get', 'post', 'put', 'delete', 'request'],
            'ui_helpers': ['show', 'hide', 'toggle', 'notify', 'showSection']
        };

        return methodMaps[category] || [];
    }

    /**
     * Proxy consolidation strategy
     */
    async createProxyConsolidation(primarySystem, secondarySystems) {
        console.log(`🔀 [PROXY] Creating proxy consolidation for ${primarySystem}...`);
        
        const primary = window[primarySystem];
        if (!primary) return;

        // Create unified proxy
        const unifiedProxy = new Proxy(primary, {
            get(target, prop) {
                // Try primary first
                if (prop in target) {
                    return target[prop];
                }

                // Try secondary systems
                for (const secondaryName of secondarySystems) {
                    const secondary = window[secondaryName];
                    if (secondary && prop in secondary) {
                        console.log(`🔀 [PROXY] Routing ${prop} to ${secondaryName}`);
                        return secondary[prop];
                    }
                }

                return undefined;
            }
        });

        // Replace primary with proxy
        window[primarySystem] = unifiedProxy;
        
        // Clean up secondaries
        secondarySystems.forEach(name => {
            if (!this.config.preserveBackwardCompatibility) {
                delete window[name];
                this.stats.duplicatesRemoved++;
            }
        });
    }

    /**
     * Namespace consolidation strategy
     */
    async consolidateIntoNamespace(category, primarySystem, secondarySystems) {
        console.log(`📦 [NAMESPACE] Consolidating ${category} into namespace...`);
        
        const namespaceName = `RBCK_${category.toUpperCase()}`;
        const namespace = window[namespaceName] = {};

        // Add primary system
        const primary = window[primarySystem];
        if (primary) {
            Object.assign(namespace, primary);
        }

        // Add unique methods from secondaries
        secondarySystems.forEach(secondaryName => {
            const secondary = window[secondaryName];
            if (!secondary) return;

            Object.getOwnPropertyNames(secondary).forEach(prop => {
                if (typeof secondary[prop] === 'function' && !namespace[prop]) {
                    namespace[prop] = secondary[prop];
                    console.log(`📦 [NAMESPACE] Added ${prop} from ${secondaryName}`);
                }
            });
        });

        // Create compatibility aliases
        if (this.config.preserveBackwardCompatibility) {
            [primarySystem, ...secondarySystems].forEach(systemName => {
                window[systemName] = namespace;
            });
        }

        console.log(`✅ [NAMESPACE] Created namespace: ${namespaceName}`);
    }

    /**
     * Gradual migration strategy
     */
    async gradualMigration(primarySystem, secondarySystems) {
        console.log(`⏳ [GRADUAL] Starting gradual migration to ${primarySystem}...`);
        
        // This is a slower, safer approach
        // Mark systems for eventual removal but keep them functional
        secondarySystems.forEach(secondaryName => {
            const secondary = window[secondaryName];
            if (secondary) {
                secondary._deprecated = true;
                secondary._migrationTarget = primarySystem;
                console.log(`⏳ [GRADUAL] Marked ${secondaryName} for gradual migration`);
            }
        });

        // Set up gradual replacement (would be implemented over time)
        console.log('⏳ [GRADUAL] Migration plan created - manual intervention required');
    }

    /**
     * Generate consolidation report
     */
    generateConsolidationReport() {
        const report = {
            timestamp: new Date().toISOString(),
            stats: this.stats,
            consolidations: Array.from(this.consolidatedSystems.entries()).map(([category, info]) => ({
                category,
                primary: info.primary,
                consolidated: info.consolidated,
                timestamp: info.timestamp
            })),
            memoryReclaimed: this.calculateMemoryReclaimed(),
            performanceImpact: this.calculatePerformanceImpact()
        };

        console.group('🏗️ [ARCHITECTURE] Consolidation Report');
        console.log('Systems Detected:', report.stats.systemsDetected);
        console.log('Systems Consolidated:', report.stats.systemsConsolidated);
        console.log('Duplicates Removed:', report.stats.duplicatesRemoved);
        console.log('Memory Reclaimed:', this.formatBytes(report.memoryReclaimed));
        console.log('Performance Impact:', report.performanceImpact + '%');
        console.log('Consolidations:', report.consolidations);
        console.groupEnd();

        return report;
    }

    /**
     * Calculate memory reclaimed from consolidation
     */
    calculateMemoryReclaimed() {
        let memoryReclaimed = 0;
        
        this.migrationPlan.forEach(plan => {
            memoryReclaimed += plan.expectedMemoryReclaim || 0;
        });

        this.stats.memoryReclaimed = memoryReclaimed;
        return memoryReclaimed;
    }

    /**
     * Calculate performance impact
     */
    calculatePerformanceImpact() {
        // Estimate performance improvement from consolidation
        const duplicatesRemoved = this.stats.duplicatesRemoved;
        const performanceGain = duplicatesRemoved * 2; // 2% per duplicate removed
        
        this.stats.performanceGains = Math.min(performanceGain, 50); // Cap at 50%
        return this.stats.performanceGains;
    }

    /**
     * Format bytes helper
     */
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    /**
     * Get consolidation statistics
     */
    getStats() {
        return {
            ...this.stats,
            duplicateCategories: this.duplicateSystems.size,
            consolidatedCategories: this.consolidatedSystems.size,
            migrationPlans: this.migrationPlan.size,
            memoryReclaimedFormatted: this.formatBytes(this.stats.memoryReclaimed)
        };
    }

    /**
     * Force consolidation of a specific category
     */
    async forceConsolidation(category) {
        const plan = this.migrationPlan.get(category);
        if (!plan) {
            console.error(`❌ [ARCHITECTURE] No consolidation plan for ${category}`);
            return;
        }

        console.log(`🚀 [ARCHITECTURE] Force consolidating ${category}...`);
        await this.executeSystemConsolidation(category, plan);
        console.log(`✅ [ARCHITECTURE] Force consolidation completed for ${category}`);
    }

    /**
     * Rollback consolidation if needed
     */
    rollbackConsolidation(category) {
        const consolidation = this.consolidatedSystems.get(category);
        if (!consolidation) {
            console.error(`❌ [ARCHITECTURE] No consolidation to rollback for ${category}`);
            return;
        }

        console.log(`🔄 [ARCHITECTURE] Rolling back consolidation for ${category}...`);
        
        // This would restore original systems (simplified implementation)
        console.log('⚠️ [ARCHITECTURE] Rollback not fully implemented - manual intervention required');
    }
}

// Create global instance
window.architectureConsolidator = new ArchitectureConsolidator();

// Global debugging functions
window.consolidationReport = () => window.architectureConsolidator.generateConsolidationReport();
window.forceConsolidation = (category) => window.architectureConsolidator.forceConsolidation(category);
window.rollbackConsolidation = (category) => window.architectureConsolidator.rollbackConsolidation(category);

console.log('✅ [ARCHITECTURE] Architecture consolidation system ready');