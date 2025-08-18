import { motion } from 'framer-motion';
import {
  Calculator,
  BarChart3,
  Target,
  Maximize2,
  X,
  TrendingUp,
  DollarSign,
  Percent,
  Calendar
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AnalysisModule = ({
  moduleId,
  companyData: _companyData,
  inputs,
  results,
  onInputChange,
  onFocus,
  onRemove,
  isCompact = false,
  isFullscreen = false
}) => {
  const [_activeInputTab, _setActiveInputTab] = useState('assumptions');

  // Generate chart data for visualization at component level
  const chartData = useMemo(() => {
    if (!results?.freeCashFlows) return [];

    return results.years.map((year, index) => ({
      year: `Y${year}`,
      fcf: results.freeCashFlows[index] / 1e6, // Convert to millions
      pv: results.presentValues[index] / 1e6
    }));
  }, [results]);

  const moduleConfig = {
    dcf: {
      name: 'DCF Analysis',
      icon: Calculator,
      color: 'blue',
      description: 'Discounted cash flow valuation model'
    },
    comparables: {
      name: 'Comparable Analysis',
      icon: BarChart3,
      color: 'green',
      description: 'Peer group valuation analysis'
    },
    lbo: {
      name: 'LBO Analysis',
      icon: Target,
      color: 'purple',
      description: 'Leveraged buyout return analysis'
    }
  };

  const config = moduleConfig[moduleId];
  const Icon = config.icon;

  // Interactive slider component for key assumptions
  const InteractiveSlider = ({ label, value, min, max, step, suffix = '', onChange }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
          {value.toFixed(step < 1 ? 1 : 0)}{suffix}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, rgb(59 130 246) 0%, rgb(59 130 246) ${((value - min) / (max - min)) * 100}%, rgb(229 231 235) ${((value - min) / (max - min)) * 100}%, rgb(229 231 235) 100%)`
          }}
        />
      </div>
    </div>
  );

  // Render DCF module content
  const renderDCFContent = () => {
    if (!inputs) return null;

    const handleInputChange = (field, value) => {
      onInputChange({ [field]: value });
    };

    const handleYearlyInputChange = (year, field, value) => {
      const updatedYearlyData = {
        ...inputs.yearlyData,
        [year]: {
          ...inputs.yearlyData?.[year],
          [field]: value
        }
      };
      onInputChange({ yearlyData: updatedYearlyData });
    };

    // Chart data is now calculated at component level

    if (isCompact) {
      return (
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 bg-${config.color}-100 rounded-lg flex items-center justify-center`}>
                <Icon className={`w-5 h-5 text-${config.color}-600`} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{config.name}</h3>
                <p className="text-sm text-gray-500">{config.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onFocus}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={onRemove}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Key Interactive Inputs */}
          <div className="space-y-4">
            <InteractiveSlider
              label="Terminal Growth Rate"
              value={(inputs.terminalGrowthRate || 0.025) * 100}
              min={0}
              max={5}
              step={0.1}
              suffix="%"
              onChange={(value) => handleInputChange('terminalGrowthRate', value / 100)}
            />
            <InteractiveSlider
              label="Discount Rate (WACC)"
              value={(inputs.discountRate || 0.12) * 100}
              min={5}
              max={20}
              step={0.1}
              suffix="%"
              onChange={(value) => handleInputChange('discountRate', value / 100)}
            />
          </div>

          {/* Results Summary */}
          {results && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600 mb-1">Enterprise Value</div>
                <div className="text-lg font-semibold text-gray-900">
                  ${(results.enterpriseValue / 1e9).toFixed(1)}B
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600 mb-1">Implied Price</div>
                <div className="text-lg font-semibold text-gray-900">
                  ${results.impliedSharePrice?.toFixed(2) || '0.00'}
                </div>
              </div>
            </div>
          )}

          {/* Mini Chart */}
          {chartData.length > 0 && (
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <Line
                    type="monotone"
                    dataKey="fcf"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={false}
                  />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(value) => [`$${value.toFixed(0)}M`, 'FCF']}
                    labelStyle={{ color: '#374151' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      );
    }

    // Fullscreen view
    return (
      <div className="space-y-8">
        {/* Interactive Assumptions Panel */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Model Assumptions</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <InteractiveSlider
                label="Current Revenue"
                value={inputs.currentRevenue || 0}
                min={1e6}
                max={1e12}
                step={1e6}
                suffix=""
                onChange={(value) => handleInputChange('currentRevenue', value)}
              />
              <InteractiveSlider
                label="Terminal Growth Rate"
                value={(inputs.terminalGrowthRate || 0.025) * 100}
                min={0}
                max={5}
                step={0.1}
                suffix="%"
                onChange={(value) => handleInputChange('terminalGrowthRate', value / 100)}
              />
              <InteractiveSlider
                label="Discount Rate (WACC)"
                value={(inputs.discountRate || 0.12) * 100}
                min={5}
                max={20}
                step={0.1}
                suffix="%"
                onChange={(value) => handleInputChange('discountRate', value / 100)}
              />
            </div>

            <div className="space-y-6">
              <InteractiveSlider
                label="Projection Years"
                value={inputs.projectionYears || 5}
                min={3}
                max={10}
                step={1}
                suffix=" years"
                onChange={(value) => handleInputChange('projectionYears', value)}
              />

              {/* Year 1 Quick Adjustments */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Year 1 Assumptions</h4>
                <div className="space-y-3">
                  <InteractiveSlider
                    label="Revenue Growth"
                    value={inputs.yearlyData?.[1]?.revenueGrowth || 10}
                    min={-10}
                    max={50}
                    step={0.5}
                    suffix="%"
                    onChange={(value) => handleYearlyInputChange(1, 'revenueGrowth', value)}
                  />
                  <InteractiveSlider
                    label="EBITDA Margin"
                    value={inputs.yearlyData?.[1]?.ebitdaMargin || 20}
                    min={0}
                    max={50}
                    step={0.5}
                    suffix="%"
                    onChange={(value) => handleYearlyInputChange(1, 'ebitdaMargin', value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Dashboard */}
        {results && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Key Metrics */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Valuation Results</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Enterprise Value</span>
                    </div>
                    <span className="text-lg font-bold text-blue-900">
                      ${(results.enterpriseValue / 1e9).toFixed(1)}B
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-900">Equity Value</span>
                    </div>
                    <span className="text-lg font-bold text-green-900">
                      ${(results.equityValue / 1e9).toFixed(1)}B
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Percent className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-900">Implied Price</span>
                    </div>
                    <span className="text-lg font-bold text-purple-900">
                      ${results.impliedSharePrice?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cash Flow Chart */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Free Cash Flow Projection</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>{inputs.projectionYears || 5} Year Model</span>
                  </div>
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="year"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#64748b' }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        tickFormatter={(value) => `$${value}M`}
                      />
                      <Tooltip
                        formatter={(value, name) => [
                          `$${value.toFixed(0)}M`,
                          name === 'fcf' ? 'Free Cash Flow' : 'Present Value'
                        ]}
                        labelStyle={{ color: '#374151' }}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="fcf"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        dot={{ fill: '#3B82F6', strokeWidth: 0, r: 4 }}
                        name="fcf"
                      />
                      <Line
                        type="monotone"
                        dataKey="pv"
                        stroke="#10B981"
                        strokeWidth={3}
                        dot={{ fill: '#10B981', strokeWidth: 0, r: 4 }}
                        name="pv"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render module based on type
  const renderModuleContent = () => {
    switch (moduleId) {
      case 'dcf':
        return renderDCFContent();
      case 'comparables':
        return (
          <div className="p-6 text-center text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Comparable analysis module coming soon</p>
          </div>
        );
      case 'lbo':
        return (
          <div className="p-6 text-center text-gray-500">
            <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>LBO analysis module coming soon</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      layout
      className={`${isFullscreen ? '' : 'bg-white border border-gray-100 rounded-2xl overflow-hidden'}`}
    >
      {renderModuleContent()}
    </motion.div>
  );
};

export default AnalysisModule;
