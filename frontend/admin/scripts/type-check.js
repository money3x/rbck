#!/usr/bin/env node

/**
 * 🔍 Type Checking Script
 * Comprehensive type checking for JavaScript with TypeScript
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
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

async function runTypeCheck() {
  logInfo('Starting comprehensive type checking...');
  
  let hasErrors = false;
  
  try {
    // Check if TypeScript is installed
    try {
      execSync('npx tsc --version', { stdio: 'pipe' });
    } catch (error) {
      logError('TypeScript not found. Installing...');
      execSync('npm install --save-dev typescript @types/node', { stdio: 'inherit' });
    }
    
    // Run TypeScript type checking
    logInfo('Running TypeScript type checking...');
    try {
      const tscOutput = execSync('npx tsc --noEmit', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      if (tscOutput.trim()) {
        logWarning('TypeScript warnings:');
        console.log(tscOutput);
      } else {
        logSuccess('TypeScript type checking passed');
      }
    } catch (error) {
      hasErrors = true;
      logError('TypeScript type checking failed:');
      console.log(error.stdout);
    }
    
    // Run ESLint with type checking
    logInfo('Running ESLint...');
    try {
      execSync('npx eslint js/**/*.js --format=stylish', { stdio: 'inherit' });
      logSuccess('ESLint passed');
    } catch (error) {
      hasErrors = true;
      logError('ESLint failed');
    }
    
    // Check JSDoc coverage
    logInfo('Checking JSDoc coverage...');
    const jsFiles = getJavaScriptFiles('./js');
    const jsdocCoverage = checkJSDocCoverage(jsFiles);
    
    if (jsdocCoverage.coverage >= 80) {
      logSuccess(`JSDoc coverage: ${jsdocCoverage.coverage.toFixed(1)}%`);
    } else {
      logWarning(`JSDoc coverage: ${jsdocCoverage.coverage.toFixed(1)}% (target: 80%)`);
      logInfo('Files missing JSDoc:');
      jsdocCoverage.missing.forEach(file => {
        console.log(`  - ${file}`);
      });
    }
    
    // Check type imports
    logInfo('Checking type imports...');
    const typeImportIssues = checkTypeImports(jsFiles);
    
    if (typeImportIssues.length === 0) {
      logSuccess('All type imports are valid');
    } else {
      logWarning('Type import issues found:');
      typeImportIssues.forEach(issue => {
        console.log(`  - ${issue.file}: ${issue.message}`);
      });
    }
    
    // Generate type report
    logInfo('Generating type safety report...');
    const report = generateTypeReport({
      jsdocCoverage,
      typeImportIssues,
      hasTypeScriptErrors: hasErrors
    });
    
    fs.writeFileSync('./reports/type-safety-report.json', JSON.stringify(report, null, 2));
    logSuccess('Type safety report generated: ./reports/type-safety-report.json');
    
    // Summary
    console.log('\n' + colors.bright + '📊 Type Checking Summary' + colors.reset);
    console.log(`JSDoc Coverage: ${jsdocCoverage.coverage.toFixed(1)}%`);
    console.log(`Type Import Issues: ${typeImportIssues.length}`);
    console.log(`Overall Status: ${hasErrors ? colors.red + 'FAILED' : colors.green + 'PASSED'}${colors.reset}`);
    
    if (hasErrors) {
      process.exit(1);
    }
    
  } catch (error) {
    logError(`Type checking failed: ${error.message}`);
    process.exit(1);
  }
}

function getJavaScriptFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (stat.isFile() && item.endsWith('.js')) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function checkJSDocCoverage(files) {
  let totalFunctions = 0;
  let documentedFunctions = 0;
  const missing = [];
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const functions = extractFunctions(content);
    
    totalFunctions += functions.length;
    
    for (const func of functions) {
      if (hasJSDocComment(content, func.start)) {
        documentedFunctions++;
      } else {
        missing.push(`${file}:${func.name}`);
      }
    }
  }
  
  return {
    coverage: totalFunctions > 0 ? (documentedFunctions / totalFunctions) * 100 : 100,
    total: totalFunctions,
    documented: documentedFunctions,
    missing
  };
}

function extractFunctions(content) {
  const functions = [];
  
  // Regular expressions for different function types
  const patterns = [
    /(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
    /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*(?:async\s+)?function/g,
    /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(\s*.*?\s*\)\s*=>/g,
    /(?:async\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      functions.push({
        name: match[1],
        start: match.index
      });
    }
  }
  
  return functions;
}

function hasJSDocComment(content, position) {
  const before = content.substring(0, position);
  const lines = before.split('\n');
  
  // Look for JSDoc comment in the previous few lines
  for (let i = lines.length - 1; i >= Math.max(0, lines.length - 5); i--) {
    const line = lines[i].trim();
    if (line.includes('/**') || line.includes('*') || line.includes('*/')) {
      return true;
    }
    if (line && !line.startsWith('//')) {
      break;
    }
  }
  
  return false;
}

function checkTypeImports(files) {
  const issues = [];
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    
    // Check for @typedef imports
    const typedefMatches = content.match(/@typedef\s+\{import\(['"]([^'"]+)['"]\)\.(\w+)\}/g);
    if (typedefMatches) {
      for (const match of typedefMatches) {
        const typedefMatch = match.match(/@typedef\s+\{import\(['"]([^'"]+)['"]\)\.(\w+)\}/);
        if (typedefMatch) {
          const importPath = typedefMatch[1];
          const typeName = typedefMatch[2];
          
          // Check if the imported file exists
          const resolvedPath = path.resolve(path.dirname(file), importPath);
          if (!fs.existsSync(resolvedPath) && !fs.existsSync(resolvedPath + '.d.ts')) {
            issues.push({
              file,
              message: `Type import not found: ${importPath}`
            });
          }
        }
      }
    }
    
    // Check for missing type annotations
    const functionMatches = content.match(/function\s+\w+\s*\([^)]*\)\s*\{/g);
    if (functionMatches) {
      for (const funcMatch of functionMatches) {
        if (!content.includes('@param') && !content.includes('@returns')) {
          // This function might need type annotations
        }
      }
    }
  }
  
  return issues;
}

function generateTypeReport(data) {
  return {
    timestamp: new Date().toISOString(),
    summary: {
      jsdocCoverage: data.jsdocCoverage.coverage,
      typeImportIssues: data.typeImportIssues.length,
      hasTypeScriptErrors: data.hasTypeScriptErrors,
      overallStatus: data.hasTypeScriptErrors ? 'FAILED' : 'PASSED'
    },
    details: {
      jsdoc: data.jsdocCoverage,
      typeImports: data.typeImportIssues
    },
    recommendations: generateRecommendations(data)
  };
}

function generateRecommendations(data) {
  const recommendations = [];
  
  if (data.jsdocCoverage.coverage < 80) {
    recommendations.push({
      type: 'jsdoc',
      priority: 'high',
      message: 'Increase JSDoc coverage to at least 80%',
      action: 'Add JSDoc comments to functions and methods'
    });
  }
  
  if (data.typeImportIssues.length > 0) {
    recommendations.push({
      type: 'imports',
      priority: 'medium',
      message: 'Fix type import issues',
      action: 'Verify that all type imports reference valid files'
    });
  }
  
  if (data.hasTypeScriptErrors) {
    recommendations.push({
      type: 'typescript',
      priority: 'high',
      message: 'Fix TypeScript compilation errors',
      action: 'Address type errors found by TypeScript compiler'
    });
  }
  
  return recommendations;
}

// Ensure reports directory exists
if (!fs.existsSync('./reports')) {
  fs.mkdirSync('./reports', { recursive: true });
}

// Run type checking
runTypeCheck().catch(error => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
});