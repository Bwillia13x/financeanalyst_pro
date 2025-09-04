#!/usr/bin/env node

/**
 * Debug Rate Limiting
 * Debug the rate limiting issue that's preventing basic commands
 */

import { EnhancedCLI } from './src/services/cli/enhanced-cli.js';

// Set up global mocks
if (typeof crypto === 'undefined') {
  global.crypto = {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9)
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

async function debugRateLimiting() {
  console.log('🐛 Debugging Rate Limiting Issue...');

  try {
    // Initialize CLI
    const cli = new EnhancedCLI({
      enablePlugins: true,
      enableSecurity: true,
      enableCaching: true,
      enableRealTime: true
    });

    await cli.initialize();
    console.log('✅ CLI initialized');

    // Check rate limiter state
    console.log('\n📋 Rate Limiter State:');
    console.log('Role limiters:', cli.securityManager.rateLimiter.size);
    cli.securityManager.rateLimiter.forEach((limiter, role) => {
      console.log(`  ${role}: limit=${limiter.limit}, requests=${limiter.requests.length}, violations=${limiter.violations}`);
    });

    // Check permissions state
    console.log('\n📋 Permissions State:');
    console.log('Role permissions:');
    cli.securityManager.rolePermissions.forEach((permissions, role) => {
      console.log(`  ${role}: [${permissions.join(', ')}]`);
    });

    console.log('Command permissions:');
    for (const [command, perms] of Object.entries(cli.securityManager.commandPermissions)) {
      console.log(`  ${command}: [${perms.join(', ')}]`);
    }

    // Test rate limiting directly
    console.log('\n📋 Testing Rate Limiting Directly:');
    const rateLimitCheck = await cli.securityManager.checkRateLimit('test-user', 'help', { userRole: 'viewer' });
    console.log('Rate limit check result:', rateLimitCheck);

    // Test security validation
    console.log('\n📋 Testing Security Validation:');
    const parsedCommand = {
      name: 'help',
      args: { positional: [], options: {}, flags: {} },
      original: 'help'
    };
    const securityCheck = await cli.securityManager.validateCommand(parsedCommand, { userId: 'test-user' });
    console.log('Security validation result:', securityCheck);

    // Test basic command execution step by step
    console.log('\n📋 Testing Command Execution Step by Step:');

    // Step 1: Parse command
    const input = 'help';
    console.log('1. Input:', input);

    const parsed = cli.parseCommand(input);
    console.log('2. Parsed command:', parsed);

    if (!parsed) {
      console.log('❌ Command parsing failed');
      return;
    }

    // Step 2: Security validation
    const secCheck = await cli.securityManager.validateCommand(parsed, { userId: 'test-user' });
    console.log('3. Security validation:', secCheck);

    if (!secCheck.valid) {
      console.log('❌ Security validation failed');
      return;
    }

    // Step 3: Rate limiting
    const rateCheck = await cli.securityManager.checkRateLimit('test-user', parsed.name, { userId: 'test-user' });
    console.log('4. Rate limit check:', rateCheck);

    if (!rateCheck.allowed) {
      console.log('❌ Rate limiting failed');
      return;
    }

    // Step 4: Execute command
    console.log('5. Attempting command execution...');
    const result = await cli.executeCommand(input, { userId: 'test-user' });
    console.log('6. Final result:', result);

    console.log('\n🐛 DEBUGGING COMPLETED!');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the debug
debugRateLimiting().catch(console.error);
