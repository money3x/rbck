#!/usr/bin/env node

/**
 * CSS Build Script for RBCK CMS
 * Bundles and optimizes CSS files for production
 */

const fs = require('fs');
const path = require('path');

// CSS files to bundle in order of priority
const cssFiles = [
    '../css/variables.css',
    '../css/form-validation.css',
    'beautiful-gemini-styles.css',
    '../css/cms-styles.css',
    'css/modern-ai-settings.css',
    'css/luxury-sidebar.css',
    'css/luxury-sidebar-effects.css',
    'css/luxury-sidebar-dropdown.css',
    'css/luxury-sidebar-performance.css',
    '../css/responsive-components.css',
    '../css/admin-layout.css',
    '../css/style.css'
];

// Output configuration
const outputDir = 'dist';
const outputFile = 'rbck-admin.bundle.css';

console.log('🎯 [BUILD] Starting CSS bundling process...');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log('📁 [BUILD] Created output directory:', outputDir);
}

let bundledCSS = '';
let totalSize = 0;

// Bundle CSS files
cssFiles.forEach((file, index) => {
    const filePath = path.resolve(__dirname, file);
    
    try {
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            const fileSize = Buffer.byteLength(content, 'utf8');
            totalSize += fileSize;
            
            bundledCSS += `\\n/* ===== ${file} (${fileSize} bytes) ===== */\\n`;
            bundledCSS += content + '\\n';
            
            console.log(`✅ [BUILD] Bundled: ${file} (${fileSize} bytes)`);
        } else {
            console.warn(`⚠️ [BUILD] File not found: ${file}`);
        }
    } catch (error) {
        console.error(`❌ [BUILD] Error reading ${file}:`, error.message);
    }
});

// Basic CSS minification (remove comments and excess whitespace)
const minifiedCSS = bundledCSS
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/;\s*}/g, '}') // Remove trailing semicolons before closing braces
    .replace(/\s*{\s*/g, '{') // Remove spaces around opening braces
    .replace(/;\s*/g, ';') // Remove spaces after semicolons
    .replace(/:\s*/g, ':') // Remove spaces after colons
    .trim();

const minifiedSize = Buffer.byteLength(minifiedCSS, 'utf8');
const compressionRatio = ((totalSize - minifiedSize) / totalSize * 100).toFixed(1);

// Write bundled CSS
const outputPath = path.join(outputDir, outputFile);
fs.writeFileSync(outputPath, minifiedCSS, 'utf8');

// Generate source map (simple mapping)
const sourceMap = {
    version: 3,
    sources: cssFiles,
    file: outputFile,
    mappings: '', // Simplified - would need proper source map generation for production
    names: []
};

fs.writeFileSync(outputPath + '.map', JSON.stringify(sourceMap, null, 2));

// Create performance report
const report = {
    timestamp: new Date().toISOString(),
    files: cssFiles.length,
    originalSize: totalSize,
    minifiedSize: minifiedSize,
    compressionRatio: compressionRatio + '%',
    outputFile: outputFile
};

fs.writeFileSync(path.join(outputDir, 'build-report.json'), JSON.stringify(report, null, 2));

console.log('\\n🎉 [BUILD] CSS bundling completed!');
console.log('📊 [STATS] Performance Report:');
console.log(`   • Files bundled: ${cssFiles.length}`);
console.log(`   • Original size: ${(totalSize / 1024).toFixed(1)} KB`);
console.log(`   • Minified size: ${(minifiedSize / 1024).toFixed(1)} KB`);
console.log(`   • Compression: ${compressionRatio}% reduction`);
console.log(`   • Output: ${outputPath}`);
console.log('\\n💡 [TIP] Use the bundled CSS for better performance in production');