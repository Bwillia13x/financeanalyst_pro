import React, { Suspense } from 'react';

import { trackLazyLoad } from '../../utils/performanceMonitor';

import { LoadingSkeleton } from './LoadingSkeleton';

/**
 * Wrapper component for lazy-loaded components with performance tracking
 * Provides consistent loading states and error boundaries
 */

const LazyLoadWrapper = ({
  children,
  fallback = null,
  skeletonType = 'table',
  componentName = 'Unknown',
  ..._props
}) => {
  const getSkeletonComponent = () => {
    switch (skeletonType) {
      case 'table':
        return <LoadingSkeleton.FinancialTable rows={8} columns={5} />;
      case 'chart':
        return <LoadingSkeleton.Chart />;
      case 'dashboard':
        return <LoadingSkeleton.Dashboard />;
      case 'form':
        return <LoadingSkeleton.Portfolio />;
      default:
        return <LoadingSkeleton.Table rows={6} columns={4} />;
    }
  };

  const defaultFallback = fallback || (
    <div className="space-y-4">
      {getSkeletonComponent()}
      <div className="text-center text-sm text-slate-500">
        Loading {componentName}...
      </div>
    </div>
  );

  return (
    <Suspense fallback={defaultFallback}>
      {children}
    </Suspense>
  );
};

/**
 * Higher-order component for creating lazy-loaded components with tracking
 */
export const withLazyLoading = (importFunction, componentName, skeletonType = 'table') => {
  const LazyComponent = React.lazy(() =>
    trackLazyLoad(importFunction, componentName)
  );

  return React.forwardRef((_props, ref) => (
    <LazyLoadWrapper
      skeletonType={skeletonType}
      componentName={componentName}
    >
      <LazyComponent {..._props} ref={ref} />
    </LazyLoadWrapper>
  ));
};

export default LazyLoadWrapper;
