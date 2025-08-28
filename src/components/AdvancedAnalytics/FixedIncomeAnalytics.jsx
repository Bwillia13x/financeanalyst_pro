import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

import { Card } from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';

const FixedIncomeAnalytics = () => {
  const [inputs, setInputs] = useState({
    faceValue: 1000,
    couponRate: 0.05,
    maturity: 5,
    paymentFrequency: 2, // Semi-annual
    marketYield: 0.045,
    daysToSettlement: 0
  });

  const [yieldCurveInputs, setYieldCurveInputs] = useState([
    { maturity: 0.25, yield: 0.02 },
    { maturity: 0.5, yield: 0.025 },
    { maturity: 1, yield: 0.03 },
    { maturity: 2, yield: 0.035 },
    { maturity: 5, yield: 0.04 },
    { maturity: 10, yield: 0.045 },
    { maturity: 30, yield: 0.05 }
  ]);

  // Bond pricing calculations
  const bondAnalytics = useMemo(() => {
    const {
      faceValue: FV,
      couponRate: C,
      maturity: T,
      paymentFrequency: n,
      marketYield: Y
    } = inputs;

    if (!FV || !T || !n) return null;

    const periodsPerYear = n;
    const totalPeriods = T * periodsPerYear;
    const couponPayment = (C * FV) / periodsPerYear;
    const periodYield = Y / periodsPerYear;

    // Present value of coupon payments
    let pvCoupons = 0;
    for (let i = 1; i <= totalPeriods; i++) {
      pvCoupons += couponPayment / Math.pow(1 + periodYield, i);
    }

    // Present value of principal
    const pvPrincipal = FV / Math.pow(1 + periodYield, totalPeriods);

    // Bond price
    const price = pvCoupons + pvPrincipal;

    // Modified Duration calculation
    let durationSum = 0;
    for (let i = 1; i <= totalPeriods; i++) {
      const cf = i === totalPeriods ? couponPayment + FV : couponPayment;
      const pv = cf / Math.pow(1 + periodYield, i);
      durationSum += (i / periodsPerYear) * pv;
    }
    const macaulayDuration = durationSum / price;
    const modifiedDuration = macaulayDuration / (1 + periodYield);

    // Convexity calculation
    let convexitySum = 0;
    for (let i = 1; i <= totalPeriods; i++) {
      const cf = i === totalPeriods ? couponPayment + FV : couponPayment;
      const pv = cf / Math.pow(1 + periodYield, i);
      const timePeriod = i / periodsPerYear;
      convexitySum += pv * timePeriod * (timePeriod + 1 / periodsPerYear);
    }
    const convexity = convexitySum / (price * Math.pow(1 + periodYield, 2));

    // DV01 (Dollar Value of a 01)
    const dv01 = modifiedDuration * price * 0.0001;

    // Yield to Maturity (approximation for display)
    const ytm = Y;

    // Current Yield
    const currentYield = (C * FV) / price;

    return {
      price,
      ytm,
      currentYield,
      macaulayDuration,
      modifiedDuration,
      convexity,
      dv01,
      pvCoupons,
      pvPrincipal
    };
  }, [inputs]);

  // Risk analytics
  const riskAnalytics = useMemo(() => {
    if (!bondAnalytics) return null;

    const { price, modifiedDuration, convexity } = bondAnalytics;
    const yieldShocks = [-0.02, -0.01, -0.005, 0, 0.005, 0.01, 0.02];

    return yieldShocks.map(shock => {
      // First-order approximation (duration only)
      const durationEffect = -modifiedDuration * shock * price;
      const priceChange1st = durationEffect;

      // Second-order approximation (duration + convexity)
      const convexityEffect = 0.5 * convexity * shock * shock * price;
      const priceChange2nd = durationEffect + convexityEffect;

      return {
        yieldShock: shock * 100, // Convert to bps
        priceChange1st: (priceChange1st / price) * 100,
        priceChange2nd: (priceChange2nd / price) * 100,
        newPrice1st: price + priceChange1st,
        newPrice2nd: price + priceChange2nd
      };
    });
  }, [bondAnalytics]);

  const handleInputChange = (field, value) => {
    setInputs(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const handleYieldCurveChange = (index, field, value) => {
    setYieldCurveInputs(prev =>
      prev.map((item, i) => (i === index ? { ...item, [field]: parseFloat(value) || 0 } : item))
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Bond Parameters</h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="faceValue" className="block text-sm font-medium text-gray-700 mb-1">
                  Face Value ($)
                </label>
                <Input
                  id="faceValue"
                  type="number"
                  step="1"
                  value={inputs.faceValue}
                  onChange={e => handleInputChange('faceValue', e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="couponRate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Coupon Rate (%)
                </label>
                <Input
                  id="couponRate"
                  type="number"
                  step="0.001"
                  value={inputs.couponRate * 100}
                  onChange={e => handleInputChange('couponRate', e.target.value / 100)}
                />
              </div>

              <div>
                <label htmlFor="maturity" className="block text-sm font-medium text-gray-700 mb-1">
                  Maturity (Years)
                </label>
                <Input
                  id="maturity"
                  type="number"
                  step="0.25"
                  value={inputs.maturity}
                  onChange={e => handleInputChange('maturity', e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="paymentFrequency"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Payment Frequency
                </label>
                <Select
                  id="paymentFrequency"
                  value={inputs.paymentFrequency}
                  onChange={e => handleInputChange('paymentFrequency', e.target.value)}
                  options={[
                    { value: 1, label: 'Annual' },
                    { value: 2, label: 'Semi-Annual' },
                    { value: 4, label: 'Quarterly' },
                    { value: 12, label: 'Monthly' }
                  ]}
                />
              </div>

              <div>
                <label
                  htmlFor="marketYield"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Market Yield (%)
                </label>
                <Input
                  id="marketYield"
                  type="number"
                  step="0.001"
                  value={inputs.marketYield * 100}
                  onChange={e => handleInputChange('marketYield', e.target.value / 100)}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Bond Analytics</h3>

            {bondAnalytics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Bond Price</div>
                  <div className="text-xl font-bold text-blue-600">
                    ${bondAnalytics.price?.toFixed(2) || 'N/A'}
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">YTM</div>
                  <div className="text-lg font-semibold text-green-600">
                    {(bondAnalytics.ytm * 100)?.toFixed(3) || 'N/A'}%
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Modified Duration</div>
                  <div className="text-lg font-semibold text-purple-600">
                    {bondAnalytics.modifiedDuration?.toFixed(3) || 'N/A'}
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Convexity</div>
                  <div className="text-lg font-semibold text-orange-600">
                    {bondAnalytics.convexity?.toFixed(2) || 'N/A'}
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">DV01</div>
                  <div className="text-lg font-semibold text-red-600">
                    ${bondAnalytics.dv01?.toFixed(4) || 'N/A'}
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Current Yield</div>
                  <div className="text-lg font-semibold text-yellow-600">
                    {(bondAnalytics.currentYield * 100)?.toFixed(3) || 'N/A'}%
                  </div>
                </div>

                <div className="bg-indigo-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">PV Coupons</div>
                  <div className="text-lg font-semibold text-indigo-600">
                    ${bondAnalytics.pvCoupons?.toFixed(2) || 'N/A'}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">PV Principal</div>
                  <div className="text-lg font-semibold text-gray-600">
                    ${bondAnalytics.pvPrincipal?.toFixed(2) || 'N/A'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Interest Rate Sensitivity</h3>
            {riskAnalytics && (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={riskAnalytics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="yieldShock"
                    tickFormatter={value => `${value > 0 ? '+' : ''}${value}`}
                  />
                  <YAxis tickFormatter={value => `${value.toFixed(1)}%`} />
                  <Tooltip
                    formatter={(value, name) => [
                      `${value.toFixed(2)}%`,
                      name === 'priceChange1st' ? 'Duration Only' : 'Duration + Convexity'
                    ]}
                    labelFormatter={value => `Yield Shock: ${value > 0 ? '+' : ''}${value} bps`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="priceChange1st"
                    stroke="#ef4444"
                    name="Duration Only"
                    strokeDasharray="5 5"
                  />
                  <Line
                    type="monotone"
                    dataKey="priceChange2nd"
                    stroke="#3b82f6"
                    name="Duration + Convexity"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Yield Curve</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={yieldCurveInputs}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="maturity" tickFormatter={value => `${value}Y`} />
                <YAxis tickFormatter={value => `${(value * 100).toFixed(1)}%`} />
                <Tooltip
                  formatter={value => [`${(value * 100).toFixed(2)}%`, 'Yield']}
                  labelFormatter={value => `Maturity: ${value} Years`}
                />
                <Line
                  type="monotone"
                  dataKey="yield"
                  stroke="#22c55e"
                  strokeWidth={3}
                  dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>

            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-2">Edit Yield Curve Points</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {yieldCurveInputs.map((point, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="w-8">{point.maturity}Y:</span>
                    <Input
                      type="number"
                      step="0.001"
                      value={point.yield * 100}
                      onChange={e => handleYieldCurveChange(index, 'yield', e.target.value / 100)}
                      className="text-xs h-8"
                    />
                    <span className="text-gray-500">%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FixedIncomeAnalytics;
