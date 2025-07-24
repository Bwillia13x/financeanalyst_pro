const LBOInputs = ({ inputs, setInputs }) => {
  const handleChange = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">LBO Assumptions</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="purchasePrice" className="block text-sm font-medium text-gray-700 mb-1">
            Purchase Price
          </label>
          <input
            id="purchasePrice"
            type="number"
            value={inputs.purchasePrice}
            onChange={(e) => handleChange('purchasePrice', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="equityContribution" className="block text-sm font-medium text-gray-700 mb-1">
            Equity Contribution (%)
          </label>
          <input
            id="equityContribution"
            type="number"
            step="0.01"
            value={inputs.equityContribution * 100}
            onChange={(e) => handleChange('equityContribution', e.target.value / 100)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="debtAmount" className="block text-sm font-medium text-gray-700 mb-1">
            Debt Amount
          </label>
          <input
            id="debtAmount"
            type="number"
            value={inputs.debtAmount}
            onChange={(e) => handleChange('debtAmount', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 mb-1">
            Interest Rate (%)
          </label>
          <input
            id="interestRate"
            type="number"
            step="0.01"
            value={inputs.interestRate * 100}
            onChange={(e) => handleChange('interestRate', e.target.value / 100)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="exitMultiple" className="block text-sm font-medium text-gray-700 mb-1">
            Exit Multiple
          </label>
          <input
            id="exitMultiple"
            type="number"
            step="0.1"
            value={inputs.exitMultiple}
            onChange={(e) => handleChange('exitMultiple', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="exitYear" className="block text-sm font-medium text-gray-700 mb-1">
            Exit Year
          </label>
          <input
            id="exitYear"
            type="number"
            value={inputs.exitYear}
            onChange={(e) => handleChange('exitYear', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="ebitdaGrowth" className="block text-sm font-medium text-gray-700 mb-1">
            EBITDA Growth Rate (%)
          </label>
          <input
            id="ebitdaGrowth"
            type="number"
            step="0.01"
            value={inputs.ebitdaGrowth * 100}
            onChange={(e) => handleChange('ebitdaGrowth', e.target.value / 100)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="ebitdaMarginLBO" className="block text-sm font-medium text-gray-700 mb-1">
            EBITDA Margin (%)
          </label>
          <input
            id="ebitdaMarginLBO"
            type="number"
            step="0.01"
            value={inputs.ebitdaMargin * 100}
            onChange={(e) => handleChange('ebitdaMargin', e.target.value / 100)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="transactionFees" className="block text-sm font-medium text-gray-700 mb-1">
            Transaction Fees (%)
          </label>
          <input
            id="transactionFees"
            type="number"
            step="0.01"
            value={inputs.transactionFees * 100}
            onChange={(e) => handleChange('transactionFees', e.target.value / 100)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="managementFees" className="block text-sm font-medium text-gray-700 mb-1">
            Management Fees (% per year)
          </label>
          <input
            id="managementFees"
            type="number"
            step="0.01"
            value={inputs.managementFees * 100}
            onChange={(e) => handleChange('managementFees', e.target.value / 100)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
};

export default LBOInputs;
