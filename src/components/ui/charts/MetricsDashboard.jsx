import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import React from 'react';

import { cn } from '../../../utils/cn';
import { Card, CardContent } from '../Card';

const MetricCard = ({
  title,
  value,
  change,
  format = 'number',
  prefix = '',
  suffix = '',
  className
}) => {
  const formatValue = (val) => {
    if (format === 'currency') {
      return `$${(val / 1000000).toFixed(1)}M`;
    } else if (format === 'percentage') {
      return `${val.toFixed(1)}%`;
    } else if (format === 'ratio') {
      return val.toFixed(2);
    } else if (format === 'large-number') {
      if (val >= 1000000000) return `${(val / 1000000000).toFixed(1)}B`;
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
      return val.toFixed(0);
    }
    return val.toLocaleString();
  };

  const getTrendIcon = () => {
    if (change > 0) return TrendingUp;
    if (change < 0) return TrendingDown;
    return Minus;
  };

  const getTrendColor = () => {
    if (change > 0) return 'text-success';
    if (change < 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const TrendIcon = getTrendIcon();

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {change !== undefined && (
            <div className={cn('flex items-center gap-1', getTrendColor())}>
              <TrendIcon className="h-4 w-4" />
              <span className="text-xs font-medium">
                {Math.abs(change).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        <div className="flex items-baseline gap-1">
          {prefix && <span className="text-lg text-muted-foreground">{prefix}</span>}
          <p className="text-2xl font-bold text-foreground">
            {formatValue(value)}
          </p>
          {suffix && <span className="text-lg text-muted-foreground">{suffix}</span>}
        </div>
        {change !== undefined && (
          <p className="text-xs text-muted-foreground mt-1">
            vs. previous period
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const MetricsDashboard = ({
  metrics = [],
  className,
  title = 'Key Financial Metrics',
  columns = 4
}) => {
  const gridClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
  };

  // Group metrics by category if categories exist
  const groupedMetrics = metrics.reduce((groups, metric) => {
    const category = metric.category || 'default';
    if (!groups[category]) groups[category] = [];
    groups[category].push(metric);
    return groups;
  }, {});

  const hasCategories = Object.keys(groupedMetrics).length > 1 ||
    (Object.keys(groupedMetrics).length === 1 && !groupedMetrics.default);

  return (
    <div className={cn('w-full space-y-6', className)}>
      {title && (
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">{title}</h2>
          <div className="h-px bg-gradient-to-r from-border to-transparent" />
        </div>
      )}

      {hasCategories ? (
        // Render with categories
        Object.entries(groupedMetrics).map(([category, categoryMetrics]) => (
          <div key={category}>
            {category !== 'default' && (
              <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                {category}
                <div className="flex-1 h-px bg-muted" />
              </h3>
            )}
            <div className={cn('grid gap-4', gridClasses[Math.min(columns, 6)])}>
              {categoryMetrics.map((metric, index) => (
                <MetricCard
                  key={`${category}-${index}`}
                  title={metric.title}
                  value={metric.value}
                  change={metric.change}
                  format={metric.format}
                  prefix={metric.prefix}
                  suffix={metric.suffix}
                  className={metric.highlight ? 'ring-2 ring-secondary ring-opacity-20' : ''}
                />
              ))}
            </div>
          </div>
        ))
      ) : (
        // Render without categories
        <div className={cn('grid gap-4', gridClasses[Math.min(columns, 6)])}>
          {metrics.map((metric, index) => (
            <MetricCard
              key={index}
              title={metric.title}
              value={metric.value}
              change={metric.change}
              format={metric.format}
              prefix={metric.prefix}
              suffix={metric.suffix}
              className={metric.highlight ? 'ring-2 ring-secondary ring-opacity-20' : ''}
            />
          ))}
        </div>
      )}

      {/* Summary footer if provided */}
      {metrics.some(m => m.isSummary) && (
        <div className="pt-4 border-t border-muted">
          <div className={cn('grid gap-4', gridClasses[Math.min(columns, 6)])}>
            {metrics
              .filter(m => m.isSummary)
              .map((metric, index) => (
                <MetricCard
                  key={`summary-${index}`}
                  title={metric.title}
                  value={metric.value}
                  change={metric.change}
                  format={metric.format}
                  prefix={metric.prefix}
                  suffix={metric.suffix}
                  className="bg-primary/5 border-primary/20"
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export { MetricsDashboard, MetricCard };
