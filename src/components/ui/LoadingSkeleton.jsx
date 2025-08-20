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
  ...props 
}) => (
  <div
    className={cn(
      'bg-slate-200 rounded',
      animate && 'animate-pulse',
      variant === 'text' && 'h-4',
      variant === 'button' && 'h-10',
      variant === 'avatar' && 'h-12 w-12 rounded-full',
      variant === 'card' && 'h-48',
      className
    )}
    {...props}
  />
);

// Financial table skeleton
export const FinancialTableSkeleton = ({ 
  rows = 8, 
  columns = 5,
  showHeader = true,
  className 
}) => (
  <div className={cn('space-y-3', className)}>
    {showHeader && (
      <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton
            key={`header-${index}`}
            className="h-4 flex-1"
            variant="text"
          />
        ))}
      </div>
    )}
    
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex items-center space-x-4 p-4 border border-slate-200 rounded-lg">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`cell-${rowIndex}-${colIndex}`}
              className={cn(
                'h-4',
                colIndex === 0 ? 'flex-2' : 'flex-1',
                colIndex > 0 && colIndex < columns - 1 && 'w-20'
              )}
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);

// Chart skeleton
export const ChartSkeleton = ({ 
  height = 300,
  showLegend = true,
  className 
}) => (
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
export const DashboardCardSkeleton = ({ className }) => (
  <div className={cn('p-6 border border-slate-200 rounded-lg space-y-4', className)}>
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="w-8 h-8 rounded-lg" />
    </div>
    
    {/* Main content */}
    <div className="space-y-3">
      <Skeleton className="h-8 w-20" />
      <div className="flex items-center space-x-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
    
    {/* Mini chart */}
    <div className="h-16 flex items-end space-x-1">
      {Array.from({ length: 12 }).map((_, index) => (
        <Skeleton
          key={`mini-bar-${index}`}
          className="flex-1 bg-slate-300"
          style={{ height: `${Math.random() * 60 + 20}%` }}
        />
      ))}
    </div>
  </div>
);

// Portfolio holdings skeleton
export const PortfolioHoldingsSkeleton = ({ rows = 5, className }) => (
  <div className={cn('space-y-3', className)}>
    {/* Header */}
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
      <Skeleton className="h-5 w-40" />
      <div className="flex items-center space-x-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    </div>
    
    {/* Holdings list */}
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={`holding-${index}`} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          
          <div className="flex items-center space-x-6 text-right">
            <div className="space-y-1">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-3 w-8" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-6 w-12" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Market data widget skeleton
export const MarketDataSkeleton = ({ className }) => (
  <div className={cn('p-4 border border-slate-200 rounded-lg', className)}>
    {/* Header with symbol */}
    <div className="flex items-center justify-between mb-3">
      <div className="space-y-1">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="w-6 h-6 rounded" />
    </div>
    
    {/* Price and change */}
    <div className="space-y-2 mb-4">
      <Skeleton className="h-7 w-24" />
      <Skeleton className="h-4 w-20" />
    </div>
    
    {/* Stats */}
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={`stat-${index}`} className="space-y-1">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
    
    {/* Sparkline */}
    <div className="mt-4 h-8 flex items-end space-x-0.5">
      {Array.from({ length: 20 }).map((_, index) => (
        <Skeleton
          key={`spark-${index}`}
          className="flex-1 bg-slate-300"
          style={{ height: `${Math.random() * 70 + 10}%` }}
        />
      ))}
    </div>
  </div>
);

// Analysis results skeleton
export const AnalysisResultsSkeleton = ({ className }) => (
  <div className={cn('space-y-6', className)}>
    {/* Summary cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <DashboardCardSkeleton key={`summary-${index}`} />
      ))}
    </div>
    
    {/* Main analysis chart */}
    <ChartSkeleton height={400} />
    
    {/* Detailed breakdown */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <FinancialTableSkeleton rows={6} columns={3} />
      <ChartSkeleton height={250} showLegend={false} />
    </div>
  </div>
);

// Loading state wrapper component
export const LoadingWrapper = ({ 
  isLoading, 
  skeleton, 
  children, 
  className,
  fallback = null 
}) => {
  if (isLoading) {
    return (
      <div className={cn('animate-pulse', className)}>
        {skeleton || fallback}
      </div>
    );
  }
  
  return children;
};

// Shimmer effect for enhanced loading animations
export const ShimmerWrapper = ({ 
  children, 
  className,
  intensity = 'normal' // 'subtle', 'normal', 'intense'
}) => (
  <div 
    className={cn(
      'relative overflow-hidden',
      className
    )}
  >
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

export default {
  Skeleton,
  FinancialTableSkeleton,
  ChartSkeleton,
  DashboardCardSkeleton,
  PortfolioHoldingsSkeleton,
  MarketDataSkeleton,
  AnalysisResultsSkeleton,
  LoadingWrapper,
  ShimmerWrapper
};
