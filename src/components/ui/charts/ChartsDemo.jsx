import React from 'react';
import { 
  DCFWaterfall,
  RevenueBreakdown,
  TrendLine,
  SensitivityHeatmap,
  MetricsDashboard
} from './index';

// Sample data for demonstrations
const dcfData = [
  { name: 'Free Cash Flow', value: 120, type: 'flow' },
  { name: 'Tax Shield', value: 15, type: 'flow' },
  { name: 'Terminal Value', value: 800, type: 'flow' },
  { name: 'Less: Debt', value: -50, type: 'flow' },
  { name: 'Enterprise Value', value: 885, type: 'total' }
];

const revenueData = [
  { name: 'Product Sales', value: 450000000 },
  { name: 'Subscription Revenue', value: 280000000 },
  { name: 'Professional Services', value: 120000000 },
  { name: 'Licensing', value: 85000000 },
  { name: 'Other Revenue', value: 35000000 }
];

const trendData = [
  { period: 'Q1 2023', value: 12.5 },
  { period: 'Q2 2023', value: 15.2 },
  { period: 'Q3 2023', value: 18.7 },
  { period: 'Q4 2023', value: 16.3 },
  { period: 'Q1 2024', value: 21.8 },
  { period: 'Q2 2024', value: 24.1 }
];

const sensitivityData = [
  [5.2, 8.7, 12.1, 15.6, 19.0],
  [2.8, 6.3, 9.8, 13.2, 16.7],
  [0.4, 3.9, 7.4, 10.8, 14.3],
  [-2.0, 1.5, 5.0, 8.4, 11.9],
  [-4.4, -0.9, 2.6, 6.0, 9.5]
];

const xAxisLabels = ['-20%', '-10%', 'Base', '+10%', '+20%'];
const yAxisLabels = ['Revenue Growth', 'EBITDA Margin', 'Terminal Growth', 'WACC', 'Tax Rate'];

const metricsData = [
  {
    category: 'Valuation Metrics',
    title: 'Enterprise Value',
    value: 2450000000,
    format: 'currency',
    change: 8.3
  },
  {
    category: 'Valuation Metrics',
    title: 'P/E Ratio',
    value: 18.5,
    format: 'ratio',
    change: -2.1
  },
  {
    category: 'Financial Performance',
    title: 'Revenue',
    value: 970000000,
    format: 'currency',
    change: 12.7
  },
  {
    category: 'Financial Performance',
    title: 'EBITDA Margin',
    value: 24.8,
    format: 'percentage',
    change: 1.2
  },
  {
    category: 'Risk Metrics',
    title: 'WACC',
    value: 8.7,
    format: 'percentage',
    change: 0.3
  },
  {
    category: 'Risk Metrics',
    title: 'Beta',
    value: 1.15,
    format: 'ratio',
    change: -0.05
  }
];

const ChartsDemo = () => {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Financial Chart Components Demo
        </h1>
        <p className="text-muted-foreground">
          Minimal, professional chart components designed for financial analysis
        </p>
      </div>

      {/* Metrics Dashboard */}
      <MetricsDashboard 
        metrics={metricsData}
        title="Key Financial Metrics"
        columns={3}
      />

      {/* Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* DCF Waterfall */}
        <DCFWaterfall 
          data={dcfData}
          title="DCF Valuation Components"
          formatValue={(value) => `$${(value / 1000).toFixed(0)}M`}
        />

        {/* Revenue Breakdown */}
        <RevenueBreakdown 
          data={revenueData}
          title="FY2024 Revenue Breakdown"
        />

        {/* Trend Line */}
        <TrendLine 
          data={trendData}
          title="Revenue Growth Trend"
          dataKey="value"
          formatValue={(value) => `${value.toFixed(1)}%`}
        />

        {/* Sensitivity Heatmap */}
        <SensitivityHeatmap 
          data={sensitivityData}
          xAxisLabels={xAxisLabels}
          yAxisLabels={yAxisLabels}
          title="NPV Sensitivity Analysis"
          formatValue={(value) => `$${value.toFixed(1)}B`}
        />
      </div>

      {/* Usage Documentation */}
      <div className="mt-12 p-6 bg-muted rounded-lg">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Component Usage Examples
        </h2>
        
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-medium text-foreground mb-2">DCF Waterfall Chart</h3>
            <pre className="bg-background p-3 rounded border text-xs overflow-x-auto">
{`<DCFWaterfall 
  data={dcfData}
  title="DCF Valuation Components"
  formatValue={(value) => \`$\${(value / 1000).toFixed(0)}M\`}
/>`}
            </pre>
          </div>

          <div>
            <h3 className="font-medium text-foreground mb-2">Revenue Breakdown Pie Chart</h3>
            <pre className="bg-background p-3 rounded border text-xs overflow-x-auto">
{`<RevenueBreakdown 
  data={revenueData}
  title="FY2024 Revenue Breakdown"
  formatValue={(value) => \`$\${(value / 1000000).toFixed(1)}M\`}
/>`}
            </pre>
          </div>

          <div>
            <h3 className="font-medium text-foreground mb-2">Trend Line Chart</h3>
            <pre className="bg-background p-3 rounded border text-xs overflow-x-auto">
{`<TrendLine 
  data={trendData}
  title="Revenue Growth Trend"
  dataKey="value"
  formatValue={(value) => \`\${value.toFixed(1)}%\`}
  showGrowthRate={true}
/>`}
            </pre>
          </div>

          <div>
            <h3 className="font-medium text-foreground mb-2">Sensitivity Analysis Heatmap</h3>
            <pre className="bg-background p-3 rounded border text-xs overflow-x-auto">
{`<SensitivityHeatmap 
  data={sensitivityMatrix}
  xAxisLabels={['-20%', '-10%', 'Base', '+10%', '+20%']}
  yAxisLabels={['Revenue', 'EBITDA', 'Terminal', 'WACC', 'Tax']}
  title="NPV Sensitivity Analysis"
/>`}
            </pre>
          </div>

          <div>
            <h3 className="font-medium text-foreground mb-2">Metrics Dashboard</h3>
            <pre className="bg-background p-3 rounded border text-xs overflow-x-auto">
{`<MetricsDashboard 
  metrics={metricsData}
  title="Key Financial Metrics"
  columns={3}
/>`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartsDemo;