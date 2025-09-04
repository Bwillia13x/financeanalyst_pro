import React, { useState, useCallback } from 'react';

import { cn } from '../../../utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';

import { CHART_THEME, EnhancedTooltip, ChartControls } from './ChartTheme';

const SensitivityHeatmap = ({
  data = [],
  xAxisLabels = [],
  yAxisLabels = [],
  className,
  title = 'Sensitivity Analysis',
  formatValue = value => `${value.toFixed(1)}%`,
  formatCell = value => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`,
  showControls = true,
  animationDuration = 750
}) => {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Calculate min/max for color scaling
  const allValues = data.flat();
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const range = maxValue - minValue;

  // Get color intensity based on value
  const getColorIntensity = useCallback(
    value => {
      if (range === 0) return 0.5;
      return (value - minValue) / range;
    },
    [minValue, maxValue, range]
  );

  // Get cell color using financial domain colors
  const getCellColor = useCallback(
    (value, intensity) => {
      if (value > 0) {
        // Positive values - revenue colors with opacity
        const opacity = Math.round((0.3 + intensity * 0.7) * 255)
          .toString(16)
          .padStart(2, '0');
        return value > range * 0.7
          ? `${CHART_THEME.colors.revenueDark}${opacity}`
          : value > range * 0.4
            ? `${CHART_THEME.colors.revenueMedium}${opacity}`
            : `${CHART_THEME.colors.revenueLight}${opacity}`;
      } else if (value < 0) {
        // Negative values - expense colors with opacity
        const opacity = Math.round((0.3 + intensity * 0.7) * 255)
          .toString(16)
          .padStart(2, '0');
        const absValue = Math.abs(value);
        return absValue > range * 0.7
          ? `${CHART_THEME.colors.expenseDark}${opacity}`
          : absValue > range * 0.4
            ? `${CHART_THEME.colors.expenseMedium}${opacity}`
            : `${CHART_THEME.colors.expenseLight}${opacity}`;
      } else {
        // Neutral for zero
        return CHART_THEME.colors.neutralLight;
      }
    },
    [range]
  );

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>

        {/* Chart Controls */}
        {showControls && (
          <ChartControls
            onZoomIn={() => setZoomLevel(Math.min(zoomLevel * 1.2, 2))}
            onZoomOut={() => setZoomLevel(Math.max(zoomLevel * 0.8, 0.5))}
            onReset={() => setZoomLevel(1)}
            className="mt-2"
          />
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="relative overflow-auto">
          <div
            className="min-w-[600px] transition-transform duration-300"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top left',
              width: `${100 / zoomLevel}%`
            }}
          >
            {/* Header row */}
            <div className="grid grid-cols-[140px_repeat(var(--cols),1fr)] gap-2 mb-2">
              <div className="p-3 bg-background-secondary rounded-lg">
                <span className="text-sm font-semibold text-foreground">Variables</span>
              </div>
              {xAxisLabels.map((label, index) => (
                <div key={index} className="text-center p-3 bg-background-secondary rounded-lg">
                  <span className="text-sm font-medium text-foreground">{label}</span>
                </div>
              ))}
            </div>

            {/* Data rows */}
            {data.map((row, yIndex) => (
              <div
                key={yIndex}
                className="grid grid-cols-[140px_repeat(var(--cols),1fr)] gap-2 mb-2"
                style={{ '--cols': xAxisLabels.length }}
              >
                {/* Y-axis label */}
                <div className="flex items-center justify-end pr-4 py-3 bg-background-secondary rounded-lg">
                  <span className="text-sm font-medium text-foreground">{yAxisLabels[yIndex]}</span>
                </div>

                {/* Data cells */}
                {row.map((value, xIndex) => {
                  const intensity = getColorIntensity(value);
                  const backgroundColor = getCellColor(value, intensity);
                  const isHighlighted = hoveredCell?.x === xIndex && hoveredCell?.y === yIndex;

                  return (
                    <div
                      key={xIndex}
                      className={cn(
                        'relative h-16 rounded-lg border-2 cursor-pointer transition-all duration-300',
                        'hover:shadow-lg hover:shadow-brand-primary/20 hover:scale-105',
                        isHighlighted
                          ? 'border-brand-accent shadow-lg shadow-brand-accent/30 scale-105'
                          : 'border-border hover:border-brand-accent/50'
                      )}
                      style={{
                        backgroundColor,
                        transform: isHighlighted ? 'scale(1.05)' : 'scale(1)'
                      }}
                      onMouseEnter={e => {
                        setHoveredCell({
                          x: xIndex,
                          y: yIndex,
                          value,
                          clientX: e.clientX,
                          clientY: e.clientY
                        });
                      }}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      <div className="absolute inset-0 flex items-center justify-center p-2">
                        <span
                          className={cn(
                            'text-sm font-mono font-bold text-center leading-tight',
                            Math.abs(value) > range * 0.6 ? 'text-white' : 'text-foreground',
                            isHighlighted && 'text-white'
                          )}
                        >
                          {formatCell(value)}
                        </span>
                      </div>

                      {/* Highlight ring for active cell */}
                      {isHighlighted && (
                        <div className="absolute inset-0 rounded-lg border-2 border-white shadow-lg" />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Enhanced Tooltip */}
          {hoveredCell && (
            <div
              className="absolute pointer-events-none z-20 bg-background border border-border rounded-lg shadow-xl p-4 min-w-[220px]"
              style={{
                left: Math.min(hoveredCell.clientX + 20, window.innerWidth - 240),
                top: Math.max(hoveredCell.clientY - 120, 20)
              }}
            >
              <div className="space-y-3">
                <div className="font-semibold text-foreground text-sm">
                  {yAxisLabels[hoveredCell.y]} × {xAxisLabels[hoveredCell.x]}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground-secondary">Impact:</span>
                  <span
                    className={cn(
                      'font-mono font-bold text-lg',
                      hoveredCell.value > 0
                        ? 'text-success'
                        : hoveredCell.value < 0
                          ? 'text-destructive'
                          : 'text-foreground'
                    )}
                  >
                    {formatCell(hoveredCell.value)}
                  </span>
                </div>

                <div className="text-xs text-foreground-secondary">
                  {hoveredCell.value > 0
                    ? 'Positive impact on valuation'
                    : hoveredCell.value < 0
                      ? 'Negative impact on valuation'
                      : 'Neutral impact on valuation'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Legend */}
        <div className="flex items-center justify-center gap-8 mt-8 pt-6 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div
                className="w-5 h-5 rounded-md shadow-sm"
                style={{ backgroundColor: CHART_THEME.colors.expenseLight }}
              />
              <div
                className="w-5 h-5 rounded-md shadow-sm"
                style={{ backgroundColor: CHART_THEME.colors.expenseMedium }}
              />
              <div
                className="w-5 h-5 rounded-md shadow-sm"
                style={{ backgroundColor: CHART_THEME.colors.expenseDark }}
              />
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-foreground">Negative Impact</div>
              <div className="text-xs text-foreground-secondary">Decreases valuation</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="w-5 h-5 rounded-md shadow-sm border-2 border-border"
              style={{ backgroundColor: CHART_THEME.colors.neutralLight }}
            />
            <div className="text-center">
              <div className="text-sm font-medium text-foreground">Neutral</div>
              <div className="text-xs text-foreground-secondary">No significant impact</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div
                className="w-5 h-5 rounded-md shadow-sm"
                style={{ backgroundColor: CHART_THEME.colors.revenueLight }}
              />
              <div
                className="w-5 h-5 rounded-md shadow-sm"
                style={{ backgroundColor: CHART_THEME.colors.revenueMedium }}
              />
              <div
                className="w-5 h-5 rounded-md shadow-sm"
                style={{ backgroundColor: CHART_THEME.colors.revenueDark }}
              />
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-foreground">Positive Impact</div>
              <div className="text-xs text-foreground-secondary">Increases valuation</div>
            </div>
          </div>
        </div>

        {/* Statistics Summary */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="p-4 bg-background-secondary rounded-lg text-center">
            <div className="text-2xl font-bold text-success">
              {data.flat().filter(v => v > 0).length}
            </div>
            <div className="text-sm text-foreground-secondary">Positive Cells</div>
          </div>
          <div className="p-4 bg-background-secondary rounded-lg text-center">
            <div className="text-2xl font-bold text-destructive">
              {data.flat().filter(v => v < 0).length}
            </div>
            <div className="text-sm text-foreground-secondary">Negative Cells</div>
          </div>
          <div className="p-4 bg-background-secondary rounded-lg text-center">
            <div className="text-2xl font-bold text-foreground">
              {data.flat().filter(v => v === 0).length}
            </div>
            <div className="text-sm text-foreground-secondary">Neutral Cells</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SensitivityHeatmap;
