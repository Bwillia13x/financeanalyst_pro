import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// Import all analytics engines
import InstitutionalChart, { CHART_TYPES } from '../components/Charts/InstitutionalChart';
import Button from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import {
  financialAnalyticsEngine,
  RiskAssessmentEngine,
  PredictiveModelingEngine,
  PerformanceMeasurementEngine,
  StatisticalAnalysisEngine
} from '../services/analytics';

// Import UI components

// Initialize analytics engines
const riskEngine = new RiskAssessmentEngine();
const predictiveEngine = new PredictiveModelingEngine();
const performanceEngine = new PerformanceMeasurementEngine();
const statisticalEngine = new StatisticalAnalysisEngine();

// ===== SAMPLE DATA =====

// Generate sample financial data
const generateSampleReturns = (periods = 252, mean = 0.0005, volatility = 0.02) => {
  const returns = [];
  for (let i = 0; i < periods; i++) {
    // Generate random return using normal distribution approximation
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    returns.push(mean + volatility * z);
  }
  return returns;
};

const generateSamplePrices = (periods = 252, startPrice = 100) => {
  const returns = generateSampleReturns(periods);
  const prices = [startPrice];

  for (let i = 1; i < periods; i++) {
    prices.push(prices[i - 1] * (1 + returns[i - 1]));
  }

  return prices;
};

// Sample portfolio data
const samplePortfolio = {
  assets: [
    {
      symbol: 'AAPL',
      weight: 0.25,
      expectedReturn: 0.12,
      volatility: 0.25,
      returns: generateSampleReturns()
    },
    {
      symbol: 'MSFT',
      weight: 0.2,
      expectedReturn: 0.1,
      volatility: 0.22,
      returns: generateSampleReturns()
    },
    {
      symbol: 'GOOGL',
      weight: 0.15,
      expectedReturn: 0.11,
      volatility: 0.28,
      returns: generateSampleReturns()
    },
    {
      symbol: 'TSLA',
      weight: 0.1,
      expectedReturn: 0.18,
      volatility: 0.45,
      returns: generateSampleReturns()
    },
    {
      symbol: 'BND',
      weight: 0.15,
      expectedReturn: 0.04,
      volatility: 0.08,
      returns: generateSampleReturns()
    },
    {
      symbol: 'SPY',
      weight: 0.15,
      expectedReturn: 0.08,
      volatility: 0.18,
      returns: generateSampleReturns()
    }
  ],
  benchmark: generateSampleReturns()
};

const samplePrices = generateSamplePrices(252, 100);

// ===== ADVANCED ANALYTICS DEMO PAGE =====

const AdvancedAnalyticsDemo = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [analysisResults, setAnalysisResults] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'returns', label: 'Return Analysis', icon: '📈' },
    { id: 'risk', label: 'Risk Analysis', icon: '⚠️' },
    { id: 'forecasting', label: 'Forecasting', icon: '🔮' },
    { id: 'performance', label: 'Performance', icon: '🏆' },
    { id: 'statistics', label: 'Statistics', icon: '📐' }
  ];

  // ===== ANALYSIS FUNCTIONS =====

  const runReturnAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const returns = samplePrices.map((price, i) =>
        i === 0 ? 0 : (price - samplePrices[i - 1]) / samplePrices[i - 1]
      );

      const analysis = financialAnalyticsEngine.calculateReturns(returns);

      // Calculate moving averages
      const ma20 = financialAnalyticsEngine.calculateMovingAverages(samplePrices, [20]).MA20;
      const ma50 = financialAnalyticsEngine.calculateMovingAverages(samplePrices, [50]).MA50;

      // Calculate technical indicators
      const rsi = financialAnalyticsEngine.calculateRSI(returns, 14);
      const bollinger = financialAnalyticsEngine.calculateBollingerBands(samplePrices, 20);

      setAnalysisResults(prev => ({
        ...prev,
        returns: {
          analysis,
          technical: {
            ma20: ma20.slice(-50), // Last 50 periods
            ma50: ma50.slice(-50),
            rsi: rsi.slice(-50),
            bollinger: {
              upper: bollinger.upper.slice(-50),
              lower: bollinger.lower.slice(-50),
              middle: bollinger.middle.slice(-50)
            }
          }
        }
      }));
    } catch (error) {
      console.error('Return analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runRiskAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const portfolioReturns = samplePortfolio.assets.reduce((acc, asset, i) => {
        return acc.map((ret, j) => ret + asset.weight * asset.returns[j]);
      }, new Array(samplePortfolio.assets[0].returns.length).fill(0));

      // Value at Risk analysis
      const varAnalysis = riskEngine.calculateVaR(portfolioReturns, 0.95);

      // Stress testing
      const stressTest = riskEngine.runStressTest(
        samplePortfolio.assets,
        samplePortfolio.assets.map(a => a.weight),
        riskEngine.stressTestScenarios['2008-crisis']
      );

      // Portfolio risk attribution
      const attribution = riskEngine.performRiskAttribution(
        samplePortfolio.assets,
        samplePortfolio.assets.map(a => a.weight)
      );

      setAnalysisResults(prev => ({
        ...prev,
        risk: {
          var: varAnalysis,
          stressTest,
          attribution
        }
      }));
    } catch (error) {
      console.error('Risk analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runForecastingAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const prices = samplePrices.slice(-100); // Last 100 periods

      // ARIMA forecasting
      const arimaForecast = predictiveEngine.forecastARIMA(prices, { p: 1, d: 1, q: 1 }, 12);

      // Exponential smoothing
      const expSmooth = predictiveEngine.exponentialSmoothing(prices, 0.3, 'double', 12);

      // Random Forest for factor importance (simplified example)
      const features = prices.slice(1).map((price, i) => [
        price, // Current price
        prices[i], // Previous price
        Math.random() * 0.1, // Random factor
        Math.random() * 0.05 // Another factor
      ]);

      const targets = prices
        .slice(1)
        .map(price => (price > prices[prices.indexOf(price) - 1] ? 1 : 0));

      const rfModel = predictiveEngine.randomForest(features, targets, { nEstimators: 10 });

      setAnalysisResults(prev => ({
        ...prev,
        forecasting: {
          arima: arimaForecast,
          exponentialSmoothing: expSmooth,
          randomForest: rfModel
        }
      }));
    } catch (error) {
      console.error('Forecasting analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runPerformanceAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const portfolioReturns = samplePortfolio.assets.reduce((acc, asset, i) => {
        return acc.map((ret, j) => ret + asset.weight * asset.returns[j]);
      }, new Array(samplePortfolio.assets[0].returns.length).fill(0));

      // Performance metrics
      const performance = performanceEngine.calculatePerformanceMetrics(
        portfolioReturns,
        samplePortfolio.benchmark
      );

      // Attribution analysis
      const attribution = performanceEngine.brinsonAttribution(
        samplePortfolio.assets.map(a => a.weight),
        [0.2, 0.2, 0.15, 0.1, 0.15, 0.2], // Benchmark weights
        samplePortfolio.assets.map(a => a.returns),
        [
          samplePortfolio.benchmark,
          samplePortfolio.benchmark,
          samplePortfolio.benchmark,
          samplePortfolio.benchmark,
          samplePortfolio.benchmark,
          samplePortfolio.benchmark
        ]
      );

      // Risk-adjusted performance
      const riskAdjusted = performanceEngine.calculateRiskAdjustedPerformance(
        portfolioReturns,
        samplePortfolio.benchmark
      );

      setAnalysisResults(prev => ({
        ...prev,
        performance: {
          metrics: performance,
          attribution,
          riskAdjusted
        }
      }));
    } catch (error) {
      console.error('Performance analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runStatisticalAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const returns = samplePrices.map((price, i) =>
        i === 0 ? 0 : (price - samplePrices[i - 1]) / samplePrices[i - 1]
      );

      // Normality test
      const normality = statisticalEngine.jarqueBeraTest(returns);

      // Stationarity test
      const stationarity = statisticalEngine.augmentedDickeyFullerTest(returns);

      // Autocorrelation test
      const autocorrelation = statisticalEngine.ljungBoxTest(returns, 10);

      // Hypothesis testing
      const tTest = statisticalEngine.oneSampleTTest(returns, 0);

      // Cointegration test (simplified)
      const series1 = samplePrices;
      const series2 = samplePrices.map(p => p * 0.9 + Math.random() * 10); // Correlated series
      const cointegration = statisticalEngine.engleGrangerTest(series1, series2);

      setAnalysisResults(prev => ({
        ...prev,
        statistics: {
          normality,
          stationarity,
          autocorrelation,
          hypothesis: { tTest },
          cointegration
        }
      }));
    } catch (error) {
      console.error('Statistical analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ===== RENDER COMPONENTS =====

  const renderOverview = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Advanced Analytics Engine Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 border border-border rounded-lg">
              <h3 className="font-medium text-foreground mb-2">📈 Return Analysis</h3>
              <p className="text-sm text-foreground-secondary">
                Comprehensive return calculations, volatility analysis, and technical indicators
              </p>
            </div>

            <div className="p-4 border border-border rounded-lg">
              <h3 className="font-medium text-foreground mb-2">⚠️ Risk Analysis</h3>
              <p className="text-sm text-foreground-secondary">
                Value at Risk, stress testing, scenario analysis, and risk attribution
              </p>
            </div>

            <div className="p-4 border border-border rounded-lg">
              <h3 className="font-medium text-foreground mb-2">🔮 Forecasting</h3>
              <p className="text-sm text-foreground-secondary">
                ARIMA, exponential smoothing, and machine learning forecasting models
              </p>
            </div>

            <div className="p-4 border border-border rounded-lg">
              <h3 className="font-medium text-foreground mb-2">🏆 Performance</h3>
              <p className="text-sm text-foreground-secondary">
                Risk-adjusted performance metrics and attribution analysis
              </p>
            </div>

            <div className="p-4 border border-border rounded-lg">
              <h3 className="font-medium text-foreground mb-2">📐 Statistics</h3>
              <p className="text-sm text-foreground-secondary">
                Hypothesis testing, distribution analysis, and time series diagnostics
              </p>
            </div>

            <div className="p-4 border border-border rounded-lg">
              <h3 className="font-medium text-foreground mb-2">🎯 Institutional Grade</h3>
              <p className="text-sm text-foreground-secondary">
                Professional-grade algorithms used by hedge funds and asset managers
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Button
              onClick={runReturnAnalysis}
              disabled={isAnalyzing}
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <span className="text-2xl">📈</span>
              <span className="text-sm">Return Analysis</span>
            </Button>

            <Button
              onClick={runRiskAnalysis}
              disabled={isAnalyzing}
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <span className="text-2xl">⚠️</span>
              <span className="text-sm">Risk Analysis</span>
            </Button>

            <Button
              onClick={runForecastingAnalysis}
              disabled={isAnalyzing}
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <span className="text-2xl">🔮</span>
              <span className="text-sm">Forecasting</span>
            </Button>

            <Button
              onClick={runPerformanceAnalysis}
              disabled={isAnalyzing}
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <span className="text-2xl">🏆</span>
              <span className="text-sm">Performance</span>
            </Button>

            <Button
              onClick={runStatisticalAnalysis}
              disabled={isAnalyzing}
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <span className="text-2xl">📐</span>
              <span className="text-sm">Statistics</span>
            </Button>
          </div>

          {isAnalyzing && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-2 text-foreground-secondary">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-accent" />
                Running analysis...
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderReturnsAnalysis = () => (
    <div className="space-y-6">
      {analysisResults.returns ? (
        <>
          {/* Price Chart with Technical Indicators */}
          <Card>
            <CardHeader>
              <CardTitle>Price Chart with Technical Indicators</CardTitle>
            </CardHeader>
            <CardContent>
              <InstitutionalChart
                data={samplePrices.slice(-50).map((price, i) => ({
                  period: i + 1,
                  price,
                  ma20: analysisResults.returns.technical.ma20[i] || null,
                  ma50: analysisResults.returns.technical.ma50[i] || null
                }))}
                type={CHART_TYPES.LINE}
                xAxisKey="period"
                yAxisKeys={['price', 'ma20', 'ma50']}
                height={300}
                colors={['#059669', '#2563eb', '#dc2626']}
              />
            </CardContent>
          </Card>

          {/* Return Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Return Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {(analysisResults.returns.analysis.totalReturn * 100).toFixed(2)}%
                  </div>
                  <div className="text-sm text-foreground-secondary">Total Return</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {(analysisResults.returns.analysis.annualizedReturn * 100).toFixed(2)}%
                  </div>
                  <div className="text-sm text-foreground-secondary">Annualized</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {(analysisResults.returns.analysis.volatility * 100).toFixed(2)}%
                  </div>
                  <div className="text-sm text-foreground-secondary">Volatility</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {analysisResults.returns.analysis.sharpeRatio.toFixed(2)}
                  </div>
                  <div className="text-sm text-foreground-secondary">Sharpe Ratio</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RSI Indicator */}
          <Card>
            <CardHeader>
              <CardTitle>RSI Indicator</CardTitle>
            </CardHeader>
            <CardContent>
              <InstitutionalChart
                data={analysisResults.returns.technical.rsi.map((rsi, i) => ({
                  period: i + 1,
                  rsi
                }))}
                type={CHART_TYPES.LINE}
                xAxisKey="period"
                yAxisKeys={['rsi']}
                height={200}
                colors={['#7c3aed']}
              />
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-foreground-secondary mb-4">
              Click "Run Return Analysis" to generate comprehensive return analytics
            </p>
            <Button onClick={runReturnAnalysis} disabled={isAnalyzing}>
              {isAnalyzing ? 'Analyzing...' : 'Run Return Analysis'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderRiskAnalysis = () => (
    <div className="space-y-6">
      {analysisResults.risk ? (
        <>
          {/* VaR Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Value at Risk (VaR) Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {(analysisResults.risk.var.var95 * 100).toFixed(2)}%
                  </div>
                  <div className="text-sm text-foreground-secondary">95% VaR (1-day)</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {(analysisResults.risk.var.var99 * 100).toFixed(2)}%
                  </div>
                  <div className="text-sm text-foreground-secondary">99% VaR (1-day)</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {(analysisResults.risk.var.expectedShortfall * 100).toFixed(2)}%
                  </div>
                  <div className="text-sm text-foreground-secondary">Expected Shortfall</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stress Test Results */}
          <Card>
            <CardHeader>
              <CardTitle>Stress Test: 2008 Financial Crisis Scenario</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div
                      className={`text-xl font-bold ${
                        analysisResults.risk.stressTest.impact.returnImpactPercent < -10
                          ? 'text-red-600'
                          : 'text-yellow-600'
                      }`}
                    >
                      {analysisResults.risk.stressTest.impact.returnImpactPercent.toFixed(2)}%
                    </div>
                    <div className="text-sm text-foreground-secondary">Return Impact</div>
                  </div>

                  <div className="text-center">
                    <div
                      className={`text-xl font-bold ${
                        analysisResults.risk.stressTest.impact.volatilityImpact > 0.05
                          ? 'text-red-600'
                          : 'text-yellow-600'
                      }`}
                    >
                      {(analysisResults.risk.stressTest.impact.volatilityImpact * 100).toFixed(2)}%
                    </div>
                    <div className="text-sm text-foreground-secondary">Volatility Impact</div>
                  </div>

                  <div className="text-center">
                    <div className="text-xl font-bold text-foreground">
                      {analysisResults.risk.stressTest.recovery.time}
                    </div>
                    <div className="text-sm text-foreground-secondary">Recovery Time (months)</div>
                  </div>

                  <div className="text-center">
                    <div className="text-xl font-bold text-foreground">
                      {(analysisResults.risk.stressTest.recovery.probability * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-foreground-secondary">Recovery Probability</div>
                  </div>
                </div>

                <div className="p-4 bg-background-secondary rounded-md">
                  <h4 className="font-medium text-foreground mb-2">Risk Assessment</h4>
                  <p className="text-sm text-foreground-secondary">
                    {analysisResults.risk.stressTest.impact.returnImpactPercent < -20
                      ? '🚨 High risk exposure detected. Consider portfolio rebalancing.'
                      : analysisResults.risk.stressTest.impact.returnImpactPercent < -10
                        ? '⚠️ Moderate risk exposure. Monitor closely.'
                        : '✅ Acceptable risk level under stress scenario.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Attribution */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Attribution by Asset</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysisResults.risk.attribution.riskBudget.map((asset, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-border rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="font-medium">{asset.asset}</span>
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="text-foreground">{(asset.weight * 100).toFixed(1)}%</div>
                        <div className="text-foreground-secondary">Weight</div>
                      </div>

                      <div className="text-center">
                        <div className="text-foreground">
                          {asset.riskContributionPercent.toFixed(1)}%
                        </div>
                        <div className="text-foreground-secondary">Risk Contribution</div>
                      </div>

                      <div className="text-center">
                        <div className="text-foreground">{asset.volatility.toFixed(3)}</div>
                        <div className="text-foreground-secondary">Volatility</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-foreground-secondary mb-4">
              Click "Run Risk Analysis" to generate comprehensive risk analytics
            </p>
            <Button onClick={runRiskAnalysis} disabled={isAnalyzing}>
              {isAnalyzing ? 'Analyzing...' : 'Run Risk Analysis'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderForecastingAnalysis = () => (
    <div className="space-y-6">
      {analysisResults.forecasting ? (
        <>
          {/* ARIMA Forecast */}
          <Card>
            <CardHeader>
              <CardTitle>ARIMA Forecasting Model</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-xl font-bold text-foreground">
                    {analysisResults.forecasting.arima.model.aic.toFixed(2)}
                  </div>
                  <div className="text-sm text-foreground-secondary">AIC</div>
                </div>

                <div className="text-center">
                  <div className="text-xl font-bold text-foreground">
                    {analysisResults.forecasting.arima.model.bic.toFixed(2)}
                  </div>
                  <div className="text-sm text-foreground-secondary">BIC</div>
                </div>

                <div className="text-center">
                  <div className="text-xl font-bold text-foreground">
                    {(analysisResults.forecasting.arima.model.rSquared * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-foreground-secondary">R²</div>
                </div>
              </div>

              <InstitutionalChart
                data={analysisResults.forecasting.arima.forecasts.map((forecast, i) => ({
                  period: `T+${i + 1}`,
                  forecast: forecast.value,
                  lower: forecast.lowerBound,
                  upper: forecast.upperBound
                }))}
                type={CHART_TYPES.LINE}
                xAxisKey="period"
                yAxisKeys={['forecast', 'lower', 'upper']}
                height={250}
                colors={['#059669', '#dc2626', '#dc2626']}
              />
            </CardContent>
          </Card>

          {/* Exponential Smoothing */}
          <Card>
            <CardHeader>
              <CardTitle>Exponential Smoothing Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <InstitutionalChart
                data={analysisResults.forecasting.exponentialSmoothing.forecasts.map(
                  (forecast, i) => ({
                    period: `T+${i + 1}`,
                    forecast
                  })
                )}
                type={CHART_TYPES.LINE}
                xAxisKey="period"
                yAxisKeys={['forecast']}
                height={200}
                colors={['#2563eb']}
              />
            </CardContent>
          </Card>

          {/* Model Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Forecast Model Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">ARIMA Model</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">MAE:</span>
                      <span className="text-foreground">
                        {analysisResults.forecasting.arima.accuracy.meanAbsoluteError.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">RMSE:</span>
                      <span className="text-foreground">
                        {analysisResults.forecasting.arima.accuracy.rootMeanSquaredError.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">MAPE:</span>
                      <span className="text-foreground">
                        {analysisResults.forecasting.arima.accuracy.meanAbsolutePercentageError.toFixed(
                          2
                        )}
                        %
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Exponential Smoothing</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">MAE:</span>
                      <span className="text-foreground">
                        {analysisResults.forecasting.exponentialSmoothing.accuracy.meanAbsoluteError.toFixed(
                          4
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">RMSE:</span>
                      <span className="text-foreground">
                        {analysisResults.forecasting.exponentialSmoothing.accuracy.rootMeanSquaredError.toFixed(
                          4
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">MAPE:</span>
                      <span className="text-foreground">
                        {analysisResults.forecasting.exponentialSmoothing.accuracy.meanAbsolutePercentageError.toFixed(
                          2
                        )}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-foreground-secondary mb-4">
              Click "Run Forecasting Analysis" to generate predictive models
            </p>
            <Button onClick={runForecastingAnalysis} disabled={isAnalyzing}>
              {isAnalyzing ? 'Analyzing...' : 'Run Forecasting Analysis'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderPerformanceAnalysis = () => (
    <div className="space-y-6">
      {analysisResults.performance ? (
        <>
          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold ${
                      analysisResults.performance.metrics.portfolio.annualizedReturn > 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {(analysisResults.performance.metrics.portfolio.annualizedReturn * 100).toFixed(
                      2
                    )}
                    %
                  </div>
                  <div className="text-sm text-foreground-secondary">Annualized Return</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {(analysisResults.performance.metrics.portfolio.volatility * 100).toFixed(2)}%
                  </div>
                  <div className="text-sm text-foreground-secondary">Volatility</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {analysisResults.performance.metrics.portfolio.sharpeRatio.toFixed(2)}
                  </div>
                  <div className="text-sm text-foreground-secondary">Sharpe Ratio</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {analysisResults.performance.metrics.portfolio.maxDrawdown.toFixed(2)}%
                  </div>
                  <div className="text-sm text-foreground-secondary">Max Drawdown</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attribution Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Attribution (Brinson Model)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div
                    className={`text-xl font-bold ${
                      analysisResults.performance.attribution.allocation > 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {analysisResults.performance.attribution.allocation.toFixed(2)}%
                  </div>
                  <div className="text-sm text-foreground-secondary">Allocation Effect</div>
                </div>

                <div className="text-center">
                  <div
                    className={`text-xl font-bold ${
                      analysisResults.performance.attribution.selection > 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {analysisResults.performance.attribution.selection.toFixed(2)}%
                  </div>
                  <div className="text-sm text-foreground-secondary">Selection Effect</div>
                </div>

                <div className="text-center">
                  <div
                    className={`text-xl font-bold ${
                      analysisResults.performance.attribution.interaction > 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {analysisResults.performance.attribution.interaction.toFixed(2)}%
                  </div>
                  <div className="text-sm text-foreground-secondary">Interaction Effect</div>
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-foreground mb-2">
                  {analysisResults.performance.attribution.total.toFixed(2)}%
                </div>
                <div className="text-sm text-foreground-secondary">Total Attribution</div>
              </div>
            </CardContent>
          </Card>

          {/* Risk-Adjusted Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Risk-Adjusted Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-xl font-bold text-foreground">
                    {analysisResults.performance.riskAdjusted.modern.valueAtRisk.toFixed(2)}%
                  </div>
                  <div className="text-sm text-foreground-secondary">VaR (95%)</div>
                </div>

                <div className="text-center">
                  <div className="text-xl font-bold text-foreground">
                    {analysisResults.performance.riskAdjusted.downside.downsideDeviation.toFixed(3)}
                  </div>
                  <div className="text-sm text-foreground-secondary">Downside Deviation</div>
                </div>

                <div className="text-center">
                  <div className="text-xl font-bold text-foreground">
                    {analysisResults.performance.riskAdjusted.modern.calmarRatio.toFixed(2)}
                  </div>
                  <div className="text-sm text-foreground-secondary">Calmar Ratio</div>
                </div>

                <div className="text-center">
                  <div className="text-xl font-bold text-foreground">
                    {analysisResults.performance.riskAdjusted.relative.informationRatio.toFixed(2)}
                  </div>
                  <div className="text-sm text-foreground-secondary">Information Ratio</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-foreground-secondary mb-4">
              Click "Run Performance Analysis" to generate comprehensive performance analytics
            </p>
            <Button onClick={runPerformanceAnalysis} disabled={isAnalyzing}>
              {isAnalyzing ? 'Analyzing...' : 'Run Performance Analysis'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderStatisticsAnalysis = () => (
    <div className="space-y-6">
      {analysisResults.statistics ? (
        <>
          {/* Normality Test */}
          <Card>
            <CardHeader>
              <CardTitle>Distribution Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div
                    className={`text-xl font-bold ${
                      analysisResults.statistics.normality.rejectNull
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}
                  >
                    {analysisResults.statistics.normality.rejectNull ? 'No' : 'Yes'}
                  </div>
                  <div className="text-sm text-foreground-secondary">Normal Distribution</div>
                </div>

                <div className="text-center">
                  <div className="text-xl font-bold text-foreground">
                    {analysisResults.statistics.normality.skewness.toFixed(3)}
                  </div>
                  <div className="text-sm text-foreground-secondary">Skewness</div>
                </div>

                <div className="text-center">
                  <div className="text-xl font-bold text-foreground">
                    {analysisResults.statistics.normality.kurtosis.toFixed(3)}
                  </div>
                  <div className="text-sm text-foreground-secondary">Kurtosis</div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-background-secondary rounded-md">
                <p className="text-sm text-foreground-secondary">
                  {analysisResults.statistics.normality.rejectNull
                    ? '🚨 Returns are not normally distributed. Consider using non-parametric methods.'
                    : '✅ Returns appear to be normally distributed.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Stationarity Test */}
          <Card>
            <CardHeader>
              <CardTitle>Stationarity Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center">
                  <div
                    className={`text-xl font-bold ${
                      analysisResults.statistics.stationarity.rejectNull
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {analysisResults.statistics.stationarity.rejectNull ? 'Yes' : 'No'}
                  </div>
                  <div className="text-sm text-foreground-secondary">Stationary</div>
                </div>

                <div className="text-center">
                  <div className="text-xl font-bold text-foreground">
                    {analysisResults.statistics.stationarity.adfStatistic.toFixed(3)}
                  </div>
                  <div className="text-sm text-foreground-secondary">ADF Statistic</div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-background-secondary rounded-md">
                <p className="text-sm text-foreground-secondary">
                  {analysisResults.statistics.stationarity.rejectNull
                    ? '✅ Time series is stationary. Standard statistical methods can be applied.'
                    : '⚠️ Time series may have a unit root. Consider differencing or other transformations.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Hypothesis Testing */}
          <Card>
            <CardHeader>
              <CardTitle>Hypothesis Testing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-md">
                  <div>
                    <h4 className="font-medium text-foreground">One-sample t-test</h4>
                    <p className="text-sm text-foreground-secondary">H₀: Mean return = 0%</p>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-lg font-bold ${
                        analysisResults.statistics.hypothesis.tTest.rejectNull
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}
                    >
                      {analysisResults.statistics.hypothesis.tTest.rejectNull
                        ? 'Reject H₀'
                        : 'Fail to Reject H₀'}
                    </div>
                    <div className="text-sm text-foreground-secondary">
                      t = {analysisResults.statistics.hypothesis.tTest.tStatistic.toFixed(3)}, p ={' '}
                      {analysisResults.statistics.hypothesis.tTest.pValue.toFixed(4)}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-background-secondary rounded-md">
                  <p className="text-sm text-foreground-secondary">
                    {analysisResults.statistics.hypothesis.tTest.rejectNull
                      ? '🚨 Returns are significantly different from zero. Market timing may be present.'
                      : '✅ Returns are not significantly different from zero.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-foreground-secondary mb-4">
              Click "Run Statistical Analysis" to generate comprehensive statistical tests
            </p>
            <Button onClick={runStatisticalAnalysis} disabled={isAnalyzing}>
              {isAnalyzing ? 'Analyzing...' : 'Run Statistical Analysis'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Advanced Analytics Engine</h1>
            <p className="text-foreground-secondary mt-1">
              Institutional-grade financial analysis algorithms and models
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/')}>
              ← Back to Home
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              🔄 Reset Demo
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1 mt-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-brand-accent text-foreground-inverse'
                  : 'text-foreground-secondary hover:text-foreground hover:bg-background-secondary'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'returns' && renderReturnsAnalysis()}
        {activeTab === 'risk' && renderRiskAnalysis()}
        {activeTab === 'forecasting' && renderForecastingAnalysis()}
        {activeTab === 'performance' && renderPerformanceAnalysis()}
        {activeTab === 'statistics' && renderStatisticsAnalysis()}
      </div>
    </div>
  );
};

export default AdvancedAnalyticsDemo;
