import React from 'react';
import React, { Suspense, lazy } from 'react';
const LazyWaterfall = lazy(() =>
  import('recharts').then(module => ({
    default: ({ data, formatValue, CustomBar }) => {
      const { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip, CartesianGrid } = module;
      const CustomTooltip = ({ active, payload }) => {
        if (!active || !payload || !payload.length) return null;
        const d = payload[0].payload;
        return (
          <div className="bg-white border border-gray-200 rounded-md shadow-elevation-1 p-3 min-w-[160px]">
            <p className="font-medium text-sm text-foreground mb-1">{d.label}</p>
            <p className="text-sm text-muted-foreground">Value: <span className="font-mono font-medium">{formatValue(d.value)}</span></p>
            {!d.isTotal && (
              <p className="text-sm text-muted-foreground">Cumulative: <span className="font-mono font-medium">{formatValue(d.cumulative)}</span></p>
            )}
          </div>
        );
      };
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} angle={-45} textAnchor="end" height={80} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} tickFormatter={formatValue} />
            <ReferenceLine y={0} stroke="var(--color-border)" strokeWidth={1} />
            <Bar dataKey="value" shape={<CustomBar />} radius={[2, 2, 0, 0]} />
            <Tooltip content={<CustomTooltip />} />
          </BarChart>
        </ResponsiveContainer>
      );
    }
  }))
);

import { cn } from '../../../utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';

const DCFWaterfall = ({
  data = [],
  className,
  title = 'DCF Cash Flow Components',
  formatValue = value => `$${(value / 1000000).toFixed(1)}M`
}) => {
  // Calculate cumulative values for waterfall effect
  const processedData = data.reduce((acc, item, index) => {
    const prevTotal = index === 0 ? 0 : acc[index - 1].cumulative;
    const cumulative = prevTotal + item.value;

    acc.push({
      ...item,
      cumulative,
      start: prevTotal,
      isPositive: item.value >= 0,
      isTotal: item.type === 'total'
    });

    return acc;
  }, []);

  const CustomBar = props => {
    const { payload, x, y, width, height } = props;
    if (!payload) return null;

    const barColor = payload.isTotal
      ? 'var(--color-primary)'
      : payload.isPositive
        ? 'var(--color-secondary)'
        : 'var(--color-destructive)';

    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={barColor}
        className="transition-opacity duration-200 hover:opacity-80"
      />
    );
  };

  const CustomTooltip = ({ active, payload, label: _label }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;

    return (
      <div className="bg-white border border-gray-200 rounded-md shadow-elevation-1 p-3 min-w-[160px]">
        <p className="font-medium text-sm text-foreground mb-1">{data.label}</p>
        <p className="text-sm text-muted-foreground">
          Value: <span className="font-mono font-medium">{formatValue(data.value)}</span>
        </p>
        {!data.isTotal && (
          <p className="text-sm text-muted-foreground">
            Cumulative:{' '}
            <span className="font-mono font-medium">{formatValue(data.cumulative)}</span>
          </p>
        )}
      </div>
    );
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-80 w-full">
          <Suspense fallback={<div className="flex items-center justify-center h-full text-sm text-muted-foreground">Loading chart…</div>}>
            <LazyWaterfall data={processedData} formatValue={formatValue} CustomBar={CustomBar} />
          </Suspense>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-secondary" />
            <span className="text-sm text-muted-foreground">Positive</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-destructive" />
            <span className="text-sm text-muted-foreground">Negative</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-primary" />
            <span className="text-sm text-muted-foreground">Total</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DCFWaterfall;
