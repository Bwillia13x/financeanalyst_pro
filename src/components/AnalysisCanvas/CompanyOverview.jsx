import { motion } from 'framer-motion';
import { TrendingUp, Building2, Calendar, DollarSign } from 'lucide-react';
// React not needed for JSX-only component
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const CompanyOverview = ({ company, compact = false }) => {
  if (!company) return null;

  const formatCurrency = (value) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    return `$${value.toFixed(2)}`;
  };

  // Prepare chart data
  const chartData = company.financials?.revenue?.map((revenue, index) => ({
    year: company.financials.years[index],
    revenue: revenue / 1e9 // Convert to billions for readability
  })) || [];

  // Calculate growth metrics
  const calculateGrowth = (data) => {
    if (!data || data.length < 2) return 0;
    const latest = data[data.length - 1];
    const previous = data[data.length - 2];
    return ((latest - previous) / previous) * 100;
  };

  const revenueGrowth = calculateGrowth(company.financials?.revenue);

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 border border-gray-100"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{company.name}</h2>
              <p className="text-sm text-gray-500">{company.sector}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold text-gray-900">${company.price}</div>
            <div
              className={`text-sm flex items-center justify-end ${
                company.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              <TrendingUp
                className={`w-4 h-4 mr-1 ${
                  company.changePercent < 0 ? 'rotate-180' : ''
                }`}
              />
              {company.changePercent >= 0 ? '+' : ''}
              {company.changePercent.toFixed(2)}%
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-light text-gray-900 mb-1">{company.name}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="font-mono bg-gray-100 px-2 py-1 rounded">{company.ticker}</span>
              <span>{company.sector}</span>
              <span>Market Cap: {formatCurrency(company.marketCap)}</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-4xl font-light text-gray-900 mb-1">
            ${company.price}
          </div>
          <div
            className={`text-lg flex items-center justify-end ${
              company.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            <TrendingUp
              className={`w-5 h-5 mr-2 ${
                company.changePercent < 0 ? 'rotate-180' : ''
              }`}
            />
            {company.changePercent >= 0 ? '+' : ''}
            {company.change.toFixed(2)} ({company.changePercent.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Revenue Trend</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>{company.financials?.years?.[0]} - {company.financials?.years?.slice(-1)}</span>
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis
                  dataKey="year"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  tickFormatter={(value) => `$${value}B`}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2, fill: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key Financial Metrics */}
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Latest Revenue</span>
              <DollarSign className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-2xl font-semibold text-gray-900">
              {formatCurrency(company.financials?.revenue?.slice(-1)[0] || 0)}
            </div>
            <div
              className={`text-sm mt-1 ${
                revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}% YoY
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Market Cap</span>
              <TrendingUp className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-2xl font-semibold text-gray-900">
              {formatCurrency(company.marketCap)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Public Market
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Sector</span>
              <Building2 className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-lg font-medium text-gray-900">
              {company.sector}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Industry Classification
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Ready Indicator */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-green-800">
            Financial data loaded • Ready for analysis
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default CompanyOverview;
