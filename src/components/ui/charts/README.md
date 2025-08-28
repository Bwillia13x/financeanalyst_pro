# Financial Chart Components

A collection of minimal, professional chart components specifically designed for financial analysis. These components follow strict minimalist design principles, focusing on data clarity over visual decoration.

## Design Principles

- **Minimal Visual Noise**: Removed unnecessary gridlines, decorations, and chrome
- **Essential Colors Only**: Uses primary data color + one accent color from the design system
- **Data-First Design**: Focus on clarity and readability of financial data
- **Professional Typography**: Clean, readable fonts with proper hierarchy
- **Subtle Interactions**: Hover states and tooltips that enhance without distracting
- **Responsive Design**: Works across different screen sizes and orientations

## Components

### DCFWaterfall

A clean waterfall chart for displaying DCF cash flow components.

**Props:**

- `data` (array): Array of objects with `name`, `value`, and optional `type` properties
- `title` (string): Chart title
- `formatValue` (function): Value formatting function
- `className` (string): Additional CSS classes

**Data Format:**

```javascript
const dcfData = [
  { name: 'Free Cash Flow', value: 120, type: 'flow' },
  { name: 'Tax Shield', value: 15, type: 'flow' },
  { name: 'Terminal Value', value: 800, type: 'flow' },
  { name: 'Less: Debt', value: -50, type: 'flow' },
  { name: 'Enterprise Value', value: 885, type: 'total' }
];
```

### RevenueBreakdown

A minimal pie chart for revenue analysis with hover states and detailed legend.

**Props:**

- `data` (array): Array of objects with `name` and `value` properties
- `title` (string): Chart title
- `formatValue` (function): Value formatting function
- `className` (string): Additional CSS classes

**Data Format:**

```javascript
const revenueData = [
  { name: 'Product Sales', value: 450000000 },
  { name: 'Subscription Revenue', value: 280000000 },
  { name: 'Professional Services', value: 120000000 }
];
```

### TrendLine

A subtle line chart for growth analysis with key metrics display.

**Props:**

- `data` (array): Array of objects with `period` and data key properties
- `title` (string): Chart title
- `dataKey` (string): Key for the data values (default: 'value')
- `formatValue` (function): Value formatting function
- `showGrowthRate` (boolean): Show overall growth rate (default: true)
- `className` (string): Additional CSS classes

**Data Format:**

```javascript
const trendData = [
  { period: 'Q1 2023', value: 12.5 },
  { period: 'Q2 2023', value: 15.2 },
  { period: 'Q3 2023', value: 18.7 }
];
```

### SensitivityHeatmap

A professional heatmap for sensitivity analysis with color-coded cells.

**Props:**

- `data` (array): 2D array of numeric values
- `xAxisLabels` (array): Labels for x-axis
- `yAxisLabels` (array): Labels for y-axis
- `title` (string): Chart title
- `formatValue` (function): Value formatting function for tooltips
- `formatCell` (function): Cell value formatting function
- `className` (string): Additional CSS classes

**Data Format:**

```javascript
const sensitivityData = [
  [5.2, 8.7, 12.1, 15.6, 19.0],
  [2.8, 6.3, 9.8, 13.2, 16.7],
  [0.4, 3.9, 7.4, 10.8, 14.3]
];
const xAxisLabels = ['-20%', '-10%', 'Base', '+10%', '+20%'];
const yAxisLabels = ['Revenue Growth', 'EBITDA Margin', 'Terminal Growth'];
```

### MetricsDashboard

A clean dashboard for displaying key financial metrics with trend indicators.

**Props:**

- `metrics` (array): Array of metric objects
- `title` (string): Dashboard title
- `columns` (number): Number of columns (2-6, default: 4)
- `className` (string): Additional CSS classes

**Metric Object Format:**

```javascript
const metrics = [
  {
    category: 'Valuation Metrics', // Optional grouping
    title: 'Enterprise Value',
    value: 2450000000,
    format: 'currency', // 'currency', 'percentage', 'ratio', 'large-number', 'number'
    change: 8.3, // Percentage change vs previous period
    prefix: '$', // Optional prefix
    suffix: 'M', // Optional suffix
    highlight: false, // Optional highlighting
    isSummary: false // Display in summary section
  }
];
```

**Supported Formats:**

- `currency`: Displays as $XXXm format
- `percentage`: Displays with % symbol
- `ratio`: Displays with 2 decimal places
- `large-number`: Auto-formats as K/M/B
- `number`: Standard number formatting

## Usage Examples

### Basic Usage

```jsx
import { DCFWaterfall, RevenueBreakdown, TrendLine } from '@/components/ui/charts';

function AnalysisPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <DCFWaterfall data={dcfData} title="DCF Valuation Components" />
      <RevenueBreakdown data={revenueData} title="Revenue Analysis" />
    </div>
  );
}
```

### Custom Formatting

```jsx
<TrendLine
  data={trendData}
  title="Revenue Growth"
  formatValue={value => `${value.toFixed(1)}%`}
  showGrowthRate={true}
/>
```

### Metrics Dashboard with Categories

```jsx
<MetricsDashboard metrics={metricsWithCategories} title="Q4 2024 Performance" columns={3} />
```

## Styling

Components use the application's design system CSS variables:

- `--color-primary`: Main brand color
- `--color-secondary`: Accent color
- `--color-foreground`: Text color
- `--color-muted-foreground`: Secondary text
- `--color-background`: Background color
- `--color-border`: Border color

All components are fully responsive and include hover states, tooltips, and accessibility features.

## Dependencies

- React 18+
- Recharts 2.15+
- Lucide React (for icons)
- Tailwind CSS (for styling)
- Class Variance Authority (for conditional classes)

## Accessibility

All components include:

- Proper ARIA labels
- Keyboard navigation support
- High contrast color ratios
- Screen reader compatible tooltips
- Semantic HTML structure
