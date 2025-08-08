// backend/supabaseClient.js
const { createClient } = require('@supabase/supabase-js');
const config = require('./config/config');

// Logger for database operations
const logger = {
    info: (message, data = null) => {
        console.log(`ℹ️ [Supabase] ${message}`, data ? `\n   Data: ${JSON.stringify(data, null, 2)}` : '');
    },
    warn: (message, data = null) => {
        console.warn(`⚠️ [Supabase] ${message}`, data ? `\n   Data: ${JSON.stringify(data, null, 2)}` : '');
    },
    error: (message, error = null) => {
        console.error(`❌ [Supabase] ${message}`, error ? `\n   Error: ${error.stack || error.message || error}` : '');
    },
    success: (message, data = null) => {
        console.log(`✅ [Supabase] ${message}`, data ? `\n   Data: ${JSON.stringify(data, null, 2)}` : '');
    }
};

// Use configuration from config.js
const supabaseUrl = config.database.supabaseUrl;
const supabaseKey = config.database.supabaseKey;

let supabase;
let isSupabaseConnected = false;
let connectionStatus = {
    isConnected: false,
    lastChecked: null,
    error: null
};

// Credential validation utility
function validateCredentials(url, key) {
    if (!url || !key) {
        return { valid: false, error: 'Missing Supabase URL or API key' };
    }
    
    if (url.includes('placeholder') || key.includes('placeholder')) {
        return { valid: false, error: 'Placeholder credentials detected' };
    }
    
    // Basic URL format validation
    try {
        const urlObj = new URL(url);
        if (!urlObj.hostname.includes('supabase.co') && !urlObj.hostname.includes('supabase.net')) {
            return { valid: false, error: 'Invalid Supabase URL format' };
        }
    } catch (error) {
        return { valid: false, error: `Invalid URL format: ${error.message}` };
    }
    
    // Basic API key format validation (Supabase keys are typically long base64-like strings)
    if (key.length < 50) {
        return { valid: false, error: 'API key appears to be too short' };
    }
    
    return { valid: true };
}

// Enhanced error wrapper for database operations
function wrapDatabaseOperation(operation, context = '') {
    return async (...args) => {
        const startTime = Date.now();
        
        try {
            if (!isSupabaseConnected) {
                throw new Error('Supabase client not connected');
            }
            
            logger.info(`Starting operation: ${context}`, { args: args.length > 0 ? 'with arguments' : 'no arguments' });
            const result = await operation(...args);
            
            const duration = Date.now() - startTime;
            if (result.error) {
                logger.error(`Operation failed: ${context}`, result.error);
                return result;
            }
            
            logger.success(`Operation completed: ${context}`, { 
                duration: `${duration}ms`,
                hasData: !!result.data
            });
            return result;
            
        } catch (error) {
            const duration = Date.now() - startTime;
            logger.error(`Operation threw error: ${context}`, {
                error: error.message,
                duration: `${duration}ms`,
                stack: error.stack
            });
            return { data: null, error: { message: error.message, code: 'CLIENT_ERROR' } };
        }
    };
}

// Mock client factory for test environment only
function createTestMockClient() {
    if (process.env.NODE_ENV !== 'test') {
        throw new Error('Mock client can only be created in test environment');
    }
    
    logger.info('Creating mock Supabase client for testing environment');
    
    const mockPosts = [{
        id: 1,
        title: "Test Post",
        content: "Test content",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        published: true,
        author: "Test Author"
    }];

    return {
        from: (table) => ({
            select: () => ({
                eq: () => ({
                    single: () => Promise.resolve({ data: mockPosts[0], error: null })
                }),
                limit: () => Promise.resolve({ data: mockPosts, error: null })
            }),
            insert: () => ({
                select: () => ({
                    single: () => Promise.resolve({ data: mockPosts[0], error: null })
                })
            }),
            update: () => ({
                eq: () => ({
                    select: () => ({
                        single: () => Promise.resolve({ data: mockPosts[0], error: null })
                    })
                })
            }),
            delete: () => ({
                eq: () => Promise.resolve({ error: null })
            })
        }),
        auth: {
            getUser: () => Promise.resolve({ data: { user: null }, error: null }),
            signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
            signOut: () => Promise.resolve({ error: null })
        },
        rpc: () => Promise.resolve({ data: null, error: null })
    };
}

// Initialize Supabase client with proper environment handling
function initializeSupabaseClient() {
    // Test environment - use mock client
    if (process.env.NODE_ENV === 'test') {
        logger.info('Test environment detected - initializing mock client');
        supabase = createTestMockClient();
        isSupabaseConnected = true;
        connectionStatus = { isConnected: true, lastChecked: new Date(), error: null };
        return;
    }
    
    // Production/Development environment - require real credentials
    const validation = validateCredentials(supabaseUrl, supabaseKey);
    
    if (!validation.valid) {
        const errorMessage = `Invalid credentials: ${validation.error}`;
        logger.error(errorMessage);
        
        if (process.env.NODE_ENV === 'production') {
            // In production, fail hard - no fallbacks
            throw new Error(`[PRODUCTION] ${errorMessage}. Application cannot start without valid Supabase credentials.`);
        } else {
            // In development, log warning but don't crash
            logger.warn('Development mode: Continuing without Supabase connection');
            supabase = null;
            isSupabaseConnected = false;
            connectionStatus = { isConnected: false, lastChecked: new Date(), error: validation.error };
            return;
        }
    }
    
    try {
        logger.info('Initializing Supabase client with validated credentials');
        
        supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            },
            db: {
                schema: 'public'
            },
            global: {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'RBCK-CMS/1.0'
                }
            }
        });
        
        logger.success('Supabase client created successfully');
        
        // Test connection immediately in a non-blocking way
        verifyConnection().then(connected => {
            if (connected) {
                logger.success('Initial connection verification successful');
            } else {
                logger.error('Initial connection verification failed');
                if (process.env.NODE_ENV === 'production') {
                    // In production, this is critical
                    process.exit(1);
                }
            }
        }).catch(error => {
            logger.error('Connection verification threw an error', error);
            if (process.env.NODE_ENV === 'production') {
                process.exit(1);
            }
        });
        
    } catch (error) {
        logger.error('Failed to create Supabase client', error);
        
        if (process.env.NODE_ENV === 'production') {
            throw new Error(`[PRODUCTION] Failed to initialize Supabase: ${error.message}`);
        } else {
            supabase = null;
            isSupabaseConnected = false;
            connectionStatus = { isConnected: false, lastChecked: new Date(), error: error.message };
        }
    }
}

// Initialize the client
initializeSupabaseClient();

// Simplified connection verification
async function verifyConnection() {
    const startTime = Date.now();
    
    try {
        logger.info('Verifying Supabase connection');
        
        if (!supabase || typeof supabase.from !== 'function') {
            throw new Error('Supabase client not properly initialized');
        }
        
        // Test environment always passes
        if (process.env.NODE_ENV === 'test') {
            isSupabaseConnected = true;
            connectionStatus = { isConnected: true, lastChecked: new Date(), error: null };
            logger.success('Test environment connection verified');
            return true;
        }
        
        // Simple connectivity test
        const { error } = await supabase
            .from('posts')
            .select('id')
            .limit(1);
            
        if (error) {
            throw new Error(`Database query failed: ${error.message}`);
        }
        
        const duration = Date.now() - startTime;
        isSupabaseConnected = true;
        connectionStatus = { isConnected: true, lastChecked: new Date(), error: null };
        
        logger.success(`Connection verified successfully in ${duration}ms`);
        return true;
        
    } catch (error) {
        const duration = Date.now() - startTime;
        isSupabaseConnected = false;
        connectionStatus = { 
            isConnected: false, 
            lastChecked: new Date(), 
            error: error.message 
        };
        
        logger.error(`Connection verification failed after ${duration}ms`, error);
        return false;
    }
}


// Import models
const { User } = require('./models/User');
const { Post } = require('./models/Post');
const { AIUsage, AIConversation, AIMessage } = require('./models/database');

// Database helper functions
const db = {
    // User operations
    users: {
        findById: wrapDatabaseOperation(async (id) => {
            if (!id) {
                throw new Error('User ID is required');
            }
            
            return await supabase
                .from(User.tableName)
                .select(User.fields.join(','))
                .eq('id', id)
                .single();
        }, 'users.findById'),
        
        findByUsername: wrapDatabaseOperation(async (username) => {
            if (!username) {
                throw new Error('Username is required');
            }
            
            return await supabase
                .from(User.tableName)
                .select(User.fields.join(','))
                .eq('username', username)
                .single();
        }, 'users.findByUsername'),
        
        findByEmail: wrapDatabaseOperation(async (email) => {
            if (!email) {
                throw new Error('Email is required');
            }
            
            return await supabase
                .from(User.tableName)
                .select(User.fields.join(','))
                .eq('email', email)
                .single();
        }, 'users.findByEmail'),
        
        create: wrapDatabaseOperation(async (userData) => {
            if (!userData) {
                throw new Error('User data is required');
            }
            
            return await supabase
                .from(User.tableName)
                .insert(userData)
                .select()
                .single();
        }, 'users.create'),
        
        update: wrapDatabaseOperation(async (id, userData) => {
            if (!id) {
                throw new Error('User ID is required');
            }
            if (!userData) {
                throw new Error('User data is required');
            }
            
            return await supabase
                .from(User.tableName)
                .update(userData)
                .eq('id', id)
                .select()
                .single();
        }, 'users.update')
    },
    
    // Post operations
    posts: {
        findAll: wrapDatabaseOperation(async (limit = 50, offset = 0) => {
            if (limit < 1 || limit > 1000) {
                throw new Error('Limit must be between 1 and 1000');
            }
            if (offset < 0) {
                throw new Error('Offset must be non-negative');
            }
            
            const { data, error } = await supabase
                .from(Post.tableName)
                .select('*')  // Select all fields to avoid field name issues
                .eq('status', 'published')  // Only published posts
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);
            
            if (error) {
                logger.error('Database query failed in posts.findAll', error);
                return { data: null, error };
            }
            
            // Map database fields to expected frontend format
            const mappedData = data ? data.map(post => ({
                id: post.id,
                titleTH: post.title_th || post.titleTH || post.title || 'ไม่มีหัวข้อ',
                titleEN: post.title_en || post.titleEN || post.title || 'No Title',
                title: post.title || post.title_th || post.titleTH || 'ไม่มีหัวข้อ',
                slug: post.slug || `post-${post.id}`,
                content: post.content || '',
                excerpt: post.excerpt || '',
                author: post.author || 'ระเบียบการช่าง',
                status: post.status || 'published',
                category: post.category || 'general',
                tags: Array.isArray(post.tags) ? post.tags : (post.tags ? [post.tags] : []),
                views: post.views || 0,
                likes: post.likes || 0,
                metaTitle: post.meta_title || post.metaTitle || post.title,
                metaDescription: post.meta_description || post.metaDescription || post.excerpt,
                focusKeyword: post.focus_keyword || post.focusKeyword || '',
                publishDate: post.published_at || post.publishDate || post.created_at,
                createdAt: post.created_at || post.createdAt,
                updatedAt: post.updated_at || post.updatedAt,
                created_at: post.created_at,
                updated_at: post.updated_at,
                published: post.status === 'published'
            })) : [];
            
            return { data: mappedData, error: null };
        }, 'posts.findAll'),
        
        findById: wrapDatabaseOperation(async (id) => {
            if (!id) {
                throw new Error('Post ID is required');
            }
            
            const { data, error } = await supabase
                .from(Post.tableName)
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) {
                logger.error('Database query failed in posts.findById', error);
                return { data: null, error };
            }
            
            // Map database fields to expected frontend format
            const mappedData = data ? {
                id: data.id,
                titleTH: data.title_th || data.titleTH || data.title || 'ไม่มีหัวข้อ',
                titleEN: data.title_en || data.titleEN || data.title || 'No Title',
                title: data.title || data.title_th || data.titleTH || 'ไม่มีหัวข้อ',
                slug: data.slug || `post-${data.id}`,
                content: data.content || '',
                excerpt: data.excerpt || '',
                author: data.author || 'ระเบียบการช่าง',
                status: data.status || 'published',
                category: data.category || 'general',
                tags: Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []),
                views: data.views || 0,
                likes: data.likes || 0,
                metaTitle: data.meta_title || data.metaTitle || data.title,
                metaDescription: data.meta_description || data.metaDescription || data.excerpt,
                focusKeyword: data.focus_keyword || data.focusKeyword || '',
                publishDate: data.published_at || data.publishDate || data.created_at,
                createdAt: data.created_at || data.createdAt,
                updatedAt: data.updated_at || data.updatedAt,
                created_at: data.created_at,
                updated_at: data.updated_at,
                published: data.status === 'published'
            } : null;
            
            return { data: mappedData, error: null };
        }, 'posts.findById'),
        
        findBySlug: wrapDatabaseOperation(async (slug) => {
            if (!slug) {
                throw new Error('Post slug is required');
            }
            
            return await supabase
                .from(Post.tableName)
                .select(Post.fields.join(','))
                .eq('slug', slug)
                .single();
        }, 'posts.findBySlug'),
        
        create: wrapDatabaseOperation(async (postData) => {
            if (!postData) {
                throw new Error('Post data is required');
            }
            
            return await supabase
                .from(Post.tableName)
                .insert(postData)
                .select()
                .single();
        }, 'posts.create'),
        
        update: wrapDatabaseOperation(async (id, postData) => {
            if (!id) {
                throw new Error('Post ID is required');
            }
            if (!postData) {
                throw new Error('Post data is required');
            }
            
            return await supabase
                .from(Post.tableName)
                .update(postData)
                .eq('id', id)
                .select()
                .single();
        }, 'posts.update'),
        
        delete: wrapDatabaseOperation(async (id) => {
            if (!id) {
                throw new Error('Post ID is required');
            }
            
            return await supabase
                .from(Post.tableName)
                .delete()
                .eq('id', id);
        }, 'posts.delete'),
        
        incrementViewCount: wrapDatabaseOperation(async (id) => {
            if (!id) {
                throw new Error('Post ID is required');
            }
            
            return await supabase
                .rpc('increment_view_count', { post_id: id });
        }, 'posts.incrementViewCount')
    },
    
    // AI Usage tracking
    aiUsage: {
        create: wrapDatabaseOperation(async (usageData) => {
            if (!usageData) {
                throw new Error('Usage data is required');
            }
            
            return await supabase
                .from(AIUsage.tableName)
                .insert(usageData)
                .select()
                .single();
        }, 'aiUsage.create'),
        
        getByUser: wrapDatabaseOperation(async (userId, limit = 100) => {
            if (!userId) {
                throw new Error('User ID is required');
            }
            if (limit < 1 || limit > 1000) {
                throw new Error('Limit must be between 1 and 1000');
            }
            
            return await supabase
                .from(AIUsage.tableName)
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);
        }, 'aiUsage.getByUser'),
        
        getStats: wrapDatabaseOperation(async (userId, startDate, endDate) => {
            if (!userId) {
                throw new Error('User ID is required');
            }
            if (!startDate || !endDate) {
                throw new Error('Start date and end date are required');
            }
            
            return await supabase
                .from(AIUsage.tableName)
                .select('provider, tokens_used, cost_thb')
                .eq('user_id', userId)
                .gte('created_at', startDate)
                .lte('created_at', endDate);
        }, 'aiUsage.getStats')
    },
    
    // AI Conversations
    conversations: {
        create: wrapDatabaseOperation(async (conversationData) => {
            if (!conversationData) {
                throw new Error('Conversation data is required');
            }
            
            return await supabase
                .from(AIConversation.tableName)
                .insert(conversationData)
                .select()
                .single();
        }, 'conversations.create'),
        
        findByUser: wrapDatabaseOperation(async (userId, limit = 50) => {
            if (!userId) {
                throw new Error('User ID is required');
            }
            if (limit < 1 || limit > 1000) {
                throw new Error('Limit must be between 1 and 1000');
            }
            
            return await supabase
                .from(AIConversation.tableName)
                .select('*')
                .eq('user_id', userId)
                .order('updated_at', { ascending: false })
                .limit(limit);
        }, 'conversations.findByUser'),
        
        addMessage: wrapDatabaseOperation(async (conversationId, messageData) => {
            if (!conversationId) {
                throw new Error('Conversation ID is required');
            }
            if (!messageData) {
                throw new Error('Message data is required');
            }
            
            return await supabase
                .from(AIMessage.tableName)
                .insert({
                    conversation_id: conversationId,
                    ...messageData
                })
                .select()
                .single();
        }, 'conversations.addMessage'),
        
        getMessages: wrapDatabaseOperation(async (conversationId) => {
            if (!conversationId) {
                throw new Error('Conversation ID is required');
            }
            
            return await supabase
                .from(AIMessage.tableName)
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });
        }, 'conversations.getMessages')
    }
};

// Simplified health check function
const checkSupabaseHealth = async () => {
    try {
        const connected = await verifyConnection();
        
        return {
            status: connected ? 'healthy' : 'unhealthy',
            error: connectionStatus.error,
            connected: connectionStatus.isConnected,
            lastChecked: connectionStatus.lastChecked
        };
    } catch (error) {
        logger.error('Health check failed', error);
        return {
            status: 'unhealthy', 
            error: error.message,
            connected: false,
            lastChecked: new Date()
        };
    }
};

// Get connection status function
const isConnected = () => {
    return isSupabaseConnected;
};

// Get detailed connection status
const getConnectionStatus = () => {
    return {
        ...connectionStatus,
        isSupabaseConnected
    };
};

module.exports = {
    supabase,
    db,
    isConnected,
    getConnectionStatus,
    checkSupabaseHealth,
    verifyConnection
};