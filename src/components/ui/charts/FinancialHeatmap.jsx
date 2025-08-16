/**
 * Financial Heatmap Component
 * Interactive correlation and performance heatmaps for financial data
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Info, 
  Download,
  Settings,
  Palette
} from 'lucide-react';

/**
 * Color interpolation for heatmap
 */
const interpolateColor = (value, min, max, colorScheme = 'redGreen') => {
  const normalizedValue = Math.max(0, Math.min(1, (value - min) / (max - min)));
  
  const colorSchemes = {
    redGreen: {
      low: { r: 220, g: 38, b: 38 },    // Red
      mid: { r: 255, g: 255, b: 255 },  // White
      high: { r: 34, g: 197, b: 94 }    // Green
    },
    blueRed: {
      low: { r: 59, g: 130, b: 246 },   // Blue
      mid: { r: 255, g: 255, b: 255 },  // White
      high: { r: 239, g: 68, b: 68 }    // Red
    },
    thermal: {
      low: { r: 0, g: 0, b: 128 },      // Dark blue
      mid: { r: 255, g: 165, b: 0 },    // Orange
      high: { r: 255, g: 0, b: 0 }      // Red
    }
  };

  const scheme = colorSchemes[colorScheme];
  let color;

  if (normalizedValue < 0.5) {
    const ratio = normalizedValue * 2;
    color = {
      r: Math.round(scheme.low.r + (scheme.mid.r - scheme.low.r) * ratio),
      g: Math.round(scheme.low.g + (scheme.mid.g - scheme.low.g) * ratio),
      b: Math.round(scheme.low.b + (scheme.mid.b - scheme.low.b) * ratio)
    };
  } else {
    const ratio = (normalizedValue - 0.5) * 2;
    color = {
      r: Math.round(scheme.mid.r + (scheme.high.r - scheme.mid.r) * ratio),
      g: Math.round(scheme.mid.g + (scheme.high.g - scheme.mid.g) * ratio),
      b: Math.round(scheme.mid.b + (scheme.high.b - scheme.mid.b) * ratio)
    };
  }

  return `rgb(${color.r}, ${color.g}, ${color.b})`;
};

/**
 * Heatmap Cell Component
 */
const HeatmapCell = ({ 
  value, 
  rowLabel, 
  colLabel, 
  color, 
  textColor, 
  onClick, 
  onHover,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`${sizeClasses[size]} flex items-center justify-center cursor-pointer border border-slate-200 transition-all duration-200 hover:border-slate-400 relative group`}
      style={{ backgroundColor: color, color: textColor }}
      onClick={() => onClick && onClick(rowLabel, colLabel, value)}
      onMouseEnter={() => onHover && onHover(rowLabel, colLabel, value)}
      onMouseLeave={() => onHover && onHover(null, null, null)}
    >
      <span className="font-mono font-semibold">
        {typeof value === 'number' ? value.toFixed(2) : value}
      </span>
      
      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
        {rowLabel} × {colLabel}: {typeof value === 'number' ? value.toFixed(4) : value}
      </div>
    </motion.div>
  );
};

/**
 * Color Legend Component
 */
const ColorLegend = ({ min, max, colorScheme, title }) => {
  const steps = 10;
  const stepSize = (max - min) / steps;
  
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm font-medium text-slate-700">{title}</span>
      <div className="flex items-center gap-1">
        <span className="text-xs text-slate-500">{min.toFixed(2)}</span>
        <div className="flex">
          {Array.from({ length: steps }, (_, i) => {
            const value = min + (stepSize * i);
            const color = interpolateColor(value, min, max, colorScheme);
            return (
              <div
                key={i}
                className="w-4 h-4 border border-slate-200"
                style={{ backgroundColor: color }}
              />
            );
          })}
        </div>
        <span className="text-xs text-slate-500">{max.toFixed(2)}</span>
      </div>
    </div>
  );
};

/**
 * Main Financial Heatmap Component
 */
const FinancialHeatmap = ({
  data = [],
  rowLabels = [],
  colLabels = [],
  title = "Financial Heatmap",
  type = "correlation", // correlation, returns, risk, etc.
  colorScheme = "redGreen",
  cellSize = "md",
  showValues = true,
  showLegend = true,
  symmetric = false,
  className = "",
  onCellClick = null,
  onExport = null
}) => {
  const [selectedCell, setSelectedCell] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [currentColorScheme, setCurrentColorScheme] = useState(colorScheme);
  const [showSettings, setShowSettings] = useState(false);

  // Calculate min/max values for color scaling
  const { minValue, maxValue } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    
    data.forEach(row => {
      row.forEach(value => {
        if (typeof value === 'number' && !isNaN(value)) {
          min = Math.min(min, value);
          max = Math.max(max, value);
        }
      });
    });
    
    // For correlation matrices, ensure symmetric range around 0
    if (type === 'correlation') {
      const absMax = Math.max(Math.abs(min), Math.abs(max));
      return { minValue: -absMax, maxValue: absMax };
    }
    
    return { minValue: min, maxValue: max };
  }, [data, type]);

  // Get text color based on background color
  const getTextColor = useCallback((value) => {
    const color = interpolateColor(value, minValue, maxValue, currentColorScheme);
    // Simple brightness calculation
    const rgb = color.match(/\d+/g);
    const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  }, [minValue, maxValue, currentColorScheme]);

  const handleCellHover = useCallback((rowLabel, colLabel, value) => {
    setHoveredCell(rowLabel && colLabel ? { rowLabel, colLabel, value } : null);
  }, []);

  const handleCellClick = useCallback((rowLabel, colLabel, value) => {
    setSelectedCell({ rowLabel, colLabel, value });
    if (onCellClick) {
      onCellClick(rowLabel, colLabel, value);
    }
  }, [onCellClick]);

  const handleExport = useCallback(() => {
    if (onExport) {
      onExport();
    } else {
      // Default export as CSV
      const csvContent = [
        ['', ...colLabels].join(','),
        ...data.map((row, i) => [rowLabels[i], ...row].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/\s+/g, '_')}_heatmap.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }
  }, [data, rowLabels, colLabels, title, onExport]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg border border-slate-200 shadow-sm ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {hoveredCell && (
            <p className="text-sm text-slate-600 mt-1">
              {hoveredCell.rowLabel} × {hoveredCell.colLabel}: {hoveredCell.value?.toFixed(4)}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Settings size={16} />
          </button>
          <button
            onClick={handleExport}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Export Data"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-4 border-b border-slate-200 bg-slate-50"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Palette size={16} />
              <span className="text-sm font-medium">Color Scheme:</span>
              <select
                value={currentColorScheme}
                onChange={(e) => setCurrentColorScheme(e.target.value)}
                className="text-sm border border-slate-300 rounded px-2 py-1"
              >
                <option value="redGreen">Red-Green</option>
                <option value="blueRed">Blue-Red</option>
                <option value="thermal">Thermal</option>
              </select>
            </div>
          </div>
        </motion.div>
      )}

      {/* Heatmap Container */}
      <div className="p-4">
        <div className="flex">
          {/* Row Labels */}
          <div className="flex flex-col">
            <div className={cellSize === 'sm' ? 'h-8' : cellSize === 'md' ? 'h-12' : 'h-16'} /> {/* Spacer for column headers */}
            {rowLabels.map((label, index) => (
              <div
                key={index}
                className={`${cellSize === 'sm' ? 'h-8' : cellSize === 'md' ? 'h-12' : 'h-16'} flex items-center justify-end pr-2 text-sm font-medium text-slate-700 min-w-[120px]`}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Main Heatmap */}
          <div className="flex flex-col">
            {/* Column Labels */}
            <div className="flex">
              {colLabels.map((label, index) => (
                <div
                  key={index}
                  className={`${cellSize === 'sm' ? 'w-8 h-8' : cellSize === 'md' ? 'w-12 h-12' : 'w-16 h-16'} flex items-center justify-center text-sm font-medium text-slate-700 transform -rotate-45 origin-center`}
                  style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                >
                  <span className="truncate">{label}</span>
                </div>
              ))}
            </div>

            {/* Heatmap Cells */}
            {data.map((row, rowIndex) => (
              <div key={rowIndex} className="flex">
                {row.map((value, colIndex) => {
                  // Skip diagonal cells for symmetric matrices if desired
                  if (symmetric && rowIndex === colIndex) {
                    return (
                      <div
                        key={colIndex}
                        className={`${cellSize === 'sm' ? 'w-8 h-8' : cellSize === 'md' ? 'w-12 h-12' : 'w-16 h-16'} border border-slate-300 bg-slate-100`}
                      />
                    );
                  }

                  const cellColor = interpolateColor(value, minValue, maxValue, currentColorScheme);
                  const textColor = showValues ? getTextColor(value) : 'transparent';

                  return (
                    <HeatmapCell
                      key={colIndex}
                      value={showValues ? value : ''}
                      rowLabel={rowLabels[rowIndex]}
                      colLabel={colLabels[colIndex]}
                      color={cellColor}
                      textColor={textColor}
                      size={cellSize}
                      onClick={handleCellClick}
                      onHover={handleCellHover}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="mt-6 flex justify-center">
            <ColorLegend
              min={minValue}
              max={maxValue}
              colorScheme={currentColorScheme}
              title={type === 'correlation' ? 'Correlation' : 'Value'}
            />
          </div>
        )}

        {/* Statistics */}
        <div className="mt-4 flex items-center justify-center gap-6 text-sm text-slate-600">
          <div className="flex items-center gap-1">
            <TrendingDown size={14} />
            <span>Min: {minValue.toFixed(3)}</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp size={14} />
            <span>Max: {maxValue.toFixed(3)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Info size={14} />
            <span>{data.length} × {data[0]?.length || 0} matrix</span>
          </div>
        </div>

        {/* Selected Cell Info */}
        {selectedCell && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200"
          >
            <h4 className="font-semibold text-blue-900">Selected Cell</h4>
            <p className="text-sm text-blue-700">
              <strong>{selectedCell.rowLabel}</strong> × <strong>{selectedCell.colLabel}</strong>
            </p>
            <p className="text-lg font-mono font-bold text-blue-900">
              {selectedCell.value?.toFixed(6)}
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default FinancialHeatmap;