import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

import { cn } from '../../../utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';

const RevenueBreakdown = ({
  data = [],
  className,
  title = 'Revenue Breakdown',
  formatValue = value => `$${(value / 1000000).toFixed(1)}M`
}) => {
  const [activeIndex, setActiveIndex] = useState(null);

  // Generate colors using CSS variables with fallbacks
  const colors = [
    'var(--color-primary)',
    'var(--color-secondary)',
    'var(--color-accent)',
    'var(--color-success)',
    'var(--color-warning)',
    '#64748b', // slate-500
    '#94a3b8', // slate-400
    '#cbd5e1' // slate-300
  ];

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const processedData = data.map((item, index) => ({
    ...item,
    percentage: ((item.value / total) * 100).toFixed(1),
    color: colors[index % colors.length]
  }));

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;

    return (
      <div className="bg-white border border-gray-200 rounded-md shadow-elevation-1 p-3 min-w-[160px]">
        <p className="font-medium text-sm text-foreground mb-1">{data.name}</p>
        <p className="text-sm text-muted-foreground">
          Value: <span className="font-mono font-medium">{formatValue(data.value)}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Share: <span className="font-mono font-medium">{data.percentage}%</span>
        </p>
      </div>
    );
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Chart */}
          <div className="h-80 w-80 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={processedData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                >
                  {processedData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      className="transition-all duration-200"
                      style={{
                        filter: activeIndex === index ? 'brightness(1.1)' : 'none',
                        transform: activeIndex === index ? 'scale(1.02)' : 'scale(1)',
                        transformOrigin: 'center'
                      }}
                    />
                  ))}
                </Pie>
                <CustomTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex-1 min-w-0">
            <div className="space-y-3">
              {processedData.map((item, index) => (
                <div
                  key={item.name}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-md transition-colors duration-200 cursor-pointer',
                    activeIndex === index ? 'bg-muted' : 'hover:bg-gray-50'
                  )}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-4 h-4 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.percentage}% of total</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-mono text-sm font-medium text-foreground">
                      {formatValue(item.value)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Total Revenue</span>
                <span className="font-mono text-lg font-bold text-primary">
                  {formatValue(total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueBreakdown;
