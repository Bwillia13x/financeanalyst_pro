import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  LineChart,
  PieChart,
  GitBranch,
  Activity,
  Plus,
  X,
  ChevronRight,
  Lightbulb,
  Target,
  Zap
} from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';

const AutomatedChartingSuggestions = ({
  financialData,
  currentView,
  analysisContext,
  onCreateChart,
  onDismiss
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [dismissedSuggestions, setDismissedSuggestions] = useState(new Set());

  // Chart type configurations
  const chartTypes = {
    line: {
      icon: LineChart,
      name: 'Line Chart',
      description: 'Show trends over time',
      color: 'text-blue-500 bg-blue-50'
    },
    bar: {
      icon: BarChart3,
      name: 'Bar Chart',
      description: 'Compare values across categories',
      color: 'text-emerald-500 bg-emerald-50'
    },
    scatter: {
      icon: GitBranch,
      name: 'Scatter Plot',
      description: 'Explore relationships between metrics',
      color: 'text-purple-500 bg-purple-50'
    },
    pie: {
      icon: PieChart,
      name: 'Pie Chart',
      description: 'Show composition and proportions',
      color: 'text-amber-500 bg-amber-50'
    },
    waterfall: {
      icon: Activity,
      name: 'Waterfall Chart',
      description: 'Show sequential changes in values',
      color: 'text-teal-500 bg-teal-50'
    }
  };

  // Analyze financial data patterns and generate suggestions
  const analyzeDataPatterns = useMemo(() => {
    if (!financialData?.statements?.incomeStatement) return [];

    const patterns = [];
    const income = financialData.statements.incomeStatement;
    const periods = financialData.periods || [];

    // Check for revenue trend analysis
    if (income.totalRevenue && periods.length >= 3) {
      const revenues = periods.map((_, idx) => income.totalRevenue[idx]).filter(v => v != null);
      if (revenues.length >= 3) {
        patterns.push({
          id: 'revenue-trend',
          type: 'line',
          title: 'Revenue Growth Trend',
          description: 'Visualize revenue performance over time with growth rate analysis',
          priority: 'high',
          data: {
            xAxis: periods,
            yAxis: revenues,
            metrics: ['Total Revenue', 'Growth Rate'],
            chartType: 'line'
          },
          insight: `Revenue shows ${revenues[revenues.length - 1] > revenues[0] ? 'positive' : 'negative'} trend`,
          relevance: currentView === 'analysis' ? 0.9 : 0.7
        });
      }
    }

    // Revenue composition analysis
    const revenueSegments = [
      'energyDevices',
      'injectables',
      'wellness',
      'weightloss',
      'retailSales',
      'surgery'
    ];
    const latestPeriod = periods.length - 1;
    const segmentData = revenueSegments
      .map(segment => ({
        name: segment.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        value: income[segment]?.[latestPeriod] || 0
      }))
      .filter(segment => segment.value > 0);

    if (segmentData.length >= 3) {
      patterns.push({
        id: 'revenue-composition',
        type: 'pie',
        title: 'Revenue Composition Analysis',
        description: 'Break down revenue by business segments',
        priority: 'medium',
        data: {
          segments: segmentData,
          chartType: 'pie'
        },
        insight: `${segmentData.length} active revenue segments identified`,
        relevance: currentView === 'data' ? 0.8 : 0.6
      });
    }

    // Margin analysis over time
    if (income.totalRevenue && income.operatingIncome && periods.length >= 3) {
      const margins = periods
        .map((_, idx) => {
          const revenue = income.totalRevenue[idx];
          const opIncome = income.operatingIncome[idx];
          return revenue > 0 ? (opIncome / revenue) * 100 : 0;
        })
        .filter(m => m !== 0);

      if (margins.length >= 3) {
        patterns.push({
          id: 'margin-trend',
          type: 'line',
          title: 'Operating Margin Trend',
          description: 'Track profitability efficiency over time',
          priority: 'high',
          data: {
            xAxis: periods,
            yAxis: margins,
            format: 'percentage',
            chartType: 'line'
          },
          insight: `Operating margin ${margins[margins.length - 1] > margins[0] ? 'improving' : 'declining'}`,
          relevance: currentView === 'analysis' ? 0.9 : 0.7
        });
      }
    }

    // Cost structure analysis
    const costCategories = [
      'totalCostOfGoodsSold',
      'totalSalariesBenefits',
      'totalOperatingExpense'
    ];
    const costData = costCategories
      .map(category => ({
        name: category
          .replace(/total|([A-Z])/g, ' $1')
          .trim()
          .replace(/^./, str => str.toUpperCase()),
        value: income[category]?.[latestPeriod] || 0
      }))
      .filter(cost => cost.value > 0);

    if (costData.length >= 2) {
      patterns.push({
        id: 'cost-structure',
        type: 'bar',
        title: 'Cost Structure Analysis',
        description: 'Compare major cost categories',
        priority: 'medium',
        data: {
          categories: costData,
          chartType: 'bar'
        },
        insight: `${costData.length} major cost categories tracked`,
        relevance: currentView === 'modeling' ? 0.8 : 0.6
      });
    }

    // Revenue vs Operating Income correlation
    if (income.totalRevenue && income.operatingIncome && periods.length >= 4) {
      const revenueData = periods.map((_, idx) => income.totalRevenue[idx] || 0);
      const opIncomeData = periods.map((_, idx) => income.operatingIncome[idx] || 0);

      if (revenueData.some(v => v > 0) && opIncomeData.some(v => v > 0)) {
        patterns.push({
          id: 'revenue-operating-correlation',
          type: 'scatter',
          title: 'Revenue vs Operating Income',
          description: 'Analyze operational efficiency relationship',
          priority: 'medium',
          data: {
            xAxis: revenueData,
            yAxis: opIncomeData,
            xLabel: 'Revenue',
            yLabel: 'Operating Income',
            chartType: 'scatter'
          },
          insight: 'Explore operational leverage and efficiency',
          relevance: analysisContext === 'dcf' ? 0.8 : 0.6
        });
      }
    }

    // Cash flow waterfall (if cash flow data available)
    if (financialData.statements?.cashFlowStatement) {
      const cashFlow = financialData.statements.cashFlowStatement;
      const flowComponents = [
        { name: 'Operating Cash Flow', value: cashFlow.operatingCashFlow?.[latestPeriod] || 0 },
        { name: 'Investing Cash Flow', value: cashFlow.investingCashFlow?.[latestPeriod] || 0 },
        { name: 'Financing Cash Flow', value: cashFlow.financingCashFlow?.[latestPeriod] || 0 }
      ].filter(component => component.value !== 0);

      if (flowComponents.length >= 2) {
        patterns.push({
          id: 'cash-flow-waterfall',
          type: 'waterfall',
          title: 'Cash Flow Components',
          description: 'Visualize cash flow generation and usage',
          priority: 'high',
          data: {
            components: flowComponents,
            chartType: 'waterfall'
          },
          insight: 'Understand cash flow dynamics',
          relevance: currentView === 'analysis' ? 0.9 : 0.7
        });
      }
    }

    return patterns.sort((a, b) => {
      // Sort by priority and relevance
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const aScore = priorityWeight[a.priority] + a.relevance;
      const bScore = priorityWeight[b.priority] + b.relevance;
      return bScore - aScore;
    });
  }, [financialData, currentView, analysisContext]);

  // Filter out dismissed suggestions
  const activeSuggestions = useMemo(() => {
    return analyzeDataPatterns.filter(pattern => !dismissedSuggestions.has(pattern.id));
  }, [analyzeDataPatterns, dismissedSuggestions]);

  // Update suggestions when patterns change
  useEffect(() => {
    setSuggestions(activeSuggestions.slice(0, 4)); // Show max 4 suggestions
  }, [activeSuggestions]);

  const handleDismiss = suggestionId => {
    setDismissedSuggestions(prev => new Set([...prev, suggestionId]));
    if (onDismiss) {
      onDismiss(suggestionId);
    }
  };

  const handleCreateChart = suggestion => {
    if (onCreateChart) {
      onCreateChart(suggestion);
    }
  };

  const getPriorityColor = priority => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-gray-200 bg-gray-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getPriorityIcon = priority => {
    switch (priority) {
      case 'high':
        return <Zap size={12} className="text-red-500" />;
      case 'medium':
        return <Target size={12} className="text-yellow-500" />;
      case 'low':
        return <Lightbulb size={12} className="text-gray-500" />;
      default:
        return <Lightbulb size={12} className="text-gray-500" />;
    }
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 rounded-lg">
            <BarChart3 size={16} className="text-blue-600" />
          </div>
          <h3 className="font-semibold text-slate-900">Smart Chart Suggestions</h3>
          <div className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
            {suggestions.length} suggested
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {suggestions.map((suggestion, index) => {
            const chartConfig = chartTypes[suggestion.type];
            const ChartIcon = chartConfig.icon;

            return (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.1 }}
                className={`relative p-4 rounded-lg border ${getPriorityColor(suggestion.priority)} hover:shadow-md transition-all duration-200 group`}
              >
                {/* Dismiss button */}
                <button
                  onClick={() => handleDismiss(suggestion.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-white rounded-full transition-all duration-200"
                >
                  <X size={14} className="text-slate-400 hover:text-slate-600" />
                </button>

                {/* Priority indicator */}
                <div className="flex items-center gap-1 mb-2">
                  {getPriorityIcon(suggestion.priority)}
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    {suggestion.priority} Priority
                  </span>
                </div>

                {/* Chart type and title */}
                <div className="flex items-start gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${chartConfig.color}`}>
                    <ChartIcon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 text-sm mb-1">
                      {suggestion.title}
                    </h4>
                    <p className="text-xs text-slate-600 mb-2">{suggestion.description}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md font-medium">
                        {chartConfig.name}
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-500">{suggestion.insight}</span>
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={() => handleCreateChart(suggestion)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-md transition-colors duration-200"
                >
                  <Plus size={14} />
                  Create Chart
                  <ChevronRight size={14} />
                </button>

                {/* Relevance indicator */}
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>Relevance to current view</span>
                  <div className="flex items-center gap-1">
                    <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${suggestion.relevance * 100}%` }}
                      />
                    </div>
                    <span className="font-medium">{Math.round(suggestion.relevance * 100)}%</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Show more suggestions link */}
      {activeSuggestions.length > suggestions.length && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setSuggestions(activeSuggestions.slice(0, suggestions.length + 2))}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Show {Math.min(2, activeSuggestions.length - suggestions.length)} more suggestions
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default AutomatedChartingSuggestions;
