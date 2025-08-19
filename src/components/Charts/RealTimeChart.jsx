/**
 * Real-Time Chart Component
 * Live updating financial data visualization with streaming capabilities
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';

const RealTimeChart = ({
  symbol = '',
  height = 300,
  updateInterval = 1000,
  maxDataPoints = 100,
  onDataUpdate
}) => {
  const [data, setData] = useState([]);
  const [isLive, setIsLive] = useState(true);
  const [stats, setStats] = useState({
    current: 0,
    high: 0,
    low: Infinity,
    change: 0,
    changePercent: 0
  });

  const intervalRef = useRef(null);
  const basePrice = useRef(Math.random() * 100 + 50);

  useEffect(() => {
    if (isLive) {
      startLiveUpdates();
    } else {
      stopLiveUpdates();
    }

    return () => stopLiveUpdates();
  }, [isLive, updateInterval, symbol]);

  const startLiveUpdates = () => {
    stopLiveUpdates();

    intervalRef.current = setInterval(() => {
      addDataPoint();
    }, updateInterval);
  };

  const stopLiveUpdates = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const addDataPoint = () => {
    const now = new Date();
    const timestamp = now.toISOString();

    // Generate realistic price movement
    const volatility = 0.02;
    const trend = (Math.random() - 0.5) * 0.001;
    const randomWalk = (Math.random() - 0.5) * volatility;

    basePrice.current = Math.max(0.01, basePrice.current * (1 + trend + randomWalk));
    const price = parseFloat(basePrice.current.toFixed(2));

    const newPoint = {
      timestamp,
      time: now.toLocaleTimeString(),
      price,
      volume: Math.floor(Math.random() * 1000000)
    };

    setData(prevData => {
      const updatedData = [...prevData, newPoint];

      // Keep only the last maxDataPoints
      if (updatedData.length > maxDataPoints) {
        updatedData.shift();
      }

      // Update statistics
      if (updatedData.length > 1) {
        const firstPrice = updatedData[0].price;
        const currentPrice = price;
        const high = Math.max(...updatedData.map(d => d.price));
        const low = Math.min(...updatedData.map(d => d.price));
        const change = currentPrice - firstPrice;
        const changePercent = ((change / firstPrice) * 100);

        setStats({
          current: currentPrice,
          high,
          low,
          change,
          changePercent
        });
      }

      onDataUpdate?.(newPoint);
      return updatedData;
    });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;

    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900">{symbol}</p>
        <p className="text-sm text-gray-600">{data.time}</p>
        <div className="mt-2 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Price:</span>
            <span className="font-mono text-sm font-semibold">${data.price}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Volume:</span>
            <span className="font-mono text-sm">{data.volume.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full">
      {/* Real-time controls and stats */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-sm font-medium text-gray-900">{symbol || 'LIVE'}</span>
          </div>

          <button
            onClick={() => setIsLive(!isLive)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              isLive
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {isLive ? 'Pause' : 'Resume'}
          </button>
        </div>

        <div className="flex items-center space-x-6 text-sm">
          <div className="text-center">
            <div className="font-mono font-bold text-lg">${stats.current.toFixed(2)}</div>
            <div className="text-xs text-gray-500">Current</div>
          </div>

          <div className={`text-center ${stats.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            <div className="font-mono font-bold">
              {stats.change >= 0 ? '+' : ''}${stats.change.toFixed(2)}
            </div>
            <div className="text-xs">
              ({stats.changePercent >= 0 ? '+' : ''}{stats.changePercent.toFixed(2)}%)
            </div>
          </div>

          <div className="text-center">
            <div className="font-mono text-green-600">${stats.high.toFixed(2)}</div>
            <div className="text-xs text-gray-500">High</div>
          </div>

          <div className="text-center">
            <div className="font-mono text-red-600">${stats.low.toFixed(2)}</div>
            <div className="text-xs text-gray-500">Low</div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1">
        {data.length === 0 ? (
          <div className="w-full h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg
                  className="w-6 h-6 text-blue-600 animate-pulse" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <p className="text-sm text-gray-500">Waiting for live data...</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="time"
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={['dataMin - 0.5', 'dataMax + 0.5']}
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Reference lines for high/low */}
              <ReferenceLine y={stats.high} stroke="#10b981" strokeDasharray="2 2" />
              <ReferenceLine y={stats.low} stroke="#ef4444" strokeDasharray="2 2" />

              {/* Main price line */}
              <Line
                type="monotone"
                dataKey="price"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
                animationDuration={200}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Data point counter */}
      <div className="mt-2 text-center">
        <span className="text-xs text-gray-500">
          {data.length} / {maxDataPoints} data points • Updates every {updateInterval / 1000}s
        </span>
      </div>
    </div>
  );
};

export default RealTimeChart;
