import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { Card } from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';


const OptionsPricing = () => {
  const [inputs, setInputs] = useState({
    spotPrice: 100,
    strikePrice: 100,
    timeToExpiry: 0.25, // 3 months
    riskFreeRate: 0.05,
    volatility: 0.20,
    optionType: 'call',
    dividendYield: 0
  });

  const [model, setModel] = useState('black-scholes');

  // Black-Scholes calculation
  const blackScholes = useMemo(() => {
    const { spotPrice: S, strikePrice: K, timeToExpiry: T, riskFreeRate: r, volatility: vol, optionType, dividendYield: q } = inputs;

    if (!S || !K || !T || !vol) return null;

    const d1 = (Math.log(S / K) + (r - q + 0.5 * vol * vol) * T) / (vol * Math.sqrt(T));
    const d2 = d1 - vol * Math.sqrt(T);

    const normalCDF = (x) => {
      return 0.5 * (1 + erf(x / Math.sqrt(2)));
    };

    const erf = (x) => {
      const a1 =  0.254829592;
      const a2 = -0.284496736;
      const a3 =  1.421413741;
      const a4 = -1.453152027;
      const a5 =  1.061405429;
      const p  =  0.3275911;
      const sign = x < 0 ? -1 : 1;
      x = Math.abs(x);
      const t = 1.0 / (1.0 + p * x);
      const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
      return sign * y;
    };

    const Nd1 = normalCDF(d1);
    const Nd2 = normalCDF(d2);
    const NminusD1 = normalCDF(-d1);
    const NminusD2 = normalCDF(-d2);

    const normalPDF = (x) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);

    let price, delta, rho;
    const gamma = Math.exp(-q * T) * normalPDF(d1) / (S * vol * Math.sqrt(T));
    const theta = (-S * Math.exp(-q * T) * normalPDF(d1) * vol / (2 * Math.sqrt(T))
            - r * K * Math.exp(-r * T) * (optionType === 'call' ? Nd2 : NminusD2)
            + q * S * Math.exp(-q * T) * (optionType === 'call' ? Nd1 : NminusD1)) / 365;
    const vega = S * Math.exp(-q * T) * normalPDF(d1) * Math.sqrt(T) / 100;

    if (optionType === 'call') {
      price = S * Math.exp(-q * T) * Nd1 - K * Math.exp(-r * T) * Nd2;
      delta = Math.exp(-q * T) * Nd1;
      rho = K * T * Math.exp(-r * T) * Nd2 / 100;
    } else {
      price = K * Math.exp(-r * T) * NminusD2 - S * Math.exp(-q * T) * NminusD1;
      delta = -Math.exp(-q * T) * NminusD1;
      rho = -K * T * Math.exp(-r * T) * NminusD2 / 100;
    }

    return { price, delta, gamma, theta, vega, rho };
  }, [inputs]);

  // Binomial tree calculation
  const binomialTree = useMemo(() => {
    const { spotPrice: S, strikePrice: K, timeToExpiry: T, riskFreeRate: r, volatility: vol, optionType } = inputs;
    const steps = 100;

    if (!S || !K || !T || !vol) return null;

    const dt = T / steps;
    const u = Math.exp(vol * Math.sqrt(dt));
    const d = 1 / u;
    const p = (Math.exp(r * dt) - d) / (u - d);

    // Build tree
    const tree = Array(steps + 1).fill(null).map(() => Array(steps + 1).fill(0));

    // Calculate terminal payoffs
    for (let i = 0; i <= steps; i++) {
      const ST = S * Math.pow(u, 2 * i - steps);
      tree[steps][i] = optionType === 'call'
        ? Math.max(ST - K, 0)
        : Math.max(K - ST, 0);
    }

    // Backward induction
    for (let j = steps - 1; j >= 0; j--) {
      for (let i = 0; i <= j; i++) {
        tree[j][i] = Math.exp(-r * dt) * (p * tree[j + 1][i + 1] + (1 - p) * tree[j + 1][i]);
      }
    }

    return { price: tree[0][0] };
  }, [inputs]);

  const handleInputChange = (field, value) => {
    setInputs(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  // Generate volatility surface data
  const volSurfaceData = useMemo(() => {
    const strikes = [80, 90, 100, 110, 120];
    const expiries = [0.083, 0.167, 0.25, 0.5, 1]; // 1M, 2M, 3M, 6M, 1Y

    return expiries.map(T => ({
      expiry: `${Math.round(T * 12)}M`,
      ...strikes.reduce((acc, K) => {
        const vol = 0.20 + 0.05 * Math.abs(K - 100) / 100 + 0.02 * Math.exp(-T);
        acc[`K${K}`] = vol;
        return acc;
      }, {})
    }));
  }, []);

  const result = model === 'black-scholes' ? blackScholes : binomialTree;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Option Parameters</h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="modelType" className="block text-sm font-medium text-gray-700 mb-1">
                  Model Type
                </label>
                <Select
                  id="modelType"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  options={[
                    { value: 'black-scholes', label: 'Black-Scholes' },
                    { value: 'binomial', label: 'Binomial Tree' }
                  ]}
                />
              </div>

              <div>
                <label htmlFor="optionType" className="block text-sm font-medium text-gray-700 mb-1">
                  Option Type
                </label>
                <Select
                  id="optionType"
                  value={inputs.optionType}
                  onChange={(e) => handleInputChange('optionType', e.target.value)}
                  options={[
                    { value: 'call', label: 'Call' },
                    { value: 'put', label: 'Put' }
                  ]}
                />
              </div>

              <div>
                <label htmlFor="spotPrice" className="block text-sm font-medium text-gray-700 mb-1">
                  Spot Price ($)
                </label>
                <Input
                  id="spotPrice"
                  type="number"
                  step="0.01"
                  value={inputs.spotPrice}
                  onChange={(e) => handleInputChange('spotPrice', e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="strikePrice" className="block text-sm font-medium text-gray-700 mb-1">
                  Strike Price ($)
                </label>
                <Input
                  id="strikePrice"
                  type="number"
                  step="0.01"
                  value={inputs.strikePrice}
                  onChange={(e) => handleInputChange('strikePrice', e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="timeToExpiry" className="block text-sm font-medium text-gray-700 mb-1">
                  Time to Expiry (Years)
                </label>
                <Input
                  id="timeToExpiry"
                  type="number"
                  step="0.01"
                  value={inputs.timeToExpiry}
                  onChange={(e) => handleInputChange('timeToExpiry', e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="riskFreeRate" className="block text-sm font-medium text-gray-700 mb-1">
                  Risk-Free Rate (%)
                </label>
                <Input
                  id="riskFreeRate"
                  type="number"
                  step="0.001"
                  value={inputs.riskFreeRate * 100}
                  onChange={(e) => handleInputChange('riskFreeRate', e.target.value / 100)}
                />
              </div>

              <div>
                <label htmlFor="volatility" className="block text-sm font-medium text-gray-700 mb-1">
                  Volatility (%)
                </label>
                <Input
                  id="volatility"
                  type="number"
                  step="0.01"
                  value={inputs.volatility * 100}
                  onChange={(e) => handleInputChange('volatility', e.target.value / 100)}
                />
              </div>

              <div>
                <label htmlFor="dividendYield" className="block text-sm font-medium text-gray-700 mb-1">
                  Dividend Yield (%)
                </label>
                <Input
                  id="dividendYield"
                  type="number"
                  step="0.01"
                  value={inputs.dividendYield * 100}
                  onChange={(e) => handleInputChange('dividendYield', e.target.value / 100)}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Pricing Results</h3>

            {result && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Option Price</div>
                  <div className="text-2xl font-bold text-blue-600">
                    ${result.price?.toFixed(4) || 'N/A'}
                  </div>
                </div>

                {blackScholes && model === 'black-scholes' && (
                  <>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">Delta</div>
                      <div className="text-xl font-semibold text-green-600">
                        {blackScholes.delta?.toFixed(4) || 'N/A'}
                      </div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">Gamma</div>
                      <div className="text-xl font-semibold text-purple-600">
                        {blackScholes.gamma?.toFixed(4) || 'N/A'}
                      </div>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">Theta</div>
                      <div className="text-xl font-semibold text-red-600">
                        {blackScholes.theta?.toFixed(4) || 'N/A'}
                      </div>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">Vega</div>
                      <div className="text-xl font-semibold text-yellow-600">
                        {blackScholes.vega?.toFixed(4) || 'N/A'}
                      </div>
                    </div>

                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">Rho</div>
                      <div className="text-xl font-semibold text-indigo-600">
                        {blackScholes.rho?.toFixed(4) || 'N/A'}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="mt-6">
              <h4 className="text-md font-semibold mb-3">Implied Volatility Surface</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={volSurfaceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="expiry" />
                  <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                  <Tooltip formatter={(value) => `${(value * 100).toFixed(2)}%`} />
                  <Legend />
                  <Line
                    type="monotone" dataKey="K80" stroke="#ef4444"
                    name="K=80"
                  />
                  <Line
                    type="monotone" dataKey="K90" stroke="#f97316"
                    name="K=90"
                  />
                  <Line
                    type="monotone" dataKey="K100" stroke="#22c55e"
                    name="K=100"
                  />
                  <Line
                    type="monotone" dataKey="K110" stroke="#3b82f6"
                    name="K=110"
                  />
                  <Line
                    type="monotone" dataKey="K120" stroke="#8b5cf6"
                    name="K=120"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default OptionsPricing;
