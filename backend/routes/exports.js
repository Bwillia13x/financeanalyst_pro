import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import puppeteer from 'puppeteer';
import createCsvWriter from 'csv-writer';
import path from 'path';
import fs from 'fs/promises';

import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { sendValidationError, sendAPIError } from '../utils/responseHelpers.js';
import apiService from '../services/apiService.js';

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
 * POST /api/exports/dcf-pdf
 * Export DCF scenario to PDF
 */
router.post('/dcf-pdf',
  authenticateToken,
  body('scenarioId').isString().notEmpty(),
  body('includeCharts').optional().isBoolean(),
  validateRequest,
  async (req, res) => {
    try {
      const { scenarioId, includeCharts = true } = req.body;
      const userId = req.user.sub;

      // Get DCF scenario
      const scenario = await prisma.dCFScenario.findUnique({
        where: { id: scenarioId },
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      });

      if (!scenario) {
        return sendAPIError(res, 'Scenario not found', null, 404, 'SCENARIO_NOT_FOUND');
      }

      if (scenario.userId !== userId) {
        return sendAPIError(res, 'Access denied', null, 403, 'ACCESS_DENIED');
      }

      // Generate PDF
      const pdfBuffer = await generateDCFPDF(scenario, { includeCharts });
      
      // Save export record
      const exportRecord = await prisma.export.create({
        data: {
          userId,
          type: 'pdf',
          filename: `dcf_${scenario.symbol}_${Date.now()}.pdf`,
          content: {
            scenarioId,
            scenarioName: scenario.name,
            symbol: scenario.symbol,
            generatedAt: new Date().toISOString()
          }
        }
      });

      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${exportRecord.filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);

    } catch (error) {
      console.error('PDF export error:', error);
      return sendAPIError(res, 'Failed to generate PDF export', error, 500, 'PDF_EXPORT_ERROR');
    }
  }
);

/**
 * POST /api/exports/dcf-csv
 * Export DCF scenario to CSV
 */
router.post('/dcf-csv',
  authenticateToken,
  body('scenarioId').isString().notEmpty(),
  validateRequest,
  async (req, res) => {
    try {
      const { scenarioId } = req.body;
      const userId = req.user.sub;

      // Get DCF scenario
      const scenario = await prisma.dCFScenario.findUnique({
        where: { id: scenarioId }
      });

      if (!scenario) {
        return sendAPIError(res, 'Scenario not found', null, 404, 'SCENARIO_NOT_FOUND');
      }

      if (scenario.userId !== userId) {
        return sendAPIError(res, 'Access denied', null, 403, 'ACCESS_DENIED');
      }

      // Generate CSV
      const csvContent = await generateDCFCSV(scenario);
      
      // Save export record
      const exportRecord = await prisma.export.create({
        data: {
          userId,
          type: 'csv',
          filename: `dcf_${scenario.symbol}_${Date.now()}.csv`,
          content: {
            scenarioId,
            scenarioName: scenario.name,
            symbol: scenario.symbol,
            generatedAt: new Date().toISOString()
          }
        }
      });

      // Set response headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${exportRecord.filename}"`);

      res.send(csvContent);

    } catch (error) {
      console.error('CSV export error:', error);
      return sendAPIError(res, 'Failed to generate CSV export', error, 500, 'CSV_EXPORT_ERROR');
    }
  }
);

/**
 * POST /api/exports/company-snapshot-pdf
 * Export company snapshot to PDF
 */
router.post('/company-snapshot-pdf',
  optionalAuth,
  body('symbol').matches(/^[A-Z0-9.-]{1,10}$/i).toUpperCase(),
  body('includeFinancials').optional().isBoolean(),
  validateRequest,
  async (req, res) => {
    try {
      const { symbol, includeFinancials = true } = req.body;
      const userId = req.user?.sub;

      // Get company data
      const companyData = await gatherCompanyData(symbol.toUpperCase(), { includeFinancials });

      // Generate PDF
      const pdfBuffer = await generateCompanySnapshotPDF(companyData);
      
      // Save export record if user is authenticated
      if (userId) {
        await prisma.export.create({
          data: {
            userId,
            type: 'pdf',
            filename: `company_${symbol}_${Date.now()}.pdf`,
            content: {
              symbol,
              includeFinancials,
              generatedAt: new Date().toISOString()
            }
          }
        });
      }

      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="company_${symbol}_${Date.now()}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);

    } catch (error) {
      console.error('Company snapshot PDF export error:', error);
      return sendAPIError(res, 'Failed to generate company snapshot PDF', error, 500, 'COMPANY_PDF_EXPORT_ERROR');
    }
  }
);

/**
 * GET /api/exports/history
 * Get user's export history
 */
router.get('/history',
  authenticateToken,
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('offset').optional().isInt({ min: 0 }),
  validateRequest,
  async (req, res) => {
    try {
      const { limit = 20, offset = 0 } = req.query;
      const userId = req.user.sub;

      const exports = await prisma.export.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
        select: {
          id: true,
          type: true,
          filename: true,
          content: true,
          createdAt: true
        }
      });

      const total = await prisma.export.count({
        where: { userId }
      });

      res.json({
        success: true,
        exports,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: offset + limit < total
        }
      });

    } catch (error) {
      console.error('Export history error:', error);
      return sendAPIError(res, 'Failed to fetch export history', error, 500, 'EXPORT_HISTORY_ERROR');
    }
  }
);

/**
 * Helper function to generate DCF PDF
 */
async function generateDCFPDF(scenario, options = {}) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>DCF Analysis - ${scenario.symbol}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .section { margin: 30px 0; }
            .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: right; }
            .table th { background-color: #f2f2f2; }
            .assumptions { background-color: #f8f9fa; padding: 15px; border-radius: 5px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>DCF Valuation Analysis</h1>
            <h2>${scenario.symbol} - ${scenario.name}</h2>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>

        <div class="section">
            <h3>Key Assumptions</h3>
            <div class="assumptions">
                ${Object.entries(scenario.assumptions).map(([key, value]) => 
                  `<p><strong>${key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</strong> ${value}</p>`
                ).join('')}
            </div>
        </div>

        ${scenario.results ? `
        <div class="section">
            <h3>Projected Cash Flows</h3>
            <table class="table">
                <thead>
                    <tr>
                        <th>Year</th>
                        <th>Revenue</th>
                        <th>Net Income</th>
                        <th>Free Cash Flow</th>
                        <th>Present Value</th>
                    </tr>
                </thead>
                <tbody>
                    ${scenario.results.projectedCashFlows?.map(cf => `
                    <tr>
                        <td>${cf.year}</td>
                        <td>$${(cf.revenue || 0).toLocaleString()}</td>
                        <td>$${(cf.netIncome || 0).toLocaleString()}</td>
                        <td>$${(cf.freeCashFlow || 0).toLocaleString()}</td>
                        <td>$${(cf.presentValue || 0).toLocaleString()}</td>
                    </tr>
                    `).join('') || ''}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h3>Valuation Summary</h3>
            <table class="table">
                <tr><td><strong>Enterprise Value</strong></td><td>$${(scenario.results.enterpriseValue || 0).toLocaleString()}</td></tr>
                <tr><td><strong>Equity Value</strong></td><td>$${(scenario.results.equityValue || 0).toLocaleString()}</td></tr>
                <tr><td><strong>Value per Share</strong></td><td>$${(scenario.results.valuePerShare || 0).toFixed(2)}</td></tr>
                <tr><td><strong>Terminal Value (PV)</strong></td><td>$${(scenario.results.terminalValuePV || 0).toLocaleString()}</td></tr>
            </table>
        </div>
        ` : ''}

        <div class="section" style="font-size: 12px; color: #666; text-align: center; margin-top: 50px;">
            <p>This analysis is for informational purposes only and should not be considered as investment advice.</p>
        </div>
    </body>
    </html>
    `;

    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

/**
 * Helper function to generate DCF CSV
 */
async function generateDCFCSV(scenario) {
  const csvData = [];
  
  // Add scenario metadata
  csvData.push(['DCF Analysis', scenario.symbol]);
  csvData.push(['Scenario Name', scenario.name]);
  csvData.push(['Generated', new Date().toISOString()]);
  csvData.push([]);

  // Add assumptions
  csvData.push(['Assumptions']);
  Object.entries(scenario.assumptions).forEach(([key, value]) => {
    csvData.push([key.replace(/([A-Z])/g, ' $1'), value]);
  });
  csvData.push([]);

  // Add results if available
  if (scenario.results?.projectedCashFlows) {
    csvData.push(['Projected Cash Flows']);
    csvData.push(['Year', 'Revenue', 'Net Income', 'Free Cash Flow', 'Present Value']);
    
    scenario.results.projectedCashFlows.forEach(cf => {
      csvData.push([
        cf.year,
        cf.revenue || 0,
        cf.netIncome || 0,
        cf.freeCashFlow || 0,
        cf.presentValue || 0
      ]);
    });
    csvData.push([]);

    csvData.push(['Valuation Summary']);
    csvData.push(['Enterprise Value', scenario.results.enterpriseValue || 0]);
    csvData.push(['Equity Value', scenario.results.equityValue || 0]);
    csvData.push(['Value per Share', scenario.results.valuePerShare || 0]);
    csvData.push(['Terminal Value (PV)', scenario.results.terminalValuePV || 0]);
  }

  return csvData.map(row => row.join(',')).join('\n');
}

/**
 * Helper function to gather company data
 */
async function gatherCompanyData(symbol, options = {}) {
  try {
    const [profile, quote, financials] = await Promise.allSettled([
      apiService.makeApiRequest({
        service: 'fmp',
        endpoint: `/profile/${symbol}`,
        cacheType: 'company',
        cacheTtl: 3600
      }),
      apiService.makeApiRequest({
        service: 'yahoo',
        endpoint: symbol,
        params: { range: '1d', interval: '1m' },
        cacheType: 'market',
        cacheTtl: 300
      }),
      options.includeFinancials ? apiService.makeApiRequest({
        service: 'fmp',
        endpoint: `/income-statement/${symbol}`,
        params: { limit: 4 },
        cacheType: 'company',
        cacheTtl: 3600
      }) : Promise.resolve(null)
    ]);

    return {
      symbol,
      profile: profile.status === 'fulfilled' ? profile.value : null,
      quote: quote.status === 'fulfilled' ? quote.value : null,
      financials: financials.status === 'fulfilled' ? financials.value : null,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error gathering company data:', error);
    return { symbol, error: error.message };
  }
}

/**
 * Helper function to generate company snapshot PDF
 */
async function generateCompanySnapshotPDF(companyData) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    const profile = companyData.profile?.[0];
    const quote = companyData.quote?.chart?.result?.[0]?.meta;
    
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Company Snapshot - ${companyData.symbol}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .section { margin: 30px 0; }
            .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .table th, .table td { border: 1px solid #ddd; padding: 8px; }
            .table th { background-color: #f2f2f2; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Company Snapshot</h1>
            <h2>${companyData.symbol}</h2>
            <p>${profile?.companyName || 'N/A'}</p>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>

        <div class="section">
            <h3>Company Profile</h3>
            <table class="table">
                <tr><td><strong>Company Name</strong></td><td>${profile?.companyName || 'N/A'}</td></tr>
                <tr><td><strong>Industry</strong></td><td>${profile?.industry || 'N/A'}</td></tr>
                <tr><td><strong>Sector</strong></td><td>${profile?.sector || 'N/A'}</td></tr>
                <tr><td><strong>Market Cap</strong></td><td>${profile?.mktCap ? '$' + profile.mktCap.toLocaleString() : 'N/A'}</td></tr>
                <tr><td><strong>Employees</strong></td><td>${profile?.fullTimeEmployees?.toLocaleString() || 'N/A'}</td></tr>
            </table>
        </div>

        ${quote ? `
        <div class="section">
            <h3>Current Market Data</h3>
            <table class="table">
                <tr><td><strong>Current Price</strong></td><td>$${quote.regularMarketPrice || 'N/A'}</td></tr>
                <tr><td><strong>Previous Close</strong></td><td>$${quote.previousClose || 'N/A'}</td></tr>
                <tr><td><strong>Market Cap</strong></td><td>$${quote.marketCap ? quote.marketCap.toLocaleString() : 'N/A'}</td></tr>
                <tr><td><strong>Currency</strong></td><td>${quote.currency || 'N/A'}</td></tr>
            </table>
        </div>
        ` : ''}

        ${profile?.description ? `
        <div class="section">
            <h3>Business Description</h3>
            <p>${profile.description}</p>
        </div>
        ` : ''}

        <div class="section" style="font-size: 12px; color: #666; text-align: center; margin-top: 50px;">
            <p>This report is for informational purposes only and should not be considered as investment advice.</p>
        </div>
    </body>
    </html>
    `;

    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

export default router;
