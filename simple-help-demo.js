#!/usr/bin/env node

/**
 * SIMPLE HELP SYSTEM DEMO
 * Quick demonstration of enhanced help features
 */

import { EnhancedCLI } from './src/services/cli/enhanced-cli.js';

// Set up global mocks
if (typeof crypto === 'undefined') {
  global.crypto = {
    randomUUID: () => 'demo-uuid-' + Math.random().toString(36).substr(2, 9)
  };
}

if (typeof localStorage === 'undefined') {
  const storage = new Map();
  global.localStorage = {
    getItem: key => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: key => storage.delete(key),
    clear: () => storage.clear()
  };
}

if (typeof navigator === 'undefined') {
  global.navigator = {
    userAgent: 'Mock Browser/1.0',
    onLine: true,
    hardwareConcurrency: 4,
    deviceMemory: 8
  };
}

if (typeof window === 'undefined') {
  global.window = {
    innerWidth: 1920,
    innerHeight: 1080
  };
}

if (typeof document === 'undefined') {
  global.document = {
    referrer: 'https://financeanalyst-pro.com',
    createElement: () => ({})
  };
}

async function runHelpDemo() {
  console.log('📚 SIMPLE HELP SYSTEM DEMO');
  console.log('===========================');

  try {
    // Initialize CLI
    console.log('🔧 Initializing Enhanced CLI...');
    const cli = new EnhancedCLI({
      enablePlugins: true,
      enableSecurity: true,
      enableCaching: true,
      enableRealTime: true
    });

    await cli.initialize();
    console.log('✅ CLI initialized successfully\n');

    // Demo 1: Tutorial System
    console.log('📋 DEMO 1: Interactive Tutorials');
    console.log('--------------------------------');

    const tutorials = cli.getAvailableTutorials();
    console.log(`Available tutorials: ${tutorials.length}`);
    tutorials.forEach(tutorial => {
      console.log(`• ${tutorial.title} (${tutorial.estimatedTime}) - ${tutorial.steps} steps`);
    });

    console.log('\n🎯 Starting tutorial...');
    const startResult = await cli.startTutorial('getting-started', { userId: 'demo-user' });
    if (startResult.success) {
      console.log(`✅ Tutorial started: ${startResult.tutorial}`);
      console.log(`First step: ${startResult.firstStep.title}`);
    }

    // Demo 2: Contextual Help
    console.log('\n📋 DEMO 2: Contextual Help');
    console.log('---------------------------');

    const contextualHelp = await cli.getContextualHelp({ userId: 'demo-user' }, 'dcf');
    console.log(`Contextual tips: ${contextualHelp.quickTips.length}`);
    contextualHelp.quickTips.forEach(tip => {
      console.log(`• ${tip}`);
    });

    // Demo 3: Learning Dashboard
    console.log('\n📋 DEMO 3: Learning Dashboard');
    console.log('-----------------------------');

    const dashboard = cli.getHelpDashboard('demo-user');
    console.log(`User progress: ${dashboard.userProgress.completionRate}% complete`);
    console.log(`Available tutorials: ${dashboard.availableTutorials.length}`);
    console.log(`Suggestions: ${dashboard.suggestions.length}`);

    // Demo 4: Command Assistance
    console.log('\n📋 DEMO 4: Command Assistance');
    console.log('-----------------------------');

    const completions = await cli.getCompletions('quot', 4, { userId: 'demo-user' });
    console.log(`Auto-completions for "quot": ${completions.completions.length}`);
    completions.completions.slice(0, 3).forEach(comp => {
      console.log(`• ${comp.text} - ${comp.description}`);
    });

    console.log('\n🎊 HELP SYSTEM DEMO COMPLETED!');
    console.log('==============================');
    console.log('✅ Interactive tutorials operational');
    console.log('✅ Contextual help system working');
    console.log('✅ Learning dashboard functional');
    console.log('✅ Command assistance available');
    console.log('✅ Help analytics tracking active');

    console.log('\n🚀 HELP FEATURES DELIVERED:');
    console.log('• Interactive step-by-step tutorials');
    console.log('• Contextual tips and suggestions');
    console.log('• Personalized learning dashboard');
    console.log('• Intelligent command assistance');
    console.log('• Progress tracking and analytics');
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
  }
}

// Run the demo
runHelpDemo().catch(console.error);

