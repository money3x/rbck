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
    console.log('🔄 Creating mock Supabase client');
    return {
        from: (table) => ({
            select: (columns = '*') => {
                const query = {
                    data: [],
                    error: null,
                    count: 0,
                    eq: function(column, value) { return this; },
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
                    limit: function(count) { return this; },
                    range: function(from, to) { return this; },
                    single: function() { 
                        return Promise.resolve({ 
                            data: null, 
                            error: { message: 'Mock client - no data available' } 
                        }); 
                    },
                    then: function(callback) { 
                        return callback({ data: [], error: null, count: 0 }); 
                    }
                };
                // Make it thenable for async/await
                query.then = function(callback) { 
                    return Promise.resolve({ data: [], error: null, count: 0 }).then(callback); 
                };
                return query;
            },
            insert: (data) => ({
                data: null, 
                error: { message: 'Mock client - database not configured' },
                select: function() { return this; },
                single: function() { 
                    return Promise.resolve({ 
                        data: null, 
                        error: { message: 'Mock client - database not configured' } 
                    }); 
                }
            }),
            update: (data) => ({
                data: null, 
                error: { message: 'Mock client - database not configured' },
                eq: function(column, value) { return this; },
                select: function() { return this; },
                single: function() { 
                    return Promise.resolve({ 
                        data: null, 
                        error: { message: 'Mock client - database not configured' } 
                    }); 
                }
            }),
            delete: () => ({
                error: { message: 'Mock client - database not configured' },
                eq: function(column, value) { 
                    return Promise.resolve({ 
                        error: { message: 'Mock client - database not configured' } 
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
if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder')) {
    try {
        console.log('🔄 Initializing Supabase client...');
        console.log(`📍 URL: ${supabaseUrl}`);
        console.log(`🔑 Key: ${supabaseKey.substring(0, 20)}...`);

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
        return false;
    }
}

// Create mock client for development
function createMockClient() {
    return {
        from: (table) => ({
            select: (columns = '*') => ({
                data: [],
                error: null,
                eq: function() { return this; },
                neq: function() { return this; },
                gt: function() { return this; },
                lt: function() { return this; },
                gte: function() { return this; },
                lte: function() { return this; },
                like: function() { return this; },
                ilike: function() { return this; },
                is: function() { return this; },
                in: function() { return this; },
                order: function() { return this; },
                limit: function() { return this; },
                range: function() { return this; },
                single: function() { return this; }
            }),
            insert: (data) => ({
                data: Array.isArray(data) ? data : [data],
                error: null,
                select: function() { return this; }
            }),
            update: (data) => ({
                data: [data],
                error: null,
                eq: function() { return this; },
                match: function() { return this; }
            }),
            delete: () => ({
                data: [],
                error: null,
                eq: function() { return this; },
                match: function() { return this; }
            }),
            upsert: (data) => ({
                data: Array.isArray(data) ? data : [data],
                error: null
            })
        }),
        auth: {
            signInWithPassword: () => ({ 
                data: { user: null, session: null }, 
                error: { message: 'Mock client - authentication not available' }
            }),
            signOut: () => ({ error: null }),
            getUser: () => ({ 
                data: { user: null }, 
                error: { message: 'Mock client - user not available' }
            }),
            getSession: () => ({
                data: { session: null },
                error: { message: 'Mock client - session not available' }
            })
        },
        storage: {
            from: (bucket) => ({
                upload: () => ({
                    data: { path: 'mock-file-path' },
                    error: null
                }),
                download: () => ({
                    data: null,
                    error: { message: 'Mock client - file download not available' }
                }),
                remove: () => ({
                    data: [],
                    error: null
                })
            })
        }
    };
}

// Database helper functions
const db = {
    // User operations
    users: {
        async findById(id) {
            const { data, error } = await supabase
                .from(User.tableName)
                .select(User.fields.join(','))
                .eq('id', id)
                .single();
            return { data, error };
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

module.exports = {
    supabase,
    db,
    isConnected,
    testConnection,
    checkSupabaseHealth
};