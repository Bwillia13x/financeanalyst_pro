import { useState, useMemo } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import { Card } from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';

const CreditModeling = () => {
  const [inputs, setInputs] = useState({
    exposureAmount: 1000000,
    timeHorizon: 1,
    lgd: 0.45, // Loss Given Default
    pd: 0.02, // Probability of Default
    correlationFactor: 0.15,
    confidenceLevel: 0.999
  });

  const [scorecardInputs, setScorecardInputs] = useState({
    revenue: 50000000,
    debt: 15000000,
    ebitda: 8000000,
    currentRatio: 1.5,
    quickRatio: 1.2,
    industryRisk: 'medium',
    managementQuality: 'good',
    marketPosition: 'strong'
  });

  // Credit risk calculations
  const creditRiskMetrics = useMemo(() => {
    const { exposureAmount: EAD, lgd: LGD, pd: PD, timeHorizon, confidenceLevel } = inputs;

    // Expected Loss
    const expectedLoss = EAD * PD * LGD;

    // Unexpected Loss (single asset)
    const unexpectedLoss = EAD * LGD * Math.sqrt(PD * (1 - PD));

    // Economic Capital (using normal approximation)
    const normalInverse = p => {
      // Approximation of inverse normal CDF
      const c0 = 2.515517;
      const c1 = 0.802853;
      const c2 = 0.010328;
      const d1 = 1.432788;
      const d2 = 0.189269;
      const d3 = 0.001308;

      const t = Math.sqrt(-2 * Math.log(1 - p));
      return t - (c0 + c1 * t + c2 * t * t) / (1 + d1 * t + d2 * t * t + d3 * t * t * t);
    };

    const economicCapital = normalInverse(confidenceLevel) * unexpectedLoss;

    // Value at Risk
    const valueAtRisk = expectedLoss + economicCapital;

    // RAROC (Risk-Adjusted Return on Capital)
    const assumedSpread = 0.025; // 250 bps spread
    const revenue = EAD * assumedSpread;
    const raroc = (revenue - expectedLoss) / economicCapital;

    // Cumulative default probability over time horizon
    const cumulativePD = 1 - Math.pow(1 - PD, timeHorizon);

    return {
      expectedLoss,
      unexpectedLoss,
      economicCapital,
      valueAtRisk,
      raroc,
      cumulativePD,
      lossRate: expectedLoss / EAD,
      capitalRatio: economicCapital / EAD
    };
  }, [inputs]);

  // Credit scorecard calculation
  const creditScore = useMemo(() => {
    const {
      revenue,
      debt,
      ebitda,
      currentRatio,
      quickRatio,
      industryRisk,
      managementQuality,
      marketPosition
    } = scorecardInputs;

    let score = 0;
    let maxScore = 0;

    // Financial ratios (60% weight)
    const debtToEbitda = debt / ebitda;
    const ebitdaMargin = ebitda / revenue;

    // Debt/EBITDA scoring (20 points)
    maxScore += 20;
    if (debtToEbitda < 1) score += 20;
    else if (debtToEbitda < 2) score += 15;
    else if (debtToEbitda < 3) score += 10;
    else if (debtToEbitda < 4) score += 5;

    // EBITDA Margin scoring (20 points)
    maxScore += 20;
    if (ebitdaMargin > 0.2) score += 20;
    else if (ebitdaMargin > 0.15) score += 15;
    else if (ebitdaMargin > 0.1) score += 10;
    else if (ebitdaMargin > 0.05) score += 5;

    // Current Ratio scoring (10 points)
    maxScore += 10;
    if (currentRatio > 2) score += 10;
    else if (currentRatio > 1.5) score += 8;
    else if (currentRatio > 1.2) score += 6;
    else if (currentRatio > 1) score += 4;

    // Quick Ratio scoring (10 points)
    maxScore += 10;
    if (quickRatio > 1.5) score += 10;
    else if (quickRatio > 1.2) score += 8;
    else if (quickRatio > 1) score += 6;
    else if (quickRatio > 0.8) score += 4;

    // Industry Risk (15 points)
    maxScore += 15;
    const industryScores = { low: 15, medium: 10, high: 5 };
    score += industryScores[industryRisk] || 0;

    // Management Quality (15 points)
    maxScore += 15;
    const mgmtScores = { excellent: 15, good: 12, fair: 8, poor: 3 };
    score += mgmtScores[managementQuality] || 0;

    // Market Position (10 points)
    maxScore += 10;
    const marketScores = { dominant: 10, strong: 8, competitive: 6, weak: 3 };
    score += marketScores[marketPosition] || 0;

    const scorePercentage = (score / maxScore) * 100;

    // Convert to rating
    let rating;
    if (scorePercentage >= 90) rating = 'AAA';
    else if (scorePercentage >= 85) rating = 'AA';
    else if (scorePercentage >= 80) rating = 'A';
    else if (scorePercentage >= 75) rating = 'BBB';
    else if (scorePercentage >= 65) rating = 'BB';
    else if (scorePercentage >= 55) rating = 'B';
    else if (scorePercentage >= 45) rating = 'CCC';
    else rating = 'D';

    // Estimate PD based on rating
    const ratingPDs = {
      AAA: 0.0001,
      AA: 0.0005,
      A: 0.002,
      BBB: 0.01,
      BB: 0.04,
      B: 0.12,
      CCC: 0.35,
      D: 1.0
    };

    return {
      score,
      maxScore,
      scorePercentage,
      rating,
      estimatedPD: ratingPDs[rating],
      debtToEbitda,
      ebitdaMargin
    };
  }, [scorecardInputs]);

  // Portfolio risk simulation data
  const _portfolioRiskData = useMemo(() => {
    const scenarios = [];

    for (let i = 0; i < 50; i++) {
      // Show 50 sample scenarios
      const randomPD = Math.random() * 0.1; // 0-10% PD range
      const loss = inputs.exposureAmount * randomPD * inputs.lgd;
      scenarios.push({
        scenario: i + 1,
        pd: randomPD,
        loss: loss / 1000, // Convert to thousands
        lossPercentage: (loss / inputs.exposureAmount) * 100
      });
    }

    return scenarios.sort((a, b) => a.loss - b.loss);
  }, [inputs]);

  const handleInputChange = (field, value) => {
    setInputs(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const handleScorecardChange = (field, value) => {
    setScorecardInputs(prev => ({
      ...prev,
      [field]: isNaN(parseFloat(value)) ? value : parseFloat(value)
    }));
  };

  const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6'];

  const lossDistributionData = [
    { range: '0-1%', count: 850, probability: 0.85 },
    { range: '1-3%', count: 100, probability: 0.1 },
    { range: '3-5%', count: 30, probability: 0.03 },
    { range: '5-10%', count: 15, probability: 0.015 },
    { range: '>10%', count: 5, probability: 0.005 }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Credit Risk Parameters</h3>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="exposureAmount"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Exposure Amount ($)
                </label>
                <Input
                  id="exposureAmount"
                  type="number"
                  step="1000"
                  value={inputs.exposureAmount}
                  onChange={e => handleInputChange('exposureAmount', e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="pd" className="block text-sm font-medium text-gray-700 mb-1">
                  Probability of Default (%)
                </label>
                <Input
                  id="pd"
                  type="number"
                  step="0.001"
                  value={inputs.pd * 100}
                  onChange={e => handleInputChange('pd', e.target.value / 100)}
                />
              </div>

              <div>
                <label htmlFor="lgd" className="block text-sm font-medium text-gray-700 mb-1">
                  Loss Given Default (%)
                </label>
                <Input
                  id="lgd"
                  type="number"
                  step="0.01"
                  value={inputs.lgd * 100}
                  onChange={e => handleInputChange('lgd', e.target.value / 100)}
                />
              </div>

              <div>
                <label
                  htmlFor="timeHorizon"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Time Horizon (Years)
                </label>
                <Input
                  id="timeHorizon"
                  type="number"
                  step="0.25"
                  value={inputs.timeHorizon}
                  onChange={e => handleInputChange('timeHorizon', e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="confidenceLevel"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confidence Level (%)
                </label>
                <Input
                  id="confidenceLevel"
                  type="number"
                  step="0.001"
                  value={inputs.confidenceLevel * 100}
                  onChange={e => handleInputChange('confidenceLevel', e.target.value / 100)}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Credit Risk Metrics</h3>

            {creditRiskMetrics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Expected Loss</div>
                  <div className="text-xl font-bold text-red-600">
                    ${creditRiskMetrics.expectedLoss?.toLocaleString() || 'N/A'}
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Unexpected Loss</div>
                  <div className="text-lg font-semibold text-orange-600">
                    ${creditRiskMetrics.unexpectedLoss?.toLocaleString() || 'N/A'}
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Economic Capital</div>
                  <div className="text-lg font-semibold text-blue-600">
                    ${creditRiskMetrics.economicCapital?.toLocaleString() || 'N/A'}
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Value at Risk</div>
                  <div className="text-lg font-semibold text-purple-600">
                    ${creditRiskMetrics.valueAtRisk?.toLocaleString() || 'N/A'}
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">RAROC</div>
                  <div className="text-lg font-semibold text-green-600">
                    {(creditRiskMetrics.raroc * 100)?.toFixed(1) || 'N/A'}%
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Cumulative PD</div>
                  <div className="text-lg font-semibold text-yellow-600">
                    {(creditRiskMetrics.cumulativePD * 100)?.toFixed(3) || 'N/A'}%
                  </div>
                </div>

                <div className="bg-indigo-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Loss Rate</div>
                  <div className="text-lg font-semibold text-indigo-600">
                    {(creditRiskMetrics.lossRate * 100)?.toFixed(3) || 'N/A'}%
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Capital Ratio</div>
                  <div className="text-lg font-semibold text-gray-600">
                    {(creditRiskMetrics.capitalRatio * 100)?.toFixed(2) || 'N/A'}%
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
            <h3 className="text-lg font-semibold mb-4">Credit Scorecard</h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="revenue" className="block text-sm font-medium text-gray-700 mb-1">
                  Revenue ($)
                </label>
                <Input
                  id="revenue"
                  type="number"
                  value={scorecardInputs.revenue}
                  onChange={e => handleScorecardChange('revenue', e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="debt" className="block text-sm font-medium text-gray-700 mb-1">
                  Total Debt ($)
                </label>
                <Input
                  id="debt"
                  type="number"
                  value={scorecardInputs.debt}
                  onChange={e => handleScorecardChange('debt', e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="ebitda" className="block text-sm font-medium text-gray-700 mb-1">
                  EBITDA ($)
                </label>
                <Input
                  id="ebitda"
                  type="number"
                  value={scorecardInputs.ebitda}
                  onChange={e => handleScorecardChange('ebitda', e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="currentRatio"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Current Ratio
                </label>
                <Input
                  id="currentRatio"
                  type="number"
                  step="0.1"
                  value={scorecardInputs.currentRatio}
                  onChange={e => handleScorecardChange('currentRatio', e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="industryRisk"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Industry Risk
                </label>
                <Select
                  id="industryRisk"
                  value={scorecardInputs.industryRisk}
                  onChange={e => handleScorecardChange('industryRisk', e.target.value)}
                  options={[
                    { value: 'low', label: 'Low Risk' },
                    { value: 'medium', label: 'Medium Risk' },
                    { value: 'high', label: 'High Risk' }
                  ]}
                />
              </div>

              <div>
                <label
                  htmlFor="managementQuality"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Management Quality
                </label>
                <Select
                  id="managementQuality"
                  value={scorecardInputs.managementQuality}
                  onChange={e => handleScorecardChange('managementQuality', e.target.value)}
                  options={[
                    { value: 'excellent', label: 'Excellent' },
                    { value: 'good', label: 'Good' },
                    { value: 'fair', label: 'Fair' },
                    { value: 'poor', label: 'Poor' }
                  ]}
                />
              </div>
            </div>

            {creditScore && (
              <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold">Credit Rating:</span>
                  <span className="text-2xl font-bold text-blue-600">{creditScore.rating}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span>Score:</span>
                  <span className="font-semibold">
                    {creditScore.score}/{creditScore.maxScore} (
                    {creditScore.scorePercentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Estimated PD:</span>
                  <span className="font-semibold">
                    {(creditScore.estimatedPD * 100).toFixed(3)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Loss Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={lossDistributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'count' ? `${value} scenarios` : `${(value * 100).toFixed(1)}%`,
                    name === 'count' ? 'Scenarios' : 'Probability'
                  ]}
                />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-2">Risk Concentration</h4>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={lossDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    dataKey="probability"
                    nameKey="range"
                  >
                    {lossDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={value => `${(value * 100).toFixed(1)}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CreditModeling;
