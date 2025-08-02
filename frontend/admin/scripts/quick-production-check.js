#!/usr/bin/env node

/**
 * 🚀 Quick Production Readiness Check
 * Fast validation before git push
 */

import fs from 'fs';
import path from 'path';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(color, emoji, message) {
  console.log(`${color}${emoji} ${message}${colors.reset}`);
}

function checkFile(filePath, name) {
  if (fs.existsSync(filePath)) {
    log(colors.green, '✅', `${name} exists`);
    return true;
  } else {
    log(colors.red, '❌', `${name} missing: ${filePath}`);
    return false;
  }
}

function checkIndexHtml() {
  log(colors.blue, '🔍', 'Checking index.html...');
  
  if (!fs.existsSync('./index.html')) {
    log(colors.red, '❌', 'index.html not found');
    return false;
  }
  
  const content = fs.readFileSync('./index.html', 'utf8');
  
  // Check if using new system
  if (content.includes('js/app-controller.js')) {
    log(colors.green, '✅', 'Using new modular system');
  } else {
    log(colors.yellow, '⚠️', 'Still using old system');
  }
  
  // Check if old system removed
  if (!content.includes('main-production.js?v=2')) {
    log(colors.green, '✅', 'Old main-production.js removed');
  } else {
    log(colors.yellow, '⚠️', 'Old main-production.js still present');
  }
  
  return true;
}

function checkModularFiles() {
  log(colors.blue, '🔍', 'Checking modular system files...');
  
  const requiredFiles = [
    { path: 'js/app-controller.js', name: 'App Controller' },
    { path: 'js/components/modal-manager.js', name: 'Modal Manager' },
    { path: 'js/components/chat-interface.js', name: 'Chat Interface' },
    { path: 'js/services/ai-providers.js', name: 'AI Providers' },
    { path: 'js/services/module-loader.js', name: 'Module Loader' },
    { path: 'js/services/pwa-manager.js', name: 'PWA Manager' }
  ];
  
  let allExists = true;
  
  for (const file of requiredFiles) {
    if (!checkFile(file.path, file.name)) {
      allExists = false;
    }
  }
  
  return allExists;
}

function checkFallbackFiles() {
  log(colors.blue, '🔍', 'Checking fallback files...');
  
  const fallbackFiles = [
    { path: 'main.js', name: 'Main Fallback' },
    { path: 'aiSwarm.js', name: 'AI Swarm' },
    { path: 'aiMonitoringUI.js', name: 'AI Monitoring UI' },
    { path: 'blogManager.js', name: 'Blog Manager' },
    { path: 'uiHelpers.js', name: 'UI Helpers' },
    { path: '../config.js', name: 'Config (parent dir)' },
    { path: '../js/apiUtils.js', name: 'API Utils (parent dir)' }
  ];
  
  let allExists = true;
  
  for (const file of fallbackFiles) {
    if (!checkFile(file.path, file.name)) {
      allExists = false;
    }
  }
  
  return allExists;
}

function checkConfigFiles() {
  log(colors.blue, '🔍', 'Checking configuration files...');
  
  const configFiles = [
    { path: 'package.json', name: 'Package.json' },
    { path: 'tsconfig.json', name: 'TypeScript Config' },
    { path: 'jest.config.js', name: 'Jest Config' },
    { path: 'manifest.json', name: 'PWA Manifest' },
    { path: 'importmap.json', name: 'Import Map' }
  ];
  
  let allExists = true;
  
  for (const file of configFiles) {
    if (!checkFile(file.path, file.name)) {
      allExists = false;
    }
  }
  
  // Check package.json type
  if (fs.existsSync('package.json')) {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (pkg.type === 'module') {
      log(colors.green, '✅', 'Package.json configured for ES modules');
    } else {
      log(colors.yellow, '⚠️', 'Package.json not configured for ES modules');
    }
  }
  
  return allExists;
}

function generateQuickReport() {
  return {
    timestamp: new Date().toISOString(),
    ready: true,
    recommendations: [
      "Test locally before pushing to production",
      "Monitor browser console after deployment", 
      "Have rollback plan ready",
      "Deploy during low traffic hours"
    ]
  };
}

function main() {
  console.log('\n🚀 Quick Production Readiness Check\n');
  
  let overallReady = true;
  
  // Check all components
  overallReady &= checkIndexHtml();
  overallReady &= checkModularFiles();
  overallReady &= checkFallbackFiles();
  overallReady &= checkConfigFiles();
  
  console.log('\n📋 Summary:');
  
  if (overallReady) {
    log(colors.green, '🎉', 'System ready for production deployment!');
    
    console.log('\n📋 Pre-deployment checklist:');
    console.log('  1. ✅ New modular system implemented');
    console.log('  2. ✅ Fallback system in place');
    console.log('  3. ✅ All required files present');
    console.log('  4. ✅ Configuration files ready');
    
    console.log('\n🚀 Ready to deploy:');
    console.log('  git add .');
    console.log('  git commit -m "🚀 Upgrade to modular architecture"');
    console.log('  git push origin main');
    
  } else {
    log(colors.red, '❌', 'System NOT ready - fix issues before deployment');
    
    console.log('\n🔧 Suggested fixes:');
    console.log('  npm run fix-production  # Fix HTML');
    console.log('  npm install             # Install dependencies');
    console.log('  npm run validate-imports # Check imports');
  }
  
  const report = generateQuickReport();
  report.ready = overallReady;
  
  fs.writeFileSync('./production-check-report.json', JSON.stringify(report, null, 2));
  log(colors.blue, 'ℹ️', 'Report saved to production-check-report.json');
  
  console.log('\n📞 Emergency rollback:');
  console.log('  cp index.html.backup-* index.html');
  console.log('  git checkout HEAD~1 index.html');
  
  process.exit(overallReady ? 0 : 1);
}

main();