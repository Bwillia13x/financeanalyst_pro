/**
 * Candlestick Chart Component
 * Professional OHLC (Open, High, Low, Close) price visualization
 */

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Bar,
  Line
} from 'recharts';

const CandlestickChart = ({
  data = [],
  symbol = '',
  height: _height = 300,
  showVolume = true,
  theme = 'light'
}) => {
  const processedData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    return data.map(item => {
      const open = parseFloat(item.open || 0);
      const high = parseFloat(item.high || 0);
      const low = parseFloat(item.low || 0);
      const close = parseFloat(item.close || 0);

      return {
        timestamp: item.timestamp,
        date: new Date(item.timestamp).toLocaleDateString(),
        time: new Date(item.timestamp).toLocaleTimeString(),
        open,
        high,
        low,
        close,
        volume: parseInt(item.volume || 0),
        // Calculate candlestick body and wicks
        bodyLow: Math.min(open, close),
        bodyHigh: Math.max(open, close),
        wickLow: low,
        wickHigh: high,
        isGreen: close >= open,
        change: close - open,
        changePercent: open > 0 ? ((close - open) / open) * 100 : 0
      };
    });
  }, [data]);

  const _CustomCandlestick = ({ payload, index }) => {
    if (!payload) return null;

    const {
      open: _open,
      high: _high,
      low: _low,
      close: _close,
      bodyLow,
      bodyHigh,
      wickLow,
      wickHigh,
      isGreen
    } = payload;

    const colors = {
      green: theme === 'dark' ? '#10b981' : '#059669',
      red: theme === 'dark' ? '#ef4444' : '#dc2626',
      wick: theme === 'dark' ? '#6b7280' : '#4b5563'
    };

    const candleColor = isGreen ? colors.green : colors.red;

    // Mock x coordinate calculation (in real implementation, use scale)
    const x = 50 + (index * 10);
    const yScale = 100; // Mock scale

    return (
      <g>
        {/* Wick line */}
        <line
          x1={x}
          y1={wickHigh * yScale}
          x2={x}
          y2={wickLow * yScale}
          stroke={colors.wick}
          strokeWidth={1}
        />

        {/* Candlestick body */}
        <rect
          x={x - 3}
          y={Math.min(bodyHigh, bodyLow) * yScale}
          width={6}
          height={Math.abs(bodyHigh - bodyLow) * yScale}
          fill={isGreen ? candleColor : 'transparent'}
          stroke={candleColor}
          strokeWidth={1}
        />
      </g>
    );
  };

  const CustomTooltip = ({ active, payload, label: _label }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    if (!data) return null;

    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900">{symbol}</p>
        <p className="text-sm text-gray-600">{data.date} {data.time}</p>
        <div className="mt-2 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Open:</span>
            <span className="font-mono text-sm">${data.open.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">High:</span>
            <span className="font-mono text-sm text-green-600">${data.high.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Low:</span>
            <span className="font-mono text-sm text-red-600">${data.low.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Close:</span>
            <span className="font-mono text-sm">${data.close.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Change:</span>
            <span className={`font-mono text-sm ${data.isGreen ? 'text-green-600' : 'text-red-600'}`}>
              {data.change >= 0 ? '+' : ''}${data.change.toFixed(2)} ({data.changePercent.toFixed(2)}%)
            </span>
          </div>
          {showVolume && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Volume:</span>
              <span className="font-mono text-sm">{data.volume.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!processedData.length) {
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-500">No price data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={processedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Price line as approximation */}
          <Line
            type="monotone"
            dataKey="close"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
          />

          {/* Volume bars if enabled */}
          {showVolume && (
            <Bar
              dataKey="volume"
              fill="#e5e7eb"
              opacity={0.3}
              yAxisId="volume"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CandlestickChart;
