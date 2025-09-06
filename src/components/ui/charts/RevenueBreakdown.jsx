import React, { useState, useCallback } from 'react';
import { ResponsiveContainer, Legend } from 'recharts';
import { PieChart as LazyPieChart } from '../LazyChart';

import { cn } from '../../../utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';

import { CHART_THEME, EnhancedTooltip, ChartControls, ChartLegend } from './ChartTheme';

const RevenueBreakdown = ({
  data = [],
  className,
  title = 'Revenue Breakdown',
  formatValue = value => `$${(value / 1000000).toFixed(1)}M`,
  showControls = true,
  showLegend = true,
  animationDuration = 750,
  height = 400
}) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [showChartLegend, setShowChartLegend] = useState(showLegend);

  // Use enhanced color scheme from theme
  const colors = CHART_THEME.series;

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const processedData = data.map((item, index) => ({
    ...item,
    percentage: ((item.value / total) * 100).toFixed(1),
    color: colors[index % colors.length],
    fill: colors[index % colors.length]
  }));

  const onPieEnter = useCallback((_, index) => {
    setActiveIndex(index);
  }, []);

  const onPieLeave = useCallback(() => {
    setActiveIndex(null);
  }, []);

  const handleLegendClick = useCallback(entry => {
    // Toggle visibility or highlight logic can be added here
    console.log('Legend clicked:', entry);
  }, []);

  const customTooltipFormatter = useCallback(
    (value, name, props) => {
      return [formatValue(value), name];
    },
    [formatValue]
  );

  const customLabelFormatter = useCallback(label => {
    return label;
  }, []);

  const renderActiveShape = useCallback(
    props => {
      const { cx, cy, midAngle, innerRadius, outerRadius, percent, name, value } = props;
      const RADIAN = Math.PI / 180;
      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);

      return (
        <g>
          {/* Enhanced active segment */}
          <Cell
            {...props}
            fill={props.fill}
            style={{
              filter: 'brightness(1.1) saturate(1.2)',
              stroke: 'var(--color-background)',
              strokeWidth: 2
            }}
          />
          {/* Label line */}
          <line
            x1={cx + (outerRadius + 10) * Math.cos(-midAngle * RADIAN)}
            y1={cy + (outerRadius + 10) * Math.sin(-midAngle * RADIAN)}
            x2={cx + (outerRadius + 20) * Math.cos(-midAngle * RADIAN)}
            y2={cy + (outerRadius + 20) * Math.sin(-midAngle * RADIAN)}
            stroke="var(--color-foreground)"
            strokeWidth={1}
          />
          {/* Value label */}
          <text
            x={cx + (outerRadius + 30) * Math.cos(-midAngle * RADIAN)}
            y={cy + (outerRadius + 30) * Math.sin(-midAngle * RADIAN)}
            fill="var(--color-foreground)"
            textAnchor={x > cx ? 'start' : 'end'}
            dominantBaseline="central"
            fontSize={12}
            fontWeight="500"
          >
            {`${name}: ${formatValue(value)}`}
          </text>
        </g>
      );
    },
    [formatValue]
  );

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>

        {/* Chart Controls */}
        {showControls && (
          <ChartControls
            onToggleLegend={() => setShowChartLegend(!showChartLegend)}
            showLegend={showChartLegend}
            className="mt-2"
          />
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Enhanced Chart */}
          <div className="relative" style={{ height, width: height }}>
            <ResponsiveContainer width="100%" height="100%">
              <LazyPieChart data={processedData} />
            </ResponsiveContainer>

            {/* Center Label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground font-mono">
                  {formatValue(total)}
                </div>
                <div className="text-sm text-foreground-secondary">Total Revenue</div>
              </div>
            </div>
          </div>

          {/* Enhanced Legend */}
          <div className="flex-1 min-w-0">
            <div className="space-y-2">
              {processedData.map((item, index) => (
                <div
                  key={item.name}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-lg transition-all duration-200 cursor-pointer group',
                    activeIndex === index
                      ? 'bg-background-secondary shadow-sm border border-border'
                      : 'hover:bg-background-secondary/50'
                  )}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-5 h-5 rounded-md flex-shrink-0 shadow-sm border-2 border-white"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground group-hover:text-foreground truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-foreground-secondary">
                        {item.percentage}% of total
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-mono text-base font-bold text-foreground">
                      {formatValue(item.value)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Enhanced Total */}
            <div className="mt-6 p-4 bg-gradient-to-r from-background-secondary to-background-tertiary rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-foreground text-lg">Total Revenue</span>
                  <p className="text-sm text-foreground-secondary">All segments combined</p>
                </div>
                <span className="font-mono text-2xl font-bold text-primary">
                  {formatValue(total)}
                </span>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="p-3 bg-background-secondary rounded-lg text-center">
                <div className="text-lg font-bold text-foreground">{processedData.length}</div>
                <div className="text-xs text-foreground-secondary">Segments</div>
              </div>
              <div className="p-3 bg-background-secondary rounded-lg text-center">
                <div className="text-lg font-bold text-success">
                  {processedData.filter(item => item.value > total * 0.1).length}
                </div>
                <div className="text-xs text-foreground-secondary">Major (&gt;10%)</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueBreakdown;
