/**
 * 🏗️ Micro-Frontend Architecture Configuration
 * Module Federation setup for scalable frontend architecture
 */

const ModuleFederationPlugin = require('@module-federation/webpack');

const microFrontendConfig = {
    // Shell application (main host)
    shell: {
        name: 'shell',
        filename: 'remoteEntry.js',
        exposes: {
            './Shell': './js/app-controller.js',
            './ThemeManager': './js/services/theme-manager.js',
            './SecurityFramework': './js/services/security-framework.js'
        },
        shared: {
            react: { singleton: true, eager: true },
            'react-dom': { singleton: true, eager: true }
        }
    },

    // AI Chat Module
    aiChat: {
        name: 'aiChatModule',
        filename: 'remoteEntry.js',
        exposes: {
            './ChatInterface': './js/components/chat-interface.js',
            './AIProviders': './js/services/ai-providers.js'
        },
        remotes: {
            shell: 'shell@http://localhost:3001/remoteEntry.js'
        },
        shared: {
            react: { singleton: true },
            'react-dom': { singleton: true }
        }
    },

    // Blog Management Module
    blogModule: {
        name: 'blogModule',
        filename: 'remoteEntry.js',
        exposes: {
            './BlogManager': './blogManager.js',
            './BlogEditor': './js/components/blog-editor.js'
        },
        remotes: {
            shell: 'shell@http://localhost:3001/remoteEntry.js'
        },
        shared: {
            react: { singleton: true },
            'react-dom': { singleton: true }
        }
    },

    // SEO Tools Module
    seoModule: {
        name: 'seoModule',
        filename: 'remoteEntry.js',
        exposes: {
            './SEOTools': './seoTools.js',
            './SEOAnalyzer': './seoAnalyzer.js'
        },
        remotes: {
            shell: 'shell@http://localhost:3001/remoteEntry.js'
        },
        shared: {
            react: { singleton: true },
            'react-dom': { singleton: true }
        }
    },

    // AI Monitoring Module
    aiMonitoring: {
        name: 'aiMonitoringModule',
        filename: 'remoteEntry.js',
        exposes: {
            './AIMonitoring': './aiMonitoring.js',
            './AIMonitoringUI': './aiMonitoringUI.js'
        },
        remotes: {
            shell: 'shell@http://localhost:3001/remoteEntry.js'
        },
        shared: {
            react: { singleton: true },
            'react-dom': { singleton: true }
        }
    }
};

/**
 * Generate webpack config for specific micro-frontend
 */
function generateMicroFrontendConfig(moduleName, isDevelopment = false) {
    const config = microFrontendConfig[moduleName];
    
    if (!config) {
        throw new Error(`Micro-frontend module "${moduleName}" not found`);
    }

    return {
        mode: isDevelopment ? 'development' : 'production',
        
        entry: './index.js',
        
        target: 'web',
        
        devtool: isDevelopment ? 'eval-source-map' : 'source-map',
        
        optimization: {
            minimize: !isDevelopment,
            splitChunks: {
                chunks: 'async'
            }
        },
        
        resolve: {
            extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
            alias: {
                '@': path.resolve(__dirname, 'js'),
                '@components': path.resolve(__dirname, 'js/components'),
                '@services': path.resolve(__dirname, 'js/services'),
                '@utils': path.resolve(__dirname, 'js/utils')
            }
        },
        
        module: {
            rules: [
                {
                    test: /\.jsx?$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                '@babel/preset-env',
                                '@babel/preset-react'
                            ],
                            plugins: [
                                '@babel/plugin-syntax-dynamic-import'
                            ]
                        }
                    }
                },
                {
                    test: /\.tsx?$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'ts-loader',
                        options: {
                            transpileOnly: true
                        }
                    }
                },
                {
                    test: /\.css$/,
                    use: ['style-loader', 'css-loader', 'postcss-loader']
                },
                {
                    test: /\.(png|jpe?g|gif|svg)$/,
                    type: 'asset/resource'
                }
            ]
        },
        
        plugins: [
            new ModuleFederationPlugin({
                name: config.name,
                filename: config.filename,
                exposes: config.exposes || {},
                remotes: config.remotes || {},
                shared: {
                    ...config.shared,
                    // Common shared dependencies
                    lodash: { singleton: true },
                    moment: { singleton: true }
                }
            }),
            
            new HtmlWebpackPlugin({
                template: './public/index.html',
                title: `${config.name} - RBCK Admin`
            })
        ],
        
        devServer: {
            port: getPortForModule(moduleName),
            hot: true,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            static: {
                directory: path.join(__dirname, 'public')
            }
        }
    };
}

/**
 * Get port for specific module
 */
function getPortForModule(moduleName) {
    const ports = {
        shell: 3001,
        aiChat: 3002,
        blogModule: 3003,
        seoModule: 3004,
        aiMonitoring: 3005
    };
    
    return ports[moduleName] || 3000;
}

/**
 * Development orchestration script
 */
const developmentOrchestration = {
    // Start all micro-frontends in development
    startAll: () => {
        const modules = Object.keys(microFrontendConfig);
        
        console.log('🚀 Starting all micro-frontends...');
        
        modules.forEach(module => {
            const port = getPortForModule(module);
            console.log(`📦 Starting ${module} on port ${port}`);
            
            // In a real setup, this would spawn webpack dev servers
            // For now, just log the configuration
        });
    },
    
    // Generate docker-compose for development
    generateDockerCompose: () => {
        const modules = Object.keys(microFrontendConfig);
        
        const compose = {
            version: '3.8',
            services: {}
        };
        
        modules.forEach(module => {
            const port = getPortForModule(module);
            compose.services[module] = {
                build: {
                    context: `./${module}`,
                    dockerfile: 'Dockerfile.dev'
                },
                ports: [`${port}:${port}`],
                volumes: [
                    `./${module}:/app`,
                    '/app/node_modules'
                ],
                environment: [
                    `NODE_ENV=development`,
                    `PORT=${port}`
                ]
            };
        });
        
        return compose;
    }
};

/**
 * Production deployment configuration
 */
const productionDeployment = {
    // Generate Kubernetes manifests
    generateK8sManifests: () => {
        const modules = Object.keys(microFrontendConfig);
        
        return modules.map(module => ({
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            metadata: {
                name: `rbck-${module}`,
                labels: {
                    app: `rbck-${module}`,
                    component: 'micro-frontend'
                }
            },
            spec: {
                replicas: 2,
                selector: {
                    matchLabels: {
                        app: `rbck-${module}`
                    }
                },
                template: {
                    metadata: {
                        labels: {
                            app: `rbck-${module}`
                        }
                    },
                    spec: {
                        containers: [{
                            name: module,
                            image: `rbck/${module}:latest`,
                            ports: [{
                                containerPort: 80
                            }],
                            resources: {
                                requests: {
                                    memory: '128Mi',
                                    cpu: '100m'
                                },
                                limits: {
                                    memory: '256Mi',
                                    cpu: '200m'
                                }
                            }
                        }]
                    }
                }
            }
        }));
    },
    
    // Generate nginx configuration for micro-frontend routing
    generateNginxConfig: () => {
        const modules = Object.keys(microFrontendConfig);
        
        let config = `
events {
    worker_connections 1024;
}

http {
    upstream shell {
        server shell:80;
    }
`;

        modules.slice(1).forEach(module => {
            config += `
    upstream ${module} {
        server ${module}:80;
    }
`;
        });

        config += `
    server {
        listen 80;
        server_name rbck-admin.com;
        
        # Shell application (main host)
        location / {
            proxy_pass http://shell;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        # Module Federation remote entries
`;

        modules.slice(1).forEach(module => {
            config += `        location /${module}/ {
            proxy_pass http://${module}/;
            proxy_set_header Host $host;
        }
`;
        });

        config += `    }
}`;

        return config;
    }
};

module.exports = {
    microFrontendConfig,
    generateMicroFrontendConfig,
    getPortForModule,
    developmentOrchestration,
    productionDeployment
};