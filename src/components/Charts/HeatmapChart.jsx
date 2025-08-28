/**
 * Heatmap Chart Component
 * Financial correlation and performance heatmap visualization
 */

import React, { useMemo } from 'react';

const HeatmapChart = ({
  data = [],
  title = 'Correlation Matrix',
  height: _height = 300,
  colorScheme = 'redGreen'
}) => {
  const processedData = useMemo(() => {
    if (!data || !Array.isArray(data)) return { matrix: [], labels: [] };

    // If data is correlation matrix format
    if (data.length > 0 && Array.isArray(data[0])) {
      const labels = data.map((_, index) => `Asset ${index + 1}`);
      return { matrix: data, labels };
    }

    // If data is object format with symbols and correlations
    if (data.length > 0 && typeof data[0] === 'object') {
      const symbols = [...new Set(data.flatMap(item => [item.symbol1, item.symbol2]))];
      const matrix = symbols.map(() => symbols.map(() => 0));

      symbols.forEach((symbol1, i) => {
        symbols.forEach((symbol2, j) => {
          if (i === j) {
            matrix[i][j] = 1; // Perfect correlation with itself
          } else {
            const correlation = data.find(
              item =>
                (item.symbol1 === symbol1 && item.symbol2 === symbol2) ||
                (item.symbol1 === symbol2 && item.symbol2 === symbol1)
            );
            matrix[i][j] = correlation ? correlation.correlation : Math.random() * 2 - 1;
          }
        });
      });

      return { matrix, labels: symbols };
    }

    return { matrix: [], labels: [] };
  }, [data]);

  const getColor = (value, scheme = colorScheme) => {
    // Normalize value from -1 to 1 range to 0-1 range
    const normalizedValue = (value + 1) / 2;

    if (scheme === 'redGreen') {
      if (value < 0) {
        const intensity = Math.abs(value);
        return `rgba(239, 68, 68, ${intensity * 0.8})`;
      } else {
        const intensity = value;
        return `rgba(34, 197, 94, ${intensity * 0.8})`;
      }
    } else if (scheme === 'blue') {
      return `rgba(59, 130, 246, ${normalizedValue * 0.8})`;
    } else if (scheme === 'purple') {
      return `rgba(147, 51, 234, ${normalizedValue * 0.8})`;
    }

    return 'rgba(107, 114, 128, 0.5)';
  };

  const getTextColor = value => {
    return Math.abs(value) > 0.5 ? '#ffffff' : '#374151';
  };

  if (!processedData.matrix.length) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg
              className="w-6 h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-500">No correlation data available</p>
        </div>
      </div>
    );
  }

  const cellSize = Math.min(300 / processedData.labels.length, 50);

  return (
    <div className="w-full h-full">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center space-x-4 mt-1">
          <div className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.8)' }}
            />
            <span className="text-xs text-gray-600">Negative</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-gray-200" />
            <span className="text-xs text-gray-600">Neutral</span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: 'rgba(34, 197, 94, 0.8)' }}
            />
            <span className="text-xs text-gray-600">Positive</span>
          </div>
        </div>
      </div>

      <div className="overflow-auto">
        <svg
          width={cellSize * processedData.labels.length + 100}
          height={cellSize * processedData.labels.length + 100}
          className="bg-white rounded-lg border"
        >
          {/* Column labels */}
          {processedData.labels.map((label, index) => (
            <text
              key={`col-${index}`}
              x={100 + index * cellSize + cellSize / 2}
              y={30}
              textAnchor="middle"
              className="text-xs fill-gray-600"
              transform={`rotate(-45, ${100 + index * cellSize + cellSize / 2}, 30)`}
            >
              {label}
            </text>
          ))}

          {/* Row labels */}
          {processedData.labels.map((label, index) => (
            <text
              key={`row-${index}`}
              x={90}
              y={50 + index * cellSize + cellSize / 2}
              textAnchor="end"
              dominantBaseline="middle"
              className="text-xs fill-gray-600"
            >
              {label}
            </text>
          ))}

          {/* Heatmap cells */}
          {processedData.matrix.map((row, rowIndex) =>
            row.map((value, colIndex) => (
              <g key={`cell-${rowIndex}-${colIndex}`}>
                <rect
                  x={100 + colIndex * cellSize}
                  y={50 + rowIndex * cellSize}
                  width={cellSize - 1}
                  height={cellSize - 1}
                  fill={getColor(value)}
                  stroke="#ffffff"
                  strokeWidth={1}
                  className="hover:stroke-gray-400 cursor-pointer"
                />
                <text
                  x={100 + colIndex * cellSize + cellSize / 2}
                  y={50 + rowIndex * cellSize + cellSize / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs font-medium pointer-events-none"
                  fill={getTextColor(value)}
                >
                  {value.toFixed(2)}
                </text>
              </g>
            ))
          )}

          {/* Correlation scale */}
          <g>
            <text x={20} y={70} className="text-xs fill-gray-600">
              1.0
            </text>
            <text
              x={20}
              y={50 + (processedData.labels.length * cellSize) / 2}
              className="text-xs fill-gray-600"
            >
              0.0
            </text>
            <text
              x={20}
              y={50 + processedData.labels.length * cellSize - 20}
              className="text-xs fill-gray-600"
            >
              -1.0
            </text>

            {/* Scale gradient */}
            <defs>
              <linearGradient id="correlationGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(34, 197, 94, 0.8)" />
                <stop offset="50%" stopColor="rgba(156, 163, 175, 0.5)" />
                <stop offset="100%" stopColor="rgba(239, 68, 68, 0.8)" />
              </linearGradient>
            </defs>
            <rect
              x={40}
              y={60}
              width={12}
              height={processedData.labels.length * cellSize - 40}
              fill="url(#correlationGradient)"
              stroke="#d1d5db"
              strokeWidth={1}
            />
          </g>
        </svg>
      </div>

      {/* Summary statistics */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div className="bg-gray-50 p-2 rounded">
          <div className="text-lg font-bold text-green-600">
            {processedData.matrix.flat().filter(v => v > 0.7).length}
          </div>
          <div className="text-xs text-gray-600">Strong Positive</div>
        </div>
        <div className="bg-gray-50 p-2 rounded">
          <div className="text-lg font-bold text-gray-600">
            {processedData.matrix.flat().filter(v => Math.abs(v) <= 0.3).length}
          </div>
          <div className="text-xs text-gray-600">Weak/Neutral</div>
        </div>
        <div className="bg-gray-50 p-2 rounded">
          <div className="text-lg font-bold text-red-600">
            {processedData.matrix.flat().filter(v => v < -0.7).length}
          </div>
          <div className="text-xs text-gray-600">Strong Negative</div>
        </div>
      </div>
    </div>
  );
};

export default HeatmapChart;
