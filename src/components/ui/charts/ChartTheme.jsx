import React from 'react';

/**
 * Enhanced Chart Theme System
 * Provides consistent theming, colors, and interactive features for all charts
 */

export const CHART_THEME = {
  // ===== FINANCIAL DOMAIN COLORS =====
  colors: {
    // Revenue & Income
    revenue: 'var(--color-financial-revenue)',
    revenueLight: 'var(--color-financial-revenue-light)',
    revenueMedium: 'var(--color-financial-revenue-medium)',
    revenueDark: 'var(--color-financial-revenue-dark)',

    // Expenses & Costs
    expense: 'var(--color-financial-expense)',
    expenseLight: 'var(--color-financial-expense-light)',
    expenseMedium: 'var(--color-financial-expense-medium)',
    expenseDark: 'var(--color-financial-expense-dark)',

    // Assets
    asset: 'var(--color-financial-asset)',
    assetLight: 'var(--color-financial-asset-light)',
    assetMedium: 'var(--color-financial-asset-medium)',
    assetDark: 'var(--color-financial-asset-dark)',

    // Liabilities
    liability: 'var(--color-financial-liability)',
    liabilityLight: 'var(--color-financial-liability-light)',
    liabilityMedium: 'var(--color-financial-liability-medium)',
    liabilityDark: 'var(--color-financial-liability-dark)',

    // Equity
    equity: 'var(--color-financial-equity)',
    equityLight: 'var(--color-financial-equity-light)',
    equityMedium: 'var(--color-financial-equity-medium)',
    equityDark: 'var(--color-financial-equity-dark)',

    // Status colors
    success: 'var(--color-brand-success)',
    warning: 'var(--color-brand-warning)',
    error: 'var(--color-brand-error)',
    info: 'var(--color-brand-info)',

    // Neutral
    neutral: 'var(--color-muted-foreground)',
    neutralLight: 'var(--color-background-secondary)'
  },

  // ===== CHART SERIES COLORS =====
  series: [
    'var(--color-chart-1)', // Blue 600
    'var(--color-chart-2)', // Emerald 600
    'var(--color-chart-3)', // Amber 600
    'var(--color-chart-4)', // Red 600
    'var(--color-chart-5)', // Violet 600
    'var(--color-chart-6)', // Cyan 600
    'var(--color-chart-7)', // Rose 600
    'var(--color-chart-8)', // Lime 700
    'var(--color-chart-9)', // Orange 700
    'var(--color-chart-10)' // Purple 800
  ],

  // ===== CHART CONFIGURATIONS =====
  grid: {
    stroke: 'var(--color-border)',
    strokeDasharray: '3 3',
    opacity: 0.5
  },

  axis: {
    stroke: 'var(--color-border)',
    fontSize: 12,
    fill: 'var(--color-muted-foreground)',
    fontFamily: 'Inter, sans-serif'
  },

  tooltip: {
    backgroundColor: 'var(--color-background)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    color: 'var(--color-foreground)'
  },

  legend: {
    fontSize: '14px',
    fill: 'var(--color-foreground)',
    fontFamily: 'Inter, sans-serif'
  },

  // ===== ANIMATION SETTINGS =====
  animation: {
    duration: 750,
    easing: 'ease-in-out'
  },

  // ===== RESPONSIVE BREAKPOINTS =====
  breakpoints: {
    mobile: 640,
    tablet: 768,
    desktop: 1024,
    large: 1280
  }
};

// ===== ENHANCED TOOLTIP COMPONENT =====
export const EnhancedTooltip = ({
  active,
  payload,
  label,
  title,
  formatter = (value, name) => [value, name],
  labelFormatter = label => label,
  showTotal = false,
  className = '',
  ...props
}) => {
  if (!active || !payload || !payload.length) return null;

  const total = showTotal ? payload.reduce((sum, entry) => sum + (entry.value || 0), 0) : null;

  return (
    <div
      className={`bg-background border border-border rounded-lg shadow-lg p-4 min-w-[200px] ${className}`}
      style={{
        backgroundColor: 'var(--color-background)',
        borderColor: 'var(--color-border)',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
      }}
      {...props}
    >
      {title && (
        <div className="font-semibold text-foreground mb-3 pb-2 border-b border-border">
          {title}
        </div>
      )}

      {label && <div className="font-medium text-foreground mb-2">{labelFormatter(label)}</div>}

      <div className="space-y-2">
        {payload.map((entry, index) => {
          const [formattedValue, formattedName] = formatter(entry.value, entry.name, entry);

          return (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-foreground truncate">{formattedName}</span>
              </div>
              <span className="font-mono text-sm font-medium text-foreground flex-shrink-0">
                {formattedValue}
              </span>
            </div>
          );
        })}
      </div>

      {showTotal && total !== null && (
        <div className="mt-3 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">Total</span>
            <span className="font-mono font-bold text-foreground">
              {formatter(total, 'Total')[0]}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// ===== INTERACTIVE CHART CONTROLS =====
export const ChartControls = ({
  onZoomIn,
  onZoomOut,
  onReset,
  onToggleLegend,
  onExport,
  showLegend = true,
  className = '',
  children
}) => (
  <div
    className={`flex items-center gap-2 p-2 bg-background-secondary rounded-lg border border-border ${className}`}
  >
    {onZoomIn && onZoomOut && (
      <>
        <button
          onClick={onZoomIn}
          className="p-2 rounded-md hover:bg-background-tertiary transition-colors"
          title="Zoom In"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11h6" />
          </svg>
        </button>
        <button
          onClick={onZoomOut}
          className="p-2 rounded-md hover:bg-background-tertiary transition-colors"
          title="Zoom Out"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11H3" />
          </svg>
        </button>
      </>
    )}

    {onReset && (
      <button
        onClick={onReset}
        className="p-2 rounded-md hover:bg-background-tertiary transition-colors"
        title="Reset View"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>
    )}

    {onToggleLegend && (
      <button
        onClick={onToggleLegend}
        className={`p-2 rounded-md hover:bg-background-tertiary transition-colors ${!showLegend ? 'opacity-50' : ''}`}
        title={showLegend ? 'Hide Legend' : 'Show Legend'}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </button>
    )}

    {onExport && (
      <button
        onClick={onExport}
        className="p-2 rounded-md hover:bg-background-tertiary transition-colors"
        title="Export Chart"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </button>
    )}

    {children}
  </div>
);

// ===== CHART LEGEND COMPONENT =====
export const ChartLegend = ({
  payload,
  onClick,
  className = '',
  orientation = 'horizontal',
  ...props
}) => {
  if (!payload || !payload.length) return null;

  return (
    <div
      className={`flex gap-6 ${orientation === 'vertical' ? 'flex-col' : 'flex-wrap justify-center'} ${className}`}
      {...props}
    >
      {payload.map((entry, index) => (
        <button
          key={index}
          onClick={() => onClick?.(entry)}
          className="flex items-center gap-2 px-3 py-1 rounded-md hover:bg-background-secondary transition-colors group"
        >
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-foreground group-hover:text-foreground-secondary transition-colors">
            {entry.value}
          </span>
        </button>
      ))}
    </div>
  );
};

// ===== DATA POINT HIGHLIGHTER =====
export const DataHighlighter = ({ active, payload, coordinate, className = '' }) => {
  if (!active || !coordinate) return null;

  return (
    <g className={className}>
      {/* Vertical line */}
      <line
        x1={coordinate.x}
        y1={0}
        x2={coordinate.x}
        y2="100%"
        stroke="var(--color-brand-accent)"
        strokeWidth={1}
        strokeDasharray="5 5"
        opacity={0.7}
      />
      {/* Horizontal line */}
      <line
        x1={0}
        y1={coordinate.y}
        x2="100%"
        y2={coordinate.y}
        stroke="var(--color-brand-accent)"
        strokeWidth={1}
        strokeDasharray="5 5"
        opacity={0.7}
      />
      {/* Highlight circle */}
      <circle
        cx={coordinate.x}
        cy={coordinate.y}
        r={4}
        fill="var(--color-brand-accent)"
        stroke="var(--color-background)"
        strokeWidth={2}
      />
    </g>
  );
};

// ===== EXPORT DEFAULT =====
export default CHART_THEME;
