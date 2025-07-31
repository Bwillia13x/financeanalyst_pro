#!/usr/bin/env node

// Bundle Budget Checker
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Bundle size budgets in KB (gzipped)
const BUDGETS = {
  // Individual chunks
  'react-vendor': 250,      // React ecosystem
  'charts-vendor': 120,     // Visualization libraries  
  'ui-vendor': 40,          // Animation/UI libraries
  'data-vendor': 20,        // Data processing
  'utils-vendor': 15,       // Utility libraries
  'state-vendor': 10,       // Redux
  'seo-vendor': 5,          // SEO libraries
  
  // Page chunks
  'PrivateAnalysis': 60,    // Main analysis page
  'ValuationTool': 20,      // Valuation tools
  'financial-model-workspace': 45, // Workspace page
  
  // Critical limits
  'total-js': 1024,         // Total JS budget (1MB)
  'total-css': 100,         // Total CSS budget (100KB)
  'initial-bundle': 300,    // Critical path bundle
};

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  'bundle-count': 35,       // Maximum number of chunks
  'chunk-overhead': 0.15,   // 15% overhead allowance
  'compression-ratio': 0.25 // Minimum compression ratio
};

async function checkBundleBudgets() {
  console.log('🔍 Checking bundle size budgets...\n');
  
  try {
    // Get build statistics
    const distPath = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(distPath)) {
      throw new Error('Build directory not found. Run `npm run build` first.');
    }
    
    // Parse build output for bundle sizes
    const buildOutput = execSync('npm run build 2>&1', { encoding: 'utf8' });
    const bundleSizes = parseBuildOutput(buildOutput);
    
    // Check individual budgets
    const violations = [];
    const warnings = [];
    
    Object.entries(BUDGETS).forEach(([bundleName, budgetKB]) => {
      const actualSize = findBundleSize(bundleSizes, bundleName);
      
      if (actualSize > 0) {
        const overBudget = actualSize - budgetKB;
        const overPercentage = (overBudget / budgetKB) * 100;
        
        if (overBudget > 0) {
          if (overPercentage > 20) {
            violations.push({
              bundle: bundleName,
              actual: actualSize,
              budget: budgetKB,
              overBy: overBudget,
              percentage: overPercentage.toFixed(1)
            });
          } else if (overPercentage > 10) {
            warnings.push({
              bundle: bundleName,
              actual: actualSize,
              budget: budgetKB,
              overBy: overBudget,
              percentage: overPercentage.toFixed(1)
            });
          }
        }
        
        console.log(`✅ ${bundleName}: ${actualSize}KB (budget: ${budgetKB}KB)`);
      }
    });
    
    // Check performance thresholds
    checkPerformanceThresholds(bundleSizes, violations, warnings);
    
    // Report results
    if (violations.length > 0) {
      console.log('\n❌ Bundle Budget Violations:');
      violations.forEach(v => {
        console.log(`  ${v.bundle}: ${v.actual}KB > ${v.budget}KB (+${v.overBy}KB, +${v.percentage}%)`);
      });
    }
    
    if (warnings.length > 0) {
      console.log('\n⚠️  Bundle Budget Warnings:');
      warnings.forEach(w => {
        console.log(`  ${w.bundle}: ${w.actual}KB > ${w.budget}KB (+${w.overBy}KB, +${w.percentage}%)`);
      });
    }
    
    if (violations.length === 0 && warnings.length === 0) {
      console.log('\n🎉 All bundle budgets are within limits!');
    }
    
    // Generate bundle report
    generateBundleReport(bundleSizes, violations, warnings);
    
    // Exit with error if there are violations
    if (violations.length > 0) {
      console.log('\n💥 Bundle budget check failed. Please optimize bundle sizes.');
      process.exit(1);
    }
    
    if (warnings.length > 0) {
      console.log('\n⚠️  Bundle budget check passed with warnings.');
    }
    
  } catch (error) {
    console.error('Error checking bundle budgets:', error.message);
    process.exit(1);
  }
}

function parseBuildOutput(output) {
  const lines = output.split('\n');
  const bundleLines = lines.filter(line => 
    line.includes('dist/assets/') && 
    line.includes('gzip:') &&
    (line.includes('.js') || line.includes('.css'))
  );
  
  const bundles = [];
  
  bundleLines.forEach(line => {
    const match = line.match(/dist\/assets\/(.+?)\s+(.+?)\s+│\s+gzip:\s+(.+?)\s/);
    if (match) {
      const [, filename, rawSize, gzipSize] = match;
      bundles.push({
        filename,
        rawSize: parseSize(rawSize),
        gzipSize: parseSize(gzipSize)
      });
    }
  });
  
  return bundles;
}

function parseSize(sizeStr) {
  const match = sizeStr.match(/(.+?)\s*(kB|KB|MB)/);
  if (match) {
    const [, value, unit] = match;
    const numValue = parseFloat(value);
    return unit.toLowerCase() === 'mb' ? numValue * 1024 : numValue;
  }
  return 0;
}

function findBundleSize(bundles, bundleName) {
  // Handle special cases
  if (bundleName === 'total-js') {
    return bundles
      .filter(b => b.filename.endsWith('.js'))
      .reduce((sum, b) => sum + b.gzipSize, 0);
  }
  
  if (bundleName === 'total-css') {
    return bundles
      .filter(b => b.filename.endsWith('.css'))
      .reduce((sum, b) => sum + b.gzipSize, 0);
  }
  
  if (bundleName === 'initial-bundle') {
    // Estimate critical path bundle size
    const criticalBundles = bundles.filter(b => 
      b.filename.includes('index-') || 
      b.filename.includes('react-vendor') ||
      b.filename.includes('utils-vendor')
    );
    return criticalBundles.reduce((sum, b) => sum + b.gzipSize, 0);
  }
  
  // Find bundle by name pattern
  const bundle = bundles.find(b => 
    b.filename.toLowerCase().includes(bundleName.toLowerCase()) ||
    bundleName.toLowerCase().includes(b.filename.split('-')[0]?.toLowerCase())
  );
  
  return bundle ? bundle.gzipSize : 0;
}

function checkPerformanceThresholds(bundles, violations, warnings) {
  const totalChunks = bundles.length;
  const totalSize = bundles.reduce((sum, b) => sum + b.rawSize, 0);
  const totalGzipSize = bundles.reduce((sum, b) => sum + b.gzipSize, 0);
  const compressionRatio = totalGzipSize / totalSize;
  
  console.log(`\n📊 Bundle Statistics:`);
  console.log(`  Total chunks: ${totalChunks}`);
  console.log(`  Total size: ${totalSize.toFixed(1)}KB (${totalGzipSize.toFixed(1)}KB gzipped)`);
  console.log(`  Compression ratio: ${(compressionRatio * 100).toFixed(1)}%`);
  
  // Check chunk count
  if (totalChunks > PERFORMANCE_THRESHOLDS['bundle-count']) {
    warnings.push({
      bundle: 'chunk-count',
      actual: totalChunks,
      budget: PERFORMANCE_THRESHOLDS['bundle-count'],
      overBy: totalChunks - PERFORMANCE_THRESHOLDS['bundle-count'],
      percentage: 'N/A'
    });
  }
  
  // Check compression ratio
  if (compressionRatio > (1 - PERFORMANCE_THRESHOLDS['compression-ratio'])) {
    warnings.push({
      bundle: 'compression-ratio',
      actual: `${(compressionRatio * 100).toFixed(1)}%`,
      budget: `${(PERFORMANCE_THRESHOLDS['compression-ratio'] * 100).toFixed(1)}%`,
      overBy: 'Poor compression',
      percentage: 'N/A'
    });
  }
}

function generateBundleReport(bundles, violations, warnings) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalBundles: bundles.length,
      totalSize: bundles.reduce((sum, b) => sum + b.rawSize, 0),
      totalGzipSize: bundles.reduce((sum, b) => sum + b.gzipSize, 0),
      violations: violations.length,
      warnings: warnings.length
    },
    bundles: bundles.sort((a, b) => b.gzipSize - a.gzipSize),
    violations,
    warnings
  };
  
  fs.writeFileSync('bundle-report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Bundle report saved to bundle-report.json');
}

// Run the check
if (require.main === module) {
  checkBundleBudgets();
}

module.exports = { checkBundleBudgets };