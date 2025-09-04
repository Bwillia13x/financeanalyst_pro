import {
  Code,
  Book,
  TestTube,
  Key,
  Zap,
  Globe,
  Download,
  Copy,
  Play,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

const DeveloperPortal = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [apiKey, setApiKey] = useState('');
  const [testResults, setTestResults] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState('quote');

  // Mock API endpoints for documentation
  const apiEndpoints = {
    market: [
      {
        id: 'quote',
        method: 'GET',
        path: '/market/quote/{symbol}',
        description: 'Get real-time stock quote',
        parameters: [
          {
            name: 'symbol',
            type: 'string',
            required: true,
            description: 'Stock symbol (e.g., AAPL)'
          }
        ],
        example: 'GET /market/quote/AAPL',
        response: `{
  "symbol": "AAPL",
  "price": 150.25,
  "change": 2.50,
  "changePercent": 1.69,
  "volume": 45230000,
  "timestamp": "2024-01-15T16:00:00Z"
}`
      },
      {
        id: 'history',
        method: 'GET',
        path: '/market/history/{symbol}',
        description: 'Get historical stock data',
        parameters: [
          { name: 'symbol', type: 'string', required: true, description: 'Stock symbol' },
          {
            name: 'period',
            type: 'string',
            required: false,
            description: 'Time period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)'
          },
          {
            name: 'interval',
            type: 'string',
            required: false,
            description: 'Data interval (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)'
          }
        ]
      },
      {
        id: 'indices',
        method: 'GET',
        path: '/market/indices',
        description: 'Get major market indices',
        parameters: [],
        example: 'GET /market/indices'
      }
    ],
    analytics: [
      {
        id: 'portfolio',
        method: 'POST',
        path: '/analytics/portfolio',
        description: 'Analyze portfolio with comprehensive metrics',
        parameters: [
          {
            name: 'assets',
            type: 'array',
            required: true,
            description: 'Array of portfolio assets'
          },
          { name: 'weights', type: 'array', required: true, description: 'Array of asset weights' }
        ],
        example: `POST /analytics/portfolio
{
  "assets": [
    {"symbol": "AAPL", "weight": 0.4},
    {"symbol": "MSFT", "weight": 0.3}
  ]
}`
      },
      {
        id: 'risk',
        method: 'POST',
        path: '/analytics/risk',
        description: 'Calculate portfolio risk metrics including VaR',
        parameters: [
          { name: 'portfolio', type: 'object', required: true, description: 'Portfolio data' },
          {
            name: 'method',
            type: 'string',
            required: false,
            description: 'Risk method (parametric, historical, monte_carlo)'
          },
          {
            name: 'confidence_level',
            type: 'number',
            required: false,
            description: 'Confidence level (0.95, 0.99, etc.)'
          }
        ]
      },
      {
        id: 'options',
        method: 'POST',
        path: '/analytics/options',
        description: 'Price options using Black-Scholes and other models',
        parameters: [
          { name: 'type', type: 'string', required: true, description: 'Option type (call, put)' },
          {
            name: 'spotPrice',
            type: 'number',
            required: true,
            description: 'Underlying asset price'
          },
          {
            name: 'strikePrice',
            type: 'number',
            required: true,
            description: 'Option strike price'
          },
          {
            name: 'timeToExpiry',
            type: 'number',
            required: true,
            description: 'Time to expiry in years'
          },
          {
            name: 'volatility',
            type: 'number',
            required: true,
            description: 'Volatility (0.25 = 25%)'
          },
          { name: 'riskFreeRate', type: 'number', required: true, description: 'Risk-free rate' }
        ]
      }
    ],
    ai: [
      {
        id: 'insights',
        method: 'POST',
        path: '/ai/insights',
        description: 'Generate AI-powered financial insights',
        parameters: [
          {
            name: 'data',
            type: 'object',
            required: true,
            description: 'Financial data for analysis'
          },
          {
            name: 'context',
            type: 'object',
            required: false,
            description: 'Contextual information'
          }
        ]
      },
      {
        id: 'predict',
        method: 'POST',
        path: '/ai/predict',
        description: 'Predict financial metrics using machine learning',
        parameters: [
          {
            name: 'data',
            type: 'object',
            required: true,
            description: 'Historical financial data'
          },
          {
            name: 'horizon',
            type: 'number',
            required: false,
            description: 'Prediction horizon in periods'
          },
          {
            name: 'model',
            type: 'string',
            required: false,
            description: 'ML model (auto, linear, rf, nn)'
          }
        ]
      },
      {
        id: 'sentiment',
        method: 'POST',
        path: '/ai/sentiment',
        description: 'Analyze sentiment of financial text',
        parameters: [
          { name: 'text', type: 'string', required: true, description: 'Text to analyze' },
          {
            name: 'source',
            type: 'string',
            required: false,
            description: 'Text source (news, social, earnings)'
          }
        ]
      }
    ]
  };

  const sdkDownloads = [
    {
      language: 'Python',
      version: '1.0.0',
      description: 'Complete Python SDK with pandas integration',
      downloadUrl: '/sdk/python/financeanalyst_sdk.py',
      size: '45 KB'
    },
    {
      language: 'JavaScript',
      version: '1.0.0',
      description: 'Node.js and browser-compatible SDK',
      downloadUrl: '/sdk/javascript/financeanalyst-sdk.js',
      size: '32 KB'
    },
    {
      language: 'R',
      version: '1.0.0',
      description: 'R package for statistical computing',
      downloadUrl: '/sdk/r/financeanalyst.R',
      size: '28 KB'
    }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Book },
    { id: 'endpoints', label: 'API Endpoints', icon: Code },
    { id: 'testing', label: 'API Testing', icon: TestTube },
    { id: 'sdks', label: 'SDKs', icon: Download },
    { id: 'webhooks', label: 'Webhooks', icon: Zap },
    { id: 'integrations', label: 'Integrations', icon: Globe }
  ];

  // Test API endpoint
  const testEndpoint = async () => {
    setIsTesting(true);
    setTestResults(null);

    try {
      // Mock API testing - in real implementation, this would make actual API calls
      await new Promise(resolve => setTimeout(resolve, 2000));

      setTestResults({
        success: true,
        status: 200,
        responseTime: 245,
        data: {
          symbol: 'AAPL',
          price: 150.25,
          change: 2.5,
          changePercent: 1.69
        }
      });
    } catch (error) {
      setTestResults({
        success: false,
        error: error.message
      });
    } finally {
      setIsTesting(false);
    }
  };

  const copyToClipboard = text => {
    navigator.clipboard.writeText(text);
  };

  const getMethodColor = method => {
    switch (method) {
      case 'GET':
        return 'bg-green-500';
      case 'POST':
        return 'bg-blue-500';
      case 'PUT':
        return 'bg-yellow-500';
      case 'DELETE':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className={`bg-slate-800 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Code className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Developer Portal</h3>
            <p className="text-xs text-slate-400">API documentation and development tools</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-1">
            <Key className="w-4 h-4 text-slate-400" />
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Enter API Key"
              className="bg-transparent text-white text-sm outline-none w-32"
            />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-700 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg p-6 border border-purple-500/20">
              <h4 className="text-xl font-semibold text-white mb-3">
                Welcome to FinanceAnalyst Pro API
              </h4>
              <p className="text-slate-300 mb-4">
                Access comprehensive financial data, advanced analytics, and AI-powered insights
                through our RESTful API. Build powerful financial applications with real-time market
                data, portfolio analysis, and predictive modeling.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400 mb-1">200+</div>
                  <div className="text-sm text-slate-400">API Endpoints</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-1">99.9%</div>
                  <div className="text-sm text-slate-400">Uptime SLA</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400 mb-1">&lt;100ms</div>
                  <div className="text-sm text-slate-400">Response Time</div>
                </div>
              </div>
            </div>

            {/* Quick Start */}
            <div className="bg-slate-700/50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Quick Start</h4>

              <div className="space-y-4">
                <div>
                  <h5 className="text-white font-medium mb-2">1. Get Your API Key</h5>
                  <p className="text-slate-400 text-sm">
                    Sign up for a developer account and generate your API key from the dashboard.
                  </p>
                </div>

                <div>
                  <h5 className="text-white font-medium mb-2">2. Make Your First Request</h5>
                  <div className="bg-slate-800 rounded p-3 font-mono text-sm text-green-400">
                    curl -H "X-API-Key: YOUR_API_KEY" \
                    https://api.financeanalystpro.com/v1/market/quote/AAPL
                  </div>
                </div>

                <div>
                  <h5 className="text-white font-medium mb-2">3. Explore SDKs</h5>
                  <p className="text-slate-400 text-sm">
                    Use our official SDKs for Python, JavaScript, and R to get started quickly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'endpoints' && (
          <div className="space-y-6">
            {Object.entries(apiEndpoints).map(([category, endpoints]) => (
              <div key={category} className="bg-slate-700/50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-white mb-4 capitalize">
                  {category.replace('_', ' ')} Endpoints
                </h4>

                <div className="space-y-4">
                  {endpoints.map(endpoint => (
                    <div key={endpoint.id} className="border border-slate-600 rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium text-white ${getMethodColor(endpoint.method)}`}
                        >
                          {endpoint.method}
                        </span>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <code className="text-purple-400 font-mono text-sm">
                              {endpoint.path}
                            </code>
                            <button
                              onClick={() => copyToClipboard(endpoint.path)}
                              className="text-slate-400 hover:text-white"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>

                          <p className="text-slate-300 text-sm mb-3">{endpoint.description}</p>

                          {endpoint.parameters.length > 0 && (
                            <div className="mb-3">
                              <h6 className="text-white font-medium text-sm mb-2">Parameters:</h6>
                              <div className="space-y-1">
                                {endpoint.parameters.map((param, index) => (
                                  <div key={index} className="text-xs text-slate-400">
                                    <code className="text-blue-400">{param.name}</code>
                                    <span
                                      className={`ml-2 px-1 py-0.5 rounded text-xs ${
                                        param.required
                                          ? 'bg-red-500/20 text-red-300'
                                          : 'bg-green-500/20 text-green-300'
                                      }`}
                                    >
                                      {param.required ? 'required' : 'optional'}
                                    </span>
                                    <span className="ml-2 text-slate-500">({param.type})</span>-{' '}
                                    {param.description}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {endpoint.example && (
                            <div>
                              <h6 className="text-white font-medium text-sm mb-2">Example:</h6>
                              <div className="bg-slate-800 rounded p-3">
                                <code className="text-green-400 font-mono text-sm">
                                  {endpoint.example}
                                </code>
                              </div>
                            </div>
                          )}

                          {endpoint.response && (
                            <div className="mt-3">
                              <h6 className="text-white font-medium text-sm mb-2">Response:</h6>
                              <pre className="bg-slate-800 rounded p-3 text-xs text-blue-400 overflow-x-auto">
                                {endpoint.response}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'testing' && (
          <div className="space-y-6">
            <div className="bg-slate-700/50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-4">API Testing Console</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Request Panel */}
                <div>
                  <h5 className="text-white font-medium mb-3">Request</h5>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">Endpoint</label>
                      <select
                        value={selectedEndpoint}
                        onChange={e => setSelectedEndpoint(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                      >
                        <option value="quote">Stock Quote</option>
                        <option value="portfolio">Portfolio Analysis</option>
                        <option value="options">Options Pricing</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-slate-300 mb-1">API Key</label>
                      <input
                        type="password"
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                        placeholder="Enter your API key"
                      />
                    </div>

                    <button
                      onClick={testEndpoint}
                      disabled={isTesting || !apiKey}
                      className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white rounded transition-colors flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      {isTesting ? 'Testing...' : 'Test Endpoint'}
                    </button>
                  </div>
                </div>

                {/* Response Panel */}
                <div>
                  <h5 className="text-white font-medium mb-3">Response</h5>

                  <div className="bg-slate-800 rounded-lg p-4 min-h-64">
                    {isTesting ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
                      </div>
                    ) : testResults ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          {testResults.success ? (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                          )}
                          <span className="text-sm text-white">
                            Status: {testResults.status || 'Error'}
                          </span>
                          {testResults.responseTime && (
                            <span className="text-sm text-slate-400">
                              ({testResults.responseTime}ms)
                            </span>
                          )}
                        </div>

                        {testResults.success ? (
                          <pre className="text-xs text-green-400 overflow-x-auto">
                            {JSON.stringify(testResults.data, null, 2)}
                          </pre>
                        ) : (
                          <div className="text-sm text-red-400">{testResults.error}</div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-slate-400 mt-8">
                        <TestTube className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Run a test to see the API response</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sdks' && (
          <div className="space-y-6">
            <div className="bg-slate-700/50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Official SDKs</h4>
              <p className="text-slate-400 mb-6">
                Download our official SDKs to get started quickly with your preferred programming
                language.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sdkDownloads.map(sdk => (
                  <div
                    key={sdk.language}
                    className="bg-slate-800 rounded-lg p-4 border border-slate-600"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-white font-medium">{sdk.language}</h5>
                      <span className="text-xs text-slate-400">v{sdk.version}</span>
                    </div>

                    <p className="text-slate-400 text-sm mb-4">{sdk.description}</p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">{sdk.size}</span>
                      <button className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Installation Instructions</h4>

              <div className="space-y-4">
                <div>
                  <h5 className="text-white font-medium mb-2">Python</h5>
                  <div className="bg-slate-800 rounded p-3">
                    <code className="text-green-400 font-mono text-sm">
                      pip install financeanalyst-sdk
                      <br />
                      # or
                      <br />
                      pip install
                      git+https://github.com/financeanalyst/financeanalyst-python-sdk.git
                    </code>
                  </div>
                </div>

                <div>
                  <h5 className="text-white font-medium mb-2">JavaScript/Node.js</h5>
                  <div className="bg-slate-800 rounded p-3">
                    <code className="text-green-400 font-mono text-sm">
                      npm install @financeanalyst/sdk
                      <br />
                      # or
                      <br />
                      yarn add @financeanalyst/sdk
                    </code>
                  </div>
                </div>

                <div>
                  <h5 className="text-white font-medium mb-2">R</h5>
                  <div className="bg-slate-800 rounded p-3">
                    <code className="text-green-400 font-mono text-sm">
                      devtools::install_github("financeanalyst/financeanalyst-r-sdk")
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'webhooks' && (
          <div className="space-y-6">
            <div className="bg-slate-700/50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Webhook Integration</h4>
              <p className="text-slate-400 mb-6">
                Set up webhooks to receive real-time notifications about market events, portfolio
                alerts, and analysis updates.
              </p>

              <div className="space-y-4">
                <div className="border border-slate-600 rounded-lg p-4">
                  <h5 className="text-white font-medium mb-2">Supported Events</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div>• market_data - Real-time price updates</div>
                    <div>• portfolio_alert - Risk threshold breaches</div>
                    <div>• analysis_complete - Analysis job completion</div>
                    <div>• news_alert - Breaking financial news</div>
                    <div>• earnings_release - Earnings announcements</div>
                    <div>• economic_data - Economic indicators</div>
                  </div>
                </div>

                <div className="border border-slate-600 rounded-lg p-4">
                  <h5 className="text-white font-medium mb-2">Security</h5>
                  <ul className="text-sm text-slate-400 space-y-1">
                    <li>• HMAC-SHA256 signature verification</li>
                    <li>• HTTPS-only webhook URLs</li>
                    <li>• Configurable retry policies</li>
                    <li>• Event filtering and rate limiting</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="space-y-6">
            <div className="bg-slate-700/50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Third-party Integrations</h4>
              <p className="text-slate-400 mb-6">
                Connect with popular financial data providers and trading platforms.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    name: 'Bloomberg Terminal',
                    status: 'available',
                    description: 'Real-time market data and analytics'
                  },
                  {
                    name: 'Refinitiv Eikon',
                    status: 'available',
                    description: 'Comprehensive financial data platform'
                  },
                  {
                    name: 'Morningstar Direct',
                    status: 'available',
                    description: 'Investment research and analytics'
                  },
                  {
                    name: 'FactSet',
                    status: 'available',
                    description: 'Financial data and analytics platform'
                  },
                  {
                    name: 'Yahoo Finance',
                    status: 'available',
                    description: 'Free financial data and news'
                  },
                  {
                    name: 'Alpha Vantage',
                    status: 'available',
                    description: 'Real-time and historical stock data'
                  }
                ].map(integration => (
                  <div
                    key={integration.name}
                    className="bg-slate-800 rounded-lg p-4 border border-slate-600"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-white font-medium">{integration.name}</h5>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          integration.status === 'available'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {integration.status}
                      </span>
                    </div>

                    <p className="text-slate-400 text-sm mb-4">{integration.description}</p>

                    <button className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors">
                      {integration.status === 'available' ? 'Connect' : 'Coming Soon'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeveloperPortal;
