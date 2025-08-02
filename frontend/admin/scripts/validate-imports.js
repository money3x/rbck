#!/usr/bin/env node

/**
 * 🔍 Import Validation Script
 * Validates all imports in main.js to ensure proper module loading
 */

const fs = require('fs');
const path = require('path');

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

async function validateImports() {
  logInfo('Validating imports in main.js...');
  
  const mainPath = path.join(process.cwd(), 'main.js');
  
  if (!fs.existsSync(mainPath)) {
    logError('main.js not found');
    return false;
  }
  
  const content = fs.readFileSync(mainPath, 'utf8');
  const importLines = content.split('\n').filter(line => 
    line.trim().startsWith('import') && line.includes('from')
  );
  
  logInfo(`Found ${importLines.length} import statements`);
  
  let allValid = true;
  
  for (const line of importLines) {
    const match = line.match(/from\s+['"`]([^'"`]+)['"`]/);
    if (match) {
      const importPath = match[1];
      const resolvedPath = resolveImportPath(importPath);
      
      if (fs.existsSync(resolvedPath)) {
        logSuccess(`Import valid: ${importPath}`);
        
        // Check if the file has proper exports
        const hasExports = checkExports(resolvedPath, line);
        if (!hasExports) {
          logWarning(`File may not have proper exports: ${importPath}`);
        }
      } else {
        logError(`Import not found: ${importPath} (resolved to: ${resolvedPath})`);
        allValid = false;
      }
    }
  }
  
  return allValid;
}

function resolveImportPath(importPath) {
  if (importPath.startsWith('./')) {
    return path.join(process.cwd(), importPath.substring(2));
  } else if (importPath.startsWith('../')) {
    return path.join(process.cwd(), importPath);
  } else {
    return path.join(process.cwd(), 'node_modules', importPath);
  }
}

function checkExports(filePath, importLine) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract what's being imported
    const importMatch = importLine.match(/import\s+\{([^}]+)\}/);
    if (importMatch) {
      const imports = importMatch[1].split(',').map(s => s.trim());
      
      for (const importName of imports) {
        const exportPattern = new RegExp(`export\\s+.*\\b${importName}\\b`);
        if (!exportPattern.test(content)) {
          logWarning(`Export not found: ${importName} in ${path.basename(filePath)}`);
          return false;
        }
      }
    }
    
    return true;
  } catch (error) {
    logWarning(`Could not check exports in ${filePath}: ${error.message}`);
    return true; // Don't fail validation for read errors
  }
}

async function checkModuleCompatibility() {
  logInfo('Checking module compatibility...');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (packageJson.type === 'module') {
      logSuccess('Package.json configured for ES modules');
    } else {
      logWarning('Package.json not configured for ES modules (add "type": "module")');
    }
  }
  
  // Check if there's a module bundler configuration
  const webpackConfig = fs.existsSync(path.join(process.cwd(), 'webpack.config.js'));
  const viteConfig = fs.existsSync(path.join(process.cwd(), 'vite.config.js'));
  
  if (webpackConfig) {
    logSuccess('Webpack configuration found');
  } else if (viteConfig) {
    logSuccess('Vite configuration found');
  } else {
    logWarning('No module bundler configuration found');
  }
}

async function generateImportMap() {
  logInfo('Generating import map...');
  
  const importMap = {
    imports: {
      // Core modules
      './blogManager.js': '/frontend/admin/blogManager.js',
      './uiHelpers.js': '/frontend/admin/uiHelpers.js',
      './modals.js': '/frontend/admin/modals.js',
      './seoTools.js': '/frontend/admin/seoTools.js',
      './aiSwarm.js': '/frontend/admin/aiSwarm.js',
      './aiMonitoringUI.js': '/frontend/admin/aiMonitoringUI.js',
      './auth.js': '/frontend/admin/auth.js',
      
      // Parent directory modules
      '../config.js': '/frontend/config.js',
      '../js/apiUtils.js': '/frontend/js/apiUtils.js',
      
      // Modular components
      '@components/modal-manager': '/frontend/admin/js/components/modal-manager.js',
      '@components/chat-interface': '/frontend/admin/js/components/chat-interface.js',
      '@services/ai-providers': '/frontend/admin/js/services/ai-providers.js',
      '@services/module-loader': '/frontend/admin/js/services/module-loader.js',
      '@services/pwa-manager': '/frontend/admin/js/services/pwa-manager.js'
    }
  };
  
  fs.writeFileSync(
    path.join(process.cwd(), 'importmap.json'),
    JSON.stringify(importMap, null, 2)
  );
  
  logSuccess('Import map generated: importmap.json');
}

async function main() {
  console.log('\n🔍 Import Validation Report\n');
  
  try {
    const importsValid = await validateImports();
    await checkModuleCompatibility();
    await generateImportMap();
    
    console.log('\n📊 Summary:');
    if (importsValid) {
      logSuccess('All imports are valid');
    } else {
      logError('Some imports have issues');
    }
    
    logInfo('Next steps:');
    console.log('  1. Use the generated importmap.json in your HTML');
    console.log('  2. Configure your bundler for proper module resolution');
    console.log('  3. Ensure all files have proper ES6 exports');
    
  } catch (error) {
    logError(`Validation failed: ${error.message}`);
    process.exit(1);
  }
}

main();