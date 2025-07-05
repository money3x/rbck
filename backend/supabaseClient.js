// backend/supabaseClient.js
const { createClient } = require('@supabase/supabase-js');
const config = require('./config/config');

// Use configuration from config.js
const supabaseUrl = config.database.supabaseUrl;
const supabaseKey = config.database.supabaseKey;

let supabase;
let isSupabaseConnected = false;

// Mock client for when Supabase is not available
function createMockClient() {
    console.log('� Creating mock Supabase client for testing');
    
    // Mock data store for testing
    let mockPosts = [
        {
            id: 1,
            title: "Welcome to RBCK CMS",
            content: "This is a sample post from mock data.",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            published: true,
            author: "System"
        }
    ];
    let nextId = 2;

    return {
        from: (table) => ({
            select: (columns = '*') => {
                const query = {
                    data: table === 'posts' ? mockPosts : [],
                    error: null,
                    count: table === 'posts' ? mockPosts.length : 0,
                    eq: function(column, value) { 
                        if (table === 'posts') {
                            const filtered = mockPosts.filter(p => p[column] === value);
                            return { ...this, data: filtered };
                        }
                        return this; 
                    },
                    neq: function(column, value) { return this; },
                    gt: function(column, value) { return this; },
                    lt: function(column, value) { return this; },
                    gte: function(column, value) { return this; },
                    lte: function(column, value) { return this; },
                    like: function(column, value) { return this; },
                    ilike: function(column, value) { return this; },
                    is: function(column, value) { return this; },
                    in: function(column, values) { return this; },
                    order: function(column, options) { return this; },
                    limit: function(count) { 
                        if (table === 'posts') {
                            return { ...this, data: mockPosts.slice(0, count) };
                        }
                        return this; 
                    },
                    range: function(from, to) { return this; },
                    single: function() { 
                        if (table === 'posts' && this.data && this.data.length > 0) {
                            return Promise.resolve({ 
                                data: this.data[0], 
                                error: null 
                            });
                        }
                        return Promise.resolve({ 
                            data: null, 
                            error: { code: 'PGRST116', message: 'No rows found' } 
                        }); 
                    },
                    then: function(callback) { 
                        return Promise.resolve({ 
                            data: this.data || [], 
                            error: null, 
                            count: this.count || 0 
                        }).then(callback); 
                    }
                };
                // Make it thenable for async/await
                query.then = function(callback) { 
                    return Promise.resolve({ 
                        data: this.data || [], 
                        error: null, 
                        count: this.count || 0 
                    }).then(callback); 
                };
                return query;
            },
            insert: (data) => ({
                select: function() { 
                    if (table === 'posts') {
                        const newPost = {
                            id: nextId++,
                            ...data,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        };
                        mockPosts.push(newPost);
                        return {
                            single: function() {
                                return Promise.resolve({ 
                                    data: newPost, 
                                    error: null 
                                });
                            }
                        };
                    }
                    return {
                        single: function() {
                            return Promise.resolve({ 
                                data: null, 
                                error: { message: 'Mock client - table not supported' } 
                            });
                        }
                    }; 
                }
            }),
            update: (data) => ({
                eq: function(column, value) {
                    this.whereClause = { column, value };
                    return this;
                },
                select: function() { 
                    return {
                        single: function() {
                            if (table === 'posts' && this.whereClause) {
                                const postIndex = mockPosts.findIndex(p => p[this.whereClause.column] === this.whereClause.value);
                                if (postIndex >= 0) {
                                    mockPosts[postIndex] = { 
                                        ...mockPosts[postIndex], 
                                        ...data, 
                                        updated_at: new Date().toISOString() 
                                    };
                                    return Promise.resolve({ 
                                        data: mockPosts[postIndex], 
                                        error: null 
                                    });
                                }
                            }
                            return Promise.resolve({ 
                                data: null, 
                                error: { message: 'Post not found' } 
                            });
                        }
                    };
                }.bind(this)
            }),
            delete: () => ({
                eq: function(column, value) {
                    if (table === 'posts') {
                        const postIndex = mockPosts.findIndex(p => p[column] === value);
                        if (postIndex >= 0) {
                            mockPosts.splice(postIndex, 1);
                            return Promise.resolve({ error: null });
                        }
                        return Promise.resolve({ 
                            error: { message: 'Post not found' } 
                        });
                    }
                    return Promise.resolve({ 
                        error: { message: 'Not found' } 
                    });
                }
            })
        }),
        // Add other Supabase methods that might be used
        auth: {
            getUser: () => Promise.resolve({ 
                data: { user: null }, 
                error: { message: 'Mock client - auth not available' } 
            }),
            signInWithPassword: () => Promise.resolve({ 
                data: { user: null, session: null }, 
                error: { message: 'Mock client - auth not available' } 
            }),
            signOut: () => Promise.resolve({ error: null })
        }
    };
}

// Initialize Supabase client
if (process.env.NODE_ENV === 'test') {
    console.log('🧪 Test environment detected - using mock Supabase client');
    supabase = createMockClient();
    isSupabaseConnected = true; // Mock client is always "connected"
} else if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder')) {
    try {
        console.log('🔄 Initializing Supabase client...');
        console.log('📍 URL: [Configured]');
        console.log('🔑 Supabase key configured successfully');

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
                    'Content-Type': 'application/json'
                }
            }
        });
        
        console.log('✅ Supabase client created successfully');
        
        // Test the connection immediately
        testSupabaseConnection().then(connected => {
            isSupabaseConnected = connected;
            if (connected) {
                console.log('✅ Supabase connection verified on startup');
            } else {
                console.warn('⚠️ Supabase connection failed on startup - will use fallback data');
            }
        });
        
    } catch (error) {
        console.error('❌ Supabase initialization failed:', error.message);
        supabase = createMockClient();
        isSupabaseConnected = false;
    }
} else {
    console.warn('⚠️ Supabase credentials missing or invalid:');
    console.warn(`   SUPABASE_URL: ${supabaseUrl ? (supabaseUrl.includes('placeholder') ? 'Placeholder' : 'Set') : 'Missing'}`);
    console.warn(`   SUPABASE_KEY: ${supabaseKey ? 'Set' : 'Missing'}`);
    supabase = createMockClient();
    isSupabaseConnected = false;
}

// Test Supabase connection function
async function testSupabaseConnection() {
    try {
        console.log('🔍 Testing Supabase connection...');
        
        // Check if supabase client exists and has the from method
        if (!supabase || typeof supabase.from !== 'function') {
            console.warn('⚠️ Supabase client not properly initialized');
            return false;
        }

        // In test environment with mock client, always return true
        if (process.env.NODE_ENV === 'test') {
            console.log('✅ Test environment - mock Supabase client is ready');
            return true;
        }

        // Simple test query - just check if we can access the posts table
        const { data, error } = await supabase
            .from('posts')
            .select('id')
            .limit(1);
            
        if (error) {
            console.warn('⚠️ Supabase connection test failed:', error.message);
            return false;
        }
        
        console.log(`✅ Supabase connected successfully - Posts table accessible`);
        return true;
        
    } catch (error) {
        console.error('❌ Supabase connection test error:', error.message);
        // In test environment, don't fail on errors
        if (process.env.NODE_ENV === 'test') {
            console.log('✅ Test environment - assuming connection works despite error');
            return true;
        }
        return false;
    }
}


// Import models
const { User } = require('./models/User');
const { Post } = require('./models/Post');

// Database helper functions
const db = {
    // User operations
    users: {
        async findById(id) {
            if (!id) {
                return { data: null, error: { message: 'User ID is required' } };
            }
            
            try {
                const { data, error } = await supabase
                    .from(User.tableName)
                    .select(User.fields.join(','))
                    .eq('id', id)
                    .single();
                return { data, error };
            } catch (err) {
                return { data: null, error: { message: err.message } };
            }
        },
        
        async findByUsername(username) {
            const { data, error } = await supabase
                .from(User.tableName)
                .select(User.fields.join(','))
                .eq('username', username)
                .single();
            return { data, error };
        },
        
        async findByEmail(email) {
            const { data, error } = await supabase
                .from(User.tableName)
                .select(User.fields.join(','))
                .eq('email', email)
                .single();
            return { data, error };
        },
        
        async create(userData) {
            const { data, error } = await supabase
                .from(User.tableName)
                .insert(userData)
                .select()
                .single();
            return { data, error };
        },
        
        async update(id, userData) {
            const { data, error } = await supabase
                .from(User.tableName)
                .update(userData)
                .eq('id', id)
                .select()
                .single();
            return { data, error };
        }
    },
    
    // Post operations
    posts: {
        async findAll(limit = 50, offset = 0) {
            const { data, error } = await supabase
                .from(Post.tableName)
                .select(Post.fields.join(','))
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);
            return { data, error };
        },
        
        async findById(id) {
            const { data, error } = await supabase
                .from(Post.tableName)
                .select(Post.fields.join(','))
                .eq('id', id)
                .single();
            return { data, error };
        },
        
        async findBySlug(slug) {
            const { data, error } = await supabase
                .from(Post.tableName)
                .select(Post.fields.join(','))
                .eq('slug', slug)
                .single();
            return { data, error };
        },
        
        async create(postData) {
            const { data, error } = await supabase
                .from(Post.tableName)
                .insert(postData)
                .select()
                .single();
            return { data, error };
        },
        
        async update(id, postData) {
            const { data, error } = await supabase
                .from(Post.tableName)
                .update(postData)
                .eq('id', id)
                .select()
                .single();
            return { data, error };
        },
        
        async delete(id) {
            const { data, error } = await supabase
                .from(Post.tableName)
                .delete()
                .eq('id', id);
            return { data, error };
        },
        
        async incrementViewCount(id) {
            const { data, error } = await supabase
                .rpc('increment_view_count', { post_id: id });
            return { data, error };
        }
    },
    
    // AI Usage tracking
    aiUsage: {
        async create(usageData) {
            const { data, error } = await supabase
                .from(AIUsage.tableName)
                .insert(usageData)
                .select()
                .single();
            return { data, error };
        },
        
        async getByUser(userId, limit = 100) {
            const { data, error } = await supabase
                .from(AIUsage.tableName)
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);
            return { data, error };
        },
        
        async getStats(userId, startDate, endDate) {
            const { data, error } = await supabase
                .from(AIUsage.tableName)
                .select('provider, tokens_used, cost_thb')
                .eq('user_id', userId)
                .gte('created_at', startDate)
                .lte('created_at', endDate);
            return { data, error };
        }
    },
    
    // AI Conversations
    conversations: {
        async create(conversationData) {
            const { data, error } = await supabase
                .from(AIConversation.tableName)
                .insert(conversationData)
                .select()
                .single();
            return { data, error };
        },
        
        async findByUser(userId, limit = 50) {
            const { data, error } = await supabase
                .from(AIConversation.tableName)
                .select('*')
                .eq('user_id', userId)
                .order('updated_at', { ascending: false })
                .limit(limit);
            return { data, error };
        },
        
        async addMessage(conversationId, messageData) {
            const { data, error } = await supabase
                .from(AIMessage.tableName)
                .insert({
                    conversation_id: conversationId,
                    ...messageData
                })
                .select()
                .single();
            return { data, error };
        },
        
        async getMessages(conversationId) {
            const { data, error } = await supabase
                .from(AIMessage.tableName)
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });
            return { data, error };
        }
    }
};

// Export health check function
const checkSupabaseHealth = async () => {
    try {
        const { data, error } = await supabase
            .from('posts')
            .select('id')
            .limit(1);
            
        return {
            status: error ? 'unhealthy' : 'healthy',
            error: error?.message || null,
            connected: !error
        };
    } catch (error) {
        return {
            status: 'unhealthy', 
            error: error.message,
            connected: false
        };
    }
};

// Test connection function
const testConnection = async () => {
    try {
        console.log('🔍 Testing Supabase connection...');
        
        // Check if supabase client exists and has the from method
        if (!supabase || typeof supabase.from !== 'function') {
            console.warn('⚠️ Supabase client not properly initialized');
            isSupabaseConnected = false;
            return false;
        }

        // Simple test query - just check if we can access the posts table
        const { data, error } = await supabase
            .from('posts')
            .select('id')
            .limit(1);
            
        if (error) {
            console.warn('⚠️ Supabase connection test failed:', error.message);
            isSupabaseConnected = false;
            return false;
        }
        
        console.log(`✅ Supabase connected successfully - Posts table accessible`);
        isSupabaseConnected = true;
        return true;
        
    } catch (error) {
        console.error('❌ Supabase connection test error:', error.message);
        isSupabaseConnected = false;
        return false;
    }
};

// Get connection status function
const isConnected = () => {
    return isSupabaseConnected;
};

module.exports = {
    supabase,
    db,
    isConnected,
    testConnection,
    checkSupabaseHealth
};