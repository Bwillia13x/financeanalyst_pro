import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  BarChart3,
  Target,
  AlertTriangle,
  CheckCircle,
  Calculator,
  PieChart,
  Activity,
  Zap,
  Shield,
  Clock,
  Layers,
  Award,
  TrendingDown as Decline,
  Eye,
  FileText,
  BarChart2,
  LineChart,
  Timer,
  ArrowUpRight,
  ArrowDownRight,
  Gauge,
  CreditCard,
  Banknote,
  Building2,
  Users,
  Star
} from 'lucide-react';
import React, { useMemo } from 'react';

const AnalysisResults = ({
  data,
  adjustedValues,
  modelInputs,
  calculateDCF,
  formatCurrency,
  formatPercentage
}) => {
  // Calculate comprehensive financial metrics
  const analysis = useMemo(() => {
    try {
      if (!data?.statements?.incomeStatement) return null;

      const income = data.statements.incomeStatement;
      const periods = Object.keys(income.totalRevenue || {}).sort((a, b) => parseInt(a) - parseInt(b));

      if (periods.length < 2) return null;

      const latest = periods[periods.length - 1];
      const previous = periods[periods.length - 2];
      const earliest = periods[0];

      // Financial Performance Analysis - Use adjusted values for latest period when available
      const revenueLatest = adjustedValues?.totalRevenue || income.totalRevenue?.[latest] || 0;
      const revenuePrevious = income.totalRevenue?.[previous] || 0;
      const revenueEarliest = income.totalRevenue?.[earliest] || 0;

      const grossProfitLatest = adjustedValues?.grossProfit || income.grossProfit?.[latest] || 0;
      const grossProfitPrevious = income.grossProfit?.[previous] || 0;

      const operatingIncomeLatest = adjustedValues?.operatingIncome || income.operatingIncome?.[latest] || 0;
      const operatingIncomePrevious = income.operatingIncome?.[previous] || 0;

      const totalCOGSLatest = adjustedValues?.totalCostOfGoodsSold || income.totalCostOfGoodsSold?.[latest] || 0;
      const totalCOGSPrevious = income.totalCostOfGoodsSold?.[previous] || 0;

      // Growth Calculations
      const revenueGrowthYoY = revenuePrevious ? ((revenueLatest - revenuePrevious) / revenuePrevious) * 100 : 0;
      const revenueCAGR = revenueEarliest && periods.length > 2 ?
        (Math.pow(revenueLatest / revenueEarliest, 1 / (periods.length - 1)) - 1) * 100 : 0;

      const grossProfitGrowth = grossProfitPrevious ? ((grossProfitLatest - grossProfitPrevious) / grossProfitPrevious) * 100 : 0;
      const operatingIncomeGrowth = operatingIncomePrevious ? ((operatingIncomeLatest - operatingIncomePrevious) / operatingIncomePrevious) * 100 : 0;

      // Profitability Ratios (with safe calculations)
      const grossMarginLatest = (revenueLatest && revenueLatest !== 0) ? (grossProfitLatest / revenueLatest) * 100 : 0;
      const grossMarginPrevious = (revenuePrevious && revenuePrevious !== 0) ? (grossProfitPrevious / revenuePrevious) * 100 : 0;
      const operatingMarginLatest = (revenueLatest && revenueLatest !== 0) ? (operatingIncomeLatest / revenueLatest) * 100 : 0;
      const operatingMarginPrevious = (revenuePrevious && revenuePrevious !== 0) ? (operatingIncomePrevious / revenuePrevious) * 100 : 0;

      const marginImprovement = isFinite(grossMarginLatest) && isFinite(grossMarginPrevious) ? grossMarginLatest - grossMarginPrevious : 0;
      const operatingMarginChange = isFinite(operatingMarginLatest) && isFinite(operatingMarginPrevious) ? operatingMarginLatest - operatingMarginPrevious : 0;

      // DCF Analysis
      let dcfResults = null;
      if (calculateDCF) {
        try {
          dcfResults = calculateDCF(data);
        } catch (error) {
          console.error('DCF calculation error:', error);
        }
      }

      // Business Unit Analysis (Revenue Breakdown) - with safe value access
      const revenueBreakdown = [
        { name: 'Energy Devices', value: Number(income.energyDevices?.[latest]) || 0 },
        { name: 'Injectables', value: Number(income.injectables?.[latest]) || 0 },
        { name: 'Wellness', value: Number(income.wellness?.[latest]) || 0 },
        { name: 'Weightloss', value: Number(income.weightloss?.[latest]) || 0 },
        { name: 'Retail Sales', value: Number(income.retailSales?.[latest]) || 0 },
        { name: 'Surgery', value: Number(income.surgery?.[latest]) || 0 }
      ].filter(item => item.value > 0 && isFinite(item.value));

      // Advanced Financial Ratios and Metrics
      const totalAssets = income.totalAssets?.[latest] || revenueLatest * 1.2; // Estimate if not provided
      const totalEquity = income.totalEquity?.[latest] || totalAssets * 0.6; // Estimate if not provided
      const totalDebt = income.totalDebt?.[latest] || totalAssets * 0.3; // Estimate if not provided
      const currentAssets = income.currentAssets?.[latest] || totalAssets * 0.4; // Estimate if not provided
      const currentLiabilities = income.currentLiabilities?.[latest] || totalAssets * 0.2; // Estimate if not provided
      const inventory = income.inventory?.[latest] || revenueLatest * 0.15; // Estimate if not provided
      const accountsReceivable = income.accountsReceivable?.[latest] || revenueLatest * 0.1; // Estimate if not provided
      const cashAndEquivalents = income.cashAndEquivalents?.[latest] || totalAssets * 0.1; // Estimate if not provided

      // Advanced Ratios
      const returnOnAssets = (totalAssets && totalAssets !== 0) ? (operatingIncomeLatest / totalAssets) * 100 : 0;
      const returnOnEquity = (totalEquity && totalEquity !== 0) ? (operatingIncomeLatest / totalEquity) * 100 : 0;
      const debtToEquity = (totalEquity && totalEquity !== 0) ? totalDebt / totalEquity : 0;
      const currentRatio = (currentLiabilities && currentLiabilities !== 0) ? currentAssets / currentLiabilities : 0;
      const quickRatio = (currentLiabilities && currentLiabilities !== 0) ? (currentAssets - inventory) / currentLiabilities : 0;
      const assetTurnover = (totalAssets && totalAssets !== 0) ? revenueLatest / totalAssets : 0;
      const inventoryTurnover = (inventory && inventory !== 0) ? (revenueLatest * 0.7) / inventory : 0; // Assuming COGS is 70% of revenue
      const receivablesTurnover = (accountsReceivable && accountsReceivable !== 0) ? revenueLatest / accountsReceivable : 0;
      const cashRatio = (currentLiabilities && currentLiabilities !== 0) ? cashAndEquivalents / currentLiabilities : 0;
      const workingCapital = currentAssets - currentLiabilities;
      const workingCapitalRatio = (revenueLatest && revenueLatest !== 0) ? workingCapital / revenueLatest : 0;

      // Efficiency Metrics
      const operatingCycle = inventoryTurnover > 0 && receivablesTurnover > 0 ? (365 / inventoryTurnover) + (365 / receivablesTurnover) : 0;
      const cashConversionCycle = operatingCycle > 0 ? operatingCycle - 30 : 0; // Assuming 30 days payable period

      // Growth Quality Metrics
      const operatingLeverage = grossProfitPrevious !== 0 ? (operatingIncomeGrowth / revenueGrowthYoY) : 0;
      const profitabilityTrend = (operatingMarginLatest - operatingMarginPrevious) * 100;

      // Risk Metrics
      const financialLeverage = (totalEquity && totalEquity !== 0) ? totalAssets / totalEquity : 0;
      const interestCoverage = income.interestExpense?.[latest] ? operatingIncomeLatest / income.interestExpense[latest] : 0;
      const debtServiceCoverage = income.debtService?.[latest] ? operatingIncomeLatest / income.debtService[latest] : 0;

      // Market & Valuation Metrics (estimated)
      const revenuePerEmployee = income.employeeCount?.[latest] ? revenueLatest / income.employeeCount[latest] : 0;
      const revenuePerShare = income.sharesOutstanding?.[latest] ? revenueLatest / income.sharesOutstanding[latest] : 0;
      const bookValuePerShare = income.sharesOutstanding?.[latest] && totalEquity ? totalEquity / income.sharesOutstanding[latest] : 0;

      // Industry Benchmarks (Healthcare/Medical Device estimates)
      const industryBenchmarks = {
        grossMargin: 65,
        operatingMargin: 18,
        returnOnAssets: 8,
        returnOnEquity: 15,
        currentRatio: 2.5,
        debtToEquity: 0.4,
        assetTurnover: 0.8,
        revenueGrowth: 8
      };

      // Performance vs Benchmarks
      const benchmarkComparison = {
        grossMargin: grossMarginLatest - industryBenchmarks.grossMargin,
        operatingMargin: operatingMarginLatest - industryBenchmarks.operatingMargin,
        returnOnAssets: returnOnAssets - industryBenchmarks.returnOnAssets,
        returnOnEquity: returnOnEquity - industryBenchmarks.returnOnEquity,
        currentRatio: currentRatio - industryBenchmarks.currentRatio,
        debtToEquity: industryBenchmarks.debtToEquity - debtToEquity, // Lower is better
        assetTurnover: assetTurnover - industryBenchmarks.assetTurnover,
        revenueGrowth: revenueGrowthYoY - industryBenchmarks.revenueGrowth
      };

      // Comprehensive KPI Suite
      const kpis = [
        {
          title: 'Revenue Growth',
          value: `${revenueGrowthYoY > 0 ? '+' : ''}${isFinite(revenueGrowthYoY) ? revenueGrowthYoY.toFixed(1) : '0.0'}%`,
          trend: revenueGrowthYoY > 0 ? 'up' : 'down',
          description: 'Year-over-year revenue growth rate',
          icon: TrendingUp,
          benchmark: industryBenchmarks.revenueGrowth,
          performance: benchmarkComparison.revenueGrowth
        },
        {
          title: 'Gross Margin',
          value: `${isFinite(grossMarginLatest) ? grossMarginLatest.toFixed(1) : '0.0'}%`,
          trend: marginImprovement > 0 ? 'up' : 'down',
          description: `${marginImprovement > 0 ? '+' : ''}${isFinite(marginImprovement) ? marginImprovement.toFixed(1) : '0.0'}% vs prior year`,
          icon: Percent,
          benchmark: industryBenchmarks.grossMargin,
          performance: benchmarkComparison.grossMargin
        },
        {
          title: 'Operating Margin',
          value: `${isFinite(operatingMarginLatest) ? operatingMarginLatest.toFixed(1) : '0.0'}%`,
          trend: operatingMarginChange > 0 ? 'up' : 'down',
          description: `${operatingMarginChange > 0 ? '+' : ''}${isFinite(operatingMarginChange) ? operatingMarginChange.toFixed(1) : '0.0'}% vs prior year`,
          icon: BarChart3,
          benchmark: industryBenchmarks.operatingMargin,
          performance: benchmarkComparison.operatingMargin
        },
        {
          title: 'Return on Assets',
          value: `${isFinite(returnOnAssets) ? returnOnAssets.toFixed(1) : '0.0'}%`,
          trend: returnOnAssets > industryBenchmarks.returnOnAssets ? 'up' : 'down',
          description: 'Asset utilization efficiency',
          icon: Target,
          benchmark: industryBenchmarks.returnOnAssets,
          performance: benchmarkComparison.returnOnAssets
        },
        {
          title: 'Return on Equity',
          value: `${isFinite(returnOnEquity) ? returnOnEquity.toFixed(1) : '0.0'}%`,
          trend: returnOnEquity > industryBenchmarks.returnOnEquity ? 'up' : 'down',
          description: 'Shareholder value generation',
          icon: Award,
          benchmark: industryBenchmarks.returnOnEquity,
          performance: benchmarkComparison.returnOnEquity
        },
        {
          title: 'Current Ratio',
          value: `${isFinite(currentRatio) ? currentRatio.toFixed(1) : '0.0'}x`,
          trend: currentRatio > 2.0 ? 'up' : currentRatio > 1.5 ? 'neutral' : 'down',
          description: 'Short-term liquidity strength',
          icon: Shield,
          benchmark: industryBenchmarks.currentRatio,
          performance: benchmarkComparison.currentRatio
        },
        {
          title: 'Asset Turnover',
          value: `${isFinite(assetTurnover) ? assetTurnover.toFixed(1) : '0.0'}x`,
          trend: assetTurnover > industryBenchmarks.assetTurnover ? 'up' : 'down',
          description: 'Revenue per dollar of assets',
          icon: Zap,
          benchmark: industryBenchmarks.assetTurnover,
          performance: benchmarkComparison.assetTurnover
        },
        {
          title: 'Debt-to-Equity',
          value: `${isFinite(debtToEquity) ? debtToEquity.toFixed(1) : '0.0'}x`,
          trend: debtToEquity < industryBenchmarks.debtToEquity ? 'up' : 'down',
          description: 'Financial leverage position',
          icon: CreditCard,
          benchmark: industryBenchmarks.debtToEquity,
          performance: benchmarkComparison.debtToEquity
        }
      ];

      // Liquidity Analysis
      const liquidityMetrics = [
        {
          name: 'Current Ratio',
          value: currentRatio,
          formatted: `${currentRatio.toFixed(2)}x`,
          benchmark: 2.5,
          status: currentRatio >= 2.5 ? 'excellent' : currentRatio >= 2.0 ? 'good' : currentRatio >= 1.5 ? 'fair' : 'poor'
        },
        {
          name: 'Quick Ratio',
          value: quickRatio,
          formatted: `${quickRatio.toFixed(2)}x`,
          benchmark: 1.5,
          status: quickRatio >= 1.5 ? 'excellent' : quickRatio >= 1.0 ? 'good' : quickRatio >= 0.8 ? 'fair' : 'poor'
        },
        {
          name: 'Cash Ratio',
          value: cashRatio,
          formatted: `${cashRatio.toFixed(2)}x`,
          benchmark: 0.5,
          status: cashRatio >= 0.5 ? 'excellent' : cashRatio >= 0.3 ? 'good' : cashRatio >= 0.2 ? 'fair' : 'poor'
        },
        {
          name: 'Working Capital',
          value: workingCapital,
          formatted: formatCurrency(workingCapital),
          benchmark: revenueLatest * 0.15,
          status: workingCapital >= revenueLatest * 0.15 ? 'excellent' : workingCapital >= 0 ? 'good' : 'poor'
        }
      ];

      // Efficiency Analysis
      const efficiencyMetrics = [
        {
          name: 'Asset Turnover',
          value: assetTurnover,
          formatted: `${assetTurnover.toFixed(2)}x`,
          description: 'Revenue generation per asset dollar'
        },
        {
          name: 'Inventory Turnover',
          value: inventoryTurnover,
          formatted: `${inventoryTurnover.toFixed(1)}x`,
          description: 'Inventory management efficiency'
        },
        {
          name: 'Receivables Turnover',
          value: receivablesTurnover,
          formatted: `${receivablesTurnover.toFixed(1)}x`,
          description: 'Collection efficiency'
        },
        {
          name: 'Operating Cycle',
          value: operatingCycle,
          formatted: `${operatingCycle.toFixed(0)} days`,
          description: 'Cash-to-cash cycle duration'
        }
      ];

      // Risk Assessment
      const riskMetrics = [
        {
          name: 'Financial Leverage',
          value: financialLeverage,
          formatted: `${financialLeverage.toFixed(1)}x`,
          level: financialLeverage < 2 ? 'low' : financialLeverage < 3 ? 'moderate' : 'high'
        },
        {
          name: 'Debt-to-Equity',
          value: debtToEquity,
          formatted: `${debtToEquity.toFixed(2)}x`,
          level: debtToEquity < 0.3 ? 'low' : debtToEquity < 0.6 ? 'moderate' : 'high'
        },
        {
          name: 'Interest Coverage',
          value: interestCoverage,
          formatted: `${interestCoverage.toFixed(1)}x`,
          level: interestCoverage > 10 ? 'low' : interestCoverage > 5 ? 'moderate' : 'high'
        }
      ];

      return {
        periods,
        latest,
        previous,
        revenue: {
          latest: revenueLatest,
          previous: revenuePrevious,
          growth: revenueGrowthYoY,
          cagr: revenueCAGR
        },
        profitability: {
          grossMargin: grossMarginLatest,
          grossMarginChange: marginImprovement,
          operatingMargin: operatingMarginLatest,
          operatingMarginChange,
          operatingLeverage,
          profitabilityTrend
        },
        financial: {
          returnOnAssets,
          returnOnEquity,
          assetTurnover,
          totalAssets,
          totalEquity,
          totalDebt,
          workingCapital,
          workingCapitalRatio
        },
        liquidity: {
          currentRatio,
          quickRatio,
          cashRatio,
          cashAndEquivalents,
          currentAssets,
          currentLiabilities
        },
        efficiency: {
          inventoryTurnover,
          receivablesTurnover,
          operatingCycle,
          cashConversionCycle
        },
        risk: {
          debtToEquity,
          financialLeverage,
          interestCoverage,
          debtServiceCoverage
        },
        market: {
          revenuePerEmployee,
          revenuePerShare,
          bookValuePerShare
        },
        benchmarks: {
          industry: industryBenchmarks,
          comparison: benchmarkComparison
        },
        dcf: dcfResults,
        revenueBreakdown,
        kpis,
        liquidityMetrics,
        efficiencyMetrics,
        riskMetrics
      };
    } catch (error) {
      console.error('Error in AnalysisResults analysis calculation:', error);
      return null;
    }
  }, [data, calculateDCF]);

  if (!analysis) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Insufficient Data</h3>
          <p className="text-gray-500">Please ensure financial data is loaded to generate analysis results.</p>
        </div>
      </div>
    );
  }

  const MetricCard = ({ title, value, trend, description, icon: Icon, benchmark, performance }) => (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              trend === 'up' ? 'bg-green-900/30 text-green-400' :
                trend === 'down' ? 'bg-red-900/30 text-red-400' :
                  'bg-gray-700 text-gray-400'
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-300">{title}</div>
            <div className="text-xs text-gray-500 mt-1">{description}</div>
          </div>
        </div>
        {trend === 'up' && <TrendingUp className="h-5 w-5 text-green-400 flex-shrink-0" />}
        {trend === 'down' && <TrendingDown className="h-5 w-5 text-red-400 flex-shrink-0" />}
      </div>
      <div className="text-3xl font-bold text-white mb-2">{value}</div>
      {benchmark && (
        <div className="border-t border-gray-700 pt-3 mt-3">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Industry Avg:</span>
            <span className="text-gray-300">{typeof benchmark === 'number' ? benchmark.toFixed(1) + (title.includes('%') ? '%' : title.includes('x') ? 'x' : '') : benchmark}</span>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-gray-400">vs Industry:</span>
            <span
              className={`font-medium ${
                performance > 0 ? 'text-green-400' : performance < 0 ? 'text-red-400' : 'text-gray-300'
              }`}
            >
              {performance > 0 ? '+' : ''}{performance?.toFixed(1) || '0.0'}
            </span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 p-6 bg-gray-900 text-white h-full">
      {/* Header */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <BarChart3 className="h-6 w-6 text-blue-400 mr-3" />
          Financial Analysis Results
        </h2>
        <p className="text-gray-400">
          Comprehensive analysis of your company's financial performance and valuation
        </p>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {analysis.kpis.map((kpi, index) => (
          <MetricCard key={index} {...kpi} />
        ))}
      </div>

      {/* Advanced Financial Analysis Tabs */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="flex border-b border-gray-700">
          <button className="px-6 py-3 text-sm font-medium text-white bg-blue-600 border-r border-gray-700">
            Liquidity Analysis
          </button>
          <button className="px-6 py-3 text-sm font-medium text-gray-400 hover:text-white border-r border-gray-700">
            Efficiency Metrics
          </button>
          <button className="px-6 py-3 text-sm font-medium text-gray-400 hover:text-white border-r border-gray-700">
            Risk Assessment
          </button>
          <button className="px-6 py-3 text-sm font-medium text-gray-400 hover:text-white">
            Benchmarking
          </button>
        </div>

        {/* Liquidity Analysis Panel */}
        <div className="p-6">
          <div className="flex items-center mb-4">
            <Shield className="h-5 w-5 text-blue-400 mr-2" />
            <h3 className="text-lg font-semibold text-white">Liquidity Position Analysis</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analysis.liquidityMetrics.map((metric, index) => (
              <div key={index} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-200">{metric.name}</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      metric.status === 'excellent' ? 'bg-green-900/30 text-green-400' :
                        metric.status === 'good' ? 'bg-blue-900/30 text-blue-400' :
                          metric.status === 'fair' ? 'bg-yellow-900/30 text-yellow-400' :
                            'bg-red-900/30 text-red-400'
                    }`}
                  >
                    {metric.status}
                  </span>
                </div>
                <div className="text-xl font-bold text-white mb-1">{metric.formatted}</div>
                <div className="text-xs text-gray-400">
                  Benchmark: {typeof metric.benchmark === 'number' ? metric.benchmark.toFixed(1) + 'x' : formatCurrency(metric.benchmark)}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gray-750 rounded-lg border border-gray-600">
            <h4 className="font-medium text-gray-200 mb-3 flex items-center">
              <Eye className="h-4 w-4 text-blue-400 mr-2" />
              Liquidity Analysis Summary
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Working Capital:</span>
                <span className="text-white ml-2 font-medium">{formatCurrency(analysis.financial.workingCapital)}</span>
              </div>
              <div>
                <span className="text-gray-400">Cash Position:</span>
                <span className="text-white ml-2 font-medium">{formatCurrency(analysis.liquidity.cashAndEquivalents)}</span>
              </div>
              <div>
                <span className="text-gray-400">Current Assets:</span>
                <span className="text-white ml-2 font-medium">{formatCurrency(analysis.liquidity.currentAssets)}</span>
              </div>
              <div>
                <span className="text-gray-400">Current Liabilities:</span>
                <span className="text-white ml-2 font-medium">{formatCurrency(analysis.liquidity.currentLiabilities)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Efficiency & Operations Analysis */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center mb-6">
          <Zap className="h-5 w-5 text-orange-400 mr-2" />
          <h3 className="text-lg font-semibold text-white">Operational Efficiency Metrics</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {analysis.efficiencyMetrics.map((metric, index) => (
            <div key={index} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <div className="text-sm font-medium text-gray-200 mb-2">{metric.name}</div>
              <div className="text-xl font-bold text-white mb-1">{metric.formatted}</div>
              <div className="text-xs text-gray-400">{metric.description}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-750 rounded-lg p-4 border border-gray-600">
            <div className="flex items-center mb-2">
              <Timer className="h-4 w-4 text-orange-400 mr-2" />
              <span className="text-sm font-medium text-gray-200">Cash Conversion</span>
            </div>
            <div className="text-lg font-bold text-white">{analysis.efficiency.cashConversionCycle.toFixed(0)} days</div>
            <div className="text-xs text-gray-400">Time to convert inventory to cash</div>
          </div>
          <div className="bg-gray-750 rounded-lg p-4 border border-gray-600">
            <div className="flex items-center mb-2">
              <Gauge className="h-4 w-4 text-orange-400 mr-2" />
              <span className="text-sm font-medium text-gray-200">Asset Productivity</span>
            </div>
            <div className="text-lg font-bold text-white">{analysis.financial.assetTurnover.toFixed(2)}x</div>
            <div className="text-xs text-gray-400">Revenue per dollar of assets</div>
          </div>
          <div className="bg-gray-750 rounded-lg p-4 border border-gray-600">
            <div className="flex items-center mb-2">
              <Users className="h-4 w-4 text-orange-400 mr-2" />
              <span className="text-sm font-medium text-gray-200">Revenue/Employee</span>
            </div>
            <div className="text-lg font-bold text-white">
              {analysis.market.revenuePerEmployee > 0 ? formatCurrency(analysis.market.revenuePerEmployee) : 'N/A'}
            </div>
            <div className="text-xs text-gray-400">Productivity per employee</div>
          </div>
        </div>
      </div>

      {/* Risk Assessment Dashboard */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center mb-6">
          <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
          <h3 className="text-lg font-semibold text-white">Financial Risk Assessment</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {analysis.riskMetrics.map((metric, index) => (
            <div key={index} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-200">{metric.name}</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    metric.level === 'low' ? 'bg-green-900/30 text-green-400' :
                      metric.level === 'moderate' ? 'bg-yellow-900/30 text-yellow-400' :
                        'bg-red-900/30 text-red-400'
                  }`}
                >
                  {metric.level} risk
                </span>
              </div>
              <div className="text-xl font-bold text-white">{metric.formatted}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gray-750 rounded-lg border border-gray-600">
          <h4 className="font-medium text-gray-200 mb-3 flex items-center">
            <Shield className="h-4 w-4 text-red-400 mr-2" />
            Risk Analysis Summary
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Financial Leverage:</span>
              <span
                className={`ml-2 font-medium ${
                  analysis.risk.financialLeverage < 2 ? 'text-green-400' :
                    analysis.risk.financialLeverage < 3 ? 'text-yellow-400' : 'text-red-400'
                }`}
              >
                {analysis.risk.financialLeverage.toFixed(1)}x
              </span>
            </div>
            <div>
              <span className="text-gray-400">Interest Coverage:</span>
              <span
                className={`ml-2 font-medium ${
                  analysis.risk.interestCoverage > 10 ? 'text-green-400' :
                    analysis.risk.interestCoverage > 5 ? 'text-yellow-400' : 'text-red-400'
                }`}
              >
                {analysis.risk.interestCoverage.toFixed(1)}x
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Performance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Performance Trends */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
            <Activity className="h-5 w-5 text-purple-400 mr-2" />
            Performance Trends
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-200 mb-3">Revenue Analysis</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Latest Period:</span>
                  <span className="font-semibold text-white">{formatCurrency(analysis.revenue.latest)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">YoY Growth:</span>
                  <span
                    className={`font-semibold ${
                      analysis.revenue.growth > 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {analysis.revenue.growth > 0 ? '+' : ''}{analysis.revenue.growth.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">CAGR:</span>
                  <span className="font-semibold text-gray-200">{analysis.revenue.cagr.toFixed(1)}%</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-200 mb-3">Profitability Margins</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Gross Margin:</span>
                  <span className="font-semibold text-white">{analysis.profitability.grossMargin.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Operating Margin:</span>
                  <span className="font-semibold text-white">{analysis.profitability.operatingMargin.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Margin Change:</span>
                  <span
                    className={`font-semibold ${
                      analysis.profitability.grossMarginChange > 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {analysis.profitability.grossMarginChange > 0 ? '+' : ''}{analysis.profitability.grossMarginChange.toFixed(1)}pp
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Valuation Summary */}
        {analysis.dcf && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
              <DollarSign className="h-5 w-5 text-green-400 mr-2" />
              DCF Valuation Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-900/30 border border-green-700 rounded-lg">
                <div className="text-2xl font-bold text-green-400">
                  {formatCurrency(analysis.dcf.enterpriseValue)}
                </div>
                <div className="text-sm text-green-300">Enterprise Value</div>
              </div>
              <div className="text-center p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">
                  {formatCurrency(analysis.dcf.sharePrice)}
                </div>
                <div className="text-sm text-blue-300">Price per Share</div>
              </div>
              <div className="text-center p-4 bg-gray-700 border border-gray-600 rounded-lg">
                <div className="text-2xl font-bold text-gray-300">
                  {formatCurrency(analysis.dcf.terminalValue)}
                </div>
                <div className="text-sm text-gray-400">Terminal Value</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Revenue Breakdown */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
          <PieChart className="h-5 w-5 text-orange-400 mr-2" />
          Business Unit Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analysis.revenueBreakdown.map((unit, index) => {
            const percentage = analysis.revenue.latest ? (unit.value / analysis.revenue.latest) * 100 : 0;
            return (
              <div key={index} className="p-4 bg-gray-700 border border-gray-600 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-200">{unit.name}</span>
                  <span className="text-sm text-gray-400">{percentage.toFixed(1)}%</span>
                </div>
                <div className="text-lg font-semibold text-white mb-1">
                  {formatCurrency(unit.value)}
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
          <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
          Key Financial Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-200 mb-2">Strengths</h4>
            <ul className="space-y-1 text-sm text-gray-400">
              {analysis.revenue.growth > 0 && (
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Positive revenue growth trajectory
                </li>
              )}
              {analysis.profitability.grossMargin > 60 && (
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Strong gross margin above 60%
                </li>
              )}
              {analysis.profitability.grossMarginChange > 0 && (
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Improving profitability margins
                </li>
              )}
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Diversified healthcare revenue streams
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-200 mb-2">Areas for Focus</h4>
            <ul className="space-y-1 text-sm text-gray-400">
              {analysis.revenue.growth < 5 && (
                <li className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                  Revenue growth below industry benchmarks
                </li>
              )}
              {analysis.profitability.operatingMargin < 20 && (
                <li className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                  Operating margin optimization opportunities
                </li>
              )}
              <li className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                Monitor competitive positioning in key segments
              </li>
              <li className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                Consider strategic initiatives for growth acceleration
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;
