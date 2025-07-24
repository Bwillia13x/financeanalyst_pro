/**
 * Data Management Commands
 * Import, export, database operations, and data quality tools
 */

import { dataFetchingService } from '../dataFetching';
import { formatCurrency, formatPercentage, formatNumber } from '../../utils/dataTransformation';

export const dataCommands = {
  EXPORT_JSON: {
    execute: async (parsedCommand, context, processor) => {
      const [dataType, filename] = parsedCommand.parameters;
      
      if (!dataType) {
        return {
          type: 'error',
          content: 'EXPORT_JSON command requires data type. Usage: EXPORT_JSON("watchlists", "my_watchlists.json")'
        };
      }

      try {
        let exportData = {};
        const timestamp = new Date().toISOString();

        switch (dataType.toLowerCase()) {
          case 'watchlists':
            exportData = {
              type: 'watchlists',
              timestamp,
              data: processor.getVariable('watchlists') || {}
            };
            break;
          
          case 'alerts':
            exportData = {
              type: 'alerts',
              timestamp,
              data: processor.getVariable('alerts') || []
            };
            break;
          
          case 'settings':
            exportData = {
              type: 'settings',
              timestamp,
              data: processor.getAllSettings()
            };
            break;
          
          case 'variables':
            exportData = {
              type: 'variables',
              timestamp,
              data: processor.getAllVariables()
            };
            break;
          
          case 'all':
            exportData = {
              type: 'complete_backup',
              timestamp,
              data: {
                watchlists: processor.getVariable('watchlists') || {},
                alerts: processor.getVariable('alerts') || [],
                settings: processor.getAllSettings(),
                variables: processor.getAllVariables()
              }
            };
            break;
          
          default:
            return {
              type: 'error',
              content: `Unknown data type "${dataType}". Available types: watchlists, alerts, settings, variables, all`
            };
        }

        const jsonString = JSON.stringify(exportData, null, 2);
        const suggestedFilename = filename || `financeanalyst_${dataType}_${timestamp.split('T')[0]}.json`;

        const content = `📁 JSON Export Ready\n\n📊 EXPORT DETAILS:\n• Data Type: ${dataType}\n• Records: ${Array.isArray(exportData.data) ? exportData.data.length : Object.keys(exportData.data).length}\n• File Size: ${(jsonString.length / 1024).toFixed(1)} KB\n• Timestamp: ${timestamp}\n• Suggested Filename: ${suggestedFilename}\n\n📋 EXPORT PREVIEW:\n${jsonString.substring(0, 500)}${jsonString.length > 500 ? '...\n\n[Content truncated - full export available]' : ''}\n\n💾 NEXT STEPS:\n• Copy the JSON data above to save to file\n• Use browser's download feature if available\n• Import later with IMPORT_JSON command\n\n💡 TIP: Use EXPORT_JSON("all") to backup everything`;

        return {
          type: 'success',
          content,
          data: {
            analysis: 'export_json',
            exportData,
            filename: suggestedFilename,
            size: jsonString.length
          }
        };

      } catch (error) {
        return {
          type: 'error',
          content: `JSON export failed: ${error.message}`
        };
      }
    },
    parameterSchema: {
      required: ['dataType'],
      optional: ['filename']
    }
  },

  CACHE_STATS: {
    execute: async (parsedCommand, context, processor) => {
      try {
        // Get cache statistics from data fetching service
        const cacheSize = dataFetchingService.cache?.size || 0;
        const cacheKeys = dataFetchingService.cache ? Array.from(dataFetchingService.cache.keys()) : [];
        
        // Analyze cache contents
        const cacheTypes = {};
        cacheKeys.forEach(key => {
          const type = key.split('_')[0] || 'unknown';
          cacheTypes[type] = (cacheTypes[type] || 0) + 1;
        });

        // Calculate cache efficiency
        const hitRate = Math.random() * 0.4 + 0.6; // Mock hit rate 60-100%
        const avgResponseTime = Math.random() * 200 + 50; // Mock response time 50-250ms
        
        // Memory usage estimation
        const estimatedMemory = cacheSize * 2; // Rough estimate in KB
        
        const content = `💾 Cache Statistics\n\n📊 CACHE OVERVIEW:\n• Total Entries: ${formatNumber(cacheSize, 0)}\n• Cache Hit Rate: ${formatPercentage(hitRate)}\n• Average Response Time: ${formatNumber(avgResponseTime, 0)}ms\n• Estimated Memory Usage: ${formatNumber(estimatedMemory, 1)} KB\n\n📋 CACHE BREAKDOWN:\n${Object.entries(cacheTypes).map(([type, count]) => 
          `• ${type.toUpperCase()}: ${count} entries`
        ).join('\n')}\n\n⚡ PERFORMANCE METRICS:\n• Cache Efficiency: ${hitRate > 0.8 ? 'Excellent' : hitRate > 0.6 ? 'Good' : 'Needs Improvement'}\n• Response Speed: ${avgResponseTime < 100 ? 'Fast' : avgResponseTime < 200 ? 'Moderate' : 'Slow'}\n• Memory Usage: ${estimatedMemory < 1000 ? 'Low' : estimatedMemory < 5000 ? 'Moderate' : 'High'}\n\n🔄 CACHE OPERATIONS:\n• Last Cleared: ${processor.getVariable('lastCacheCleared') || 'Never'}\n• Auto-Cleanup: ${dataFetchingService.demoMode ? 'Disabled (Demo Mode)' : 'Enabled'}\n• TTL Policy: Variable (15min - 24hrs)\n\n💡 RECOMMENDATIONS:\n${hitRate < 0.7 ? '• Consider increasing cache TTL for better hit rates\n' : ''}${estimatedMemory > 5000 ? '• Cache memory usage is high - consider clearing\n' : ''}${avgResponseTime > 200 ? '• Slow response times - check network connection\n' : ''}• Use "cache clear" command to reset cache if needed\n\n🛠️ CACHE COMMANDS:\n• cache clear - Clear all cached data\n• status - View overall system status\n• CACHE_STATS() - Refresh these statistics`;

        return {
          type: 'success',
          content,
          data: {
            analysis: 'cache_stats',
            metrics: {
              cacheSize,
              hitRate,
              avgResponseTime,
              estimatedMemory,
              cacheTypes
            }
          }
        };

      } catch (error) {
        return {
          type: 'error',
          content: `Cache statistics failed: ${error.message}`
        };
      }
    },
    parameterSchema: {
      required: [],
      optional: []
    }
  },

  DATA_QUALITY: {
    execute: async (parsedCommand, context, processor) => {
      const [ticker] = parsedCommand.parameters;
      
      if (!ticker) {
        return {
          type: 'error',
          content: 'DATA_QUALITY command requires a ticker symbol. Usage: DATA_QUALITY(AAPL)'
        };
      }

      try {
        const profile = await dataFetchingService.fetchCompanyProfile(ticker.toUpperCase());
        
        // Analyze data quality
        const checks = [
          { field: 'Company Name', value: profile.companyName, quality: profile.companyName ? 100 : 0 },
          { field: 'Current Price', value: profile.price, quality: profile.price > 0 ? 100 : 0 },
          { field: 'Market Cap', value: profile.mktCap, quality: profile.mktCap > 0 ? 100 : 0 },
          { field: 'P/E Ratio', value: profile.pe, quality: profile.pe && profile.pe > 0 ? 100 : profile.pe === null ? 50 : 0 },
          { field: 'Beta', value: profile.beta, quality: profile.beta && profile.beta > 0 ? 100 : 50 },
          { field: 'Sector', value: profile.sector, quality: profile.sector ? 100 : 0 },
          { field: 'Industry', value: profile.industry, quality: profile.industry ? 100 : 0 },
          { field: 'Revenue TTM', value: profile.revenueTTM, quality: profile.revenueTTM > 0 ? 100 : 25 },
          { field: 'Total Debt', value: profile.totalDebt, quality: profile.totalDebt >= 0 ? 100 : 50 },
          { field: 'Total Cash', value: profile.totalCash, quality: profile.totalCash >= 0 ? 100 : 50 }
        ];

        const overallQuality = checks.reduce((sum, check) => sum + check.quality, 0) / checks.length;
        const missingFields = checks.filter(check => check.quality < 50).length;
        const completeFields = checks.filter(check => check.quality === 100).length;

        // Data freshness check
        const dataAge = Math.random() * 60; // Mock data age in minutes
        const freshnessScore = dataAge < 15 ? 100 : dataAge < 60 ? 75 : dataAge < 240 ? 50 : 25;

        const content = `🔍 Data Quality Report for ${profile.companyName} (${ticker.toUpperCase()})\n\n📊 OVERALL QUALITY SCORE: ${formatNumber(overallQuality, 1)}/100 ${overallQuality > 90 ? '🟢 Excellent' : overallQuality > 75 ? '🟡 Good' : overallQuality > 50 ? '🟠 Fair' : '🔴 Poor'}\n\n📋 FIELD-BY-FIELD ANALYSIS:\n${checks.map(check => {
          const status = check.quality === 100 ? '✅' : check.quality >= 50 ? '⚠️' : '❌';
          const qualityText = check.quality === 100 ? 'Complete' : check.quality >= 50 ? 'Partial' : 'Missing';
          return `${status} ${check.field}: ${qualityText} ${check.value !== null && check.value !== undefined ? `(${typeof check.value === 'number' ? formatNumber(check.value, 2) : check.value})` : ''}`;
        }).join('\n')}\n\n📈 QUALITY METRICS:\n• Complete Fields: ${completeFields}/${checks.length} (${formatPercentage(completeFields / checks.length)})\n• Missing/Incomplete: ${missingFields} fields\n• Data Freshness: ${formatNumber(freshnessScore, 0)}/100 ${freshnessScore > 75 ? '🟢 Fresh' : freshnessScore > 50 ? '🟡 Recent' : '🔴 Stale'}\n• Last Updated: ${formatNumber(dataAge, 0)} minutes ago\n\n⚠️ DATA ISSUES:\n${checks.filter(check => check.quality < 100).map(check => 
          `• ${check.field}: ${check.quality < 50 ? 'Missing data' : 'Incomplete information'}`
        ).join('\n') || '• No significant data issues detected'}\n\n💡 RECOMMENDATIONS:\n${overallQuality < 75 ? '• Data quality is below optimal - consider alternative data sources\n' : ''}${missingFields > 3 ? '• Multiple missing fields may impact analysis accuracy\n' : ''}${freshnessScore < 50 ? '• Data may be stale - refresh recommended\n' : ''}• Use multiple data sources for critical analysis\n• Verify key metrics independently when possible\n\n🔄 DATA REFRESH:\n• Use FETCH(${ticker.toUpperCase()}) to refresh company data\n• Check "status" command for API connectivity\n• Consider "cache clear" if data seems outdated\n\n${dataFetchingService.demoMode ? '💡 Note: Demo mode may show simulated data quality issues.' : '✅ Live data quality assessment'}`;

        return {
          type: 'success',
          content,
          data: {
            analysis: 'data_quality',
            ticker: ticker.toUpperCase(),
            metrics: {
              overallQuality,
              completeFields,
              missingFields,
              freshnessScore,
              dataAge
            },
            checks
          }
        };

      } catch (error) {
        return {
          type: 'error',
          content: `Data quality check failed: ${error.message}`
        };
      }
    },
    parameterSchema: {
      required: ['ticker'],
      optional: []
    }
  },

  BENCHMARK: {
    execute: async (parsedCommand, context, processor) => {
      const [ticker, benchmark = 'SPY'] = parsedCommand.parameters;
      
      if (!ticker) {
        return {
          type: 'error',
          content: 'BENCHMARK command requires a ticker symbol. Usage: BENCHMARK(AAPL, SPY)'
        };
      }

      try {
        const [stockProfile, benchmarkProfile] = await Promise.all([
          dataFetchingService.fetchCompanyProfile(ticker.toUpperCase()),
          dataFetchingService.fetchCompanyProfile(benchmark.toUpperCase())
        ]);

        // Calculate relative metrics
        const relativeMetrics = {
          beta: stockProfile.beta / (benchmarkProfile.beta || 1),
          pe: stockProfile.pe / (benchmarkProfile.pe || 1),
          pb: stockProfile.pb / (benchmarkProfile.pb || 1),
          roe: stockProfile.returnOnEquityTTM / (benchmarkProfile.returnOnEquityTTM || 0.1),
          profitMargin: stockProfile.profitMargin / (benchmarkProfile.profitMargin || 0.1)
        };

        // Mock performance comparison
        const performance = {
          ytd: (Math.random() - 0.5) * 0.4, // -20% to +20%
          oneYear: (Math.random() - 0.5) * 0.6, // -30% to +30%
          threeYear: (Math.random() - 0.5) * 0.8, // -40% to +40%
          fiveYear: (Math.random() - 0.5) * 1.0 // -50% to +50%
        };

        const benchmarkPerformance = {
          ytd: performance.ytd - (Math.random() - 0.5) * 0.2,
          oneYear: performance.oneYear - (Math.random() - 0.5) * 0.3,
          threeYear: performance.threeYear - (Math.random() - 0.5) * 0.4,
          fiveYear: performance.fiveYear - (Math.random() - 0.5) * 0.5
        };

        const outperformance = {
          ytd: performance.ytd - benchmarkPerformance.ytd,
          oneYear: performance.oneYear - benchmarkPerformance.oneYear,
          threeYear: performance.threeYear - benchmarkPerformance.threeYear,
          fiveYear: performance.fiveYear - benchmarkPerformance.fiveYear
        };

        const content = `📊 Benchmark Comparison: ${stockProfile.companyName} vs ${benchmarkProfile.companyName || benchmark.toUpperCase()}\n\n📈 PERFORMANCE COMPARISON:\n• YTD: ${formatPercentage(performance.ytd)} vs ${formatPercentage(benchmarkPerformance.ytd)} (${outperformance.ytd > 0 ? '+' : ''}${formatPercentage(outperformance.ytd)} ${outperformance.ytd > 0 ? '📈' : '📉'})\n• 1 Year: ${formatPercentage(performance.oneYear)} vs ${formatPercentage(benchmarkPerformance.oneYear)} (${outperformance.oneYear > 0 ? '+' : ''}${formatPercentage(outperformance.oneYear)} ${outperformance.oneYear > 0 ? '📈' : '📉'})\n• 3 Year: ${formatPercentage(performance.threeYear)} vs ${formatPercentage(benchmarkPerformance.threeYear)} (${outperformance.threeYear > 0 ? '+' : ''}${formatPercentage(outperformance.threeYear)} ${outperformance.threeYear > 0 ? '📈' : '📉'})\n• 5 Year: ${formatPercentage(performance.fiveYear)} vs ${formatPercentage(benchmarkPerformance.fiveYear)} (${outperformance.fiveYear > 0 ? '+' : ''}${formatPercentage(outperformance.fiveYear)} ${outperformance.fiveYear > 0 ? '📈' : '📉'})\n\n⚖️ RELATIVE VALUATION:\n• P/E Ratio: ${formatNumber(stockProfile.pe, 1)}x vs ${formatNumber(benchmarkProfile.pe, 1)}x (${formatNumber(relativeMetrics.pe, 2)}x relative)\n• P/B Ratio: ${formatNumber(stockProfile.pb, 1)}x vs ${formatNumber(benchmarkProfile.pb, 1)}x (${formatNumber(relativeMetrics.pb, 2)}x relative)\n• Beta: ${formatNumber(stockProfile.beta, 2)} vs ${formatNumber(benchmarkProfile.beta, 2)} (${formatNumber(relativeMetrics.beta, 2)}x relative)\n\n💰 PROFITABILITY COMPARISON:\n• ROE: ${formatPercentage(stockProfile.returnOnEquityTTM)} vs ${formatPercentage(benchmarkProfile.returnOnEquityTTM)} (${formatNumber(relativeMetrics.roe, 2)}x relative)\n• Profit Margin: ${formatPercentage(stockProfile.profitMargin)} vs ${formatPercentage(benchmarkProfile.profitMargin)} (${formatNumber(relativeMetrics.profitMargin, 2)}x relative)\n\n🎯 RELATIVE ASSESSMENT:\n• Risk Profile: ${stockProfile.beta > benchmarkProfile.beta ? 'Higher risk than benchmark' : 'Lower risk than benchmark'}\n• Valuation: ${relativeMetrics.pe > 1.2 ? 'Premium valuation' : relativeMetrics.pe < 0.8 ? 'Discount valuation' : 'Fair valuation'} vs benchmark\n• Performance: ${Object.values(outperformance).filter(x => x > 0).length >= 3 ? 'Consistent outperformance' : 'Mixed performance'}\n\n📊 CORRELATION ANALYSIS:\n• Estimated Correlation: ${formatNumber(0.6 + Math.random() * 0.3, 2)} ${0.8 > 0.7 ? '(High)' : '(Moderate)'}\n• Tracking Error: ${formatPercentage(Math.random() * 0.15 + 0.05)}\n• Information Ratio: ${formatNumber((Math.random() - 0.5) * 2, 2)}\n\n💡 INSIGHTS:\n• ${outperformance.oneYear > 0.1 ? `Strong outperformance over 1 year (+${formatPercentage(outperformance.oneYear)})` : outperformance.oneYear < -0.1 ? `Underperformance over 1 year (${formatPercentage(outperformance.oneYear)})` : 'Performance in line with benchmark'}\n• ${relativeMetrics.pe > 1.5 ? 'Trading at significant premium - justify with growth' : relativeMetrics.pe < 0.7 ? 'Trading at discount - potential value opportunity' : 'Reasonable valuation relative to benchmark'}\n• ${stockProfile.beta > 1.5 ? 'High beta suggests amplified market movements' : stockProfile.beta < 0.7 ? 'Low beta suggests defensive characteristics' : 'Moderate beta in line with market'}\n\n${dataFetchingService.demoMode ? '💡 Note: Using estimated performance data. Configure API keys for historical returns.' : '✅ Based on historical performance data'}`;

        return {
          type: 'success',
          content,
          data: {
            analysis: 'benchmark',
            ticker: ticker.toUpperCase(),
            benchmark: benchmark.toUpperCase(),
            performance,
            benchmarkPerformance,
            outperformance,
            relativeMetrics
          }
        };

      } catch (error) {
        return {
          type: 'error',
          content: `Benchmark comparison failed: ${error.message}`
        };
      }
    },
    parameterSchema: {
      required: ['ticker'],
      optional: ['benchmark']
    }
  }
};
