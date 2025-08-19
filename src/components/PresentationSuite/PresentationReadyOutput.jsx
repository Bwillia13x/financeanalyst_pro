/**
 * Presentation-Ready Output System
 * Every chart, table, and visualization designed for presentation to managing directors and clients
 */

import {
  Download,
  Copy,
  Share2,
  Presentation,
  Settings,
  Camera
} from 'lucide-react';
import React, { useState, useRef } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const PresentationReadyOutput = ({ data, title, type: _type = 'chart', chartType = 'line' }) => {
  const [_presentationMode, _setPresentationMode] = useState('executive');
  const [exportFormat, setExportFormat] = useState('png');
  const [colorTheme, setColorTheme] = useState('professional');
  const chartRef = useRef(null);

  // Professional color palettes for presentations
  const colorThemes = {
    professional: {
      primary: '#1E3A8A',
      secondary: '#059669',
      accent: '#DC2626',
      neutral: '#6B7280',
      background: '#FFFFFF',
      text: '#111827',
      grid: '#E5E7EB',
      palette: ['#1E3A8A', '#059669', '#DC2626', '#F59E0B', '#7C3AED', '#EC4899']
    },
    executive: {
      primary: '#0F172A',
      secondary: '#475569',
      accent: '#3B82F6',
      neutral: '#64748B',
      background: '#FFFFFF',
      text: '#0F172A',
      grid: '#F1F5F9',
      palette: ['#0F172A', '#475569', '#3B82F6', '#10B981', '#F59E0B', '#EF4444']
    },
    consulting: {
      primary: '#134E4A',
      secondary: '#0D9488',
      accent: '#F97316',
      neutral: '#6B7280',
      background: '#FFFFFF',
      text: '#111827',
      grid: '#F0FDF4',
      palette: ['#134E4A', '#0D9488', '#F97316', '#8B5CF6', '#EC4899', '#EF4444']
    },
    investment: {
      primary: '#7C2D12',
      secondary: '#DC2626',
      accent: '#059669',
      neutral: '#78716C',
      background: '#FFFBEB',
      text: '#92400E',
      grid: '#FEF3C7',
      palette: ['#7C2D12', '#DC2626', '#059669', '#3B82F6', '#8B5CF6', '#EC4899']
    }
  };

  const currentTheme = colorThemes[colorTheme];

  // Typography settings for presentations
  const typography = {
    title: {
      fontSize: '24px',
      fontWeight: '700',
      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
      color: currentTheme.text,
      lineHeight: '1.2',
      letterSpacing: '-0.025em'
    },
    subtitle: {
      fontSize: '16px',
      fontWeight: '500',
      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
      color: currentTheme.neutral,
      lineHeight: '1.4'
    },
    axis: {
      fontSize: '12px',
      fontWeight: '500',
      fontFamily: '"Inter", "SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif',
      color: currentTheme.neutral
    },
    legend: {
      fontSize: '14px',
      fontWeight: '500',
      fontFamily: '"Inter", "SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif',
      color: currentTheme.text
    }
  };

  // Sample data for demonstration
  const sampleData = data || [
    { period: 'Q1 2023', revenue: 245, ebitda: 58, margin: 23.7 },
    { period: 'Q2 2023', revenue: 267, ebitda: 67, margin: 25.1 },
    { period: 'Q3 2023', revenue: 289, ebitda: 78, margin: 27.0 },
    { period: 'Q4 2023', revenue: 312, ebitda: 87, margin: 27.9 },
    { period: 'Q1 2024E', revenue: 335, ebitda: 94, margin: 28.1 },
    { period: 'Q2 2024E', revenue: 358, ebitda: 104, margin: 29.1 }
  ];

  const handleExport = (format) => {
    if (chartRef.current) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Set high resolution for presentation quality
      const scale = 3; // 3x resolution for crisp presentation graphics
      canvas.width = 1200 * scale;
      canvas.height = 800 * scale;
      ctx.scale(scale, scale);

      // Export logic here (simplified)
      console.log(`Exporting ${format} at presentation quality`);
    }
  };

  const CustomTooltip = ({ active, payload, label: _label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="bg-white p-4 rounded-lg shadow-xl border border-gray-200"
          style={{ fontFamily: typography.axis.fontFamily }}
        >
          <p className="font-semibold text-gray-900 mb-2">{_label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${typeof entry.value === 'number' ?
                entry.value.toLocaleString() : entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const commonProps = {
      data: sampleData,
      margin: { top: 20, right: 30, left: 20, bottom: 60 }
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={currentTheme.grid} />
            <XAxis
              dataKey="period"
              tick={{ ...typography.axis, fill: currentTheme.neutral }}
              axisLine={{ stroke: currentTheme.grid }}
              tickLine={{ stroke: currentTheme.grid }}
            />
            <YAxis
              tick={{ ...typography.axis, fill: currentTheme.neutral }}
              axisLine={{ stroke: currentTheme.grid }}
              tickLine={{ stroke: currentTheme.grid }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={typography.legend} />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke={currentTheme.palette[0]}
              strokeWidth={3}
              dot={{ fill: currentTheme.palette[0], strokeWidth: 2, r: 6 }}
              name="Revenue ($M)"
            />
            <Line
              type="monotone"
              dataKey="ebitda"
              stroke={currentTheme.palette[1]}
              strokeWidth={3}
              dot={{ fill: currentTheme.palette[1], strokeWidth: 2, r: 6 }}
              name="EBITDA ($M)"
            />
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={currentTheme.grid} />
            <XAxis
              dataKey="period"
              tick={{ ...typography.axis, fill: currentTheme.neutral }}
              axisLine={{ stroke: currentTheme.grid }}
              tickLine={{ stroke: currentTheme.grid }}
            />
            <YAxis
              tick={{ ...typography.axis, fill: currentTheme.neutral }}
              axisLine={{ stroke: currentTheme.grid }}
              tickLine={{ stroke: currentTheme.grid }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={typography.legend} />
            <Bar dataKey="revenue" fill={currentTheme.palette[0]} name="Revenue ($M)" />
            <Bar dataKey="ebitda" fill={currentTheme.palette[1]} name="EBITDA ($M)" />
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={currentTheme.grid} />
            <XAxis
              dataKey="period"
              tick={{ ...typography.axis, fill: currentTheme.neutral }}
              axisLine={{ stroke: currentTheme.grid }}
              tickLine={{ stroke: currentTheme.grid }}
            />
            <YAxis
              tick={{ ...typography.axis, fill: currentTheme.neutral }}
              axisLine={{ stroke: currentTheme.grid }}
              tickLine={{ stroke: currentTheme.grid }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={typography.legend} />
            <Area
              type="monotone"
              dataKey="revenue"
              stackId="1"
              stroke={currentTheme.palette[0]}
              fill={currentTheme.palette[0]}
              fillOpacity={0.6}
              name="Revenue ($M)"
            />
            <Area
              type="monotone"
              dataKey="ebitda"
              stackId="1"
              stroke={currentTheme.palette[1]}
              fill={currentTheme.palette[1]}
              fillOpacity={0.6}
              name="EBITDA ($M)"
            />
          </AreaChart>
        );

      default:
        return <div>Chart type not supported</div>;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header with presentation controls */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 style={typography.title}>{title || 'Revenue & EBITDA Growth'}</h3>
            <p style={typography.subtitle}>Quarterly Performance Analysis</p>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={colorTheme}
              onChange={(e) => setColorTheme(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="professional">Professional</option>
              <option value="executive">Executive</option>
              <option value="consulting">Consulting</option>
              <option value="investment">Investment</option>
            </select>

            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="png">PNG (High-Res)</option>
              <option value="svg">SVG (Vector)</option>
              <option value="pdf">PDF</option>
              <option value="pptx">PowerPoint</option>
            </select>

            <button
              onClick={() => handleExport(exportFormat)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center"
            >
              <Download className="w-4 h-4 mr-1" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Chart area with presentation-ready styling */}
      <div ref={chartRef} className="p-6" style={{ backgroundColor: currentTheme.background }}>
        <ResponsiveContainer width="100%" height={400}>
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Footer with export options */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Presentation className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">Presentation Ready</span>
            </div>
            <div className="flex items-center space-x-2">
              <Camera className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">High Resolution</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button className="text-gray-600 hover:text-gray-800 p-2">
              <Copy className="w-4 h-4" />
            </button>
            <button className="text-gray-600 hover:text-gray-800 p-2">
              <Share2 className="w-4 h-4" />
            </button>
            <button className="text-gray-600 hover:text-gray-800 p-2">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresentationReadyOutput;
