import React, { Suspense, lazy } from 'react';

import LoadingSpinner from './LoadingSpinner';

// Lazy load the chart components to reduce initial bundle size
const LazyBarChart = lazy(() =>
  import('recharts').then(module => ({
    default: ({ data, ...props }) => {
      const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = module;
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} {...props}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis stroke="var(--color-muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-popover)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px'
              }}
            />
            <Bar dataKey="value" fill="var(--color-primary)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }
  }))
);

const LazyScatterChart = lazy(() =>
  import('recharts').then(module => ({
    default: ({ data, ...props }) => {
      const { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } =
        module;
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart data={data} {...props}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis stroke="var(--color-muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-popover)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px'
              }}
            />
            <Scatter dataKey="value" fill="var(--color-primary)" />
          </ScatterChart>
        </ResponsiveContainer>
      );
    }
  }))
);

const LazyAreaChart = lazy(() =>
  import('recharts').then(module => ({
    default: ({ data, ...props }) => {
      const { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = module;
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} {...props}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis stroke="var(--color-muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-popover)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px'
              }}
            />
            <Area dataKey="value" fill="var(--color-primary)" stroke="var(--color-primary)" />
          </AreaChart>
        </ResponsiveContainer>
      );
    }
  }))
);

// Chart wrapper component with loading state
const ChartWrapper = ({ children, loading = false }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
};

// Export chart components
export const BarChart = props => (
  <ChartWrapper>
    <LazyBarChart {...props} />
  </ChartWrapper>
);

export const ScatterChart = props => (
  <ChartWrapper>
    <LazyScatterChart {...props} />
  </ChartWrapper>
);

export const AreaChart = props => (
  <ChartWrapper>
    <LazyAreaChart {...props} />
  </ChartWrapper>
);

export default ChartWrapper;
