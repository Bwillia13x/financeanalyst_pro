import React from 'react';

import { cn } from '../../utils/cn';

/**
 * Flexible skeleton loading components for consistent loading states
 * Provides animated placeholders while content loads
 */

// Base skeleton component
export const Skeleton = ({
  className,
  animate = true,
  variant = 'default',
  shimmer = false,
  ...props
}) => (
  <div
    className={cn(
      'bg-slate-200 rounded-md relative overflow-hidden',
      animate && !shimmer && 'animate-pulse',
      shimmer && 'animate-shimmer',
      variant === 'text' && 'h-4',
      variant === 'button' && 'h-10',
      variant === 'avatar' && 'h-12 w-12 rounded-full',
      variant === 'card' && 'h-48',
      className
    )}
    {...props}
  >
    {shimmer && (
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_2s_infinite]" />
    )}
  </div>
);

// Financial table skeleton
export const FinancialTableSkeleton = ({
  rows = 8,
  columns = 5,
  showHeader = true,
  shimmer = true,
  className
}) => (
  <div className={cn('space-y-4 bg-white rounded-lg border border-slate-200 p-6', className)}>
    {/* Table Header */}
    {showHeader && (
      <div className="border-b border-slate-200 pb-4 mb-4">
        <div className="flex items-center space-x-6">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton
              key={`header-${index}`}
              className={cn('h-5', index === 0 ? 'w-24' : index === 1 ? 'w-32' : 'w-20')}
              shimmer={shimmer}
            />
          ))}
        </div>
      </div>
    )}

    {/* Table Rows */}
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="flex items-center space-x-6 py-3 border-b border-slate-100 last:border-b-0"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`cell-${rowIndex}-${colIndex}`}
              className={cn(
                'h-4',
                colIndex === 0
                  ? 'w-24'
                  : colIndex === 1
                    ? 'w-32'
                    : colIndex === 2
                      ? 'w-28'
                      : colIndex === 3
                        ? 'w-20'
                        : 'w-16'
              )}
              shimmer={shimmer}
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);

// Chart skeleton
export const ChartSkeleton = ({ height = 300, showLegend = true, className }) => (
  <div className={cn('p-6 border border-slate-200 rounded-lg', className)}>
    {/* Chart title */}
    <div className="mb-4">
      <Skeleton className="h-6 w-48 mb-2" />
      <Skeleton className="h-4 w-32" />
    </div>

    {/* Chart area */}
    <div className="relative" style={{ height }}>
      <Skeleton className="w-full h-full rounded-lg" />

      {/* Simulate chart elements */}
      <div className="absolute inset-4 flex flex-col justify-end">
        <div className="flex items-end space-x-2 h-full">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton
              key={`bar-${index}`}
              className="flex-1 bg-slate-300"
              style={{ height: `${Math.random() * 80 + 20}%` }}
            />
          ))}
        </div>
      </div>
    </div>

    {/* Legend */}
    {showLegend && (
      <div className="flex items-center justify-center space-x-4 mt-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={`legend-${index}`} className="flex items-center space-x-2">
            <Skeleton className="w-4 h-4 rounded-sm" />
            <Skeleton className="w-16 h-4" />
          </div>
        ))}
      </div>
    )}
  </div>
);

// Dashboard card skeleton
export const DashboardCardSkeleton = ({ className, shimmer = true }) => (
  <div
    className={cn('bg-white p-6 border border-slate-200 rounded-xl shadow-sm space-y-6', className)}
  >
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" shimmer={shimmer} />
        <Skeleton className="h-4 w-24" shimmer={shimmer} />
      </div>
      <Skeleton className="w-10 h-10 rounded-lg" shimmer={shimmer} />
    </div>

    {/* Main Metric */}
    <div className="space-y-2">
      <Skeleton className="h-8 w-28" shimmer={shimmer} />
      <div className="flex items-center space-x-2">
        <Skeleton className="h-4 w-4 rounded-full" shimmer={shimmer} />
        <Skeleton className="h-4 w-20" shimmer={shimmer} />
      </div>
    </div>

    {/* Mini Chart */}
    <div className="space-y-3">
      <Skeleton className="h-4 w-16" shimmer={shimmer} />
      <div className="h-16 flex items-end space-x-1">
        {Array.from({ length: 12 }).map((_, index) => (
          <Skeleton
            key={`mini-bar-${index}`}
            className="flex-1 bg-slate-200"
            style={{ height: `${Math.random() * 60 + 20}%` }}
            shimmer={shimmer}
          />
        ))}
      </div>
    </div>
  </div>
);

// Portfolio holdings skeleton
export const PortfolioHoldingsSkeleton = ({ rows = 5, className, shimmer = true }) => (
  <div className={cn('bg-white rounded-lg border border-slate-200 p-6', className)}>
    {/* Header */}
    <div className="flex items-center justify-between mb-6">
      <Skeleton className="h-6 w-48" shimmer={shimmer} />
      <div className="flex items-center space-x-3">
        <Skeleton className="h-9 w-24 rounded-lg" shimmer={shimmer} />
        <Skeleton className="h-9 w-9 rounded-lg" shimmer={shimmer} />
      </div>
    </div>

    {/* Holdings list */}
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={`holding-${index}`}
          className="flex items-center justify-between p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center space-x-4">
            <Skeleton className="w-12 h-12 rounded-lg" shimmer={shimmer} />
            <div className="space-y-2">
              <Skeleton className="h-5 w-20" shimmer={shimmer} />
              <Skeleton className="h-4 w-32" shimmer={shimmer} />
            </div>
          </div>

          <div className="flex items-center space-x-8 text-right">
            <div className="space-y-1 text-right">
              <Skeleton className="h-5 w-16" shimmer={shimmer} />
              <Skeleton className="h-4 w-12" shimmer={shimmer} />
            </div>
            <div className="space-y-1 text-right">
              <Skeleton className="h-5 w-20" shimmer={shimmer} />
              <Skeleton className="h-4 w-16" shimmer={shimmer} />
            </div>
            <Skeleton className="h-8 w-16 rounded-lg" shimmer={shimmer} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Market data widget skeleton
export const MarketDataSkeleton = ({ className, shimmer = true }) => (
  <div className={cn('bg-white p-5 border border-slate-200 rounded-xl shadow-sm', className)}>
    {/* Header with symbol */}
    <div className="flex items-center justify-between mb-4">
      <div className="space-y-2">
        <Skeleton className="h-6 w-20" shimmer={shimmer} />
        <Skeleton className="h-4 w-28" shimmer={shimmer} />
      </div>
      <Skeleton className="w-8 h-8 rounded-lg" shimmer={shimmer} />
    </div>

    {/* Price and change */}
    <div className="space-y-3 mb-6">
      <Skeleton className="h-8 w-32" shimmer={shimmer} />
      <div className="flex items-center space-x-2">
        <Skeleton className="h-5 w-4 rounded" shimmer={shimmer} />
        <Skeleton className="h-5 w-16" shimmer={shimmer} />
      </div>
    </div>

    {/* Stats */}
    <div className="grid grid-cols-2 gap-4 mb-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={`stat-${index}`} className="space-y-2">
          <Skeleton className="h-4 w-16" shimmer={shimmer} />
          <Skeleton className="h-5 w-20" shimmer={shimmer} />
        </div>
      ))}
    </div>

    {/* Sparkline */}
    <div className="space-y-2">
      <Skeleton className="h-4 w-12" shimmer={shimmer} />
      <div className="h-12 flex items-end space-x-0.5">
        {Array.from({ length: 20 }).map((_, index) => (
          <Skeleton
            key={`spark-${index}`}
            className="flex-1 bg-slate-200"
            style={{ height: `${Math.random() * 70 + 10}%` }}
            shimmer={shimmer}
          />
        ))}
      </div>
    </div>
  </div>
);

// Analysis results skeleton
export const AnalysisResultsSkeleton = ({ className, shimmer = true }) => (
  <div className={cn('space-y-8', className)}>
    {/* Header */}
    <div className="text-center space-y-3">
      <Skeleton className="h-8 w-64 mx-auto" shimmer={shimmer} />
      <Skeleton className="h-5 w-96 mx-auto" shimmer={shimmer} />
    </div>

    {/* Summary cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <DashboardCardSkeleton key={`summary-${index}`} shimmer={shimmer} />
      ))}
    </div>

    {/* Main analysis chart */}
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="mb-6">
        <Skeleton className="h-7 w-48 mb-2" shimmer={shimmer} />
        <Skeleton className="h-5 w-64" shimmer={shimmer} />
      </div>
      <div className="h-80 bg-slate-50 rounded-lg flex items-center justify-center">
        <Skeleton className="h-64 w-full mx-6" shimmer={shimmer} />
      </div>
    </div>

    {/* Detailed breakdown */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <FinancialTableSkeleton rows={8} columns={4} shimmer={shimmer} />
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <Skeleton className="h-6 w-32 mb-4" shimmer={shimmer} />
        <div className="h-60 bg-slate-50 rounded-lg flex items-center justify-center">
          <Skeleton className="h-48 w-full mx-6" shimmer={shimmer} />
        </div>
      </div>
    </div>
  </div>
);

// Loading state wrapper component
export const LoadingWrapper = ({ isLoading, skeleton, children, className, fallback = null }) => {
  if (isLoading) {
    return <div className={cn('animate-pulse', className)}>{skeleton || fallback}</div>;
  }

  return children;
};

// Shimmer effect for enhanced loading animations
export const ShimmerWrapper = ({
  children,
  className,
  intensity = 'normal' // 'subtle', 'normal', 'intense'
}) => (
  <div className={cn('relative overflow-hidden', className)}>
    {children}
    <div
      className={cn(
        'absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]',
        'bg-gradient-to-r from-transparent via-white/20 to-transparent',
        intensity === 'subtle' && 'via-white/10',
        intensity === 'intense' && 'via-white/30'
      )}
    />
  </div>
);

export default LoadingWrapper;
