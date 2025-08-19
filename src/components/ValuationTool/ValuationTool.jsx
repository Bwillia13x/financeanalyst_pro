import React, { useState } from 'react';

import AnalysisCanvas from '../AnalysisCanvas/AnalysisCanvas';
import Icon from '../AppIcon';
import SEOHead from '../SEO/SEOHead';
import Button from '../ui/Button';
import { Card } from '../ui/Card';

import EnhancedDCFTool from './EnhancedDCFTool';
import LivingModelDCF from './LivingModelDCF';


const ValuationTool = () => {
  const [activeView, setActiveView] = useState('overview'); // 'overview', 'dcf', 'living-dcf', 'lbo', 'comp', 'canvas'

  if (activeView === 'dcf') {
    return <EnhancedDCFTool onBack={() => setActiveView('overview')} />;
  }

  if (activeView === 'living-dcf') {
    return <LivingModelDCF onBack={() => setActiveView('overview')} />;
  }

  if (activeView === 'canvas') {
    return <AnalysisCanvas />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <SEOHead
        title="Valuation Tool | FinanceAnalyst Pro"
        description="Professional DCF analysis, LBO modeling, and comparative valuation tools for investment professionals and analysts."
        canonical="/valuation-tool"
        keywords="valuation tool, DCF analysis, LBO model, comparable company analysis, investment valuation, financial analysis"
      />
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Valuation Tool</h1>
          <p className="text-gray-400">
            Professional valuation models and analysis tools
          </p>
        </div>

        {/* Featured Living Model */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-emerald-900 to-teal-900 border-emerald-700">
            <div className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center mb-4">
                    <Icon name="Zap" className="w-10 h-10 text-emerald-300 mr-4" />
                    <h2 className="text-2xl font-bold text-white">The Living Model</h2>
                    <div className="ml-3 px-2 py-1 bg-emerald-600 text-emerald-100 text-xs font-semibold rounded-full">
                      NEW
                    </div>
                  </div>
                  <p className="text-emerald-100 mb-6 text-lg leading-relaxed">
                    Experience financial modeling transformed. Real-time data integration, instantaneous calculations, and fluid time period adjustments create a living, breathing analysis that evolves with every input change.
                  </p>
                  <div className="flex flex-wrap gap-3 mb-6">
                    <span className="px-3 py-1 bg-emerald-800/50 text-emerald-200 rounded-full text-sm">
                      Real-Time Data Feeds
                    </span>
                    <span className="px-3 py-1 bg-emerald-800/50 text-emerald-200 rounded-full text-sm">
                      Instantaneous Calculations
                    </span>
                    <span className="px-3 py-1 bg-emerald-800/50 text-emerald-200 rounded-full text-sm">
                      Dynamic Time Periods
                    </span>
                    <span className="px-3 py-1 bg-emerald-800/50 text-emerald-200 rounded-full text-sm">
                      No &quot;Run&quot; Button
                    </span>
                  </div>
                  <Button
                    className="bg-white text-emerald-900 hover:bg-emerald-50 font-semibold px-8 py-3"
                    onClick={() => setActiveView('living-dcf')}
                  >
                    Experience The Living Model
                  </Button>
                </div>
                <div className="hidden lg:block">
                  <div className="w-32 h-32 bg-emerald-800/30 rounded-2xl flex items-center justify-center relative">
                    <Icon name="Activity" className="w-16 h-16 text-emerald-300" />
                    <div className="absolute inset-0 rounded-2xl bg-emerald-400/20 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Featured Analysis Canvas */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-blue-900 to-indigo-900 border-blue-700">
            <div className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center mb-4">
                    <Icon name="Sparkles" className="w-10 h-10 text-blue-300 mr-4" />
                    <h2 className="text-2xl font-bold text-white">Analysis Canvas</h2>
                  </div>
                  <p className="text-blue-100 mb-6 text-lg leading-relaxed">
                    A unified workspace that reimagines financial analysis. Start with any company and seamlessly flow between DCF modeling, comparable analysis, and scenario planning—all in one integrated environment.
                  </p>
                  <div className="flex flex-wrap gap-3 mb-6">
                    <span className="px-3 py-1 bg-blue-800/50 text-blue-200 rounded-full text-sm">
                      Company-Centric Workflow
                    </span>
                    <span className="px-3 py-1 bg-blue-800/50 text-blue-200 rounded-full text-sm">
                      Intelligent Defaults
                    </span>
                    <span className="px-3 py-1 bg-blue-800/50 text-blue-200 rounded-full text-sm">
                      Interactive Analysis
                    </span>
                    <span className="px-3 py-1 bg-blue-800/50 text-blue-200 rounded-full text-sm">
                      Minimal Design
                    </span>
                  </div>
                  <Button
                    className="bg-white text-blue-900 hover:bg-blue-50 font-semibold px-8 py-3"
                    onClick={() => setActiveView('canvas')}
                  >
                    Enter Analysis Canvas
                  </Button>
                </div>
                <div className="hidden lg:block">
                  <div className="w-32 h-32 bg-blue-800/30 rounded-2xl flex items-center justify-center">
                    <Icon name="BarChart3" className="w-16 h-16 text-blue-300" />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-gray-800 border-gray-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -translate-y-10 translate-x-10" />
            <div className="p-6 relative">
              <div className="flex items-center mb-4">
                <Icon name="Zap" className="w-8 h-8 text-emerald-400 mr-3" />
                <h3 className="text-xl font-semibold">Living Model DCF</h3>
                <div className="ml-2 px-2 py-1 bg-emerald-600 text-emerald-100 text-xs font-semibold rounded-full">
                  NEW
                </div>
              </div>
              <p className="text-gray-400 mb-4">
                Real-time, reactive DCF modeling with live data feeds and instantaneous calculations. No more &quot;run&quot; buttons—watch your model come alive.
              </p>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setActiveView('living-dcf')}
              >
                Experience The Living Model
              </Button>
            </div>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <Icon name="TrendingUp" className="w-8 h-8 text-blue-400 mr-3" />
                <h3 className="text-xl font-semibold">Enhanced DCF Analysis</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Professional DCF modeling with year-by-year projections, sensitivity analysis, and detailed financial statements
              </p>
              <Button
                className="w-full"
                onClick={() => setActiveView('dcf')}
              >
                Launch Enhanced DCF Tool
              </Button>
            </div>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <Icon name="BarChart3" className="w-8 h-8 text-green-400 mr-3" />
                <h3 className="text-xl font-semibold">Comparable Analysis</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Peer comparison and relative valuation metrics
              </p>
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </div>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <Icon name="Calculator" className="w-8 h-8 text-purple-400 mr-3" />
                <h3 className="text-xl font-semibold">LBO Analysis</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Leveraged buyout modeling and returns analysis
              </p>
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </div>
          </Card>
        </div>

        <div className="mt-8">
          <Card className="bg-gray-800 border-gray-700">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">Enhanced DCF Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-blue-400 mb-2">Year-by-Year Modeling</h4>
                  <ul className="text-gray-400 text-sm space-y-1">
                    <li>• Individual assumptions for each projection year</li>
                    <li>• Revenue growth, margins, tax rates, and capex</li>
                    <li>• Working capital and D&A projections</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-green-400 mb-2">Professional Calculations</h4>
                  <ul className="text-gray-400 text-sm space-y-1">
                    <li>• Proper Unlevered Free Cash Flow calculation</li>
                    <li>• Enterprise to Equity value bridge</li>
                    <li>• Balance sheet integration</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-400 mb-2">Advanced Analytics</h4>
                  <ul className="text-gray-400 text-sm space-y-1">
                    <li>• WACC and terminal growth sensitivity analysis</li>
                    <li>• Interactive projection tables</li>
                    <li>• Cash flow visualization charts</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-orange-400 mb-2">User Experience</h4>
                  <ul className="text-gray-400 text-sm space-y-1">
                    <li>• Simple and detailed input modes</li>
                    <li>• Real-time calculation updates</li>
                    <li>• Export capabilities</li>
                  </ul>
                </div>
              </div>
              <div className="mt-6">
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => setActiveView('dcf')}
                >
                  Try Enhanced DCF Tool
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-8">
          <Card className="bg-gray-800 border-gray-700">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">Quick Access Terminal</h3>
              <p className="text-gray-400 mb-4">
                Use the enhanced terminal interface for advanced valuation commands:
              </p>
              <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
                <div className="text-green-400">$ DCF(AAPL)</div>
                <div className="text-green-400">$ LBO(TSLA)</div>
                <div className="text-green-400">$ COMP(MSFT)</div>
                <div className="text-green-400">$ HELP(&quot;VALUATION&quot;)</div>
              </div>
              <div className="mt-4">
                <Button disabled>
                  Terminal Interface - Coming Soon
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ValuationTool;
