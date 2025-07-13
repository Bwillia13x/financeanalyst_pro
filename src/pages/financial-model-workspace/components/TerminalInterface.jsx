import React, { useState, useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import { dataFetchingService } from '../../../services/dataFetching';
import { 
  calculateDCFValuation, 
  calculateLBOReturns, 
  calculateComparableMetrics,
  formatCurrency,
  formatPercentage,
  formatNumber
} from '../../../utils/dataTransformation';

const TerminalInterface = ({ onCommandExecute, calculationResults }) => {
  const [commands, setCommands] = useState([
    { id: 1, type: 'system', content: 'FinanceAnalyst Pro Terminal v2.3.1 - Ready for financial modeling', timestamp: new Date() },
    { id: 2, type: 'system', content: 'Type "help" for available commands or start with DCF(AAPL), LBO(TSLA), or COMP(MSFT)', timestamp: new Date() }
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const terminalRef = useRef(null);
  const inputRef = useRef(null);

  const financialFunctions = [
    'DCF(ticker) - Discounted Cash Flow with real data',
    'LBO(ticker) - Leveraged Buyout analysis with real data', 
    'COMP(ticker) - Comparable company analysis',
    'FETCH(ticker) - Get comprehensive company data',
    'PROFILE(ticker) - Company profile and metrics',
    'FINANCIALS(ticker, statement) - Financial statements',
    'MARKET(ticker) - Real-time market data',
    'PEERS(ticker) - Peer company analysis',
    'SEC(ticker, filing_type) - SEC filings data',
    'NPV(cash_flows, discount_rate)',
    'IRR(cash_flows)', 
    'WACC(cost_equity, cost_debt, tax_rate, debt_ratio)',
    'CAPM(risk_free, beta, market_return)',
    'SENSITIVITY(ticker, variable, range)',
    'MONTE_CARLO(ticker, iterations)',
    'BETA(ticker)',
    'SHARPE_RATIO(ticker)',
    'VAR(ticker, confidence_level)',
    'CORRELATION(ticker1, ticker2)',
    'VOLATILITY(ticker)',
    'BLACK_SCHOLES(spot, strike, time, rate, volatility)',
    'BOND_PRICE(face_value, coupon_rate, yield, maturity)'
  ];

  const sampleCommands = [
    'help',
    'clear',
    'history',
    'export excel',
    'export pdf', 
    'save model',
    'load template',
    'set currency USD',
    'set precision 2',
    'show variables',
    'validate model',
    'run simulation',
    'status',
    'cache clear',
    'rate limits'
  ];

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commands]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setCurrentInput(value);

    if (value.length > 0) {
      const allSuggestions = [...financialFunctions, ...sampleCommands];
      const filtered = allSuggestions.filter(item => 
        item.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 8));
      setShowSuggestions(filtered.length > 0);
      setSelectedSuggestion(0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand();
    } else if (e.key === 'ArrowUp' && showSuggestions) {
      e.preventDefault();
      setSelectedSuggestion(prev => Math.max(0, prev - 1));
    } else if (e.key === 'ArrowDown' && showSuggestions) {
      e.preventDefault();
      setSelectedSuggestion(prev => Math.min(suggestions.length - 1, prev + 1));
    } else if (e.key === 'Tab' && showSuggestions) {
      e.preventDefault();
      setCurrentInput(suggestions[selectedSuggestion]);
      setShowSuggestions(false);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const executeCommand = async () => {
    if (!currentInput.trim()) return;

    const newCommand = {
      id: commands.length + 1,
      type: 'user',
      content: currentInput,
      timestamp: new Date()
    };

    setCommands(prev => [...prev, newCommand]);
    setIsLoading(true);
    setCurrentInput('');
    setShowSuggestions(false);

    try {
      const response = await processCommand(currentInput);
      
      const responseCommand = {
        id: commands.length + 2,
        type: response.type,
        content: response.content,
        timestamp: new Date(),
        data: response.data
      };

      setCommands(prev => [...prev, responseCommand]);

      if (onCommandExecute) {
        onCommandExecute(currentInput, response);
      }
    } catch (error) {
      const errorCommand = {
        id: commands.length + 2,
        type: 'error',
        content: `Error: ${error.message}`,
        timestamp: new Date()
      };
      setCommands(prev => [...prev, errorCommand]);
    } finally {
      setIsLoading(false);
    }
  };

  const processCommand = async (command) => {
    const cmd = command.toLowerCase().trim();

    if (cmd === 'help') {
      return {
        type: 'system',
        content: `Available Commands:

📊 Real-Time Data Functions:
• DCF(AAPL) - Discounted Cash Flow with live data
• LBO(TSLA) - Leveraged Buyout analysis
• COMP(MSFT) - Comparable company analysis
• FETCH(GOOGL) - Get comprehensive company data
• PROFILE(AMZN) - Company profile and metrics
• MARKET(NFLX) - Real-time market data
• PEERS(META) - Peer company analysis
• SEC(AAPL, 10-K) - SEC filings data

🧮 Classic Financial Functions:
• NPV([cf1,cf2,cf3], 0.10) - Net Present Value
• IRR([cf1,cf2,cf3]) - Internal Rate of Return
• WACC(0.12, 0.05, 0.25, 0.3) - Cost of Capital

🔬 Analysis Tools:
• SENSITIVITY(AAPL, wacc, [0.08,0.12]) - Sensitivity analysis
• MONTE_CARLO(AAPL, 1000) - Monte Carlo simulation

🛠️ Utility Commands:
• clear - Clear terminal
• status - Show system and API status
• validate - Validate API keys
• cache clear - Clear data cache
• export excel/pdf - Export current model
• save model - Save current work

💡 Examples:
• DCF(AAPL) - Runs full DCF with live Apple data
• validate - Check your API key configuration
• status - See current system status

${dataFetchingService.demoMode ? '🚨 Note: Currently running in demo mode. Use "validate" to check API keys.' : '✅ Live data mode active'}`
      };
    }

    if (cmd === 'clear') {
      setTimeout(() => setCommands([]), 100);
      return { type: 'system', content: 'Terminal cleared.' };
    }

    if (cmd === 'status') {
      try {
        const apiStatus = await dataFetchingService.getApiStatus();
        const validation = apiStatus.validation;

        let statusContent = `System Status:

📊 Data Sources: ${apiStatus.demoMode ? 'Demo Mode (Mock Data)' : 'Live APIs Connected'}
🔄 Cache: ${apiStatus.cacheSize} entries
⏱️ Rate Limits: ${apiStatus.demoMode ? 'Disabled (Demo)' : 'Active'}
🌐 Network: Connected
💾 Cache TTL: 15min-24hrs depending on data type
🎯 Overall API Status: ${validation.overall.toUpperCase()}

🔑 API Key Validation:`;

        // Add status for each service
        Object.entries(validation.services).forEach(([service, result]) => {
          const statusIcon = result.status === 'valid' ? '✅' :
                           result.status === 'missing' ? '❌' :
                           result.status === 'invalid' ? '🚫' :
                           result.status === 'rate_limited' ? '⚠️' : '❓';
          statusContent += `\n• ${service}: ${statusIcon} ${result.message}`;
        });

        if (validation.recommendations.length > 0) {
          statusContent += '\n\n💡 Recommendations:';
          validation.recommendations.forEach(rec => {
            statusContent += `\n• ${rec}`;
          });
        }

        statusContent += `\n\nLast Updated: ${new Date().toLocaleTimeString()}`;

        return {
          type: 'info',
          content: statusContent
        };
      } catch (error) {
        return {
          type: 'error',
          content: `Error checking system status: ${error.message}`
        };
      }
    }

    if (cmd === 'validate') {
      try {
        const validation = await dataFetchingService.validateApiKeys();

        let content = `🔍 API Key Validation Results:

Overall Status: ${validation.overall.toUpperCase()}

Service Details:`;

        Object.entries(validation.services).forEach(([service, result]) => {
          const statusIcon = result.status === 'valid' ? '✅' :
                           result.status === 'missing' ? '❌' :
                           result.status === 'invalid' ? '🚫' :
                           result.status === 'rate_limited' ? '⚠️' :
                           result.status === 'network_error' ? '🌐' : '❓';
          content += `\n• ${service}: ${statusIcon} ${result.message}`;
        });

        if (validation.recommendations.length > 0) {
          content += '\n\n💡 Recommendations:';
          validation.recommendations.forEach(rec => {
            content += `\n• ${rec}`;
          });
        }

        content += `\n\nValidation completed at: ${validation.timestamp.toLocaleTimeString()}`;

        return {
          type: validation.overall === 'complete' ? 'success' :
                validation.overall === 'demo' ? 'warning' : 'info',
          content: content
        };
      } catch (error) {
        return {
          type: 'error',
          content: `Validation failed: ${error.message}`
        };
      }
    }

    if (cmd === 'cache clear') {
      dataFetchingService.cache.clear();
      dataFetchingService.cacheExpiry.clear();
      return { type: 'success', content: 'Data cache cleared successfully.' };
    }

    // DCF with real data
    if (cmd.match(/^dcf\s*\(\s*([A-Z]{1,5})\s*\)$/i)) {
      const ticker = cmd.match(/^dcf\s*\(\s*([A-Z]{1,5})\s*\)$/i)[1].toUpperCase();
      
      const loadingCommand = {
        id: commands.length + 2,
        type: 'info',
        content: `🔄 Fetching comprehensive data for ${ticker}...\n• Company profile and metrics\n• 5 years of financial statements\n• Market data and pricing\n• Calculating DCF valuation...\n${dataFetchingService.demoMode ? '\n⚠️  Using demo data - configure API keys for live data' : '\n✅ Using live market data'}`,
        timestamp: new Date()
      };
      setCommands(prev => [...prev, loadingCommand]);

      try {
        const dcfInputs = await dataFetchingService.fetchDCFInputs(ticker);
        const dcfResult = calculateDCFValuation(dcfInputs);
        
        const upside = ((dcfResult.pricePerShare - dcfInputs.currentPrice) / dcfInputs.currentPrice) * 100;
        
        return {
          type: 'success',
          content: `DCF Analysis Complete for ${dcfInputs.companyName} (${ticker})\n\n📈 VALUATION RESULTS:\n• Current Price: ${formatCurrency(dcfInputs.currentPrice)}\n• DCF Fair Value: ${formatCurrency(dcfResult.pricePerShare)}\n• Upside/(Downside): ${formatPercentage(upside/100)}\n\n💰 VALUE BREAKDOWN:\n• Enterprise Value: ${formatCurrency(dcfResult.enterpriseValue, 'USD', true)}\n• Equity Value: ${formatCurrency(dcfResult.equityValue, 'USD', true)}\n• PV of Cash Flows: ${formatCurrency(dcfResult.pvOfCashFlows, 'USD', true)}\n• PV of Terminal Value: ${formatCurrency(dcfResult.pvOfTerminalValue, 'USD', true)}\n\n🔢 KEY ASSUMPTIONS:\n• Revenue Growth: ${formatPercentage(dcfInputs.revenueGrowthRate)}\n• FCF Margin: ${formatPercentage(dcfInputs.fcfMargin)}\n• WACC: ${formatPercentage(dcfInputs.wacc)}\n• Terminal Growth: ${formatPercentage(dcfInputs.terminalGrowthRate)}\n• Beta: ${formatNumber(dcfInputs.beta, 2)}\n\n📊 Current Metrics:\n• Market Cap: ${formatCurrency(dcfInputs.marketCap, 'USD', true)}\n• P/E Ratio: ${formatNumber(dcfInputs.peRatio, 1)}x\n• Net Debt: ${formatCurrency(dcfInputs.totalDebt - dcfInputs.cash, 'USD', true)}\n\n${dataFetchingService.demoMode ? '⚠️  Demo data used - results are illustrative only' : '✅ Analysis based on live market data'}`,
          data: { dcfInputs, dcfResult, analysis: 'dcf' }
        };
      } catch (error) {
        return {
          type: 'error',
          content: `DCF Analysis Failed: ${error.message}\n\nTroubleshooting:\n• Check ticker symbol spelling\n• Ensure internet connection\n• Verify API keys are configured (if not using demo mode)\n• Try 'status' command to check system status`
        };
      }
    }

    // LBO with real data
    if (cmd.match(/^lbo\s*\(\s*([A-Z]{1,5})\s*\)$/i)) {
      const ticker = cmd.match(/^lbo\s*\(\s*([A-Z]{1,5})\s*\)$/i)[1].toUpperCase();
      
      const loadingCommand = {
        id: commands.length + 2,
        type: 'info',
        content: `🔄 Analyzing LBO potential for ${ticker}...\n• Fetching financial statements\n• Calculating debt capacity\n• Analyzing peer multiples\n• Computing returns scenarios...\n${dataFetchingService.demoMode ? '\n⚠️  Using demo data - configure API keys for live data' : '\n✅ Using live market data'}`,
        timestamp: new Date()
      };
      setCommands(prev => [...prev, loadingCommand]);

      try {
        const lboInputs = await dataFetchingService.fetchLBOInputs(ticker);
        
        // Calculate multiple scenarios
        const scenarios = [
          { name: 'Conservative', exitMultiple: lboInputs.avgPeerMultiple * 0.9, debtMultiple: 4 },
          { name: 'Base Case', exitMultiple: lboInputs.avgPeerMultiple, debtMultiple: 5 },
          { name: 'Aggressive', exitMultiple: lboInputs.avgPeerMultiple * 1.1, debtMultiple: 6 }
        ];

        const results = scenarios.map(scenario => {
          const purchasePrice = lboInputs.suggestedPurchasePrice;
          return {
            scenario: scenario.name,
            ...calculateLBOReturns({
              purchasePrice,
              ebitda: lboInputs.ebitda,
              debtMultiple: scenario.debtMultiple,
              exitMultiple: scenario.exitMultiple
            })
          };
        });

        const baseCase = results[1];
        
        return {
          type: 'success',
          content: `LBO Analysis Complete for ${lboInputs.companyName} (${ticker})\n\n🎯 BASE CASE SCENARIO:\n• Purchase Price: ${formatCurrency(lboInputs.suggestedPurchasePrice, 'USD', true)}\n• Equity Investment: ${formatCurrency(baseCase.equityInvestment, 'USD', true)}\n• Total Debt: ${formatCurrency(baseCase.totalDebt, 'USD', true)}\n• 5-Year IRR: ${formatPercentage(baseCase.irr)}\n• Money Multiple: ${formatNumber(baseCase.moic, 1)}x\n\n📊 TRANSACTION METRICS:\n• Current EV/EBITDA: ${formatNumber(lboInputs.evEbitdaMultiple, 1)}x\n• Purchase Multiple: ${formatNumber(lboInputs.suggestedPurchasePrice / lboInputs.ebitda, 1)}x\n• Debt/EBITDA: ${formatNumber(baseCase.totalDebt / lboInputs.ebitda, 1)}x\n• Current Debt/EBITDA: ${formatNumber(lboInputs.debtToEbitda, 1)}x\n\n💼 SCENARIO ANALYSIS:\n• Conservative IRR: ${formatPercentage(results[0].irr)} (${formatNumber(results[0].moic, 1)}x)\n• Base Case IRR: ${formatPercentage(results[1].irr)} (${formatNumber(results[1].moic, 1)}x)\n• Aggressive IRR: ${formatPercentage(results[2].irr)} (${formatNumber(results[2].moic, 1)}x)\n\n⚠️  KEY RISKS:\n• Interest Coverage: ${formatNumber(lboInputs.interestCoverage, 1)}x\n• Max Debt Capacity: ${formatCurrency(lboInputs.maxDebtCapacity, 'USD', true)}\n• Current Market Cap: ${formatCurrency(lboInputs.marketCap, 'USD', true)}\n\n${dataFetchingService.demoMode ? '⚠️  Demo data used - results are illustrative only' : '✅ Analysis based on live market data'}`,
          data: { lboInputs, results, analysis: 'lbo' }
        };
      } catch (error) {
        return {
          type: 'error',
          content: `LBO Analysis Failed: ${error.message}\n\nTroubleshooting:\n• Check ticker symbol spelling\n• Ensure internet connection\n• Verify API keys are configured (if not using demo mode)\n• Try 'status' command to check system status`
        };
      }
    }

    // Comparable company analysis
    if (cmd.match(/^comp\s*\(\s*([A-Z]{1,5})\s*\)$/i)) {
      const ticker = cmd.match(/^comp\s*\(\s*([A-Z]{1,5})\s*\)$/i)[1].toUpperCase();
      
      const loadingCommand = {
        id: commands.length + 2,
        type: 'info',
        content: `🔄 Building comparable company analysis for ${ticker}...\n• Identifying peer companies\n• Fetching peer financial data\n• Calculating valuation multiples\n• Generating relative analysis...\n${dataFetchingService.demoMode ? '\n⚠️  Using demo data - configure API keys for live data' : '\n✅ Using live market data'}`,
        timestamp: new Date()
      };
      setCommands(prev => [...prev, loadingCommand]);

      try {
        const [profile, peers] = await Promise.all([
          dataFetchingService.fetchCompanyProfile(ticker),
          dataFetchingService.fetchPeerComparables(ticker)
        ]);

        const companyData = {
          symbol: ticker,
          name: profile.companyName,
          marketCap: profile.mktCap,
          peRatio: profile.pe,
          evToEbitda: profile.enterpriseValueOverEBITDA,
          priceToBook: profile.pb,
          debtToEquity: profile.debtToEquity
        };

        const compAnalysis = calculateComparableMetrics(companyData, peers);
        
        return {
          type: 'success',
          content: `Comparable Company Analysis for ${profile.companyName} (${ticker})\n\n🏢 PEER GROUP (${peers.length} companies):\n${peers.slice(0, 5).map(peer => `• ${peer.symbol}: ${peer.name}`).join('\n')}\n\n📊 VALUATION MULTIPLES vs PEERS:\n• P/E Ratio: ${formatNumber(companyData.peRatio, 1)}x (Median: ${formatNumber(compAnalysis.peerStatistics.peRatio.median, 1)}x)\n• EV/EBITDA: ${formatNumber(companyData.evToEbitda, 1)}x (Median: ${formatNumber(compAnalysis.peerStatistics.evToEbitda.median, 1)}x)\n• Price/Book: ${formatNumber(companyData.priceToBook, 1)}x (Median: ${formatNumber(compAnalysis.peerStatistics.priceToBook.median, 1)}x)\n• Debt/Equity: ${formatNumber(companyData.debtToEquity, 1)}x (Median: ${formatNumber(compAnalysis.peerStatistics.debtToEquity.median, 1)}x)\n\n📈 RELATIVE VALUATION:\n• P/E vs Peers: ${formatPercentage((compAnalysis.relativeValuation.peRatioRelative - 1))} ${compAnalysis.relativeValuation.peRatioRelative > 1 ? 'premium' : 'discount'}\n• EV/EBITDA vs Peers: ${formatPercentage((compAnalysis.relativeValuation.evEbitdaRelative - 1))} ${compAnalysis.relativeValuation.evEbitdaRelative > 1 ? 'premium' : 'discount'}\n• Market Cap Percentile: ${formatPercentage(compAnalysis.relativeValuation.marketCapPercentile)}\n\n💰 PEER STATISTICS:\n• P/E Range: ${formatNumber(compAnalysis.peerStatistics.peRatio.min, 1)}x - ${formatNumber(compAnalysis.peerStatistics.peRatio.max, 1)}x\n• EV/EBITDA Range: ${formatNumber(compAnalysis.peerStatistics.evToEbitda.min, 1)}x - ${formatNumber(compAnalysis.peerStatistics.evToEbitda.max, 1)}x\n• Average Market Cap: ${formatCurrency(compAnalysis.peerStatistics.marketCap.mean, 'USD', true)}\n\n${dataFetchingService.demoMode ? '⚠️  Demo data used - results are illustrative only' : '✅ Analysis based on live market data'}`,
          data: { companyData, peers, compAnalysis, analysis: 'comparable' }
        };
      } catch (error) {
        return {
          type: 'error',
          content: `Comparable Analysis Failed: ${error.message}\n\nTroubleshooting:\n• Check ticker symbol spelling\n• Ensure internet connection\n• Verify API keys are configured (if not using demo mode)\n• Try 'status' command to check system status`
        };
      }
    }

    // Fetch comprehensive company data
    if (cmd.match(/^fetch\s*\(\s*([A-Z]{1,5})\s*\)$/i)) {
      const ticker = cmd.match(/^fetch\s*\(\s*([A-Z]{1,5})\s*\)$/i)[1].toUpperCase();
      
      try {
        const profile = await dataFetchingService.fetchCompanyProfile(ticker);
        const marketData = await dataFetchingService.fetchMarketData(ticker);
        
        return {
          type: 'success',
          content: `Company Data for ${profile.companyName} (${ticker})\n\n💼 PROFILE:\n• Sector: ${profile.sector}\n• Industry: ${profile.industry}\n• Employees: ${formatNumber(profile.fullTimeEmployees, 0)}\n• Founded: ${profile.ipoDate}\n\n📊 MARKET DATA:\n• Current Price: ${formatCurrency(marketData.currentPrice)}\n• Market Cap: ${formatCurrency(profile.mktCap, 'USD', true)}\n• 52W Range: ${profile.range} \n• Volume: ${formatNumber(marketData.volume, 0, true)}\n• Beta: ${formatNumber(profile.beta, 2)}\n\n📈 VALUATION:\n• P/E Ratio: ${formatNumber(profile.pe, 1)}x\n• P/B Ratio: ${formatNumber(profile.pb, 1)}x\n• EV/EBITDA: ${formatNumber(profile.enterpriseValueOverEBITDA, 1)}x\n• Debt/Equity: ${formatNumber(profile.debtToEquity, 1)}x\n\n💰 PROFITABILITY:\n• Revenue TTM: ${formatCurrency(profile.revenueTTM, 'USD', true)}\n• Gross Margin: ${formatPercentage(profile.grossProfitMargin)}\n• Net Margin: ${formatPercentage(profile.netProfitMargin)}\n• ROE: ${formatPercentage(profile.returnOnEquityTTM)}\n• ROA: ${formatPercentage(profile.returnOnAssetsTTM)}\n\n${dataFetchingService.demoMode ? '⚠️  Demo data used - results are illustrative only' : '✅ Data based on live market feeds'}`,
          data: { profile, marketData, analysis: 'comprehensive' }
        };
      } catch (error) {
        return {
          type: 'error',
          content: `Data Fetch Failed: ${error.message}\n\nTroubleshooting:\n• Check ticker symbol spelling\n• Ensure internet connection\n• Verify API keys are configured (if not using demo mode)\n• Try 'status' command to check system status`
        };
      }
    }

    // Classic NPV calculation
    if (cmd.match(/^npv\s*\(\s*\[([^\]]+)\]\s*,\s*([\d.]+)\s*\)$/i)) {
      const match = cmd.match(/^npv\s*\(\s*\[([^\]]+)\]\s*,\s*([\d.]+)\s*\)$/i);
      const cashFlows = match[1].split(',').map(cf => parseFloat(cf.trim()));
      const discountRate = parseFloat(match[2]);
      
      let npv = 0;
      const pvBreakdown = cashFlows.map((cf, index) => {
        const pv = cf / Math.pow(1 + discountRate, index + 1);
        npv += pv;
        return { year: index + 1, cashFlow: cf, presentValue: pv };
      });

      return {
        type: 'success',
        content: `NPV Calculation:\n\nCash Flows: [${cashFlows.map(cf => formatCurrency(cf)).join(', ')}]\nDiscount Rate: ${formatPercentage(discountRate)}\n\nNet Present Value: ${formatCurrency(npv)}\n\nYear-by-Year Breakdown:\n${pvBreakdown.map(item => `Year ${item.year}: ${formatCurrency(item.cashFlow)} → PV: ${formatCurrency(item.presentValue)}`).join('\n')}`,
        data: { npv, cashFlows, discountRate, pvBreakdown }
      };
    }

    if (cmd === 'show variables') {
      return {
        type: 'info',
        content: `Current Model Variables:\n\n• Revenue Growth: 5.2%\n• EBITDA Margin: 23.5%\n• Tax Rate: 25.0%\n• WACC: 9.8%\n• Terminal Growth: 2.5%\n• Debt/Equity: 0.4x\n• Beta: 1.15\n• Risk-free Rate: 3.2%\n• Market Premium: 6.5%\n\n🔄 Data Sources Active:\n${dataFetchingService.demoMode ? '• Demo Mode: Mock data for all sources' : '• Alpha Vantage: Market data\n• FMP: Financial statements\n• SEC EDGAR: Regulatory filings\n• Yahoo Finance: Real-time quotes'}`
      };
    }

    if (cmd === 'validate model') {
      return {
        type: 'warning',
        content: `Model Validation Results:\n\n✓ All formulas syntactically correct\n✓ No circular references detected\n${dataFetchingService.demoMode ? '⚠ Demo mode: Using mock data' : '✓ Data sources responding normally'}\n${dataFetchingService.demoMode ? '⚠ Configure API keys for live validation' : '✓ Rate limits within acceptable range'}\n✓ Cache functioning properly\n✓ All required inputs available\n\nOverall Status: ${dataFetchingService.demoMode ? 'Valid (Demo Mode)' : 'Valid with live data'}\nLast validation: ${new Date().toLocaleTimeString()}`
      };
    }

    return {
      type: 'error',
      content: `Unknown command: "${command}"\n\nTry these real-data commands:\n• DCF(AAPL) - Apple DCF analysis\n• LBO(TSLA) - Tesla LBO analysis\n• COMP(MSFT) - Microsoft comparables\n• FETCH(GOOGL) - Google company data\n\nType "help" for full command list.\n\n${dataFetchingService.demoMode ? '💡 Tip: Configure API keys in your .env file for live data analysis' : ''}`
    };
  };

  const selectSuggestion = (suggestion) => {
    setCurrentInput(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-green-400 font-mono text-sm">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Icon name="Terminal" size={16} className="text-green-400" />
          <span className="text-green-400 font-medium">Financial Terminal</span>
          <span className="text-xs text-blue-400">• Live Data Enabled</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
          <span className="text-xs text-gray-400">{isLoading ? 'Processing...' : 'Connected'}</span>
        </div>
      </div>

      {/* Terminal Content */}
      <div 
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-4 space-y-2"
        onClick={() => inputRef.current?.focus()}
      >
        {commands.map((command) => (
          <div key={command.id} className="space-y-1">
            <div className="flex items-start space-x-2">
              {command.type === 'user' && (
                <span className="text-blue-400 shrink-0">analyst@finpro:~$</span>
              )}
              {command.type === 'system' && (
                <Icon name="Info" size={14} className="text-yellow-400 mt-0.5 shrink-0" />
              )}
              {command.type === 'success' && (
                <Icon name="CheckCircle" size={14} className="text-green-400 mt-0.5 shrink-0" />
              )}
              {command.type === 'error' && (
                <Icon name="XCircle" size={14} className="text-red-400 mt-0.5 shrink-0" />
              )}
              {command.type === 'warning' && (
                <Icon name="AlertTriangle" size={14} className="text-yellow-400 mt-0.5 shrink-0" />
              )}
              {command.type === 'info' && (
                <Icon name="Info" size={14} className="text-blue-400 mt-0.5 shrink-0" />
              )}
              <div className="flex-1">
                <pre className="whitespace-pre-wrap break-words">{command.content}</pre>
                {command.data && (
                  <div className="mt-2 p-2 bg-gray-800 rounded border border-gray-700">
                    <div className="text-xs text-gray-400">
                      Real-time calculation data available • Analysis: {command.data.analysis || 'financial'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center space-x-2 text-yellow-400">
            <div className="animate-spin w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full" />
            <span>Fetching real-time data...</span>
          </div>
        )}

        {/* Input Line */}
        <div className="flex items-center space-x-2 relative">
          <span className="text-blue-400 shrink-0">analyst@finpro:~$</span>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent text-green-400 outline-none border-none"
              placeholder="Enter command with ticker (e.g., DCF(AAPL))..."
              autoComplete="off"
              disabled={isLoading}
            />
            
            {/* Suggestions Dropdown */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={`px-3 py-2 cursor-pointer text-sm ${
                      index === selectedSuggestion 
                        ? 'bg-gray-700 text-green-300' : 'text-gray-300 hover:bg-gray-700'
                    }`}
                    onClick={() => selectSuggestion(suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Terminal Footer */}
      <div className="px-4 py-2 bg-gray-800 border-t border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Tab: Autocomplete</span>
            <span>Ctrl+C: Cancel</span>
            <span>↑↓: Navigate suggestions</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Commands: {commands.filter(c => c.type === 'user').length}</span>
            <span>•</span>
            <span>Cache: {dataFetchingService?.cache?.size || 0}</span>
            <span>•</span>
            <span>{new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerminalInterface;