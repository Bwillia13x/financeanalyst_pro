/**
 * FinanceAnalyst Pro API v1 Routes
 * RESTful API endpoints for Phase 3 ecosystem integration
 */

const cors = require('cors');
const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, param, query, validationResult } = require('express-validator');
const helmet = require('helmet');

// Import specialized analytics services
const computerVision = require('../../src/services/ai/computerVision');
const nlpService = require('../../src/services/ai/nlpService');
const predictiveAnalytics = require('../../src/services/ai/predictiveAnalytics');
const bankingAnalytics = require('../../src/services/analytics/bankingAnalytics');
const energyAnalytics = require('../../src/services/analytics/energyAnalytics');
const healthcareAnalytics = require('../../src/services/analytics/healthcareAnalytics');
const realEstateAnalytics = require('../../src/services/analytics/realEstateAnalytics');
const technologyAnalytics = require('../../src/services/analytics/technologyAnalytics');
const collaboration = require('../../src/services/collaboration/realTimeCollaboration');
const exportSharing = require('../../src/services/sharing/exportSharingService');
const dataVisualization = require('../../src/services/visualization/dataVisualizationComponents');

const router = express.Router();

// Security middleware
router.use(helmet());
router.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const createRateLimit = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { error: message },
  standardHeaders: true,
  legacyHeaders: false
});

const generalLimit = createRateLimit(15 * 60 * 1000, 1000, 'Too many requests');
const computeIntensiveLimit = createRateLimit(60 * 60 * 1000, 100, 'Too many compute-intensive requests');
const aiLimit = createRateLimit(60 * 60 * 1000, 50, 'Too many AI/ML requests');

router.use('/ai/', aiLimit);
router.use('/analytics/specialized/', computeIntensiveLimit);
router.use('/', generalLimit);

// Authentication middleware
const authenticateAPI = (req, res, next) => {
  const apiKey = req.header('X-API-Key') || req.query.api_key;
  const authHeader = req.header('Authorization');

  if (!apiKey && !authHeader) {
    return res.status(401).json({ error: 'API key or authorization token required' });
  }

  // Validate API key or JWT token
  if (apiKey && !validateAPIKey(apiKey)) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  if (authHeader && !validateJWT(authHeader)) {
    return res.status(401).json({ error: 'Invalid authorization token' });
  }

  req.apiKey = apiKey;
  req.userId = extractUserFromAuth(apiKey || authHeader);
  next();
};

// Validation middleware
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Apply authentication to all routes
router.use(authenticateAPI);

/**
 * Financial Data APIs
 */

// Get company financials
router.get('/companies/:id/financials',
  param('id').isString().notEmpty(),
  query('period').optional().isIn(['annual', 'quarterly']),
  query('years').optional().isInt({ min: 1, max: 10 }),
  handleValidation,
  async(req, res) => {
    try {
      const { id } = req.params;
      const { period = 'annual', years = 5 } = req.query;

      const financials = await getCompanyFinancials(id, { period, years });

      res.json({
        success: true,
        data: {
          companyId: id,
          period,
          yearsRequested: years,
          financials
        },
        metadata: {
          requestId: generateRequestId(),
          timestamp: new Date().toISOString(),
          apiVersion: '1.0'
        }
      });
    } catch (error) {
      handleAPIError(res, error);
    }
  }
);

// Get market indices data
router.get('/markets/indices',
  query('symbols').optional().isString(),
  query('period').optional().isIn(['1d', '5d', '1m', '3m', '1y', '5y']),
  handleValidation,
  async(req, res) => {
    try {
      const { symbols, period = '1y' } = req.query;
      const symbolList = symbols ? symbols.split(',') : ['SPY', 'QQQ', 'DIA', 'IWM'];

      const marketData = await getMarketIndices(symbolList, period);

      res.json({
        success: true,
        data: {
          symbols: symbolList,
          period,
          marketData
        }
      });
    } catch (error) {
      handleAPIError(res, error);
    }
  }
);

// Get analysis results
router.get('/analysis/:id/results',
  param('id').isUUID(),
  handleValidation,
  async(req, res) => {
    try {
      const { id } = req.params;
      const analysis = await getAnalysisResults(id, req.userId);

      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found' });
      }

      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      handleAPIError(res, error);
    }
  }
);

// Run DCF calculation
router.post('/models/dcf/calculate',
  body('company_id').isString().notEmpty(),
  body('assumptions').isObject(),
  body('scenarios').optional().isArray(),
  handleValidation,
  async(req, res) => {
    try {
      const { companyId, assumptions, scenarios = ['base'] } = req.body;

      const dcfResults = await calculateDCF({
        companyId,
        assumptions,
        scenarios,
        userId: req.userId
      });

      res.json({
        success: true,
        data: dcfResults,
        metadata: {
          calculationTime: dcfResults.metadata.calculationTime,
          modelVersion: dcfResults.metadata.modelVersion
        }
      });
    } catch (error) {
      handleAPIError(res, error);
    }
  }
);

// Get industry benchmarks
router.get('/benchmarks/industry/:sector',
  param('sector').isString().notEmpty(),
  query('metrics').optional().isString(),
  handleValidation,
  async(req, res) => {
    try {
      const { sector } = req.params;
      const { metrics } = req.query;
      const metricList = metrics ? metrics.split(',') : null;

      const benchmarks = await getIndustryBenchmarks(sector, metricList);

      res.json({
        success: true,
        data: {
          sector,
          benchmarks,
          dataSources: benchmarks.metadata.sources,
          lastUpdated: benchmarks.metadata.lastUpdated
        }
      });
    } catch (error) {
      handleAPIError(res, error);
    }
  }
);

/**
 * Specialized Analytics APIs
 */

// Banking analytics
router.post('/analytics/specialized/banking/credit-portfolio',
  body('portfolio_data').isObject(),
  body('analysis_type').isIn(['risk_assessment', 'basel3_compliance', 'cecl_calculation', 'stress_testing']),
  handleValidation,
  async(req, res) => {
    try {
      const { portfolioData, analysisType } = req.body;

      let results;
      switch (analysisType) {
        case 'risk_assessment':
          results = await bankingAnalytics.performRiskAssessment(portfolioData);
          break;
        case 'basel3_compliance':
          results = await bankingAnalytics.checkBasel3Compliance(portfolioData);
          break;
        case 'cecl_calculation':
          results = await bankingAnalytics.calculateCECL(portfolioData);
          break;
        case 'stress_testing':
          results = await bankingAnalytics.runStressTests(portfolioData);
          break;
      }

      res.json({
        success: true,
        data: {
          analysisType,
          results,
          portfolioSummary: {
            totalExposure: portfolioData.totalExposure,
            loanCount: portfolioData.loans?.length || 0
          }
        }
      });
    } catch (error) {
      handleAPIError(res, error);
    }
  }
);

// Real estate analytics
router.post('/analytics/specialized/real-estate/property-valuation',
  body('property_data').isObject(),
  body('valuation_methods').optional().isArray(),
  handleValidation,
  async(req, res) => {
    try {
      const { propertyData, valuationMethods = ['dcf', 'cap_rate', 'comparable_sales'] } = req.body;

      const analysis = await realEstateAnalytics.analyzeProperty(propertyData);

      // Filter results based on requested methods
      const filteredResults = {};
      valuationMethods.forEach(method => {
        if (analysis[method + '_analysis'] || analysis[method + '_valuation']) {
          filteredResults[method] = analysis[method + '_analysis'] || analysis[method + '_valuation'];
        }
      });

      res.json({
        success: true,
        data: {
          propertyId: propertyData.id,
          valuationMethods,
          results: filteredResults,
          summary: {
            propertyType: propertyData.propertyType,
            location: propertyData.location,
            squareFootage: propertyData.squareFootage
          }
        }
      });
    } catch (error) {
      handleAPIError(res, error);
    }
  }
);

// Healthcare analytics
router.post('/analytics/specialized/healthcare/drug-pipeline',
  body('pipeline_data').isObject(),
  body('analysis_scope').optional().isArray(),
  handleValidation,
  async(req, res) => {
    try {
      const { pipelineData, analysisScope = ['valuation', 'clinical_trials', 'regulatory_risk'] } = req.body;

      const analysis = await healthcareAnalytics.modelDrugPipeline(pipelineData);

      // Filter analysis based on scope
      const filteredAnalysis = {};
      analysisScope.forEach(scope => {
        if (analysis[scope] || analysis[scope.replace('_', '_')]) {
          filteredAnalysis[scope] = analysis[scope] || analysis[scope.replace('_', '_')];
        }
      });

      res.json({
        success: true,
        data: {
          pipelineOverview: {
            programCount: pipelineData.programs?.length || 0,
            therapeuticAreas: [...new Set(pipelineData.programs?.map(p => p.therapeuticArea) || [])]
          },
          analysis: filteredAnalysis
        }
      });
    } catch (error) {
      handleAPIError(res, error);
    }
  }
);

// Energy analytics
router.post('/analytics/specialized/energy/reserves-valuation',
  body('asset_data').isObject(),
  body('valuation_methods').optional().isArray(),
  handleValidation,
  async(req, res) => {
    try {
      const { assetData, valuationMethods = ['pv10', 'pv15', 'risked_value'] } = req.body;

      const analysis = await energyAnalytics.performReserveValuation(assetData);

      res.json({
        success: true,
        data: {
          assetSummary: {
            reserveCount: assetData.reserves?.length || 0,
            totalEstimatedReserves: assetData.reserves?.reduce((sum, r) => sum + r.estimatedReserves, 0) || 0
          },
          valuationResults: analysis,
          methodology: valuationMethods
        }
      });
    } catch (error) {
      handleAPIError(res, error);
    }
  }
);

// Technology analytics
router.post('/analytics/specialized/technology/saas-metrics',
  body('saas_data').isObject(),
  body('metric_categories').optional().isArray(),
  handleValidation,
  async(req, res) => {
    try {
      const { saasData, metricCategories = ['revenue', 'customer', 'unit_economics', 'cohort'] } = req.body;

      const analysis = await technologyAnalytics.analyzeSaaSMetrics(saasData);

      // Filter by requested categories
      const filteredAnalysis = {};
      metricCategories.forEach(category => {
        const categoryKey = category + '_metrics';
        if (analysis[categoryKey]) {
          filteredAnalysis[category] = analysis[categoryKey];
        }
      });

      res.json({
        success: true,
        data: {
          companyOverview: {
            totalCustomers: saasData.customers?.length || 0,
            mrr: analysis.revenue_metrics?.monthly_recurring_revenue || 0
          },
          metrics: filteredAnalysis,
          benchmarking: analysis.benchmarking
        }
      });
    } catch (error) {
      handleAPIError(res, error);
    }
  }
);

/**
 * AI/ML Analytics APIs
 */

// Revenue forecasting
router.post('/ai/predictions/revenue',
  body('company_data').isObject(),
  body('forecast_horizon').optional().isInt({ min: 1, max: 60 }),
  body('model_preferences').optional().isArray(),
  handleValidation,
  async(req, res) => {
    try {
      const { companyData, forecastHorizon = 12, modelPreferences } = req.body;

      const forecast = await predictiveAnalytics.forecastRevenue({
        ...companyData,
        forecastHorizon,
        modelPreferences
      });

      res.json({
        success: true,
        data: {
          forecastHorizonMonths: forecastHorizon,
          selectedModel: forecast.modelSelection.selectedModel,
          forecasts: forecast.ensembleForecast || forecast.univariateForecast,
          modelPerformance: forecast.modelSelection.modelPerformance,
          confidenceIntervals: forecast.confidenceIntervals
        }
      });
    } catch (error) {
      handleAPIError(res, error);
    }
  }
);

// Document analysis
router.post('/ai/nlp/analyze-document',
  body('document').isObject(),
  body('analysis_types').optional().isArray(),
  handleValidation,
  async(req, res) => {
    try {
      const { document, analysisTypes = ['sentiment', 'entities', 'metrics', 'summary'] } = req.body;

      const analysis = await nlpService.analyzeDocument(document);

      // Filter analysis based on requested types
      const filteredAnalysis = {};
      analysisTypes.forEach(type => {
        const analysisKey = type === 'entities' ? 'entityRecognition' :
          type === 'metrics' ? 'keyMetricsExtraction' :
            type + '_analysis';
        if (analysis[analysisKey]) {
          filteredAnalysis[type] = analysis[analysisKey];
        }
      });

      res.json({
        success: true,
        data: {
          documentClassification: analysis.documentClassification,
          analysisResults: filteredAnalysis,
          processingMetadata: {
            documentType: analysis.documentClassification.documentType,
            confidence: analysis.documentClassification.confidence,
            processingTime: Date.now() - req.startTime
          }
        }
      });
    } catch (error) {
      handleAPIError(res, error);
    }
  }
);

// Chart recognition
router.post('/ai/computer-vision/recognize-chart',
  body('image_data').isObject(),
  body('extract_data').optional().isBoolean(),
  handleValidation,
  async(req, res) => {
    try {
      const { imageData, extractData = true } = req.body;

      const recognition = await computerVision.recognizeChart(imageData);

      const response = {
        chartType: recognition.chartClassification.chartType,
        confidence: recognition.chartClassification.confidence,
        qualityScore: recognition.qualityAssessment.overallScore
      };

      if (extractData) {
        response.extractedData = recognition.dataExtraction.extractedData;
        response.dataQuality = recognition.dataExtraction.dataQuality;
      }

      res.json({
        success: true,
        data: response
      });
    } catch (error) {
      handleAPIError(res, error);
    }
  }
);

/**
 * Collaboration APIs
 */

// Get workspace users
router.get('/workspaces/:id/users',
  param('id').isUUID(),
  handleValidation,
  async(req, res) => {
    try {
      const { id } = req.params;
      const users = await collaboration.getWorkspaceUsers(id);

      res.json({
        success: true,
        data: {
          workspaceId: id,
          users: users.map(user => ({
            id: user.id,
            name: user.name,
            role: user.role,
            status: user.status,
            lastActive: user.lastActive
          }))
        }
      });
    } catch (error) {
      handleAPIError(res, error);
    }
  }
);

// Create comment
router.post('/comments',
  body('analysis_id').isUUID(),
  body('content').isString().notEmpty(),
  body('parent_id').optional().isUUID(),
  handleValidation,
  async(req, res) => {
    try {
      const { analysisId, content, parentId } = req.body;

      const comment = await collaboration.createComment({
        analysisId,
        content,
        parentId,
        userId: req.userId
      });

      res.status(201).json({
        success: true,
        data: comment
      });
    } catch (error) {
      handleAPIError(res, error);
    }
  }
);

// Get version history
router.get('/versions/:id/history',
  param('id').isUUID(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  handleValidation,
  async(req, res) => {
    try {
      const { id } = req.params;
      const { limit = 20 } = req.query;

      const history = await collaboration.getVersionHistory(id, { limit });

      res.json({
        success: true,
        data: {
          analysisId: id,
          versions: history,
          totalVersions: history.length
        }
      });
    } catch (error) {
      handleAPIError(res, error);
    }
  }
);

// Send notification
router.post('/notifications/send',
  body('recipients').isArray(),
  body('message').isString().notEmpty(),
  body('type').isIn(['info', 'warning', 'error', 'success']),
  body('analysis_id').optional().isUUID(),
  handleValidation,
  async(req, res) => {
    try {
      const { recipients, message, type, analysisId } = req.body;

      const notification = await collaboration.sendNotification({
        recipients,
        message,
        type,
        analysisId,
        senderId: req.userId
      });

      res.status(201).json({
        success: true,
        data: notification
      });
    } catch (error) {
      handleAPIError(res, error);
    }
  }
);

/**
 * Visualization & Export APIs
 */

// Create visualization
router.post('/visualizations/create',
  body('data').isObject(),
  body('chart_type').isString().notEmpty(),
  body('configuration').optional().isObject(),
  handleValidation,
  async(req, res) => {
    try {
      const { data, chartType, configuration = {} } = req.body;

      const visualization = await dataVisualization.createVisualization({
        data,
        chartType,
        configuration,
        userId: req.userId
      });

      res.status(201).json({
        success: true,
        data: visualization
      });
    } catch (error) {
      handleAPIError(res, error);
    }
  }
);

// Export analysis
router.post('/export',
  body('analysis_id').isUUID(),
  body('format').isIn(['pdf', 'excel', 'csv']),
  body('template').optional().isString(),
  handleValidation,
  async(req, res) => {
    try {
      const { analysisId, format, template } = req.body;

      const exportResult = await exportSharing.exportAnalysis({
        analysisId,
        format,
        template,
        userId: req.userId
      });

      res.json({
        success: true,
        data: {
          downloadUrl: exportResult.downloadUrl,
          expiresAt: exportResult.expiresAt,
          fileSize: exportResult.fileSize,
          format
        }
      });
    } catch (error) {
      handleAPIError(res, error);
    }
  }
);

// Error handling
const handleAPIError = (res, error) => {
  console.error('API Error:', error);

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code: error.code || 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    }
  });
};

// Helper functions
const validateAPIKey = (apiKey) => {
  // Implementation would validate against database
  return apiKey && apiKey.length === 32;
};

const validateJWT = (authHeader) => {
  // Implementation would validate JWT token
  return authHeader && authHeader.startsWith('Bearer ');
};

const extractUserFromAuth = (_auth) => {
  // Implementation would extract user ID from API key or JWT
  return 'user_' + Math.random().toString(36).substr(2, 9);
};

const generateRequestId = () => {
  return 'req_' + Math.random().toString(36).substr(2, 16);
};

// Timing middleware
router.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

// Placeholder service functions (would be implemented with actual business logic)
const getCompanyFinancials = async(_id, _options) => ({ /* Mock data */ });
const getMarketIndices = async(_symbols, _period) => ({ /* Mock data */ });
const getAnalysisResults = async(_id, _userId) => ({ /* Mock data */ });
const calculateDCF = async(_params) => ({ /* Mock data */ });
const getIndustryBenchmarks = async(_sector, _metrics) => ({ /* Mock data */ });

module.exports = router;
