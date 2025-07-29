/**
 * Unified Swarm Council Manager - Refactored Singleton Pattern
 * Manages shared provider pool and eliminates resource duplication
 */

const SwarmCouncil = require('../ai/swarm/SwarmCouncil');
const EATOptimizedSwarmCouncil = require('../ai/swarm/EATOptimizedSwarmCouncil');
const { getInstance: getProviderPool } = require('../ai/providers/pool/ProviderPool');

class SwarmCouncilManager {
    static instance = null;
    static initializationLock = false;
    
    constructor() {
        if (SwarmCouncilManager.instance) {
            return SwarmCouncilManager.instance;
        }
        
        this.swarmCouncil = null;
        this.eatSwarmCouncil = null;
        this.providerPool = null;
        this.isInitialized = false;
        this.isInitializing = false;
        this.initializationPromise = null;
        this.lastInitializationAttempt = null;
        this.initializationErrors = [];
        
        SwarmCouncilManager.instance = this;
        
        console.log('🏛️ [Manager] SwarmCouncilManager initialized with unified architecture');
    }

    /**
     * Get or create SwarmCouncil instance
     */
    getSwarmCouncil() {
        if (!this.swarmCouncil) {
            console.log('🤖 [Manager] Creating SwarmCouncil with shared providers...');
            this.swarmCouncil = new SwarmCouncil({ 
                providerPool: this.providerPool,
                autoInit: false 
            });
        }
        return this.swarmCouncil;
    }

    /**
     * Get or create EATOptimizedSwarmCouncil instance
     */
    getEATSwarmCouncil() {
        if (!this.eatSwarmCouncil) {
            console.log('🎯 [Manager] Creating EATOptimizedSwarmCouncil with shared providers...');
            this.eatSwarmCouncil = new EATOptimizedSwarmCouncil({ 
                providerPool: this.providerPool,
                autoInit: false 
            });
        }
        return this.eatSwarmCouncil;
    }

    async initializeCouncils() {
        // Thread-safe initialization
        if (SwarmCouncilManager.initializationLock) {
            console.log('🔒 [Manager] Initialization locked, waiting...');
            while (SwarmCouncilManager.initializationLock) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return this.getInitializedCouncils();
        }

        if (this.isInitialized) {
            console.log('✅ [Manager] Councils already initialized');
            return this.getInitializedCouncils();
        }

        if (this.isInitializing && this.initializationPromise) {
            console.log('⏳ [Manager] Initialization in progress, waiting...');
            return this.initializationPromise;
        }

        SwarmCouncilManager.initializationLock = true;
        this.isInitializing = true;
        this.lastInitializationAttempt = new Date().toISOString();
        this.initializationErrors = [];

        this.initializationPromise = new Promise(async (resolve, reject) => {
            try {
                console.log('🚀 [Manager] Starting unified council initialization...');
                
                // Step 1: Initialize Provider Pool (shared resource)
                console.log('🏊 [Manager] Initializing shared provider pool...');
                this.providerPool = getProviderPool();
                await this.providerPool.initializeProviders();
                
                // Step 2: Create councils with shared provider pool
                console.log('🔧 [Manager] Creating councils with shared providers...');
                this.swarmCouncil = new SwarmCouncil({ 
                    providerPool: this.providerPool,
                    autoInit: false 
                });
                this.eatSwarmCouncil = new EATOptimizedSwarmCouncil({ 
                    providerPool: this.providerPool,
                    autoInit: false 
                });

                // Step 3: Initialize councils (they will use shared providers)
                console.log('🔧 [Manager] Initializing councils with shared state...');
                await Promise.all([
                    this.swarmCouncil.initializeWithSharedPool(),
                    this.eatSwarmCouncil.initializeWithSharedPool()
                ]);

                this.isInitialized = true;
                this.isInitializing = false;
                SwarmCouncilManager.initializationLock = false;

                console.log('✅ [Manager] Unified council system initialized successfully');

                const result = this.getInitializedCouncils();
                resolve(result);
                
            } catch (error) {
                console.error('❌ [Manager] Council initialization failed:', error);
                this.initializationErrors.push(error.message);
                this.isInitializing = false;
                this.isInitialized = false;
                SwarmCouncilManager.initializationLock = false;
                reject(error);
            }
        });

        return this.initializationPromise;
    }

    /**
     * Get initialized councils (helper method)
     * @returns {object}
     */
    getInitializedCouncils() {
        if (!this.isInitialized) {
            throw new Error('Councils not initialized. Call initializeCouncils() first.');
        }
        
        return {
            swarmCouncil: this.swarmCouncil,
            eatSwarmCouncil: this.eatSwarmCouncil,
            providerPool: this.providerPool
        };
    }

    /**
     * Get comprehensive status of unified system
     */
    getStatus() {
        const status = {
            manager: {
                isInitialized: this.isInitialized,
                isInitializing: this.isInitializing,
                lastInitializationAttempt: this.lastInitializationAttempt,
                initializationErrors: this.initializationErrors,
                hasSwarmCouncil: !!this.swarmCouncil,
                hasEATSwarmCouncil: !!this.eatSwarmCouncil,
                hasProviderPool: !!this.providerPool
            },
            providerPool: null,
            swarmCouncil: null,
            eatSwarmCouncil: null,
            systemHealth: 'unknown'
        };

        if (this.providerPool) {
            status.providerPool = this.providerPool.getStatus();
        }

        if (this.swarmCouncil) {
            status.swarmCouncil = this.swarmCouncil.getStatus();
        }

        if (this.eatSwarmCouncil) {
            status.eatSwarmCouncil = this.eatSwarmCouncil.getStatus();
        }

        // Calculate overall system health
        if (this.isInitialized && this.providerPool) {
            const poolStatus = this.providerPool.getStatus();
            const healthyRatio = poolStatus.healthyProviders / poolStatus.totalProviders;
            
            if (healthyRatio >= 0.8) {
                status.systemHealth = 'healthy';
            } else if (healthyRatio >= 0.5) {
                status.systemHealth = 'degraded';
            } else {
                status.systemHealth = 'unhealthy';
            }
        }

        return status;
    }

    /**
     * Perform health checks on all components
     */
    async performHealthChecks() {
        if (!this.isInitialized) {
            return { error: 'System not initialized' };
        }

        console.log('🏥 [Manager] Performing system health checks...');
        
        const healthResults = {
            providerPool: null,
            councils: {
                swarm: null,
                eat: null
            },
            overall: 'unknown',
            timestamp: new Date().toISOString()
        };

        try {
            // Check provider pool health
            if (this.providerPool) {
                healthResults.providerPool = await this.providerPool.performHealthChecks();
            }

            // Check council health
            if (this.swarmCouncil && typeof this.swarmCouncil.performHealthCheck === 'function') {
                healthResults.councils.swarm = await this.swarmCouncil.performHealthCheck();
            }

            if (this.eatSwarmCouncil && typeof this.eatSwarmCouncil.performHealthCheck === 'function') {
                healthResults.councils.eat = await this.eatSwarmCouncil.performHealthCheck();
            }

            // Determine overall health
            const poolHealth = this.providerPool?.getStatus();
            if (poolHealth) {
                const healthyRatio = poolHealth.healthyProviders / poolHealth.totalProviders;
                healthResults.overall = healthyRatio >= 0.8 ? 'healthy' : 
                                       healthyRatio >= 0.5 ? 'degraded' : 'unhealthy';
            }

            console.log(`🏥 [Manager] Health check complete: ${healthResults.overall}`);
            return healthResults;
            
        } catch (error) {
            console.error('❌ [Manager] Health check failed:', error);
            healthResults.overall = 'error';
            healthResults.error = error.message;
            return healthResults;
        }
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        console.log('🧹 [Manager] Cleaning up unified SwarmCouncilManager...');
        
        try {
            // Cleanup councils first
            if (this.swarmCouncil && typeof this.swarmCouncil.cleanup === 'function') {
                await this.swarmCouncil.cleanup();
            }
            
            if (this.eatSwarmCouncil && typeof this.eatSwarmCouncil.cleanup === 'function') {
                await this.eatSwarmCouncil.cleanup();
            }
            
            // Cleanup shared provider pool
            if (this.providerPool && typeof this.providerPool.cleanup === 'function') {
                await this.providerPool.cleanup();
            }
            
            // Reset state
            this.swarmCouncil = null;
            this.eatSwarmCouncil = null;
            this.providerPool = null;
            this.isInitialized = false;
            this.isInitializing = false;
            this.initializationPromise = null;
            this.initializationErrors = [];
            
            console.log('✅ [Manager] Unified cleanup complete');
            
        } catch (error) {
            console.error('❌ [Manager] Cleanup error:', error);
            throw error;
        }
    }

    /**
     * Reset the singleton instance (thread-safe)
     */
    static async reset() {
        SwarmCouncilManager.initializationLock = true;
        
        try {
            if (SwarmCouncilManager.instance) {
                await SwarmCouncilManager.instance.cleanup();
            }
            SwarmCouncilManager.instance = null;
            console.log('🔄 [Manager] SwarmCouncilManager reset complete');
            
        } finally {
            SwarmCouncilManager.initializationLock = false;
        }
    }

    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!SwarmCouncilManager.instance) {
            new SwarmCouncilManager();
        }
        return SwarmCouncilManager.instance;
    }

    /**
     * Initialize all councils (alias for initializeCouncils)
     */
    async initializeAll() {
        return this.initializeCouncils();
    }

    /**
     * Destroy singleton instance
     */
    static destroy() {
        if (SwarmCouncilManager.instance) {
            SwarmCouncilManager.instance.cleanup().catch(console.error);
            SwarmCouncilManager.instance = null;
        }
    }
}

// Export both class and singleton instance getter
module.exports = SwarmCouncilManager;