import React, { useState, useEffect } from 'react';

import { EnhancedTooltip } from '../components/ui/charts/ChartTheme';
import RevenueBreakdown from '../components/ui/charts/RevenueBreakdown';
import SensitivityHeatmap from '../components/ui/charts/SensitivityHeatmap';
import Header from '../components/ui/Header';

// Enhanced Chart Components

// Sample Data
const revenueData = [
  { name: 'Product Sales', value: 4500000 },
  { name: 'Services', value: 2800000 },
  { name: 'Licensing', value: 1200000 },
  { name: 'Consulting', value: 800000 },
  { name: 'Support', value: 600000 }
];

const sensitivityData = [
  [-2.3, -1.8, -1.2, -0.7, -0.2, 0.3, 0.8, 1.3],
  [-1.9, -1.4, -0.8, -0.3, 0.2, 0.7, 1.2, 1.7],
  [-1.5, -1.0, -0.4, 0.1, 0.6, 1.1, 1.6, 2.1],
  [-1.1, -0.6, 0.0, 0.5, 1.0, 1.5, 2.0, 2.5],
  [-0.7, -0.2, 0.4, 0.9, 1.4, 1.9, 2.4, 2.9],
  [-0.3, 0.2, 0.8, 1.3, 1.8, 2.3, 2.8, 3.3]
];

const xLabels = ['5%', '10%', '15%', '20%', '25%', '30%', '35%', '40%'];
const yLabels = [
  'Revenue Growth',
  'Cost Reduction',
  'Margin Improvement',
  'Tax Rate',
  'WACC Change',
  'Terminal Growth'
];

const EnhancedChartsDemo = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'revenue', label: 'Revenue Analysis', icon: '💰' },
    { id: 'sensitivity', label: 'Sensitivity Analysis', icon: '🎯' },
    { id: 'features', label: 'Features', icon: '✨' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-16 p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Enhanced Charts Showcase</h1>
          <p className="text-foreground-secondary">
            Interactive financial visualizations with improved color schemes, tooltips, and user
            experience.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-background-secondary p-1 rounded-lg">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-foreground-secondary hover:text-foreground hover:bg-background/50'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Enhanced Financial Charts
                </h2>
                <p className="text-foreground-secondary max-w-2xl mx-auto">
                  Our charts now feature improved color schemes using financial domain colors,
                  enhanced tooltips with more detailed information, interactive controls, and better
                  accessibility.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="p-6 bg-background-secondary rounded-lg">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Revenue Breakdown</h3>
                  <p className="text-foreground-secondary mb-4">
                    Interactive pie chart with enhanced tooltips, center labels, and detailed
                    legend.
                  </p>
                  <div className="text-sm text-foreground-secondary">
                    <strong>Features:</strong> Hover interactions, percentage calculations, total
                    display, export controls
                  </div>
                </div>

                <div className="p-6 bg-background-secondary rounded-lg">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Sensitivity Heatmap
                  </h3>
                  <p className="text-foreground-secondary mb-4">
                    Interactive heatmap with zoom controls, enhanced tooltips, and financial color
                    coding.
                  </p>
                  <div className="text-sm text-foreground-secondary">
                    <strong>Features:</strong> Zoom controls, hover highlighting, impact analysis,
                    statistics summary
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-success/10 border border-success/20 rounded-lg text-center">
                  <div className="text-2xl font-bold text-success mb-2">🎨</div>
                  <div className="font-semibold text-success">Financial Colors</div>
                  <div className="text-sm text-foreground-secondary">
                    Domain-specific color schemes
                  </div>
                </div>

                <div className="p-4 bg-info/10 border border-info/20 rounded-lg text-center">
                  <div className="text-2xl font-bold text-info mb-2">🎯</div>
                  <div className="font-semibold text-info">Interactive Controls</div>
                  <div className="text-sm text-foreground-secondary">
                    Zoom, pan, and filter controls
                  </div>
                </div>

                <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg text-center">
                  <div className="text-2xl font-bold text-warning mb-2">💡</div>
                  <div className="font-semibold text-warning">Enhanced Tooltips</div>
                  <div className="text-sm text-foreground-secondary">
                    Detailed information on hover
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'revenue' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Revenue Breakdown Analysis
                </h2>
                <p className="text-foreground-secondary">
                  Interactive pie chart showcasing revenue sources with enhanced visual design.
                </p>
              </div>

              <RevenueBreakdown
                data={revenueData}
                title="Revenue Sources Breakdown"
                formatValue={value => `$${(value / 1000000).toFixed(1)}M`}
                showControls={true}
                showLegend={true}
                height={500}
              />

              <div className="grid md:grid-cols-2 gap-8 mt-8">
                <div className="p-6 bg-background-secondary rounded-lg">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Key Features</h3>
                  <ul className="space-y-2 text-foreground-secondary">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-success rounded-full" />
                      Interactive hover effects
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-info rounded-full" />
                      Center total display
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-warning rounded-full" />
                      Detailed legend with percentages
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple rounded-full" />
                      Chart controls and export options
                    </li>
                  </ul>
                </div>

                <div className="p-6 bg-background-secondary rounded-lg">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Data Insights</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">Total Revenue:</span>
                      <span className="font-mono font-semibold text-foreground">
                        ${revenueData.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">Primary Source:</span>
                      <span className="font-semibold text-foreground">Product Sales</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">Revenue Streams:</span>
                      <span className="font-semibold text-foreground">{revenueData.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sensitivity' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Sensitivity Analysis Heatmap
                </h2>
                <p className="text-foreground-secondary">
                  Interactive heatmap showing how valuation changes with different variables.
                </p>
              </div>

              <SensitivityHeatmap
                data={sensitivityData}
                xAxisLabels={xLabels}
                yAxisLabels={yLabels}
                title="Valuation Sensitivity Matrix"
                formatCell={value => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`}
                showControls={true}
              />

              <div className="grid md:grid-cols-3 gap-6 mt-8">
                <div className="p-6 bg-background-secondary rounded-lg">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Color Coding</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded bg-green-200" />
                      <span className="text-sm text-foreground-secondary">Positive Impact</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded bg-red-200" />
                      <span className="text-sm text-foreground-secondary">Negative Impact</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded bg-gray-200" />
                      <span className="text-sm text-foreground-secondary">Neutral</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-background-secondary rounded-lg">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Interactive Features
                  </h3>
                  <ul className="space-y-2 text-foreground-secondary">
                    <li>• Hover for detailed tooltips</li>
                    <li>• Zoom in/out controls</li>
                    <li>• Cell highlighting</li>
                    <li>• Statistics summary</li>
                  </ul>
                </div>

                <div className="p-6 bg-background-secondary rounded-lg">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Analysis Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-foreground-secondary">Total Cells:</span>
                      <span className="font-semibold text-foreground">
                        {sensitivityData.flat().length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-foreground-secondary">Positive:</span>
                      <span className="font-semibold text-success">
                        {sensitivityData.flat().filter(v => v > 0).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-foreground-secondary">Negative:</span>
                      <span className="font-semibold text-destructive">
                        {sensitivityData.flat().filter(v => v < 0).length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'features' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Chart Enhancement Features
                </h2>
                <p className="text-foreground-secondary">
                  Comprehensive list of improvements and new capabilities.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="p-6 border border-border rounded-lg">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      🎨 Enhanced Color Schemes
                    </h3>
                    <ul className="space-y-2 text-foreground-secondary">
                      <li>• Financial domain color palette</li>
                      <li>• Semantic color mapping (revenue, expenses, assets)</li>
                      <li>• Accessibility-compliant contrast ratios</li>
                      <li>• Consistent color usage across charts</li>
                    </ul>
                  </div>

                  <div className="p-6 border border-border rounded-lg">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      🎯 Interactive Controls
                    </h3>
                    <ul className="space-y-2 text-foreground-secondary">
                      <li>• Zoom in/out functionality</li>
                      <li>• Pan and scroll controls</li>
                      <li>• Legend toggle options</li>
                      <li>• Export and share capabilities</li>
                    </ul>
                  </div>

                  <div className="p-6 border border-border rounded-lg">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      💡 Enhanced Tooltips
                    </h3>
                    <ul className="space-y-2 text-foreground-secondary">
                      <li>• Rich contextual information</li>
                      <li>• Formatted data display</li>
                      <li>• Comparative analysis</li>
                      <li>• Actionable insights</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-6 border border-border rounded-lg">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      📱 Mobile Optimization
                    </h3>
                    <ul className="space-y-2 text-foreground-secondary">
                      <li>• Touch-friendly interactions</li>
                      <li>• Responsive design patterns</li>
                      <li>• Optimized for small screens</li>
                      <li>• Swipe and gesture support</li>
                    </ul>
                  </div>

                  <div className="p-6 border border-border rounded-lg">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      ♿ Accessibility
                    </h3>
                    <ul className="space-y-2 text-foreground-secondary">
                      <li>• Keyboard navigation support</li>
                      <li>• Screen reader compatibility</li>
                      <li>• High contrast mode support</li>
                      <li>• Focus management</li>
                    </ul>
                  </div>

                  <div className="p-6 border border-border rounded-lg">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      ⚡ Performance
                    </h3>
                    <ul className="space-y-2 text-foreground-secondary">
                      <li>• Optimized rendering</li>
                      <li>• Lazy loading support</li>
                      <li>• Smooth animations</li>
                      <li>• Memory-efficient updates</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-12 p-8 bg-gradient-to-r from-background-secondary to-background-tertiary rounded-lg">
                <h3 className="text-xl font-semibold text-foreground mb-4 text-center">
                  Ready to Experience Enhanced Charts?
                </h3>
                <p className="text-foreground-secondary text-center mb-6">
                  Switch between the tabs above to see all the enhanced chart features in action.
                </p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => setActiveTab('revenue')}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:shadow-lg transition-all"
                  >
                    Try Revenue Chart
                  </button>
                  <button
                    onClick={() => setActiveTab('sensitivity')}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all"
                  >
                    Try Sensitivity Heatmap
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedChartsDemo;
