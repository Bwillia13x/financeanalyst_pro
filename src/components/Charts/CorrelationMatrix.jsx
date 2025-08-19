/**
 * Correlation Matrix Component
 * Advanced correlation analysis visualization for portfolio optimization
 */

import React, { useMemo } from 'react';

const CorrelationMatrix = ({
  symbols = [],
  data = {},
  height = 300,
  showLabels = true
}) => {
  const correlationData = useMemo(() => {
    if (!symbols.length || !Object.keys(data).length) {
      return { matrix: [], labels: symbols };
    }

    // Calculate correlation matrix from price data
    const priceArrays = {};

    symbols.forEach(symbol => {
      if (data[symbol] && data[symbol].historical) {
        priceArrays[symbol] = data[symbol].historical.map(item => parseFloat(item.close || 0));
      }
    });

    const validSymbols = Object.keys(priceArrays).filter(symbol => priceArrays[symbol].length > 0);

    if (validSymbols.length < 2) {
      return { matrix: [], labels: validSymbols };
    }

    const matrix = validSymbols.map(symbol1 => {
      return validSymbols.map(symbol2 => {
        if (symbol1 === symbol2) return 1.0;
        return calculateCorrelation(priceArrays[symbol1], priceArrays[symbol2]);
      });
    });

    return { matrix, labels: validSymbols };
  }, [symbols, data]);

  const calculateCorrelation = (x, y) => {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;

    const xSlice = x.slice(-n);
    const ySlice = y.slice(-n);

    const xMean = xSlice.reduce((sum, val) => sum + val, 0) / n;
    const yMean = ySlice.reduce((sum, val) => sum + val, 0) / n;

    let numerator = 0;
    let xSumSq = 0;
    let ySumSq = 0;

    for (let i = 0; i < n; i++) {
      const xDiff = xSlice[i] - xMean;
      const yDiff = ySlice[i] - yMean;

      numerator += xDiff * yDiff;
      xSumSq += xDiff * xDiff;
      ySumSq += yDiff * yDiff;
    }

    const denominator = Math.sqrt(xSumSq * ySumSq);
    return denominator === 0 ? 0 : numerator / denominator;
  };

  const getCorrelationColor = (correlation) => {
    const absCorr = Math.abs(correlation);

    if (correlation > 0.7) return '#10b981'; // Strong positive - green
    if (correlation > 0.3) return '#84cc16'; // Moderate positive - light green
    if (correlation > -0.3) return '#6b7280'; // Weak - gray
    if (correlation > -0.7) return '#f59e0b'; // Moderate negative - orange
    return '#ef4444'; // Strong negative - red
  };

  const getCorrelationIntensity = (correlation) => {
    return Math.abs(correlation) * 0.8 + 0.2;
  };

  const getTextColor = (correlation) => {
    return Math.abs(correlation) > 0.5 ? '#ffffff' : '#374151';
  };

  const getCorrelationLabel = (correlation) => {
    const absCorr = Math.abs(correlation);
    if (absCorr > 0.7) return correlation > 0 ? 'Strong +' : 'Strong -';
    if (absCorr > 0.3) return correlation > 0 ? 'Moderate +' : 'Moderate -';
    return 'Weak';
  };

  if (!correlationData.matrix.length) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg
              className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-500">Insufficient data for correlation analysis</p>
          <p className="text-xs text-gray-400 mt-1">Need at least 2 assets with price history</p>
        </div>
      </div>
    );
  }

  const cellSize = Math.min(250 / correlationData.labels.length, 40);
  const matrixSize = cellSize * correlationData.labels.length;

  return (
    <div className="w-full h-full">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Asset Correlation Matrix</h3>
        <p className="text-xs text-gray-600 mt-1">
          Correlation coefficients between {correlationData.labels.length} assets
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mb-4 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#10b981' }} />
          <span>Strong Positive (&gt;0.7)</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#84cc16' }} />
          <span>Moderate Positive (0.3-0.7)</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#6b7280' }} />
          <span>Weak (-0.3 to 0.3)</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f59e0b' }} />
          <span>Moderate Negative (-0.7 to -0.3)</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ef4444' }} />
          <span>Strong Negative (&lt;-0.7)</span>
        </div>
      </div>

      {/* Matrix Visualization */}
      <div className="overflow-auto">
        <svg
          width={matrixSize + 120}
          height={matrixSize + 80}
          className="bg-white rounded-lg border"
        >
          {/* Column headers */}
          {showLabels && correlationData.labels.map((label, index) => (
            <text
              key={`col-${index}`}
              x={80 + index * cellSize + cellSize / 2}
              y={25}
              textAnchor="middle"
              className="text-xs fill-gray-700 font-medium"
              transform={`rotate(-45, ${80 + index * cellSize + cellSize / 2}, 25)`}
            >
              {label}
            </text>
          ))}

          {/* Row headers */}
          {showLabels && correlationData.labels.map((label, index) => (
            <text
              key={`row-${index}`}
              x={70}
              y={50 + index * cellSize + cellSize / 2}
              textAnchor="end"
              dominantBaseline="middle"
              className="text-xs fill-gray-700 font-medium"
            >
              {label}
            </text>
          ))}

          {/* Matrix cells */}
          {correlationData.matrix.map((row, rowIndex) =>
            row.map((correlation, colIndex) => (
              <g key={`cell-${rowIndex}-${colIndex}`}>
                <rect
                  x={80 + colIndex * cellSize}
                  y={40 + rowIndex * cellSize}
                  width={cellSize - 1}
                  height={cellSize - 1}
                  fill={getCorrelationColor(correlation)}
                  fillOpacity={getCorrelationIntensity(correlation)}
                  stroke="#ffffff"
                  strokeWidth={1}
                  className="hover:stroke-gray-400 cursor-pointer"
                />
                <text
                  x={80 + colIndex * cellSize + cellSize / 2}
                  y={40 + rowIndex * cellSize + cellSize / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs font-bold pointer-events-none"
                  fill={getTextColor(correlation)}
                >
                  {correlation.toFixed(2)}
                </text>

                {/* Tooltip area */}
                <rect
                  x={80 + colIndex * cellSize}
                  y={40 + rowIndex * cellSize}
                  width={cellSize - 1}
                  height={cellSize - 1}
                  fill="transparent"
                  className="cursor-pointer"
                >
                  <title>
                    {correlationData.labels[rowIndex]} vs {correlationData.labels[colIndex]}: {correlation.toFixed(3)} ({getCorrelationLabel(correlation)})
                  </title>
                </rect>
              </g>
            ))
          )}
        </svg>
      </div>

      {/* Summary Statistics */}
      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-green-50 p-3 rounded-lg text-center">
          <div className="text-lg font-bold text-green-700">
            {correlationData.matrix.flat().filter(v => v > 0.7 && v < 1).length}
          </div>
          <div className="text-xs text-green-600">Strong Positive</div>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg text-center">
          <div className="text-lg font-bold text-blue-700">
            {correlationData.matrix.flat().filter(v => v > 0.3 && v <= 0.7).length}
          </div>
          <div className="text-xs text-blue-600">Moderate Positive</div>
        </div>
        <div className="bg-yellow-50 p-3 rounded-lg text-center">
          <div className="text-lg font-bold text-yellow-700">
            {correlationData.matrix.flat().filter(v => v < -0.3 && v >= -0.7).length}
          </div>
          <div className="text-xs text-yellow-600">Moderate Negative</div>
        </div>
        <div className="bg-red-50 p-3 rounded-lg text-center">
          <div className="text-lg font-bold text-red-700">
            {correlationData.matrix.flat().filter(v => v < -0.7).length}
          </div>
          <div className="text-xs text-red-600">Strong Negative</div>
        </div>
      </div>

      {/* Analysis Insights */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Portfolio Insights</h4>
        <div className="text-sm text-blue-800 space-y-1">
          {correlationData.matrix.flat().filter(v => v > 0.8 && v < 1).length > 0 && (
            <p>⚠️ High correlations detected - consider diversification</p>
          )}
          {correlationData.matrix.flat().filter(v => v < -0.5).length > 0 && (
            <p>✅ Negative correlations present - good for risk reduction</p>
          )}
          {correlationData.matrix.flat().filter(v => Math.abs(v) < 0.3 && v !== 1).length > correlationData.labels.length && (
            <p>✅ Low correlations indicate good diversification</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CorrelationMatrix;
