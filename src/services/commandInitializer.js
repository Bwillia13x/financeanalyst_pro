/**
 * Command Initializer
 * Registers all available commands with the command registry
 */

import { commandRegistry } from './commandRegistry';
import { coreCommands } from './commands/coreCommands';
import { portfolioCommands } from './commands/portfolioCommands';
import { valuationCommands } from './commands/valuationCommands';
import { technicalCommands } from './commands/technicalCommands';
import { esgCommands } from './commands/esgCommands';
import { automationCommands } from './commands/automationCommands';
import { dataCommands } from './commands/dataCommands';
import { systemCommands } from './commands/systemCommands';
import { persistenceCommands } from './commands/persistenceCommands';
import { privateAnalysisCommands } from './commands/privateAnalysisCommands';

/**
 * Initialize all commands in the registry
 */
export function initializeCommands() {
  // Register Core Commands
  commandRegistry.register('DCF', coreCommands.DCF, {
    category: 'CORE',
    description: 'Discounted Cash Flow valuation with real-time data',
    usage: 'DCF(ticker)',
    examples: ['DCF(AAPL)', 'DCF(MSFT)'],
    tags: ['valuation', 'dcf', 'analysis'],
    parameterSchema: {
      required: ['ticker'],
      optional: []
    }
  });

  commandRegistry.register('LBO', coreCommands.LBO, {
    category: 'CORE',
    description: 'Leveraged Buyout analysis with return projections',
    usage: 'LBO(ticker)',
    examples: ['LBO(TSLA)', 'LBO(NVDA)'],
    tags: ['lbo', 'private-equity', 'analysis'],
    parameterSchema: {
      required: ['ticker'],
      optional: []
    }
  });

  commandRegistry.register('COMP', coreCommands.COMP, {
    category: 'CORE',
    description: 'Comparable company analysis with peer multiples',
    usage: 'COMP(ticker)',
    examples: ['COMP(GOOGL)', 'COMP(META)'],
    tags: ['comparable', 'multiples', 'analysis'],
    parameterSchema: {
      required: ['ticker'],
      optional: []
    }
  });

  commandRegistry.register('FETCH', coreCommands.FETCH, {
    category: 'CORE',
    description: 'Comprehensive company data and financial metrics',
    usage: 'FETCH(ticker)',
    examples: ['FETCH(AMZN)', 'FETCH(NFLX)'],
    tags: ['data', 'profile', 'metrics'],
    parameterSchema: {
      required: ['ticker'],
      optional: []
    }
  });

  // Register Private Analysis Commands
  commandRegistry.register('PRIVATE_DCF', privateAnalysisCommands.PRIVATE_DCF, {
    category: 'CORE',
    description: 'DCF valuation using private company financial data',
    usage: 'PRIVATE_DCF()',
    examples: ['PRIVATE_DCF()'],
    tags: ['private', 'dcf', 'valuation', 'analysis'],
    parameterSchema: {
      required: [],
      optional: ['discountRate', 'terminalGrowthRate', 'taxRate']
    }
  });

  commandRegistry.register('PRIVATE_RATIOS', privateAnalysisCommands.PRIVATE_RATIOS, {
    category: 'CORE',
    description: 'Financial ratios analysis for private company data',
    usage: 'PRIVATE_RATIOS()',
    examples: ['PRIVATE_RATIOS()'],
    tags: ['private', 'ratios', 'analysis', 'margins'],
    parameterSchema: {
      required: [],
      optional: []
    }
  });

  commandRegistry.register('PRIVATE_SUMMARY', privateAnalysisCommands.PRIVATE_SUMMARY, {
    category: 'CORE',
    description: 'Comprehensive financial summary of private company',
    usage: 'PRIVATE_SUMMARY()',
    examples: ['PRIVATE_SUMMARY()'],
    tags: ['private', 'summary', 'overview', 'financial'],
    parameterSchema: {
      required: [],
      optional: []
    }
  });

  commandRegistry.register('PRIVATE_LOAD', privateAnalysisCommands.PRIVATE_LOAD, {
    category: 'DATA',
    description: 'Load and verify private company financial data',
    usage: 'PRIVATE_LOAD()',
    examples: ['PRIVATE_LOAD()'],
    tags: ['private', 'data', 'load', 'verification'],
    parameterSchema: {
      required: [],
      optional: []
    }
  });

  // Register Portfolio Commands
  commandRegistry.register('PORTFOLIO', portfolioCommands.PORTFOLIO, {
    category: 'PORTFOLIO',
    description: 'Portfolio analysis with risk and diversification metrics',
    usage: 'PORTFOLIO(tickers, weights)',
    examples: ['PORTFOLIO([AAPL,MSFT,GOOGL], [0.4,0.3,0.3])', 'PORTFOLIO([SPY,QQQ], [0.6,0.4])'],
    tags: ['portfolio', 'diversification', 'allocation'],
    parameterSchema: {
      required: ['tickers', 'weights'],
      optional: []
    }
  });

  commandRegistry.register('RISK_METRICS', portfolioCommands.RISK_METRICS, {
    category: 'PORTFOLIO',
    description: 'Comprehensive risk analysis including VaR, Sharpe ratio, and volatility',
    usage: 'RISK_METRICS(ticker, period)',
    examples: ['RISK_METRICS(AAPL)', 'RISK_METRICS(TSLA, 252)'],
    tags: ['risk', 'var', 'volatility', 'sharpe'],
    parameterSchema: {
      required: ['ticker'],
      optional: ['period']
    }
  });

  commandRegistry.register('CORRELATION_MATRIX', portfolioCommands.CORRELATION_MATRIX, {
    category: 'PORTFOLIO',
    description: 'Cross-asset correlation analysis for diversification insights',
    usage: 'CORRELATION_MATRIX(tickers)',
    examples: ['CORRELATION_MATRIX([AAPL,MSFT,GOOGL])', 'CORRELATION_MATRIX([SPY,QQQ,IWM])'],
    tags: ['correlation', 'diversification', 'matrix'],
    parameterSchema: {
      required: ['tickers'],
      optional: []
    }
  });

  commandRegistry.register('EFFICIENT_FRONTIER', portfolioCommands.EFFICIENT_FRONTIER, {
    category: 'PORTFOLIO',
    description: 'Modern portfolio theory optimization and efficient frontier analysis',
    usage: 'EFFICIENT_FRONTIER(tickers)',
    examples: ['EFFICIENT_FRONTIER([AAPL,MSFT,GOOGL])', 'EFFICIENT_FRONTIER([SPY,QQQ,IWM,EFA])'],
    tags: ['optimization', 'efficient-frontier', 'mpt'],
    parameterSchema: {
      required: ['tickers'],
      optional: []
    }
  });

  commandRegistry.register('DRAWDOWN', portfolioCommands.DRAWDOWN, {
    category: 'PORTFOLIO',
    description: 'Maximum drawdown analysis and recovery time estimation',
    usage: 'DRAWDOWN(ticker, period)',
    examples: ['DRAWDOWN(AAPL)', 'DRAWDOWN(TSLA, 500)'],
    tags: ['drawdown', 'risk', 'recovery'],
    parameterSchema: {
      required: ['ticker'],
      optional: ['period']
    }
  });

  // Register Advanced Valuation Commands
  commandRegistry.register('DDM', valuationCommands.DDM, {
    category: 'VALUATION',
    description: 'Dividend Discount Model with Gordon Growth and Two-Stage analysis',
    usage: 'DDM(ticker)',
    examples: ['DDM(KO)', 'DDM(JNJ)'],
    tags: ['dividend', 'ddm', 'gordon-growth'],
    parameterSchema: {
      required: ['ticker'],
      optional: []
    }
  });

  commandRegistry.register('RESIDUAL_INCOME', valuationCommands.RESIDUAL_INCOME, {
    category: 'VALUATION',
    description: 'Residual Income Model for economic value analysis',
    usage: 'RESIDUAL_INCOME(ticker)',
    examples: ['RESIDUAL_INCOME(AAPL)', 'RESIDUAL_INCOME(MSFT)'],
    tags: ['residual-income', 'economic-value', 'roe'],
    parameterSchema: {
      required: ['ticker'],
      optional: []
    }
  });

  commandRegistry.register('ASSET_BASED', valuationCommands.ASSET_BASED, {
    category: 'VALUATION',
    description: 'Asset-based valuation with market value adjustments',
    usage: 'ASSET_BASED(ticker)',
    examples: ['ASSET_BASED(BRK.A)', 'ASSET_BASED(BAC)'],
    tags: ['asset-based', 'nav', 'liquidation'],
    parameterSchema: {
      required: ['ticker'],
      optional: []
    }
  });

  // Register Technical Analysis Commands
  commandRegistry.register('TECHNICALS', technicalCommands.TECHNICALS, {
    category: 'TECHNICAL',
    description: 'Comprehensive technical analysis with RSI, MACD, Bollinger Bands',
    usage: 'TECHNICALS(ticker)',
    examples: ['TECHNICALS(AAPL)', 'TECHNICALS(SPY)'],
    tags: ['technical', 'rsi', 'macd', 'bollinger'],
    parameterSchema: {
      required: ['ticker'],
      optional: []
    }
  });

  commandRegistry.register('SUPPORT_RESISTANCE', technicalCommands.SUPPORT_RESISTANCE, {
    category: 'TECHNICAL',
    description: 'Key price levels and breakout targets analysis',
    usage: 'SUPPORT_RESISTANCE(ticker)',
    examples: ['SUPPORT_RESISTANCE(TSLA)', 'SUPPORT_RESISTANCE(QQQ)'],
    tags: ['support', 'resistance', 'levels', 'breakout'],
    parameterSchema: {
      required: ['ticker'],
      optional: []
    }
  });

  // Register ESG & Alternative Data Commands
  commandRegistry.register('ESG_SCORE', esgCommands.ESG_SCORE, {
    category: 'ESG',
    description: 'Environmental, social, governance analysis and scoring',
    usage: 'ESG_SCORE(ticker)',
    examples: ['ESG_SCORE(AAPL)', 'ESG_SCORE(TSLA)'],
    tags: ['esg', 'environmental', 'social', 'governance'],
    parameterSchema: {
      required: ['ticker'],
      optional: []
    }
  });

  commandRegistry.register('SOCIAL_SENTIMENT', esgCommands.SOCIAL_SENTIMENT, {
    category: 'ESG',
    description: 'Social media sentiment analysis across platforms',
    usage: 'SOCIAL_SENTIMENT(ticker, days)',
    examples: ['SOCIAL_SENTIMENT(AAPL)', 'SOCIAL_SENTIMENT(TSLA, 30)'],
    tags: ['sentiment', 'social-media', 'twitter', 'reddit'],
    parameterSchema: {
      required: ['ticker'],
      optional: ['days']
    }
  });

  commandRegistry.register('NEWS_IMPACT', esgCommands.NEWS_IMPACT, {
    category: 'ESG',
    description: 'News sentiment and price impact analysis',
    usage: 'NEWS_IMPACT(ticker, days)',
    examples: ['NEWS_IMPACT(AAPL)', 'NEWS_IMPACT(MSFT, 14)'],
    tags: ['news', 'sentiment', 'impact', 'catalyst'],
    parameterSchema: {
      required: ['ticker'],
      optional: ['days']
    }
  });

  // Register Automation & Workflow Commands
  commandRegistry.register('WATCHLIST', automationCommands.WATCHLIST, {
    category: 'AUTOMATION',
    description: 'Create and manage stock watchlists with analysis',
    usage: 'WATCHLIST(action, name, tickers)',
    examples: ['WATCHLIST(list)', 'WATCHLIST(create, "Tech", [AAPL,MSFT])', 'WATCHLIST(analyze, "Tech")'],
    tags: ['watchlist', 'portfolio', 'tracking'],
    parameterSchema: {
      required: ['action'],
      optional: ['name', 'tickers']
    }
  });

  commandRegistry.register('ALERT', automationCommands.ALERT, {
    category: 'AUTOMATION',
    description: 'Set price and metric alerts for stocks',
    usage: 'ALERT(ticker, condition, value)',
    examples: ['ALERT(AAPL, "price_above", 150)', 'ALERT(list)', 'ALERT(clear)'],
    tags: ['alerts', 'monitoring', 'notifications'],
    parameterSchema: {
      required: ['ticker', 'condition', 'value'],
      optional: []
    }
  });

  commandRegistry.register('BATCH_ANALYSIS', automationCommands.BATCH_ANALYSIS, {
    category: 'AUTOMATION',
    description: 'Analyze multiple stocks simultaneously with ranking',
    usage: 'BATCH_ANALYSIS(tickers, type)',
    examples: ['BATCH_ANALYSIS([AAPL,MSFT,GOOGL])', 'BATCH_ANALYSIS([SPY,QQQ,IWM], "detailed")'],
    tags: ['batch', 'screening', 'ranking'],
    parameterSchema: {
      required: ['tickers'],
      optional: ['type']
    }
  });

  // Register Automation & Workflow Commands
  commandRegistry.register('WATCHLIST', automationCommands.WATCHLIST, {
    category: 'AUTOMATION',
    description: 'Create and manage stock watchlists with analysis',
    usage: 'WATCHLIST(action, name, tickers)',
    examples: ['WATCHLIST(list)', 'WATCHLIST(create, "Tech", [AAPL,MSFT])', 'WATCHLIST(analyze, "Tech")'],
    tags: ['watchlist', 'portfolio', 'tracking'],
    parameterSchema: {
      required: ['action'],
      optional: ['name', 'tickers']
    }
  });

  commandRegistry.register('ALERT', automationCommands.ALERT, {
    category: 'AUTOMATION',
    description: 'Set price and metric alerts for stocks',
    usage: 'ALERT(ticker, condition, value)',
    examples: ['ALERT(AAPL, "price_above", 150)', 'ALERT(list)', 'ALERT(clear)'],
    tags: ['alerts', 'monitoring', 'notifications'],
    parameterSchema: {
      required: ['ticker', 'condition', 'value'],
      optional: []
    }
  });

  commandRegistry.register('BATCH_ANALYSIS', automationCommands.BATCH_ANALYSIS, {
    category: 'AUTOMATION',
    description: 'Analyze multiple stocks simultaneously with ranking',
    usage: 'BATCH_ANALYSIS(tickers, type)',
    examples: ['BATCH_ANALYSIS([AAPL,MSFT,GOOGL])', 'BATCH_ANALYSIS([SPY,QQQ,IWM], "detailed")'],
    tags: ['batch', 'screening', 'ranking'],
    parameterSchema: {
      required: ['tickers'],
      optional: ['type']
    }
  });

  // Register Data Management Commands
  commandRegistry.register('EXPORT_JSON', dataCommands.EXPORT_JSON, {
    category: 'DATA',
    description: 'Export data to JSON format for backup and sharing',
    usage: 'EXPORT_JSON(dataType, filename)',
    examples: ['EXPORT_JSON("watchlists")', 'EXPORT_JSON("all", "backup.json")'],
    tags: ['export', 'backup', 'json'],
    parameterSchema: {
      required: ['dataType'],
      optional: ['filename']
    }
  });

  commandRegistry.register('CACHE_STATS', dataCommands.CACHE_STATS, {
    category: 'DATA',
    description: 'View cache performance and memory usage statistics',
    usage: 'CACHE_STATS()',
    examples: ['CACHE_STATS()'],
    tags: ['cache', 'performance', 'memory'],
    parameterSchema: {
      required: [],
      optional: []
    }
  });

  commandRegistry.register('DATA_QUALITY', dataCommands.DATA_QUALITY, {
    category: 'DATA',
    description: 'Analyze data completeness and quality for a stock',
    usage: 'DATA_QUALITY(ticker)',
    examples: ['DATA_QUALITY(AAPL)', 'DATA_QUALITY(TSLA)'],
    tags: ['quality', 'validation', 'completeness'],
    parameterSchema: {
      required: ['ticker'],
      optional: []
    }
  });

  commandRegistry.register('BENCHMARK', dataCommands.BENCHMARK, {
    category: 'DATA',
    description: 'Compare stock performance against benchmark index',
    usage: 'BENCHMARK(ticker, benchmark)',
    examples: ['BENCHMARK(AAPL, SPY)', 'BENCHMARK(TSLA, QQQ)'],
    tags: ['benchmark', 'comparison', 'performance'],
    parameterSchema: {
      required: ['ticker'],
      optional: ['benchmark']
    }
  });

  // Register System & Performance Commands
  commandRegistry.register('PERFORMANCE_TEST', systemCommands.PERFORMANCE_TEST, {
    category: 'SYSTEM',
    description: 'Run comprehensive system performance benchmarks',
    usage: 'PERFORMANCE_TEST()',
    examples: ['PERFORMANCE_TEST()'],
    tags: ['performance', 'benchmark', 'system'],
    parameterSchema: {
      required: [],
      optional: []
    }
  });

  commandRegistry.register('API_USAGE', systemCommands.API_USAGE, {
    category: 'SYSTEM',
    description: 'Monitor API usage, rate limits, and costs',
    usage: 'API_USAGE()',
    examples: ['API_USAGE()'],
    tags: ['api', 'usage', 'limits', 'cost'],
    parameterSchema: {
      required: [],
      optional: []
    }
  });

  commandRegistry.register('CONFIG', systemCommands.CONFIG, {
    category: 'SYSTEM',
    description: 'View and update system configuration settings',
    usage: 'CONFIG(setting, value)',
    examples: ['CONFIG()', 'CONFIG("currency", "EUR")', 'CONFIG("precision", 3)'],
    tags: ['config', 'settings', 'preferences'],
    parameterSchema: {
      required: [],
      optional: ['setting', 'value']
    }
  });

  // Register Persistence & Privacy Commands
  commandRegistry.register('BACKUP_CREATE', persistenceCommands.BACKUP_CREATE, {
    category: 'PERSISTENCE',
    description: 'Create a backup of all user data',
    usage: 'BACKUP_CREATE(description)',
    examples: ['BACKUP_CREATE()', 'BACKUP_CREATE("Before major changes")'],
    tags: ['backup', 'data', 'export'],
    parameterSchema: {
      required: [],
      optional: ['description']
    }
  });

  commandRegistry.register('BACKUP_LIST', persistenceCommands.BACKUP_LIST, {
    category: 'PERSISTENCE',
    description: 'List all available backups',
    usage: 'BACKUP_LIST()',
    examples: ['BACKUP_LIST()'],
    tags: ['backup', 'list', 'management'],
    parameterSchema: {
      required: [],
      optional: []
    }
  });

  commandRegistry.register('BACKUP_RESTORE', persistenceCommands.BACKUP_RESTORE, {
    category: 'PERSISTENCE',
    description: 'Restore data from a backup',
    usage: 'BACKUP_RESTORE(backupId, overwrite)',
    examples: ['BACKUP_RESTORE("backup_123")', 'BACKUP_RESTORE("backup_123", "true")'],
    tags: ['backup', 'restore', 'recovery'],
    parameterSchema: {
      required: ['backupId'],
      optional: ['overwrite']
    }
  });

  commandRegistry.register('STORAGE_STATS', persistenceCommands.STORAGE_STATS, {
    category: 'PERSISTENCE',
    description: 'View storage usage and statistics',
    usage: 'STORAGE_STATS()',
    examples: ['STORAGE_STATS()'],
    tags: ['storage', 'statistics', 'usage'],
    parameterSchema: {
      required: [],
      optional: []
    }
  });

  commandRegistry.register('PRIVACY_CLEANUP', persistenceCommands.PRIVACY_CLEANUP, {
    category: 'PERSISTENCE',
    description: 'Clean up expired data according to privacy policies',
    usage: 'PRIVACY_CLEANUP()',
    examples: ['PRIVACY_CLEANUP()'],
    tags: ['privacy', 'cleanup', 'gdpr'],
    parameterSchema: {
      required: [],
      optional: []
    }
  });

  commandRegistry.register('PRIVACY_SETTINGS', persistenceCommands.PRIVACY_SETTINGS, {
    category: 'PERSISTENCE',
    description: 'View and update privacy settings',
    usage: 'PRIVACY_SETTINGS(setting, value)',
    examples: ['PRIVACY_SETTINGS()', 'PRIVACY_SETTINGS("analytics", "false")'],
    tags: ['privacy', 'settings', 'gdpr'],
    parameterSchema: {
      required: [],
      optional: ['setting', 'value']
    }
  });

  commandRegistry.register('SYNC_STATUS', persistenceCommands.SYNC_STATUS, {
    category: 'PERSISTENCE',
    description: 'View data synchronization status',
    usage: 'SYNC_STATUS()',
    examples: ['SYNC_STATUS()'],
    tags: ['sync', 'cloud', 'status'],
    parameterSchema: {
      required: [],
      optional: []
    }
  });

  commandRegistry.register('PERSISTENCE_TEST', persistenceCommands.PERSISTENCE_TEST, {
    category: 'PERSISTENCE',
    description: 'Run comprehensive persistence layer tests',
    usage: 'PERSISTENCE_TEST()',
    examples: ['PERSISTENCE_TEST()'],
    tags: ['test', 'debug', 'validation'],
    parameterSchema: {
      required: [],
      optional: []
    }
  });

  // Register Utility Commands
  commandRegistry.register('HELP', {
    execute: async (parsedCommand, context, processor) => {
      const [category] = parsedCommand.parameters;
      
      // Show ALL commands in detail
      if (category && category.toLowerCase() === 'all') {
        const allCommands = commandRegistry.getAllCommands();
        const categories = commandRegistry.getAllCategories();
        
        let content = `📚 COMPREHENSIVE COMMAND REFERENCE\n`;
        content += `FinanceAnalyst Pro Terminal v2.4.0 - Complete Command Suite\n`;
        content += `═════════════════════════════════════════════════════════════\n\n`;
        
        // Group commands by category
        categories.forEach(cat => {
          const categoryCommands = commandRegistry.getCommandsByCategory(cat.key);
          if (categoryCommands.length > 0) {
            content += `${cat.icon} ${cat.name.toUpperCase()} COMMANDS (${categoryCommands.length})\n`;
            content += `${cat.description}\n`;
            content += '─'.repeat(50) + '\n';
            
            categoryCommands.forEach(cmd => {
              content += `\n• ${cmd.usage}\n`;
              content += `  ${cmd.description}\n`;
              if (cmd.examples && cmd.examples.length > 0) {
                content += `  Examples: ${cmd.examples.join(', ')}\n`;
              }
              if (cmd.tags && cmd.tags.length > 0) {
                content += `  Tags: ${cmd.tags.join(', ')}\n`;
              }
            });
            content += '\n';
          }
        });
        
        content += `\n📊 SUMMARY: ${allCommands.length} total commands across ${categories.length} categories\n`;
        content += `\n💡 TIP: Use HELP(category) for specific category details\n`;
        content += `💡 TIP: Use HELP() for quick overview and featured commands`;
        
        return {
          type: 'system',
          content
        };
      }
      
      if (category) {
        // Show commands for specific category
        const categoryCommands = commandRegistry.getCommandsByCategory(category.toUpperCase());
        if (categoryCommands.length === 0) {
          return {
            type: 'error',
            content: `Unknown category: ${category}. Use HELP() to see all categories or HELP(ALL) for complete command list.`
          };
        }

        let content = `📋 ${category.toUpperCase()} COMMANDS (${categoryCommands.length})\n`;
        content += '═'.repeat(40) + '\n\n';
        
        categoryCommands.forEach(cmd => {
          content += `• ${cmd.usage}\n`;
          content += `  ${cmd.description}\n`;
          if (cmd.examples && cmd.examples.length > 0) {
            content += `  Examples: ${cmd.examples.join(', ')}\n`;
          }
          content += '\n';
        });
        
        content += `Use HELP() for overview or HELP(ALL) for all commands.`;

        return {
          type: 'system',
          content
        };
      }

      // Show all categories and featured commands (default view)
      const categories = commandRegistry.getAllCategories();
      const stats = commandRegistry.getCommandStats();
      const totalCommands = Object.values(stats).reduce((sum, cat) => sum + cat.count, 0);

      const content = `🚀 FinanceAnalyst Pro Terminal v2.4.0 - Enhanced Command Suite\n\n📊 COMMAND CATEGORIES:\n${categories.map(cat => 
  `${cat.icon} ${cat.name} (${stats[cat.key]?.count || 0} commands)\n   ${cat.description}`
).join('\n\n')}\n\n⭐ FEATURED COMMANDS:\n• DCF(AAPL) - Discounted Cash Flow with live data\n• LBO(TSLA) - Leveraged Buyout analysis\n• PORTFOLIO([AAPL,MSFT], [0.5,0.5]) - Portfolio analysis\n• RISK_METRICS(GOOGL) - Comprehensive risk analysis\n• CORRELATION_MATRIX([AAPL,MSFT,GOOGL]) - Cross-asset correlations\n• PRIVATE_DCF() - Private company DCF valuation\n• PRIVATE_RATIOS() - Private company financial ratios\n• PRIVATE_SUMMARY() - Private company analysis summary\n\n🔧 PRIVATE ANALYSIS COMMANDS:\n• PRIVATE_LOAD() - Load private company data\n• PRIVATE_DCF() - DCF valuation for private companies\n• PRIVATE_RATIOS() - Calculate private company ratios\n• PRIVATE_SUMMARY() - Generate private company summary\n\n💡 HELP COMMANDS:\n• HELP() - Show this overview (current)\n• HELP(category) - Show commands for specific category\n• HELP(ALL) - Show complete list of ALL ${totalCommands} commands\n\n📋 AVAILABLE CATEGORIES:\n${categories.map(cat => `• ${cat.key}`).join(' • ')}\n\n🚀 ENHANCED FEATURES:\n• Watchlists: Create and track custom stock lists\n• Alerts: Set price and metric notifications\n• Batch Analysis: Analyze multiple stocks simultaneously\n• ESG Scoring: Environmental, social, governance analysis\n• Technical Analysis: RSI, MACD, support/resistance\n• Advanced Valuation: DDM, residual income, asset-based models\n• Private Company Analysis: Full financial modeling suite\n\n📊 ${categories.length} categories • ${totalCommands} total commands available\n\n💡 Pro Tip: Use HELP(ALL) to see every single command with examples!`;

      return {
        type: 'system',
        content
      };
    },
    parameterSchema: {
      required: [],
      optional: ['category']
    }
  }, {
    category: 'UTILITY',
    description: 'Show available commands and usage information',
    usage: 'HELP(category)',
    examples: ['HELP()', 'HELP(PORTFOLIO)', 'HELP(CORE)', 'HELP(ALL)'],
    tags: ['help', 'documentation', 'commands']
  });

  commandRegistry.register('CLEAR', {
    execute: async (parsedCommand, context, processor) => {
      return {
        type: 'system',
        content: 'clear_terminal', // Special flag for terminal to clear
        action: 'clear'
      };
    }
  }, {
    category: 'UTILITY',
    description: 'Clear the terminal screen',
    usage: 'CLEAR()',
    examples: ['CLEAR()'],
    tags: ['utility', 'clear', 'terminal']
  });

  commandRegistry.register('STATUS', {
    execute: async (parsedCommand, context, processor) => {
      const settings = processor.getAllSettings();
      const variables = processor.getAllVariables();
      const history = processor.getHistory(5);

      const content = `System Status Report

🔧 SYSTEM CONFIGURATION:
• Currency: ${settings.currency}
• Precision: ${settings.precision} decimal places
• Date Format: ${settings.dateFormat}
• Demo Mode: ${context.demoMode ? 'Enabled' : 'Disabled'}

📊 SESSION STATISTICS:
• Commands Executed: ${history.length}
• Variables Stored: ${Object.keys(variables).length}
• Last Command: ${history[history.length - 1]?.input || 'None'}

🌐 API STATUS:
• Data Sources: ${context.demoMode ? 'Demo Data' : 'Live Market Data'}
• Rate Limits: Normal
• Cache Status: Active

💾 MEMORY USAGE:
• Command History: ${history.length} entries
• Variable Storage: ${Object.keys(variables).length} variables
• Cache Size: Optimal

✅ All systems operational`;

      return {
        type: 'system',
        content
      };
    }
  }, {
    category: 'UTILITY',
    description: 'Show system status and configuration',
    usage: 'STATUS()',
    examples: ['STATUS()'],
    tags: ['status', 'system', 'configuration']
  });

  console.log('✅ Command registry initialized with', commandRegistry.getAllCommands().length, 'commands');
}

// Auto-initialize when module is imported
initializeCommands();
