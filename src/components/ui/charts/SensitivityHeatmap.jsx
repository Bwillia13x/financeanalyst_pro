import React, { useState } from 'react';

import { cn } from '../../../utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';

const SensitivityHeatmap = ({
  data = [],
  xAxisLabels = [],
  yAxisLabels = [],
  className,
  title = 'Sensitivity Analysis',
  _formatValue = (value) => `${value.toFixed(1)}%`,
  formatCell = (value) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
}) => {
  const [hoveredCell, setHoveredCell] = useState(null);

  // Calculate min/max for color scaling
  const allValues = data.flat();
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const range = maxValue - minValue;

  // Get color intensity based on value
  const getColorIntensity = (value) => {
    if (range === 0) return 0.5;
    return (value - minValue) / range;
  };

  // Get cell color based on value
  const getCellColor = (value, intensity) => {
    if (value > 0) {
      // Green for positive values
      return `rgba(34, 197, 94, ${0.2 + intensity * 0.6})`;
    } else if (value < 0) {
      // Red for negative values
      return `rgba(239, 68, 68, ${0.2 + intensity * 0.6})`;
    } else {
      // Neutral for zero
      return 'rgba(148, 163, 184, 0.2)';
    }
  };

  const CustomTooltip = ({ x, y, value, xLabel, yLabel }) => {
    if (hoveredCell?.x !== x || hoveredCell?.y !== y) return null;

    return (
      <div
        className="absolute pointer-events-none z-10 bg-white border border-gray-200 rounded-md shadow-elevation-2 p-3 min-w-[180px]"
        style={{
          left: hoveredCell.clientX + 10,
          top: hoveredCell.clientY - 60
        }}
      >
        <p className="font-medium text-sm text-foreground mb-1">
          {yLabel} × {xLabel}
        </p>
        <p className="text-sm text-muted-foreground">
          Impact:{' '}
          <span
            className={cn(
              'font-mono font-medium',
              value > 0 ? 'text-success' : value < 0 ? 'text-destructive' : 'text-muted-foreground'
            )}
          >
            {formatCell(value)}
          </span>
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
        <div className="relative overflow-auto">
          <div className="min-w-[600px]">
            {/* Header row */}
            <div className="grid grid-cols-[120px_repeat(var(--cols),1fr)] gap-1 mb-1">
              <div /> {/* Empty corner */}
              {xAxisLabels.map((label, index) => (
                <div key={index} className="text-center p-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Data rows */}
            {data.map((row, yIndex) => (
              <div
                key={yIndex}
                className="grid grid-cols-[120px_repeat(var(--cols),1fr)] gap-1 mb-1"
                style={{ '--cols': xAxisLabels.length }}
              >
                {/* Y-axis label */}
                <div className="flex items-center justify-end pr-3">
                  <span className="text-xs font-medium text-muted-foreground">
                    {yAxisLabels[yIndex]}
                  </span>
                </div>

                {/* Data cells */}
                {row.map((value, xIndex) => {
                  const intensity = getColorIntensity(value);
                  const backgroundColor = getCellColor(value, intensity);

                  return (
                    <div
                      key={xIndex}
                      className="relative h-12 rounded-sm border border-gray-100 cursor-pointer transition-all duration-200 hover:border-gray-300"
                      style={{ backgroundColor }}
                      onMouseEnter={(e) => {
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
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span
                          className={cn(
                            'text-xs font-mono font-medium',
                            Math.abs(value) > range * 0.6
                              ? 'text-white'
                              : 'text-gray-900'
                          )}
                        >
                          {formatCell(value)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Tooltip */}
          {hoveredCell && (
            <CustomTooltip
              x={hoveredCell.x}
              y={hoveredCell.y}
              value={hoveredCell.value}
              xLabel={xAxisLabels[hoveredCell.x]}
              yLabel={yAxisLabels[hoveredCell.y]}
            />
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-sm bg-red-500 opacity-40" />
              <div className="w-4 h-4 rounded-sm bg-red-500 opacity-80" />
            </div>
            <span className="text-xs text-muted-foreground">Negative Impact</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-sm bg-slate-400 opacity-20 border border-gray-200" />
            <span className="text-xs text-muted-foreground">Neutral</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-sm bg-green-500 opacity-40" />
              <div className="w-4 h-4 rounded-sm bg-green-500 opacity-80" />
            </div>
            <span className="text-xs text-muted-foreground">Positive Impact</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SensitivityHeatmap;
