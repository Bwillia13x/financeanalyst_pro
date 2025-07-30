import React from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Dot } from 'recharts';
import { cn } from '../../../utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';

const TrendLine = ({ 
  data = [], 
  className,
  title = "Growth Trend Analysis",
  dataKey = "value",
  formatValue = (value) => `${value.toFixed(1)}%`,
  showGrowthRate = true
}) => {
  // Calculate period-over-period growth
  const processedData = data.map((item, index) => {
    if (index === 0) return { ...item, growth: null };
    
    const prevValue = data[index - 1][dataKey];
    const currentValue = item[dataKey];
    const growth = prevValue !== 0 ? ((currentValue - prevValue) / prevValue) * 100 : 0;
    
    return { ...item, growth };
  });

  // Calculate overall trend
  const firstValue = data[0]?.[dataKey] || 0;
  const lastValue = data[data.length - 1]?.[dataKey] || 0;
  const overallGrowth = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
  const isPositiveTrend = overallGrowth >= 0;

  const CustomDot = (props) => {
    const { payload, cx, cy } = props;
    if (!payload) return null;

    return (
      <Dot
        cx={cx}
        cy={cy}
        r={4}
        fill="var(--color-secondary)"
        className="transition-all duration-200 hover:r-6"
      />
    );
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    
    return (
      <div className="bg-white border border-gray-200 rounded-md shadow-elevation-1 p-3 min-w-[160px]">
        <p className="font-medium text-sm text-foreground mb-1">{label}</p>
        <p className="text-sm text-muted-foreground">
          Value: <span className="font-mono font-medium">{formatValue(data[dataKey])}</span>
        </p>
        {data.growth !== null && (
          <p className="text-sm text-muted-foreground">
            Growth: <span className={cn(
              "font-mono font-medium",
              data.growth >= 0 ? "text-success" : "text-destructive"
            )}>
              {data.growth >= 0 ? '+' : ''}{data.growth.toFixed(1)}%
            </span>
          </p>
        )}
      </div>
    );
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
          {showGrowthRate && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Overall Growth</p>
              <p className={cn(
                "text-sm font-mono font-semibold",
                isPositiveTrend ? "text-success" : "text-destructive"
              )}>
                {isPositiveTrend ? '+' : ''}{overallGrowth.toFixed(1)}%
              </p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={processedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <XAxis 
                dataKey="period"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                tickFormatter={formatValue}
              />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke="var(--color-secondary)"
                strokeWidth={3}
                dot={<CustomDot />}
                activeDot={{ 
                  r: 6, 
                  fill: 'var(--color-secondary)',
                  stroke: 'var(--color-background)',
                  strokeWidth: 2
                }}
                className="drop-shadow-sm"
              />
              <CustomTooltip />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Starting Value</p>
            <p className="font-mono text-sm font-medium text-foreground">
              {formatValue(firstValue)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Current Value</p>
            <p className="font-mono text-sm font-medium text-foreground">
              {formatValue(lastValue)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Net Change</p>
            <p className={cn(
              "font-mono text-sm font-medium",
              isPositiveTrend ? "text-success" : "text-destructive"
            )}>
              {isPositiveTrend ? '+' : ''}{overallGrowth.toFixed(1)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrendLine;