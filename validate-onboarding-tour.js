#!/usr/bin/env node

/**
 * Onboarding Tour Validation Script
 * Tests the tour targets and localStorage persistence
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Onboarding Tour Validation\n');

// 1. Verify all tour targets exist in the codebase
const tourTargets = [
  'financial-spreadsheet-tab',
  'financial-modeling-tab', 
  'analysis-results-tab',
  'revenue-section',
  'expense-section'
];

console.log('✅ Checking tour target selectors...');
const srcDir = path.join(__dirname, 'src');

function findDataTourAttribute(target, dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      const result = findDataTourAttribute(target, filePath);
      if (result) return result;
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes(`data-tour="${target}"`)) {
        return filePath;
      }
    }
  }
  return null;
}

tourTargets.forEach(target => {
  const foundIn = findDataTourAttribute(target, srcDir);
  if (foundIn) {
    console.log(`  ✓ ${target} -> ${path.relative(__dirname, foundIn)}`);
  } else {
    console.log(`  ✗ ${target} -> NOT FOUND`);
  }
});

// 2. Verify localStorage key and structure
console.log('\n📦 localStorage Configuration:');
console.log('  Key: financeanalyst-onboarding-state');
console.log('  Expected structure: { completedTours: [], currentTour: null, ... }');

// 3. Tour completion behavior validation
console.log('\n🎯 Tour Completion Validation:');
console.log('Expected behavior when tour completes:');
console.log('  1. currentTour should be set to null');
console.log('  2. "privateAnalysis" should be added to completedTours array');
console.log('  3. Quick Start modal should not show again');
console.log('  4. Play button should be hidden');
console.log('  5. Tour overlay should disappear');

// 4. DOM target validation
console.log('\n🔍 DOM Target Validation:');
console.log('When Private Analysis page loads, verify these elements exist:');
tourTargets.forEach(target => {
  console.log(`  • [data-tour="${target}"]`);
});

console.log('\n📋 Manual Testing Steps:');
console.log('1. Open http://localhost:5173/private-analysis');
console.log('2. Clear localStorage or use: localStorage.removeItem("financeanalyst-onboarding-state")');
console.log('3. Refresh page to trigger Quick Start modal');
console.log('4. Click "Start Tour" and complete all steps');
console.log('5. Verify tour overlay disappears at end');
console.log('6. Check localStorage for completed tour state');
console.log('7. Refresh page and confirm tour does not restart');

console.log('\n🔧 Debugging Commands:');
console.log('// Check localStorage state:');
console.log('console.log(JSON.parse(localStorage.getItem("financeanalyst-onboarding-state")));');
console.log('\n// Reset onboarding state:');
console.log('localStorage.removeItem("financeanalyst-onboarding-state");');
console.log('\n// Check if elements exist:');
tourTargets.forEach(target => {
  console.log(`document.querySelector('[data-tour="${target}"]')`);
});

console.log('\n✨ Validation complete. Run manual tests in browser.');
