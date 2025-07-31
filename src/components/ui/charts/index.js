import { withLazyChart } from './LazyChartWrapper';

// Import chart components
import DCFWaterfallBase from './DCFWaterfall';
import RevenueBreakdownBase from './RevenueBreakdown';
import TrendLineBase from './TrendLine';
import SensitivityHeatmapBase from './SensitivityHeatmap';
import { MetricsDashboard as MetricsDashboardBase, MetricCard } from './MetricsDashboard';

// Create lazy versions with optimized loading
export const DCFWaterfall = withLazyChart(DCFWaterfallBase, 'dcf-waterfall', {
  priority: 'high',
  preloadDelay: 1000
});

export const RevenueBreakdown = withLazyChart(RevenueBreakdownBase, 'revenue-breakdown', {
  priority: 'normal',
  preloadDelay: 1500
});

export const TrendLine = withLazyChart(TrendLineBase, 'trend-line', {
  priority: 'normal',
  preloadDelay: 2000
});

export const SensitivityHeatmap = withLazyChart(SensitivityHeatmapBase, 'sensitivity-heatmap', {
  priority: 'normal',
  preloadDelay: 2500
});

export const MetricsDashboard = withLazyChart(MetricsDashboardBase, 'metrics-dashboard', {
  priority: 'high',
  preloadDelay: 500
});

// Re-export MetricCard as it's lightweight
export { MetricCard };

// Export the lazy chart wrapper for custom use
export { withLazyChart, ChartLoadingFallback } from './LazyChartWrapper';