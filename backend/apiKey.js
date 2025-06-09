// ใช้ dotenv เพื่อโหลด API KEY จาก .env
require('dotenv').config();
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Import security middleware
const { authenticateAdmin } = require('./middleware/auth');
const { apiKeyRateLimit } = require('./middleware/rateLimiter');

// ======= API KEY STORAGE (ควรใช้ .env หรือ database จริงใน production) =======
const API_KEY_FILE = path.join(__dirname, 'apikey.json');

// อ่าน API Key ทั้งหมด
function getAllApiKeys() {
    // 1. ลองอ่านจาก .env ก่อน
    const keys = {
        openaiApiKey: process.env.OPENAI_API_KEY || '',
        claudeApiKey: process.env.CLAUDE_API_KEY || '',
        qwenApiKey: process.env.QWEN_API_KEY || '',
        geminiApiKey: process.env.GEMINI_API_KEY || ''
    };
    // 2. ถ้าไม่มีใน .env ลองอ่านจากไฟล์
    if (fs.existsSync(API_KEY_FILE)) {
        try {
            const data = JSON.parse(fs.readFileSync(API_KEY_FILE, 'utf8'));
            return {
                openaiApiKey: keys.openaiApiKey || data.openaiApiKey || '',
                claudeApiKey: keys.claudeApiKey || data.claudeApiKey || '',
                qwenApiKey: keys.qwenApiKey || data.qwenApiKey || '',
                geminiApiKey: keys.geminiApiKey || data.geminiApiKey || ''
            };
        } catch (error) {
            console.error('Error reading API keys file:', error);
            return keys;
        }
    }
    return keys;
}

// เขียน API Key ทั้งหมดลงไฟล์
function setAllApiKeys(newKeys) {
    try {
        // อ่านของเดิมก่อน
        let data = {};
        if (fs.existsSync(API_KEY_FILE)) {
            try {
                data = JSON.parse(fs.readFileSync(API_KEY_FILE, 'utf8'));
            } catch (error) {
                console.error('Error reading existing API keys:', error);
            }
        }
        // อัปเดตเฉพาะ key ที่ส่งมา
        const updated = { ...data, ...newKeys };
        fs.writeFileSync(API_KEY_FILE, JSON.stringify(updated, null, 2), 'utf8');
        
        console.log('API keys updated successfully');
    } catch (error) {
        console.error('Error writing API keys:', error);
        throw error;
    }
}

// ฟังก์ชันสำหรับซ่อน API Key (แสดงเฉพาะ 8 ตัวแรก)
function maskApiKeys(keys) {
    const maskedKeys = {};
    for (const [key, value] of Object.entries(keys)) {
        if (value && value.length > 8) {
            maskedKeys[key] = value.substring(0, 8) + '*'.repeat(Math.max(value.length - 8, 8));
        } else if (value) {
            maskedKeys[key] = '*'.repeat(8);
        } else {
            maskedKeys[key] = '';
        }
    }
    return maskedKeys;
}

// ======= REST API =======

// GET /api/apikey - ดึง API Key ทั้งหมด (เฉพาะ Admin ที่ยืนยันตัวตนแล้ว)
router.get('/apikey', 
    apiKeyRateLimit,      // จำกัดการเรียกใช้
    authenticateAdmin,    // ตรวจสอบสิทธิ์ Admin  
    (req, res) => {
        try {
            const apiKeys = getAllApiKeys();
            
            // Log admin action for security audit
            console.log(`🔍 API keys retrieved by admin: ${req.user.username} at ${new Date().toISOString()}`);
            
            res.json({
                success: true,
                data: apiKeys, // ส่ง API key จริงให้ frontend
                message: 'API keys retrieved successfully',
                timestamp: new Date().toISOString()
            });        } catch (error) {
            console.error('Error fetching API keys:', error);
            res.status(500).json({ 
                error: 'Internal server error',
                message: 'Failed to retrieve API keys'
            });
        }
    }
);

// GET /api/apikey/display - ดึง API Key แบบ masked สำหรับแสดงใน UI
router.get('/apikey/display', 
    apiKeyRateLimit,      
    authenticateAdmin,    
    (req, res) => {
        try {
            const apiKeys = getAllApiKeys();
            const maskedKeys = maskApiKeys(apiKeys);
            
            console.log(`🔍 Masked API keys retrieved by admin: ${req.user.username} at ${new Date().toISOString()}`);
            
            res.json({
                success: true,
                data: maskedKeys,
                message: 'API keys retrieved successfully (masked for security)',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error fetching masked API keys:', error);
            res.status(500).json({ 
                error: 'Internal server error',
                message: 'Failed to retrieve API keys'
            });
        }
    }
);

// POST /api/apikey - บันทึก API Key (เฉพาะ Admin ที่ยืนยันตัวตนแล้ว)
router.post('/apikey', 
    express.json(), 
    apiKeyRateLimit,      // จำกัดการเรียกใช้
    authenticateAdmin,    // ตรวจสอบสิทธิ์ Admin
    (req, res) => {
        try {
            const allowedKeys = ['openaiApiKey', 'claudeApiKey', 'qwenApiKey', 'geminiApiKey'];
            const newKeys = {};
            
            // Validate and sanitize input
            for (const k of allowedKeys) {
                if (req.body[k] && typeof req.body[k] === 'string') {
                    const trimmedKey = req.body[k].trim();
                    if (trimmedKey.length > 0) {
                        newKeys[k] = trimmedKey;
                    }
                }
            }
            
            if (Object.keys(newKeys).length === 0) {
                return res.status(400).json({ 
                    error: 'No valid API Key provided',
                    message: 'Please provide at least one valid API key'
                });
            }
            
            // Update API keys
            setAllApiKeys(newKeys);
              // Log admin action for security audit (without sensitive data)
            console.log(`🔑 API keys updated by admin: ${req.user.username} - Keys count: ${Object.keys(newKeys).length} at ${new Date().toISOString()}`);
            
            res.json({ 
                success: true,
                message: `Successfully updated ${Object.keys(newKeys).length} API key(s)`,
                updatedKeys: Object.keys(newKeys),
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error updating API keys:', error);
            res.status(500).json({ 
                error: 'Internal server error',
                message: 'Failed to update API keys'
            });
        }
    }
);

module.exports = router;
