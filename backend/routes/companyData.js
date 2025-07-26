import express from 'express';
import { param, query, validationResult } from 'express-validator';
import apiService from '../services/apiService.js';

const router = express.Router();

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * GET /api/company-data/profile/:symbol
 * Get company profile and overview
 */
router.get('/profile/:symbol',
  param('symbol').isAlpha().isLength({ min: 1, max: 5 }).toUpperCase(),
  validateRequest,
  async (req, res) => {
    try {
      const { symbol } = req.params;

      // Try FMP first for comprehensive company data
      try {
        const fmpData = await apiService.makeApiRequest({
          service: 'fmp',
          endpoint: '/profile/' + symbol,
          params: {},
          cacheType: 'company',
          cacheTtl: 86400 // 24 hours cache
        });

        if (Array.isArray(fmpData) && fmpData.length > 0) {
          const profile = fmpData[0];
          
          const response = {
            symbol: profile.symbol,
            companyName: profile.companyName,
            description: profile.description,
            industry: profile.industry,
            sector: profile.sector,
            country: profile.country,
            city: profile.city,
            address: profile.address,
            phone: profile.phone,
            website: profile.website,
            exchange: profile.exchangeShortName,
            currency: profile.currency,
            marketCap: profile.mktCap,
            employees: profile.fullTimeEmployees,
            ceo: profile.ceo,
            founded: profile.ipoDate,
            metrics: {
              beta: profile.beta,
              peRatio: profile.pe,
              priceToBook: profile.pb,
              priceToSales: profile.ps,
              dividendYield: profile.lastDiv,
              debtToEquity: profile.debtToEquity,
              returnOnEquity: profile.roe,
              returnOnAssets: profile.roa,
              grossMargin: profile.grossProfitMargin,
              operatingMargin: profile.operatingProfitMargin,
              netMargin: profile.netProfitMargin
            },
            timestamp: new Date().toISOString(),
            source: 'fmp'
          };

          return res.json(response);
        }
      } catch (fmpError) {
        console.log('FMP failed, trying Alpha Vantage...');
      }

      // Fallback to Alpha Vantage
      const alphaData = await apiService.makeApiRequest({
        service: 'alphaVantage',
        endpoint: 'OVERVIEW',
        params: { symbol },
        cacheType: 'company',
        cacheTtl: 86400
      });

      if (alphaData.Symbol) {
        const response = {
          symbol: alphaData.Symbol,
          companyName: alphaData.Name,
          description: alphaData.Description,
          industry: alphaData.Industry,
          sector: alphaData.Sector,
          country: alphaData.Country,
          exchange: alphaData.Exchange,
          currency: alphaData.Currency,
          marketCap: parseInt(alphaData.MarketCapitalization),
          employees: parseInt(alphaData.FullTimeEmployees),
          metrics: {
            beta: parseFloat(alphaData.Beta),
            peRatio: parseFloat(alphaData.PERatio),
            priceToBook: parseFloat(alphaData.PriceToBookRatio),
            priceToSales: parseFloat(alphaData.PriceToSalesRatioTTM),
            dividendYield: parseFloat(alphaData.DividendYield),
            returnOnEquity: parseFloat(alphaData.ReturnOnEquityTTM),
            returnOnAssets: parseFloat(alphaData.ReturnOnAssetsTTM),
            grossMargin: parseFloat(alphaData.GrossProfitTTM),
            operatingMargin: parseFloat(alphaData.OperatingMarginTTM),
            netMargin: parseFloat(alphaData.ProfitMargin)
          },
          timestamp: new Date().toISOString(),
          source: 'alpha_vantage'
        };

        return res.json(response);
      }

      throw new Error('No company profile data available');

    } catch (error) {
      console.error(`Company profile error for ${req.params.symbol}:`, error);
      res.status(500).json({
        error: 'Failed to fetch company profile',
        message: error.message,
        symbol: req.params.symbol
      });
    }
  }
);

/**
 * GET /api/company-data/peers/:symbol
 * Get peer companies in the same industry
 */
router.get('/peers/:symbol',
  param('symbol').isAlpha().isLength({ min: 1, max: 5 }).toUpperCase(),
  query('limit').optional().isInt({ min: 1, max: 20 }),
  validateRequest,
  async (req, res) => {
    try {
      const { symbol } = req.params;
      const { limit = 10 } = req.query;

      const fmpData = await apiService.makeApiRequest({
        service: 'fmp',
        endpoint: '/stock_peers',
        params: { symbol },
        cacheType: 'company',
        cacheTtl: 86400 // 24 hours cache
      });

      if (Array.isArray(fmpData) && fmpData.length > 0) {
        // Get detailed data for each peer
        const peerSymbols = fmpData[0].peersList.slice(0, parseInt(limit));
        const peerPromises = peerSymbols.map(async (peerSymbol) => {
          try {
            const peerProfile = await apiService.makeApiRequest({
              service: 'fmp',
              endpoint: '/profile/' + peerSymbol,
              params: {},
              cacheType: 'company',
              cacheTtl: 86400
            });

            if (Array.isArray(peerProfile) && peerProfile.length > 0) {
              const profile = peerProfile[0];
              return {
                symbol: profile.symbol,
                companyName: profile.companyName,
                sector: profile.sector,
                industry: profile.industry,
                marketCap: profile.mktCap,
                peRatio: profile.pe,
                priceToBook: profile.pb,
                debtToEquity: profile.debtToEquity,
                returnOnEquity: profile.roe,
                grossMargin: profile.grossProfitMargin
              };
            }
          } catch (error) {
            console.error(`Failed to get peer data for ${peerSymbol}:`, error);
            return null;
          }
        });

        const peerData = (await Promise.all(peerPromises)).filter(peer => peer !== null);

        const response = {
          symbol,
          peers: peerData,
          timestamp: new Date().toISOString(),
          source: 'fmp'
        };

        return res.json(response);
      }

      throw new Error('No peer data available');

    } catch (error) {
      console.error(`Peer data error for ${req.params.symbol}:`, error);
      res.status(500).json({
        error: 'Failed to fetch peer data',
        message: error.message,
        symbol: req.params.symbol
      });
    }
  }
);

/**
 * GET /api/company-data/dcf/:symbol
 * Get discounted cash flow valuation
 */
router.get('/dcf/:symbol',
  param('symbol').isAlpha().isLength({ min: 1, max: 5 }).toUpperCase(),
  validateRequest,
  async (req, res) => {
    try {
      const { symbol } = req.params;

      const fmpData = await apiService.makeApiRequest({
        service: 'fmp',
        endpoint: '/discounted-cash-flow/' + symbol,
        params: {},
        cacheType: 'company',
        cacheTtl: 21600 // 6 hours cache
      });

      if (Array.isArray(fmpData) && fmpData.length > 0) {
        const dcf = fmpData[0];
        
        const response = {
          symbol: dcf.symbol,
          dcfValue: dcf.dcf,
          stockPrice: dcf.Stock_Price,
          date: dcf.date,
          timestamp: new Date().toISOString(),
          source: 'fmp'
        };

        return res.json(response);
      }

      throw new Error('No DCF data available');

    } catch (error) {
      console.error(`DCF error for ${req.params.symbol}:`, error);
      res.status(500).json({
        error: 'Failed to fetch DCF data',
        message: error.message,
        symbol: req.params.symbol
      });
    }
  }
);

/**
 * GET /api/company-data/earnings/:symbol
 * Get earnings data and estimates
 */
router.get('/earnings/:symbol',
  param('symbol').isAlpha().isLength({ min: 1, max: 5 }).toUpperCase(),
  query('limit').optional().isInt({ min: 1, max: 20 }),
  validateRequest,
  async (req, res) => {
    try {
      const { symbol } = req.params;
      const { limit = 8 } = req.query;

      // Try Alpha Vantage for earnings data
      const alphaData = await apiService.makeApiRequest({
        service: 'alphaVantage',
        endpoint: 'EARNINGS',
        params: { symbol },
        cacheType: 'company',
        cacheTtl: 21600 // 6 hours cache
      });

      if (alphaData.quarterlyEarnings || alphaData.annualEarnings) {
        const quarterlyEarnings = alphaData.quarterlyEarnings?.slice(0, parseInt(limit)).map(earning => ({
          fiscalDateEnding: earning.fiscalDateEnding,
          reportedDate: earning.reportedDate,
          reportedEPS: parseFloat(earning.reportedEPS),
          estimatedEPS: parseFloat(earning.estimatedEPS),
          surprise: parseFloat(earning.surprise),
          surprisePercentage: parseFloat(earning.surprisePercentage)
        })) || [];

        const annualEarnings = alphaData.annualEarnings?.slice(0, Math.ceil(parseInt(limit) / 4)).map(earning => ({
          fiscalDateEnding: earning.fiscalDateEnding,
          reportedEPS: parseFloat(earning.reportedEPS)
        })) || [];

        const response = {
          symbol,
          quarterlyEarnings,
          annualEarnings,
          timestamp: new Date().toISOString(),
          source: 'alpha_vantage'
        };

        return res.json(response);
      }

      throw new Error('No earnings data available');

    } catch (error) {
      console.error(`Earnings error for ${req.params.symbol}:`, error);
      res.status(500).json({
        error: 'Failed to fetch earnings data',
        message: error.message,
        symbol: req.params.symbol
      });
    }
  }
);

export default router;
