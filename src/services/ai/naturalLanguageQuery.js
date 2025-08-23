// Natural Language Query System - Phase 1 Implementation
export class NaturalLanguageQueryService {
  constructor() {
    this.intentClassifier = new IntentClassifier();
    this.entityExtractor = new EntityExtractor();
    this.queryProcessor = new QueryProcessor();
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
        query: query,
        intent: intent,
        entities: entities,
        result: result,
        response: response,
        confidence: intent.confidence,
        suggestions: this.generateSuggestions(intent, entities)
      };
      
    } catch (error) {
      return {
        query: query,
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
      normalized: normalized,
      financialTerms: financialTerms,
      timeReferences: timeReferences,
      comparisons: comparisons,
      metrics: metrics,
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
      /\b(apple|microsoft|google|amazon|tesla|netflix)\b/gi, // Common company names
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
      'revenue': ['revenue', 'sales', 'top line', 'turnover'],
      'profit': ['profit', 'earnings', 'net income', 'bottom line'],
      'margin': ['margin', 'profitability', 'profit margin'],
      'growth': ['growth', 'growth rate', 'increase', 'expansion'],
      'valuation': ['valuation', 'multiple', 'p/e', 'price to earnings'],
      'debt': ['debt', 'leverage', 'debt ratio', 'borrowing'],
      'cash': ['cash', 'cash flow', 'liquidity', 'working capital'],
      'roe': ['roe', 'return on equity'],
      'roa': ['roa', 'return on assets'],
      'ebitda': ['ebitda', 'operating earnings']
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
      'what': /^what\b/i,
      'how': /^how\b/i,
      'when': /^when\b/i,
      'where': /^where\b/i,
      'why': /^why\b/i,
      'which': /^which\b/i,
      'show': /^show\b/i,
      'calculate': /^calculate\b/i,
      'compare': /^compare\b/i,
      'analyze': /^analy[sz]e\b/i
    };

    for (const [type, pattern] of Object.entries(questionPatterns)) {
      if (pattern.test(query)) return type;
    }

    return 'statement';
  }

  async executeQuery(intent, entities, context) {
    const { action, confidence } = intent;
    
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

  async getFinancialData(entities, context) {
    const { company, metrics, timeframe } = entities;
    
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
      data: data,
      source: 'premium_data_service'
    };
  }

  async calculateMetrics(entities, context) {
    const { metrics, inputValues } = entities;
    const calculations = {};

    if (metrics.includes('growth')) {
      const currentValue = inputValues?.current || 100;
      const previousValue = inputValues?.previous || 90;
      calculations.growth = ((currentValue - previousValue) / previousValue * 100);
    }

    if (metrics.includes('margin')) {
      const revenue = inputValues?.revenue || 1000;
      const costs = inputValues?.costs || 700;
      calculations.margin = ((revenue - costs) / revenue * 100);
    }

    return {
      type: 'calculations',
      calculations: calculations,
      formulas: this.getFormulas(metrics)
    };
  }

  async compareCompanies(entities, context) {
    const { companies, metrics } = entities;
    
    // Mock comparison data
    const comparison = {
      companies: companies || ['AAPL', 'MSFT'],
      metrics: metrics || ['revenue', 'profit', 'margin'],
      data: {
        'AAPL': { revenue: 394.33, profit: 99.8, margin: 25.3 },
        'MSFT': { revenue: 211.92, profit: 72.74, margin: 34.3 }
      },
      winner: 'MSFT',
      reasoning: 'Higher profit margins despite lower revenue'
    };

    return {
      type: 'comparison',
      comparison: comparison
    };
  }

  async analyzeTrends(entities, context) {
    const { company, metrics, timeframe } = entities;
    
    // Mock trend analysis
    const trends = {
      company: company || 'AAPL',
      metric: metrics?.[0] || 'revenue',
      period: timeframe || '5 years',
      trend: 'upward',
      slope: 12.5, // % annual growth
      confidence: 0.87,
      data_points: [100, 115, 132, 148, 167],
      analysis: 'Strong consistent growth with accelerating momentum'
    };

    return {
      type: 'trend_analysis',
      trends: trends
    };
  }

  async forecastValues(entities, context) {
    const { company, metrics, horizon } = entities;
    
    // Mock forecast using predictive models
    const forecast = {
      company: company || 'AAPL',
      metric: metrics?.[0] || 'revenue',
      horizon: horizon || 4, // quarters
      predictions: [120, 125, 132, 139],
      confidence_intervals: [
        { lower: 115, upper: 125 },
        { lower: 119, upper: 131 },
        { lower: 124, upper: 140 },
        { lower: 129, upper: 149 }
      ],
      model_confidence: 0.82
    };

    return {
      type: 'forecast',
      forecast: forecast
    };
  }

  async explainConcept(entities, context) {
    const { concept } = entities;
    
    const explanations = {
      'pe_ratio': {
        definition: 'Price-to-Earnings ratio measures how much investors are willing to pay per dollar of earnings',
        formula: 'Stock Price / Earnings Per Share',
        interpretation: 'Higher P/E suggests growth expectations or overvaluation',
        typical_range: '10-30 for most companies'
      },
      'dcf': {
        definition: 'Discounted Cash Flow values a company based on projected future cash flows',
        formula: 'Sum of (Future Cash Flow / (1 + Discount Rate)^n)',
        interpretation: 'Intrinsic value based on cash generation ability',
        use_cases: 'Long-term investment decisions, M&A valuation'
      }
    };

    return {
      type: 'explanation',
      concept: concept,
      explanation: explanations[concept] || 'Concept not found in knowledge base'
    };
  }

  getFormulas(metrics) {
    const formulas = {
      growth: '((Current Value - Previous Value) / Previous Value) × 100',
      margin: '((Revenue - Costs) / Revenue) × 100',
      roe: 'Net Income / Shareholders\' Equity',
      roa: 'Net Income / Total Assets',
      debt_ratio: 'Total Debt / Total Assets'
    };

    return metrics.reduce((acc, metric) => {
      if (formulas[metric]) acc[metric] = formulas[metric];
      return acc;
    }, {});
  }

  generateSuggestions(intent, entities) {
    const suggestions = [
      'Show me Apple\'s revenue growth over the last 5 years',
      'Compare Microsoft and Google\'s profit margins',
      'Calculate the P/E ratio for Tesla',
      'What is the DCF valuation method?',
      'Forecast Amazon\'s revenue for next 4 quarters'
    ];

    return suggestions.slice(0, 3); // Return top 3 suggestions
  }

  getHelpSuggestions() {
    return [
      'Try asking about specific companies: "Show me AAPL revenue"',
      'Request comparisons: "Compare MSFT vs GOOGL margins"',
      'Ask for calculations: "Calculate growth rate for Tesla"',
      'Get explanations: "What is the P/E ratio?"'
    ];
  }
}

// Intent Classification System
class IntentClassifier {
  classify(parsedQuery, entities) {
    const { questionType, metrics, financialTerms, comparisons } = parsedQuery;
    
    // Rule-based intent classification
    let action = 'get_financial_data';
    let confidence = 0.7;

    if (questionType === 'compare' || comparisons.length > 0) {
      action = 'compare_companies';
      confidence = 0.9;
    } else if (questionType === 'calculate' || parsedQuery.normalized.includes('calculate')) {
      action = 'calculate_metrics';
      confidence = 0.85;
    } else if (parsedQuery.normalized.includes('trend') || parsedQuery.normalized.includes('over time')) {
      action = 'analyze_trends';
      confidence = 0.8;
    } else if (parsedQuery.normalized.includes('forecast') || parsedQuery.normalized.includes('predict')) {
      action = 'forecast_values';
      confidence = 0.8;
    } else if (questionType === 'what' && parsedQuery.normalized.includes('is')) {
      action = 'explain_concept';
      confidence = 0.85;
    }

    return { action, confidence };
  }
}

// Entity Extraction System
class EntityExtractor {
  extract(query, context) {
    const entities = {
      company: null,
      metrics: [],
      timeframe: null,
      values: {}
    };

    // Extract company symbols/names
    const companyMatch = query.match(/\b([A-Z]{2,5})\b/);
    if (companyMatch) entities.company = companyMatch[1];

    // Extract metrics
    const metricKeywords = {
      revenue: /\b(revenue|sales)\b/i,
      profit: /\b(profit|earnings|income)\b/i,
      margin: /\b(margin)\b/i,
      growth: /\b(growth)\b/i
    };

    Object.keys(metricKeywords).forEach(metric => {
      if (metricKeywords[metric].test(query)) {
        entities.metrics.push(metric);
      }
    });

    // Extract timeframes
    const timeMatch = query.match(/\b(q[1-4]|\d{4}|last\s+\d+\s+years?)\b/i);
    if (timeMatch) entities.timeframe = timeMatch[1];

    return entities;
  }
}

// Query Processing System
class QueryProcessor {
  async process(intent, entities, context) {
    // This would integrate with various data services
    // and perform the actual query execution
    return { processed: true };
  }
}

// Response Generation System
class ResponseGenerator {
  async generate(result, intent, entities) {
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
${forecast.predictions.map((pred, i) => `Q${i+1}: $${pred}B`).join(', ')}
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
