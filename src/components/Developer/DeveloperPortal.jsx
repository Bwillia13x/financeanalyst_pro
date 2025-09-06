import { Code, Book, TestTube, Key, Zap, Globe, Download, Copy, Play, CheckCircle, AlertTriangle } from 'lucide-react';
import React, { useState } from 'react';

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
        return 'bg-success/10 text-success';
      case 'POST':
        return 'bg-accent/10 text-accent';
      case 'PUT':
        return 'bg-warning/10 text-warning';
      case 'DELETE':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-foreground-secondary';
    }
  };

  return (
    <div className={`bg-card text-foreground border border-border rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-lg">
            <Code className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Developer Portal</h3>
            <p className="text-xs text-foreground-secondary">API documentation and development tools</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1">
            <Key className="w-4 h-4 text-foreground-secondary" />
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Enter API Key"
              className="bg-transparent text-foreground text-sm outline-none w-32"
            />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border overflow-x-auto" role="tablist" aria-label="Developer portal sections">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-accent border-b-2 border-accent bg-accent/10'
                  : 'text-foreground-secondary hover:text-foreground hover:bg-muted'
              }`}
              role="tab"
              aria-selected={activeTab === tab.id}
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
            <div className="rounded-lg p-6 border bg-foreground/5 border-accent/20">
              <h4 className="text-xl font-semibold text-foreground mb-3">
                Welcome to FinanceAnalyst Pro API
              </h4>
              <p className="text-foreground-secondary mb-4">
                Access comprehensive financial data, advanced analytics, and AI-powered insights
                through our RESTful API. Build powerful financial applications with real-time market
                data, portfolio analysis, and predictive modeling.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent mb-1">200+</div>
                  <div className="text-sm text-foreground-secondary">API Endpoints</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent mb-1">99.9%</div>
                  <div className="text-sm text-foreground-secondary">Uptime SLA</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success mb-1">&lt;100ms</div>
                  <div className="text-sm text-foreground-secondary">Response Time</div>
                </div>
              </div>
            </div>

            {/* Quick Start */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="text-lg font-semibold text-foreground mb-4">Quick Start</h4>

              <div className="space-y-4">
                <div>
                  <h5 className="text-foreground font-medium mb-2">1. Get Your API Key</h5>
                  <p className="text-foreground-secondary text-sm">
                    Sign up for a developer account and generate your API key from the dashboard.
                  </p>
                </div>

                <div>
                  <h5 className="text-foreground font-medium mb-2">2. Make Your First Request</h5>
                  <div className="bg-muted rounded p-3 font-mono text-sm text-success">
                    curl -H &quot;X-API-Key: YOUR_API_KEY&quot; \
                    https://api.financeanalystpro.com/v1/market/quote/AAPL
                  </div>
                </div>

                <div>
                  <h5 className="text-foreground font-medium mb-2">3. Explore SDKs</h5>
                  <p className="text-foreground-secondary text-sm">
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
              <div key={category} className="bg-card border border-border rounded-lg p-6">
                <h4 className="text-lg font-semibold text-foreground mb-4 capitalize">
                  {category.replace('_', ' ')} Endpoints
                </h4>

                <div className="space-y-4">
                  {endpoints.map(endpoint => (
                    <div key={endpoint.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getMethodColor(endpoint.method)}`}
                        >
                          {endpoint.method}
                        </span>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <code className="text-accent font-mono text-sm">
                              {endpoint.path}
                            </code>
                            <button
                              onClick={() => copyToClipboard(endpoint.path)}
                              className="text-foreground-secondary hover:text-foreground"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>

                          <p className="text-foreground-secondary text-sm mb-3">{endpoint.description}</p>

                          {endpoint.parameters.length > 0 && (
                            <div className="mb-3">
                              <h6 className="text-foreground font-medium text-sm mb-2">Parameters:</h6>
                              <div className="space-y-1">
                                {endpoint.parameters.map((param, index) => (
                                  <div key={index} className="text-xs text-foreground-secondary">
                                    <code className="text-accent">{param.name}</code>
                                    <span
                                      className={`ml-2 px-1 py-0.5 rounded text-xs ${
                                        param.required
                                          ? 'bg-destructive/10 text-destructive'
                                          : 'bg-success/10 text-success'
                                      }`}
                                    >
                                      {param.required ? 'required' : 'optional'}
                                    </span>
                                    <span className="ml-2 text-foreground-secondary">({param.type})</span>-{' '}
                                    {param.description}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {endpoint.example && (
                            <div>
                              <h6 className="text-foreground font-medium text-sm mb-2">Example:</h6>
                              <div className="bg-muted rounded p-3">
                                <code className="text-success font-mono text-sm">
                                  {endpoint.example}
                                </code>
                              </div>
                            </div>
                          )}

                          {endpoint.response && (
                            <div className="mt-3">
                              <h6 className="text-foreground font-medium text-sm mb-2">Response:</h6>
                              <pre className="bg-muted rounded p-3 text-xs text-accent overflow-x-auto">
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
            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="text-lg font-semibold text-foreground mb-4">API Testing Console</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Request Panel */}
                <div>
                  <h5 className="text-foreground font-medium mb-3">Request</h5>

                  <div className="space-y-3">
                    <div>
                      <label htmlFor="dev-endpoint-select" className="block text-sm text-foreground-secondary mb-1">Endpoint</label>
                      <select
                        id="dev-endpoint-select"
                        value={selectedEndpoint}
                        onChange={e => setSelectedEndpoint(e.target.value)}
                        className="w-full px-3 py-2 bg-card border border-border rounded text-foreground text-sm"
                      >
                        <option value="quote">Stock Quote</option>
                        <option value="portfolio">Portfolio Analysis</option>
                        <option value="options">Options Pricing</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="dev-api-key-input" className="block text-sm text-foreground-secondary mb-1">API Key</label>
                      <input
                        id="dev-api-key-input"
                        type="password"
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        className="w-full px-3 py-2 bg-card border border-border rounded text-foreground text-sm"
                        placeholder="Enter your API key"
                      />
                    </div>

                    <button
                      onClick={testEndpoint}
                      disabled={isTesting || !apiKey}
                      className="w-full px-4 py-2 bg-accent hover:bg-accent/90 disabled:bg-muted disabled:text-foreground-secondary text-accent-foreground rounded transition-colors flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      {isTesting ? 'Testing...' : 'Test Endpoint'}
                    </button>
                  </div>
                </div>

                {/* Response Panel */}
                <div>
                  <h5 className="text-foreground font-medium mb-3">Response</h5>

                  <div className="bg-card border border-border rounded-lg p-4 min-h-64">
                    {isTesting ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
                      </div>
                    ) : testResults ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          {testResults.success ? (
                            <CheckCircle className="w-5 h-5 text-success" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                          )}
                          <span className="text-sm text-foreground">
                            Status: {testResults.status || 'Error'}
                          </span>
                          {testResults.responseTime && (
                            <span className="text-sm text-foreground-secondary">
                              ({testResults.responseTime}ms)
                            </span>
                          )}
                        </div>

                        {testResults.success ? (
                          <pre className="text-xs text-success overflow-x-auto">
                            {JSON.stringify(testResults.data, null, 2)}
                          </pre>
                        ) : (
                          <div className="text-sm text-destructive">{testResults.error}</div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-foreground-secondary mt-8">
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
            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="text-lg font-semibold text-foreground mb-4">Official SDKs</h4>
              <p className="text-foreground-secondary mb-6">
                Download our official SDKs to get started quickly with your preferred programming
                language.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sdkDownloads.map(sdk => (
                  <div
                    key={sdk.language}
                    className="bg-card rounded-lg p-4 border border-border"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-foreground font-medium">{sdk.language}</h5>
                      <span className="text-xs text-foreground-secondary">v{sdk.version}</span>
                    </div>

                    <p className="text-foreground-secondary text-sm mb-4">{sdk.description}</p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-foreground-secondary">{sdk.size}</span>
                      <button className="px-3 py-1 bg-accent hover:bg-accent/90 text-accent-foreground text-sm rounded transition-colors flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="text-lg font-semibold text-foreground mb-4">Installation Instructions</h4>

              <div className="space-y-4">
                <div>
                  <h5 className="text-foreground font-medium mb-2">Python</h5>
                  <div className="bg-muted rounded p-3">
                    <code className="text-success font-mono text-sm">
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
                  <h5 className="text-foreground font-medium mb-2">JavaScript/Node.js</h5>
                  <div className="bg-muted rounded p-3">
                    <code className="text-success font-mono text-sm">
                      npm install @financeanalyst/sdk
                      <br />
                      # or
                      <br />
                      yarn add @financeanalyst/sdk
                    </code>
                  </div>
                </div>

                <div>
                  <h5 className="text-foreground font-medium mb-2">R</h5>
                  <div className="bg-muted rounded p-3">
                    <code className="text-success font-mono text-sm">
                      devtools::install_github(&quot;financeanalyst/financeanalyst-r-sdk&quot;)
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'webhooks' && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="text-lg font-semibold text-foreground mb-4">Webhook Integration</h4>
              <p className="text-foreground-secondary mb-6">
                Set up webhooks to receive real-time notifications about market events, portfolio
                alerts, and analysis updates.
              </p>

              <div className="space-y-4">
                <div className="border border-border rounded-lg p-4">
                  <h5 className="text-foreground font-medium mb-2">Supported Events</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div>• market_data - Real-time price updates</div>
                    <div>• portfolio_alert - Risk threshold breaches</div>
                    <div>• analysis_complete - Analysis job completion</div>
                    <div>• news_alert - Breaking financial news</div>
                    <div>• earnings_release - Earnings announcements</div>
                    <div>• economic_data - Economic indicators</div>
                  </div>
                </div>

                <div className="border border-border rounded-lg p-4">
                  <h5 className="text-foreground font-medium mb-2">Security</h5>
                  <ul className="text-sm text-foreground-secondary space-y-1">
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
            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="text-lg font-semibold text-foreground mb-4">Third-party Integrations</h4>
              <p className="text-foreground-secondary mb-6">
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
                    className="bg-card rounded-lg p-4 border border-border"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-foreground font-medium">{integration.name}</h5>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          integration.status === 'available'
                            ? 'bg-success/10 text-success'
                            : 'bg-warning/10 text-warning'
                        }`}
                      >
                        {integration.status}
                      </span>
                    </div>

                    <p className="text-foreground-secondary text-sm mb-4">{integration.description}</p>

                    <button className="w-full px-3 py-2 bg-accent hover:bg-accent/90 text-accent-foreground text-sm rounded transition-colors">
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
