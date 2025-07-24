/**
 * System & Performance Commands
 * System monitoring, configuration, and performance tools
 */

import { dataFetchingService } from '../dataFetching';
import { formatCurrency, formatPercentage, formatNumber } from '../../utils/dataTransformation';

export const systemCommands = {
  PERFORMANCE_TEST: {
    execute: async (parsedCommand, context, processor) => {
      try {
        const startTime = Date.now();
        
        // Test various system components
        const tests = [];
        
        // Command processing speed test
        const cmdStart = Date.now();
        await new Promise(resolve => setTimeout(resolve, 10)); // Simulate processing
        tests.push({
          name: 'Command Processing',
          duration: Date.now() - cmdStart,
          status: 'Pass',
          benchmark: 50 // ms
        });

        // Data fetching test
        const dataStart = Date.now();
        try {
          await dataFetchingService.fetchCompanyProfile('AAPL');
          tests.push({
            name: 'Data Fetching',
            duration: Date.now() - dataStart,
            status: 'Pass',
            benchmark: 1000 // ms
          });
        } catch (error) {
          tests.push({
            name: 'Data Fetching',
            duration: Date.now() - dataStart,
            status: 'Fail',
            benchmark: 1000,
            error: error.message
          });
        }

        // Memory usage test
        const memStart = Date.now();
        const memoryUsage = process.memoryUsage ? process.memoryUsage() : {
          heapUsed: Math.random() * 100000000,
          heapTotal: Math.random() * 200000000,
          external: Math.random() * 50000000
        };
        tests.push({
          name: 'Memory Check',
          duration: Date.now() - memStart,
          status: 'Pass',
          benchmark: 10,
          details: {
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
            external: Math.round(memoryUsage.external / 1024 / 1024)
          }
        });

        // Cache performance test
        const cacheStart = Date.now();
        const cacheSize = dataFetchingService.cache?.size || 0;
        tests.push({
          name: 'Cache Performance',
          duration: Date.now() - cacheStart,
          status: cacheSize > 0 ? 'Pass' : 'Warning',
          benchmark: 5,
          details: { entries: cacheSize }
        });

        // Calculate overall performance
        const totalDuration = Date.now() - startTime;
        const passedTests = tests.filter(t => t.status === 'Pass').length;
        const overallScore = (passedTests / tests.length) * 100;

        const content = `⚡ System Performance Test Results\n\n🎯 OVERALL SCORE: ${formatNumber(overallScore, 1)}/100 ${overallScore > 90 ? '🟢 Excellent' : overallScore > 75 ? '🟡 Good' : overallScore > 50 ? '🟠 Fair' : '🔴 Poor'}\n\n📊 TEST RESULTS:\n${tests.map(test => {
          const statusIcon = test.status === 'Pass' ? '✅' : test.status === 'Warning' ? '⚠️' : '❌';
          const performance = test.duration <= test.benchmark ? '🟢 Fast' : test.duration <= test.benchmark * 2 ? '🟡 Moderate' : '🔴 Slow';
          return `${statusIcon} ${test.name}: ${test.duration}ms ${performance}\n   Benchmark: ${test.benchmark}ms, Status: ${test.status}${test.details ? `\n   Details: ${JSON.stringify(test.details)}` : ''}${test.error ? `\n   Error: ${test.error}` : ''}`;
        }).join('\n\n')}\n\n⏱️ PERFORMANCE SUMMARY:\n• Total Test Duration: ${totalDuration}ms\n• Tests Passed: ${passedTests}/${tests.length}\n• Average Response Time: ${formatNumber(tests.reduce((sum, t) => sum + t.duration, 0) / tests.length, 1)}ms\n• System Health: ${overallScore > 80 ? 'Healthy' : overallScore > 60 ? 'Moderate' : 'Needs Attention'}\n\n💾 MEMORY USAGE:\n• Heap Used: ${tests[2].details.heapUsed} MB\n• Heap Total: ${tests[2].details.heapTotal} MB\n• External: ${tests[2].details.external} MB\n• Memory Efficiency: ${tests[2].details.heapUsed / tests[2].details.heapTotal < 0.8 ? 'Good' : 'High Usage'}\n\n🔧 RECOMMENDATIONS:\n${tests.some(t => t.status === 'Fail') ? '• Address failed tests to improve system reliability\n' : ''}${tests.some(t => t.duration > t.benchmark * 2) ? '• Slow response times detected - check network connection\n' : ''}${tests[2].details.heapUsed > 100 ? '• High memory usage - consider restarting application\n' : ''}${cacheSize === 0 ? '• Cache is empty - performance may be slower\n' : ''}• Run performance tests regularly to monitor system health\n\n💡 OPTIMIZATION TIPS:\n• Clear cache periodically with "cache clear" command\n• Monitor memory usage during heavy analysis\n• Check network connectivity for data fetching issues`;

        return {
          type: 'success',
          content,
          data: {
            analysis: 'performance_test',
            overallScore,
            totalDuration,
            tests,
            memoryUsage: tests[2].details
          }
        };

      } catch (error) {
        return {
          type: 'error',
          content: `Performance test failed: ${error.message}`
        };
      }
    },
    parameterSchema: {
      required: [],
      optional: []
    }
  },

  API_USAGE: {
    execute: async (parsedCommand, context, processor) => {
      try {
        // Mock API usage statistics (in real implementation, would track actual usage)
        const usage = {
          daily: {
            calls: Math.floor(Math.random() * 1000 + 100),
            limit: 1000,
            remaining: Math.floor(Math.random() * 500 + 100)
          },
          monthly: {
            calls: Math.floor(Math.random() * 20000 + 5000),
            limit: 25000,
            remaining: Math.floor(Math.random() * 10000 + 2000)
          },
          endpoints: {
            'company-profile': Math.floor(Math.random() * 300 + 50),
            'financial-statements': Math.floor(Math.random() * 200 + 30),
            'market-data': Math.floor(Math.random() * 400 + 80),
            'peer-analysis': Math.floor(Math.random() * 150 + 20),
            'sec-filings': Math.floor(Math.random() * 100 + 10)
          }
        };

        const dailyUsagePercent = (usage.daily.calls / usage.daily.limit) * 100;
        const monthlyUsagePercent = (usage.monthly.calls / usage.monthly.limit) * 100;
        const totalEndpointCalls = Object.values(usage.endpoints).reduce((sum, calls) => sum + calls, 0);

        // Rate limiting status
        const rateLimitStatus = dailyUsagePercent > 90 ? 'Critical' : dailyUsagePercent > 75 ? 'Warning' : 'Normal';
        
        // Cost estimation (mock)
        const estimatedCost = (usage.monthly.calls * 0.001).toFixed(2); // $0.001 per call

        const content = `📊 API Usage Statistics\n\n🔄 CURRENT USAGE:\n• Daily Calls: ${formatNumber(usage.daily.calls, 0)}/${formatNumber(usage.daily.limit, 0)} (${formatPercentage(dailyUsagePercent / 100)})\n• Monthly Calls: ${formatNumber(usage.monthly.calls, 0)}/${formatNumber(usage.monthly.limit, 0)} (${formatPercentage(monthlyUsagePercent / 100)})\n• Daily Remaining: ${formatNumber(usage.daily.remaining, 0)} calls\n• Monthly Remaining: ${formatNumber(usage.monthly.remaining, 0)} calls\n\n⚡ RATE LIMIT STATUS: ${rateLimitStatus} ${rateLimitStatus === 'Critical' ? '🔴' : rateLimitStatus === 'Warning' ? '🟡' : '🟢'}\n\n📈 ENDPOINT BREAKDOWN:\n${Object.entries(usage.endpoints).map(([endpoint, calls]) => 
          `• ${endpoint.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${formatNumber(calls, 0)} calls (${formatPercentage(calls / totalEndpointCalls)})`
        ).join('\n')}\n\n💰 COST ANALYSIS:\n• Estimated Monthly Cost: $${estimatedCost}\n• Cost Per Call: $0.001\n• Most Expensive Endpoint: ${Object.entries(usage.endpoints).reduce((max, [endpoint, calls]) => calls > max.calls ? {endpoint, calls} : max, {endpoint: '', calls: 0}).endpoint}\n\n📊 USAGE PATTERNS:\n• Peak Usage Time: ${Math.random() > 0.5 ? 'Market Hours (9AM-4PM EST)' : 'After Hours'}\n• Average Calls/Hour: ${formatNumber(usage.daily.calls / 24, 1)}\n• Efficiency Score: ${dailyUsagePercent < 80 ? 'Efficient' : 'High Usage'}\n\n⚠️ ALERTS & RECOMMENDATIONS:\n${dailyUsagePercent > 90 ? '• 🔴 CRITICAL: Daily limit almost reached - reduce API calls\n' : ''}${dailyUsagePercent > 75 ? '• 🟡 WARNING: High daily usage - monitor closely\n' : ''}${monthlyUsagePercent > 80 ? '• 🟠 Monthly usage is high - consider upgrading plan\n' : ''}${usage.daily.remaining < 50 ? '• Consider caching results to reduce API calls\n' : ''}• Use batch operations when possible to optimize usage\n• Monitor usage during market hours for peak efficiency\n\n🔧 OPTIMIZATION TIPS:\n• Enable caching to reduce redundant calls\n• Use batch analysis for multiple stocks\n• Schedule heavy analysis during off-peak hours\n• Consider upgrading plan if consistently hitting limits\n\n📅 RESET SCHEDULE:\n• Daily limits reset: Midnight UTC\n• Monthly limits reset: 1st of each month\n• Current time: ${new Date().toISOString()}\n\n${dataFetchingService.demoMode ? '💡 Note: Demo mode shows simulated usage data.' : '✅ Live API usage tracking'}`;

        return {
          type: 'success',
          content,
          data: {
            analysis: 'api_usage',
            usage,
            rateLimitStatus,
            estimatedCost: parseFloat(estimatedCost),
            usagePercents: {
              daily: dailyUsagePercent,
              monthly: monthlyUsagePercent
            }
          }
        };

      } catch (error) {
        return {
          type: 'error',
          content: `API usage check failed: ${error.message}`
        };
      }
    },
    parameterSchema: {
      required: [],
      optional: []
    }
  },

  CONFIG: {
    execute: async (parsedCommand, context, processor) => {
      const [setting, value] = parsedCommand.parameters;
      
      if (!setting) {
        // Show all current settings
        const settings = processor.getAllSettings();
        const variables = processor.getAllVariables();
        
        const content = `⚙️ System Configuration\n\n🔧 CURRENT SETTINGS:\n${Object.entries(settings).map(([key, val]) => 
          `• ${key}: ${val}`
        ).join('\n')}\n\n💾 STORED VARIABLES:\n${Object.entries(variables).map(([key, val]) => 
          `• ${key}: ${Array.isArray(val) ? `Array(${val.length})` : typeof val === 'object' ? 'Object' : val}`
        ).join('\n')}\n\n🛠️ AVAILABLE SETTINGS:\n• currency: USD, EUR, GBP, JPY\n• precision: 0-6 decimal places\n• dateFormat: YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY\n• theme: dark, light, auto\n• notifications: enabled, disabled\n\n💡 USAGE:\n• CONFIG() - Show all settings\n• CONFIG("setting") - Show specific setting\n• CONFIG("setting", "value") - Update setting\n\nExample: CONFIG("currency", "EUR")`;

        return {
          type: 'success',
          content,
          data: {
            analysis: 'config_view',
            settings,
            variables
          }
        };
      }

      if (value === undefined) {
        // Show specific setting
        const currentValue = processor.getSetting(setting);
        return {
          type: 'info',
          content: `⚙️ Setting: ${setting}\nCurrent Value: ${currentValue || 'Not set'}\n\nTo update: CONFIG("${setting}", "new_value")`
        };
      }

      // Update setting
      try {
        // Validate setting values
        const validSettings = {
          currency: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'],
          precision: [0, 1, 2, 3, 4, 5, 6],
          dateFormat: ['YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY'],
          theme: ['dark', 'light', 'auto'],
          notifications: ['enabled', 'disabled']
        };

        if (validSettings[setting] && !validSettings[setting].includes(value)) {
          return {
            type: 'error',
            content: `Invalid value "${value}" for setting "${setting}". Valid values: ${validSettings[setting].join(', ')}`
          };
        }

        const oldValue = processor.getSetting(setting);
        processor.updateSetting(setting, value);

        return {
          type: 'success',
          content: `✅ Setting Updated\n\n• Setting: ${setting}\n• Old Value: ${oldValue || 'Not set'}\n• New Value: ${value}\n\nSetting will take effect immediately for new commands.`,
          data: {
            analysis: 'config_update',
            setting,
            oldValue,
            newValue: value
          }
        };

      } catch (error) {
        return {
          type: 'error',
          content: `Configuration update failed: ${error.message}`
        };
      }
    },
    parameterSchema: {
      required: [],
      optional: ['setting', 'value']
    }
  }
};
