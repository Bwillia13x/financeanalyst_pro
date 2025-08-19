import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  BarChart3,
  Info,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Target,
  Users,
  Lightbulb,
  X
} from 'lucide-react';
import React, { useState, useMemo } from 'react';

const ContextualInsightsSidebar = ({
  financialData,
  currentMetric,
  analysisContext = 'general',
  onInsightClick,
  isVisible = true,
  onToggle
}) => {
  const [expandedSections, setExpandedSections] = useState({
    assumptions: true,
    benchmarks: true,
    insights: true,
    suggestions: false
  });

  // Industry benchmark data (in real implementation, this would come from APIs)
  const _industryBenchmarks = useMemo(() => ({
    healthcare: {
      revenueGrowth: { min: 8, median: 15, max: 25, unit: '%' },
      ebitdaMargin: { min: 18, median: 28, max: 40, unit: '%' },
      grossMargin: { min: 65, median: 75, max: 85, unit: '%' },
      roe: { min: 12, median: 18, max: 25, unit: '%' }
    },
    technology: {
      revenueGrowth: { min: 15, median: 25, max: 50, unit: '%' },
      ebitdaMargin: { min: 20, median: 35, max: 50, unit: '%' },
      grossMargin: { min: 70, median: 80, max: 90, unit: '%' },
      roe: { min: 15, median: 22, max: 35, unit: '%' }
    },
    manufacturing: {
      revenueGrowth: { min: 3, median: 8, max: 15, unit: '%' },
      ebitdaMargin: { min: 10, median: 18, max: 25, unit: '%' },
      grossMargin: { min: 25, median: 35, max: 45, unit: '%' },
      roe: { min: 8, median: 15, max: 22, unit: '%' }
    }
  }), []);

  // Generate contextual insights based on current analysis
  const generateContextualInsights = () => {
    const insights = [];

    if (!financialData?.statements?.incomeStatement) {
      return [{
        type: 'info',
        title: 'Getting Started',
        content: 'Import financial data to see contextual insights and benchmarks.',
        action: 'Import Data'
      }];
    }

    const income = financialData.statements.incomeStatement;
    const latestRevenue = income.totalRevenue?.[2] || 0;
    const latestOperatingIncome = income.operatingIncome?.[2] || 0;

    // Revenue-based insights
    if (latestRevenue > 0) {
      const operatingMargin = (latestOperatingIncome / latestRevenue) * 100;

      insights.push({
        type: 'benchmark',
        title: 'Operating Margin Analysis',
        content: `Current operating margin of ${operatingMargin.toFixed(1)}% compares to healthcare industry median of 28%.`,
        metric: operatingMargin,
        benchmark: 28,
        status: operatingMargin >= 28 ? 'above' : operatingMargin >= 20 ? 'within' : 'below'
      });
    }

    // Context-specific insights
    if (analysisContext === 'dcf') {
      insights.push({
        type: 'assumption',
        title: 'DCF Model Assumptions',
        content: 'Consider industry-specific discount rates and terminal growth assumptions.',
        suggestions: [
          'Healthcare companies typically use 8-12% WACC',
          'Terminal growth rates should reflect long-term GDP growth (2-3%)',
          'Consider regulatory risks in discount rate adjustments'
        ]
      });
    }

    if (currentMetric?.includes('revenue')) {
      insights.push({
        type: 'insight',
        title: 'Revenue Growth Drivers',
        content: 'Analyze revenue composition and growth sustainability.',
        suggestions: [
          'Break down revenue by service line',
          'Assess recurring vs. one-time revenue',
          'Evaluate market expansion opportunities'
        ]
      });
    }

    return insights;
  };

  const contextualInsights = generateContextualInsights();

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderBenchmarkBar = (current, benchmark, min, max) => {
    const range = max - min;
    const currentPos = Math.max(0, Math.min(100, ((current - min) / range) * 100));
    const benchmarkPos = Math.max(0, Math.min(100, ((benchmark - min) / range) * 100));

    return (
      <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="absolute top-0 h-full bg-blue-200 rounded-full"
          style={{ width: `${benchmarkPos}%` }}
        />
        <div
          className="absolute top-0 h-full w-1 bg-blue-600 rounded-full"
          style={{ left: `${benchmarkPos}%` }}
        />
        <div
          className="absolute top-0 h-full w-1 bg-amber-500 rounded-full"
          style={{ left: `${currentPos}%` }}
        />
      </div>
    );
  };

  const renderInsightItem = (insight, index) => {
    const icons = {
      info: Info,
      benchmark: Target,
      assumption: AlertTriangle,
      insight: Lightbulb
    };

    const colors = {
      info: 'text-blue-500 bg-blue-50',
      benchmark: 'text-emerald-500 bg-emerald-50',
      assumption: 'text-amber-500 bg-amber-50',
      insight: 'text-purple-500 bg-purple-50'
    };

    const Icon = icons[insight.type] || Info;
    const colorClass = colors[insight.type] || colors.info;

    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        className="p-4 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${colorClass}`}>
            <Icon size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-900 text-sm mb-2">{insight.title}</h4>
            <p className="text-sm text-slate-600 mb-3">{insight.content}</p>

            {insight.metric !== undefined && insight.benchmark !== undefined && (
              <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Current: {insight.metric.toFixed(1)}%</span>
                  <span>Benchmark: {insight.benchmark}%</span>
                </div>
                {renderBenchmarkBar(insight.metric, insight.benchmark, 0, Math.max(insight.benchmark * 1.5, insight.metric * 1.2))}
              </div>
            )}

            {insight.suggestions && (
              <div className="mt-3">
                <div className="space-y-1">
                  {insight.suggestions.map((suggestion, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                      <ChevronRight size={12} className="text-slate-400 mt-0.5 flex-shrink-0" />
                      <span>{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {insight.action && (
              <button
                onClick={() => onInsightClick?.(insight)}
                className="mt-3 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-md transition-colors"
              >
                {insight.action}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      className="fixed right-0 top-16 bottom-0 w-80 bg-slate-50 border-l border-slate-200 shadow-xl z-40 overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 rounded-lg">
            <BarChart3 size={16} className="text-blue-600" />
          </div>
          <h3 className="font-semibold text-slate-900">Contextual Insights</h3>
        </div>
        {onToggle && (
          <button
            onClick={onToggle}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={16} className="text-slate-500" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Assumptions Section */}
          <div className="bg-white rounded-lg border border-slate-200">
            <button
              onClick={() => toggleSection('assumptions')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Target size={16} className="text-amber-600" />
                <span className="font-medium text-slate-900">Key Assumptions</span>
              </div>
              {expandedSections.assumptions ?
                <ChevronDown size={16} className="text-slate-400" /> :
                <ChevronRight size={16} className="text-slate-400" />
              }
            </button>

            <AnimatePresence>
              {expandedSections.assumptions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-100"
                >
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">Discount Rate</span>
                      <span className="font-mono text-slate-900">10.0%</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">Terminal Growth</span>
                      <span className="font-mono text-slate-900">2.5%</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">Tax Rate</span>
                      <span className="font-mono text-slate-900">25.0%</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Industry Benchmarks Section */}
          <div className="bg-white rounded-lg border border-slate-200">
            <button
              onClick={() => toggleSection('benchmarks')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Users size={16} className="text-emerald-600" />
                <span className="font-medium text-slate-900">Industry Benchmarks</span>
              </div>
              {expandedSections.benchmarks ?
                <ChevronDown size={16} className="text-slate-400" /> :
                <ChevronRight size={16} className="text-slate-400" />
              }
            </button>

            <AnimatePresence>
              {expandedSections.benchmarks && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-100"
                >
                  <div className="p-4 space-y-4">
                    <div className="text-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-600">Revenue Growth</span>
                        <span className="text-xs text-slate-500">Healthcare Industry</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>8%</span>
                        <span className="font-medium">15% (median)</span>
                        <span>25%</span>
                      </div>
                      {renderBenchmarkBar(12, 15, 8, 25)}
                    </div>

                    <div className="text-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-600">EBITDA Margin</span>
                        <span className="text-xs text-slate-500">Healthcare Industry</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>18%</span>
                        <span className="font-medium">28% (median)</span>
                        <span>40%</span>
                      </div>
                      {renderBenchmarkBar(24, 28, 18, 40)}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Contextual Insights */}
          <div className="space-y-3">
            {contextualInsights.map((insight, index) => renderInsightItem(insight, index))}
          </div>

          {/* Automated Suggestions */}
          <div className="bg-white rounded-lg border border-slate-200">
            <button
              onClick={() => toggleSection('suggestions')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Lightbulb size={16} className="text-purple-600" />
                <span className="font-medium text-slate-900">Smart Suggestions</span>
              </div>
              {expandedSections.suggestions ?
                <ChevronDown size={16} className="text-slate-400" /> :
                <ChevronRight size={16} className="text-slate-400" />
              }
            </button>

            <AnimatePresence>
              {expandedSections.suggestions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-100"
                >
                  <div className="p-4 space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <BarChart3 size={14} className="text-blue-600 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-blue-900 mb-1">
                          Create Revenue vs CapEx Chart
                        </div>
                        <div className="text-xs text-blue-700">
                          Visualize the relationship between revenue growth and capital expenditure
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg">
                      <TrendingUp size={14} className="text-emerald-600 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-emerald-900 mb-1">
                          Add Sensitivity Analysis
                        </div>
                        <div className="text-xs text-emerald-700">
                          Test how valuation changes with different assumptions
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ContextualInsightsSidebar;
