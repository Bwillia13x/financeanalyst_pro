import React, { Suspense } from 'react';
import LazyLoader from '../../LazyLoader';
import { useFinancialAccessibility } from '../../../hooks/useAccessibility';

// Loading fallback for charts
const ChartLoadingFallback = ({ title = 'Chart', height = 320 }) => (
  <div className="w-full bg-white border border-gray-200 rounded-lg p-6" style={{ height }}>
    <div className="animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-32 bg-gray-200 rounded w-full"></div>
        <div className="grid grid-cols-3 gap-2">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
    <div className="sr-only">Loading {title}...</div>
  </div>
);

// HOC for lazy loading charts with accessibility
const withLazyChart = (ChartComponent, componentName, options = {}) => {
  const LazyChartComponent = React.forwardRef((props, ref) => {
    const {
      priority = 'normal',
      preloadDelay = 2000,
      height = 320,
      title = componentName,
      ...chartProps
    } = props;

    // Add accessibility monitoring
    const { elementRef } = useFinancialAccessibility('chart');

    const fallback = <ChartLoadingFallback title={title} height={height} />;

    return (
      <div ref={(el) => {
        elementRef(el);
        if (ref) {
          if (typeof ref === 'function') ref(el);
          else ref.current = el;
        }
      }}>
        <LazyLoader
          componentName={componentName}
          priority={priority}
          preloadDelay={preloadDelay}
          fallback={fallback}
          performanceTracking={true}
          {...options}
        >
          <Suspense fallback={fallback}>
            <ChartComponent {...chartProps} />
          </Suspense>
        </LazyLoader>
      </div>
    );
  });

  LazyChartComponent.displayName = `LazyChart(${componentName})`;
  return LazyChartComponent;
};

export { withLazyChart, ChartLoadingFallback };
export default withLazyChart;