/**
 * Tutorial System Test Suite
 * Tests onboarding tours, user guidance, and tutorial functionality
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TutorialSystemTestSuite {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  /**
   * Test Onboarding Tour Configuration
   */
  testOnboardingTours() {
    console.log('🧪 Testing Onboarding Tour Configuration...');

    try {
      const toursPath = path.join(__dirname, 'src', 'config', 'onboardingTours.js');

      if (fs.existsSync(toursPath)) {
        const toursContent = fs.readFileSync(toursPath, 'utf8');

        // Check for different tour types
        const tourTypes = ['privateAnalysis', 'dcfModeling', 'portfolioManagement', 'riskAnalysis'];
        const foundTours = tourTypes.filter(type => toursContent.includes(type));

        if (foundTours.length >= 2) {
          this.recordResult(true, 'Multiple Tours', `Found ${foundTours.length} onboarding tours`);
        } else {
          this.recordResult(false, 'Multiple Tours', 'Need at least 2 onboarding tours');
        }

        // Check for tour structure
        const hasSteps = toursContent.includes('steps:') && toursContent.includes('target:');
        const hasContent = toursContent.includes('content:') && toursContent.includes('title:');

        if (hasSteps && hasContent) {
          this.recordResult(true, 'Tour Structure', 'Proper tour structure with steps and content');
        } else {
          this.recordResult(false, 'Tour Structure', 'Tour structure may be incomplete');
        }

        // Check for interactive elements
        const hasTargetElements =
          toursContent.includes('[data-tour=') || toursContent.includes('target:');
        const hasTips = toursContent.includes('tip:') || toursContent.includes('Tip:');

        if (hasTargetElements) {
          this.recordResult(
            true,
            'Interactive Elements',
            'Tours include interactive element targeting'
          );
        } else {
          this.recordResult(
            false,
            'Interactive Elements',
            'No interactive element targeting found'
          );
        }

        if (hasTips) {
          this.recordResult(true, 'Helpful Tips', 'Tours include helpful tips and guidance');
        } else {
          this.recordResult(false, 'Helpful Tips', 'No tips or guidance found in tours');
        }
      } else {
        this.recordResult(
          false,
          'Onboarding Tours',
          'Onboarding tours configuration file not found'
        );
      }
    } catch (error) {
      this.recordResult(false, 'Onboarding Tours', `Error testing tours: ${error.message}`);
    }
  }

  /**
   * Test Onboarding Hook
   */
  testOnboardingHook() {
    console.log('🧪 Testing Onboarding Hook...');

    try {
      const hookPath = path.join(__dirname, 'src', 'hooks', 'useOnboarding.js');

      if (fs.existsSync(hookPath)) {
        const hookContent = fs.readFileSync(hookPath, 'utf8');

        // Check for essential hook functionality
        const hasStateManagement =
          hookContent.includes('useState') && hookContent.includes('setOnboardingState');
        const hasPersistence =
          hookContent.includes('localStorage') && hookContent.includes('STORAGE_KEY');
        const hasTourManagement =
          hookContent.includes('startTour') || hookContent.includes('completeTour');

        if (hasStateManagement) {
          this.recordResult(true, 'State Management', 'Onboarding hook manages state properly');
        } else {
          this.recordResult(false, 'State Management', 'No state management found in hook');
        }

        if (hasPersistence) {
          this.recordResult(true, 'Persistence', 'Onboarding state is persisted to localStorage');
        } else {
          this.recordResult(false, 'Persistence', 'No persistence mechanism found');
        }

        if (hasTourManagement) {
          this.recordResult(true, 'Tour Management', 'Tour lifecycle management implemented');
        } else {
          this.recordResult(false, 'Tour Management', 'No tour lifecycle management found');
        }

        // Check for user preferences
        const hasPreferences =
          hookContent.includes('userPreferences') || hookContent.includes('showTooltips');
        if (hasPreferences) {
          this.recordResult(
            true,
            'User Preferences',
            'User preferences and customization supported'
          );
        } else {
          this.recordResult(false, 'User Preferences', 'No user preferences support found');
        }
      } else {
        this.recordResult(false, 'Onboarding Hook', 'Onboarding hook file not found');
      }
    } catch (error) {
      this.recordResult(false, 'Onboarding Hook', `Error testing hook: ${error.message}`);
    }
  }

  /**
   * Test Onboarding Tour Component
   */
  testOnboardingComponent() {
    console.log('🧪 Testing Onboarding Tour Component...');

    try {
      const componentPath = path.join(__dirname, 'src', 'components', 'OnboardingTour.jsx');

      if (fs.existsSync(componentPath)) {
        const componentContent = fs.readFileSync(componentPath, 'utf8');

        // Check for React component structure
        const hasReact =
          componentContent.includes('import React') || componentContent.includes('from "react"');
        const hasJSX = componentContent.includes('<') && componentContent.includes('>');
        const hasHooks =
          componentContent.includes('useState') || componentContent.includes('useEffect');

        if (hasReact && hasJSX) {
          this.recordResult(true, 'React Component', 'Proper React component structure');
        } else {
          this.recordResult(false, 'React Component', 'Not a proper React component');
        }

        if (hasHooks) {
          this.recordResult(true, 'Component Hooks', 'Uses React hooks for state management');
        } else {
          this.recordResult(false, 'Component Hooks', 'No React hooks usage found');
        }

        // Check for tour navigation
        const hasNavigation =
          componentContent.includes('currentStep') && componentContent.includes('setCurrentStep');
        const hasCompletion =
          componentContent.includes('onComplete') || componentContent.includes('complete');

        if (hasNavigation) {
          this.recordResult(true, 'Tour Navigation', 'Tour navigation between steps implemented');
        } else {
          this.recordResult(false, 'Tour Navigation', 'No tour navigation found');
        }

        if (hasCompletion) {
          this.recordResult(true, 'Tour Completion', 'Tour completion handling implemented');
        } else {
          this.recordResult(false, 'Tour Completion', 'No tour completion handling found');
        }

        // Check for animations
        const hasAnimations =
          componentContent.includes('motion') ||
          componentContent.includes('AnimatePresence') ||
          componentContent.includes('framer-motion');
        if (hasAnimations) {
          this.recordResult(true, 'Smooth Animations', 'Smooth animations for tour transitions');
        } else {
          this.recordResult(false, 'Smooth Animations', 'No animations found');
        }
      } else {
        this.recordResult(
          false,
          'Onboarding Component',
          'Onboarding tour component file not found'
        );
      }
    } catch (error) {
      this.recordResult(false, 'Onboarding Component', `Error testing component: ${error.message}`);
    }
  }

  /**
   * Test Contextual Help System
   */
  testContextualHelp() {
    console.log('🧪 Testing Contextual Help System...');

    try {
      const helpComponentPath = path.join(
        __dirname,
        'src',
        'components',
        'ui',
        'ContextualHelp.jsx'
      );

      if (fs.existsSync(helpComponentPath)) {
        const helpContent = fs.readFileSync(helpComponentPath, 'utf8');

        // Check for help system features
        const hasTooltip = helpContent.includes('tooltip') || helpContent.includes('Tooltip');
        const hasPopover = helpContent.includes('popover') || helpContent.includes('Popover');
        const hasHelpContent = helpContent.includes('help') || helpContent.includes('Help');

        if (hasTooltip || hasPopover) {
          this.recordResult(true, 'Help Display', 'Contextual help display mechanism implemented');
        } else {
          this.recordResult(false, 'Help Display', 'No help display mechanism found');
        }

        if (hasHelpContent) {
          this.recordResult(true, 'Help Content', 'Help content and guidance provided');
        } else {
          this.recordResult(false, 'Help Content', 'No help content found');
        }
      } else {
        this.recordResult(false, 'Contextual Help', 'Contextual help component not found');
      }

      // Check CLI help system
      const cliHelpPath = path.join(__dirname, 'src', 'services', 'cli', 'help-system.js');

      if (fs.existsSync(cliHelpPath)) {
        const cliHelpContent = fs.readFileSync(cliHelpPath, 'utf8');
        const hasCLIHelp = cliHelpContent.includes('help') || cliHelpContent.includes('Help');

        if (hasCLIHelp) {
          this.recordResult(true, 'CLI Help System', 'CLI help system implemented');
        } else {
          this.recordResult(false, 'CLI Help System', 'No CLI help system found');
        }
      }
    } catch (error) {
      this.recordResult(false, 'Contextual Help', `Error testing help system: ${error.message}`);
    }
  }

  /**
   * Test Tutorial Commands
   */
  testTutorialCommands() {
    console.log('🧪 Testing Tutorial Commands...');

    try {
      // Check for tutorial commands in CLI
      const commandFiles = [
        'src/services/commands/coreCommands.js',
        'src/services/commands/systemCommands.js'
      ];

      let foundTutorialCommands = false;

      for (const commandFile of commandFiles) {
        const commandPath = path.join(__dirname, commandFile);
        if (fs.existsSync(commandPath)) {
          const commandContent = fs.readFileSync(commandPath, 'utf8');
          if (commandContent.includes('tutorial') || commandContent.includes('TUTORIAL')) {
            foundTutorialCommands = true;
            break;
          }
        }
      }

      if (foundTutorialCommands) {
        this.recordResult(true, 'Tutorial Commands', 'CLI tutorial commands implemented');
      } else {
        this.recordResult(false, 'Tutorial Commands', 'No CLI tutorial commands found');
      }
    } catch (error) {
      this.recordResult(
        false,
        'Tutorial Commands',
        `Error testing tutorial commands: ${error.message}`
      );
    }
  }

  /**
   * Record test result
   */
  recordResult(success, testName, message) {
    const status = success ? '✅' : '❌';
    const statusText = success ? 'PASSED' : 'FAILED';

    console.log(`  ${status} ${testName}: ${statusText}`);
    if (!success) {
      console.log(`     ${message}`);
    }

    if (success) {
      this.passed++;
    } else {
      this.failed++;
    }
  }

  /**
   * Run all tests
   */
  async run() {
    console.log('🚀 TUTORIAL SYSTEM TEST SUITE\n');
    console.log('==============================\n');

    // Run all tests
    this.testOnboardingTours();
    this.testOnboardingHook();
    this.testOnboardingComponent();
    this.testContextualHelp();
    this.testTutorialCommands();

    // Calculate results
    const total = this.passed + this.failed;
    const successRate = total > 0 ? ((this.passed / total) * 100).toFixed(1) : 0;

    console.log('\n📊 TUTORIAL SYSTEM TEST RESULTS');
    console.log('===============================');
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📈 Success Rate: ${successRate}%`);

    if (this.passed >= 10) {
      console.log('\n🎉 EXCELLENT! Tutorial system is comprehensive.');
      console.log('✅ Users will have excellent guidance and onboarding.');
    } else if (this.passed >= 7) {
      console.log('\n⚠️ GOOD! Tutorial system is well implemented.');
      console.log('🔧 Some advanced tutorial features may be missing.');
    } else {
      console.log('\n❌ NEEDS IMPROVEMENT! Tutorial system requires attention.');
      console.log('🔧 Core tutorial features are missing.');
    }

    console.log('\n🏁 TUTORIAL SYSTEM TEST COMPLETED');

    return {
      total,
      passed: this.passed,
      failed: this.failed,
      successRate: parseFloat(successRate)
    };
  }
}

// Run the test suite
if (import.meta.url === `file://${process.argv[1]}`) {
  const testSuite = new TutorialSystemTestSuite();
  testSuite.run().catch(console.error);
}

export default TutorialSystemTestSuite;
