// backend/supabaseClient.js
const { createClient } = require('@supabase/supabase-js');
const { User, Post, AIUsage, AIConversation, AIMessage } = require('./models/database');
const config = require('./config/config');

// Use configuration from config.js
const SUPABASE_URL = config.database.supabaseUrl;
const SUPABASE_KEY = config.database.supabaseKey;

let supabase;
let isConnected = false;

try {
    // Try to create real Supabase client if environment variables are provided
    if (SUPABASE_URL && SUPABASE_KEY && !SUPABASE_URL.includes('placeholder')) {
        supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            },
            // เพิ่ม options เพื่อป้องกัน syntax error
            db: {
                schema: 'public'
            }
        });
        isConnected = true;
        console.log('✅ Supabase client initialized successfully');
        
        // Test connection ด้วย query ที่ปลอดภัย
        testConnection();
    } else {
        console.log('⚠️ Supabase environment variables not found - using mock client for development');
        supabase = createMockClient();
        isConnected = false;
    }
} catch (error) {
    console.error('❌ Supabase initialization error:', error);
    supabase = createMockClient();
    isConnected = false;
}

// Test database connection ด้วย query ที่ปลอดภัย
async function testConnection() {
    try {
        // ใช้ query ง่ายๆ แทน count(*) เพื่อป้องกัน parse error
        const { data, error } = await supabase
            .from('posts')
            .select('id')
            .limit(1);
            
        if (error) {
            console.log('⚠️ Supabase connection test failed:', error.message);
            isConnected = false;
        } else {
            console.log('✅ Supabase database connection verified');
            isConnected = true;
        }
    } catch (error) {
        console.log('⚠️ Supabase connection test error:', error.message);
        isConnected = false;
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