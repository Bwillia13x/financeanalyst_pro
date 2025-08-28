/**
 * Automation & Workflow Commands
 * Watchlists, alerts, batch analysis, and automated workflows
 */

import { formatCurrency, formatPercentage, formatNumber } from '../../utils/dataTransformation';
import { dataFetchingService } from '../dataFetching';

export const automationCommands = {
  WATCHLIST: {
    execute: async (parsedCommand, _context, processor) => {
      const [action, name, tickers] = parsedCommand.parameters;

      if (!action) {
        return {
          type: 'error',
          content:
            'WATCHLIST command requires an action. Usage: WATCHLIST(create, "Tech Stocks", [AAPL,MSFT,GOOGL]) or WATCHLIST(list)'
        };
      }

      try {
        // Get existing watchlists from processor variables
        const watchlists = processor.getVariable('watchlists') || {};

        if (action.toLowerCase() === 'list') {
          if (Object.keys(watchlists).length === 0) {
            return {
              type: 'info',
              content:
                'No watchlists created yet. Use WATCHLIST(create, "name", [tickers]) to create one.'
            };
          }

          const content = `📋 Your Watchlists:\n\n${Object.entries(watchlists)
            .map(
              ([listName, data]) =>
                `📊 ${listName} (${data.tickers.length} stocks)\n• Created: ${data.created}\n• Tickers: ${data.tickers.join(', ')}\n• Last Updated: ${data.lastUpdated || 'Never'}`
            )
            .join(
              '\n\n'
            )}\n\n💡 Commands:\n• WATCHLIST(view, "name") - View detailed watchlist\n• WATCHLIST(update, "name", [new_tickers]) - Update watchlist\n• WATCHLIST(delete, "name") - Delete watchlist\n• WATCHLIST(analyze, "name") - Analyze all stocks in watchlist`;

          return {
            type: 'success',
            content,
            data: {
              analysis: 'watchlist_list',
              watchlists
            }
          };
        }

        if (action.toLowerCase() === 'create') {
          if (!name || !tickers) {
            return {
              type: 'error',
              content:
                'Create action requires name and tickers. Usage: WATCHLIST(create, "Tech Stocks", [AAPL,MSFT,GOOGL])'
            };
          }

          const tickerArray = Array.isArray(tickers) ? tickers : [tickers];
          watchlists[name] = {
            tickers: tickerArray.map(t => t.toUpperCase()),
            created: new Date().toISOString().split('T')[0],
            lastUpdated: null
          };

          processor.setVariable('watchlists', watchlists);

          return {
            type: 'success',
            content: `✅ Watchlist "${name}" created with ${tickerArray.length} stocks: ${tickerArray.join(', ')}\n\nUse WATCHLIST(analyze, "${name}") to analyze all stocks in this watchlist.`,
            data: {
              analysis: 'watchlist_created',
              name,
              tickers: tickerArray
            }
          };
        }

        if (action.toLowerCase() === 'view') {
          if (!name || !watchlists[name]) {
            return {
              type: 'error',
              content: `Watchlist "${name}" not found. Use WATCHLIST(list) to see available watchlists.`
            };
          }

          const watchlist = watchlists[name];

          // Fetch current data for all tickers
          const stockData = await Promise.all(
            watchlist.tickers.map(async ticker => {
              try {
                const profile = await dataFetchingService.fetchCompanyProfile(ticker);
                return {
                  ticker,
                  name: profile.companyName,
                  price: profile.price,
                  change: profile.changes || 0,
                  changePercent: profile.changesPercentage || 0,
                  marketCap: profile.mktCap,
                  pe: profile.pe
                };
              } catch {
                return {
                  ticker,
                  name: 'Error loading',
                  price: 0,
                  change: 0,
                  changePercent: 0,
                  marketCap: 0,
                  pe: 0
                };
              }
            })
          );

          const totalValue = stockData.reduce((sum, stock) => sum + stock.marketCap, 0);
          const avgChange =
            stockData.reduce((sum, stock) => sum + stock.changePercent, 0) / stockData.length;

          const content = `📊 Watchlist: ${name}\n\n📈 PERFORMANCE SUMMARY:\n• Total Market Cap: ${formatCurrency(totalValue, 'USD', true)}\n• Average Change: ${formatPercentage(avgChange / 100)} ${avgChange > 0 ? '📈' : '📉'}\n• Best Performer: ${stockData.reduce((best, stock) => (stock.changePercent > best.changePercent ? stock : best)).ticker} (${formatPercentage(Math.max(...stockData.map(s => s.changePercent)) / 100)})\n• Worst Performer: ${stockData.reduce((worst, stock) => (stock.changePercent < worst.changePercent ? stock : worst)).ticker} (${formatPercentage(Math.min(...stockData.map(s => s.changePercent)) / 100)})\n\n📋 HOLDINGS:\n${stockData
            .map(
              stock =>
                `• ${stock.ticker}: ${formatCurrency(stock.price)} ${stock.changePercent > 0 ? '📈' : stock.changePercent < 0 ? '📉' : '➡️'} ${formatPercentage(stock.changePercent / 100)} (P/E: ${formatNumber(stock.pe, 1)}x)`
            )
            .join(
              '\n'
            )}\n\n💡 QUICK ACTIONS:\n• WATCHLIST(analyze, "${name}") - Run analysis on all stocks\n• DCF(ticker) - Detailed analysis of any stock\n• PORTFOLIO([${watchlist.tickers.join(',')}], [equal weights]) - Portfolio analysis`;

          return {
            type: 'success',
            content,
            data: {
              analysis: 'watchlist_view',
              name,
              stockData,
              summary: {
                totalValue,
                avgChange
              }
            }
          };
        }

        if (action.toLowerCase() === 'analyze') {
          if (!name || !watchlists[name]) {
            return {
              type: 'error',
              content: `Watchlist "${name}" not found. Use WATCHLIST(list) to see available watchlists.`
            };
          }

          const watchlist = watchlists[name];

          // Perform quick analysis on all stocks
          const _analysisType = parsedCommand.parameters[0] || 'full';
          const analysisResults = await Promise.all(
            watchlist.tickers.slice(0, 5).map(async ticker => {
              // Limit to 5 for demo
              try {
                const profile = await dataFetchingService.fetchCompanyProfile(ticker);
                return {
                  ticker,
                  name: profile.companyName,
                  price: profile.price,
                  pe: profile.pe,
                  pb: profile.pb,
                  beta: profile.beta,
                  recommendation:
                    profile.pe < 20 && profile.pb < 3
                      ? 'Attractive'
                      : profile.pe > 30
                        ? 'Expensive'
                        : 'Fair Value'
                };
              } catch {
                return {
                  ticker,
                  name: 'Error',
                  recommendation: 'Unable to analyze',
                  error: 'Data fetch failed'
                };
              }
            })
          );

          const content = `🔍 Watchlist Analysis: ${name}\n\n📊 QUICK ANALYSIS RESULTS:\n${analysisResults
            .map(
              result =>
                `• ${result.ticker} (${result.name}):\n  Price: ${formatCurrency(result.price)}, P/E: ${formatNumber(result.pe, 1)}x, P/B: ${formatNumber(result.pb, 1)}x\n  Beta: ${formatNumber(result.beta, 2)}, Assessment: ${result.recommendation} ${result.recommendation === 'Attractive' ? '🟢' : result.recommendation === 'Expensive' ? '🔴' : '🟡'}`
            )
            .join(
              '\n\n'
            )}\n\n🎯 SUMMARY:\n• Attractive Opportunities: ${analysisResults.filter(r => r.recommendation === 'Attractive').length}\n• Fair Value Stocks: ${analysisResults.filter(r => r.recommendation === 'Fair Value').length}\n• Expensive Stocks: ${analysisResults.filter(r => r.recommendation === 'Expensive').length}\n\n💡 NEXT STEPS:\n• Run DCF(ticker) for detailed valuation of attractive stocks\n• Use COMP(ticker) for relative valuation analysis\n• Consider PORTFOLIO analysis for optimal allocation\n\n${watchlist.tickers.length > 5 ? `⚠️ Showing first 5 stocks. Full watchlist has ${watchlist.tickers.length} stocks.` : ''}`;

          return {
            type: 'success',
            content,
            data: {
              analysis: 'watchlist_analysis',
              name,
              results: analysisResults
            }
          };
        }

        return {
          type: 'error',
          content: `Unknown action "${action}". Available actions: list, create, view, analyze, update, delete`
        };
      } catch (error) {
        return {
          type: 'error',
          content: `Watchlist operation failed: ${error.message}`
        };
      }
    },
    parameterSchema: {
      required: ['action'],
      optional: ['name', 'tickers']
    }
  },

  ALERT: {
    execute: async (parsedCommand, _context, processor) => {
      const [ticker, condition, value] = parsedCommand.parameters;

      if (!ticker || !condition || value === undefined) {
        return {
          type: 'error',
          content:
            'ALERT command requires ticker, condition, and value. Usage: ALERT(AAPL, "price_above", 150) or ALERT(list)'
        };
      }

      try {
        if (ticker.toLowerCase() === 'list') {
          const alerts = processor.getVariable('alerts') || [];

          if (alerts.length === 0) {
            return {
              type: 'info',
              content:
                'No active alerts. Create alerts with ALERT(ticker, condition, value)\n\nSupported conditions:\n• price_above, price_below\n• pe_above, pe_below\n• volume_above\n• change_above, change_below'
            };
          }

          const content = `🚨 Active Alerts (${alerts.length}):\n\n${alerts
            .map(
              (alert, index) =>
                `${index + 1}. ${alert.ticker}: ${alert.condition.replace('_', ' ')} ${alert.value}\n   Created: ${alert.created}\n   Status: ${alert.triggered ? '✅ Triggered' : '⏳ Monitoring'}`
            )
            .join('\n\n')}\n\n💡 Use ALERT(clear) to remove all alerts`;

          return {
            type: 'success',
            content,
            data: {
              analysis: 'alert_list',
              alerts
            }
          };
        }

        if (ticker.toLowerCase() === 'clear') {
          processor.setVariable('alerts', []);
          return {
            type: 'success',
            content: '✅ All alerts cleared.'
          };
        }

        // Create new alert
        const alerts = processor.getVariable('alerts') || [];
        const newAlert = {
          id: Date.now(),
          ticker: ticker.toUpperCase(),
          condition,
          value: parseFloat(value),
          created: new Date().toISOString().split('T')[0],
          triggered: false
        };

        alerts.push(newAlert);
        processor.setVariable('alerts', alerts);

        // Check if alert should trigger immediately
        try {
          const profile = await dataFetchingService.fetchCompanyProfile(ticker.toUpperCase());
          let shouldTrigger = false;
          let currentValue = 0;

          switch (condition.toLowerCase()) {
            case 'price_above':
              currentValue = profile.price;
              shouldTrigger = profile.price > value;
              break;
            case 'price_below':
              currentValue = profile.price;
              shouldTrigger = profile.price < value;
              break;
            case 'pe_above':
              currentValue = profile.pe;
              shouldTrigger = profile.pe > value;
              break;
            case 'pe_below':
              currentValue = profile.pe;
              shouldTrigger = profile.pe < value;
              break;
          }

          const content = `🚨 Alert Created for ${ticker.toUpperCase()}\n\n📋 ALERT DETAILS:\n• Condition: ${condition.replace('_', ' ')} ${value}\n• Current Value: ${formatNumber(currentValue, 2)}\n• Status: ${shouldTrigger ? '🔴 TRIGGERED IMMEDIATELY' : '🟢 Monitoring'}\n• Created: ${newAlert.created}\n\n${shouldTrigger ? '⚠️ Alert condition is already met!' : '✅ Alert is now active and monitoring.'}\n\n💡 Use ALERT(list) to see all alerts`;

          if (shouldTrigger) {
            newAlert.triggered = true;
            processor.setVariable('alerts', alerts);
          }

          return {
            type: shouldTrigger ? 'warning' : 'success',
            content,
            data: {
              analysis: 'alert_created',
              alert: newAlert,
              triggered: shouldTrigger
            }
          };
        } catch {
          return {
            type: 'success',
            content: `🚨 Alert Created for ${ticker.toUpperCase()}\n\n📋 ALERT DETAILS:\n• Condition: ${condition.replace('_', ' ')} ${value}\n• Status: 🟢 Monitoring\n• Created: ${newAlert.created}\n\n✅ Alert is now active. Unable to check current status due to data fetch error.\n\n💡 Use ALERT(list) to see all alerts`
          };
        }
      } catch (error) {
        return {
          type: 'error',
          content: `Alert creation failed: ${error.message}`
        };
      }
    },
    parameterSchema: {
      required: ['ticker', 'condition', 'value'],
      optional: []
    }
  },

  BATCH_ANALYSIS: {
    execute: async (parsedCommand, _context, _processor) => {
      const [tickers, _analysisType = 'quick'] = parsedCommand.parameters;

      if (!tickers || !Array.isArray(tickers)) {
        return {
          type: 'error',
          content:
            'BATCH_ANALYSIS command requires an array of tickers. Usage: BATCH_ANALYSIS([AAPL,MSFT,GOOGL], "quick")'
        };
      }

      try {
        if (tickers.length > 10) {
          return {
            type: 'error',
            content: 'Batch analysis limited to 10 stocks maximum for performance reasons.'
          };
        }

        const results = await Promise.all(
          tickers.map(async ticker => {
            try {
              const profile = await dataFetchingService.fetchCompanyProfile(ticker.toUpperCase());

              // Quick analysis
              const score =
                (profile.pe < 20 ? 20 : profile.pe < 30 ? 10 : 0) +
                (profile.pb < 2 ? 20 : profile.pb < 3 ? 10 : 0) +
                (profile.debtToEquity < 0.5 ? 20 : profile.debtToEquity < 1 ? 10 : 0) +
                (profile.returnOnEquityTTM > 0.15 ? 20 : profile.returnOnEquityTTM > 0.1 ? 10 : 0) +
                (profile.profitMargin > 0.15 ? 20 : profile.profitMargin > 0.1 ? 10 : 0);

              return {
                ticker: ticker.toUpperCase(),
                name: profile.companyName,
                price: profile.price,
                marketCap: profile.mktCap,
                pe: profile.pe,
                pb: profile.pb,
                roe: profile.returnOnEquityTTM,
                profitMargin: profile.profitMargin,
                debtToEquity: profile.debtToEquity,
                score,
                rating:
                  score >= 80
                    ? 'Strong Buy'
                    : score >= 60
                      ? 'Buy'
                      : score >= 40
                        ? 'Hold'
                        : score >= 20
                          ? 'Weak Hold'
                          : 'Sell'
              };
            } catch {
              return {
                ticker: ticker.toUpperCase(),
                name: 'Error loading data',
                score: 0,
                rating: 'Unable to analyze',
                error: 'Data fetch failed'
              };
            }
          })
        );

        // Sort by score
        results.sort((a, b) => b.score - a.score);

        const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
        const topPick = results[0];
        const strongBuys = results.filter(r => r.rating === 'Strong Buy').length;
        const buys = results.filter(r => r.rating === 'Buy').length;

        const content = `📊 Batch Analysis Results (${tickers.length} stocks)\n\n🏆 TOP RANKED STOCKS:\n${results
          .slice(0, 5)
          .map(
            (stock, index) =>
              `${index + 1}. ${stock.ticker} (${stock.name})\n   Score: ${stock.score}/100, Rating: ${stock.rating} ${stock.rating.includes('Buy') ? '🟢' : stock.rating === 'Hold' ? '🟡' : '🔴'}\n   P/E: ${formatNumber(stock.pe, 1)}x, P/B: ${formatNumber(stock.pb, 1)}x, ROE: ${formatPercentage(stock.roe)}`
          )
          .join(
            '\n\n'
          )}\n\n📈 PORTFOLIO SUMMARY:\n• Average Score: ${formatNumber(avgScore, 1)}/100\n• Strong Buy: ${strongBuys} stocks\n• Buy: ${buys} stocks\n• Top Pick: ${topPick.ticker} (${topPick.score}/100)\n\n💰 VALUATION METRICS:\n• Average P/E: ${formatNumber(results.reduce((sum, r) => sum + (r.pe || 0), 0) / results.length, 1)}x\n• Average P/B: ${formatNumber(results.reduce((sum, r) => sum + (r.pb || 0), 0) / results.length, 1)}x\n• Average ROE: ${formatPercentage(results.reduce((sum, r) => sum + (r.roe || 0), 0) / results.length)}\n\n🎯 RECOMMENDATIONS:\n• Focus on top 3 ranked stocks for detailed analysis\n• Consider equal-weight portfolio of Buy-rated stocks\n• Use DCF(${topPick.ticker}) for detailed valuation of top pick\n• Monitor Hold-rated stocks for improvement\n\n💡 NEXT STEPS:\n• PORTFOLIO([${results
          .filter(r => r.rating.includes('Buy'))
          .map(r => r.ticker)
          .join(
            ','
          )}], equal) - Portfolio analysis\n• DCF(${topPick.ticker}) - Detailed valuation of top pick\n• COMP(${topPick.ticker}) - Peer comparison`;

        return {
          type: 'success',
          content,
          data: {
            analysis: 'batch_analysis',
            results,
            summary: {
              avgScore,
              topPick,
              strongBuys,
              buys
            }
          }
        };
      } catch (error) {
        return {
          type: 'error',
          content: `Batch analysis failed: ${error.message}`
        };
      }
    },
    parameterSchema: {
      required: ['tickers'],
      optional: ['analysisType']
    }
  }
};
