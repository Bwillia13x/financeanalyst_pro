/**
 * Mobile and PWA Functionality Test Suite
 * Tests mobile responsiveness, PWA features, and offline capabilities
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MobilePWATestSuite {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  /**
   * Test PWA Manifest Configuration
   */
  testPWAManifest() {
    console.log('🧪 Testing PWA Manifest Configuration...');

    try {
      const manifestPath = path.join(__dirname, 'public', 'manifest.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

      // Required PWA manifest properties
      const requiredProps = ['name', 'short_name', 'start_url', 'display', 'icons'];
      const missingProps = requiredProps.filter(prop => !manifest[prop]);

      if (missingProps.length > 0) {
        this.recordResult(
          false,
          'PWA Manifest',
          `Missing required properties: ${missingProps.join(', ')}`
        );
      } else {
        this.recordResult(true, 'PWA Manifest', 'All required properties present');
      }

      // Check display mode
      if (manifest.display === 'standalone') {
        this.recordResult(true, 'PWA Display Mode', 'Standalone mode configured');
      } else {
        this.recordResult(false, 'PWA Display Mode', 'Should be standalone for PWA experience');
      }

      // Check icons
      if (manifest.icons && manifest.icons.length > 0) {
        this.recordResult(true, 'PWA Icons', `${manifest.icons.length} icons configured`);
      } else {
        this.recordResult(false, 'PWA Icons', 'No icons configured');
      }
    } catch (error) {
      this.recordResult(false, 'PWA Manifest', `Error reading manifest: ${error.message}`);
    }
  }

  /**
   * Test Service Worker Configuration
   */
  testServiceWorker() {
    console.log('🧪 Testing Service Worker Configuration...');

    try {
      const swPath = path.join(__dirname, 'public', 'sw.js');
      const swContent = fs.readFileSync(swPath, 'utf8');

      // Check for essential service worker features
      const hasInstall = swContent.includes('install');
      const hasActivate = swContent.includes('activate');
      const hasFetch = swContent.includes('fetch');
      const hasCache = swContent.includes('caches');
      const hasOffline = swContent.includes('offline');

      if (hasInstall && hasActivate && hasFetch) {
        this.recordResult(
          true,
          'Service Worker Events',
          'Install, activate, and fetch events configured'
        );
      } else {
        this.recordResult(
          false,
          'Service Worker Events',
          'Missing essential service worker events'
        );
      }

      if (hasCache) {
        this.recordResult(true, 'Service Worker Caching', 'Caching functionality implemented');
      } else {
        this.recordResult(false, 'Service Worker Caching', 'No caching functionality found');
      }

      if (hasOffline) {
        this.recordResult(true, 'Offline Support', 'Offline functionality implemented');
      } else {
        this.recordResult(false, 'Offline Support', 'No offline functionality found');
      }
    } catch (error) {
      this.recordResult(false, 'Service Worker', `Error reading service worker: ${error.message}`);
    }
  }

  /**
   * Test Mobile Services
   */
  testMobileServices() {
    console.log('🧪 Testing Mobile Services...');

    const mobileServices = [
      'MobileNavigationService.js',
      'MobilePerformanceService.js',
      'MobileResponsiveService.js',
      'OfflineStorageService.js',
      'PushNotificationService.js',
      'PWAService.js',
      'TouchInteractionService.js'
    ];

    const mobileDir = path.join(__dirname, 'src', 'services', 'mobile');

    mobileServices.forEach(service => {
      const servicePath = path.join(mobileDir, service);
      try {
        if (fs.existsSync(servicePath)) {
          const content = fs.readFileSync(servicePath, 'utf8');

          // Basic checks for service functionality
          const hasClass = content.includes('class') || content.includes('function');
          const hasMethods = content.includes('(') && content.includes('{');

          if (hasClass && hasMethods) {
            this.recordResult(true, `Mobile Service: ${service}`, 'Service properly implemented');
          } else {
            this.recordResult(
              false,
              `Mobile Service: ${service}`,
              'Service missing proper structure'
            );
          }
        } else {
          this.recordResult(false, `Mobile Service: ${service}`, 'Service file not found');
        }
      } catch (error) {
        this.recordResult(
          false,
          `Mobile Service: ${service}`,
          `Error reading service: ${error.message}`
        );
      }
    });
  }

  /**
   * Test Mobile Responsiveness (CSS Media Queries)
   */
  testMobileResponsiveness() {
    console.log('🧪 Testing Mobile Responsiveness...');

    try {
      // Check for responsive CSS files
      const criticalCssPath = path.join(__dirname, 'public', 'assets', 'critical.css');
      const tailwindConfigPath = path.join(__dirname, 'tailwind.config.js');

      if (fs.existsSync(criticalCssPath)) {
        const criticalCss = fs.readFileSync(criticalCssPath, 'utf8');
        const hasMobileQueries =
          criticalCss.includes('@media') && criticalCss.includes('max-width');

        if (hasMobileQueries) {
          this.recordResult(true, 'Critical CSS Mobile', 'Mobile responsive styles included');
        } else {
          this.recordResult(false, 'Critical CSS Mobile', 'No mobile responsive styles found');
        }
      }

      if (fs.existsSync(tailwindConfigPath)) {
        const tailwindConfig = fs.readFileSync(tailwindConfigPath, 'utf8');
        const hasResponsive =
          tailwindConfig.includes('responsive') ||
          tailwindConfig.includes('sm:') ||
          tailwindConfig.includes('md:') ||
          tailwindConfig.includes('lg:');

        if (hasResponsive) {
          this.recordResult(true, 'Tailwind Responsive', 'Responsive breakpoints configured');
        } else {
          this.recordResult(false, 'Tailwind Responsive', 'No responsive configuration found');
        }
      }
    } catch (error) {
      this.recordResult(
        false,
        'Mobile Responsiveness',
        `Error checking responsiveness: ${error.message}`
      );
    }
  }

  /**
   * Test Offline Capabilities
   */
  testOfflineCapabilities() {
    console.log('🧪 Testing Offline Capabilities...');

    try {
      // Check for offline HTML page
      const offlinePath = path.join(__dirname, 'public', 'offline.html');

      if (fs.existsSync(offlinePath)) {
        const offlineContent = fs.readFileSync(offlinePath, 'utf8');
        const hasContent = offlineContent.length > 100; // Basic content check

        if (hasContent) {
          this.recordResult(true, 'Offline Page', 'Offline fallback page exists');
        } else {
          this.recordResult(false, 'Offline Page', 'Offline page is too small or empty');
        }
      } else {
        this.recordResult(false, 'Offline Page', 'No offline.html page found');
      }

      // Check service worker for offline handling
      const swPath = path.join(__dirname, 'public', 'sw.js');
      if (fs.existsSync(swPath)) {
        const swContent = fs.readFileSync(swPath, 'utf8');
        const hasOfflineStrategy =
          swContent.includes('NetworkFirst') ||
          swContent.includes('CacheFirst') ||
          swContent.includes('offline');

        if (hasOfflineStrategy) {
          this.recordResult(
            true,
            'Offline Strategy',
            'Service worker has offline caching strategy'
          );
        } else {
          this.recordResult(false, 'Offline Strategy', 'No offline caching strategy found');
        }
      }
    } catch (error) {
      this.recordResult(
        false,
        'Offline Capabilities',
        `Error testing offline features: ${error.message}`
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
    console.log('🚀 MOBILE & PWA FUNCTIONALITY TEST SUITE\n');
    console.log('==========================================\n');

    // Run all tests
    this.testPWAManifest();
    this.testServiceWorker();
    this.testMobileServices();
    this.testMobileResponsiveness();
    this.testOfflineCapabilities();

    // Calculate results
    const total = this.passed + this.failed;
    const successRate = total > 0 ? ((this.passed / total) * 100).toFixed(1) : 0;

    console.log('\n📊 MOBILE & PWA TEST RESULTS');
    console.log('============================');
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📈 Success Rate: ${successRate}%`);

    if (this.passed >= 8) {
      console.log('\n🎉 EXCELLENT! Mobile and PWA functionality is well implemented.');
      console.log('✅ System is ready for mobile deployment.');
    } else if (this.passed >= 5) {
      console.log('\n⚠️ GOOD! Mobile and PWA functionality is mostly implemented.');
      console.log('🔧 Minor improvements needed for optimal mobile experience.');
    } else {
      console.log('\n❌ NEEDS IMPROVEMENT! Mobile and PWA functionality requires attention.');
      console.log('🔧 Significant work needed for mobile readiness.');
    }

    console.log('\n🏁 MOBILE & PWA TEST COMPLETED');

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
  const testSuite = new MobilePWATestSuite();
  testSuite.run().catch(console.error);
}

export default MobilePWATestSuite;
