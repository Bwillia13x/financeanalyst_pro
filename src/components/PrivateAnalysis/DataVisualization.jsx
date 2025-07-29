import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Activity, Eye, EyeOff } from 'lucide-react';

const DataVisualization = ({ 
  dcfData, 
  sensitivityData, 
  scenarioData, 
  formatCurrency, 
  formatPercent 
}) => {
  const [activeChart, setActiveChart] = useState('dcf-waterfall');
  const [showDetails, setShowDetails] = useState(true);

  // Chart configuration
  const chartTypes = [
    { id: 'dcf-waterfall', label: 'DCF Waterfall', icon: BarChart3, category: 'dcf' },
    { id: 'cashflow-trend', label: 'Cash Flow Trend', icon: TrendingUp, category: 'dcf' },
    { id: 'sensitivity-tornado', label: 'Sensitivity Tornado', icon: Activity, category: 'sensitivity' },
    { id: 'scenario-distribution', label: 'Scenario Distribution', icon: PieChartIcon, category: 'scenario' },
    { id: 'valuation-bridge', label: 'Valuation Bridge', icon: BarChart3, category: 'combined' }
  ];

  // Prepare DCF Waterfall Data
  const dcfWaterfallData = useMemo(() => {
    if (!dcfData?.years) return [];
    
    let cumulativeValue = 0;
    const data = [];
    
    // Add each year's contribution
    dcfData.years.forEach((year, index) => {
      const startValue = cumulativeValue;
      cumulativeValue += year.presentValue;
      
      data.push({
        name: `Year ${year.year}`,
        value: year.presentValue,
        cumulative: cumulativeValue,
        start: startValue,
        freeCashFlow: year.freeCashFlow,
        category: 'operations'
      });
    });
    
    // Add terminal value
    const terminalStart = cumulativeValue;
    cumulativeValue += dcfData.presentValueTerminal;
    
    data.push({
      name: 'Terminal Value',
      value: dcfData.presentValueTerminal,
      cumulative: cumulativeValue,
      start: terminalStart,
      category: 'terminal'
    });
    
    return data;
  }, [dcfData]);

  // Prepare Cash Flow Trend Data
  const cashFlowTrendData = useMemo(() => {
    if (!dcfData?.years) return [];
    
    return dcfData.years.map((year, index) => ({
      year: `Year ${year.year}`,
      freeCashFlow: year.freeCashFlow,
      presentValue: year.presentValue,
      revenue: year.revenue,
      operatingIncome: year.operatingIncome,
      workingCapitalChange: year.workingCapitalChange,
      capex: Math.abs(year.capex)
    }));
  }, [dcfData]);

  // Prepare Sensitivity Tornado Data
  const sensitivityTornadoData = useMemo(() => {
    if (!sensitivityData) return [];
    
    return Object.entries(sensitivityData).map(([variable, result]) => {
      const maxUpside = Math.max(...result.dataPoints.map(d => d.changeFromBase));
      const maxDownside = Math.min(...result.dataPoints.map(d => d.changeFromBase));
      
      return {
        variable: result.definition.name,
        upside: maxUpside,
        downside: Math.abs(maxDownside),
        range: maxUpside - maxDownside
      };
    }).sort((a, b) => b.range - a.range);
  }, [sensitivityData]);

  // Prepare Scenario Distribution Data
  const scenarioDistributionData = useMemo(() => {
    if (!scenarioData?.length) return [];
    
    return scenarioData.map((scenario, index) => ({
      name: scenario.name,
      value: scenario.enterpriseValue,
      probability: scenario.probability,
      weightedValue: scenario.weightedValue,
      fill: `hsl(${(index * 137.5) % 360}, 70%, 50%)`
    }));
  }, [scenarioData]);

  // Custom tooltip for different chart types
  const CustomTooltip = ({ active, payload, label, chartType }) => {
    if (!active || !payload || !payload.length) return null;

    const formatValue = (value, key) => {
      if (key?.includes('Percent') || key?.includes('Rate')) {
        return formatPercent(value);
      }
      return formatCurrency(value);
    };

    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-medium text-gray-800">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {`${entry.dataKey}: ${formatValue(entry.value, entry.dataKey)}`}
          </p>
        ))}
      </div>
    );
  };

  // DCF Waterfall Chart
  const DCFWaterfallChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={dcfWaterfallData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis tickFormatter={(value) => formatCurrency(value)} />
        <Tooltip content={<CustomTooltip chartType="waterfall" />} />
        <Bar dataKey="value" fill="#3B82F6" />
      </BarChart>
    </ResponsiveContainer>
  );

  // Cash Flow Trend Chart
  const CashFlowTrendChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={cashFlowTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        <YAxis tickFormatter={(value) => formatCurrency(value)} />
        <Tooltip content={<CustomTooltip chartType="trend" />} />
        <Legend />
        <Line type="monotone" dataKey="freeCashFlow" stroke="#10B981" strokeWidth={3} name="Free Cash Flow" />
        <Line type="monotone" dataKey="presentValue" stroke="#3B82F6" strokeWidth={2} name="Present Value" />
        <Line type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={2} name="Revenue" />
      </LineChart>
    </ResponsiveContainer>
  );

  // Sensitivity Tornado Chart
  const SensitivityTornadoChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart 
        data={sensitivityTornadoData} 
        layout="horizontal"
        margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" tickFormatter={(value) => `${value.toFixed(1)}%`} />
        <YAxis type="category" dataKey="variable" />
        <Tooltip 
          formatter={(value, name) => [`${value.toFixed(1)}%`, name]}
          labelFormatter={(label) => `Variable: ${label}`}
        />
        <Bar dataKey="upside" fill="#10B981" name="Upside Impact" />
        <Bar dataKey="downside" fill="#EF4444" name="Downside Impact" />
      </BarChart>
    </ResponsiveContainer>
  );

  // Scenario Distribution Chart
  const ScenarioDistributionChart = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={scenarioDistributionData}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="probability"
            label={({ name, probability }) => `${name}: ${probability}%`}
          >
            {scenarioDistributionData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value}%`} />
        </PieChart>
      </ResponsiveContainer>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={scenarioDistributionData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(value) => formatCurrency(value)} />
          <Tooltip content={<CustomTooltip chartType="scenario" />} />
          <Bar dataKey="value" fill="#8B5CF6" name="Enterprise Value" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  // Valuation Bridge Chart
  const ValuationBridgeChart = () => {
    const bridgeData = [
      { name: 'PV of Operations', value: dcfData?.cumulativePV || 0, type: 'positive' },
      { name: 'PV of Terminal', value: dcfData?.presentValueTerminal || 0, type: 'positive' },
      { name: 'Enterprise Value', value: dcfData?.enterpriseValue || 0, type: 'total' }
    ];

    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={bridgeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(value) => formatCurrency(value)} />
          <Tooltip content={<CustomTooltip chartType="bridge" />} />
          <Bar 
            dataKey="value" 
            fill={(entry) => entry.type === 'total' ? '#1F2937' : '#3B82F6'}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderChart = () => {
    switch (activeChart) {
      case 'dcf-waterfall':
        return <DCFWaterfallChart />;
      case 'cashflow-trend':
        return <CashFlowTrendChart />;
      case 'sensitivity-tornado':
        return <SensitivityTornadoChart />;
      case 'scenario-distribution':
        return <ScenarioDistributionChart />;
      case 'valuation-bridge':
        return <ValuationBridgeChart />;
      default:
        return <DCFWaterfallChart />;
    }
  };

  const getChartDescription = () => {
    switch (activeChart) {
      case 'dcf-waterfall':
        return 'Shows the contribution of each year\'s cash flows and terminal value to total enterprise value.';
      case 'cashflow-trend':
        return 'Displays the trend of free cash flows, present values, and key financial metrics over time.';
      case 'sensitivity-tornado':
        return 'Illustrates how changes in key variables impact enterprise value, ranked by sensitivity.';
      case 'scenario-distribution':
        return 'Compares different scenarios by probability weights and resulting enterprise values.';
      case 'valuation-bridge':
        return 'Breaks down enterprise value into operating value and terminal value components.';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <BarChart3 size={20} />
            Data Visualization
          </h3>
          <p className="text-gray-600">
            Interactive charts and graphs to visualize valuation results and sensitivity analysis.
          </p>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={`px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
            showDetails ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
          }`}
        >
          {showDetails ? <EyeOff size={14} /> : <Eye size={14} />}
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {/* Chart Type Selector */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {chartTypes.map((chart) => {
          const Icon = chart.icon;
          return (
            <motion.button
              key={chart.id}
              onClick={() => setActiveChart(chart.id)}
              className={`p-3 rounded-lg border-2 transition-all text-center ${
                activeChart === chart.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon size={20} className="mx-auto mb-2" />
              <div className="text-xs font-medium">{chart.label}</div>
            </motion.button>
          );
        })}
      </div>

      {/* Chart Container */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-lg">
            {chartTypes.find(c => c.id === activeChart)?.label}
          </h4>
          {showDetails && (
            <span className="text-sm text-gray-500">
              {getChartDescription()}
            </span>
          )}
        </div>
        
        <div className="min-h-[400px]">
          {renderChart()}
        </div>
      </div>

      {/* Chart Insights */}
      {showDetails && (
        <div className="bg-white rounded-lg border p-6">
          <h4 className="font-semibold text-lg mb-4">Key Insights</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeChart === 'dcf-waterfall' && (
              <>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-600 font-medium">Operations Contribution</div>
                  <div className="text-lg font-bold text-blue-800">
                    {dcfData?.cumulativePV ? 
                      `${((dcfData.cumulativePV / dcfData.enterpriseValue) * 100).toFixed(1)}%` : 
                      'N/A'
                    }
                  </div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm text-purple-600 font-medium">Terminal Contribution</div>
                  <div className="text-lg font-bold text-purple-800">
                    {dcfData?.presentValueTerminal ? 
                      `${((dcfData.presentValueTerminal / dcfData.enterpriseValue) * 100).toFixed(1)}%` : 
                      'N/A'
                    }
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-600 font-medium">Avg. Annual FCF</div>
                  <div className="text-lg font-bold text-green-800">
                    {dcfData?.freeCashFlows ? 
                      formatCurrency(dcfData.freeCashFlows.reduce((a, b) => a + b, 0) / dcfData.freeCashFlows.length) : 
                      'N/A'
                    }
                  </div>
                </div>
              </>
            )}

            {activeChart === 'sensitivity-tornado' && sensitivityTornadoData.length > 0 && (
              <>
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="text-sm text-red-600 font-medium">Highest Risk Variable</div>
                  <div className="text-lg font-bold text-red-800">
                    {sensitivityTornadoData[0]?.variable}
                  </div>
                  <div className="text-sm text-red-600">
                    ±{sensitivityTornadoData[0]?.range.toFixed(1)}% impact
                  </div>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="text-sm text-yellow-600 font-medium">Medium Risk Variables</div>
                  <div className="text-lg font-bold text-yellow-800">
                    {sensitivityTornadoData.slice(1, 3).map(v => v.variable).join(', ')}
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-600 font-medium">Lowest Risk Variable</div>
                  <div className="text-lg font-bold text-green-800">
                    {sensitivityTornadoData[sensitivityTornadoData.length - 1]?.variable}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataVisualization;