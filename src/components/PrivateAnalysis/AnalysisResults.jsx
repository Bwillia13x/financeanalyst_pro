import React, { useMemo } from 'react';
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
  Activity
} from 'lucide-react';

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

    // Profitability Ratios
    const grossMarginLatest = revenueLatest ? (grossProfitLatest / revenueLatest) * 100 : 0;
    const grossMarginPrevious = revenuePrevious ? (grossProfitPrevious / revenuePrevious) * 100 : 0;
    const operatingMarginLatest = revenueLatest ? (operatingIncomeLatest / revenueLatest) * 100 : 0;
    const operatingMarginPrevious = revenuePrevious ? (operatingIncomePrevious / revenuePrevious) * 100 : 0;
    
    const marginImprovement = grossMarginLatest - grossMarginPrevious;
    const operatingMarginChange = operatingMarginLatest - operatingMarginPrevious;

    // DCF Analysis
    let dcfResults = null;
    if (calculateDCF) {
      try {
        dcfResults = calculateDCF(data);
      } catch (error) {
        console.error('DCF calculation error:', error);
      }
    }

    // Business Unit Analysis (Revenue Breakdown)
    const revenueBreakdown = [
      { name: 'Energy Devices', value: income.energyDevices?.[latest] || 0 },
      { name: 'Injectables', value: income.injectables?.[latest] || 0 },
      { name: 'Wellness', value: income.wellness?.[latest] || 0 },
      { name: 'Weightloss', value: income.weightloss?.[latest] || 0 },
      { name: 'Retail Sales', value: income.retailSales?.[latest] || 0 },
      { name: 'Surgery', value: income.surgery?.[latest] || 0 }
    ].filter(item => item.value > 0);

    // Key Performance Indicators
    const kpis = [
      {
        title: 'Revenue Growth',
        value: `${revenueGrowthYoY > 0 ? '+' : ''}${revenueGrowthYoY.toFixed(1)}%`,
        trend: revenueGrowthYoY > 0 ? 'up' : 'down',
        description: 'Year-over-year revenue growth rate'
      },
      {
        title: 'Gross Margin',
        value: `${grossMarginLatest.toFixed(1)}%`,
        trend: marginImprovement > 0 ? 'up' : 'down',
        description: `${marginImprovement > 0 ? '+' : ''}${marginImprovement.toFixed(1)}% vs prior year`
      },
      {
        title: 'Operating Margin',
        value: `${operatingMarginLatest.toFixed(1)}%`,
        trend: operatingMarginChange > 0 ? 'up' : 'down',
        description: `${operatingMarginChange > 0 ? '+' : ''}${operatingMarginChange.toFixed(1)}% vs prior year`
      },
      {
        title: 'Revenue CAGR',
        value: `${revenueCAGR > 0 ? '+' : ''}${revenueCAGR.toFixed(1)}%`,
        trend: revenueCAGR > 5 ? 'up' : revenueCAGR > 0 ? 'neutral' : 'down',
        description: `Compound annual growth rate over ${periods.length - 1} years`
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
        operatingMarginChange
      },
      dcf: dcfResults,
      revenueBreakdown,
      kpis
    };
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

  const MetricCard = ({ title, value, trend, description, icon: Icon }) => (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            trend === 'up' ? 'bg-green-900/30 text-green-400' : 
            trend === 'down' ? 'bg-red-900/30 text-red-400' : 
            'bg-gray-700 text-gray-400'
          }`}>
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
      <div className="text-3xl font-bold text-white">{value}</div>
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
                  <span className={`font-semibold ${
                    analysis.revenue.growth > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
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
                  <span className={`font-semibold ${
                    analysis.profitability.grossMarginChange > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
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
                  ></div>
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
