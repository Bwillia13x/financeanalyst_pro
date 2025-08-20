import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, TrendingUp, Target } from 'lucide-react';
import Header from '../components/ui/Header';
import SEOHead from '../components/SEO/SEOHead';
import AIInsightsPanel from '../components/AI/AIInsightsPanel';
import AIFinancialAssistant from '../components/AIAssistant/AIFinancialAssistant';
import { Card } from '../components/ui/Card';
import { useKeyboardShortcutsContext } from '../components/ui/KeyboardShortcutsProvider';

const AIInsights = () => {
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [financialData, setFinancialData] = useState({
    revenue: 1250000000,
    netIncome: 187500000,
    totalAssets: 2100000000,
    totalDebt: 450000000,
    marketCap: 3200000000,
    sector: 'Technology',
    industry: 'Software'
  });
  const { updateCommandContext } = useKeyboardShortcutsContext();

  // Publish contextual command data for AI Insights
  useEffect(() => {
    updateCommandContext({
      page: 'ai-insights',
      selectedAsset,
      sector: financialData.sector,
      industry: financialData.industry
    });
  }, [updateCommandContext, selectedAsset, financialData.sector, financialData.industry]);

  const handleInsightClick = (insight) => {
    console.log('Insight clicked:', insight);
    // Handle insight interaction
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <SEOHead
        title="AI Insights & Analysis | FinanceAnalyst Pro"
        description="Leverage AI-powered financial analysis, automated insights, and intelligent recommendations for enhanced investment decision-making."
        canonical="/ai-insights"
        keywords="AI financial analysis, automated insights, machine learning finance, intelligent recommendations, AI-powered valuation"
      />
      
      <Header />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Brain className="w-8 h-8 text-indigo-600 mr-3" />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              AI Insights & Analysis
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 max-w-3xl">
            Harness the power of artificial intelligence for advanced financial analysis, 
            automated pattern recognition, and intelligent investment recommendations.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main AI Insights Panel */}
          <div className="xl:col-span-2">
            <Card className="p-6">
              <div className="flex items-center mb-6">
                <Sparkles className="w-6 h-6 text-indigo-600 mr-2" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Intelligent Financial Analysis
                </h2>
              </div>
              <AIInsightsPanel
                financialData={financialData}
                industry={financialData.industry.toLowerCase()}
                onInsightClick={handleInsightClick}
                className="border-none shadow-none p-0"
              />
            </Card>
          </div>

          {/* AI Assistant Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            {/* AI Financial Assistant */}
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <Target className="w-6 h-6 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  AI Assistant
                </h3>
              </div>
              <AIFinancialAssistant />
            </Card>

            {/* Quick Metrics */}
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <TrendingUp className="w-6 h-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Key Metrics
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Revenue</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    ${(financialData.revenue / 1000000).toFixed(0)}M
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Net Income</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    ${(financialData.netIncome / 1000000).toFixed(0)}M
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Market Cap</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    ${(financialData.marketCap / 1000000).toFixed(0)}M
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">ROE</span>
                  <span className="font-semibold text-green-600">
                    {((financialData.netIncome / (financialData.totalAssets - financialData.totalDebt)) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </Card>

            {/* AI Recommendations */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                AI Recommendations
              </h3>
              <div className="space-y-3">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <div className="text-sm font-medium text-green-800 dark:text-green-200">
                    Strong Buy Signal
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Revenue growth trajectory indicates continued expansion
                  </div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Monitor Debt Levels
                  </div>
                  <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    Debt-to-equity ratio warrants attention
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AIInsights;