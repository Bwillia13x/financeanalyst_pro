/**
 * Advanced Valuation Model Commands
 * DDM, Residual Income, Asset-Based, and other sophisticated valuation techniques
 */

import { formatCurrency, formatPercentage, formatNumber } from '../../utils/dataTransformation';
import { dataFetchingService } from '../dataFetching';

export const valuationCommands = {
  DDM: {
    execute: async (parsedCommand, _context, _processor) => {
      const [ticker] = parsedCommand.parameters;

      if (!ticker) {
        return {
          type: 'error',
          content: 'DDM command requires a ticker symbol. Usage: DDM(AAPL)'
        };
      }

      try {
        const profile = await dataFetchingService.fetchCompanyProfile(ticker.toUpperCase());
        const _financials = await dataFetchingService.fetchFinancialStatements(
          ticker.toUpperCase(),
          'income-statement'
        );

        // DDM calculations
        const currentDividend = profile.dividendYield * profile.price || 0;
        const dividendGrowthRate = 0.05; // Assumed 5% growth
        const requiredReturn = (profile.beta || 1.0) * 0.06 + 0.03; // CAPM

        if (currentDividend === 0) {
          return {
            type: 'warning',
            content: `Dividend Discount Model for ${profile.companyName} (${ticker.toUpperCase()})\n\n⚠️ NO DIVIDEND ANALYSIS:\n• Current Dividend: $0.00\n• Dividend Yield: 0.00%\n• Company does not pay dividends\n\n💡 ALTERNATIVE VALUATION METHODS:\n• Consider using DCF(${ticker.toUpperCase()}) for non-dividend paying stocks\n• Growth companies often reinvest earnings rather than pay dividends\n• Use COMP(${ticker.toUpperCase()}) for relative valuation\n\n📊 COMPANY METRICS:\n• Current Price: ${formatCurrency(profile.price)}\n• Market Cap: ${formatCurrency(profile.mktCap, 'USD', true)}\n• P/E Ratio: ${formatNumber(profile.pe, 1)}x\n• Beta: ${formatNumber(profile.beta, 2)}`
          };
        }

        // Gordon Growth Model
        const gordonValue =
          (currentDividend * (1 + dividendGrowthRate)) / (requiredReturn - dividendGrowthRate);

        // Two-stage DDM
        const highGrowthYears = 5;
        const highGrowthRate = dividendGrowthRate * 1.5;
        const terminalGrowthRate = 0.03;

        let presentValueHighGrowth = 0;
        for (let year = 1; year <= highGrowthYears; year++) {
          const dividend = currentDividend * Math.pow(1 + highGrowthRate, year);
          const presentValue = dividend / Math.pow(1 + requiredReturn, year);
          presentValueHighGrowth += presentValue;
        }

        const terminalDividend =
          currentDividend *
          Math.pow(1 + highGrowthRate, highGrowthYears) *
          (1 + terminalGrowthRate);
        const terminalValue = terminalDividend / (requiredReturn - terminalGrowthRate);
        const presentValueTerminal = terminalValue / Math.pow(1 + requiredReturn, highGrowthYears);

        const twoStageValue = presentValueHighGrowth + presentValueTerminal;

        // Calculate upside/downside
        const gordonUpside = ((gordonValue - profile.price) / profile.price) * 100;
        const twoStageUpside = ((twoStageValue - profile.price) / profile.price) * 100;

        const content = `Dividend Discount Model for ${profile.companyName} (${ticker.toUpperCase()})\n\n💰 DIVIDEND INFORMATION:\n• Current Annual Dividend: ${formatCurrency(currentDividend)}\n• Dividend Yield: ${formatPercentage(profile.dividendYield)}\n• Estimated Growth Rate: ${formatPercentage(dividendGrowthRate)}\n• Required Return (CAPM): ${formatPercentage(requiredReturn)}\n\n📊 GORDON GROWTH MODEL:\n• Fair Value: ${formatCurrency(gordonValue)}\n• Current Price: ${formatCurrency(profile.price)}\n• Upside/(Downside): ${formatPercentage(gordonUpside / 100)}\n\n📈 TWO-STAGE DDM:\n• High Growth Period: ${highGrowthYears} years at ${formatPercentage(highGrowthRate)}\n• Terminal Growth: ${formatPercentage(terminalGrowthRate)}\n• PV of High Growth Dividends: ${formatCurrency(presentValueHighGrowth)}\n• PV of Terminal Value: ${formatCurrency(presentValueTerminal)}\n• Total Fair Value: ${formatCurrency(twoStageValue)}\n• Upside/(Downside): ${formatPercentage(twoStageUpside / 100)}\n\n🎯 VALUATION SUMMARY:\n• Gordon Model: ${gordonUpside > 0 ? 'Undervalued' : 'Overvalued'} by ${formatPercentage(Math.abs(gordonUpside) / 100)}\n• Two-Stage Model: ${twoStageUpside > 0 ? 'Undervalued' : 'Overvalued'} by ${formatPercentage(Math.abs(twoStageUpside) / 100)}\n• Average Fair Value: ${formatCurrency((gordonValue + twoStageValue) / 2)}\n\n⚠️ KEY ASSUMPTIONS:\n• Dividend growth rates are estimates\n• Required return based on CAPM\n• Terminal growth rate of ${formatPercentage(terminalGrowthRate)} assumed\n• Model assumes dividends grow in perpetuity\n\n${dataFetchingService.demoMode ? '💡 Note: Using estimated data. Configure API keys for live analysis.' : '✅ Analysis based on live market data'}`;

        return {
          type: 'success',
          content,
          data: {
            analysis: 'ddm',
            ticker: ticker.toUpperCase(),
            results: {
              currentDividend,
              gordonValue,
              twoStageValue,
              gordonUpside,
              twoStageUpside,
              requiredReturn,
              dividendGrowthRate
            }
          }
        };
      } catch (error) {
        return {
          type: 'error',
          content: `DDM analysis failed: ${error.message}`
        };
      }
    },
    parameterSchema: {
      required: ['ticker'],
      optional: []
    }
  },

  RESIDUAL_INCOME: {
    execute: async (parsedCommand, _context, _processor) => {
      const [ticker] = parsedCommand.parameters;

      if (!ticker) {
        return {
          type: 'error',
          content: 'RESIDUAL_INCOME command requires a ticker symbol. Usage: RESIDUAL_INCOME(AAPL)'
        };
      }

      try {
        const profile = await dataFetchingService.fetchCompanyProfile(ticker.toUpperCase());
        const _financials = await dataFetchingService.fetchFinancialStatements(
          ticker.toUpperCase(),
          'income-statement'
        );

        // Residual Income calculations
        const bookValue = profile.bookValue || profile.mktCap / 2; // Fallback estimate
        const roe = profile.returnOnEquityTTM || 0.15; // Fallback 15%
        const costOfEquity = (profile.beta || 1.0) * 0.06 + 0.03; // CAPM
        const netIncome = _financials[0]?.netIncome || profile.mktCap * 0.08; // Fallback estimate

        // Calculate residual income
        const normalIncome = bookValue * costOfEquity;
        const residualIncome = netIncome - normalIncome;

        // Project residual income for 5 years
        const projectionYears = 5;
        const residualIncomeGrowth = Math.max(-0.05, Math.min(0.1, roe - costOfEquity)); // Fade to zero

        let totalPVResidualIncome = 0;
        const projections = [];

        for (let year = 1; year <= projectionYears; year++) {
          const projectedRI =
            residualIncome * Math.pow(1 + residualIncomeGrowth * (1 - year * 0.15), year);
          const presentValue = projectedRI / Math.pow(1 + costOfEquity, year);
          totalPVResidualIncome += presentValue;

          projections.push({
            year,
            residualIncome: projectedRI,
            presentValue
          });
        }

        // Terminal value (assume residual income fades to zero)
        const terminalRI = projections[projectionYears - 1].residualIncome * 0.5;
        const terminalValue = terminalRI / costOfEquity;
        const pvTerminalValue = terminalValue / Math.pow(1 + costOfEquity, projectionYears);

        // Calculate intrinsic value
        const intrinsicValue = bookValue + totalPVResidualIncome + pvTerminalValue;
        const valuePerShare =
          intrinsicValue / (profile.sharesOutstanding || profile.mktCap / profile.price);
        const upside = ((valuePerShare - profile.price) / profile.price) * 100;

        const content = `Residual Income Model for ${profile.companyName} (${ticker.toUpperCase()})\n\n📊 BASE METRICS:\n• Book Value: ${formatCurrency(bookValue, 'USD', true)}\n• ROE: ${formatPercentage(roe)}\n• Cost of Equity: ${formatPercentage(costOfEquity)}\n• Net Income: ${formatCurrency(netIncome, 'USD', true)}\n\n💰 RESIDUAL INCOME ANALYSIS:\n• Normal Income: ${formatCurrency(normalIncome, 'USD', true)}\n• Current Residual Income: ${formatCurrency(residualIncome, 'USD', true)}\n• RI Growth Rate: ${formatPercentage(residualIncomeGrowth)}\n\n📈 5-YEAR PROJECTIONS:\n${projections
          .map(
            p =>
              `Year ${p.year}: RI ${formatCurrency(p.residualIncome, 'USD', true)}, PV ${formatCurrency(p.presentValue, 'USD', true)}`
          )
          .join(
            '\n'
          )}\n\n🎯 VALUATION RESULTS:\n• Book Value: ${formatCurrency(bookValue, 'USD', true)}\n• PV of Residual Income: ${formatCurrency(totalPVResidualIncome, 'USD', true)}\n• PV of Terminal Value: ${formatCurrency(pvTerminalValue, 'USD', true)}\n• Total Intrinsic Value: ${formatCurrency(intrinsicValue, 'USD', true)}\n• Value Per Share: ${formatCurrency(valuePerShare)}\n• Current Price: ${formatCurrency(profile.price)}\n• Upside/(Downside): ${formatPercentage(upside / 100)}\n\n📊 KEY INSIGHTS:\n• ${residualIncome > 0 ? 'Company generates positive economic value' : 'Company destroys economic value'}\n• ROE vs Cost of Equity: ${roe > costOfEquity ? 'Value Creating' : 'Value Destroying'}\n• ${upside > 0 ? 'Undervalued' : 'Overvalued'} by ${formatPercentage(Math.abs(upside) / 100)}\n\n⚠️ MODEL ASSUMPTIONS:\n• Residual income growth fades over time\n• Terminal value assumes sustainable competitive advantage\n• Cost of equity based on CAPM\n\n${dataFetchingService.demoMode ? '💡 Note: Using estimated data. Configure API keys for live analysis.' : '✅ Analysis based on live market data'}`;

        return {
          type: 'success',
          content,
          data: {
            analysis: 'residual_income',
            ticker: ticker.toUpperCase(),
            results: {
              bookValue,
              residualIncome,
              intrinsicValue,
              valuePerShare,
              upside,
              projections
            }
          }
        };
      } catch (error) {
        return {
          type: 'error',
          content: `Residual income analysis failed: ${error.message}`
        };
      }
    },
    parameterSchema: {
      required: ['ticker'],
      optional: []
    }
  },

  ASSET_BASED: {
    execute: async (parsedCommand, _context, _processor) => {
      const [ticker] = parsedCommand.parameters;

      if (!ticker) {
        return {
          type: 'error',
          content: 'ASSET_BASED command requires a ticker symbol. Usage: ASSET_BASED(AAPL)'
        };
      }

      try {
        const profile = await dataFetchingService.fetchCompanyProfile(ticker.toUpperCase());
        const balanceSheet = await dataFetchingService.fetchFinancialStatements(
          ticker.toUpperCase(),
          'balance-sheet-statement'
        );

        // Asset-based valuation
        const totalAssets = balanceSheet[0]?.totalAssets || profile.mktCap * 1.5; // Fallback
        const totalLiabilities =
          balanceSheet[0]?.totalLiabilities || profile.totalDebt || totalAssets * 0.4;
        const bookValue = totalAssets - totalLiabilities;

        // Adjust assets to market value
        const cashAndEquivalents =
          balanceSheet[0]?.cashAndCashEquivalents || profile.totalCash || totalAssets * 0.1;
        const inventory = balanceSheet[0]?.inventory || totalAssets * 0.15;
        const ppe = balanceSheet[0]?.propertyPlantEquipmentNet || totalAssets * 0.3;
        const intangibleAssets = balanceSheet[0]?.intangibleAssets || totalAssets * 0.2;
        const otherAssets = totalAssets - cashAndEquivalents - inventory - ppe - intangibleAssets;

        // Apply market value adjustments
        const adjustments = {
          cash: { book: cashAndEquivalents, market: cashAndEquivalents, adjustment: 1.0 },
          inventory: { book: inventory, market: inventory * 0.8, adjustment: 0.8 }, // 20% discount
          ppe: { book: ppe, market: ppe * 1.2, adjustment: 1.2 }, // 20% premium for real estate
          intangibles: { book: intangibleAssets, market: intangibleAssets * 0.5, adjustment: 0.5 }, // 50% discount
          other: { book: otherAssets, market: otherAssets * 0.9, adjustment: 0.9 }
        };

        const totalMarketAssets = Object.values(adjustments).reduce(
          (sum, adj) => sum + adj.market,
          0
        );
        const netAssetValue = totalMarketAssets - totalLiabilities;
        const navPerShare =
          netAssetValue / (profile.sharesOutstanding || profile.mktCap / profile.price);
        const upside = ((navPerShare - profile.price) / profile.price) * 100;

        // Liquidation value (more conservative)
        const liquidationValue = totalMarketAssets * 0.7 - totalLiabilities; // 30% liquidation discount
        const liquidationPerShare =
          liquidationValue / (profile.sharesOutstanding || profile.mktCap / profile.price);

        const content = `Asset-Based Valuation for ${profile.companyName} (${ticker.toUpperCase()})\n\n📊 BALANCE SHEET SUMMARY:\n• Total Assets: ${formatCurrency(totalAssets, 'USD', true)}\n• Total Liabilities: ${formatCurrency(totalLiabilities, 'USD', true)}\n• Book Value: ${formatCurrency(bookValue, 'USD', true)}\n\n💰 ASSET BREAKDOWN & ADJUSTMENTS:\n• Cash & Equivalents: ${formatCurrency(adjustments.cash.book, 'USD', true)} → ${formatCurrency(adjustments.cash.market, 'USD', true)} (${formatPercentage(adjustments.cash.adjustment - 1)})\n• Inventory: ${formatCurrency(adjustments.inventory.book, 'USD', true)} → ${formatCurrency(adjustments.inventory.market, 'USD', true)} (${formatPercentage(adjustments.inventory.adjustment - 1)})\n• PP&E: ${formatCurrency(adjustments.ppe.book, 'USD', true)} → ${formatCurrency(adjustments.ppe.market, 'USD', true)} (${formatPercentage(adjustments.ppe.adjustment - 1)})\n• Intangibles: ${formatCurrency(adjustments.intangibles.book, 'USD', true)} → ${formatCurrency(adjustments.intangibles.market, 'USD', true)} (${formatPercentage(adjustments.intangibles.adjustment - 1)})\n• Other Assets: ${formatCurrency(adjustments.other.book, 'USD', true)} → ${formatCurrency(adjustments.other.market, 'USD', true)} (${formatPercentage(adjustments.other.adjustment - 1)})\n\n🎯 VALUATION RESULTS:\n• Adjusted Asset Value: ${formatCurrency(totalMarketAssets, 'USD', true)}\n• Net Asset Value: ${formatCurrency(netAssetValue, 'USD', true)}\n• NAV Per Share: ${formatCurrency(navPerShare)}\n• Current Price: ${formatCurrency(profile.price)}\n• Upside/(Downside): ${formatPercentage(upside / 100)}\n\n🔥 LIQUIDATION ANALYSIS:\n• Liquidation Value: ${formatCurrency(liquidationValue, 'USD', true)}\n• Liquidation Per Share: ${formatCurrency(liquidationPerShare)}\n• Liquidation Premium: ${formatPercentage(liquidationPerShare / profile.price - 1)}\n\n📈 ASSET EFFICIENCY:\n• Asset Turnover: ${formatNumber(profile.revenue / totalAssets, 2)}x\n• Book Value Multiple: ${formatNumber(profile.price / (bookValue / (profile.sharesOutstanding || profile.mktCap / profile.price)), 2)}x\n• Tangible Book Multiple: ${formatNumber(profile.pb, 2)}x\n\n💡 INSIGHTS:\n• ${upside > 0 ? 'Trading below asset value - potential value opportunity' : 'Trading above asset value - premium for intangibles/growth'}\n• Asset-based valuation most relevant for asset-heavy businesses\n• Consider liquidation value as downside protection\n\n${dataFetchingService.demoMode ? '💡 Note: Using estimated data. Configure API keys for live analysis.' : '✅ Analysis based on live market data'}`;

        return {
          type: 'success',
          content,
          data: {
            analysis: 'asset_based',
            ticker: ticker.toUpperCase(),
            results: {
              totalAssets,
              netAssetValue,
              navPerShare,
              liquidationValue,
              liquidationPerShare,
              upside,
              adjustments
            }
          }
        };
      } catch (error) {
        return {
          type: 'error',
          content: `Asset-based valuation failed: ${error.message}`
        };
      }
    },
    parameterSchema: {
      required: ['ticker'],
      optional: []
    }
  }
};
