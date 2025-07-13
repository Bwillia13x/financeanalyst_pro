import axios from 'axios';

// Data source configurations - Updated for Vite environment variables
const DATA_SOURCES = {
  ALPHA_VANTAGE: {
    baseURL: 'https://www.alphavantage.co/query',
    apiKey: import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || 'demo'
  },
  FMP: {
    baseURL: 'https://financialmodelingprep.com/api/v3',
    apiKey: import.meta.env.VITE_FMP_API_KEY || 'demo'
  },
  SEC_EDGAR: {
    baseURL: 'https://data.sec.gov',
    headers: {
      'User-Agent': 'FinanceAnalyst-Pro (contact@financeanalyst.com)'
    }
  },
  YAHOO_FINANCE: {
    baseURL: 'https://query1.finance.yahoo.com/v8/finance/chart',
    fallbackURL: 'https://query2.finance.yahoo.com/v8/finance/chart'
  }
};

// Rate limiting configuration
const RATE_LIMITS = {
  ALPHA_VANTAGE: { requests: 5, period: 60000 }, // 5 requests per minute
  FMP: { requests: 250, period: 86400000 }, // 250 requests per day
  SEC_EDGAR: { requests: 10, period: 1000 } // 10 requests per second
};

class DataFetchingService {
  constructor() {
    this.rateLimiters = {};
    this.cache = new Map();
    this.cacheExpiry = new Map();
    this.demoMode = this.isDemoMode();
    this.initializeRateLimiters();
  }

  isDemoMode() {
    // Check if we're using demo API keys
    const hasValidKeys = (
      import.meta.env.VITE_ALPHA_VANTAGE_API_KEY && 
      import.meta.env.VITE_ALPHA_VANTAGE_API_KEY !== 'demo'
    ) || (
      import.meta.env.VITE_FMP_API_KEY && 
      import.meta.env.VITE_FMP_API_KEY !== 'demo'
    );
    return !hasValidKeys;
  }

  initializeRateLimiters() {
    Object.keys(RATE_LIMITS).forEach(source => {
      this.rateLimiters[source] = {
        requests: [],
        limit: RATE_LIMITS[source].requests,
        period: RATE_LIMITS[source].period
      };
    });
  }

  async checkRateLimit(source) {
    const limiter = this.rateLimiters[source];
    if (!limiter) return true;

    const now = Date.now();
    limiter.requests = limiter.requests.filter(time => now - time < limiter.period);

    if (limiter.requests.length >= limiter.limit) {
      const oldestRequest = Math.min(...limiter.requests);
      const waitTime = limiter.period - (now - oldestRequest);
      throw new Error(`Rate limit exceeded for ${source}. Please wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }

    limiter.requests.push(now);
    return true;
  }

  getCacheKey(method, params) {
    return `${method}_${JSON.stringify(params)}`;
  }

  getFromCache(key) {
    const expiry = this.cacheExpiry.get(key);
    if (expiry && Date.now() > expiry) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
      return null;
    }
    return this.cache.get(key);
  }

  setCache(key, data, ttlMinutes = 60) {
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + (ttlMinutes * 60 * 1000));
  }

  generateMockData(ticker, dataType) {
    // Generate realistic mock data for demo purposes
    const basePrice = 100 + Math.random() * 200;
    const marketCap = (1000000000 + Math.random() * 10000000000);
    
    switch (dataType) {
      case 'profile':
        return {
          symbol: ticker,
          companyName: `${ticker} Corporation`,
          mktCap: marketCap,
          pe: 15 + Math.random() * 20,
          pb: 1 + Math.random() * 4,
          beta: 0.8 + Math.random() * 0.8,
          sector: 'Technology',
          industry: 'Software',
          sharesOutstanding: marketCap / basePrice,
          enterpriseValueOverEBITDA: 10 + Math.random() * 15,
          debtToEquity: Math.random() * 2,
          revenueTTM: marketCap * 0.8,
          grossProfitMargin: 0.3 + Math.random() * 0.4,
          netProfitMargin: 0.1 + Math.random() * 0.2,
          returnOnEquityTTM: 0.1 + Math.random() * 0.2,
          returnOnAssetsTTM: 0.05 + Math.random() * 0.15,
          effectiveTaxRateTTM: 0.21,
          fullTimeEmployees: 1000 + Math.random() * 50000,
          ipoDate: '2010-01-01',
          range: `$${(basePrice * 0.8).toFixed(2)} - $${(basePrice * 1.3).toFixed(2)}`
        };

      case 'marketData':
        return {
          symbol: ticker,
          currentPrice: basePrice,
          previousClose: basePrice * (0.98 + Math.random() * 0.04),
          marketCap: marketCap,
          volume: 1000000 + Math.random() * 5000000,
          currency: 'USD'
        };

      case 'incomeStatement':
        const revenue = marketCap * 0.8;
        return [{
          revenue: revenue,
          ebitda: revenue * 0.25,
          netIncome: revenue * 0.15,
          capex: revenue * 0.05,
          interestExpense: revenue * 0.02,
          grossProfitMargin: 0.6
        }];

      case 'balanceSheet':
        return [{
          totalDebt: marketCap * 0.3,
          cashAndCashEquivalents: marketCap * 0.1,
          totalCurrentAssets: marketCap * 0.4,
          totalCurrentLiabilities: marketCap * 0.2
        }];

      case 'cashFlow':
        return [{
          freeCashFlow: marketCap * 0.12
        }];

      default:
        return null;
    }
  }

  async fetchCompanyProfile(ticker) {
    const cacheKey = this.getCacheKey('profile', { ticker });
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      if (this.demoMode) {
        console.warn('Using demo mode - generating mock data for', ticker);
        const mockData = this.generateMockData(ticker, 'profile');
        this.setCache(cacheKey, mockData, 1440);
        return mockData;
      }

      await this.checkRateLimit('FMP');
      
      const response = await axios.get(
        `${DATA_SOURCES.FMP.baseURL}/profile/${ticker}`,
        {
          params: { apikey: DATA_SOURCES.FMP.apiKey },
          timeout: 10000
        }
      );

      const profile = response.data[0];
      if (!profile) {
        throw new Error(`Company profile not found for ticker: ${ticker}`);
      }

      this.setCache(cacheKey, profile, 1440); // Cache for 24 hours
      return profile;
    } catch (error) {
      if (error.response?.status === 403 || error.response?.status === 401) {
        console.warn('API key invalid, falling back to demo mode');
        const mockData = this.generateMockData(ticker, 'profile');
        this.setCache(cacheKey, mockData, 1440);
        return mockData;
      }
      throw new Error(`Failed to fetch company profile: ${error.message}`);
    }
  }

  async fetchFinancialStatements(ticker, statement = 'income-statement', period = 'annual', limit = 5) {
    const cacheKey = this.getCacheKey('financials', { ticker, statement, period, limit });
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      if (this.demoMode) {
        console.warn('Using demo mode - generating mock financial data for', ticker);
        const mockData = this.generateMockData(ticker, statement.replace('-statement', '').replace('-', ''));
        this.setCache(cacheKey, mockData, 360);
        return mockData;
      }

      await this.checkRateLimit('FMP');
      
      const response = await axios.get(
        `${DATA_SOURCES.FMP.baseURL}/${statement}/${ticker}`,
        {
          params: { 
            apikey: DATA_SOURCES.FMP.apiKey,
            period: period,
            limit: limit
          },
          timeout: 15000
        }
      );

      if (!response.data || response.data.length === 0) {
        throw new Error(`No ${statement} data found for ${ticker}`);
      }

      this.setCache(cacheKey, response.data, 360); // Cache for 6 hours
      return response.data;
    } catch (error) {
      if (error.response?.status === 403 || error.response?.status === 401) {
        console.warn('API key invalid, falling back to demo mode');
        const mockData = this.generateMockData(ticker, statement.replace('-statement', '').replace('-', ''));
        this.setCache(cacheKey, mockData, 360);
        return mockData;
      }
      throw new Error(`Failed to fetch ${statement}: ${error.message}`);
    }
  }

  async fetchMarketData(ticker, range = '1y') {
    const cacheKey = this.getCacheKey('market', { ticker, range });
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      if (this.demoMode) {
        console.warn('Using demo mode - generating mock market data for', ticker);
        const mockData = this.generateMockData(ticker, 'marketData');
        this.setCache(cacheKey, mockData, 15);
        return mockData;
      }

      // Try Yahoo Finance first (no API key required)
      const response = await axios.get(
        `${DATA_SOURCES.YAHOO_FINANCE.baseURL}/${ticker}`,
        {
          params: { range: range, interval: '1d' },
          timeout: 10000
        }
      );

      const result = response.data.chart.result[0];
      if (!result) {
        throw new Error(`No market data found for ticker: ${ticker}`);
      }

      const marketData = {
        symbol: result.meta.symbol,
        currentPrice: result.meta.regularMarketPrice,
        previousClose: result.meta.previousClose,
        marketCap: result.meta.marketCap,
        volume: result.meta.regularMarketVolume,
        timestamps: result.timestamp,
        prices: result.indicators.quote[0],
        currency: result.meta.currency
      };

      this.setCache(cacheKey, marketData, 15); // Cache for 15 minutes
      return marketData;
    } catch (error) {
      // Fallback to Alpha Vantage or demo mode
      return this.fetchMarketDataAlternative(ticker);
    }
  }

  async fetchMarketDataAlternative(ticker) {
    try {
      if (this.demoMode) {
        const mockData = this.generateMockData(ticker, 'marketData');
        return mockData;
      }

      await this.checkRateLimit('ALPHA_VANTAGE');
      
      const response = await axios.get(DATA_SOURCES.ALPHA_VANTAGE.baseURL, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: ticker,
          apikey: DATA_SOURCES.ALPHA_VANTAGE.apiKey
        },
        timeout: 10000
      });

      const quote = response.data['Global Quote'];
      if (!quote || Object.keys(quote).length === 0) {
        throw new Error(`No market data found for ticker: ${ticker}`);
      }

      return {
        symbol: quote['01. symbol'],
        currentPrice: parseFloat(quote['05. price']),
        previousClose: parseFloat(quote['08. previous close']),
        volume: parseInt(quote['06. volume']),
        change: parseFloat(quote['09. change']),
        changePercent: quote['10. change percent']
      };
    } catch (error) {
      console.warn('Market data API failed, using demo data');
      return this.generateMockData(ticker, 'marketData');
    }
  }

  async fetchSECFilings(ticker, filingType = '10-K', count = 5) {
    const cacheKey = this.getCacheKey('sec', { ticker, filingType, count });
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      if (this.demoMode) {
        console.warn('SEC filings not available in demo mode');
        return [{
          form: filingType,
          filingDate: '2023-12-31',
          accessionNumber: '0000000000-00-000000',
          reportDate: '2023-12-31',
          acceptanceDateTime: '2024-01-15T16:30:00',
          act: '34',
          primaryDocument: `${ticker.toLowerCase()}-${filingType.toLowerCase()}.htm`,
          url: '#demo-filing'
        }];
      }

      await this.checkRateLimit('SEC_EDGAR');
      
      // This would need proper CIK lookup implementation
      // For now, return demo data
      return [{
        form: filingType,
        filingDate: '2023-12-31',
        accessionNumber: '0000000000-00-000000',
        reportDate: '2023-12-31',
        acceptanceDateTime: '2024-01-15T16:30:00',
        act: '34',
        primaryDocument: `${ticker.toLowerCase()}-${filingType.toLowerCase()}.htm`,
        url: '#demo-filing'
      }];
    } catch (error) {
      throw new Error(`Failed to fetch SEC filings: ${error.message}`);
    }
  }

  async fetchPeerComparables(ticker, industryCode = null) {
    const cacheKey = this.getCacheKey('peers', { ticker, industryCode });
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      if (this.demoMode) {
        console.warn('Using demo peer data');
        const peerTickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META'].filter(t => t !== ticker);
        const peers = peerTickers.slice(0, 5).map(peerTicker => {
          const basePrice = 100 + Math.random() * 200;
          const marketCap = 1000000000 + Math.random() * 2000000000;
          return {
            symbol: peerTicker,
            name: `${peerTicker} Corporation`,
            marketCap: marketCap,
            currentPrice: basePrice,
            sector: 'Technology',
            industry: 'Software',
            peRatio: 15 + Math.random() * 20,
            evToEbitda: 10 + Math.random() * 15,
            priceToBook: 1 + Math.random() * 4,
            debtToEquity: Math.random() * 2
          };
        });
        this.setCache(cacheKey, peers, 240);
        return peers;
      }

      await this.checkRateLimit('FMP');
      
      // Get company profile first to determine industry
      const profile = await this.fetchCompanyProfile(ticker);
      
      // For demo, use hardcoded peer list
      const peerTickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META'].filter(t => t !== ticker);
      
      // Fetch key metrics for peer analysis
      const peerData = await Promise.allSettled(
        peerTickers.slice(0, 5).map(async (peerTicker) => {
          const peerProfile = await this.fetchCompanyProfile(peerTicker);
          const peerMarket = await this.fetchMarketData(peerTicker);
          
          return {
            symbol: peerTicker,
            name: peerProfile.companyName,
            marketCap: peerProfile.mktCap,
            currentPrice: peerMarket.currentPrice,
            sector: peerProfile.sector,
            industry: peerProfile.industry,
            peRatio: peerProfile.pe,
            evToEbitda: peerProfile.enterpriseValueOverEBITDA,
            priceToBook: peerProfile.pb,
            debtToEquity: peerProfile.debtToEquity
          };
        })
      );

      const validPeers = peerData
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);

      this.setCache(cacheKey, validPeers, 240); // Cache for 4 hours
      return validPeers;
    } catch (error) {
      throw new Error(`Failed to fetch peer comparables: ${error.message}`);
    }
  }

  async fetchDCFInputs(ticker) {
    try {
      const [profile, incomeStatements, balanceSheets, cashFlows, marketData] = await Promise.all([
        this.fetchCompanyProfile(ticker),
        this.fetchFinancialStatements(ticker, 'income-statement', 'annual', 5),
        this.fetchFinancialStatements(ticker, 'balance-sheet-statement', 'annual', 5),
        this.fetchFinancialStatements(ticker, 'cash-flow-statement', 'annual', 5),
        this.fetchMarketData(ticker)
      ]);

      // Calculate historical growth rates
      const revenues = Array.isArray(incomeStatements) 
        ? incomeStatements.map(stmt => stmt.revenue).reverse()
        : [incomeStatements.revenue];
      const revenueGrowthRates = [];
      for (let i = 1; i < revenues.length; i++) {
        if (revenues[i-1] && revenues[i]) {
          revenueGrowthRates.push((revenues[i] - revenues[i-1]) / revenues[i-1]);
        }
      }
      const avgRevenueGrowth = revenueGrowthRates.length > 0 
        ? revenueGrowthRates.reduce((a, b) => a + b, 0) / revenueGrowthRates.length 
        : 0.05; // Default 5% growth

      // Calculate free cash flow margin
      const latestCashFlow = Array.isArray(cashFlows) ? cashFlows[0] : cashFlows;
      const latestIncome = Array.isArray(incomeStatements) ? incomeStatements[0] : incomeStatements;
      const fcfMargin = latestCashFlow.freeCashFlow / latestIncome.revenue;

      // Estimate WACC components
      const riskFreeRate = 0.045; // 4.5% - this should come from treasury rates API
      const marketPremium = 0.065; // 6.5% historical market premium
      const beta = profile.beta || 1.0;
      const costOfEquity = riskFreeRate + (beta * marketPremium);
      
      const latestBalance = Array.isArray(balanceSheets) ? balanceSheets[0] : balanceSheets;
      const totalDebt = latestBalance.totalDebt || 0;
      const marketCap = marketData.marketCap || (marketData.currentPrice * profile.sharesOutstanding);
      const debtRatio = totalDebt / (totalDebt + marketCap);
      const taxRate = profile.effectiveTaxRateTTM || 0.21;

      const wacc = (costOfEquity * (1 - debtRatio)) + (0.04 * debtRatio * (1 - taxRate)); // Assuming 4% cost of debt

      return {
        symbol: ticker,
        companyName: profile.companyName,
        currentRevenue: latestIncome.revenue,
        revenueGrowthRate: avgRevenueGrowth,
        fcfMargin: fcfMargin,
        wacc: wacc,
        terminalGrowthRate: 0.025, // 2.5% long-term GDP growth assumption
        currentPrice: marketData.currentPrice,
        sharesOutstanding: profile.sharesOutstanding,
        marketCap: marketCap,
        totalDebt: totalDebt,
        cash: latestBalance.cashAndCashEquivalents || 0,
        beta: beta,
        peRatio: profile.pe,
        historicalData: {
          revenues: revenues,
          revenueGrowthRates: revenueGrowthRates,
          freeCashFlows: Array.isArray(cashFlows) 
            ? cashFlows.map(cf => cf.freeCashFlow).reverse()
            : [latestCashFlow.freeCashFlow],
          margins: Array.isArray(incomeStatements) 
            ? incomeStatements.map(stmt => stmt.grossProfitMargin).reverse()
            : [latestIncome.grossProfitMargin]
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch DCF inputs for ${ticker}: ${error.message}`);
    }
  }

  async fetchLBOInputs(ticker) {
    try {
      const [profile, incomeStatements, balanceSheets, marketData, peers] = await Promise.all([
        this.fetchCompanyProfile(ticker),
        this.fetchFinancialStatements(ticker, 'income-statement', 'annual', 3),
        this.fetchFinancialStatements(ticker, 'balance-sheet-statement', 'annual', 3),
        this.fetchMarketData(ticker),
        this.fetchPeerComparables(ticker)
      ]);

      const latestIncome = Array.isArray(incomeStatements) ? incomeStatements[0] : incomeStatements;
      const latestBalance = Array.isArray(balanceSheets) ? balanceSheets[0] : balanceSheets;
      
      // Calculate key LBO metrics
      const ebitda = latestIncome.ebitda;
      const currentEV = marketData.marketCap + latestBalance.totalDebt - latestBalance.cashAndCashEquivalents;
      const evEbitdaMultiple = currentEV / ebitda;
      
      // Peer multiples for exit assumptions
      const peerEvEbitdaMultiples = peers
        .filter(peer => peer.evToEbitda && peer.evToEbitda > 0)
        .map(peer => peer.evToEbitda);
      const avgPeerMultiple = peerEvEbitdaMultiples.length > 0 
        ? peerEvEbitdaMultiples.reduce((a, b) => a + b, 0) / peerEvEbitdaMultiples.length 
        : evEbitdaMultiple;

      return {
        symbol: ticker,
        companyName: profile.companyName,
        currentPrice: marketData.currentPrice,
        marketCap: marketData.marketCap,
        enterpriseValue: currentEV,
        ebitda: ebitda,
        evEbitdaMultiple: evEbitdaMultiple,
        revenue: latestIncome.revenue,
        netIncome: latestIncome.netIncome,
        totalDebt: latestBalance.totalDebt,
        cash: latestBalance.cashAndCashEquivalents,
        workingCapital: latestBalance.totalCurrentAssets - latestBalance.totalCurrentLiabilities,
        capex: Math.abs(latestIncome.capex || 0),
        debtToEbitda: latestBalance.totalDebt / ebitda,
        interestCoverage: ebitda / (latestIncome.interestExpense || 1),
        avgPeerMultiple: avgPeerMultiple,
        suggestedPurchasePrice: ebitda * avgPeerMultiple,
        maxDebtCapacity: ebitda * 6, // 6x EBITDA debt capacity assumption
        sharesOutstanding: profile.sharesOutstanding
      };
    } catch (error) {
      throw new Error(`Failed to fetch LBO inputs for ${ticker}: ${error.message}`);
    }
  }

  async validateTicker(ticker) {
    try {
      await this.fetchCompanyProfile(ticker);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Add method to check API status
  getApiStatus() {
    return {
      demoMode: this.demoMode,
      cacheSize: this.cache.size,
      availableKeys: {
        alphaVantage: !!(import.meta.env.VITE_ALPHA_VANTAGE_API_KEY && import.meta.env.VITE_ALPHA_VANTAGE_API_KEY !== 'demo'),
        fmp: !!(import.meta.env.VITE_FMP_API_KEY && import.meta.env.VITE_FMP_API_KEY !== 'demo'),
      }
    };
  }
}

// Export singleton instance
export const dataFetchingService = new DataFetchingService();
export default DataFetchingService;