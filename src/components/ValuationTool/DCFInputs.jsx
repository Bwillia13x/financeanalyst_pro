import { useState, useEffect } from 'react';

const DCFInputs = ({ inputs, setInputs }) => {
  const [viewMode, setViewMode] = useState('simple'); // 'simple' or 'detailed'

  const handleChange = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const handleYearlyChange = (year, field, value) => {
    const yearlyData = inputs.yearlyData || {};
    const updatedYearlyData = {
      ...yearlyData,
      [year]: {
        ...yearlyData[year],
        [field]: parseFloat(value) || 0
      }
    };
    setInputs(prev => ({ ...prev, yearlyData: updatedYearlyData }));
  };

  const handleBalanceSheetChange = (field, value) => {
    const balanceSheet = inputs.balanceSheet || {};
    setInputs(prev => ({
      ...prev,
      balanceSheet: {
        ...balanceSheet,
        [field]: parseFloat(value) || 0
      }
    }));
  };

  // Initialize yearly data when projection years change
  useEffect(() => {
    if (inputs.projectionYears && !inputs.yearlyData) {
      const initialYearlyData = {};
      for (let year = 1; year <= inputs.projectionYears; year++) {
        initialYearlyData[year] = {
          revenueGrowth: inputs.revenueGrowthRate * 100 || 10,
          ebitdaMargin: inputs.ebitdaMargin * 100 || 20,
          taxRate: inputs.taxRate * 100 || 25,
          capexPercent: inputs.capexPercent * 100 || 3,
          workingCapitalChange: inputs.workingCapitalPercent * 100 || 2,
          daPercent: 3 // Depreciation & Amortization as % of revenue
        };
      }
      setInputs(prev => ({ ...prev, yearlyData: initialYearlyData }));
    }
  }, [inputs.projectionYears, inputs.yearlyData, setInputs]);

  // Initialize balance sheet data
  useEffect(() => {
    if (!inputs.balanceSheet) {
      setInputs(prev => ({
        ...prev,
        balanceSheet: {
          cash: 10000000, // $10M default
          totalDebt: 5000000, // $5M default
          sharesOutstanding: 1000000 // 1M shares default
        }
      }));
    }
  }, [inputs.balanceSheet, setInputs]);

  const renderSimpleView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label htmlFor="currentRevenue" className="block text-sm font-medium text-gray-700 mb-1">
          Current Revenue ($)
        </label>
        <input
          id="currentRevenue"
          type="number"
          value={inputs.currentRevenue || 0}
          onChange={(e) => handleChange('currentRevenue', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="revenueGrowthRate" className="block text-sm font-medium text-gray-700 mb-1">
          Revenue Growth Rate (%)
        </label>
        <input
          id="revenueGrowthRate"
          type="number"
          step="0.01"
          value={(inputs.revenueGrowthRate || 0) * 100}
          onChange={(e) => handleChange('revenueGrowthRate', e.target.value / 100)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="ebitdaMargin" className="block text-sm font-medium text-gray-700 mb-1">
          EBITDA Margin (%)
        </label>
        <input
          id="ebitdaMargin"
          type="number"
          step="0.01"
          value={(inputs.ebitdaMargin || 0) * 100}
          onChange={(e) => handleChange('ebitdaMargin', e.target.value / 100)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700 mb-1">
          Tax Rate (%)
        </label>
        <input
          id="taxRate"
          type="number"
          step="0.01"
          value={(inputs.taxRate || 0) * 100}
          onChange={(e) => handleChange('taxRate', e.target.value / 100)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="terminalGrowthRate" className="block text-sm font-medium text-gray-700 mb-1">
          Terminal Growth Rate (%)
        </label>
        <input
          id="terminalGrowthRate"
          type="number"
          step="0.01"
          value={(inputs.terminalGrowthRate || 0) * 100}
          onChange={(e) => handleChange('terminalGrowthRate', e.target.value / 100)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="discountRate" className="block text-sm font-medium text-gray-700 mb-1">
          Discount Rate (WACC) (%)
        </label>
        <input
          id="discountRate"
          type="number"
          step="0.01"
          value={(inputs.discountRate || 0) * 100}
          onChange={(e) => handleChange('discountRate', e.target.value / 100)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="projectionYears" className="block text-sm font-medium text-gray-700 mb-1">
          Projection Years
        </label>
        <input
          id="projectionYears"
          type="number"
          min="3"
          max="10"
          value={inputs.projectionYears || 5}
          onChange={(e) => handleChange('projectionYears', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );

  const renderDetailedView = () => {
    const years = Array.from({ length: inputs.projectionYears || 5 }, (_, i) => i + 1);
    const yearlyData = inputs.yearlyData || {};
    const balanceSheet = inputs.balanceSheet || {};

    return (
      <div className="space-y-6">
        {/* Base Year Inputs */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-md font-semibold text-gray-900 mb-3">Base Year (Current)</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="currentRevenue" className="block text-sm font-medium text-gray-700 mb-1">
                Current Revenue ($)
              </label>
              <input
                id="currentRevenue"
                type="number"
                value={inputs.currentRevenue || 0}
                onChange={(e) => handleChange('currentRevenue', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="terminalGrowthRate" className="block text-sm font-medium text-gray-700 mb-1">
                Terminal Growth Rate (%)
              </label>
              <input
                id="terminalGrowthRate"
                type="number"
                step="0.01"
                value={(inputs.terminalGrowthRate || 0) * 100}
                onChange={(e) => handleChange('terminalGrowthRate', e.target.value / 100)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="discountRate" className="block text-sm font-medium text-gray-700 mb-1">
                Discount Rate (WACC) (%)
              </label>
              <input
                id="discountRate"
                type="number"
                step="0.01"
                value={(inputs.discountRate || 0) * 100}
                onChange={(e) => handleChange('discountRate', e.target.value / 100)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Year-by-Year Projections Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h4 className="text-md font-semibold text-gray-900">Annual Projections</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Metric
                  </th>
                  {years.map(year => (
                    <th key={year} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Year {year}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Revenue Growth (%)</td>
                  {years.map(year => (
                    <td key={year} className="px-4 py-3">
                      <input
                        type="number"
                        step="0.1"
                        value={yearlyData[year]?.revenueGrowth || 0}
                        onChange={(e) => handleYearlyChange(year, 'revenueGrowth', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    </td>
                  ))}
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">EBITDA Margin (%)</td>
                  {years.map(year => (
                    <td key={year} className="px-4 py-3">
                      <input
                        type="number"
                        step="0.1"
                        value={yearlyData[year]?.ebitdaMargin || 0}
                        onChange={(e) => handleYearlyChange(year, 'ebitdaMargin', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Tax Rate (%)</td>
                  {years.map(year => (
                    <td key={year} className="px-4 py-3">
                      <input
                        type="number"
                        step="0.1"
                        value={yearlyData[year]?.taxRate || 0}
                        onChange={(e) => handleYearlyChange(year, 'taxRate', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    </td>
                  ))}
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">CapEx (% of Revenue)</td>
                  {years.map(year => (
                    <td key={year} className="px-4 py-3">
                      <input
                        type="number"
                        step="0.1"
                        value={yearlyData[year]?.capexPercent || 0}
                        onChange={(e) => handleYearlyChange(year, 'capexPercent', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">D&A (% of Revenue)</td>
                  {years.map(year => (
                    <td key={year} className="px-4 py-3">
                      <input
                        type="number"
                        step="0.1"
                        value={yearlyData[year]?.daPercent || 0}
                        onChange={(e) => handleYearlyChange(year, 'daPercent', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    </td>
                  ))}
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Δ Working Capital (% of Rev)</td>
                  {years.map(year => (
                    <td key={year} className="px-4 py-3">
                      <input
                        type="number"
                        step="0.1"
                        value={yearlyData[year]?.workingCapitalChange || 0}
                        onChange={(e) => handleYearlyChange(year, 'workingCapitalChange', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Balance Sheet Inputs */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-md font-semibold text-gray-900 mb-3">Balance Sheet Items</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="cash-input" className="block text-sm font-medium text-gray-700 mb-1">
                Cash ($)
              </label>
              <input
                id="cash-input"
                type="number"
                value={balanceSheet.cash || 0}
                onChange={(e) => handleBalanceSheetChange('cash', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="total-debt-input" className="block text-sm font-medium text-gray-700 mb-1">
                Total Debt ($)
              </label>
              <input
                id="total-debt-input"
                type="number"
                value={balanceSheet.totalDebt || 0}
                onChange={(e) => handleBalanceSheetChange('totalDebt', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="shares-outstanding-input" className="block text-sm font-medium text-gray-700 mb-1">
                Shares Outstanding
              </label>
              <input
                id="shares-outstanding-input"
                type="number"
                value={balanceSheet.sharesOutstanding || 0}
                onChange={(e) => handleBalanceSheetChange('sharesOutstanding', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">DCF Model Assumptions</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('simple')}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              viewMode === 'simple'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Simple
          </button>
          <button
            onClick={() => setViewMode('detailed')}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              viewMode === 'detailed'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Detailed
          </button>
        </div>
      </div>

      {viewMode === 'simple' ? renderSimpleView() : renderDetailedView()}
    </div>
  );
};

export default DCFInputs;
