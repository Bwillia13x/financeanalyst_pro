import { useState, useEffect, useMemo } from 'react';

// Industry benchmark data structure
const INDUSTRY_BENCHMARKS = {
  healthcare: {
    name: 'Healthcare & Life Sciences',
    metrics: {
      revenueGrowth: {
        p25: 8, median: 15, p75: 25, unit: '%',
        description: 'Annual revenue growth rate'
      },
      ebitdaMargin: {
        p25: 18, median: 28, p75: 40, unit: '%',
        description: 'EBITDA as percentage of revenue'
      },
      grossMargin: {
        p25: 65, median: 75, p75: 85, unit: '%',
        description: 'Gross profit margin'
      },
      operatingMargin: {
        p25: 12, median: 20, p75: 32, unit: '%',
        description: 'Operating income as percentage of revenue'
      },
      netMargin: {
        p25: 8, median: 15, p75: 25, unit: '%',
        description: 'Net income margin'
      },
      roe: {
        p25: 12, median: 18, p75: 25, unit: '%',
        description: 'Return on equity'
      },
      roa: {
        p25: 6, median: 10, p75: 15, unit: '%',
        description: 'Return on assets'
      },
      debtToEquity: {
        p25: 0.2, median: 0.4, p75: 0.8, unit: 'x',
        description: 'Total debt to equity ratio'
      },
      currentRatio: {
        p25: 1.2, median: 1.8, p75: 2.5, unit: 'x',
        description: 'Current assets to current liabilities'
      },
      assetTurnover: {
        p25: 0.6, median: 0.9, p75: 1.3, unit: 'x',
        description: 'Revenue to total assets ratio'
      },
      wacc: {
        p25: 8, median: 10, p75: 12, unit: '%',
        description: 'Weighted average cost of capital'
      },
      terminalGrowth: {
        p25: 2, median: 2.5, p75: 3, unit: '%',
        description: 'Long-term terminal growth rate'
      }
    }
  },
  technology: {
    name: 'Technology & Software',
    metrics: {
      revenueGrowth: {
        p25: 15, median: 25, p75: 50, unit: '%',
        description: 'Annual revenue growth rate'
      },
      ebitdaMargin: {
        p25: 20, median: 35, p75: 50, unit: '%',
        description: 'EBITDA as percentage of revenue'
      },
      grossMargin: {
        p25: 70, median: 80, p75: 90, unit: '%',
        description: 'Gross profit margin'
      },
      operatingMargin: {
        p25: 15, median: 25, p75: 40, unit: '%',
        description: 'Operating income as percentage of revenue'
      },
      netMargin: {
        p25: 10, median: 18, p75: 30, unit: '%',
        description: 'Net income margin'
      },
      roe: {
        p25: 15, median: 22, p75: 35, unit: '%',
        description: 'Return on equity'
      },
      roa: {
        p25: 8, median: 15, p75: 25, unit: '%',
        description: 'Return on assets'
      },
      debtToEquity: {
        p25: 0.1, median: 0.3, p75: 0.6, unit: 'x',
        description: 'Total debt to equity ratio'
      },
      currentRatio: {
        p25: 1.5, median: 2.2, p75: 3.5, unit: 'x',
        description: 'Current assets to current liabilities'
      },
      assetTurnover: {
        p25: 0.4, median: 0.7, p75: 1.1, unit: 'x',
        description: 'Revenue to total assets ratio'
      },
      wacc: {
        p25: 9, median: 12, p75: 15, unit: '%',
        description: 'Weighted average cost of capital'
      },
      terminalGrowth: {
        p25: 2.5, median: 3, p75: 3.5, unit: '%',
        description: 'Long-term terminal growth rate'
      }
    }
  },
  manufacturing: {
    name: 'Manufacturing & Industrial',
    metrics: {
      revenueGrowth: {
        p25: 3, median: 8, p75: 15, unit: '%',
        description: 'Annual revenue growth rate'
      },
      ebitdaMargin: {
        p25: 10, median: 18, p75: 25, unit: '%',
        description: 'EBITDA as percentage of revenue'
      },
      grossMargin: {
        p25: 25, median: 35, p75: 45, unit: '%',
        description: 'Gross profit margin'
      },
      operatingMargin: {
        p25: 6, median: 12, p75: 20, unit: '%',
        description: 'Operating income as percentage of revenue'
      },
      netMargin: {
        p25: 4, median: 8, p75: 15, unit: '%',
        description: 'Net income margin'
      },
      roe: {
        p25: 8, median: 15, p75: 22, unit: '%',
        description: 'Return on equity'
      },
      roa: {
        p25: 4, median: 8, p75: 12, unit: '%',
        description: 'Return on assets'
      },
      debtToEquity: {
        p25: 0.3, median: 0.6, p75: 1.2, unit: 'x',
        description: 'Total debt to equity ratio'
      },
      currentRatio: {
        p25: 1.1, median: 1.5, p75: 2.2, unit: 'x',
        description: 'Current assets to current liabilities'
      },
      assetTurnover: {
        p25: 0.8, median: 1.2, p75: 1.8, unit: 'x',
        description: 'Revenue to total assets ratio'
      },
      wacc: {
        p25: 7, median: 9, p75: 11, unit: '%',
        description: 'Weighted average cost of capital'
      },
      terminalGrowth: {
        p25: 1.5, median: 2, p75: 2.5, unit: '%',
        description: 'Long-term terminal growth rate'
      }
    }
  },
  retail: {
    name: 'Retail & Consumer',
    metrics: {
      revenueGrowth: {
        p25: 2, median: 6, p75: 12, unit: '%',
        description: 'Annual revenue growth rate'
      },
      ebitdaMargin: {
        p25: 8, median: 15, p75: 22, unit: '%',
        description: 'EBITDA as percentage of revenue'
      },
      grossMargin: {
        p25: 30, median: 40, p75: 55, unit: '%',
        description: 'Gross profit margin'
      },
      operatingMargin: {
        p25: 3, median: 8, p75: 15, unit: '%',
        description: 'Operating income as percentage of revenue'
      },
      netMargin: {
        p25: 2, median: 5, p75: 10, unit: '%',
        description: 'Net income margin'
      },
      roe: {
        p25: 10, median: 16, p75: 25, unit: '%',
        description: 'Return on equity'
      },
      roa: {
        p25: 3, median: 6, p75: 10, unit: '%',
        description: 'Return on assets'
      },
      debtToEquity: {
        p25: 0.4, median: 0.7, p75: 1.3, unit: 'x',
        description: 'Total debt to equity ratio'
      },
      currentRatio: {
        p25: 0.9, median: 1.3, p75: 1.8, unit: 'x',
        description: 'Current assets to current liabilities'
      },
      assetTurnover: {
        p25: 1.2, median: 1.8, p75: 2.5, unit: 'x',
        description: 'Revenue to total assets ratio'
      },
      wacc: {
        p25: 8, median: 10, p75: 12, unit: '%',
        description: 'Weighted average cost of capital'
      },
      terminalGrowth: {
        p25: 1.5, median: 2, p75: 2.5, unit: '%',
        description: 'Long-term terminal growth rate'
      }
    }
  }
};

// Historical context data for assumptions
const HISTORICAL_CONTEXT = {
  wacc: {
    '2020': { avg: 9.2, volatility: 'high', note: 'COVID-19 impact' },
    '2021': { avg: 8.8, volatility: 'medium', note: 'Recovery period' },
    '2022': { avg: 10.5, volatility: 'high', note: 'Rising interest rates' },
    '2023': { avg: 11.2, volatility: 'medium', note: 'Continued rate increases' },
    '2024': { avg: 10.8, volatility: 'medium', note: 'Rate stabilization' }
  },
  terminalGrowth: {
    context: 'Should align with long-term GDP growth expectations (2-3% for developed markets)',
    factors: ['Economic growth', 'Inflation expectations', 'Market maturity', 'Regulatory environment']
  }
};

export const useAssumptionBenchmarking = (industry = 'healthcare', companyMetrics = {}) => {
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [comparisonResults, setComparisonResults] = useState({});

  // Get industry benchmark data
  const industryBenchmarks = useMemo(() => {
    return INDUSTRY_BENCHMARKS[industry] || INDUSTRY_BENCHMARKS.healthcare;
  }, [industry]);

  // Calculate benchmark comparisons for company metrics
  const calculateBenchmarkComparisons = useMemo(() => {
    const comparisons = {};

    Object.entries(companyMetrics).forEach(([metricKey, value]) => {
      const benchmark = industryBenchmarks.metrics[metricKey];
      if (benchmark && typeof value === 'number') {
        const position = getBenchmarkPosition(value, benchmark);
        comparisons[metricKey] = {
          value,
          benchmark,
          position,
          percentile: calculatePercentile(value, benchmark),
          recommendation: getRecommendation(value, benchmark, position)
        };
      }
    });

    return comparisons;
  }, [companyMetrics, industryBenchmarks]);

  // Determine where a value falls relative to benchmarks
  const getBenchmarkPosition = (value, benchmark) => {
    if (value >= benchmark.p75) return 'top-quartile';
    if (value >= benchmark.median) return 'above-median';
    if (value >= benchmark.p25) return 'below-median';
    return 'bottom-quartile';
  };

  // Calculate approximate percentile
  const calculatePercentile = (value, benchmark) => {
    if (value >= benchmark.p75) {
      // Estimate between 75th and 100th percentile
      const excess = Math.min((value - benchmark.p75) / (benchmark.p75 * 0.5), 1);
      return 75 + (excess * 25);
    } else if (value >= benchmark.median) {
      // Between 50th and 75th percentile
      const position = (value - benchmark.median) / (benchmark.p75 - benchmark.median);
      return 50 + (position * 25);
    } else if (value >= benchmark.p25) {
      // Between 25th and 50th percentile
      const position = (value - benchmark.p25) / (benchmark.median - benchmark.p25);
      return 25 + (position * 25);
    } else {
      // Below 25th percentile
      const deficit = Math.max((benchmark.p25 - value) / (benchmark.p25 * 0.5), 0);
      return Math.max(25 - (deficit * 25), 0);
    }
  };

  // Generate recommendations based on benchmark position
  const getRecommendation = (value, benchmark, position) => {
    const recommendations = {
      'top-quartile': {
        type: 'positive',
        message: 'Excellent performance - above industry top quartile',
        action: 'Maintain current performance and identify best practices to share'
      },
      'above-median': {
        type: 'good',
        message: 'Above-average performance - in top half of industry',
        action: 'Look for opportunities to reach top quartile performance'
      },
      'below-median': {
        type: 'caution',
        message: 'Below industry median - improvement opportunities exist',
        action: 'Analyze top performers to identify improvement strategies'
      },
      'bottom-quartile': {
        type: 'concern',
        message: 'Below industry 25th percentile - significant improvement needed',
        action: 'Priority focus area - develop comprehensive improvement plan'
      }
    };

    return recommendations[position];
  };

  // Get contextual insights for assumptions
  const getAssumptionContext = (assumptionType, value) => {
    switch (assumptionType) {
      case 'wacc':
        const currentYear = new Date().getFullYear().toString();
        const historicalData = HISTORICAL_CONTEXT.wacc[currentYear] || HISTORICAL_CONTEXT.wacc['2024'];
        return {
          historical: historicalData,
          guidance: `Current market conditions suggest WACC in range of ${industryBenchmarks.metrics.wacc.p25}%-${industryBenchmarks.metrics.wacc.p75}%`,
          factors: ['Risk-free rate', 'Market risk premium', 'Beta', 'Cost of debt', 'Tax rate'],
          recommendation: value < industryBenchmarks.metrics.wacc.p25 ? 'Consider if discount rate reflects company risk profile' :
            value > industryBenchmarks.metrics.wacc.p75 ? 'High discount rate - validate risk assumptions' :
              'Within reasonable industry range'
        };

      case 'terminalGrowth':
        return {
          context: HISTORICAL_CONTEXT.terminalGrowth.context,
          factors: HISTORICAL_CONTEXT.terminalGrowth.factors,
          guidance: `Industry terminal growth typically ${industryBenchmarks.metrics.terminalGrowth.p25}%-${industryBenchmarks.metrics.terminalGrowth.p75}%`,
          recommendation: value < 1 ? 'Very conservative - consider economic growth assumptions' :
            value > 4 ? 'High terminal growth - ensure justification' :
              'Reasonable terminal growth assumption'
        };

      default:
        return null;
    }
  };

  // Fetch additional benchmark data (simulate API call)
  const fetchBenchmarkData = async(forceRefresh = false) => {
    if (benchmarkData && !forceRefresh) return benchmarkData;

    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // In real implementation, this would fetch from API
      const data = {
        industry: industryBenchmarks,
        lastUpdated: new Date().toISOString(),
        dataSource: 'Industry Research Database',
        sampleSize: '500+ companies',
        coveragePeriod: 'Last 3 years'
      };

      setBenchmarkData(data);
      return data;
    } catch (error) {
      console.error('Error fetching benchmark data:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update comparison results when metrics change
  useEffect(() => {
    setComparisonResults(calculateBenchmarkComparisons);
  }, [calculateBenchmarkComparisons]);

  // Auto-fetch benchmark data
  useEffect(() => {
    fetchBenchmarkData();
  }, [industry]);

  return {
    // Data
    industryBenchmarks,
    benchmarkData,
    comparisonResults,
    loading,

    // Functions
    fetchBenchmarkData,
    getBenchmarkPosition,
    calculatePercentile,
    getRecommendation,
    getAssumptionContext,

    // Utils
    availableIndustries: Object.keys(INDUSTRY_BENCHMARKS),
    industryName: industryBenchmarks.name
  };
};
