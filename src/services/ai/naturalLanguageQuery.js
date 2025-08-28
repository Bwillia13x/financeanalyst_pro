// Natural Language Query System - Phase 1 Implementation
export class NaturalLanguageQueryService {
  constructor() {
    this.intentClassifier = {
      classify: (parsedQuery, entities) => ({
        action: this.identifyIntent(parsedQuery, entities),
        confidence: 0.8
      })
    };
    this.entityExtractor = {
      extract: (query, context) => this.extractEntities(query, context)
    };
    this.queryProcessor = {
      process: (query, entities) => this.processQuery(query, entities)
    };
    this.responseGenerator = new ResponseGenerator();
    this.cache = new Map();
  }

  // Main query processing interface
  async processQuery(query, context = {}) {
    try {
      // Step 1: Parse and understand the query
      const parsedQuery = await this.parseQuery(query);

      // Step 2: Extract financial entities and parameters
      const entities = this.entityExtractor.extract(query, context);

      // Step 3: Classify intent and determine action
      const intent = this.intentClassifier.classify(parsedQuery, entities);

      // Step 4: Execute the query
      const result = await this.executeQuery(intent, entities, context);

      // Step 5: Generate natural language response
      const response = await this.responseGenerator.generate(result, intent, entities);

      return {
        query,
        intent,
        entities,
        result,
        response,
        confidence: intent.confidence,
        suggestions: this.generateSuggestions(intent, entities)
      };
    } catch (error) {
      return {
        query,
        error: error.message,
        response: "I'm sorry, I couldn't understand that query. Could you rephrase it?",
        suggestions: this.getHelpSuggestions()
      };
    }
  }

  async parseQuery(query) {
    // Normalize query
    const normalized = query.toLowerCase().trim();

    // Extract key phrases and financial terms
    const financialTerms = this.extractFinancialTerms(normalized);
    const timeReferences = this.extractTimeReferences(normalized);
    const comparisons = this.extractComparisons(normalized);
    const metrics = this.extractMetrics(normalized);

    return {
      original: query,
      normalized,
      financialTerms,
      timeReferences,
      comparisons,
      metrics,
      questionType: this.identifyQuestionType(normalized)
    };
  }

  extractFinancialTerms(query) {
    const terms = {
      companies: [],
      sectors: [],
      metrics: [],
      ratios: []
    };

    // Company name patterns
    const companyPatterns = [
      /\b([A-Z]{1,5})\b/g, // Stock tickers
      /\b(apple|microsoft|google|amazon|tesla|netflix)\b/gi // Common company names
    ];

    companyPatterns.forEach(pattern => {
      const matches = query.match(pattern);
      if (matches) terms.companies.push(...matches);
    });

    // Financial metrics
    const metricPatterns = {
      revenue: /\b(revenue|sales|top.?line)\b/gi,
      profit: /\b(profit|earnings|net.?income|bottom.?line)\b/gi,
      margin: /\b(margin|profitability)\b/gi,
      growth: /\b(growth|increase|decrease)\b/gi,
      valuation: /\b(valuation|multiple|p\/e|price.?to.?earnings)\b/gi,
      debt: /\b(debt|leverage|borrowing)\b/gi,
      cash: /\b(cash|liquidity|working.?capital)\b/gi
    };

    Object.keys(metricPatterns).forEach(metric => {
      if (metricPatterns[metric].test(query)) {
        terms.metrics.push(metric);
      }
    });

    return terms;
  }

  extractTimeReferences(query) {
    const timePatterns = {
      quarters: /\b(q[1-4]|quarter|quarterly)\b/gi,
      years: /\b(\d{4}|annual|yearly|year.?over.?year|yoy)\b/gi,
      periods: /\b(last|previous|current|next|trailing|forward)\b/gi,
      relative: /\b(month|week|day|today|yesterday)\b/gi
    };

    const references = {};
    Object.keys(timePatterns).forEach(period => {
      const matches = query.match(timePatterns[period]);
      if (matches) references[period] = matches;
    });

    return references;
  }

  extractComparisons(query) {
    const comparisons = [];

    const comparisonPatterns = [
      /\bcompare\s+(.+?)\s+(?:to|with|against)\s+(.+?)(?:\s|$)/gi,
      /\b(.+?)\s+(?:vs|versus)\s+(.+?)(?:\s|$)/gi,
      /\bhow\s+does\s+(.+?)\s+compare\s+to\s+(.+?)(?:\s|$)/gi,
      /\b(.+?)\s+(?:better|worse|higher|lower)\s+than\s+(.+?)(?:\s|$)/gi
    ];

    comparisonPatterns.forEach(pattern => {
      const matches = [...query.matchAll(pattern)];
      matches.forEach(match => {
        comparisons.push({
          entity1: match[1].trim(),
          entity2: match[2].trim(),
          type: 'comparison'
        });
      });
    });

    return comparisons;
  }

  extractMetrics(query) {
    const metricMappings = {
      revenue: ['revenue', 'sales', 'top line', 'turnover'],
      profit: ['profit', 'earnings', 'net income', 'bottom line'],
      margin: ['margin', 'profitability', 'profit margin'],
      growth: ['growth', 'growth rate', 'increase', 'expansion'],
      valuation: ['valuation', 'multiple', 'p/e', 'price to earnings'],
      debt: ['debt', 'leverage', 'debt ratio', 'borrowing'],
      cash: ['cash', 'cash flow', 'liquidity', 'working capital'],
      roe: ['roe', 'return on equity'],
      roa: ['roa', 'return on assets'],
      ebitda: ['ebitda', 'operating earnings']
    };

    const foundMetrics = [];
    Object.keys(metricMappings).forEach(metric => {
      const synonyms = metricMappings[metric];
      if (synonyms.some(synonym => query.includes(synonym))) {
        foundMetrics.push(metric);
      }
    });

    return foundMetrics;
  }

  identifyQuestionType(query) {
    const questionPatterns = {
      what: /^what\b/i,
      how: /^how\b/i,
      when: /^when\b/i,
      where: /^where\b/i,
      why: /^why\b/i,
      which: /^which\b/i,
      show: /^show\b/i,
      calculate: /^calculate\b/i,
      compare: /^compare\b/i,
      analyze: /^analy[sz]e\b/i
    };

    for (const [type, pattern] of Object.entries(questionPatterns)) {
      if (pattern.test(query)) return type;
    }

    return 'statement';
  }

  identifyIntent(parsedQuery, entities) {
    const { normalized } = parsedQuery;
    const { metrics, comparisons } = entities;

    if (comparisons && comparisons.length > 0) {
      return 'compare_companies';
    }

    if (metrics && metrics.includes('growth')) {
      return 'analyze_trends';
    }

    if (
      normalized.includes('forecast') ||
      normalized.includes('predict') ||
      normalized.includes('future')
    ) {
      return 'forecast_values';
    }

    if (
      normalized.includes('explain') ||
      normalized.includes('what is') ||
      normalized.includes('meaning')
    ) {
      return 'explain_concept';
    }

    return 'get_financial_data';
  }

  extractEntities(query, context) {
    const financialTerms = this.extractFinancialTerms(query);
    const timeReferences = this.extractTimeReferences(query);
    const comparisons = this.extractComparisons(query);
    const metrics = this.extractMetrics(query);

    return {
      company: financialTerms.companies[0] || context.company || null,
      metrics,
      timeframe: timeReferences.quarters ? timeReferences.quarters[0] : null,
      comparisons,
      financialTerms,
      inputValues: context.inputValues || {}
    };
  }

  async executeQuery(intent, entities, context) {
    const { action, confidence: _confidence } = intent;

    switch (action) {
      case 'get_financial_data':
        return await this.getFinancialData(entities, context);
      case 'calculate_metrics':
        return await this.calculateMetrics(entities, context);
      case 'compare_companies':
        return await this.compareCompanies(entities, context);
      case 'analyze_trends':
        return await this.analyzeTrends(entities, context);
      case 'forecast_values':
        return await this.forecastValues(entities, context);
      case 'explain_concept':
        return await this.explainConcept(entities, context);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  async getFinancialData(entities, _context) {
    const { company, metrics: _metrics2, timeframe } = entities;

    // Mock financial data retrieval
    const data = {
      company: company || 'AAPL',
      period: timeframe || 'Q4 2023',
      metrics: {
        revenue: 119.58, // Billion
        netIncome: 33.92,
        grossMargin: 45.96,
        operatingMargin: 30.74,
        peRatio: 29.43,
        debtToEquity: 1.73
      }
    };

    return {
      type: 'financial_data',
      data,
      source: 'premium_data_service'
    };
  }

  async calculateMetrics(entities, _context) {
    const { metrics, financialTerms: _financialTerms, inputValues } = entities;
    const calculations = {};

    if (metrics.includes('growth')) {
      const currentValue = inputValues?.current || 100;
      const previousValue = inputValues?.previous || 90;
      calculations.growth = ((currentValue - previousValue) / previousValue) * 100;
    }

    if (metrics.includes('margin')) {
      const revenue = inputValues?.revenue || 1000;
      const costs = inputValues?.costs || 700;
      calculations.margin = ((revenue - costs) / revenue) * 100;
    }

    return {
      type: 'calculations',
      calculations,
      formulas: this.getFormulas(metrics || [])
    };
  }

  getFormulas(_metrics) {
    // Mock formulas based on requested metrics
    return {
      growth: '((Current - Previous) / Previous) * 100',
      margin: '((Revenue - Costs) / Revenue) * 100',
      ratio: 'Value A / Value B'
    };
  }

  async compareCompanies(entities, _context) {
    const { comparisons } = entities;

    if (!comparisons || comparisons.length === 0) {
      return {
        type: 'comparison',
        comparison: {
          error: 'No comparison entities found',
          companies: [],
          metrics: []
        }
      };
    }

    const comparison = comparisons[0];
    const mockData = {
      companies: [comparison.entity1, comparison.entity2],
      metrics: {
        [comparison.entity1]: {
          revenue: 100,
          profit: 15,
          growth: 8.5
        },
        [comparison.entity2]: {
          revenue: 90,
          profit: 12,
          growth: 6.2
        }
      },
      winner: comparison.entity1,
      reasoning: `${comparison.entity1} shows stronger revenue and profit performance`
    };

    return {
      type: 'comparison',
      comparison: mockData
    };
  }

  async analyzeTrends(entities, _context) {
    const { company, metrics: _metrics, timeframe } = entities;

    const trends = {
      company: company || 'AAPL',
      period: timeframe || '5 years',
      trends: {}
    };

    if (_metrics && _metrics.includes('revenue')) {
      trends.trends.revenue = {
        direction: 'increasing',
        growth_rate: 12.5,
        data_points: [85, 92, 98, 105, 118]
      };
    }

    if (_metrics && _metrics.includes('profit')) {
      trends.trends.profit = {
        direction: 'increasing',
        growth_rate: 15.2,
        data_points: [8.5, 9.2, 10.1, 11.8, 13.2]
      };
    }

    return {
      type: 'trends',
      trends
    };
  }

  async forecastValues(entities, _context) {
    const { company, metrics: _metrics, timeframe } = entities;

    const horizon = timeframe === 'Q1' ? 4 : 8; // quarters
    const forecasts = {
      company: company || 'AAPL',
      horizon: `${horizon} quarters`,
      predictions: [],
      model_confidence: 0.82
    };

    // Generate mock forecast data
    let baseValue = 120; // Starting revenue in billions
    for (let i = 0; i < horizon; i++) {
      const growth = 0.05 + Math.random() * 0.03; // 5-8% growth
      baseValue *= 1 + growth;
      forecasts.predictions.push(Math.round(baseValue * 100) / 100);
    }

    return {
      type: 'forecast',
      forecast: forecasts
    };
  }

  async explainConcept(entities, _context) {
    const explanations = {
      pe_ratio: {
        definition:
          "Price-to-Earnings Ratio: A valuation metric that compares a company's stock price to its earnings per share.",
        formula: 'Stock Price / Earnings Per Share',
        interpretation:
          'Higher P/E ratios typically indicate higher growth expectations but also higher risk.',
        typical_range: 'Generally 10-25 for most industries'
      },
      ebitda: {
        definition:
          'Earnings Before Interest, Taxes, Depreciation, and Amortization: A measure of operational profitability.',
        formula: 'Revenue - Operating Expenses (excluding D&A)',
        interpretation: 'EBITDA shows the earnings power of the core business operations.',
        typical_range: 'Varies by industry, often compared as a multiple'
      },
      debt_to_equity: {
        definition:
          'Debt-to-Equity Ratio: A leverage ratio that measures the proportion of debt financing relative to equity.',
        formula: 'Total Debt / Total Equity',
        interpretation:
          'Lower ratios indicate less leverage and lower risk, higher ratios indicate more leverage.',
        typical_range: 'Generally 0.5-2.0 depending on industry'
      },
      return_on_equity: {
        definition:
          'Return on Equity: A profitability ratio that measures how effectively a company uses equity to generate profits.',
        formula: 'Net Income / Shareholder Equity',
        interpretation:
          'Higher ROE indicates better profitability and efficiency in using equity capital.',
        typical_range: 'Typically 10-20% for mature companies'
      }
    };

    // Try to identify the concept from entities
    const concept = entities.metrics ? entities.metrics[0] : null;
    const explanation = explanations[concept] || {
      definition:
        "Financial metrics are quantitative measures used to evaluate a company's performance, financial health, and valuation.",
      interpretation:
        'Different metrics provide different insights into various aspects of a business.',
      formula: 'Varies by metric',
      typical_range: 'Varies by metric and industry'
    };

    return {
      type: 'explanation',
      explanation
    };
  }
}

// Response Generation System
class ResponseGenerator {
  async generate(result, _intent, _entities) {
    const { type } = result;

    switch (type) {
      case 'financial_data':
        return this.generateDataResponse(result);
      case 'comparison':
        return this.generateComparisonResponse(result);
      case 'calculations':
        return this.generateCalculationResponse(result);
      case 'forecast':
        return this.generateForecastResponse(result);
      case 'explanation':
        return this.generateExplanationResponse(result);
      default:
        return 'Here are the results for your query.';
    }
  }

  generateDataResponse(result) {
    const { data } = result;
    return `For ${data.company} in ${data.period}:
• Revenue: $${data.metrics.revenue}B
• Net Income: $${data.metrics.netIncome}B
• Gross Margin: ${data.metrics.grossMargin}%
• P/E Ratio: ${data.metrics.peRatio}`;
  }

  generateComparisonResponse(result) {
    const { comparison } = result;
    const companies = comparison.companies.join(' vs ');
    return `Comparing ${companies}:
${comparison.winner} shows better performance with ${comparison.reasoning}.
Key metrics comparison shows distinct competitive advantages.`;
  }

  generateCalculationResponse(result) {
    const { calculations } = result;
    let response = 'Calculated metrics:\n';
    Object.keys(calculations).forEach(metric => {
      response += `• ${metric}: ${calculations[metric].toFixed(2)}%\n`;
    });
    return response;
  }

  generateForecastResponse(result) {
    const { forecast } = result;
    return `${forecast.company} ${forecast.metric} forecast (${forecast.horizon} quarters):
${forecast.predictions.map((pred, i) => `Q${i + 1}: $${pred}B`).join(', ')}
Model confidence: ${(forecast.model_confidence * 100).toFixed(0)}%`;
  }

  generateExplanationResponse(result) {
    const { explanation } = result;
    if (typeof explanation === 'string') return explanation;

    return `${explanation.definition}

Formula: ${explanation.formula}
Interpretation: ${explanation.interpretation}
${explanation.typical_range ? `Typical Range: ${explanation.typical_range}` : ''}`;
  }
}

export const nlQueryService = new NaturalLanguageQueryService();
