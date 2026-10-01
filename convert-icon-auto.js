#!/usr/bin/env node

/**
 * AUTO-CONVERT ICON SVG to PNG
 * 
 * This script automatically converts assets/icon.svg to assets/icon-512.png
 * No manual intervention needed!
 * 
 * Usage:
 *   node convert-icon-auto.js
 */

const fs = require('fs');
const path = require('path');

// Try using sharp (if installed)
try {
  const sharp = require('sharp');
  
  console.log('🎨 Auto-converting icon.svg to PNG...\n');
  
  const inputPath = path.join(__dirname, 'assets', 'icon.svg');
  const outputPath = path.join(__dirname, 'assets', 'icon-512.png');
  
  if (!fs.existsSync(inputPath)) {
    console.error('❌ ERROR: assets/icon.svg not found');
    process.exit(1);
  }
  
  // Convert SVG to PNG using sharp
  sharp(inputPath)
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .png({ quality: 100 })
    .toFile(outputPath)
    .then(info => {
      console.log('✅ SUCCESS!');
      console.log(`   Input:  ${inputPath}`);
      console.log(`   Output: ${outputPath}`);
      console.log(`   Size:   ${info.width}x${info.height} pixels`);
      console.log(`   File:   ${(info.size / 1024).toFixed(2)} KB`);
      console.log('\n✨ Icon is ready for Google Play!');
    })
    .catch(err => {
      console.error('❌ ERROR:', err.message);
      process.exit(1);
    });

} catch (err) {
  // sharp not installed, provide instructions
  console.log('📦 NPM Package Required\n');
  console.log('   Sharp is not installed. Installing now...\n');
  
  const { execSync } = require('child_process');
  
  try {
    console.log('   Running: npm install sharp\n');
    execSync('npm install sharp --save-dev', { stdio: 'inherit' });
    console.log('\n   ✅ Sharp installed! Re-running...\n');
    execSync(`node ${__filename}`, { stdio: 'inherit' });
  } catch (installErr) {
    console.error('❌ Failed to install sharp');
    console.log('\n   Alternative: Use CloudConvert.com');
    console.log('   - Go to https://cloudconvert.com/svg-to-png');
    console.log('   - Upload assets/icon.svg');
    console.log('   - Download as icon-512.png');
    console.log('   - Save to assets/ folder\n');
    process.exit(1);
  }
}
