/**
 * Swarm Council Manager - Singleton Pattern
 * Prevents multiple initialization of AI Swarm Councils
 */

const SwarmCouncil = require('../ai/swarm/SwarmCouncil');
const EATOptimizedSwarmCouncil = require('../ai/swarm/EATOptimizedSwarmCouncil');

class SwarmCouncilManager {
    constructor() {
        this.swarmCouncil = null;
        this.eatSwarmCouncil = null;
        this.isInitializing = false;
        this.initializationPromise = null;
    }

    /**
     * Get or create SwarmCouncil instance (singleton)
     */
    getSwarmCouncil() {
        if (!this.swarmCouncil) {
            console.log('🤖 [Manager] Creating SwarmCouncil singleton instance (no auto-init)...');
            this.swarmCouncil = new SwarmCouncil(false); // Disable auto-init
        }
        return this.swarmCouncil;
    }

    /**
     * Get or create EATOptimizedSwarmCouncil instance (singleton)
     */
    getEATSwarmCouncil() {
        if (!this.eatSwarmCouncil) {
            console.log('🎯 [Manager] Creating EATOptimizedSwarmCouncil singleton instance (no auto-init)...');
            this.eatSwarmCouncil = new EATOptimizedSwarmCouncil(false); // Disable auto-init
        }
        return this.eatSwarmCouncil;
    }

    /**
     * Initialize both councils (called once during server startup)
     */
    async initializeAll() {
        if (this.isInitializing) {
            console.log('🔄 [Manager] Councils already initializing, waiting...');
            return this.initializationPromise;
        }

        if (this.swarmCouncil && this.eatSwarmCouncil) {
            console.log('✅ [Manager] Councils already initialized');
            return {
                swarmCouncil: this.swarmCouncil,
                eatSwarmCouncil: this.eatSwarmCouncil
            };
        }

        console.log('🚀 [Manager] Starting council initialization...');
        this.isInitializing = true;

        this.initializationPromise = new Promise(async (resolve, reject) => {
            try {
                // Create councils without auto-init
                console.log('🔧 [Manager] Creating councils...');
                this.swarmCouncil = new SwarmCouncil(false);
                this.eatSwarmCouncil = new EATOptimizedSwarmCouncil(false);

                // Manual initialization with proper async handling
                console.log('🔧 [Manager] Starting manual initialization...');
                await this.swarmCouncil.initializeSwarm();
                await this.eatSwarmCouncil.initializeEATSwarm();

                console.log('✅ [Manager] All councils initialized successfully');
                this.isInitializing = false;

                resolve({
                    swarmCouncil: this.swarmCouncil,
                    eatSwarmCouncil: this.eatSwarmCouncil
                });
            } catch (error) {
                console.error('❌ [Manager] Council initialization failed:', error);
                this.isInitializing = false;
                reject(error);
            }
        });

        return this.initializationPromise;
    }

    /**
     * Get status of both councils
     */
    getStatus() {
        return {
            swarmCouncil: {
                exists: !!this.swarmCouncil,
                initialized: this.swarmCouncil?.isInitialized || false
            },
            eatSwarmCouncil: {
                exists: !!this.eatSwarmCouncil,
                initialized: this.eatSwarmCouncil?.isInitialized || false
            },
            manager: {
                isInitializing: this.isInitializing
            }
        };
    }

    /**
     * Cleanup resources
     */
    destroy() {
        console.log('🗑️ [Manager] Cleaning up councils...');
        
        if (this.swarmCouncil && typeof this.swarmCouncil.destroy === 'function') {
            this.swarmCouncil.destroy();
        }
        
        if (this.eatSwarmCouncil && typeof this.eatSwarmCouncil.destroy === 'function') {
            this.eatSwarmCouncil.destroy();
        }
        
        this.swarmCouncil = null;
        this.eatSwarmCouncil = null;
        this.isInitializing = false;
        this.initializationPromise = null;
    }
}

// Create singleton instance
const swarmCouncilManager = new SwarmCouncilManager();

module.exports = swarmCouncilManager;