import express from 'express';
import rateLimit from 'express-rate-limit';
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

// Route-level rate limiter for financial statements
const statementsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_STATEMENTS || '30'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many financial statements requests. Please slow down.' }
});

/**
 * GET /api/financial-statements/income/:symbol
 * Get income statement for a symbol
 */
router.get('/income/:symbol',
  param('symbol').matches(/^[A-Za-z0-9.-]{1,12}$/).toUpperCase(),
  query('period').optional().isIn(['annual', 'quarter']),
  query('limit').optional().isInt({ min: 1, max: 10 }),
  statementsLimiter,
  validateRequest,
  async(req, res) => {
    try {
      const { symbol } = req.params;
      const { period = 'annual', limit = 5 } = req.query;

      // Try FMP first for comprehensive financial data
      try {
        const fmpData = await apiService.makeApiRequest({
          service: 'fmp',
          endpoint: '/income-statement/' + symbol,
          params: { period, limit },
          cacheType: 'financial',
          cacheTtl: 21600 // 6 hours cache
        });

        if (Array.isArray(fmpData) && fmpData.length > 0) {
          const processedData = fmpData.map(statement => ({
            symbol: statement.symbol,
            date: statement.date,
            period: statement.period,
            revenue: statement.revenue,
            costOfRevenue: statement.costOfRevenue,
            grossProfit: statement.grossProfit,
            grossProfitRatio: statement.grossProfitRatio,
            operatingExpenses: statement.operatingExpenses,
            operatingIncome: statement.operatingIncome,
            operatingIncomeRatio: statement.operatingIncomeRatio,
            totalOtherIncomeExpensesNet: statement.totalOtherIncomeExpensesNet,
            incomeBeforeTax: statement.incomeBeforeTax,
            incomeTaxExpense: statement.incomeTaxExpense,
            netIncome: statement.netIncome,
            netIncomeRatio: statement.netIncomeRatio,
            eps: statement.eps,
            epsdiluted: statement.epsdiluted,
            weightedAverageShsOut: statement.weightedAverageShsOut,
            weightedAverageShsOutDil: statement.weightedAverageShsOutDil
          }));

          res.set('Cache-Control', 'public, max-age=21600, stale-while-revalidate=60');
          return res.json({
            symbol,
            statementType: 'income',
            period,
            data: processedData,
            timestamp: new Date().toISOString(),
            source: 'fmp'
          });
        }
      } catch (fmpError) {
        console.warn('FMP failed, trying Alpha Vantage...', fmpError?.message);
      }

      // Fallback to Alpha Vantage
      const alphaData = await apiService.makeApiRequest({
        service: 'alphaVantage',
        endpoint: 'INCOME_STATEMENT',
        params: { symbol },
        cacheType: 'financial',
        cacheTtl: 21600
      });

      if (alphaData.annualReports || alphaData.quarterlyReports) {
        const reports = period === 'annual' ? alphaData.annualReports : alphaData.quarterlyReports;
        const processedData = reports.slice(0, parseInt(limit)).map(report => ({
          symbol: alphaData.symbol,
          date: report.fiscalDateEnding,
          period: period === 'annual' ? 'FY' : 'Q',
          revenue: parseFloat(report.totalRevenue) || 0,
          costOfRevenue: parseFloat(report.costOfRevenue) || 0,
          grossProfit: parseFloat(report.grossProfit) || 0,
          operatingIncome: parseFloat(report.operatingIncome) || 0,
          incomeBeforeTax: parseFloat(report.incomeBeforeTax) || 0,
          incomeTaxExpense: parseFloat(report.incomeTaxExpense) || 0,
          netIncome: parseFloat(report.netIncome) || 0
        }));

        res.set('Cache-Control', 'public, max-age=21600, stale-while-revalidate=60');
        return res.json({
          symbol,
          statementType: 'income',
          period,
          data: processedData,
          timestamp: new Date().toISOString(),
          source: 'alpha_vantage'
        });
      }

      throw new Error('No income statement data available');

    } catch (error) {
      console.error(`Income statement error for ${req.params.symbol}:`, error);
      res.status(500).json({
        error: 'Failed to fetch income statement',
        message: error.message,
        symbol: req.params.symbol
      });
    }
  }
);

/**
 * GET /api/financial-statements/balance/:symbol
 * Get balance sheet for a symbol
 */
router.get('/balance/:symbol',
  param('symbol').matches(/^[A-Za-z0-9.-]{1,12}$/).toUpperCase(),
  query('period').optional().isIn(['annual', 'quarter']),
  query('limit').optional().isInt({ min: 1, max: 10 }),
  statementsLimiter,
  validateRequest,
  async(req, res) => {
    try {
      const { symbol } = req.params;
      const { period = 'annual', limit = 5 } = req.query;

      // Try FMP first
      try {
        const fmpData = await apiService.makeApiRequest({
          service: 'fmp',
          endpoint: '/balance-sheet-statement/' + symbol,
          params: { period, limit },
          cacheType: 'financial',
          cacheTtl: 21600
        });

        if (Array.isArray(fmpData) && fmpData.length > 0) {
          const processedData = fmpData.map(statement => ({
            symbol: statement.symbol,
            date: statement.date,
            period: statement.period,
            totalAssets: statement.totalAssets,
            totalCurrentAssets: statement.totalCurrentAssets,
            cashAndCashEquivalents: statement.cashAndCashEquivalents,
            inventory: statement.inventory,
            totalNonCurrentAssets: statement.totalNonCurrentAssets,
            propertyPlantEquipmentNet: statement.propertyPlantEquipmentNet,
            totalLiabilities: statement.totalLiabilities,
            totalCurrentLiabilities: statement.totalCurrentLiabilities,
            totalNonCurrentLiabilities: statement.totalNonCurrentLiabilities,
            totalDebt: statement.totalDebt,
            totalEquity: statement.totalStockholdersEquity,
            retainedEarnings: statement.retainedEarnings,
            commonStock: statement.commonStock
          }));

          res.set('Cache-Control', 'public, max-age=21600, stale-while-revalidate=60');
          return res.json({
            symbol,
            statementType: 'balance',
            period,
            data: processedData,
            timestamp: new Date().toISOString(),
            source: 'fmp'
          });
        }
      } catch (fmpError) {
        console.warn('FMP failed, trying Alpha Vantage...', fmpError?.message);
      }

      // Fallback to Alpha Vantage
      const alphaData = await apiService.makeApiRequest({
        service: 'alphaVantage',
        endpoint: 'BALANCE_SHEET',
        params: { symbol },
        cacheType: 'financial',
        cacheTtl: 21600
      });

      if (alphaData.annualReports || alphaData.quarterlyReports) {
        const reports = period === 'annual' ? alphaData.annualReports : alphaData.quarterlyReports;
        const processedData = reports.slice(0, parseInt(limit)).map(report => ({
          symbol: alphaData.symbol,
          date: report.fiscalDateEnding,
          period: period === 'annual' ? 'FY' : 'Q',
          totalAssets: parseFloat(report.totalAssets) || 0,
          totalCurrentAssets: parseFloat(report.totalCurrentAssets) || 0,
          cashAndCashEquivalents: parseFloat(report.cashAndCashEquivalentsAtCarryingValue || report.cashAndCashEquivalents) || 0,
          inventory: parseFloat(report.inventory) || 0,
          totalNonCurrentAssets: parseFloat(report.totalNonCurrentAssets) || 0,
          propertyPlantEquipmentNet: parseFloat(report.propertyPlantEquipment) || 0,
          totalLiabilities: parseFloat(report.totalLiabilities) || 0,
          totalCurrentLiabilities: parseFloat(report.totalCurrentLiabilities) || 0,
          totalNonCurrentLiabilities: parseFloat(report.totalNonCurrentLiabilities) || 0,
          totalDebt: (parseFloat(report.shortTermDebt) || 0) + (parseFloat(report.longTermDebtNoncurrent) || 0),
          totalEquity: parseFloat(report.totalShareholderEquity) || 0,
          retainedEarnings: parseFloat(report.retainedEarnings) || 0,
          commonStock: parseFloat(report.commonStock) || 0
        }));

        res.set('Cache-Control', 'public, max-age=21600, stale-while-revalidate=60');
        return res.json({
          symbol,
          statementType: 'balance',
          period,
          data: processedData,
          timestamp: new Date().toISOString(),
          source: 'alpha_vantage'
        });
      }

      throw new Error('No balance sheet data available');

    } catch (error) {
      console.error(`Balance sheet error for ${req.params.symbol}:`, error);
      res.status(500).json({
        error: 'Failed to fetch balance sheet',
        message: error.message,
        symbol: req.params.symbol
      });
    }
  }
);

/**
 * GET /api/financial-statements/cash-flow/:symbol
 * Get cash flow statement for a symbol
 */
router.get('/cash-flow/:symbol',
  param('symbol').matches(/^[A-Za-z0-9.-]{1,12}$/).toUpperCase(),
  query('period').optional().isIn(['annual', 'quarter']),
  query('limit').optional().isInt({ min: 1, max: 10 }),
  statementsLimiter,
  validateRequest,
  async(req, res) => {
    try {
      const { symbol } = req.params;
      const { period = 'annual', limit = 5 } = req.query;

      // Try FMP first
      try {
        const fmpData = await apiService.makeApiRequest({
          service: 'fmp',
          endpoint: '/cash-flow-statement/' + symbol,
          params: { period, limit },
          cacheType: 'financial',
          cacheTtl: 21600
        });

        if (Array.isArray(fmpData) && fmpData.length > 0) {
          const processedData = fmpData.map(statement => ({
            symbol: statement.symbol,
            date: statement.date,
            period: statement.period,
            operatingCashFlow: statement.operatingCashFlow,
            netIncome: statement.netIncome,
            depreciationAndAmortization: statement.depreciationAndAmortization,
            deferredIncomeTax: statement.deferredIncomeTax,
            stockBasedCompensation: statement.stockBasedCompensation,
            changeInWorkingCapital: statement.changeInWorkingCapital,
            investingCashFlow: statement.netCashUsedForInvestingActivites,
            capitalExpenditure: statement.capitalExpenditure,
            acquisitionsNet: statement.acquisitionsNet,
            financingCashFlow: statement.netCashUsedProvidedByFinancingActivities,
            debtRepayment: statement.debtRepayment,
            commonStockIssued: statement.commonStockIssued,
            commonStockRepurchased: statement.commonStockRepurchased,
            dividendsPaid: statement.dividendsPaid,
            freeCashFlow: statement.freeCashFlow
          }));

          res.set('Cache-Control', 'public, max-age=21600, stale-while-revalidate=60');
          return res.json({
            symbol,
            statementType: 'cash-flow',
            period,
            data: processedData,
            timestamp: new Date().toISOString(),
            source: 'fmp'
          });
        }
      } catch (fmpError) {
        console.warn('FMP failed, trying Alpha Vantage...', fmpError?.message);
      }

      // Fallback to Alpha Vantage
      const alphaData = await apiService.makeApiRequest({
        service: 'alphaVantage',
        endpoint: 'CASH_FLOW',
        params: { symbol },
        cacheType: 'financial',
        cacheTtl: 21600
      });

      if (alphaData.annualReports || alphaData.quarterlyReports) {
        const reports = period === 'annual' ? alphaData.annualReports : alphaData.quarterlyReports;
        const processedData = reports.slice(0, parseInt(limit)).map(report => ({
          symbol: alphaData.symbol,
          date: report.fiscalDateEnding,
          period: period === 'annual' ? 'FY' : 'Q',
          operatingCashFlow: parseFloat(report.operatingCashflow) || 0,
          netIncome: parseFloat(report.netIncome) || 0,
          depreciationAndAmortization: parseFloat(report.depreciationAndAmortization || report.depreciation) || 0,
          deferredIncomeTax: parseFloat(report.deferredIncomeTax) || 0,
          stockBasedCompensation: parseFloat(report.stockBasedCompensation) || 0,
          changeInWorkingCapital: parseFloat(report.changeInWorkingCapital) || 0,
          investingCashFlow: parseFloat(report.cashflowFromInvestment) || 0,
          capitalExpenditure: parseFloat(report.capitalExpenditures) || 0,
          acquisitionsNet: parseFloat(report.acquisitionsNet) || 0,
          financingCashFlow: parseFloat(report.cashflowFromFinancing) || 0,
          debtRepayment: parseFloat(report.debtRepayment) || 0,
          commonStockIssued: parseFloat(report.commonStockIssued) || 0,
          commonStockRepurchased: parseFloat(report.commonStockRepurchased) || 0,
          dividendsPaid: parseFloat(report.dividendPayout) || 0,
          freeCashFlow: (parseFloat(report.operatingCashflow) || 0) - (parseFloat(report.capitalExpenditures) || 0)
        }));

        res.set('Cache-Control', 'public, max-age=21600, stale-while-revalidate=60');
        return res.json({
          symbol,
          statementType: 'cash-flow',
          period,
          data: processedData,
          timestamp: new Date().toISOString(),
          source: 'alpha_vantage'
        });
      }

      throw new Error('No cash flow data available');

    } catch (error) {
      console.error(`Cash flow statement error for ${req.params.symbol}:`, error);
      res.status(500).json({
        error: 'Failed to fetch cash flow statement',
        message: error.message,
        symbol: req.params.symbol
      });
    }
  }
);

/**
 * GET /api/financial-statements/ratios/:symbol
 * Get financial ratios for a symbol
 */
router.get('/ratios/:symbol',
  param('symbol').matches(/^[A-Za-z0-9.-]{1,12}$/).toUpperCase(),
  query('period').optional().isIn(['annual', 'quarter']),
  query('limit').optional().isInt({ min: 1, max: 10 }),
  statementsLimiter,
  validateRequest,
  async(req, res) => {
    try {
      const { symbol } = req.params;
      const { period = 'annual', limit = 5 } = req.query;

      const fmpData = await apiService.makeApiRequest({
        service: 'fmp',
        endpoint: '/ratios/' + symbol,
        params: { period, limit },
        cacheType: 'financial',
        cacheTtl: 21600
      });

      if (Array.isArray(fmpData) && fmpData.length > 0) {
        const processedData = fmpData.map(ratios => ({
          symbol: ratios.symbol,
          date: ratios.date,
          period: ratios.period,
          // Liquidity ratios
          currentRatio: ratios.currentRatio,
          quickRatio: ratios.quickRatio,
          cashRatio: ratios.cashRatio,
          // Leverage ratios
          debtToEquityRatio: ratios.debtEquityRatio,
          debtToAssetsRatio: ratios.debtRatio,
          interestCoverageRatio: ratios.interestCoverage,
          // Profitability ratios
          returnOnAssets: ratios.returnOnAssets,
          returnOnEquity: ratios.returnOnEquity,
          returnOnCapitalEmployed: ratios.returnOnCapitalEmployed,
          grossProfitMargin: ratios.grossProfitMargin,
          operatingProfitMargin: ratios.operatingProfitMargin,
          netProfitMargin: ratios.netProfitMargin,
          // Efficiency ratios
          assetTurnover: ratios.assetTurnover,
          inventoryTurnover: ratios.inventoryTurnover,
          receivablesTurnover: ratios.receivablesTurnover,
          // Market ratios
          priceToEarnings: ratios.priceEarningsRatio,
          priceToBook: ratios.priceToBookRatio,
          priceToSales: ratios.priceToSalesRatio,
          priceToFreeCashFlow: ratios.priceToFreeCashFlowsRatio,
          enterpriseValueToEbitda: ratios.enterpriseValueOverEBITDA
        }));

        res.set('Cache-Control', 'public, max-age=21600, stale-while-revalidate=60');
        return res.json({
          symbol,
          statementType: 'ratios',
          period,
          data: processedData,
          timestamp: new Date().toISOString(),
          source: 'fmp'
        });
      }

      // Fallback to Alpha Vantage OVERVIEW for limited ratios snapshot
      try {
        const alphaOverview = await apiService.makeApiRequest({
          service: 'alphaVantage',
          endpoint: 'OVERVIEW',
          params: { symbol },
          cacheType: 'financial',
          cacheTtl: 21600
        });

        if (alphaOverview.Symbol) {
          const snapshot = {
            symbol: alphaOverview.Symbol,
            date: new Date().toISOString().slice(0, 10),
            period: period === 'annual' ? 'FY' : 'Q',
            // Map available overview fields
            currentRatio: null,
            quickRatio: null,
            cashRatio: null,
            debtToEquityRatio: alphaOverview.DEBTToEquityTTM ? parseFloat(alphaOverview.DEBTToEquityTTM) : null,
            debtToAssetsRatio: null,
            interestCoverageRatio: null,
            returnOnAssets: alphaOverview.ReturnOnAssetsTTM != null ? parseFloat(alphaOverview.ReturnOnAssetsTTM) : null,
            returnOnEquity: alphaOverview.ReturnOnEquityTTM != null ? parseFloat(alphaOverview.ReturnOnEquityTTM) : null,
            returnOnCapitalEmployed: null,
            grossProfitMargin: alphaOverview.GrossProfitMarginTTM != null ? parseFloat(alphaOverview.GrossProfitMarginTTM) : null,
            operatingProfitMargin: alphaOverview.OperatingMarginTTM != null ? parseFloat(alphaOverview.OperatingMarginTTM) : null,
            netProfitMargin: alphaOverview.ProfitMargin != null ? parseFloat(alphaOverview.ProfitMargin) : null,
            assetTurnover: null,
            inventoryTurnover: null,
            receivablesTurnover: null,
            priceToEarnings: alphaOverview.PERatio != null ? parseFloat(alphaOverview.PERatio) : null,
            priceToBook: alphaOverview.PriceToBookRatio != null ? parseFloat(alphaOverview.PriceToBookRatio) : null,
            priceToSales: alphaOverview.PriceToSalesRatioTTM != null ? parseFloat(alphaOverview.PriceToSalesRatioTTM) : null,
            priceToFreeCashFlow: null,
            enterpriseValueToEbitda: alphaOverview.EVToEBITDA != null ? parseFloat(alphaOverview.EVToEBITDA) : null
          };

          res.set('Cache-Control', 'public, max-age=21600, stale-while-revalidate=60');
          return res.json({
            symbol,
            statementType: 'ratios',
            period,
            data: [snapshot],
            timestamp: new Date().toISOString(),
            source: 'alpha_vantage'
          });
        }
      } catch (alphaError) {
        console.warn('Alpha Vantage OVERVIEW fallback failed for ratios:', alphaError?.message);
      }

      throw new Error('No financial ratios data available');

    } catch (error) {
      console.error(`Financial ratios error for ${req.params.symbol}:`, error);
      res.status(500).json({
        error: 'Failed to fetch financial ratios',
        message: error.message,
        symbol: req.params.symbol
      });
    }
  }
);

export default router;
