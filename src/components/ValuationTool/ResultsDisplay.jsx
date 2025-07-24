const ResultsDisplay = ({ results, formatCurrency, formatPercent }) => {
  if (results.type === 'dcf') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-600">Enterprise Value</h4>
            <p className="text-2xl font-bold text-blue-900">{formatCurrency(results.enterpriseValue)}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-green-600">Present Value FCF</h4>
            <p className="text-xl font-bold text-green-900">{formatCurrency(results.presentValueFCF)}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-purple-600">Terminal Value</h4>
            <p className="text-xl font-bold text-purple-900">{formatCurrency(results.presentValueTerminal)}</p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Free Cash Flow Projections</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {results.freeCashFlows.map((fcf, index) => (
              <div key={index} className="text-center">
                <p className="text-sm text-gray-600">Year {index + 1}</p>
                <p className="font-semibold text-gray-900">{formatCurrency(fcf)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Key Assumptions</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Revenue Growth</p>
              <p className="font-semibold">{formatPercent(results.assumptions.revenueGrowthRate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">EBITDA Margin</p>
              <p className="font-semibold">{formatPercent(results.assumptions.ebitdaMargin)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Discount Rate</p>
              <p className="font-semibold">{formatPercent(results.assumptions.discountRate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Terminal Growth</p>
              <p className="font-semibold">{formatPercent(results.assumptions.terminalGrowthRate)}</p>
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-600">IRR</h4>
            <p className="text-2xl font-bold text-blue-900">{results.irr.toFixed(1)}%</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-green-600">MOIC</h4>
            <p className="text-2xl font-bold text-green-900">{results.moic.toFixed(2)}x</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-purple-600">Net Exit Value</h4>
            <p className="text-xl font-bold text-purple-900">{formatCurrency(results.netExitValue)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Investment Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Equity Investment:</span>
                <span className="font-semibold">{formatCurrency(results.equityInvestment)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Exit Value:</span>
                <span className="font-semibold">{formatCurrency(results.exitValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Remaining Debt:</span>
                <span className="font-semibold">{formatCurrency(results.remainingDebt)}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Key Assumptions</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Exit Multiple:</span>
                <span className="font-semibold">{results.assumptions.exitMultiple}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">EBITDA Growth:</span>
                <span className="font-semibold">{formatPercent(results.assumptions.ebitdaGrowth)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Interest Rate:</span>
                <span className="font-semibold">{formatPercent(results.assumptions.interestRate)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default ResultsDisplay;
