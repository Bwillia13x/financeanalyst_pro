/**
 * Core Financial Analysis Commands
 * DCF, LBO, COMP, and other fundamental analysis commands
 */

import {
  calculateDCFValuation,
  calculateLBOReturns,
  calculateComparableMetrics,
  formatCurrency,
  formatPercentage,
  formatNumber
} from '../../utils/dataTransformation';
import { dataFetchingService } from '../dataFetching';

export const coreCommands = {
  DCF: {
    execute: async (parsedCommand, _context, _processor) => {
      const [ticker] = parsedCommand.parameters;

      if (!ticker) {
        return {
          type: 'error',
          content: 'DCF command requires a ticker symbol. Usage: DCF(AAPL)'
        };
      }

      try {
        const loadingMessage = `🔄 Building DCF model for ${ticker.toUpperCase()}...\n• Fetching financial statements\n• Calculating free cash flows\n• Determining terminal value\n• Computing present values...\n${dataFetchingService.demoMode ? '\n⚠️  Using demo data - configure API keys for live data' : '\n✅ Using live market data'}`;

        // Loading message would be shown by context if available
        console.log('DCF Analysis:', loadingMessage);

        const dcfInputs = await dataFetchingService.fetchDCFInputs(ticker.toUpperCase());
        const dcfResults = calculateDCFValuation(dcfInputs);

        const content = `DCF Valuation Analysis for ${dcfInputs.companyName} (${ticker.toUpperCase()})\n\n📊 VALUATION SUMMARY:\n• Current Price: ${formatCurrency(dcfInputs.currentPrice)}\n• Fair Value: ${formatCurrency(dcfResults.fairValue)}\n• Upside/Downside: ${formatPercentage(dcfResults.upside / 100)}\n\n💰 KEY METRICS:\n• Enterprise Value: ${formatCurrency(dcfResults.enterpriseValue, 'USD', true)}\n• Equity Value: ${formatCurrency(dcfResults.equityValue, 'USD', true)}\n• Terminal Value: ${formatCurrency(dcfResults.terminalValue, 'USD', true)}\n• WACC: ${formatPercentage(dcfResults.wacc)}\n\n📈 5-YEAR PROJECTIONS:\n${dcfResults.projections.map((proj, i) => `Year ${i + 1}: Revenue ${formatCurrency(proj.revenue, 'USD', true)}, FCF ${formatCurrency(proj.fcf, 'USD', true)}`).join('\n')}\n\n🎯 RECOMMENDATION: ${dcfResults.recommendation}\n\n${dataFetchingService.demoMode ? '💡 Note: Using demo data. Configure API keys for live analysis.' : '✅ Analysis based on live market data'}`;

        return {
          type: 'success',
          content,
          data: {
            analysis: 'dcf',
            ticker: ticker.toUpperCase(),
            results: dcfResults
          }
        };
      } catch (error) {
        return {
          type: 'error',
          content: `DCF analysis failed: ${error.message}`
        };
      }
    },
    parameterSchema: {
      required: ['ticker'],
      optional: []
    }
  },

  LBO: {
    execute: async (parsedCommand, _context, _processor) => {
      const [ticker] = parsedCommand.parameters;

      if (!ticker) {
        return {
          type: 'error',
          content: 'LBO command requires a ticker symbol. Usage: LBO(TSLA)'
        };
      }

      try {
        const loadingMessage = `🔄 Analyzing LBO potential for ${ticker.toUpperCase()}...`;

        // Loading message would be shown by context if available
        console.log('LBO Analysis:', loadingMessage);

        const [profile, financials] = await Promise.all([
          dataFetchingService.fetchCompanyProfile(ticker.toUpperCase()),
          dataFetchingService.fetchFinancialStatements(ticker.toUpperCase(), 'income-statement')
        ]);

        const lboInputs = {
          companyName: profile.companyName,
          currentPrice: profile.price,
          marketCap: profile.mktCap,
          ebitda: financials[0]?.ebitda || profile.mktCap * 0.15,
          revenue: financials[0]?.revenue || profile.mktCap * 2,
          debt: profile.totalDebt || 0,
          cash: profile.totalCash || 0
        };

        const lboResults = calculateLBOReturns(lboInputs);

        const content = `LBO Analysis for ${profile.companyName} (${ticker.toUpperCase()})\n\n💼 TRANSACTION SUMMARY:\n• Purchase Price: ${formatCurrency(lboResults.purchasePrice, 'USD', true)}\n• Equity Investment: ${formatCurrency(lboResults.equityInvestment, 'USD', true)}\n• Total Debt: ${formatCurrency(lboResults.totalDebt, 'USD', true)}\n• Debt/Equity Ratio: ${formatNumber(lboResults.debtToEquity, 1)}x\n\n📈 PROJECTED RETURNS (5-year hold):\n• Exit Equity Value: ${formatCurrency(lboResults.exitEquityValue, 'USD', true)}\n• Total Return: ${formatCurrency(lboResults.totalReturn, 'USD', true)}\n• IRR: ${formatPercentage(lboResults.irr)}\n• MOIC: ${formatNumber(lboResults.moic, 1)}x\n\n🎯 EXIT ASSUMPTIONS:\n• Exit EBITDA: ${formatCurrency(lboResults.exitEbitda, 'USD', true)}\n• Exit Multiple: ${formatNumber(lboResults.exitMultiple, 1)}x\n• Exit Enterprise Value: ${formatCurrency(lboResults.exitEnterpriseValue, 'USD', true)}\n\n💰 FEES & CARRY:\n• Management Fees: ${formatCurrency(lboResults.managementFees, 'USD', true)}\n• Carried Interest: ${formatCurrency(lboResults.carriedInterest, 'USD', true)}\n• Net Return: ${formatCurrency(lboResults.netReturn, 'USD', true)}\n\n${dataFetchingService.demoMode ? '💡 Note: Using demo data. Configure API keys for live analysis.' : '✅ Analysis based on live market data'}`;

        return {
          type: 'success',
          content,
          data: {
            analysis: 'lbo',
            ticker: ticker.toUpperCase(),
            results: lboResults
          }
        };
      } catch (error) {
        return {
          type: 'error',
          content: `LBO analysis failed: ${error.message}`
        };
      }
    },
    parameterSchema: {
      required: ['ticker'],
      optional: []
    }
  },

  COMP: {
    execute: async (parsedCommand, _context, _processor) => {
      const [ticker] = parsedCommand.parameters;

      if (!ticker) {
        return {
          type: 'error',
          content: 'COMP command requires a ticker symbol. Usage: COMP(MSFT)'
        };
      }

      try {
        const loadingMessage = `🔄 Building comparable company analysis for ${ticker.toUpperCase()}...`;
        console.log('Peer Analysis:', loadingMessage);

        const [profile, peers] = await Promise.all([
          dataFetchingService.fetchCompanyProfile(ticker.toUpperCase()),
          dataFetchingService.fetchPeerComparables(ticker.toUpperCase())
        ]);

        const companyData = {
          symbol: ticker.toUpperCase(),
          name: profile.companyName,
          marketCap: profile.mktCap,
          peRatio: profile.pe,
          evToEbitda: profile.enterpriseValueOverEBITDA,
          priceToBook: profile.pb,
          debtToEquity: profile.debtToEquity
        };

        const compAnalysis = calculateComparableMetrics(companyData, peers);

        const content = `Comparable Company Analysis for ${profile.companyName} (${ticker.toUpperCase()})\n\n🏢 PEER GROUP (${peers.length} companies):\n${peers
          .slice(0, 5)
          .map(peer => `• ${peer.symbol}: ${peer.name}`)
          .join(
            '\n'
          )}\n\n📊 VALUATION MULTIPLES:\n• P/E Ratio: ${formatNumber(companyData.peRatio, 1)}x (Peer Median: ${formatNumber(compAnalysis.peerStatistics.peRatio.median, 1)}x)\n• EV/EBITDA: ${formatNumber(companyData.evToEbitda, 1)}x (Peer Median: ${formatNumber(compAnalysis.peerStatistics.evToEbitda.median, 1)}x)\n• P/B Ratio: ${formatNumber(companyData.priceToBook, 1)}x (Peer Median: ${formatNumber(compAnalysis.peerStatistics.priceToBook.median, 1)}x)\n\n📈 RELATIVE VALUATION:\n• P/E vs Peers: ${formatPercentage(compAnalysis.relativeValuation.peRatioRelative - 1)}\n• EV/EBITDA vs Peers: ${formatPercentage(compAnalysis.relativeValuation.evEbitdaRelative - 1)}\n• P/B vs Peers: ${formatPercentage(compAnalysis.relativeValuation.priceToBookRelative - 1)}\n\n💰 MARKET POSITION:\n• Market Cap Percentile: ${formatNumber(compAnalysis.relativeValuation.marketCapPercentile)}th\n• Size: ${companyData.marketCap > compAnalysis.peerStatistics.marketCap.median ? 'Above' : 'Below'} peer median\n\n🎯 PEER VALUATION RANGE:\n• Min P/E: ${formatNumber(compAnalysis.peerStatistics.peRatio.min, 1)}x\n• Max P/E: ${formatNumber(compAnalysis.peerStatistics.peRatio.max, 1)}x\n• Median P/E: ${formatNumber(compAnalysis.peerStatistics.peRatio.median, 1)}x\n\n${dataFetchingService.demoMode ? '💡 Note: Using demo data. Configure API keys for live analysis.' : '✅ Analysis based on live market data'}`;

        return {
          type: 'success',
          content,
          data: {
            analysis: 'comparable',
            ticker: ticker.toUpperCase(),
            results: compAnalysis
          }
        };
      } catch (error) {
        return {
          type: 'error',
          content: `Comparable analysis failed: ${error.message}`
        };
      }
    },
    parameterSchema: {
      required: ['ticker'],
      optional: []
    }
  },

  FETCH: {
    execute: async (parsedCommand, _context, _processor) => {
      const [ticker] = parsedCommand.parameters;

      if (!ticker) {
        return {
          type: 'error',
          content: 'FETCH command requires a ticker symbol. Usage: FETCH(GOOGL)'
        };
      }

      try {
        const profile = await dataFetchingService.fetchCompanyProfile(ticker.toUpperCase());

        const content = `Company Data for ${profile.companyName} (${ticker.toUpperCase()})\n\n🏢 COMPANY PROFILE:\n• Industry: ${profile.industry}\n• Sector: ${profile.sector}\n• Market Cap: ${formatCurrency(profile.mktCap, 'USD', true)}\n• Employees: ${formatNumber(profile.fullTimeEmployees, 0)}\n\n💰 FINANCIAL METRICS:\n• Price: ${formatCurrency(profile.price)}\n• P/E Ratio: ${formatNumber(profile.pe, 1)}\n• EPS: ${formatCurrency(profile.eps)}\n• Revenue (TTM): ${formatCurrency(profile.revenue, 'USD', true)}\n• Profit Margin: ${formatPercentage(profile.profitMargin)}\n\n📊 VALUATION RATIOS:\n• Price/Book: ${formatNumber(profile.pb, 2)}\n• Price/Sales: ${formatNumber(profile.ps, 2)}\n• EV/EBITDA: ${formatNumber(profile.enterpriseValueOverEBITDA, 1)}\n• EV/Revenue: ${formatNumber(profile.enterpriseValueOverRevenue, 1)}\n\n💼 BALANCE SHEET:\n• Total Debt: ${formatCurrency(profile.totalDebt, 'USD', true)}\n• Total Cash: ${formatCurrency(profile.totalCash, 'USD', true)}\n• Book Value: ${formatCurrency(profile.bookValue, 'USD', true)}\n• Debt/Equity: ${formatNumber(profile.debtToEquity, 2)}\n\n📈 PERFORMANCE:\n• 52W High: ${formatCurrency(profile.priceHigh52)}\n• 52W Low: ${formatCurrency(profile.priceLow52)}\n• Beta: ${formatNumber(profile.beta, 2)}\n• Dividend Yield: ${formatPercentage(profile.dividendYield)}\n\n${dataFetchingService.demoMode ? '💡 Note: Using demo data. Configure API keys for live data.' : '✅ Data from live market sources'}`;

        return {
          type: 'success',
          content,
          data: {
            analysis: 'profile',
            ticker: ticker.toUpperCase(),
            results: profile
          }
        };
      } catch (error) {
        return {
          type: 'error',
          content: `Data fetch failed: ${error.message}`
        };
      }
    },
    parameterSchema: {
      required: ['ticker'],
      optional: []
    }
  }
};
