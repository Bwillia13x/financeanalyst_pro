#!/usr/bin/env node

import { readFile, readdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '../dist/assets');

/**
 * Analyze bundle size and composition after build
 */
async function analyzeBundles() {
  try {
    console.log('🔍 Analyzing bundle composition...\n');
    
    const files = await readdir(distDir);
    const assets = [];
    
    for (const file of files) {
      if (file.endsWith('.js') || file.endsWith('.css')) {
        const filePath = path.join(distDir, file);
        const stats = await fs.stat(filePath);
        const content = await readFile(filePath, 'utf8');
        
        assets.push({
          name: file,
          size: stats.size,
          sizeKB: Math.round(stats.size / 1024),
          type: file.endsWith('.js') ? 'JS' : 'CSS',
          content: content.slice(0, 1000) // First 1KB for analysis
        });
      }
    }
    
    // Sort by size
    assets.sort((a, b) => b.size - a.size);
    
    console.log('📊 Bundle Analysis Report');
    console.log('========================\n');
    
    // Summary statistics
    const totalSize = assets.reduce((sum, asset) => sum + asset.size, 0);
    const jsAssets = assets.filter(a => a.type === 'JS');
    const cssAssets = assets.filter(a => a.type === 'CSS');
    
    console.log(`Total Bundle Size: ${Math.round(totalSize / 1024)} KB`);
    console.log(`JavaScript: ${Math.round(jsAssets.reduce((s, a) => s + a.size, 0) / 1024)} KB (${jsAssets.length} files)`);
    console.log(`CSS: ${Math.round(cssAssets.reduce((s, a) => s + a.size, 0) / 1024)} KB (${cssAssets.length} files)`);
    console.log('');
    
    // Largest bundles
    console.log('🏆 Largest Bundles:');
    console.log('-------------------');
    assets.slice(0, 10).forEach((asset, i) => {
      const bar = '█'.repeat(Math.max(1, Math.round(asset.sizeKB / 50)));
      console.log(`${i + 1}. ${asset.name}`);
      console.log(`   ${asset.sizeKB} KB ${bar}`);
    });
    console.log('');
    
    // Vendor chunk analysis
    console.log('📦 Vendor Chunk Analysis:');
    console.log('-------------------------');
    const vendorChunks = assets.filter(a => a.name.includes('vendor'));
    vendorChunks.forEach(chunk => {
      console.log(`${chunk.name}: ${chunk.sizeKB} KB`);
      
      // Analyze what's in this vendor chunk
      const libraries = [];
      if (chunk.content.includes('react')) libraries.push('React');
      if (chunk.content.includes('recharts')) libraries.push('Recharts');
      if (chunk.content.includes('framer-motion')) libraries.push('Framer Motion');
      if (chunk.content.includes('lucide')) libraries.push('Lucide Icons');
      if (chunk.content.includes('redux')) libraries.push('Redux');
      if (chunk.content.includes('axios')) libraries.push('Axios');
      if (chunk.content.includes('date-fns')) libraries.push('Date-fns');
      
      if (libraries.length > 0) {
        console.log(`   └─ Contains: ${libraries.join(', ')}`);
      }
    });
    console.log('');
    
    // Performance recommendations
    console.log('💡 Performance Recommendations:');
    console.log('-------------------------------');
    
    const largeAssets = assets.filter(a => a.sizeKB > 300);
    if (largeAssets.length > 0) {
      console.log('⚠️  Large bundles detected (>300KB):');
      largeAssets.forEach(asset => {
        console.log(`   • ${asset.name} (${asset.sizeKB} KB) - Consider code splitting`);
      });
    }
    
    const totalJS = jsAssets.reduce((s, a) => s + a.size, 0) / 1024;
    if (totalJS > 2000) {
      console.log('⚠️  Total JavaScript size exceeds 2MB - implement more aggressive code splitting');
    }
    
    if (vendorChunks.length === 0) {
      console.log('⚠️  No vendor chunks detected - ensure vendor splitting is working');
    }
    
    console.log('✅ Use dynamic imports for rarely used components');
    console.log('✅ Consider using React.lazy() for modal/dialog components');
    console.log('✅ Implement tree shaking for unused library code');
    
  } catch (error) {
    console.error('❌ Bundle analysis failed:', error.message);
    process.exit(1);
  }
}

// Add fs import that was missing
import fs from 'fs/promises';

if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeBundles();
}

export default analyzeBundles;
