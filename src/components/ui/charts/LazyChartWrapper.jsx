import { forwardRef, Suspense } from 'react';

import { useFinancialAccessibility } from '../../../hooks/useAccessibility';
import LazyLoader from '../../LazyLoader';

// Loading fallback for charts
const ChartLoadingFallback = ({ title = 'Chart', height = 320 }) => (
  <div className="w-full bg-white border border-gray-200 rounded-lg p-6" style={{ height }}>
    <div className="animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-32 bg-gray-200 rounded w-full" />
        <div className="grid grid-cols-3 gap-2">
          <div className="h-3 bg-gray-200 rounded" />
          <div className="h-3 bg-gray-200 rounded" />
          <div className="h-3 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
    <div className="sr-only">Loading {title}...</div>
  </div>
);

// HOC for lazy loading charts with accessibility
const withLazyChart = (ChartComponent, componentName, options = {}) => {
  const LazyChartComponent = forwardRef((props, ref) => {
    const {
      priority = 'normal',
      preloadDelay = 2000,
      height = 320,
      title,
      // Allow tests/consumers to override for instrumentation expectations
      componentName: overrideName,
      ...chartProps
    } = props;

    const resolvedName = overrideName || componentName;
    const resolvedTitle = title || resolvedName;

    // Add accessibility monitoring
    const { elementRef } = useFinancialAccessibility('chart');

    const fallback = <ChartLoadingFallback title={resolvedTitle} height={height} />;

    return (
      <div
        ref={el => {
          // Assign to accessibility ref object
          if (elementRef) {
            elementRef.current = el;
          }
          // Forward ref support
          if (ref) {
            if (typeof ref === 'function') ref(el);
            else ref.current = el;
          }
        }}
      >
        <LazyLoader
          componentName={resolvedName}
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
