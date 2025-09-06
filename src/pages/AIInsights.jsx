import { Brain, Sparkles, TrendingUp, Target } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import AIInsightsPanel from '../components/AI/AIInsightsPanel';
import AIFinancialAssistant from '../components/AIAssistant/AIFinancialAssistant';
import SEOHead from '../components/SEO/SEOHead';
import { Card } from '../components/ui/Card';
import Header from '../components/ui/Header';
import { useKeyboardShortcutsContext } from '../components/ui/KeyboardShortcutsProvider';

const AIInsights = () => {
  const [selectedAsset, _setSelectedAsset] = useState(null);
  const [financialData, _setFinancialData] = useState({
    statements: {
      income: {
        '2023': {
          totalRevenue: 1250000000,
          netIncome: 187500000,
          operatingIncome: 250000000,
          totalCostOfGoodsSold: 750000000,
          ebitda: 312500000,
          freeCashFlow: 156250000
        },
        '2022': {
          totalRevenue: 1125000000,
          netIncome: 168750000,
          operatingIncome: 225000000,
          totalCostOfGoodsSold: 675000000,
          ebitda: 281250000,
          freeCashFlow: 140625000
        }
      }
    },
    assumptions: {
      sharesOutstanding: 100000000,
      sharePrice: 32,
      employeeCount: 5000
    },
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

  const handleInsightClick = insight => {
    console.log('Insight clicked:', insight);
    // Handle insight interaction
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="AI Insights & Analysis | Valor-IVX"
        description="Leverage AI-powered financial analysis, automated insights, and intelligent recommendations for enhanced investment decision-making."
        canonical="/ai-insights"
        keywords="AI financial analysis, automated insights, machine learning finance, intelligent recommendations, AI-powered valuation"
      />

      <Header />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Brain className="w-8 h-8 text-primary mr-3" />
            <h1 className="text-3xl font-bold text-foreground">
              AI Insights & Analysis
            </h1>
          </div>
          <p className="text-foreground-secondary max-w-3xl">
            Harness the power of artificial intelligence for advanced financial analysis, automated
            pattern recognition, and intelligent investment recommendations.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main AI Insights Panel */}
          <div className="xl:col-span-2">
            <Card className="p-6">
              <div className="flex items-center mb-6">
                <Sparkles className="w-6 h-6 text-accent mr-2" />
                <h2 className="text-xl font-semibold text-foreground">
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
                <Target className="w-6 h-6 text-success mr-2" />
                <h3 className="text-lg font-semibold text-foreground">
                  AI Assistant
                </h3>
              </div>
              <AIFinancialAssistant />
            </Card>

            {/* Quick Metrics */}
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <TrendingUp className="w-6 h-6 text-primary mr-2" />
                <h3 className="text-lg font-semibold text-foreground">
                  Key Metrics
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Revenue</span>
                  <span className="font-semibold text-foreground">
                    ${(financialData.statements.income['2023'].totalRevenue / 1000000).toFixed(0)}M
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Net Income</span>
                  <span className="font-semibold text-foreground">
                    ${(financialData.statements.income['2023'].netIncome / 1000000).toFixed(0)}M
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Market Cap</span>
                  <span className="font-semibold text-foreground">
                    ${(financialData.assumptions.sharesOutstanding * financialData.assumptions.sharePrice / 1000000).toFixed(0)}M
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Employees</span>
                  <span className="font-semibold text-success">
                    {financialData.assumptions.employeeCount.toLocaleString()}
                  </span>
                </div>
              </div>
            </Card>

            {/* AI Recommendations */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                AI Recommendations
              </h3>
              <div className="space-y-3">
                <div className="bg-success/5 border border-success/20 rounded-lg p-3">
                  <div className="text-sm font-medium text-success">
                    Strong Buy Signal
                  </div>
                  <div className="text-xs text-success mt-1">
                    Revenue growth trajectory indicates continued expansion
                  </div>
                </div>
                <div className="bg-warning/5 border border-warning/20 rounded-lg p-3">
                  <div className="text-sm font-medium text-warning">
                    Monitor Debt Levels
                  </div>
                  <div className="text-xs text-warning mt-1">
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
