import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';

import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { sendValidationError, sendAPIError } from '../utils/responseHelpers.js';

const router = express.Router();
const prisma = new PrismaClient();

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendValidationError(res, errors);
  }
  next();
};

/**
 * GET /api/dcf-scenarios
 * Get all DCF scenarios for authenticated user
 */
router.get('/',
  authenticateToken,
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('offset').optional().isInt({ min: 0 }),
  validateRequest,
  async (req, res) => {
    try {
      const { limit = 20, offset = 0 } = req.query;
      const userId = req.user.sub;

      const scenarios = await prisma.dCFScenario.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
        select: {
          id: true,
          name: true,
          symbol: true,
          assumptions: true,
          results: true,
          createdAt: true,
          updatedAt: true
        }
      });

      const total = await prisma.dCFScenario.count({
        where: { userId }
      });

      res.json({
        success: true,
        scenarios,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: offset + limit < total
        }
      });

    } catch (error) {
      console.error('Error fetching DCF scenarios:', error);
      return sendAPIError(res, 'Failed to fetch scenarios', error, 500, 'FETCH_SCENARIOS_ERROR');
    }
  }
);

/**
 * GET /api/dcf-scenarios/:id
 * Get specific DCF scenario
 */
router.get('/:id',
  optionalAuth,
  param('id').isString().notEmpty(),
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.sub;

      const scenario = await prisma.dCFScenario.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });

      if (!scenario) {
        return sendAPIError(res, 'Scenario not found', null, 404, 'SCENARIO_NOT_FOUND');
      }

      // Only allow access if user owns the scenario or in demo mode
      if (scenario.userId !== userId && process.env.DEMO_MODE !== 'true') {
        return sendAPIError(res, 'Access denied', null, 403, 'ACCESS_DENIED');
      }

      res.json({
        success: true,
        scenario
      });

    } catch (error) {
      console.error('Error fetching DCF scenario:', error);
      return sendAPIError(res, 'Failed to fetch scenario', error, 500, 'FETCH_SCENARIO_ERROR');
    }
  }
);

/**
 * POST /api/dcf-scenarios
 * Create new DCF scenario
 */
router.post('/',
  authenticateToken,
  body('name').isString().isLength({ min: 1, max: 100 }),
  body('symbol').matches(/^[A-Z0-9.-]{1,10}$/i).toUpperCase(),
  body('assumptions').isObject(),
  validateRequest,
  async (req, res) => {
    try {
      const { name, symbol, assumptions } = req.body;
      const userId = req.user.sub;

      const scenario = await prisma.dCFScenario.create({
        data: {
          name,
          symbol: symbol.toUpperCase(),
          assumptions,
          userId
        },
        select: {
          id: true,
          name: true,
          symbol: true,
          assumptions: true,
          results: true,
          createdAt: true,
          updatedAt: true
        }
      });

      res.status(201).json({
        success: true,
        scenario
      });

    } catch (error) {
      console.error('Error creating DCF scenario:', error);
      return sendAPIError(res, 'Failed to create scenario', error, 500, 'CREATE_SCENARIO_ERROR');
    }
  }
);

/**
 * PUT /api/dcf-scenarios/:id
 * Update DCF scenario
 */
router.put('/:id',
  authenticateToken,
  param('id').isString().notEmpty(),
  body('name').optional().isString().isLength({ min: 1, max: 100 }),
  body('assumptions').optional().isObject(),
  body('results').optional().isObject(),
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, assumptions, results } = req.body;
      const userId = req.user.sub;

      // Check if scenario exists and user owns it
      const existingScenario = await prisma.dCFScenario.findUnique({
        where: { id }
      });

      if (!existingScenario) {
        return sendAPIError(res, 'Scenario not found', null, 404, 'SCENARIO_NOT_FOUND');
      }

      if (existingScenario.userId !== userId) {
        return sendAPIError(res, 'Access denied', null, 403, 'ACCESS_DENIED');
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (assumptions !== undefined) updateData.assumptions = assumptions;
      if (results !== undefined) updateData.results = results;

      const scenario = await prisma.dCFScenario.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          symbol: true,
          assumptions: true,
          results: true,
          createdAt: true,
          updatedAt: true
        }
      });

      res.json({
        success: true,
        scenario
      });

    } catch (error) {
      console.error('Error updating DCF scenario:', error);
      return sendAPIError(res, 'Failed to update scenario', error, 500, 'UPDATE_SCENARIO_ERROR');
    }
  }
);

/**
 * DELETE /api/dcf-scenarios/:id
 * Delete DCF scenario
 */
router.delete('/:id',
  authenticateToken,
  param('id').isString().notEmpty(),
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.sub;

      // Check if scenario exists and user owns it
      const existingScenario = await prisma.dCFScenario.findUnique({
        where: { id }
      });

      if (!existingScenario) {
        return sendAPIError(res, 'Scenario not found', null, 404, 'SCENARIO_NOT_FOUND');
      }

      if (existingScenario.userId !== userId) {
        return sendAPIError(res, 'Access denied', null, 403, 'ACCESS_DENIED');
      }

      await prisma.dCFScenario.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Scenario deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting DCF scenario:', error);
      return sendAPIError(res, 'Failed to delete scenario', error, 500, 'DELETE_SCENARIO_ERROR');
    }
  }
);

/**
 * POST /api/dcf-scenarios/:id/compute
 * Compute DCF valuation based on assumptions
 */
router.post('/:id/compute',
  optionalAuth,
  param('id').isString().notEmpty(),
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.sub;

      const scenario = await prisma.dCFScenario.findUnique({
        where: { id }
      });

      if (!scenario) {
        return sendAPIError(res, 'Scenario not found', null, 404, 'SCENARIO_NOT_FOUND');
      }

      // Check access
      if (scenario.userId !== userId && process.env.DEMO_MODE !== 'true') {
        return sendAPIError(res, 'Access denied', null, 403, 'ACCESS_DENIED');
      }

      const assumptions = scenario.assumptions;
      
      // Basic DCF calculation
      const results = computeDCF(assumptions);

      // Update scenario with results if user owns it
      if (userId === scenario.userId) {
        await prisma.dCFScenario.update({
          where: { id },
          data: { results }
        });
      }

      res.json({
        success: true,
        results
      });

    } catch (error) {
      console.error('Error computing DCF:', error);
      return sendAPIError(res, 'Failed to compute DCF', error, 500, 'COMPUTE_DCF_ERROR');
    }
  }
);

/**
 * Basic DCF computation function
 */
function computeDCF(assumptions) {
  const {
    currentRevenue = 100000000,
    revenueGrowthRate = 0.05,
    terminalGrowthRate = 0.03,
    discountRate = 0.10,
    projectionYears = 5,
    netIncomeMargin = 0.15,
    capexAsPercentRevenue = 0.03,
    deprecationAsPercentRevenue = 0.02,
    workingCapitalAsPercentRevenue = 0.05,
    sharesOutstanding = 100000000,
    cashAndEquivalents = 10000000,
    totalDebt = 50000000
  } = assumptions;

  // Project cash flows
  const projectedCashFlows = [];
  let revenue = currentRevenue;

  for (let year = 1; year <= projectionYears; year++) {
    revenue *= (1 + revenueGrowthRate);
    const netIncome = revenue * netIncomeMargin;
    const capex = revenue * capexAsPercentRevenue;
    const depreciation = revenue * deprecationAsPercentRevenue;
    const workingCapitalChange = revenue * workingCapitalAsPercentRevenue * revenueGrowthRate;
    
    const freeCashFlow = netIncome + depreciation - capex - workingCapitalChange;
    
    projectedCashFlows.push({
      year,
      revenue,
      netIncome,
      freeCashFlow,
      presentValue: freeCashFlow / Math.pow(1 + discountRate, year)
    });
  }

  // Terminal value
  const finalYearFCF = projectedCashFlows[projectedCashFlows.length - 1].freeCashFlow;
  const terminalValue = (finalYearFCF * (1 + terminalGrowthRate)) / (discountRate - terminalGrowthRate);
  const terminalValuePV = terminalValue / Math.pow(1 + discountRate, projectionYears);

  // Sum present values
  const sumPVCashFlows = projectedCashFlows.reduce((sum, cf) => sum + cf.presentValue, 0);
  const enterpriseValue = sumPVCashFlows + terminalValuePV;
  const equityValue = enterpriseValue + cashAndEquivalents - totalDebt;
  const valuePerShare = equityValue / sharesOutstanding;

  return {
    projectedCashFlows,
    terminalValue,
    terminalValuePV,
    sumPVCashFlows,
    enterpriseValue,
    equityValue,
    valuePerShare,
    assumptions,
    computedAt: new Date().toISOString()
  };
}

export default router;
