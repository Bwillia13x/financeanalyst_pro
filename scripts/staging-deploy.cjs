#!/usr/bin/env node

// Staging Deployment and Live Audit Script
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const STAGING_URL = process.env.STAGING_URL || 'http://localhost:4173';
const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://valor-ivx.com';

async function runStagingDeployment() {
  console.log('🚀 Starting staging deployment and live audits...\n');

  try {
    // Step 1: Build production version
    console.log('📦 Building production version...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // Step 2: Start preview server
    console.log('🌐 Starting preview server...');
    const serverProcess = execSync('npm run preview &', { stdio: 'pipe' });
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 3: Install Lighthouse CLI if not available
    try {
      execSync('lighthouse --version', { stdio: 'pipe' });
    } catch {
      console.log('📥 Installing Lighthouse CLI...');
      execSync('npm install -g lighthouse', { stdio: 'inherit' });
    }
    
    // Step 4: Run comprehensive Lighthouse audits
    console.log('🔍 Running live Lighthouse audits...');
    
    const auditResults = await runLighthouseAudits();
    
    // Step 5: Generate comprehensive report
    generateAuditReport(auditResults);
    
    // Step 6: Check performance budgets
    console.log('💰 Checking performance budgets...');
    execSync('npm run budget:check', { stdio: 'inherit' });
    
    console.log('\n✅ Staging deployment and audits complete!');
    
  } catch (error) {
    console.error('❌ Staging deployment failed:', error.message);
    process.exit(1);
  }
}

async function runLighthouseAudits() {
  const routes = [
    { path: '/', name: 'Home' },
    { path: '/valuation-tool', name: 'Valuation Tool' },
    { path: '/private-analysis', name: 'Private Analysis' },
    { path: '/financial-model-workspace', name: 'Financial Workspace' }
  ];
  
  const results = {};
  
  for (const route of routes) {
    const url = `${STAGING_URL}${route.path}`;
    console.log(`\n🔍 Auditing ${route.name} (${url})...`);
    
    try {
      // Run Lighthouse audit
      const outputPath = `lighthouse-${route.name.toLowerCase().replace(/\s+/g, '-')}-report.json`;
      
      execSync(`lighthouse ${url} --output=json --output-path=${outputPath} --chrome-flags="--headless --no-sandbox" --only-categories=performance,accessibility,best-practices,seo`, {
        stdio: 'pipe'
      });
      
      // Read and parse results
      const reportData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
      
      results[route.name] = {
        url,
        scores: {
          performance: Math.round(reportData.categories.performance.score * 100),
          accessibility: Math.round(reportData.categories.accessibility.score * 100),
          bestPractices: Math.round(reportData.categories['best-practices'].score * 100),
          seo: Math.round(reportData.categories.seo.score * 100)
        },
        metrics: {
          fcp: reportData.audits['first-contentful-paint'].numericValue,
          lcp: reportData.audits['largest-contentful-paint'].numericValue,
          cls: reportData.audits['cumulative-layout-shift'].numericValue,
          fid: reportData.audits['max-potential-fid']?.numericValue || 0,
          speedIndex: reportData.audits['speed-index'].numericValue,
          interactive: reportData.audits.interactive.numericValue
        },
        opportunities: reportData.audits['unused-javascript'] ? {
          unusedJS: Math.round(reportData.audits['unused-javascript'].details?.overallSavingsBytes / 1024) || 0,
          unusedCSS: Math.round(reportData.audits['unused-css-rules']?.details?.overallSavingsBytes / 1024) || 0,
          imageOptimization: Math.round(reportData.audits['modern-image-formats']?.details?.overallSavingsBytes / 1024) || 0
        } : {}
      };
      
      console.log(`✅ ${route.name}: Performance ${results[route.name].scores.performance}/100`);
      
    } catch (error) {
      console.error(`❌ Failed to audit ${route.name}:`, error.message);
      results[route.name] = { error: error.message };
    }
  }
  
  return results;
}

function generateAuditReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    stagingUrl: STAGING_URL,
    summary: calculateSummary(results),
    routes: results,
    recommendations: generateRecommendations(results)
  };
  
  // Save detailed JSON report
  fs.writeFileSync('staging-audit-report.json', JSON.stringify(report, null, 2));
  
  // Generate human-readable markdown report
  const markdownReport = generateMarkdownReport(report);
  fs.writeFileSync('staging-audit-report.md', markdownReport);
  
  console.log('\n📊 Audit Summary:');
  console.log(`Average Performance Score: ${report.summary.avgPerformance}/100`);
  console.log(`Average Accessibility Score: ${report.summary.avgAccessibility}/100`);
  console.log(`Average SEO Score: ${report.summary.avgSeo}/100`);
  console.log(`Average Best Practices Score: ${report.summary.avgBestPractices}/100`);
  
  if (report.summary.criticalIssues > 0) {
    console.log(`\n⚠️  Critical Issues Found: ${report.summary.criticalIssues}`);
  }
  
  console.log('\n📄 Reports saved:');
  console.log('  - staging-audit-report.json (detailed data)');
  console.log('  - staging-audit-report.md (readable report)');
}

function calculateSummary(results) {
  const validResults = Object.values(results).filter(r => !r.error);
  
  if (validResults.length === 0) {
    return { error: 'No valid audit results' };
  }
  
  const scores = validResults.map(r => r.scores);
  
  return {
    totalRoutes: Object.keys(results).length,
    successfulAudits: validResults.length,
    avgPerformance: Math.round(scores.reduce((sum, s) => sum + s.performance, 0) / scores.length),
    avgAccessibility: Math.round(scores.reduce((sum, s) => sum + s.accessibility, 0) / scores.length),
    avgSeo: Math.round(scores.reduce((sum, s) => sum + s.seo, 0) / scores.length),
    avgBestPractices: Math.round(scores.reduce((sum, s) => sum + s.bestPractices, 0) / scores.length),
    criticalIssues: validResults.filter(r => 
      r.scores.performance < 50 || 
      r.scores.accessibility < 80 || 
      r.scores.seo < 80
    ).length
  };
}

function generateRecommendations(results) {
  const recommendations = [];
  
  Object.entries(results).forEach(([routeName, result]) => {
    if (result.error) return;
    
    const { scores, metrics, opportunities } = result;
    
    // Performance recommendations
    if (scores.performance < 90) {
      if (metrics.lcp > 2500) {
        recommendations.push({
          route: routeName,
          category: 'Performance',
          issue: 'Slow Largest Contentful Paint',
          value: `${Math.round(metrics.lcp)}ms`,
          target: '<2500ms',
          priority: 'High'
        });
      }
      
      if (metrics.cls > 0.1) {
        recommendations.push({
          route: routeName,
          category: 'Performance',
          issue: 'Layout Shift Issues',
          value: metrics.cls.toFixed(3),
          target: '<0.1',
          priority: 'High'
        });
      }
    }
    
    // Bundle optimization opportunities
    if (opportunities.unusedJS > 50) {
      recommendations.push({
        route: routeName,
        category: 'Bundle Size',
        issue: 'Unused JavaScript',
        value: `${opportunities.unusedJS}KB`,
        target: 'Remove unused code',
        priority: 'Medium'
      });
    }
    
    // Accessibility issues
    if (scores.accessibility < 95) {
      recommendations.push({
        route: routeName,
        category: 'Accessibility',
        issue: 'Accessibility improvements needed',
        value: `${scores.accessibility}/100`,
        target: '95+/100',
        priority: 'High'
      });
    }
  });
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

function generateMarkdownReport(report) {
  const { summary, routes, recommendations } = report;
  
  let markdown = `# Staging Audit Report\n\n`;
  markdown += `**Generated:** ${new Date(report.timestamp).toLocaleString()}\n`;
  markdown += `**Staging URL:** ${report.stagingUrl}\n\n`;
  
  // Summary
  markdown += `## 📊 Summary\n\n`;
  markdown += `| Metric | Score |\n`;
  markdown += `|--------|-------|\n`;
  markdown += `| Performance | ${summary.avgPerformance}/100 |\n`;
  markdown += `| Accessibility | ${summary.avgAccessibility}/100 |\n`;
  markdown += `| SEO | ${summary.avgSeo}/100 |\n`;
  markdown += `| Best Practices | ${summary.avgBestPractices}/100 |\n`;
  markdown += `| Routes Audited | ${summary.successfulAudits}/${summary.totalRoutes} |\n\n`;
  
  // Route-by-route results
  markdown += `## 🔍 Route Analysis\n\n`;
  
  Object.entries(routes).forEach(([routeName, result]) => {
    if (result.error) {
      markdown += `### ❌ ${routeName}\n\n**Error:** ${result.error}\n\n`;
      return;
    }
    
    const { scores, metrics } = result;
    markdown += `### ${routeName}\n\n`;
    markdown += `**Scores:** Performance ${scores.performance} | Accessibility ${scores.accessibility} | SEO ${scores.seo} | Best Practices ${scores.bestPractices}\n\n`;
    markdown += `**Core Web Vitals:**\n`;
    markdown += `- LCP: ${Math.round(metrics.lcp)}ms\n`;
    markdown += `- CLS: ${metrics.cls.toFixed(3)}\n`;
    markdown += `- FCP: ${Math.round(metrics.fcp)}ms\n`;
    markdown += `- Speed Index: ${Math.round(metrics.speedIndex)}ms\n\n`;
  });
  
  // Recommendations
  if (recommendations.length > 0) {
    markdown += `## 🔧 Recommendations\n\n`;
    
    recommendations.forEach((rec, index) => {
      const priorityEmoji = rec.priority === 'High' ? '🔴' : rec.priority === 'Medium' ? '🟡' : '🟢';
      markdown += `${index + 1}. ${priorityEmoji} **${rec.route}** - ${rec.issue}\n`;
      markdown += `   - Current: ${rec.value}\n`;
      markdown += `   - Target: ${rec.target}\n`;
      markdown += `   - Priority: ${rec.priority}\n\n`;
    });
  }
  
  return markdown;
}

// Run if called directly
if (require.main === module) {
  runStagingDeployment();
}

module.exports = { runStagingDeployment };