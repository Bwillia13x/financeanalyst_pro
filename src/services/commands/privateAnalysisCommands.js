/**
 * Private Analysis Commands
 * CLI integration for the Private Analysis financial modeling features
 */

import defaultFinancialData from '../../data/defaultFinancialData.js';
import { formatCurrency, formatPercentage, formatNumber } from '../../utils/dataTransformation.js';

// Helper functions for risk and quality analysis
const calculateVolatility = values => {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
  return (Math.sqrt(variance) / mean) * 100;
};

const assessGrowthSustainability = revenues => {
  const growthRates = [];
  for (let i = 1; i < revenues.length; i++) {
    if (revenues[i - 1] > 0) growthRates.push((revenues[i] / revenues[i - 1] - 1) * 100);
  }
  if (growthRates.length === 0) return '📊 Insufficient Data';
  const avgGrowth = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
  return avgGrowth > 10 ? '✅ Strong' : avgGrowth > 0 ? '📈 Moderate' : '📉 Weak';
};

const assessCashFlowTrend = cashFlows => {
  if (cashFlows.length < 2) return 'Insufficient data';
  const fcfs = cashFlows.map(cf => cf.freeCashFlow);
  const isIncreasing = fcfs.every((fcf, i) => i === 0 || fcf >= fcfs[i - 1]);
  const isDecreasing = fcfs.every((fcf, i) => i === 0 || fcf <= fcfs[i - 1]);
  return isIncreasing ? '📈 Improving' : isDecreasing ? '📉 Declining' : '📊 Variable';
};

const calculateOperatingLeverage = cashFlows => {
  if (cashFlows.length < 2) return 'N/A';
  const revenueGrowth = (cashFlows[cashFlows.length - 1].revenue / cashFlows[0].revenue - 1) * 100;
  const fcfGrowth =
    (cashFlows[cashFlows.length - 1].freeCashFlow / cashFlows[0].freeCashFlow - 1) * 100;
  const leverage = revenueGrowth !== 0 ? fcfGrowth / revenueGrowth : 0;
  return leverage > 1 ? '🟢 High' : leverage > 0.5 ? '🟡 Moderate' : '🔴 Low';
};

// Quality assessment helper functions
const calculateGrowthConsistency = revenues => {
  if (revenues.length < 3) return 50;
  const growthRates = [];
  for (let i = 1; i < revenues.length; i++) {
    if (revenues[i - 1] > 0) growthRates.push((revenues[i] / revenues[i - 1] - 1) * 100);
  }
  const avgGrowth = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
  const volatility = Math.sqrt(
    growthRates.reduce((sum, rate) => sum + Math.pow(rate - avgGrowth, 2), 0) /
      (growthRates.length - 1)
  );
  return Math.max(0, Math.min(100, 80 - volatility * 2));
};

const estimateRecurringRevenue = (statements, latestIndex) => {
  const injectables = statements.injectables?.[latestIndex] || 0;
  const wellness = statements.wellness?.[latestIndex] || 0;
  const totalRevenue = statements.totalRevenue?.[latestIndex] || 0;
  const recurringPortion = totalRevenue > 0 ? (injectables + wellness) / totalRevenue : 0;
  return Math.min(100, recurringPortion * 100 + 20);
};

const calculateMarginStability = margins => {
  if (margins.length < 2) return 50;
  const avgMargin = margins.reduce((sum, margin) => sum + margin, 0) / margins.length;
  const volatility = Math.sqrt(
    margins.reduce((sum, margin) => sum + Math.pow(margin - avgMargin, 2), 0) / (margins.length - 1)
  );
  return Math.max(0, Math.min(100, 90 - volatility * 5));
};

const calculateProfitabilityTrend = margins => {
  if (margins.length < 2) return 50;
  const trend = (margins[margins.length - 1] - margins[0]) / margins.length;
  return Math.max(0, Math.min(100, 60 + trend * 10));
};

const assessMarketPosition = _data => {
  return 75; // Moderate market position
};

const assessScalability = revenues => {
  const growthRate =
    revenues.length > 1
      ? ((revenues[revenues.length - 1] / revenues[0] - 1) * 100) / (revenues.length - 1)
      : 0;
  return Math.min(100, Math.max(0, 50 + growthRate * 2));
};

const identifyStrengths = metrics => {
  return (
    metrics
      .filter(m => m.score >= 80)
      .map(m => `• ${m.metric}: Strong performance`)
      .join('\n') || '• Need to improve overall performance'
  );
};

const identifyWeaknesses = metrics => {
  return (
    metrics
      .filter(m => m.score < 70)
      .map(m => `• ${m.metric}: Below target performance`)
      .join('\n') || '• No major weaknesses identified'
  );
};

// Workflow helper functions
const estimateStepTime = step => {
  const timeMap = {
    'Data Quality': '2-3 minutes',
    'Company Overview': '3-5 minutes',
    'Financial Analysis': '5-8 minutes',
    'Valuation Models': '8-12 minutes',
    'Risk Assessment': '5-7 minutes',
    Benchmarking: '4-6 minutes',
    'Advanced Models': '10-15 minutes',
    'Final Report': '2-3 minutes'
  };
  return timeMap[step] || '5 minutes';
};

const assessDataCompleteness = data => {
  const totalFields = 50;
  const presentFields =
    Object.keys(data.statements.incomeStatement).length +
    Object.keys(data.statements.balanceSheet).length +
    Object.keys(data.statements.cashFlow).length;
  return Math.min(100, (presentFields / totalFields) * 100);
};

const assessAnalysisDepth = steps => {
  const completedSteps = steps.filter(s => s.completed).length;
  if (completedSteps >= 6) return 'Comprehensive';
  if (completedSteps >= 4) return 'Detailed';
  if (completedSteps >= 2) return 'Basic';
  return 'Initial';
};

// Dashboard helper functions
const calculatePerformanceScore = metrics => {
  let score = 0;
  score += Math.min(25, Math.max(0, 15 + metrics.revenueGrowth));
  score += Math.min(25, metrics.grossMargin * 0.5);
  score += Math.min(30, metrics.operatingMargin * 2);
  score += Math.min(20, metrics.ebitdaMargin * 1.2);
  return Math.round(score);
};

const getGrowthIcon = growth =>
  growth >= 15 ? '🚀' : growth >= 5 ? '📈' : growth >= 0 ? '➡️' : '📉';

const getMarginIcon = (margin, type) => {
  const thresholds = {
    gross: { excellent: 70, good: 50, fair: 30 },
    operating: { excellent: 20, good: 10, fair: 5 },
    ebitda: { excellent: 25, good: 15, fair: 8 }
  };
  const t = thresholds[type];
  return margin >= t.excellent ? '🟢' : margin >= t.good ? '🟡' : margin >= t.fair ? '🟠' : '🔴';
};

const getPerformanceRating = score => {
  if (score >= 80) return '🏆 Excellent';
  if (score >= 70) return '🥇 Very Good';
  if (score >= 60) return '🥈 Good';
  if (score >= 50) return '🥉 Fair';
  return '📊 Needs Improvement';
};

export const privateAnalysisCommands = {
  PRIVATE_DCF: {
    execute: async (_parsedCommand, _context, _processor) => {
      try {
        const loadingMessage =
          '🔄 Running DCF analysis on private company data...\n• Loading financial statements\n• Calculating free cash flows\n• Computing terminal value\n• Analyzing projections...\n✅ Using private financial data';

        // Loading message would be shown by context if available
        console.log('DCF Analysis:', loadingMessage);

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
        // const latestOperatingIncome = operatingIncomes[operatingIncomes.length - 1];
        const revenueGrowthRate =
          revenues.length > 1
            ? (revenues[revenues.length - 1] / revenues[revenues.length - 2] - 1) * 100
            : 15;

        // Project future cash flows
        const projections = [];
        let projectedRevenue = latestRevenue;

        for (let i = 1; i <= assumptions.projectionYears; i++) {
          projectedRevenue *= 1 + revenueGrowthRate / 100;
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
        const terminalValue =
          (projections[projections.length - 1].fcf * (1 + assumptions.terminalGrowthRate / 100)) /
          ((assumptions.discountRate - assumptions.terminalGrowthRate) / 100);
        const terminalPresentValue =
          terminalValue / Math.pow(1 + assumptions.discountRate / 100, assumptions.projectionYears);
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
    execute: async (_parsedCommand, _context, _processor) => {
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
          const previousRevenue = statements.totalRevenue?.[i - 1] || 0;
          const currentOperating = statements.operatingIncome?.[i] || 0;
          const previousOperating = statements.operatingIncome?.[i - 1] || 0;

          growthRates.push({
            period: periods[i],
            revenueGrowth: previousRevenue
              ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
              : 0,
            operatingGrowth:
              previousOperating && Math.abs(previousOperating) > 0.01
                ? ((currentOperating - previousOperating) / Math.abs(previousOperating)) * 100
                : 0
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
    execute: async (_parsedCommand, _context, _processor) => {
      try {
        const data = defaultFinancialData;
        const periods = data.periods;
        const statements = data.statements.incomeStatement;

        // Get latest period data
        const latestIndex = statements.length - 1;
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
        const operatingMargin = latest.revenue
          ? (latest.operatingIncome / latest.revenue) * 100
          : 0;
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

        const content = `Private Company Financial Summary (${latest.period})\n\n🏢 COMPANY OVERVIEW:\n• Period: ${latest.period}\n• Total Revenue: ${formatCurrency(latest.revenue, 'USD', true)}\n• Operating Status: ${latest.operatingIncome >= 0 ? '✅ Profitable' : '⚠️ Operating Loss'}\n\n💰 FINANCIAL PERFORMANCE:\n• Gross Profit: ${formatCurrency(latest.grossProfit, 'USD', true)} (${formatPercentage(grossMargin / 100)})\n• Operating Income: ${formatCurrency(latest.operatingIncome, 'USD', true)} (${formatPercentage(operatingMargin / 100)})\n• Net Income: ${formatCurrency(latest.netIncome, 'USD', true)} (${formatPercentage(netMargin / 100)})\n• Cost of Goods Sold: ${formatCurrency(latest.totalCOGS, 'USD', true)}\n\n📊 REVENUE BREAKDOWN:\n${revenueBreakdown.map((item, i) => `${i + 1}. ${item.name}: ${formatCurrency(item.value, 'USD', true)} (${formatPercentage(item.value / latest.revenue)})`).join('\n')}\n\n📈 HISTORICAL TRENDS:\n${periods.map((period, i) => `• ${period}: ${formatCurrency(statements.totalRevenue?.[i] || 0, 'USD', true)}`).join('\n')}\n\n🎯 KEY METRICS:\n• Revenue Growth (YoY): ${periods.length > 1 ? formatPercentage((statements.totalRevenue?.[latestIndex] || 0) / (statements.totalRevenue?.[latestIndex - 1] || 1) - 1) : 'N/A'}\n• Gross Margin Trend: ${grossMargin >= 70 ? '🟢 Strong' : grossMargin >= 50 ? '🟡 Moderate' : '🔴 Low'}\n• Operating Efficiency: ${operatingMargin >= 15 ? '🟢 Excellent' : operatingMargin >= 5 ? '🟡 Fair' : operatingMargin >= 0 ? '🟠 Break-even' : '🔴 Loss'}\n\n✅ Analysis based on private financial data`;

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
    execute: async (_parsedCommand, _context, _processor) => {
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
        return { type: 'error', content: `Failed to load private data: ${error.message}` };
      }
    },
    parameterSchema: {
      required: [],
      optional: []
    }
  },

  PRIVATE_MONTE_CARLO: {
    execute: async (_parsedCommand, _context, _processor) => {
      try {
        const data = defaultFinancialData;
        const statements = data.statements.incomeStatement;
        const latestPeriod = data.periods.length - 1;
        const baseRevenue = statements.totalRevenue?.[latestPeriod] || 0;
        const baseOperatingIncome = statements.operatingIncome?.[latestPeriod] || 0;

        // Run Monte Carlo simulation
        const simulations = 10000;
        const results = [];

        for (let i = 0; i < simulations; i++) {
          const revenueGrowth = Math.random() * 0.3 + 0.85;
          const marginChange = Math.random() * 0.2 + 0.9;
          const projectedRevenue = baseRevenue * revenueGrowth;
          const projectedOperatingIncome = baseOperatingIncome * marginChange;
          const valuation = projectedOperatingIncome * 8;
          results.push({ valuation, revenue: projectedRevenue });
        }

        const valuations = results.map(r => r.valuation).sort((a, b) => a - b);
        const p50 = valuations[Math.floor(valuations.length * 0.5)];
        const p25 = valuations[Math.floor(valuations.length * 0.25)];
        const p75 = valuations[Math.floor(valuations.length * 0.75)];

        const content = `Monte Carlo Simulation Results (${simulations.toLocaleString()} iterations)\n\n📊 VALUATION DISTRIBUTION:\n• P25: ${formatCurrency(p25)}\n• P50 (Median): ${formatCurrency(p50)}\n• P75: ${formatCurrency(p75)}\n• Range: ${formatCurrency(valuations[0])} - ${formatCurrency(valuations[valuations.length - 1])}\n\n🎯 RISK METRICS:\n• Downside Risk: ${formatPercentage(0.25)}\n• Upside Potential: ${formatPercentage(0.25)}\n• Expected Value: ${formatCurrency(p50)}`;

        return { type: 'success', content };
      } catch (error) {
        return { type: 'error', content: `Monte Carlo simulation failed: ${error.message}` };
      }
    },
    parameterSchema: { required: [], optional: ['iterations'] }
  },

  PRIVATE_SCENARIO: {
    execute: async (_parsedCommand, _context, _processor) => {
      try {
        const data = defaultFinancialData;
        const statements = data.statements.incomeStatement;
        const latestPeriod = data.periods.length - 1;
        const baseRevenue = statements.totalRevenue?.[latestPeriod] || 0;
        const baseOperatingIncome = statements.operatingIncome?.[latestPeriod] || 0;

        const scenarios = {
          bear: { growth: -0.15, margin: -0.2 },
          base: { growth: 0.1, margin: 0.0 },
          bull: { growth: 0.35, margin: 0.15 }
        };

        let content = `Scenario Analysis\n\n📊 BASE METRICS:\n• Revenue: ${formatCurrency(baseRevenue)}\n• Operating Income: ${formatCurrency(baseOperatingIncome)}\n`;

        Object.entries(scenarios).forEach(([name, scenario]) => {
          const projectedIncome = baseOperatingIncome * (1 + scenario.margin);
          const valuation = projectedIncome * 8;
          content += `\n${name.toUpperCase()} CASE:\n• Revenue: ${formatCurrency(baseRevenue * (1 + scenario.growth))}\n• Valuation: ${formatCurrency(valuation)}`;
        });

        return { type: 'success', content };
      } catch (error) {
        return { type: 'error', content: `Scenario analysis failed: ${error.message}` };
      }
    },
    parameterSchema: { required: [], optional: ['scenarios'] }
  },

  PRIVATE_GROWTH: {
    execute: async (_parsedCommand, _context, _processor) => {
      try {
        const data = defaultFinancialData;
        const statements = data.statements.incomeStatement;
        const periods = data.periods;
        const revenues = periods.map((_, index) => statements.totalRevenue?.[index] || 0);

        const growthRates = [];
        for (let i = 1; i < revenues.length; i++) {
          if (revenues[i - 1] > 0) {
            growthRates.push((revenues[i] / revenues[i - 1] - 1) * 100);
          }
        }

        const avgGrowth = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
        const cagr =
          revenues.length > 1 && revenues[0] > 0
            ? (Math.pow(revenues[revenues.length - 1] / revenues[0], 1 / (revenues.length - 1)) -
                1) *
              100
            : 0;

        const content = `Growth Analysis\n\n📈 GROWTH METRICS:\n• Revenue CAGR: ${formatPercentage(cagr / 100)}\n• Average YoY Growth: ${formatPercentage(avgGrowth / 100)}\n• Latest Revenue: ${formatCurrency(revenues[revenues.length - 1])}\n\n🎯 GROWTH ASSESSMENT:\n• Trajectory: ${avgGrowth > 15 ? '🚀 High Growth' : avgGrowth > 5 ? '📈 Moderate Growth' : '📉 Slow Growth'}\n• Consistency: ${growthRates.every(rate => rate > 0) ? '✅ Consistent' : '⚠️ Variable'}`;

        return { type: 'success', content };
      } catch (error) {
        return { type: 'error', content: `Growth analysis failed: ${error.message}` };
      }
    },
    parameterSchema: { required: [], optional: [] }
  },

  PRIVATE_RISK: {
    execute: async (_parsedCommand, _context, _processor) => {
      try {
        const data = defaultFinancialData;
        const statements = data.statements.incomeStatement;
        const periods = data.periods;
        const revenues = periods.map((_, index) => statements.totalRevenue?.[index] || 0);
        const margins = revenues.map((rev, index) => {
          const opIncome = statements.operatingIncome?.[index] || 0;
          return rev > 0 ? (opIncome / rev) * 100 : 0;
        });

        const revenueVolatility = revenues.length > 1 ? calculateVolatility(revenues) : 0;
        const marginVolatility = margins.length > 1 ? calculateVolatility(margins) : 0;

        const riskScore =
          (revenueVolatility > 20 ? 3 : revenueVolatility > 10 ? 2 : 1) +
          (marginVolatility > 5 ? 2 : marginVolatility > 2 ? 1 : 0);

        const riskLevel = riskScore >= 4 ? 'HIGH' : riskScore >= 2 ? 'MEDIUM' : 'LOW';

        const content = `Risk Assessment\n\n⚖️ RISK METRICS:\n• Revenue Volatility: ${revenueVolatility.toFixed(1)}%\n• Margin Volatility: ${marginVolatility.toFixed(1)}%\n• Overall Risk Level: ${riskLevel}\n\n🎯 RISK FACTORS:\n• Revenue Concentration: ${revenues.length < 3 ? '⚠️ Limited History' : '✅ Adequate Data'}\n• Margin Stability: ${marginVolatility < 2 ? '✅ Stable' : '⚠️ Variable'}\n• Growth Sustainability: ${assessGrowthSustainability(revenues)}`;

        return { type: 'success', content };
      } catch (error) {
        return { type: 'error', content: `Risk analysis failed: ${error.message}` };
      }
    },
    parameterSchema: { required: [], optional: [] }
  },

  PRIVATE_VALIDATE: {
    execute: async (_parsedCommand, _context, _processor) => {
      try {
        const data = defaultFinancialData;
        const _statements = data.financialStatements || [];
        const _latestIndex = _statements.length - 1;

        const validationResults = [];

        // Define periods for data validation
        const periods = ['2020', '2021', '2022', '2023', '2024'];

        // Check data completeness
        const incomeStatementItems = Object.keys(data.statements.incomeStatement).length;
        // const balanceSheetItems = Object.keys(data.statements.balanceSheet).length;
        // const cashFlowItems = Object.keys(data.statements.cashFlow).length;

        validationResults.push({
          test: 'Data Completeness',
          result: incomeStatementItems > 5 ? 'PASS' : 'FAIL',
          details: `${incomeStatementItems} income statement items`
        });

        // Check for negative revenues
        const revenues = periods.map(
          (_, index) => data.statements.incomeStatement.totalRevenue?.[index] || 0
        );
        const hasNegativeRevenue = revenues.some(rev => rev < 0);

        validationResults.push({
          test: 'Revenue Validation',
          result: !hasNegativeRevenue ? 'PASS' : 'FAIL',
          details: hasNegativeRevenue ? 'Negative revenue detected' : 'All revenues positive'
        });

        // Check margin consistency
        const margins = revenues.map((rev, index) => {
          const opIncome = data.statements.incomeStatement.operatingIncome?.[index] || 0;
          return rev > 0 ? (opIncome / rev) * 100 : 0;
        });
        const reasonableMargins = margins.every(margin => margin >= -50 && margin <= 100);

        validationResults.push({
          test: 'Margin Reasonableness',
          result: reasonableMargins ? 'PASS' : 'FAIL',
          details: `Margins range: ${Math.min(...margins).toFixed(1)}% to ${Math.max(...margins).toFixed(1)}%`
        });

        const passedTests = validationResults.filter(result => result.result === 'PASS').length;
        const totalTests = validationResults.length;

        let content = `Data Validation Report\n\n📊 VALIDATION SUMMARY:\n• Tests Passed: ${passedTests}/${totalTests}\n• Overall Status: ${passedTests === totalTests ? '✅ VALID' : '⚠️ ISSUES FOUND'}\n\n🔍 DETAILED RESULTS:\n`;

        validationResults.forEach(result => {
          const icon = result.result === 'PASS' ? '✅' : '❌';
          content += `${icon} ${result.test}: ${result.result}\n   ${result.details}\n`;
        });

        return { type: 'success', content };
      } catch (error) {
        return { type: 'error', content: `Data validation failed: ${error.message}` };
      }
    },
    parameterSchema: { required: [], optional: [] }
  },

  PRIVATE_EXPORT: {
    execute: async (_parsedCommand, _context, _processor) => {
      try {
        const data = defaultFinancialData;
        const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_');

        const exportData = {
          timestamp,
          company: 'Private Company Analysis',
          periods: data.periods,
          financials: data.statements,
          analysis: {
            dcf: 'Run PRIVATE_DCF() for valuation',
            ratios: 'Run PRIVATE_RATIOS() for financial ratios',
            scenarios: 'Run PRIVATE_SCENARIO() for scenario analysis'
          }
        };

        const content = `Export Complete\n\n📁 EXPORT DETAILS:\n• Timestamp: ${timestamp}\n• Data Periods: ${data.periods.join(', ')}\n• Export Format: JSON\n• File Size: ~${JSON.stringify(exportData).length} bytes\n\n📊 INCLUDED DATA:\n• Income Statement: ✅ Complete\n• Balance Sheet: ${Object.keys(data.statements.balanceSheet).length > 0 ? '✅' : '❌'} Available\n• Cash Flow: ${Object.keys(data.statements.cashFlow).length > 0 ? '✅' : '❌'} Available\n\n💡 USAGE:\n• Use exported data for external analysis\n• Import into other financial tools\n• Create backup of current analysis`;

        return {
          type: 'success',
          content,
          data: {
            export: exportData,
            filename: `private_analysis_${timestamp}.json`
          }
        };
      } catch (error) {
        return { type: 'error', content: `Export failed: ${error.message}` };
      }
    },
    parameterSchema: { required: [], optional: ['format'] }
  },

  PRIVATE_BENCHMARKS: {
    execute: async (_parsedCommand, _context, _processor) => {
      try {
        const data = defaultFinancialData;
        const _statements = data.statements.incomeStatement;
        const _latestIndex = data.periods.length - 1;

        // Current metrics - commented out as they're not used in this function
        // const revenue = statements.totalRevenue?.[latestIndex] || 0;
        // const operatingIncome = statements.operatingIncome?.[latestIndex] || 0;
        // const grossProfit = statements.grossProfit?.[latestIndex] || 0;

        // Industry benchmarks from enhanced data
        const benchmarks = data.assumptions?.industryBenchmarks || {
          revenuePerSqFt: { min: 800, target: 1200, current: 1490.44 },
          revenuePerProvider: { min: 300, target: 400, current: 1242.03 },
          injectableMargin: { min: 0.75, target: 0.8, current: 0.7 },
          ebitdaMargin: { min: 0.2, target: 0.25, current: 0.185 },
          customerRetention: { min: 0.65, target: 0.75, current: 0.72 }
        };

        let content = 'Industry Benchmark Analysis\n\n📊 CURRENT vs BENCHMARKS:\n';

        Object.entries(benchmarks).forEach(([metric, values]) => {
          const performance =
            values.current >= values.target
              ? '🟢 Above Target'
              : values.current >= values.min
                ? '🟡 Meets Minimum'
                : '🔴 Below Standard';
          const percentage = ((values.current / values.target) * 100).toFixed(1);

          content += `• ${metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:\n`;
          content += `  Current: ${
            typeof values.current === 'number' && values.current < 1
              ? formatPercentage(values.current)
              : formatNumber(values.current)
          }\n`;
          content += `  Target: ${
            typeof values.target === 'number' && values.target < 1
              ? formatPercentage(values.target)
              : formatNumber(values.target)
          }\n`;
          content += `  Performance: ${performance} (${percentage}% of target)\n\n`;
        });

        // Competitive positioning
        const overallScore = Object.values(benchmarks).reduce((score, benchmark) => {
          return (
            score +
            (benchmark.current >= benchmark.target ? 2 : benchmark.current >= benchmark.min ? 1 : 0)
          );
        }, 0);
        const maxScore = Object.keys(benchmarks).length * 2;
        const competitiveGrade =
          overallScore >= maxScore * 0.8
            ? 'A'
            : overallScore >= maxScore * 0.6
              ? 'B'
              : overallScore >= maxScore * 0.4
                ? 'C'
                : 'D';

        content += `🎯 COMPETITIVE POSITIONING:\n• Overall Score: ${overallScore}/${maxScore} (${((overallScore / maxScore) * 100).toFixed(1)}%)\n• Industry Grade: ${competitiveGrade}\n• Market Position: ${competitiveGrade === 'A' ? '🏆 Industry Leader' : competitiveGrade === 'B' ? '📈 Above Average' : competitiveGrade === 'C' ? '📊 Market Average' : '📉 Below Average'}`;

        return {
          type: 'success',
          content,
          data: {
            analysis: 'private_benchmarks',
            benchmarks,
            competitiveScore: overallScore,
            grade: competitiveGrade
          }
        };
      } catch (error) {
        return { type: 'error', content: `Benchmark analysis failed: ${error.message}` };
      }
    },
    parameterSchema: { required: [], optional: ['industry'] }
  },

  PRIVATE_CASHFLOW: {
    execute: async (_parsedCommand, _context, _processor) => {
      try {
        const data = defaultFinancialData;
        const statements = data.statements.incomeStatement;
        const periods = data.periods;

        // Calculate operating cash flow proxy from available data
        const cashFlowAnalysis = periods.map((period, index) => {
          const revenue = statements.totalRevenue?.[index] || 0;
          const operatingIncome = statements.operatingIncome?.[index] || 0;
          const depreciation = statements.depreciation?.[index] || 0;
          const workingCapitalChange =
            index > 0
              ? ((statements.totalRevenue?.[index] || 0) -
                  (statements.totalRevenue?.[index - 1] || 0)) *
                0.1
              : 0; // Estimate

          const operatingCashFlow = operatingIncome + depreciation - workingCapitalChange;
          const fcf = operatingCashFlow; // Simplified - would subtract capex

          return {
            period,
            revenue,
            operatingIncome,
            depreciation,
            operatingCashFlow,
            freeCashFlow: fcf,
            fcfMargin: revenue > 0 ? (fcf / revenue) * 100 : 0
          };
        });

        // Cash flow trends
        const avgFCFMargin =
          cashFlowAnalysis.reduce((sum, cf) => sum + cf.fcfMargin, 0) / cashFlowAnalysis.length;
        const latestFCF = cashFlowAnalysis[cashFlowAnalysis.length - 1];

        let content = 'Cash Flow Analysis\n\n💰 CASH FLOW SUMMARY:\n';
        content += cashFlowAnalysis
          .map(
            cf =>
              `• ${cf.period}:\n  Operating CF: ${formatCurrency(cf.operatingCashFlow)}\n  Free Cash Flow: ${formatCurrency(cf.freeCashFlow)}\n  FCF Margin: ${formatPercentage(cf.fcfMargin / 100)}`
          )
          .join('\n\n');

        content += `\n\n📊 CASH FLOW METRICS:\n• Latest FCF: ${formatCurrency(latestFCF.freeCashFlow)}\n• Average FCF Margin: ${formatPercentage(avgFCFMargin / 100)}\n• Cash Generation: ${latestFCF.freeCashFlow > 0 ? '✅ Positive' : '❌ Negative'}\n• FCF Trend: ${assessCashFlowTrend(cashFlowAnalysis)}`;

        // Cash flow adequacy analysis
        const fcfGrowth =
          cashFlowAnalysis.length > 1
            ? (latestFCF.freeCashFlow / cashFlowAnalysis[0].freeCashFlow - 1) * 100
            : 0;

        content += `\n\n🎯 CASH FLOW QUALITY:\n• FCF Growth (Total): ${formatPercentage(fcfGrowth / 100)}\n• Operating Leverage: ${calculateOperatingLeverage(cashFlowAnalysis)}\n• Cash Conversion: ${avgFCFMargin > 15 ? '🟢 Strong' : avgFCFMargin > 5 ? '🟡 Moderate' : '🔴 Weak'}`;

        return {
          type: 'success',
          content,
          data: {
            analysis: 'private_cashflow',
            cashFlowAnalysis,
            metrics: { avgFCFMargin, fcfGrowth }
          }
        };
      } catch (error) {
        return { type: 'error', content: `Cash flow analysis failed: ${error.message}` };
      }
    },
    parameterSchema: { required: [], optional: ['years'] }
  },

  PRIVATE_MULTIPLES: {
    execute: async (_parsedCommand, _context, _processor) => {
      try {
        const data = defaultFinancialData;
        const statements = data.statements.incomeStatement;
        const latestIndex = data.periods.length - 1;

        // Current metrics
        const revenue = statements.totalRevenue?.[latestIndex] || 0;
        const ebitda =
          (statements.operatingIncome?.[latestIndex] || 0) +
          (statements.depreciation?.[latestIndex] || 0);
        const _operatingIncome = statements.operatingIncome?.[latestIndex] || 0;
        const netIncome = statements.netIncome?.[latestIndex] || 0;

        // Industry multiples for medispa/healthcare services
        const industryMultiples = {
          evRevenue: { min: 1.5, typical: 2.5, premium: 4.0 },
          evEbitda: { min: 6.0, typical: 10.0, premium: 15.0 },
          peRatio: { min: 12.0, typical: 18.0, premium: 25.0 }
        };

        // Calculate implied valuations
        const valuations = {
          revenueMultiple: {
            conservative: revenue * industryMultiples.evRevenue.min,
            typical: revenue * industryMultiples.evRevenue.typical,
            premium: revenue * industryMultiples.evRevenue.premium
          },
          ebitdaMultiple:
            ebitda > 0
              ? {
                  conservative: ebitda * industryMultiples.evEbitda.min,
                  typical: ebitda * industryMultiples.evEbitda.typical,
                  premium: ebitda * industryMultiples.evEbitda.premium
                }
              : null,
          earningsMultiple:
            netIncome > 0
              ? {
                  conservative: netIncome * industryMultiples.peRatio.min,
                  typical: netIncome * industryMultiples.peRatio.typical,
                  premium: netIncome * industryMultiples.peRatio.premium
                }
              : null
        };

        let content = `Valuation Multiples Analysis\n\n📊 CURRENT METRICS:\n• Revenue (TTM): ${formatCurrency(revenue)}\n• EBITDA (TTM): ${formatCurrency(ebitda)}\n• Net Income: ${formatCurrency(netIncome)}\n\n💰 VALUATION SCENARIOS:\n`;

        // Revenue multiple valuation
        content += '📈 REVENUE MULTIPLE APPROACH:\n';
        content += `• Conservative (${industryMultiples.evRevenue.min}x): ${formatCurrency(valuations.revenueMultiple.conservative)}\n`;
        content += `• Typical (${industryMultiples.evRevenue.typical}x): ${formatCurrency(valuations.revenueMultiple.typical)}\n`;
        content += `• Premium (${industryMultiples.evRevenue.premium}x): ${formatCurrency(valuations.revenueMultiple.premium)}\n\n`;

        // EBITDA multiple valuation
        if (valuations.ebitdaMultiple) {
          content += '💼 EBITDA MULTIPLE APPROACH:\n';
          content += `• Conservative (${industryMultiples.evEbitda.min}x): ${formatCurrency(valuations.ebitdaMultiple.conservative)}\n`;
          content += `• Typical (${industryMultiples.evEbitda.typical}x): ${formatCurrency(valuations.ebitdaMultiple.typical)}\n`;
          content += `• Premium (${industryMultiples.evEbitda.premium}x): ${formatCurrency(valuations.ebitdaMultiple.premium)}\n\n`;
        }

        // Earnings multiple valuation
        if (valuations.earningsMultiple) {
          content += '📊 EARNINGS MULTIPLE APPROACH:\n';
          content += `• Conservative (${industryMultiples.peRatio.min}x): ${formatCurrency(valuations.earningsMultiple.conservative)}\n`;
          content += `• Typical (${industryMultiples.peRatio.typical}x): ${formatCurrency(valuations.earningsMultiple.typical)}\n`;
          content += `• Premium (${industryMultiples.peRatio.premium}x): ${formatCurrency(valuations.earningsMultiple.premium)}\n\n`;
        }

        // Valuation summary
        const typicalValuations = [
          valuations.revenueMultiple.typical,
          valuations.ebitdaMultiple?.typical,
          valuations.earningsMultiple?.typical
        ].filter(v => v);

        const avgValuation =
          typicalValuations.reduce((sum, val) => sum + val, 0) / typicalValuations.length;
        const minValuation = Math.min(...typicalValuations);
        const maxValuation = Math.max(...typicalValuations);

        content += `🎯 VALUATION SUMMARY:\n• Average Valuation: ${formatCurrency(avgValuation)}\n• Valuation Range: ${formatCurrency(minValuation)} - ${formatCurrency(maxValuation)}\n• Method Consistency: ${maxValuation / minValuation < 2 ? '✅ Consistent' : '⚠️ Wide Range'}\n• Recommended Range: ${formatCurrency(avgValuation * 0.8)} - ${formatCurrency(avgValuation * 1.2)}`;

        return {
          type: 'success',
          content,
          data: {
            analysis: 'private_multiples',
            valuations,
            summary: { avgValuation, minValuation, maxValuation }
          }
        };
      } catch (error) {
        return { type: 'error', content: `Multiples analysis failed: ${error.message}` };
      }
    },
    parameterSchema: { required: [], optional: ['industry', 'size'] }
  },

  PRIVATE_SENSITIVITY: {
    execute: async (_parsedCommand, _context, _processor) => {
      try {
        const data = defaultFinancialData;
        const statements = data.statements.incomeStatement;
        const latestIndex = data.periods.length - 1;
        const baseRevenue = statements.totalRevenue?.[latestIndex] || 0;
        const baseEbitda =
          (statements.operatingIncome?.[latestIndex] || 0) +
          (statements.depreciation?.[latestIndex] || 0);

        // Sensitivity variables
        const revenueChanges = [-20, -10, 0, 10, 20]; // % changes
        const marginChanges = [-2, -1, 0, 1, 2]; // percentage point changes
        const multipleBase = 10; // EBITDA multiple

        let content = `Sensitivity Analysis\n\n📊 BASE CASE:\n• Revenue: ${formatCurrency(baseRevenue)}\n• EBITDA: ${formatCurrency(baseEbitda)}\n• EBITDA Multiple: ${multipleBase}x\n• Base Valuation: ${formatCurrency(baseEbitda * multipleBase)}\n\n`;

        // Revenue sensitivity
        content += '📈 REVENUE SENSITIVITY:\n';
        revenueChanges.forEach(change => {
          const _newRevenue = baseRevenue * (1 + change / 100);
          const newEbitda = baseEbitda * (1 + change / 100); // Assuming operating leverage
          const newValuation = newEbitda * multipleBase;
          const valuationChange = (newValuation / (baseEbitda * multipleBase) - 1) * 100;
          content += `• Revenue ${change >= 0 ? '+' : ''}${change}%: Valuation ${formatCurrency(newValuation)} (${valuationChange >= 0 ? '+' : ''}${valuationChange.toFixed(1)}%)\n`;
        });

        // Margin sensitivity
        content += '\n💼 MARGIN SENSITIVITY (percentage points):\n';
        const baseMargin = baseRevenue > 0 ? (baseEbitda / baseRevenue) * 100 : 0;
        marginChanges.forEach(change => {
          const newMargin = (baseMargin + change) / 100;
          const newEbitda = baseRevenue * newMargin;
          const newValuation = newEbitda * multipleBase;
          const valuationChange =
            newEbitda > 0 ? (newValuation / (baseEbitda * multipleBase) - 1) * 100 : -100;
          content += `• Margin ${change >= 0 ? '+' : ''}${change}pp: EBITDA ${formatCurrency(newEbitda)}, Valuation ${formatCurrency(newValuation)} (${valuationChange >= 0 ? '+' : ''}${valuationChange.toFixed(1)}%)\n`;
        });

        // Multiple sensitivity
        content += '\n🎯 MULTIPLE SENSITIVITY:\n';
        const multiples = [8, 9, 10, 11, 12];
        multiples.forEach(multiple => {
          const valuation = baseEbitda * multiple;
          const change = (multiple / multipleBase - 1) * 100;
          content += `• ${multiple}x EBITDA: ${formatCurrency(valuation)} (${change >= 0 ? '+' : ''}${change.toFixed(1)}%)\n`;
        });

        // Key insights
        const revenueElasticity = 1.0; // 1% revenue change = 1% valuation change (simplified)
        const marginElasticity = (baseRevenue * multipleBase) / (baseEbitda * multipleBase); // Impact of 1pp margin change

        content += `\n🔍 SENSITIVITY INSIGHTS:\n• Revenue Elasticity: ${revenueElasticity.toFixed(2)}x (1% revenue change → ${revenueElasticity.toFixed(1)}% valuation change)\n• Margin Impact: 1pp margin change → ${((marginElasticity - 1) * 100).toFixed(1)}% valuation change\n• Key Driver: ${marginElasticity > revenueElasticity ? 'Margin optimization' : 'Revenue growth'} has higher impact`;

        return {
          type: 'success',
          content,
          data: {
            analysis: 'private_sensitivity',
            baseCase: {
              revenue: baseRevenue,
              ebitda: baseEbitda,
              valuation: baseEbitda * multipleBase
            },
            sensitivities: { revenueElasticity, marginElasticity }
          }
        };
      } catch (error) {
        return { type: 'error', content: `Sensitivity analysis failed: ${error.message}` };
      }
    },
    parameterSchema: { required: [], optional: ['variables', 'ranges'] }
  },

  PRIVATE_WATERFALL: {
    execute: async (_parsedCommand, _context, _processor) => {
      try {
        const data = defaultFinancialData;
        const statements = data.statements.incomeStatement;
        const latestIndex = data.periods.length - 1;

        // Build DCF waterfall analysis
        const revenue = statements.totalRevenue?.[latestIndex] || 0;
        const operatingIncome = statements.operatingIncome?.[latestIndex] || 0;
        const taxRate = 0.25;
        const discountRate = 0.12;
        const terminalGrowthRate = 0.025;

        // Waterfall components
        const waterfallSteps = [
          { step: 'Base Revenue', value: revenue, cumulative: revenue },
          {
            step: 'Operating Leverage',
            value: operatingIncome - revenue * 0.15,
            cumulative: operatingIncome
          },
          {
            step: 'Tax Shield',
            value: -operatingIncome * taxRate,
            cumulative: operatingIncome * (1 - taxRate)
          },
          {
            step: 'Working Capital',
            value: -revenue * 0.02,
            cumulative: operatingIncome * (1 - taxRate) - revenue * 0.02
          },
          {
            step: 'CapEx',
            value: -revenue * 0.03,
            cumulative: operatingIncome * (1 - taxRate) - revenue * 0.05
          },
          {
            step: 'Free Cash Flow',
            value: 0,
            cumulative: operatingIncome * (1 - taxRate) - revenue * 0.05
          }
        ];

        const fcf = waterfallSteps[waterfallSteps.length - 1].cumulative;
        const terminalValue =
          (fcf * (1 + terminalGrowthRate)) / (discountRate - terminalGrowthRate);
        const pv5Years = fcf * 4.5; // Simplified 5-year PV
        const pvTerminal = terminalValue / Math.pow(1 + discountRate, 5);
        const enterpriseValue = pv5Years + pvTerminal;

        let content = 'DCF Waterfall Analysis\n\n💧 CASH FLOW WATERFALL:\n';
        waterfallSteps.forEach((step, i) => {
          const arrow = i === 0 ? '' : step.value >= 0 ? ' ↗ ' : ' ↘ ';
          content += `${i + 1}. ${step.step}: ${formatCurrency(step.value)} ${arrow}${formatCurrency(step.cumulative)}\n`;
        });

        content += `\n🏗️ VALUATION BUILD-UP:\n• PV of 5-Year FCF: ${formatCurrency(pv5Years)}\n• PV of Terminal Value: ${formatCurrency(pvTerminal)}\n• Enterprise Value: ${formatCurrency(enterpriseValue)}\n• Terminal Multiple: ${(terminalValue / fcf).toFixed(1)}x FCF\n• Implied FCF Yield: ${formatPercentage(fcf / enterpriseValue)}`;

        return {
          type: 'success',
          content,
          data: {
            analysis: 'private_waterfall',
            waterfallSteps,
            valuation: { pv5Years, pvTerminal, enterpriseValue }
          }
        };
      } catch (error) {
        return { type: 'error', content: `Waterfall analysis failed: ${error.message}` };
      }
    },
    parameterSchema: { required: [], optional: ['discountRate', 'terminalGrowthRate'] }
  },

  PRIVATE_COMPS: {
    execute: async (_parsedCommand, _context, _processor) => {
      try {
        const data = defaultFinancialData;
        const statements = data.statements.incomeStatement;
        const latestIndex = data.periods.length - 1;

        const revenue = statements.totalRevenue?.[latestIndex] || 0;
        const ebitda =
          (statements.operatingIncome?.[latestIndex] || 0) +
          (statements.depreciation?.[latestIndex] || 0);

        // Comparable companies (medispa/aesthetic medicine sector)
        const comparables = [
          { name: 'Lifestyle Communities', evRevenue: 2.1, evEbitda: 12.5, margin: 18.2 },
          { name: 'European Wax Center', evRevenue: 3.2, evEbitda: 15.8, margin: 22.1 },
          { name: 'Planet Fitness', evRevenue: 4.5, evEbitda: 18.2, margin: 28.5 },
          { name: 'Xponential Fitness', evRevenue: 2.8, evEbitda: 14.1, margin: 19.8 },
          { name: 'Hand & Stone', evRevenue: 2.5, evEbitda: 11.2, margin: 21.4 }
        ];

        // Calculate company metrics
        const currentMargin = revenue > 0 ? (ebitda / revenue) * 100 : 0;

        // Peer statistics
        const avgEvRevenue =
          comparables.reduce((sum, comp) => sum + comp.evRevenue, 0) / comparables.length;
        const avgEvEbitda =
          comparables.reduce((sum, comp) => sum + comp.evEbitda, 0) / comparables.length;
        const avgMargin =
          comparables.reduce((sum, comp) => sum + comp.margin, 0) / comparables.length;

        // Trading multiples valuation
        const tradingValuationRevenue = revenue * avgEvRevenue;
        const tradingValuationEbitda = ebitda * avgEvEbitda;
        const avgTradingValuation = (tradingValuationRevenue + tradingValuationEbitda) / 2;

        let content = 'Comparable Company Analysis\n\n🏢 PEER GROUP ANALYSIS:\n';
        content += `Trading Multiple Averages:\n• EV/Revenue: ${avgEvRevenue.toFixed(1)}x\n• EV/EBITDA: ${avgEvEbitda.toFixed(1)}x\n• EBITDA Margin: ${avgMargin.toFixed(1)}%\n\n`;

        content += '📊 DETAILED COMPARABLES:\n';
        comparables.forEach((comp, i) => {
          content += `${i + 1}. ${comp.name}:\n   EV/Rev: ${comp.evRevenue}x, EV/EBITDA: ${comp.evEbitda}x, Margin: ${comp.margin}%\n`;
        });

        content += `\n💰 IMPLIED VALUATION:\n• Revenue Multiple: ${formatCurrency(tradingValuationRevenue)} (${avgEvRevenue.toFixed(1)}x)\n• EBITDA Multiple: ${formatCurrency(tradingValuationEbitda)} (${avgEvEbitda.toFixed(1)}x)\n• Average Trading Value: ${formatCurrency(avgTradingValuation)}\n• Current EBITDA Margin: ${formatPercentage(currentMargin / 100)}\n• Peer Margin Delta: ${(currentMargin - avgMargin).toFixed(1)}pp`;

        content += `\n🎯 RELATIVE POSITIONING:\n• Multiple Premium/Discount: ${(avgTradingValuation / (revenue * 2.5 + ebitda * 12) - 1) * 100 > 0 ? '+' : ''}${((avgTradingValuation / (revenue * 2.5 + ebitda * 12) - 1) * 100).toFixed(1)}%\n• Margin Competitiveness: ${currentMargin >= avgMargin ? '🟢 Above Peers' : '🟡 Below Peers'}\n• Size Adjustment: ${revenue < 50000000 ? 'Small-cap discount may apply' : 'Mid-cap positioning'}`;

        return {
          type: 'success',
          content,
          data: {
            analysis: 'private_comps',
            comparables,
            peerAverages: { avgEvRevenue, avgEvEbitda, avgMargin },
            impliedValuation: {
              tradingValuationRevenue,
              tradingValuationEbitda,
              avgTradingValuation
            }
          }
        };
      } catch (error) {
        return { type: 'error', content: `Comparable analysis failed: ${error.message}` };
      }
    },
    parameterSchema: { required: [], optional: ['sector', 'size'] }
  },

  PRIVATE_LBO: {
    execute: async (_parsedCommand, _context, _processor) => {
      try {
        const data = defaultFinancialData;
        const statements = data.statements.incomeStatement;
        const latestIndex = data.periods.length - 1;

        const _revenue = statements.totalRevenue?.[latestIndex] || 0;
        const ebitda =
          (statements.operatingIncome?.[latestIndex] || 0) +
          (statements.depreciation?.[latestIndex] || 0);

        // LBO assumptions
        const purchasePrice = ebitda * 10; // 10x EBITDA entry multiple
        const equityContribution = purchasePrice * 0.3; // 30% equity
        const debtFinancing = purchasePrice * 0.7; // 70% debt
        const interestRate = 0.08; // 8% weighted average cost of debt
        const exitMultiple = 12; // 12x EBITDA exit multiple
        const holdPeriod = 5; // 5-year hold

        // Project future EBITDA growth
        const ebitdaGrowthRate = 0.08; // 8% annual growth
        const projectedEbitda = [];
        for (let year = 1; year <= holdPeriod; year++) {
          projectedEbitda.push(ebitda * Math.pow(1 + ebitdaGrowthRate, year));
        }

        // Debt paydown (assuming 50% FCF used for debt reduction)
        let remainingDebt = debtFinancing;
        const debtPaydown = [];
        projectedEbitda.forEach((yearEbitda, i) => {
          const fcf = yearEbitda * 0.6; // Assume 60% FCF conversion
          const interestPayment = remainingDebt * interestRate;
          const debtReduction = Math.min((fcf - interestPayment) * 0.5, remainingDebt * 0.2);
          remainingDebt = Math.max(0, remainingDebt - debtReduction);
          debtPaydown.push({
            year: i + 1,
            ebitda: yearEbitda,
            debt: remainingDebt,
            reduction: debtReduction
          });
        });

        // Exit valuation
        const exitEbitda = projectedEbitda[holdPeriod - 1];
        const exitValue = exitEbitda * exitMultiple;
        const netProceeds = exitValue - remainingDebt;
        const totalReturn = netProceeds / equityContribution;
        const irr = Math.pow(totalReturn, 1 / holdPeriod) - 1;
        const moic = totalReturn; // Money-on-Money multiple

        let content = `Leveraged Buyout Analysis\n\n💼 TRANSACTION STRUCTURE:\n• Purchase Price: ${formatCurrency(purchasePrice)} (${(purchasePrice / ebitda).toFixed(1)}x EBITDA)\n• Equity Investment: ${formatCurrency(equityContribution)} (${formatPercentage(equityContribution / purchasePrice)})\n• Debt Financing: ${formatCurrency(debtFinancing)} (${formatPercentage(debtFinancing / purchasePrice)})\n• Interest Rate: ${formatPercentage(interestRate)}\n\n`;

        content += '📈 EBITDA PROJECTIONS:\n';
        projectedEbitda.forEach((ebitdaYear, i) => {
          content += `Year ${i + 1}: ${formatCurrency(ebitdaYear)} (${formatPercentage(ebitdaGrowthRate)} growth)\n`;
        });

        content += '\n🏦 DEBT PAYDOWN SCHEDULE:\n';
        debtPaydown.forEach(year => {
          content += `Year ${year.year}: Debt ${formatCurrency(year.debt)}, Paydown ${formatCurrency(year.reduction)}\n`;
        });

        content += `\n🎯 EXIT ANALYSIS (Year ${holdPeriod}):\n• Exit EBITDA: ${formatCurrency(exitEbitda)}\n• Exit Multiple: ${exitMultiple}x\n• Exit Value: ${formatCurrency(exitValue)}\n• Remaining Debt: ${formatCurrency(remainingDebt)}\n• Net Proceeds: ${formatCurrency(netProceeds)}\n\n💰 INVESTOR RETURNS:\n• Total Return: ${formatCurrency(netProceeds)} (${totalReturn.toFixed(1)}x)\n• Money-on-Money: ${moic.toFixed(1)}x\n• IRR: ${formatPercentage(irr)}\n• Return Quality: ${irr > 0.2 ? '🟢 Excellent' : irr > 0.15 ? '🟡 Good' : '🔴 Poor'}`;

        return {
          type: 'success',
          content,
          data: {
            analysis: 'private_lbo',
            transaction: { purchasePrice, equityContribution, debtFinancing },
            projections: projectedEbitda,
            returns: { totalReturn, moic, irr }
          }
        };
      } catch (error) {
        return { type: 'error', content: `LBO analysis failed: ${error.message}` };
      }
    },
    parameterSchema: { required: [], optional: ['leverage', 'holdPeriod', 'exitMultiple'] }
  },

  PRIVATE_QUALITY: {
    execute: async (_parsedCommand, _context, _processor) => {
      try {
        const data = defaultFinancialData;
        const statements = data.statements.incomeStatement;
        const periods = data.periods;

        // Business Quality Score calculation
        const qualityMetrics = [];

        // Revenue Quality
        const revenues = periods.map((_, i) => statements.totalRevenue?.[i] || 0);
        const revenueGrowthConsistency = calculateGrowthConsistency(revenues);
        const revenueRecurring = estimateRecurringRevenue(statements, periods.length - 1);
        qualityMetrics.push({
          metric: 'Revenue Quality',
          score: revenueGrowthConsistency * 0.6 + revenueRecurring * 0.4,
          weight: 25
        });

        // Profitability Quality
        const margins = revenues.map((rev, i) => {
          const opIncome = statements.operatingIncome?.[i] || 0;
          return rev > 0 ? (opIncome / rev) * 100 : 0;
        });
        const marginStability = calculateMarginStability(margins);
        const profitabilityTrend = calculateProfitabilityTrend(margins);
        qualityMetrics.push({
          metric: 'Profitability Quality',
          score: marginStability * 0.7 + profitabilityTrend * 0.3,
          weight: 30
        });

        // Cash Generation Quality
        const cashConversion = 85; // Estimated from medispa characteristics
        const workingCapitalEfficiency = 90; // Asset-light model
        qualityMetrics.push({
          metric: 'Cash Generation',
          score: (cashConversion + workingCapitalEfficiency) / 2,
          weight: 20
        });

        // Competitive Position
        const marketPosition = assessMarketPosition(data);
        const scalability = assessScalability(revenues);
        qualityMetrics.push({
          metric: 'Competitive Position',
          score: marketPosition * 0.6 + scalability * 0.4,
          weight: 15
        });

        // Financial Strength
        const debtLevels = 75; // Assumed moderate debt levels
        const liquidityPosition = 80; // Cash generation business
        qualityMetrics.push({
          metric: 'Financial Strength',
          score: (debtLevels + liquidityPosition) / 2,
          weight: 10
        });

        // Calculate overall quality score
        const overallScore = qualityMetrics.reduce(
          (sum, metric) => sum + (metric.score * metric.weight) / 100,
          0
        );
        const qualityGrade =
          overallScore >= 80
            ? 'A'
            : overallScore >= 70
              ? 'B'
              : overallScore >= 60
                ? 'C'
                : overallScore >= 50
                  ? 'D'
                  : 'F';

        let content = `Business Quality Assessment\n\n🏆 OVERALL QUALITY SCORE: ${overallScore.toFixed(1)}/100 (Grade: ${qualityGrade})\n\n📊 QUALITY BREAKDOWN:\n`;

        qualityMetrics.forEach(metric => {
          const grade =
            metric.score >= 80 ? 'A' : metric.score >= 70 ? 'B' : metric.score >= 60 ? 'C' : 'D';
          content += `• ${metric.metric}: ${metric.score.toFixed(1)}/100 (${grade}) - Weight: ${metric.weight}%\n`;
        });

        content += `\n🎯 QUALITY ANALYSIS:\n• Investment Grade: ${qualityGrade === 'A' ? '🟢 High Quality' : qualityGrade === 'B' ? '🟡 Good Quality' : qualityGrade === 'C' ? '🟠 Average Quality' : '🔴 Below Average'}\n• Risk Profile: ${overallScore >= 75 ? 'Low-Medium Risk' : overallScore >= 60 ? 'Medium Risk' : 'Medium-High Risk'}\n• Valuation Multiple Premium: ${overallScore >= 80 ? '10-15%' : overallScore >= 70 ? '5-10%' : overallScore >= 60 ? '0-5%' : 'Discount warranted'}\n\n💡 KEY STRENGTHS:\n${identifyStrengths(qualityMetrics)}\n\n⚠️ AREAS FOR IMPROVEMENT:\n${identifyWeaknesses(qualityMetrics)}`;

        return {
          type: 'success',
          content,
          data: {
            analysis: 'private_quality',
            overallScore,
            qualityGrade,
            metrics: qualityMetrics
          }
        };
      } catch (error) {
        return { type: 'error', content: `Quality assessment failed: ${error.message}` };
      }
    },
    parameterSchema: { required: [], optional: ['weights'] }
  },

  PRIVATE_HELP: {
    execute: async (_parsedCommand, _context, _processor) => {
      const commands = [
        { cmd: 'PRIVATE_LOAD()', desc: 'Load and validate private financial data' },
        { cmd: 'PRIVATE_SUMMARY()', desc: 'Generate executive summary of company performance' },
        { cmd: 'PRIVATE_DCF()', desc: 'Run discounted cash flow valuation analysis' },
        { cmd: 'PRIVATE_RATIOS()', desc: 'Calculate comprehensive financial ratios' },
        { cmd: 'PRIVATE_BENCHMARKS()', desc: 'Compare metrics against industry benchmarks' },
        { cmd: 'PRIVATE_MULTIPLES()', desc: 'Valuation using industry multiples approach' },
        { cmd: 'PRIVATE_CASHFLOW()', desc: 'Analyze cash flow generation and quality' },
        { cmd: 'PRIVATE_GROWTH()', desc: 'Assess revenue growth trends and sustainability' },
        { cmd: 'PRIVATE_RISK()', desc: 'Evaluate business risk factors and volatility' },
        { cmd: 'PRIVATE_SCENARIO()', desc: 'Run bull/base/bear case scenario analysis' },
        { cmd: 'PRIVATE_MONTE_CARLO()', desc: 'Monte Carlo simulation for valuation ranges' },
        { cmd: 'PRIVATE_SENSITIVITY()', desc: 'Sensitivity analysis on key variables' },
        { cmd: 'PRIVATE_VALIDATE()', desc: 'Validate data quality and completeness' },
        { cmd: 'PRIVATE_EXPORT()', desc: 'Export analysis data and results' },
        { cmd: 'PRIVATE_WATERFALL()', desc: 'DCF waterfall and value bridge analysis' },
        { cmd: 'PRIVATE_COMPS()', desc: 'Comparable company trading multiples analysis' },
        { cmd: 'PRIVATE_LBO()', desc: 'Leveraged buyout model and returns analysis' },
        { cmd: 'PRIVATE_QUALITY()', desc: 'Business quality and investment grade assessment' },
        { cmd: 'PRIVATE_WORKFLOW()', desc: 'Interactive analysis workflow with recommendations' },
        { cmd: 'PRIVATE_DASHBOARD()', desc: 'Executive dashboard with key metrics summary' },
        { cmd: 'PRIVATE_AUDIT()', desc: 'Comprehensive financial audit and red flags analysis' },
        { cmd: 'PRIVATE_FORECAST()', desc: 'Multi-scenario financial forecasting model' },
        { cmd: 'PRIVATE_ESG()', desc: 'ESG scoring and sustainable investment analysis' }
      ];

      let content = 'Private Analysis Commands\n\n🛠️ AVAILABLE COMMANDS:\n';
      content += commands.map(cmd => `• ${cmd.cmd}\n  ${cmd.desc}`).join('\n\n');

      content += '\n\n📋 WORKFLOW RECOMMENDATIONS:\n';
      content += '1. Start with PRIVATE_LOAD() to validate data\n';
      content += '2. Run PRIVATE_SUMMARY() for company overview\n';
      content += '3. Use PRIVATE_DCF() or PRIVATE_MULTIPLES() for valuation\n';
      content += '4. Perform PRIVATE_SCENARIO() for risk assessment\n';
      content += '5. Execute PRIVATE_BENCHMARKS() for competitive analysis\n';
      content += '6. Use PRIVATE_EXPORT() to save results\n\n';

      content +=
        '💡 TIPS:\n• Commands are case-sensitive\n• Most commands work with default parameters\n• Use PRIVATE_VALIDATE() if you encounter errors\n• Results include detailed analysis and insights';

      return {
        type: 'success',
        content,
        data: {
          analysis: 'private_help',
          commands: commands.map(cmd => cmd.cmd)
        }
      };
    },
    parameterSchema: { required: [], optional: [] }
  },

  PRIVATE_WORKFLOW: {
    execute: async (_parsedCommand, _context, _processor) => {
      try {
        const data = defaultFinancialData;
        const _statements = data.statements.incomeStatement;
        const _periods = data.periods;

        // Workflow assessment
        const workflowSteps = [
          { step: 'Data Quality', completed: true, score: 85, next: 'PRIVATE_VALIDATE()' },
          { step: 'Company Overview', completed: false, score: 0, next: 'PRIVATE_SUMMARY()' },
          { step: 'Financial Analysis', completed: false, score: 0, next: 'PRIVATE_RATIOS()' },
          {
            step: 'Valuation Models',
            completed: false,
            score: 0,
            next: 'PRIVATE_DCF() & PRIVATE_MULTIPLES()'
          },
          {
            step: 'Risk Assessment',
            completed: false,
            score: 0,
            next: 'PRIVATE_RISK() & PRIVATE_SCENARIO()'
          },
          {
            step: 'Benchmarking',
            completed: false,
            score: 0,
            next: 'PRIVATE_BENCHMARKS() & PRIVATE_COMPS()'
          },
          {
            step: 'Advanced Models',
            completed: false,
            score: 0,
            next: 'PRIVATE_LBO() & PRIVATE_MONTE_CARLO()'
          },
          { step: 'Final Report', completed: false, score: 0, next: 'PRIVATE_EXPORT()' }
        ];

        const overallProgress =
          (workflowSteps.filter(step => step.completed).length / workflowSteps.length) * 100;
        const nextStep = workflowSteps.find(step => !step.completed);

        let content = `Private Analysis Workflow\n\n📋 WORKFLOW PROGRESS: ${overallProgress.toFixed(0)}% Complete\n\n🔄 ANALYSIS STEPS:\n`;

        workflowSteps.forEach((step, i) => {
          const status = step.completed
            ? '✅'
            : i === workflowSteps.findIndex(s => !s.completed)
              ? '🔄'
              : '⏳';
          content += `${i + 1}. ${status} ${step.step} ${step.completed ? `(${step.score}%)` : ''}\n   Next: ${step.next}\n\n`;
        });

        content += `🎯 RECOMMENDED NEXT STEPS:\n• ${nextStep ? nextStep.next : 'All steps completed!'}\n• Focus on ${nextStep ? nextStep.step.toLowerCase() : 'final review'}\n• Estimated time: ${estimateStepTime(nextStep?.step)}\n\n📊 WORKFLOW INSIGHTS:\n• Data completeness: ${assessDataCompleteness(data)}%\n• Analysis depth: ${assessAnalysisDepth(workflowSteps)}\n• Report readiness: ${overallProgress >= 80 ? '🟢 Ready' : overallProgress >= 50 ? '🟡 Partial' : '🔴 Incomplete'}`;

        return {
          type: 'success',
          content,
          data: {
            analysis: 'private_workflow',
            workflowSteps,
            progress: overallProgress,
            nextStep: nextStep?.step
          }
        };
      } catch (error) {
        return { type: 'error', content: `Workflow analysis failed: ${error.message}` };
      }
    },
    parameterSchema: { required: [], optional: [] }
  },

  PRIVATE_DASHBOARD: {
    execute: async (_parsedCommand, _context, _processor) => {
      try {
        const data = defaultFinancialData;
        const statements = data.statements.incomeStatement;
        const latestIndex = data.periods.length - 1;

        // Key metrics calculation
        const revenue = statements.totalRevenue?.[latestIndex] || 0;
        const grossProfit = statements.grossProfit?.[latestIndex] || 0;
        const operatingIncome = statements.operatingIncome?.[latestIndex] || 0;
        const ebitda = operatingIncome + (statements.depreciation?.[latestIndex] || revenue * 0.02);

        // Growth metrics
        const revenueGrowth =
          latestIndex > 0 && statements.totalRevenue?.[latestIndex - 1] > 0
            ? (revenue / statements.totalRevenue[latestIndex - 1] - 1) * 100
            : 0;

        // Margins
        const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
        const operatingMargin = revenue > 0 ? (operatingIncome / revenue) * 100 : 0;
        const ebitdaMargin = revenue > 0 ? (ebitda / revenue) * 100 : 0;

        // Valuation estimates
        const revenueMultiple = 2.5;
        const ebitdaMultiple = 10.0;
        const impliedValuation = (revenue * revenueMultiple + ebitda * ebitdaMultiple) / 2;

        // Performance scoring
        const performanceScore = calculatePerformanceScore({
          revenueGrowth,
          grossMargin,
          operatingMargin,
          ebitdaMargin
        });

        let content = `📊 EXECUTIVE DASHBOARD\n\n💰 FINANCIAL SNAPSHOT (${data.periods[latestIndex]}):\n`;
        content += '┌─────────────────────────────────────┐\n';
        content += `│ Revenue:        ${formatCurrency(revenue).padEnd(20)} │\n`;
        content += `│ EBITDA:         ${formatCurrency(ebitda).padEnd(20)} │\n`;
        content += `│ Operating Inc:  ${formatCurrency(operatingIncome).padEnd(20)} │\n`;
        content += `│ Est. Valuation: ${formatCurrency(impliedValuation).padEnd(20)} │\n`;
        content += '└─────────────────────────────────────┘\n\n';

        content += '📈 KEY PERFORMANCE INDICATORS:\n';
        content += `• Revenue Growth:    ${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(1)}% ${getGrowthIcon(revenueGrowth)}\n`;
        content += `• Gross Margin:      ${grossMargin.toFixed(1)}% ${getMarginIcon(grossMargin, 'gross')}\n`;
        content += `• Operating Margin:  ${operatingMargin.toFixed(1)}% ${getMarginIcon(operatingMargin, 'operating')}\n`;
        content += `• EBITDA Margin:     ${ebitdaMargin.toFixed(1)}% ${getMarginIcon(ebitdaMargin, 'ebitda')}\n\n`;

        content += `🎯 PERFORMANCE SCORE: ${performanceScore}/100\n`;
        content += `Rating: ${getPerformanceRating(performanceScore)}\n\n`;

        content +=
          '🔍 QUICK ACTIONS:\n• Run PRIVATE_DCF() for detailed valuation\n• Execute PRIVATE_BENCHMARKS() for peer comparison\n• Use PRIVATE_SCENARIO() for risk modeling\n• Try PRIVATE_QUALITY() for investment grade analysis';

        return {
          type: 'success',
          content,
          data: {
            analysis: 'private_dashboard',
            metrics: { revenue, ebitda, operatingIncome, impliedValuation },
            kpis: { revenueGrowth, grossMargin, operatingMargin, ebitdaMargin },
            performanceScore
          }
        };
      } catch (error) {
        return { type: 'error', content: `Dashboard generation failed: ${error.message}` };
      }
    },
    parameterSchema: { required: [], optional: ['period'] }
  },

  PRIVATE: {
    execute: async (_parsedCommand, _context, _processor) => {
      const commands = [
        // Core Analysis Commands
        {
          cmd: 'PRIVATE_LOAD()',
          desc: 'Load and validate private financial data',
          cat: '📊 CORE ANALYSIS'
        },
        {
          cmd: 'PRIVATE_SUMMARY()',
          desc: 'Generate executive summary of company performance',
          cat: '📊 CORE ANALYSIS'
        },
        {
          cmd: 'PRIVATE_DCF()',
          desc: 'Run discounted cash flow valuation analysis',
          cat: '📊 CORE ANALYSIS'
        },
        {
          cmd: 'PRIVATE_RATIOS()',
          desc: 'Calculate comprehensive financial ratios',
          cat: '📊 CORE ANALYSIS'
        },

        // Valuation Commands
        {
          cmd: 'PRIVATE_WATERFALL()',
          desc: 'DCF waterfall and value bridge analysis',
          cat: '💰 VALUATION'
        },
        {
          cmd: 'PRIVATE_COMPS()',
          desc: 'Comparable company trading multiples analysis',
          cat: '💰 VALUATION'
        },
        {
          cmd: 'PRIVATE_LBO()',
          desc: 'Leveraged buyout model and returns analysis',
          cat: '💰 VALUATION'
        },
        {
          cmd: 'PRIVATE_MULTIPLES()',
          desc: 'Valuation using industry multiples approach',
          cat: '💰 VALUATION'
        },

        // Analytics Commands
        {
          cmd: 'PRIVATE_QUALITY()',
          desc: 'Business quality and investment grade assessment',
          cat: '📈 ANALYTICS'
        },
        {
          cmd: 'PRIVATE_BENCHMARKS()',
          desc: 'Compare metrics against industry benchmarks',
          cat: '📈 ANALYTICS'
        },
        {
          cmd: 'PRIVATE_CASHFLOW()',
          desc: 'Analyze cash flow generation and quality',
          cat: '📈 ANALYTICS'
        },
        {
          cmd: 'PRIVATE_GROWTH()',
          desc: 'Assess revenue growth trends and sustainability',
          cat: '📈 ANALYTICS'
        },
        {
          cmd: 'PRIVATE_RISK()',
          desc: 'Evaluate business risk factors and volatility',
          cat: '📈 ANALYTICS'
        },
        {
          cmd: 'PRIVATE_MONTE_CARLO()',
          desc: 'Monte Carlo simulation for valuation ranges',
          cat: '📈 ANALYTICS'
        },
        {
          cmd: 'PRIVATE_SCENARIO()',
          desc: 'Run bull/base/bear case scenario analysis',
          cat: '📈 ANALYTICS'
        },
        {
          cmd: 'PRIVATE_SENSITIVITY()',
          desc: 'Sensitivity analysis on key variables',
          cat: '📈 ANALYTICS'
        },

        // Automation Commands
        {
          cmd: 'PRIVATE_WORKFLOW()',
          desc: 'Interactive analysis workflow with recommendations',
          cat: '🤖 AUTOMATION'
        },

        // Reporting Commands
        {
          cmd: 'PRIVATE_DASHBOARD()',
          desc: 'Executive dashboard with key metrics summary',
          cat: '📋 REPORTING'
        },

        // Data Management Commands
        {
          cmd: 'PRIVATE_VALIDATE()',
          desc: 'Validate data quality and completeness',
          cat: '💾 DATA MANAGEMENT'
        },
        {
          cmd: 'PRIVATE_EXPORT()',
          desc: 'Export analysis data and results',
          cat: '💾 DATA MANAGEMENT'
        },

        // Utility Commands
        {
          cmd: 'PRIVATE_HELP()',
          desc: 'Show all available private analysis commands',
          cat: '🛠️ UTILITY'
        }
      ];

      let content = `🚀 **Private Analysis CLI Commands (${commands.length} Total)**\n\n`;

      // Group commands by category
      const categories = [...new Set(commands.map(cmd => cmd.cat))];

      categories.forEach(category => {
        const categoryCommands = commands.filter(cmd => cmd.cat === category);
        content += `### **${category}**\n`;
        categoryCommands.forEach(cmd => {
          content += `- **${cmd.cmd}** - ${cmd.desc}\n`;
        });
        content += '\n';
      });

      content += '### **💡 USAGE EXAMPLES:**\n';
      content += '```\n';
      content += 'PRIVATE_LOAD()           # Start with data validation\n';
      content += 'PRIVATE_SUMMARY()        # Get company overview\n';
      content += 'PRIVATE_DCF()           # Run DCF valuation\n';
      content += 'PRIVATE_COMPS()         # Comparable analysis\n';
      content += 'PRIVATE_LBO()           # LBO modeling\n';
      content += 'PRIVATE_DASHBOARD()     # Executive summary\n';
      content += 'PRIVATE_WORKFLOW()      # Guided analysis\n';
      content += '```\n\n';

      content +=
        '**All commands work with the default private financial data and provide professional-grade analysis suitable for investment banking, private equity, and corporate finance workflows.**';

      return {
        type: 'success',
        content,
        data: {
          analysis: 'private_commands_list',
          commands: commands.map(cmd => cmd.cmd),
          totalCommands: commands.length
        }
      };
    },
    parameterSchema: { required: [], optional: [] }
  }
};
