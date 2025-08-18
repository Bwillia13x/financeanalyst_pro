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
 * GET /api/financial-statements/income/:symbol
 * Get income statement for a symbol
 */
router.get('/income/:symbol',
  param('symbol').isAlpha().isLength({ min: 1, max: 5 }).toUpperCase(),
  query('period').optional().isIn(['annual', 'quarter']),
  query('limit').optional().isInt({ min: 1, max: 10 }),
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
        console.log('FMP failed, trying Alpha Vantage...');
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
  param('symbol').isAlpha().isLength({ min: 1, max: 5 }).toUpperCase(),
  query('period').optional().isIn(['annual', 'quarter']),
  query('limit').optional().isInt({ min: 1, max: 10 }),
  validateRequest,
  async(req, res) => {
    try {
      const { symbol } = req.params;
      const { period = 'annual', limit = 5 } = req.query;

      // Try FMP first
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

        return res.json({
          symbol,
          statementType: 'balance',
          period,
          data: processedData,
          timestamp: new Date().toISOString(),
          source: 'fmp'
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
  param('symbol').isAlpha().isLength({ min: 1, max: 5 }).toUpperCase(),
  query('period').optional().isIn(['annual', 'quarter']),
  query('limit').optional().isInt({ min: 1, max: 10 }),
  validateRequest,
  async(req, res) => {
    try {
      const { symbol } = req.params;
      const { period = 'annual', limit = 5 } = req.query;

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

        return res.json({
          symbol,
          statementType: 'cash-flow',
          period,
          data: processedData,
          timestamp: new Date().toISOString(),
          source: 'fmp'
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
  param('symbol').isAlpha().isLength({ min: 1, max: 5 }).toUpperCase(),
  query('period').optional().isIn(['annual', 'quarter']),
  query('limit').optional().isInt({ min: 1, max: 10 }),
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

        return res.json({
          symbol,
          statementType: 'ratios',
          period,
          data: processedData,
          timestamp: new Date().toISOString(),
          source: 'fmp'
        });
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
