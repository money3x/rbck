const ProviderFactory = require('./factory/ProviderFactory');
const { 
    providersConfig, 
    getEnabledProviders, 
    getProviderConfig, 
    getDefaultProvider 
} = require('./config/providers.config');

// Export main functionality
module.exports = {
    ProviderFactory,
    providersConfig,
    getEnabledProviders,
    getProviderConfig,
    getDefaultProvider,
    
    // Convenience methods
    createProvider: (providerName) => ProviderFactory.createProvider(providerName),
    getAvailableProviders: () => ProviderFactory.getAvailableProviders(),
    testProvider: (providerName) => ProviderFactory.testProvider(providerName),
    testAllProviders: () => ProviderFactory.testAllProviders()
};
