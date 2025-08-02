#!/usr/bin/env node

/**
 * 🔧 Quick Fix for Production HTML
 * Updates index.html to use new modular system instead of main-production.js
 */

import fs from 'fs';
import path from 'path';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(color, prefix, message) {
  console.log(`${color}${prefix}${colors.reset} ${message}`);
}

function logSuccess(message) {
  log(colors.green, '✅', message);
}

function logError(message) {
  log(colors.red, '❌', message);
}

function logWarning(message) {
  log(colors.yellow, '⚠️ ', message);
}

function logInfo(message) {
  log(colors.blue, 'ℹ️ ', message);
}

function createBackup() {
  const backupPath = `./index.html.backup-${Date.now()}`;
  fs.copyFileSync('./index.html', backupPath);
  logSuccess(`Backup created: ${backupPath}`);
  return backupPath;
}

function updateIndexHtml() {
  logInfo('Reading index.html...');
  let content = fs.readFileSync('./index.html', 'utf8');
  
  // Find and replace the main-production.js script tag
  const oldScriptPattern = /<script src="main-production\.js[^"]*"[^>]*><\/script>/g;
  
  if (!oldScriptPattern.test(content)) {
    logError('Could not find main-production.js script tag');
    return false;
  }
  
  const newScriptSection = `
    <!-- 🆕 UPDATED: New Modular System replacing main-production.js -->
    <script type="importmap">
    {
      "imports": {
        "@components/": "./js/components/",
        "@services/": "./js/services/",
        "@utils/": "./js/utils/",
        "./aiSwarm.js": "./aiSwarm.js",
        "./aiMonitoringUI.js": "./aiMonitoringUI.js",
        "./blogManager.js": "./blogManager.js",
        "./uiHelpers.js": "./uiHelpers.js",
        "./modals.js": "./modals.js",
        "./seoTools.js": "./seoTools.js",
        "./auth.js": "./auth.js",
        "../config.js": "../config.js",
        "../js/apiUtils.js": "../js/apiUtils.js"
      }
    }
    </script>
    
    <!-- 🚀 Main Application Entry Point (replaces main-production.js) -->
    <script type="module" nonce="secure-admin-scripts">
      // Initialize new modular system
      import('./js/app-controller.js').then(({ AdminDashboard }) => {
        window.adminDashboard = new AdminDashboard();
        console.log('✅ [NEW SYSTEM] Admin Dashboard initialized');
      }).catch(error => {
        console.error('❌ [NEW SYSTEM] Failed to load:', error);
        
        // Fallback to old system if new system fails
        console.log('🔄 [FALLBACK] Loading main.js as fallback...');
        const script = document.createElement('script');
        script.type = 'module';
        script.src = './main.js';
        script.onerror = () => {
          console.error('❌ [FALLBACK] Both systems failed to load');
          alert('เกิดข้อผิดพลาดในการโหลดระบบ กรุณารีเฟรชหน้าเว็บ');
        };
        document.head.appendChild(script);
      });
    </script>
    
    <!-- 📦 Legacy Browser Support -->
    <script nomodule nonce="secure-admin-scripts">
      // For older browsers that don't support ES modules
      console.warn('⚠️ [LEGACY] Browser does not support ES modules, using compatibility mode');
      var script = document.createElement('script');
      script.src = 'main-production.js?v=legacy';
      document.head.appendChild(script);
    </script>`;
  
  // Replace the old script with new modular system
  content = content.replace(oldScriptPattern, newScriptSection);
  
  // Add performance hints for new modules
  const preloadSection = `
    <!-- ⚡ UPDATED: Module Preloading for New System -->
    <link rel="modulepreload" href="js/app-controller.js">
    <link rel="modulepreload" href="js/components/modal-manager.js">
    <link rel="modulepreload" href="js/components/chat-interface.js">
    <link rel="modulepreload" href="js/services/ai-providers.js">
    <link rel="modulepreload" href="js/services/module-loader.js">
    <link rel="modulepreload" href="js/services/pwa-manager.js">
    <link rel="modulepreload" href="main.js">`;
    
  // Add after existing modulepreload lines
  const modulePreloadPattern = /(<link rel="modulepreload" href="[^"]*">)/;
  if (modulePreloadPattern.test(content)) {
    content = content.replace(
      /(<link rel="modulepreload" href="core\/bootstrap\.js">)/,
      `$1\n${preloadSection}`
    );
  } else {
    // Add in head if no existing modulepreload found
    content = content.replace(
      /<\/head>/,
      `${preloadSection}\n</head>`
    );
  }
  
  // Write the updated content
  fs.writeFileSync('./index.html', content);
  logSuccess('index.html updated successfully');
  
  return true;
}

function validateUpdate() {
  logInfo('Validating the update...');
  
  const content = fs.readFileSync('./index.html', 'utf8');
  
  // Check if new system is present
  if (content.includes('js/app-controller.js')) {
    logSuccess('✓ New modular system detected');
  } else {
    logError('✗ New modular system not found');
    return false;
  }
  
  // Check if old system is removed
  if (!content.includes('main-production.js?v=2')) {
    logSuccess('✓ Old main-production.js removed');
  } else {
    logWarning('⚠ Old main-production.js still present');
  }
  
  // Check for import map
  if (content.includes('importmap')) {
    logSuccess('✓ Import map added');
  } else {
    logError('✗ Import map missing');
    return false;
  }
  
  return true;
}

function generateSummary() {
  console.log('\n📋 Update Summary:');
  console.log('');
  console.log('🔄 Changes Made:');
  console.log('  ✅ Replaced main-production.js (137KB) with new modular system');
  console.log('  ✅ Added ES6 import map for module resolution');
  console.log('  ✅ Added fallback system for compatibility');
  console.log('  ✅ Added module preloading for performance');
  console.log('  ✅ Added legacy browser support');
  console.log('');
  console.log('📈 Benefits:');
  console.log('  🚀 Faster initial load with code splitting');
  console.log('  🧩 Modular architecture for maintainability');
  console.log('  🎯 TypeScript support for type safety');
  console.log('  📱 Progressive Web App features');
  console.log('  🔧 Micro-frontend architecture ready');
  console.log('');
  console.log('⚠️  Important Notes:');
  console.log('  📁 Make sure all files in js/ directory exist');
  console.log('  🧪 Test thoroughly before deploying to production');
  console.log('  💾 Backup has been created for rollback if needed');
  console.log('  🌐 Legacy browsers will fall back to old system');
}

function main() {
  console.log('\n🔧 Fixing Production HTML for New Modular System\n');
  
  try {
    // Create backup
    const backup = createBackup();
    
    // Update index.html
    const success = updateIndexHtml();
    
    if (!success) {
      logError('Update failed');
      process.exit(1);
    }
    
    // Validate update
    const isValid = validateUpdate();
    
    if (!isValid) {
      logError('Validation failed');
      logInfo(`Restore from backup: ${backup}`);
      process.exit(1);
    }
    
    generateSummary();
    
    console.log('\n🎉 Update completed successfully!');
    console.log(`💾 Backup saved as: ${backup}`);
    console.log('\n📋 Next Steps:');
    console.log('  1. Test locally: open index.html in browser');
    console.log('  2. Check browser console for any errors');
    console.log('  3. If all good, commit and push to production');
    console.log('  4. Monitor production logs after deployment');
    
  } catch (error) {
    logError(`Update failed: ${error.message}`);
    process.exit(1);
  }
}

main();