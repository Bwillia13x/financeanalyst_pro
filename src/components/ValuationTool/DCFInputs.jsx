const DCFInputs = ({ inputs, setInputs }) => {
  const handleChange = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">DCF Assumptions</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="currentRevenue" className="block text-sm font-medium text-gray-700 mb-1">
            Current Revenue
          </label>
          <input
            id="currentRevenue"
            type="number"
            value={inputs.currentRevenue}
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
            value={inputs.revenueGrowthRate * 100}
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
            value={inputs.ebitdaMargin * 100}
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
            value={inputs.taxRate * 100}
            onChange={(e) => handleChange('taxRate', e.target.value / 100)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="capexPercent" className="block text-sm font-medium text-gray-700 mb-1">
            CapEx (% of Revenue)
          </label>
          <input
            id="capexPercent"
            type="number"
            step="0.01"
            value={inputs.capexPercent * 100}
            onChange={(e) => handleChange('capexPercent', e.target.value / 100)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="workingCapitalPercent" className="block text-sm font-medium text-gray-700 mb-1">
            Working Capital (% of Revenue)
          </label>
          <input
            id="workingCapitalPercent"
            type="number"
            step="0.01"
            value={inputs.workingCapitalPercent * 100}
            onChange={(e) => handleChange('workingCapitalPercent', e.target.value / 100)}
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
            value={inputs.terminalGrowthRate * 100}
            onChange={(e) => handleChange('terminalGrowthRate', e.target.value / 100)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="discountRate" className="block text-sm font-medium text-gray-700 mb-1">
            Discount Rate (%)
          </label>
          <input
            id="discountRate"
            type="number"
            step="0.01"
            value={inputs.discountRate * 100}
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
            value={inputs.projectionYears}
            onChange={(e) => handleChange('projectionYears', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
};

export default DCFInputs;
