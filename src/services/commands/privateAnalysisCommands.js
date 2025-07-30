/**
 * Private Analysis Commands
 * CLI integration for the Private Analysis financial modeling features
 */

import defaultFinancialData from '../../data/defaultFinancialData.js';
import { 
  formatCurrency,
  formatPercentage,
  formatNumber
} from '../../utils/dataTransformation.js';

export const privateAnalysisCommands = {
  PRIVATE_DCF: {
    execute: async (parsedCommand, context, processor) => {
      try {
        const loadingMessage = `🔄 Running DCF analysis on private company data...\n• Loading financial statements\n• Calculating free cash flows\n• Computing terminal value\n• Analyzing projections...\n✅ Using private financial data`;
        
        if (context.showLoading) {
          context.showLoading(loadingMessage);
        }

        const data = defaultFinancialData;
        const periods = data.periods;
        const statements = data.statements.incomeStatement;

        // Calculate key metrics from the financial data
        const revenues = [];
        const operatingIncomes = [];
        const margins = [];

        periods.forEach((period, index) => {
          const revenue = statements.totalRevenue?.[index] || 0;
          const operatingIncome = statements.operatingIncome?.[index] || 0;
          
          revenues.push(revenue);
          operatingIncomes.push(operatingIncome);
          margins.push(revenue ? (operatingIncome / revenue) * 100 : 0);
        });

        // DCF assumptions (these could be parameterized)
        const assumptions = {
          discountRate: 12.0,
          terminalGrowthRate: 2.5,
          projectionYears: 5,
          taxRate: 25.0
        };

        // Simple DCF calculation
        const latestRevenue = revenues[revenues.length - 1];
        const latestOperatingIncome = operatingIncomes[operatingIncomes.length - 1];
        const revenueGrowthRate = revenues.length > 1 ? 
          ((revenues[revenues.length - 1] / revenues[revenues.length - 2]) - 1) * 100 : 15;

        // Project future cash flows
        const projections = [];
        let projectedRevenue = latestRevenue;
        
        for (let i = 1; i <= assumptions.projectionYears; i++) {
          projectedRevenue *= (1 + revenueGrowthRate / 100);
          const projectedOperatingIncome = projectedRevenue * (margins[margins.length - 1] / 100);
          const projectedFCF = projectedOperatingIncome * (1 - assumptions.taxRate / 100);
          
          projections.push({
            year: i,
            revenue: projectedRevenue,
            operatingIncome: projectedOperatingIncome,
            fcf: projectedFCF,
            presentValue: projectedFCF / Math.pow(1 + assumptions.discountRate / 100, i)
          });
        }

        const totalPresentValue = projections.reduce((sum, proj) => sum + proj.presentValue, 0);
        const terminalValue = (projections[projections.length - 1].fcf * (1 + assumptions.terminalGrowthRate / 100)) 
          / ((assumptions.discountRate - assumptions.terminalGrowthRate) / 100);
        const terminalPresentValue = terminalValue / Math.pow(1 + assumptions.discountRate / 100, assumptions.projectionYears);
        const enterpriseValue = totalPresentValue + terminalPresentValue;

        const content = `Private Company DCF Valuation Analysis\n\n📊 HISTORICAL PERFORMANCE:\n${periods.map((period, i) => `• ${period}: Revenue ${formatCurrency(revenues[i], 'USD', true)}, Operating Income ${formatCurrency(operatingIncomes[i], 'USD', true)} (${formatPercentage(margins[i] / 100)})`).join('\n')}\n\n💰 DCF VALUATION RESULTS:\n• Enterprise Value: ${formatCurrency(enterpriseValue, 'USD', true)}\n• Terminal Value: ${formatCurrency(terminalValue, 'USD', true)} (${formatPercentage(terminalPresentValue / enterpriseValue)})\n• PV of Projections: ${formatCurrency(totalPresentValue, 'USD', true)} (${formatPercentage(totalPresentValue / enterpriseValue)})\n\n📈 KEY ASSUMPTIONS:\n• Discount Rate: ${formatPercentage(assumptions.discountRate / 100)}\n• Terminal Growth: ${formatPercentage(assumptions.terminalGrowthRate / 100)}\n• Revenue Growth: ${formatPercentage(revenueGrowthRate / 100)}\n• Tax Rate: ${formatPercentage(assumptions.taxRate / 100)}\n\n🎯 5-YEAR PROJECTIONS:\n${projections.map(proj => `Year ${proj.year}: Revenue ${formatCurrency(proj.revenue, 'USD', true)}, FCF ${formatCurrency(proj.fcf, 'USD', true)}, PV ${formatCurrency(proj.presentValue, 'USD', true)}`).join('\n')}\n\n✅ Analysis based on private financial data`;

        return {
          type: 'success',
          content,
          data: {
            analysis: 'private_dcf',
            enterpriseValue,
            terminalValue,
            projections,
            assumptions
          }
        };

      } catch (error) {
        return {
          type: 'error',
          content: `Private DCF analysis failed: ${error.message}`
        };
      }
    },
    parameterSchema: {
      required: [],
      optional: ['discountRate', 'terminalGrowthRate', 'taxRate']
    }
  },

  PRIVATE_RATIOS: {
    execute: async (parsedCommand, context, processor) => {
      try {
        const data = defaultFinancialData;
        const periods = data.periods;
        const statements = data.statements.incomeStatement;

        // Calculate financial ratios
        const ratios = [];
        periods.forEach((period, index) => {
          const revenue = statements.totalRevenue?.[index] || 0;
          const totalCOGS = statements.totalCostOfGoodsSold?.[index] || 0;
          const grossProfit = statements.grossProfit?.[index] || 0;
          const operatingIncome = statements.operatingIncome?.[index] || 0;
          const netIncome = statements.netIncome?.[index] || 0;

          ratios.push({
            period,
            grossMargin: revenue ? (grossProfit / revenue) * 100 : 0,
            operatingMargin: revenue ? (operatingIncome / revenue) * 100 : 0,
            netMargin: revenue ? (netIncome / revenue) * 100 : 0,
            cogsPercentage: revenue ? (totalCOGS / revenue) * 100 : 0
          });
        });

        // Calculate growth rates
        const growthRates = [];
        for (let i = 1; i < periods.length; i++) {
          const currentRevenue = statements.totalRevenue?.[i] || 0;
          const previousRevenue = statements.totalRevenue?.[i-1] || 0;
          const currentOperating = statements.operatingIncome?.[i] || 0;
          const previousOperating = statements.operatingIncome?.[i-1] || 0;

          growthRates.push({
            period: periods[i],
            revenueGrowth: previousRevenue ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0,
            operatingGrowth: previousOperating && Math.abs(previousOperating) > 0.01 ? 
              ((currentOperating - previousOperating) / Math.abs(previousOperating)) * 100 : 0
          });
        }

        const content = `Private Company Financial Ratios Analysis\n\n📊 PROFITABILITY RATIOS:\n${ratios.map(ratio => `• ${ratio.period}:\n  - Gross Margin: ${formatPercentage(ratio.grossMargin / 100)}\n  - Operating Margin: ${formatPercentage(ratio.operatingMargin / 100)}\n  - Net Margin: ${formatPercentage(ratio.netMargin / 100)}\n  - COGS %: ${formatPercentage(ratio.cogsPercentage / 100)}`).join('\n\n')}\n\n📈 GROWTH ANALYSIS:\n${growthRates.map(growth => `• ${growth.period}:\n  - Revenue Growth: ${formatPercentage(growth.revenueGrowth / 100)}\n  - Operating Growth: ${formatPercentage(growth.operatingGrowth / 100)}`).join('\n\n')}\n\n🎯 KEY INSIGHTS:\n• Latest Gross Margin: ${formatPercentage(ratios[ratios.length - 1].grossMargin / 100)}\n• Latest Operating Margin: ${formatPercentage(ratios[ratios.length - 1].operatingMargin / 100)}\n• Average Revenue Growth: ${formatPercentage(growthRates.reduce((sum, g) => sum + g.revenueGrowth, 0) / growthRates.length / 100)}\n\n✅ Analysis based on private financial data`;

        return {
          type: 'success',
          content,
          data: {
            analysis: 'private_ratios',
            ratios,
            growthRates
          }
        };

      } catch (error) {
        return {
          type: 'error',
          content: `Private ratios analysis failed: ${error.message}`
        };
      }
    },
    parameterSchema: {
      required: [],
      optional: []
    }
  },

  PRIVATE_SUMMARY: {
    execute: async (parsedCommand, context, processor) => {
      try {
        const data = defaultFinancialData;
        const periods = data.periods;
        const statements = data.statements.incomeStatement;

        // Get latest period data
        const latestIndex = periods.length - 1;
        const latest = {
          period: periods[latestIndex],
          revenue: statements.totalRevenue?.[latestIndex] || 0,
          grossProfit: statements.grossProfit?.[latestIndex] || 0,
          operatingIncome: statements.operatingIncome?.[latestIndex] || 0,
          netIncome: statements.netIncome?.[latestIndex] || 0,
          totalCOGS: statements.totalCostOfGoodsSold?.[latestIndex] || 0
        };

        // Calculate key metrics
        const grossMargin = latest.revenue ? (latest.grossProfit / latest.revenue) * 100 : 0;
        const operatingMargin = latest.revenue ? (latest.operatingIncome / latest.revenue) * 100 : 0;
        const netMargin = latest.revenue ? (latest.netIncome / latest.revenue) * 100 : 0;

        // Revenue breakdown (top revenue streams)
        const revenueBreakdown = [
          { name: 'Injectables', value: statements.injectables?.[latestIndex] || 0 },
          { name: 'Surgery', value: statements.surgery?.[latestIndex] || 0 },
          { name: 'Wellness', value: statements.wellness?.[latestIndex] || 0 },
          { name: 'Weightloss', value: statements.weightloss?.[latestIndex] || 0 },
          { name: 'Retail Sales', value: statements.retailSales?.[latestIndex] || 0 },
          { name: 'Energy Devices', value: statements.energyDevices?.[latestIndex] || 0 }
        ].sort((a, b) => b.value - a.value);

        const content = `Private Company Financial Summary (${latest.period})\n\n🏢 COMPANY OVERVIEW:\n• Period: ${latest.period}\n• Total Revenue: ${formatCurrency(latest.revenue, 'USD', true)}\n• Operating Status: ${latest.operatingIncome >= 0 ? '✅ Profitable' : '⚠️ Operating Loss'}\n\n💰 FINANCIAL PERFORMANCE:\n• Gross Profit: ${formatCurrency(latest.grossProfit, 'USD', true)} (${formatPercentage(grossMargin / 100)})\n• Operating Income: ${formatCurrency(latest.operatingIncome, 'USD', true)} (${formatPercentage(operatingMargin / 100)})\n• Net Income: ${formatCurrency(latest.netIncome, 'USD', true)} (${formatPercentage(netMargin / 100)})\n• Cost of Goods Sold: ${formatCurrency(latest.totalCOGS, 'USD', true)}\n\n📊 REVENUE BREAKDOWN:\n${revenueBreakdown.map((item, i) => `${i + 1}. ${item.name}: ${formatCurrency(item.value, 'USD', true)} (${formatPercentage(item.value / latest.revenue)})`).join('\n')}\n\n📈 HISTORICAL TRENDS:\n${periods.map((period, i) => `• ${period}: ${formatCurrency(statements.totalRevenue?.[i] || 0, 'USD', true)}`).join('\n')}\n\n🎯 KEY METRICS:\n• Revenue Growth (YoY): ${periods.length > 1 ? formatPercentage(((statements.totalRevenue?.[latestIndex] || 0) / (statements.totalRevenue?.[latestIndex-1] || 1) - 1)) : 'N/A'}\n• Gross Margin Trend: ${grossMargin >= 70 ? '🟢 Strong' : grossMargin >= 50 ? '🟡 Moderate' : '🔴 Low'}\n• Operating Efficiency: ${operatingMargin >= 15 ? '🟢 Excellent' : operatingMargin >= 5 ? '🟡 Fair' : operatingMargin >= 0 ? '🟠 Break-even' : '🔴 Loss'}\n\n✅ Analysis based on private financial data`;

        return {
          type: 'success',
          content,
          data: {
            analysis: 'private_summary',
            latest,
            revenueBreakdown,
            margins: { grossMargin, operatingMargin, netMargin }
          }
        };

      } catch (error) {
        return {
          type: 'error',
          content: `Private summary analysis failed: ${error.message}`
        };
      }
    },
    parameterSchema: {
      required: [],
      optional: []
    }
  },

  PRIVATE_LOAD: {
    execute: async (parsedCommand, context, processor) => {
      try {
        const data = defaultFinancialData;
        
        const content = `Private Financial Data Loaded Successfully\n\n📁 DATA OVERVIEW:\n• Periods: ${data.periods.join(', ')}\n• Income Statement: ✅ Loaded\n• Balance Sheet: ${Object.keys(data.statements.balanceSheet).length > 0 ? '✅ Available' : '⚠️ Empty'}\n• Cash Flow: ${Object.keys(data.statements.cashFlow).length > 0 ? '✅ Available' : '⚠️ Empty'}\n\n📊 AVAILABLE DATA:\n• Revenue Categories: ${Object.keys(data.statements.incomeStatement).filter(key => key.includes('Revenue') || ['energyDevices', 'injectables', 'wellness', 'weightloss', 'retailSales', 'surgery'].includes(key)).length}\n• Expense Categories: ${Object.keys(data.statements.incomeStatement).filter(key => key.includes('Cogs') || key.includes('Expense') || ['marketing', 'automobile', 'rent', 'insurance'].includes(key)).length}\n• Financial Metrics: ${Object.keys(data.statements.incomeStatement).filter(key => ['grossProfit', 'operatingIncome', 'netIncome'].includes(key)).length}\n\n💡 AVAILABLE COMMANDS:\n• PRIVATE_DCF() - Run DCF valuation\n• PRIVATE_RATIOS() - Calculate financial ratios\n• PRIVATE_SUMMARY() - Get company overview\n• PRIVATE_SCENARIO() - Run scenario analysis\n\n✅ Ready for private company analysis`;

        return {
          type: 'success',
          content,
          data: {
            analysis: 'private_load',
            dataStructure: {
              periods: data.periods.length,
              incomeStatementItems: Object.keys(data.statements.incomeStatement).length,
              balanceSheetItems: Object.keys(data.statements.balanceSheet).length,
              cashFlowItems: Object.keys(data.statements.cashFlow).length
            }
          }
        };

      } catch (error) {
        return {
          type: 'error',
          content: `Failed to load private data: ${error.message}`
        };
      }
    },
    parameterSchema: {
      required: [],
      optional: []
    }
  }
};
