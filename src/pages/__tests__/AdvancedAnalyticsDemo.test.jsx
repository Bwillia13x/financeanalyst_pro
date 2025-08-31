import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdvancedAnalyticsDemo from '../AdvancedAnalyticsDemo';

// Mock the analytics engines
vi.mock('../../services/analytics', () => ({
  financialAnalyticsEngine: {
    calculateReturns: vi.fn(),
    calculateMovingAverages: vi.fn(),
    calculateRSI: vi.fn(),
    calculateBollingerBands: vi.fn(),
    calculateMACD: vi.fn(),
    clearCache: vi.fn()
  },
  RiskAssessmentEngine: vi.fn().mockImplementation(() => ({
    calculateVaR: vi.fn(),
    runStressTest: vi.fn(),
    performRiskAttribution: vi.fn(),
    stressTestScenarios: {
      '2008-crisis': {
        name: '2008-crisis',
        description: '2008 Financial Crisis',
        shocks: { equities: -0.5 },
        probability: 0.01
      }
    },
    clearCache: vi.fn()
  })),
  PredictiveModelingEngine: vi.fn().mockImplementation(() => ({
    forecastARIMA: vi.fn(),
    exponentialSmoothing: vi.fn(),
    randomForest: vi.fn(),
    clearCache: vi.fn()
  })),
  PerformanceMeasurementEngine: vi.fn().mockImplementation(() => ({
    calculatePerformanceMetrics: vi.fn(),
    brinsonAttribution: vi.fn(),
    calculateRiskAdjustedPerformance: vi.fn(),
    clearCache: vi.fn()
  })),
  StatisticalAnalysisEngine: vi.fn().mockImplementation(() => ({
    jarqueBeraTest: vi.fn(),
    augmentedDickeyFullerTest: vi.fn(),
    ljungBoxTest: vi.fn(),
    oneSampleTTest: vi.fn(),
    clearCache: vi.fn()
  }))
}));

import {
  financialAnalyticsEngine,
  RiskAssessmentEngine,
  PredictiveModelingEngine,
  PerformanceMeasurementEngine,
  StatisticalAnalysisEngine
} from '../../services/analytics';

describe('AdvancedAnalyticsDemo E2E Tests', () => {
  let user;
  let mockRiskEngine;
  let mockPredictiveEngine;
  let mockPerformanceEngine;
  let mockStatisticalEngine;

  beforeEach(() => {
    user = userEvent.setup();

    // Setup mock implementations
    mockRiskEngine = new RiskAssessmentEngine();
    mockPredictiveEngine = new PredictiveModelingEngine();
    mockPerformanceEngine = new PerformanceMeasurementEngine();
    mockStatisticalEngine = new StatisticalAnalysisEngine();

    // Mock return data
    financialAnalyticsEngine.calculateReturns.mockReturnValue({
      returns: [0.01, 0.02, 0.005, 0.015, 0.008],
      totalReturn: 0.0605,
      annualizedReturn: 0.121,
      volatility: 0.0085,
      sharpeRatio: 1.45,
      maxDrawdown: -0.02,
      statistics: {
        mean: 0.0116,
        std: 0.0062,
        skewness: 0.15,
        kurtosis: 0.25
      }
    });

    financialAnalyticsEngine.calculateMovingAverages.mockReturnValue({
      MA20: Array.from({ length: 30 }, () => 105 + Math.random() * 10)
    });

    financialAnalyticsEngine.calculateRSI.mockReturnValue(
      Array.from({ length: 25 }, () => 40 + Math.random() * 40)
    );

    mockRiskEngine.calculateVaR.mockReturnValue({
      var95: -0.025,
      var99: -0.035,
      expectedShortfall: -0.028,
      riskMetrics: {
        volatility: 0.0085,
        maxDrawdown: -0.02
      }
    });

    mockRiskEngine.runStressTest.mockReturnValue({
      scenario: '2008-crisis',
      impact: {
        returnImpact: -0.15,
        volatilityImpact: 0.012,
        varImpact: -0.008,
        maxDrawdownImpact: -0.05,
        returnImpactPercent: -23.5
      },
      recovery: {
        time: 18,
        probability: 0.65
      },
      assetImpacts: [
        { asset: 'AAPL', contributionToLoss: -0.045 },
        { asset: 'MSFT', contributionToLoss: -0.038 }
      ]
    });

    mockPredictiveEngine.forecastARIMA.mockReturnValue({
      method: 'ARIMA',
      forecasts: [
        { period: 1, value: 108.5, lowerBound: 105.2, upperBound: 111.8 },
        { period: 2, value: 109.2, lowerBound: 105.8, upperBound: 112.6 },
        { period: 3, value: 110.1, lowerBound: 106.5, upperBound: 113.7 }
      ],
      model: {
        aic: 245.67,
        bic: 252.34,
        rSquared: 0.78
      },
      accuracy: {
        meanAbsoluteError: 1.23,
        rootMeanSquaredError: 1.56,
        meanAbsolutePercentageError: 1.15
      }
    });

    mockPerformanceEngine.calculatePerformanceMetrics.mockReturnValue({
      portfolio: {
        totalReturn: 0.0605,
        annualizedReturn: 0.121,
        volatility: 0.0085,
        sharpeRatio: 1.45,
        maxDrawdown: -0.02,
        var95: -0.025
      },
      benchmark: {
        totalReturn: 0.045,
        annualizedReturn: 0.09,
        volatility: 0.0072
      },
      relative: {
        excessReturn: 0.031,
        informationRatio: 0.85,
        alpha: 0.028,
        beta: 1.05
      }
    });

    mockStatisticalEngine.jarqueBeraTest.mockReturnValue({
      test: 'Jarque-Bera test for normality',
      rejectNull: false,
      skewness: 0.15,
      kurtosis: 0.25,
      pValue: 0.78,
      interpretation: 'Fail to reject normality - data may be normally distributed'
    });

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Page Rendering', () => {
    it('should render the analytics demo page correctly', () => {
      render(<AdvancedAnalyticsDemo />);

      expect(screen.getByText('Advanced Analytics Engine')).toBeInTheDocument();
      expect(
        screen.getByText('Institutional-grade financial analysis algorithms and models')
      ).toBeInTheDocument();
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Return Analysis')).toBeInTheDocument();
      expect(screen.getByText('Risk Analysis')).toBeInTheDocument();
    });

    it('should display navigation tabs correctly', () => {
      render(<AdvancedAnalyticsDemo />);

      const tabs = [
        'Overview',
        'Return Analysis',
        'Risk Analysis',
        'Forecasting',
        'Performance',
        'Statistics'
      ];
      tabs.forEach(tab => {
        expect(screen.getByText(tab)).toBeInTheDocument();
      });
    });

    it('should show overview section by default', () => {
      render(<AdvancedAnalyticsDemo />);

      expect(screen.getByText('Complete Advanced Analytics System')).toBeInTheDocument();
      expect(screen.getByText('📈 Return Analysis')).toBeInTheDocument();
      expect(screen.getByText('⚠️ Risk Analysis')).toBeInTheDocument();
      expect(screen.getByText('🔮 Forecasting')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should switch between tabs correctly', async () => {
      render(<AdvancedAnalyticsDemo />);

      // Click on Return Analysis tab
      await user.click(screen.getByText('Return Analysis'));

      // Should show return analysis content
      await waitFor(() => {
        expect(screen.getByText('Return Statistics')).toBeInTheDocument();
      });

      // Click on Risk Analysis tab
      await user.click(screen.getByText('Risk Analysis'));

      // Should show risk analysis content
      await waitFor(() => {
        expect(screen.getByText('Value at Risk (VaR) Analysis')).toBeInTheDocument();
      });
    });

    it('should maintain tab state when switching', async () => {
      render(<AdvancedAnalyticsDemo />);

      // Switch to Return Analysis
      await user.click(screen.getByText('Return Analysis'));
      expect(screen.getByText('Return Statistics')).toBeInTheDocument();

      // Switch to Overview and back
      await user.click(screen.getByText('Overview'));
      expect(screen.getByText('Complete Advanced Analytics System')).toBeInTheDocument();

      await user.click(screen.getByText('Return Analysis'));
      expect(screen.getByText('Return Statistics')).toBeInTheDocument();
    });
  });

  describe('Return Analysis Functionality', () => {
    beforeEach(async () => {
      render(<AdvancedAnalyticsDemo />);
      await user.click(screen.getByText('Return Analysis'));
    });

    it('should display return analysis results when run', async () => {
      // Click run analysis button
      const runButton = screen.getByText('Run Return Analysis');
      await user.click(runButton);

      // Should show results
      await waitFor(() => {
        expect(financialAnalyticsEngine.calculateReturns).toHaveBeenCalled();
        expect(screen.getByText('7.00%')).toBeInTheDocument(); // Total return
        expect(screen.getByText('12.10%')).toBeInTheDocument(); // Annualized return
      });
    });

    it('should display technical indicators', async () => {
      const runButton = screen.getByText('Run Return Analysis');
      await user.click(runButton);

      await waitFor(() => {
        expect(financialAnalyticsEngine.calculateMovingAverages).toHaveBeenCalled();
        expect(financialAnalyticsEngine.calculateRSI).toHaveBeenCalled();
        expect(screen.getByText('Moving Averages')).toBeInTheDocument();
      });
    });

    it('should show loading state during analysis', async () => {
      // Mock a delay in the calculation
      financialAnalyticsEngine.calculateReturns.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  returns: [0.01, 0.02],
                  totalReturn: 0.0301,
                  annualizedReturn: 0.0602,
                  volatility: 0.005,
                  sharpeRatio: 1.2,
                  maxDrawdown: -0.01,
                  statistics: { mean: 0.015, std: 0.005, skewness: 0, kurtosis: 0 }
                }),
              100
            )
          )
      );

      const runButton = screen.getByText('Run Return Analysis');
      await user.click(runButton);

      // Should show loading state
      expect(screen.getByText('Analyzing...')).toBeInTheDocument();

      // Should show results after loading
      await waitFor(
        () => {
          expect(screen.getByText('3.01%')).toBeInTheDocument();
        },
        { timeout: 200 }
      );
    });
  });

  describe('Risk Analysis Functionality', () => {
    beforeEach(async () => {
      render(<AdvancedAnalyticsDemo />);
      await user.click(screen.getByText('Risk Analysis'));
    });

    it('should display VaR analysis results', async () => {
      const runButton = screen.getByText('Run Risk Analysis');
      await user.click(runButton);

      await waitFor(() => {
        expect(mockRiskEngine.calculateVaR).toHaveBeenCalled();
        expect(screen.getByText('2.50%')).toBeInTheDocument(); // VaR 95%
        expect(screen.getByText('3.50%')).toBeInTheDocument(); // VaR 99%
      });
    });

    it('should display stress test results', async () => {
      const runButton = screen.getByText('Run Risk Analysis');
      await user.click(runButton);

      await waitFor(() => {
        expect(mockRiskEngine.runStressTest).toHaveBeenCalled();
        expect(screen.getByText('23.50%')).toBeInTheDocument(); // Return impact
        expect(screen.getByText('18')).toBeInTheDocument(); // Recovery time
      });
    });

    it('should show risk recommendations', async () => {
      const runButton = screen.getByText('Run Risk Analysis');
      await user.click(runButton);

      await waitFor(() => {
        expect(
          screen.getByText('🚨 High risk exposure detected. Consider portfolio rebalancing.')
        ).toBeInTheDocument();
      });
    });

    it('should display asset-level risk contributions', async () => {
      const runButton = screen.getByText('Run Risk Analysis');
      await user.click(runButton);

      await waitFor(() => {
        expect(screen.getByText('AAPL')).toBeInTheDocument();
        expect(screen.getByText('MSFT')).toBeInTheDocument();
        expect(screen.getByText('Risk Contribution')).toBeInTheDocument();
      });
    });
  });

  describe('Forecasting Functionality', () => {
    beforeEach(async () => {
      render(<AdvancedAnalyticsDemo />);
      await user.click(screen.getByText('Forecasting'));
    });

    it('should display ARIMA forecast results', async () => {
      const runButton = screen.getByText('Run Forecasting Analysis');
      await user.click(runButton);

      await waitFor(() => {
        expect(mockPredictiveEngine.forecastARIMA).toHaveBeenCalled();
        expect(screen.getByText('245.67')).toBeInTheDocument(); // AIC
        expect(screen.getByText('78.0%')).toBeInTheDocument(); // R²
      });
    });

    it('should display forecast values with confidence intervals', async () => {
      const runButton = screen.getByText('Run Forecasting Analysis');
      await user.click(runButton);

      await waitFor(() => {
        expect(screen.getByText('108.50')).toBeInTheDocument(); // Forecast value
        expect(screen.getByText('105.20 - 111.80')).toBeInTheDocument(); // Confidence interval
      });
    });

    it('should show forecast accuracy metrics', async () => {
      const runButton = screen.getByText('Run Forecasting Analysis');
      await user.click(runButton);

      await waitFor(() => {
        expect(screen.getByText('1.23')).toBeInTheDocument(); // MAE
        expect(screen.getByText('1.56')).toBeInTheDocument(); // RMSE
        expect(screen.getByText('1.15%')).toBeInTheDocument(); // MAPE
      });
    });
  });

  describe('Performance Analysis Functionality', () => {
    beforeEach(async () => {
      render(<AdvancedAnalyticsDemo />);
      await user.click(screen.getByText('Performance'));
    });

    it('should display performance metrics', async () => {
      const runButton = screen.getByText('Run Performance Analysis');
      await user.click(runButton);

      await waitFor(() => {
        expect(mockPerformanceEngine.calculatePerformanceMetrics).toHaveBeenCalled();
        expect(screen.getByText('12.10%')).toBeInTheDocument(); // Annualized return
        expect(screen.getByText('1.45')).toBeInTheDocument(); // Sharpe ratio
      });
    });

    it('should display attribution analysis', async () => {
      mockPerformanceEngine.brinsonAttribution.mockReturnValue({
        allocation: 0.025,
        selection: 0.018,
        interaction: 0.003,
        total: 0.046,
        assetBreakdown: [
          { asset: 'AAPL', allocationEffect: 0.015, selectionEffect: 0.012, totalEffect: 0.027 },
          { asset: 'MSFT', allocationEffect: 0.01, selectionEffect: 0.006, totalEffect: 0.016 }
        ]
      });

      const runButton = screen.getByText('Run Performance Analysis');
      await user.click(runButton);

      await waitFor(() => {
        expect(mockPerformanceEngine.brinsonAttribution).toHaveBeenCalled();
        expect(screen.getByText('2.50%')).toBeInTheDocument(); // Allocation effect
        expect(screen.getByText('1.80%')).toBeInTheDocument(); // Selection effect
      });
    });

    it('should display risk-adjusted performance', async () => {
      mockPerformanceEngine.calculateRiskAdjustedPerformance.mockReturnValue({
        traditional: { sharpeRatio: 1.45, sortinoRatio: 1.12, omegaRatio: 1.08 },
        modern: { valueAtRisk: -0.025, expectedShortfall: -0.028, calmarRatio: 6.05 },
        downside: { downsideDeviation: 0.0062, upsidePotentialRatio: 1.35 },
        relative: { informationRatio: 0.85, trackingError: 0.045, alpha: 0.028, beta: 1.05 }
      });

      const runButton = screen.getByText('Run Performance Analysis');
      await user.click(runButton);

      await waitFor(() => {
        expect(screen.getByText('1.12')).toBeInTheDocument(); // Sortino ratio
        expect(screen.getByText('6.05')).toBeInTheDocument(); // Calmar ratio
        expect(screen.getByText('0.85')).toBeInTheDocument(); // Information ratio
      });
    });
  });

  describe('Statistical Analysis Functionality', () => {
    beforeEach(async () => {
      render(<AdvancedAnalyticsDemo />);
      await user.click(screen.getByText('Statistics'));
    });

    it('should display normality test results', async () => {
      const runButton = screen.getByText('Run Statistical Analysis');
      await user.click(runButton);

      await waitFor(() => {
        expect(mockStatisticalEngine.jarqueBeraTest).toHaveBeenCalled();
        expect(screen.getByText('0.150')).toBeInTheDocument(); // Skewness
        expect(screen.getByText('0.250')).toBeInTheDocument(); // Kurtosis
        expect(
          screen.getByText('Fail to reject normality - data may be normally distributed')
        ).toBeInTheDocument();
      });
    });

    it('should display hypothesis test results', async () => {
      mockStatisticalEngine.oneSampleTTest.mockReturnValue({
        test: 'One-sample t-test',
        tStatistic: 2.15,
        pValue: 0.045,
        rejectNull: true,
        sampleMean: 10.5,
        confidenceInterval: { lower: 10.2, upper: 10.8 }
      });

      const runButton = screen.getByText('Run Statistical Analysis');
      await user.click(runButton);

      await waitFor(() => {
        expect(mockStatisticalEngine.oneSampleTTest).toHaveBeenCalled();
        expect(screen.getByText('Reject H₀')).toBeInTheDocument();
        expect(screen.getByText('t = 2.150, p = 0.045')).toBeInTheDocument();
      });
    });

    it('should display stationarity test results', async () => {
      mockStatisticalEngine.augmentedDickeyFullerTest.mockReturnValue({
        test: 'Augmented Dickey-Fuller test for stationarity',
        adfStatistic: -2.85,
        rejectNull: true,
        pValue: 0.05,
        interpretation: 'Reject null hypothesis - data is stationary'
      });

      const runButton = screen.getByText('Run Statistical Analysis');
      await user.click(runButton);

      await waitFor(() => {
        expect(mockStatisticalEngine.augmentedDickeyFullerTest).toHaveBeenCalled();
        expect(screen.getByText('-2.850')).toBeInTheDocument(); // ADF statistic
        expect(screen.getByText('Reject null hypothesis - data is stationary')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle analysis errors gracefully', async () => {
      // Mock an error in the analysis
      financialAnalyticsEngine.calculateReturns.mockRejectedValue(new Error('Analysis failed'));

      render(<AdvancedAnalyticsDemo />);
      await user.click(screen.getByText('Return Analysis'));

      const runButton = screen.getByText('Run Return Analysis');
      await user.click(runButton);

      // Should handle error gracefully (implementation dependent)
      await waitFor(() => {
        expect(financialAnalyticsEngine.calculateReturns).toHaveBeenCalled();
      });
    });

    it('should reset analysis state correctly', async () => {
      render(<AdvancedAnalyticsDemo />);

      // Run analysis
      await user.click(screen.getByText('Return Analysis'));
      await user.click(screen.getByText('Run Return Analysis'));

      await waitFor(() => {
        expect(screen.getByText('Return Statistics')).toBeInTheDocument();
      });

      // Reset demo
      const resetButton = screen.getByText('🔄 Reset Demo');
      await user.click(resetButton);

      // Should reset to initial state
      expect(screen.getByText('Complete Advanced Analytics System')).toBeInTheDocument();
    });
  });

  describe('User Experience', () => {
    it('should provide quick analysis buttons in overview', () => {
      render(<AdvancedAnalyticsDemo />);

      expect(screen.getByText('📈 Return Analysis')).toBeInTheDocument();
      expect(screen.getByText('⚠️ Risk Analysis')).toBeInTheDocument();
      expect(screen.getByText('🔮 Forecasting')).toBeInTheDocument();
      expect(screen.getByText('🏆 Performance')).toBeInTheDocument();
      expect(screen.getByText('📐 Statistics')).toBeInTheDocument();
    });

    it('should show appropriate loading states', async () => {
      // Mock delayed response
      financialAnalyticsEngine.calculateReturns.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  returns: [0.01],
                  totalReturn: 0.01,
                  annualizedReturn: 0.02,
                  volatility: 0.005,
                  sharpeRatio: 1.0,
                  maxDrawdown: -0.005,
                  statistics: { mean: 0.01, std: 0.005, skewness: 0, kurtosis: 0 }
                }),
              500
            )
          )
      );

      render(<AdvancedAnalyticsDemo />);
      await user.click(screen.getByText('Return Analysis'));

      const runButton = screen.getByText('Run Return Analysis');
      await user.click(runButton);

      // Should show loading state
      expect(screen.getByText('Analyzing...')).toBeInTheDocument();

      // Should show results after delay
      await waitFor(
        () => {
          expect(screen.getByText('1.00%')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it('should maintain accessibility standards', () => {
      render(<AdvancedAnalyticsDemo />);

      // Check for proper heading hierarchy
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);

      // Check for proper button labels
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should allow running all analyses sequentially', async () => {
      render(<AdvancedAnalyticsDemo />);

      // Run return analysis
      await user.click(screen.getByText('Return Analysis'));
      await user.click(screen.getByText('Run Return Analysis'));

      await waitFor(() => {
        expect(financialAnalyticsEngine.calculateReturns).toHaveBeenCalled();
      });

      // Run risk analysis
      await user.click(screen.getByText('Risk Analysis'));
      await user.click(screen.getByText('Run Risk Analysis'));

      await waitFor(() => {
        expect(mockRiskEngine.calculateVaR).toHaveBeenCalled();
      });

      // Run forecasting
      await user.click(screen.getByText('Forecasting'));
      await user.click(screen.getByText('Run Forecasting Analysis'));

      await waitFor(() => {
        expect(mockPredictiveEngine.forecastARIMA).toHaveBeenCalled();
      });

      // Run performance analysis
      await user.click(screen.getByText('Performance'));
      await user.click(screen.getByText('Run Performance Analysis'));

      await waitFor(() => {
        expect(mockPerformanceEngine.calculatePerformanceMetrics).toHaveBeenCalled();
      });

      // Run statistical analysis
      await user.click(screen.getByText('Statistics'));
      await user.click(screen.getByText('Run Statistical Analysis'));

      await waitFor(() => {
        expect(mockStatisticalEngine.jarqueBeraTest).toHaveBeenCalled();
      });
    });

    it('should handle navigation between completed analyses', async () => {
      render(<AdvancedAnalyticsDemo />);

      // Complete return analysis
      await user.click(screen.getByText('Return Analysis'));
      await user.click(screen.getByText('Run Return Analysis'));

      await waitFor(() => {
        expect(screen.getByText('Return Statistics')).toBeInTheDocument();
      });

      // Navigate to other tabs and back
      await user.click(screen.getByText('Overview'));
      expect(screen.getByText('Complete Advanced Analytics System')).toBeInTheDocument();

      await user.click(screen.getByText('Return Analysis'));
      expect(screen.getByText('Return Statistics')).toBeInTheDocument();
    });
  });
});
