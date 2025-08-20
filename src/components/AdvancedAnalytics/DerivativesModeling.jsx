import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

import Button from '../ui/Button';
import { Card } from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';


const DerivativesModeling = () => {
  const [activeDerivative, setActiveDerivative] = useState('swap');

  const [swapInputs, setSwapInputs] = useState({
    notional: 10000000,
    maturity: 5,
    fixedRate: 0.035,
    floatingRate: 0.03,
    paymentFrequency: 2,
    dayCount: 'ACT/360'
  });

  const [futureInputs, setFutureInputs] = useState({
    underlyingPrice: 100,
    strikePrice: 102,
    timeToExpiry: 0.25,
    riskFreeRate: 0.05,
    dividendYield: 0.02,
    contractSize: 100
  });

  // Interest Rate Swap valuation
  const swapValuation = useMemo(() => {
    const { notional, maturity, fixedRate, floatingRate, paymentFrequency } = swapInputs;

    if (!notional || !maturity || !paymentFrequency) return null;

    const periodsPerYear = paymentFrequency;
    const totalPeriods = maturity * periodsPerYear;
    const fixedPayment = (fixedRate * notional) / periodsPerYear;
    const floatingPayment = (floatingRate * notional) / periodsPerYear;

    // Simplified discount curve (flat yield curve assumption)
    const discountRate = floatingRate;

    // Present value of fixed leg
    let pvFixedLeg = 0;
    for (let i = 1; i <= totalPeriods; i++) {
      pvFixedLeg += fixedPayment / Math.pow(1 + discountRate / periodsPerYear, i);
    }

    // Present value of floating leg (first payment known, rest at par)
    let pvFloatingLeg = floatingPayment / Math.pow(1 + discountRate / periodsPerYear, 1);
    pvFloatingLeg += notional / Math.pow(1 + discountRate / periodsPerYear, totalPeriods);
    pvFloatingLeg -= notional; // Subtract notional at inception

    const swapValue = pvFixedLeg - pvFloatingLeg; // From fixed payer perspective

    // Duration calculation
    let durationSum = 0;
    for (let i = 1; i <= totalPeriods; i++) {
      const pv = fixedPayment / Math.pow(1 + discountRate / periodsPerYear, i);
      durationSum += (i / periodsPerYear) * pv;
    }
    const duration = durationSum / pvFixedLeg;

    // DV01 calculation
    const dv01 = duration * Math.abs(pvFixedLeg) * 0.0001;

    return {
      swapValue,
      pvFixedLeg,
      pvFloatingLeg,
      duration,
      dv01,
      fixedPayment,
      floatingPayment
    };
  }, [swapInputs]);

  // Futures pricing
  const futuresValuation = useMemo(() => {
    const { underlyingPrice: S, timeToExpiry: T, riskFreeRate: r, dividendYield: q, contractSize } = futureInputs;

    if (!S || !T || !contractSize) return null;

    // Futures price formula: F = S * e^((r-q)*T)
    const futuresPrice = S * Math.exp((r - q) * T);

    // Contract value
    const contractValue = futuresPrice * contractSize;

    // Basis (Futures - Spot)
    const basis = futuresPrice - S;

    // Carry cost
    const carryCost = S * (r - q) * T;

    return {
      futuresPrice,
      contractValue,
      basis,
      carryCost,
      underlyingValue: S * contractSize
    };
  }, [futureInputs]);

  // Generate payoff diagrams
  const payoffData = useMemo(() => {
    const spotPrices = [];
    for (let i = 80; i <= 120; i += 2) {
      spotPrices.push(i);
    }

    if (activeDerivative === 'swap') {
      return spotPrices.map(rate => {
        const rateDiff = (rate / 100 - swapInputs.fixedRate);
        const swapPnL = rateDiff * swapInputs.notional * swapInputs.maturity;

        return {
          spotPrice: rate,
          payoff: swapPnL / 1000000, // Convert to millions
          derivative: 'Interest Rate Swap'
        };
      });
    } else {
      return spotPrices.map(spot => {
        const futureValue = spot * Math.exp((futureInputs.riskFreeRate - futureInputs.dividendYield) * futureInputs.timeToExpiry);
        const contractPnL = (futureValue - futureInputs.strikePrice) * futureInputs.contractSize;

        return {
          spotPrice: spot,
          payoff: contractPnL / 1000, // Convert to thousands
          derivative: 'Futures Contract'
        };
      });
    }
  }, [activeDerivative, swapInputs, futureInputs]);

  // Risk scenarios
  const riskScenarios = useMemo(() => {
    const scenarios = [];
    const shocks = [-0.02, -0.01, -0.005, 0, 0.005, 0.01, 0.02];

    if (activeDerivative === 'swap' && swapValuation) {
      shocks.forEach(shock => {
        const newRate = swapInputs.floatingRate + shock;
        const rateDiff = newRate - swapInputs.fixedRate;
        const valueChange = rateDiff * swapInputs.notional * swapInputs.maturity;

        scenarios.push({
          shock: shock * 100, // Convert to bps
          valueChange: valueChange / 1000000, // Convert to millions
          newValue: (swapValuation.swapValue + valueChange) / 1000000
        });
      });
    } else if (futuresValuation) {
      shocks.forEach(shock => {
        const newSpot = futureInputs.underlyingPrice * (1 + shock);
        const newFuturesPrice = newSpot * Math.exp((futureInputs.riskFreeRate - futureInputs.dividendYield) * futureInputs.timeToExpiry);
        const valueChange = (newFuturesPrice - futuresValuation.futuresPrice) * futureInputs.contractSize;

        scenarios.push({
          shock: shock * 100, // Convert to percentage
          valueChange: valueChange / 1000, // Convert to thousands
          newValue: (futuresValuation.contractValue + valueChange) / 1000
        });
      });
    }

    return scenarios;
  }, [activeDerivative, swapInputs, futureInputs, swapValuation, futuresValuation]);

  const handleSwapInputChange = (field, value) => {
    setSwapInputs(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const handleFutureInputChange = (field, value) => {
    setFutureInputs(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 mb-6">
        <Button
          variant={activeDerivative === 'swap' ? 'primary' : 'secondary'}
          onClick={() => setActiveDerivative('swap')}
        >
          Interest Rate Swaps
        </Button>
        <Button
          variant={activeDerivative === 'futures' ? 'primary' : 'secondary'}
          onClick={() => setActiveDerivative('futures')}
        >
          Futures Contracts
        </Button>
      </div>

      {activeDerivative === 'swap' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Swap Parameters</h3>

              <div className="space-y-4">
                <div>
                  <label htmlFor="notional-amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Notional Amount ($)
                  </label>
                  <Input
                    id="notional-amount"
                    type="number"
                    step="1000000"
                    value={swapInputs.notional}
                    onChange={(e) => handleSwapInputChange('notional', e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="maturity-years" className="block text-sm font-medium text-gray-700 mb-1">
                    Maturity (Years)
                  </label>
                  <Input
                    id="maturity-years"
                    type="number"
                    step="0.25"
                    value={swapInputs.maturity}
                    onChange={(e) => handleSwapInputChange('maturity', e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="fixed-rate" className="block text-sm font-medium text-gray-700 mb-1">
                    Fixed Rate (%)
                  </label>
                  <Input
                    id="fixed-rate"
                    type="number"
                    step="0.001"
                    value={swapInputs.fixedRate * 100}
                    onChange={(e) => handleSwapInputChange('fixedRate', e.target.value / 100)}
                  />
                </div>

                <div>
                  <label htmlFor="floating-rate" className="block text-sm font-medium text-gray-700 mb-1">
                    Current Floating Rate (%)
                  </label>
                  <Input
                    id="floating-rate"
                    type="number"
                    step="0.001"
                    value={swapInputs.floatingRate * 100}
                    onChange={(e) => handleSwapInputChange('floatingRate', e.target.value / 100)}
                  />
                </div>

                <div>
                  <label htmlFor="payment-frequency" className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Frequency
                  </label>
                  <Select
                    id="payment-frequency"
                    value={swapInputs.paymentFrequency}
                    onChange={(e) => handleSwapInputChange('paymentFrequency', e.target.value)}
                    options={[
                      { value: 1, label: 'Annual' },
                      { value: 2, label: 'Semi-Annual' },
                      { value: 4, label: 'Quarterly' }
                    ]}
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Swap Valuation</h3>

              {swapValuation && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Swap Value</div>
                    <div className="text-xl font-bold text-blue-600">
                      ${swapValuation.swapValue?.toLocaleString() || 'N/A'}
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">PV Fixed Leg</div>
                    <div className="text-lg font-semibold text-green-600">
                      ${swapValuation.pvFixedLeg?.toLocaleString() || 'N/A'}
                    </div>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">PV Floating Leg</div>
                    <div className="text-lg font-semibold text-red-600">
                      ${swapValuation.pvFloatingLeg?.toLocaleString() || 'N/A'}
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Duration</div>
                    <div className="text-lg font-semibold text-purple-600">
                      {swapValuation.duration?.toFixed(2) || 'N/A'}
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">DV01</div>
                    <div className="text-lg font-semibold text-yellow-600">
                      ${swapValuation.dv01?.toLocaleString() || 'N/A'}
                    </div>
                  </div>

                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Fixed Payment</div>
                    <div className="text-lg font-semibold text-indigo-600">
                      ${swapValuation.fixedPayment?.toLocaleString() || 'N/A'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeDerivative === 'futures' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Futures Parameters</h3>

              <div className="space-y-4">
                <div>
                  <label htmlFor="underlying-price" className="block text-sm font-medium text-gray-700 mb-1">
                    Underlying Price ($)
                  </label>
                  <Input
                    id="underlying-price"
                    type="number"
                    step="0.01"
                    value={futureInputs.underlyingPrice}
                    onChange={(e) => handleFutureInputChange('underlyingPrice', e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="strike-price" className="block text-sm font-medium text-gray-700 mb-1">
                    Strike Price ($)
                  </label>
                  <Input
                    id="strike-price"
                    type="number"
                    step="0.01"
                    value={futureInputs.strikePrice}
                    onChange={(e) => handleFutureInputChange('strikePrice', e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="time-to-expiry" className="block text-sm font-medium text-gray-700 mb-1">
                    Time to Expiry (Years)
                  </label>
                  <Input
                    id="time-to-expiry"
                    type="number"
                    step="0.01"
                    value={futureInputs.timeToExpiry}
                    onChange={(e) => handleFutureInputChange('timeToExpiry', e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="risk-free-rate" className="block text-sm font-medium text-gray-700 mb-1">
                    Risk-Free Rate (%)
                  </label>
                  <Input
                    id="risk-free-rate"
                    type="number"
                    step="0.001"
                    value={futureInputs.riskFreeRate * 100}
                    onChange={(e) => handleFutureInputChange('riskFreeRate', e.target.value / 100)}
                  />
                </div>

                <div>
                  <label htmlFor="dividend-yield" className="block text-sm font-medium text-gray-700 mb-1">
                    Dividend Yield (%)
                  </label>
                  <Input
                    id="dividend-yield"
                    type="number"
                    step="0.001"
                    value={futureInputs.dividendYield * 100}
                    onChange={(e) => handleFutureInputChange('dividendYield', e.target.value / 100)}
                  />
                </div>

                <div>
                  <label htmlFor="contract-size" className="block text-sm font-medium text-gray-700 mb-1">
                    Contract Size
                  </label>
                  <Input
                    id="contract-size"
                    type="number"
                    step="1"
                    value={futureInputs.contractSize}
                    onChange={(e) => handleFutureInputChange('contractSize', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Futures Valuation</h3>

              {futuresValuation && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Futures Price</div>
                    <div className="text-xl font-bold text-blue-600">
                      ${futuresValuation.futuresPrice?.toFixed(2) || 'N/A'}
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Contract Value</div>
                    <div className="text-lg font-semibold text-green-600">
                      ${futuresValuation.contractValue?.toLocaleString() || 'N/A'}
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Basis</div>
                    <div className="text-lg font-semibold text-purple-600">
                      ${futuresValuation.basis?.toFixed(2) || 'N/A'}
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Carry Cost</div>
                    <div className="text-lg font-semibold text-yellow-600">
                      ${futuresValuation.carryCost?.toFixed(2) || 'N/A'}
                    </div>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Underlying Value</div>
                    <div className="text-lg font-semibold text-red-600">
                      ${futuresValuation.underlyingValue?.toLocaleString() || 'N/A'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Payoff Diagram</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={payoffData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="spotPrice"
                  tickFormatter={(value) => activeDerivative === 'swap' ? `${value}%` : `$${value}`}
                />
                <YAxis
                  tickFormatter={(value) => activeDerivative === 'swap' ? `$${value}M` : `$${value}K`}
                />
                <Tooltip
                  formatter={(value) => [
                    activeDerivative === 'swap' ? `$${value.toFixed(2)}M` : `$${value.toFixed(2)}K`,
                    'P&L'
                  ]}
                  labelFormatter={(value) =>
                    activeDerivative === 'swap' ? `Rate: ${value}%` : `Spot: $${value}`
                  }
                />
                <Area
                  type="monotone"
                  dataKey="payoff"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Risk Scenarios</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={riskScenarios}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="shock"
                  tickFormatter={(value) => `${value > 0 ? '+' : ''}${value}${activeDerivative === 'swap' ? 'bps' : '%'}`}
                />
                <YAxis
                  tickFormatter={(value) => activeDerivative === 'swap' ? `$${value.toFixed(1)}M` : `$${value.toFixed(1)}K`}
                />
                <Tooltip
                  formatter={(value, name) => [
                    activeDerivative === 'swap' ? `$${value.toFixed(2)}M` : `$${value.toFixed(2)}K`,
                    name === 'valueChange' ? 'Value Change' : 'New Value'
                  ]}
                  labelFormatter={(value) =>
                    `Shock: ${value > 0 ? '+' : ''}${value}${activeDerivative === 'swap' ? ' bps' : '%'}`
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="valueChange"
                  stroke="#ef4444"
                  name="Value Change"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="newValue"
                  stroke="#22c55e"
                  name="New Value"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DerivativesModeling;
