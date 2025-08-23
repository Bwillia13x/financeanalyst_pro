# FinanceAnalyst Pro API Reference - Enhanced Documentation

## Overview
The FinanceAnalyst Pro API provides comprehensive financial modeling, data retrieval, and analysis capabilities. This enhanced documentation includes complete endpoint specifications, authentication flows, and integration examples.

## Base URL
- Production: `https://api.financeanalyst-pro.com/v1`
- Staging: `https://staging-api.financeanalyst-pro.com/v1` 
- Development: `http://localhost:8080/api/v1`

## Authentication

### JWT Bearer Token Authentication
```http
Authorization: Bearer <jwt_token>
```

### API Key Authentication (for service-to-service)
```http
X-API-Key: <api_key>
```

### OAuth 2.0 Flow (Enterprise)
```javascript
// Authorization URL
const authUrl = 'https://api.financeanalyst-pro.com/oauth/authorize';
const params = new URLSearchParams({
  client_id: 'your_client_id',
  response_type: 'code',
  redirect_uri: 'https://yourapp.com/callback',
  scope: 'read:financial_data write:models read:market_data'
});
window.location.href = `${authUrl}?${params}`;
```

## Core Endpoints

### 1. Market Data API

#### Get Real-Time Quote
```http
GET /market/quote/{symbol}
```

**Parameters:**
- `symbol` (required): Stock symbol (e.g., AAPL, MSFT)
- `fields` (optional): Comma-separated list of fields to return
- `extended_hours` (optional): Include extended hours data (default: false)

**Response:**
```json
{
  "symbol": "AAPL",
  "currentPrice": 185.25,
  "previousClose": 184.50,
  "change": 0.75,
  "changePercent": 0.41,
  "volume": 45678912,
  "marketCap": 2891234567890,
  "dayHigh": 186.10,
  "dayLow": 183.90,
  "week52High": 198.23,
  "week52Low": 164.08,
  "timestamp": "2025-08-23T21:33:12Z"
}
```

**Error Response:**
```json
{
  "error": "SYMBOL_NOT_FOUND",
  "message": "The requested symbol 'INVALID' was not found",
  "code": 404,
  "timestamp": "2025-08-23T21:33:12Z"
}
```

**SDK Example:**
```javascript
import { FinanceAnalystSDK } from '@financeanalyst/sdk';

const sdk = new FinanceAnalystSDK({
  apiKey: 'your_api_key',
  environment: 'production'
});

try {
  const quote = await sdk.market.getQuote('AAPL', {
    fields: ['currentPrice', 'marketCap', 'volume'],
    extendedHours: true
  });
  console.log(`${quote.symbol}: $${quote.currentPrice}`);
} catch (error) {
  console.error('Quote fetch failed:', error);
}
```

#### Get Historical Data
```http
GET /market/history/{symbol}
```

**Parameters:**
- `symbol` (required): Stock symbol
- `period` (required): Time period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
- `interval` (optional): Data interval (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)
- `adjust` (optional): Adjust for dividends and splits (default: true)

**Response:**
```json
{
  "symbol": "AAPL",
  "period": "1mo",
  "interval": "1d",
  "data": [
    {
      "date": "2025-07-24",
      "open": 180.25,
      "high": 182.50,
      "low": 179.80,
      "close": 181.90,
      "volume": 34567890,
      "adjustedClose": 181.90
    }
  ],
  "metadata": {
    "currency": "USD",
    "exchangeTimezoneName": "America/New_York",
    "instrumentType": "EQUITY",
    "firstTradeDate": "1980-12-12"
  }
}
```

### 2. Financial Statements API

#### Get Company Financials
```http
GET /financials/{symbol}/statements
```

**Parameters:**
- `symbol` (required): Company symbol
- `statement_type` (optional): income, balance, cash (default: all)
- `period` (optional): annual, quarterly (default: annual)
- `limit` (optional): Number of periods to return (default: 5)

**Response:**
```json
{
  "symbol": "AAPL",
  "companyName": "Apple Inc.",
  "currency": "USD",
  "statements": {
    "income": [
      {
        "fiscalYear": 2024,
        "period": "FY",
        "revenue": 394328000000,
        "costOfRevenue": 210352000000,
        "grossProfit": 183976000000,
        "operatingExpenses": 55013000000,
        "operatingIncome": 128963000000,
        "netIncome": 99803000000,
        "eps": 6.16,
        "dilutedEPS": 6.13
      }
    ],
    "balance": [
      {
        "fiscalYear": 2024,
        "period": "FY",
        "totalAssets": 365725000000,
        "totalLiabilities": 279414000000,
        "totalEquity": 86311000000,
        "cash": 62639000000,
        "totalDebt": 123930000000
      }
    ]
  }
}
```

### 3. DCF Modeling API

#### Create DCF Model
```http
POST /models/dcf
```

**Request Body:**
```json
{
  "symbol": "AAPL",
  "modelName": "Apple DCF Analysis Q3 2025",
  "assumptions": {
    "revenueGrowthRates": [0.08, 0.06, 0.05, 0.04, 0.03],
    "operatingMargin": 0.30,
    "taxRate": 0.21,
    "capexAsPercentOfRevenue": 0.05,
    "workingCapitalChange": 0.02,
    "discountRate": 0.10,
    "terminalGrowthRate": 0.025
  },
  "sensitivity": {
    "discountRateRange": [0.08, 0.12],
    "terminalGrowthRange": [0.015, 0.035],
    "steps": 5
  }
}
```

**Response:**
```json
{
  "modelId": "dcf_aapl_1724459592",
  "symbol": "AAPL",
  "modelName": "Apple DCF Analysis Q3 2025",
  "results": {
    "enterpriseValue": 2891234567890,
    "equityValue": 2767304567890,
    "pricePerShare": 175.32,
    "currentPrice": 185.25,
    "upside": -5.36,
    "recommendation": "HOLD"
  },
  "projections": [
    {
      "year": 2025,
      "revenue": 425794240000,
      "fcf": 89567123000,
      "presentValue": 81424203000
    }
  ],
  "sensitivityAnalysis": {
    "npvMatrix": [
      [150.25, 162.30, 175.32, 189.45, 204.89],
      [142.15, 153.67, 166.21, 179.88, 194.78]
    ]
  },
  "createdAt": "2025-08-23T21:33:12Z"
}
```

### 4. Portfolio Management API

#### Create Portfolio
```http
POST /portfolio
```

**Request Body:**
```json
{
  "name": "Growth Portfolio",
  "description": "High-growth technology stocks",
  "initialCash": 100000,
  "riskTolerance": "moderate",
  "investmentStrategy": "growth",
  "holdings": [
    {
      "symbol": "AAPL",
      "shares": 100,
      "targetWeight": 0.25
    }
  ]
}
```

#### Get Portfolio Performance
```http
GET /portfolio/{portfolioId}/performance
```

**Parameters:**
- `period` (optional): Performance period (1d, 1w, 1m, 3m, 6m, 1y, ytd, all)
- `benchmark` (optional): Benchmark symbol for comparison (default: SPY)

**Response:**
```json
{
  "portfolioId": "port_12345",
  "performance": {
    "totalReturn": 0.1245,
    "annualizedReturn": 0.0987,
    "volatility": 0.1456,
    "sharpeRatio": 0.8234,
    "maxDrawdown": -0.0789,
    "beta": 1.12,
    "alpha": 0.0234
  },
  "attribution": {
    "assetAllocation": 0.0123,
    "stockSelection": 0.0456,
    "interaction": -0.0023
  },
  "benchmarkComparison": {
    "benchmark": "SPY",
    "portfolioReturn": 0.1245,
    "benchmarkReturn": 0.1034,
    "activeReturn": 0.0211
  }
}
```

## WebSocket API

### Real-Time Market Data Stream
```javascript
const ws = new WebSocket('wss://api.financeanalyst-pro.com/ws/v1/market');

ws.onopen = function() {
  // Subscribe to real-time quotes
  ws.send(JSON.stringify({
    action: 'subscribe',
    symbols: ['AAPL', 'MSFT', 'GOOGL'],
    fields: ['price', 'volume', 'change']
  }));
};

ws.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('Real-time update:', data);
  /*
  {
    "type": "quote",
    "symbol": "AAPL",
    "price": 185.25,
    "change": 0.75,
    "volume": 45678912,
    "timestamp": "2025-08-23T21:33:12Z"
  }
  */
};
```

### Collaboration WebSocket
```javascript
const collaborationWs = new WebSocket('wss://api.financeanalyst-pro.com/ws/v1/collaboration');

collaborationWs.onopen = function() {
  // Join model collaboration session
  collaborationWs.send(JSON.stringify({
    action: 'join',
    modelId: 'dcf_aapl_1724459592',
    userId: 'user_123',
    userName: 'John Analyst'
  }));
};
```

## Rate Limits

### Standard Limits
- **Market Data**: 100 requests/minute per API key
- **Financial Statements**: 50 requests/minute per API key
- **DCF Modeling**: 10 models/hour per user
- **Portfolio Operations**: 200 requests/minute per API key

### Enterprise Limits
- **Market Data**: 1000 requests/minute per API key
- **Financial Statements**: 500 requests/minute per API key
- **DCF Modeling**: 100 models/hour per user
- **Real-time WebSocket**: Unlimited connections

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1724459652
```

## Error Codes

| Code | Error Type | Description |
|------|------------|-------------|
| 400 | `INVALID_REQUEST` | Malformed request or invalid parameters |
| 401 | `UNAUTHORIZED` | Invalid or missing authentication credentials |
| 403 | `FORBIDDEN` | Insufficient permissions for the requested resource |
| 404 | `NOT_FOUND` | Requested resource does not exist |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests - retry after rate limit reset |
| 500 | `INTERNAL_ERROR` | Server error - please retry or contact support |
| 503 | `SERVICE_UNAVAILABLE` | Service temporarily unavailable |

## SDK Integration

### Node.js SDK
```bash
npm install @financeanalyst/node-sdk
```

```javascript
const { FinanceAnalystClient } = require('@financeanalyst/node-sdk');

const client = new FinanceAnalystClient({
  apiKey: process.env.FINANCEANALYST_API_KEY,
  environment: 'production'
});

// Get market data
const quote = await client.market.getQuote('AAPL');

// Create DCF model
const dcfModel = await client.models.createDCF({
  symbol: 'AAPL',
  assumptions: { /* ... */ }
});

// Get portfolio performance
const performance = await client.portfolio.getPerformance('portfolio_123');
```

### Python SDK
```bash
pip install financeanalyst-python
```

```python
from financeanalyst import FinanceAnalystClient

client = FinanceAnalystClient(
    api_key=os.getenv('FINANCEANALYST_API_KEY'),
    environment='production'
)

# Get market data
quote = client.market.get_quote('AAPL')

# Create DCF model
dcf_model = client.models.create_dcf(
    symbol='AAPL',
    assumptions={
        'revenue_growth_rates': [0.08, 0.06, 0.05, 0.04, 0.03],
        'discount_rate': 0.10
    }
)

# Portfolio operations
portfolio = client.portfolio.create({
    'name': 'Growth Portfolio',
    'initial_cash': 100000
})
```

## Webhooks

### Portfolio Alerts
```http
POST /webhooks/portfolio-alerts
Content-Type: application/json

{
  "url": "https://yourapp.com/webhooks/portfolio",
  "events": ["position_change", "performance_alert", "rebalance_required"],
  "portfolioId": "portfolio_123"
}
```

**Webhook Payload Example:**
```json
{
  "event": "performance_alert",
  "portfolioId": "portfolio_123",
  "data": {
    "alertType": "drawdown_exceeded",
    "threshold": 0.10,
    "currentDrawdown": 0.12,
    "message": "Portfolio drawdown exceeded 10% threshold"
  },
  "timestamp": "2025-08-23T21:33:12Z"
}
```

### Market Alerts
```http
POST /webhooks/market-alerts
Content-Type: application/json

{
  "url": "https://yourapp.com/webhooks/market",
  "events": ["price_target", "volume_spike", "earnings_announcement"],
  "symbols": ["AAPL", "MSFT"]
}
```

## Testing Environment

### Sandbox API
- Base URL: `https://sandbox-api.financeanalyst-pro.com/v1`
- Test API Key: Use `test_` prefixed keys
- Mock data available for all endpoints
- Rate limits: 10x higher than production

### Test Data
```javascript
// Get test market data
const testQuote = await sdk.market.getQuote('TEST_SYMBOL');
// Returns predictable mock data for testing

// Create test DCF model
const testModel = await sdk.models.createDCF({
  symbol: 'TEST_SYMBOL',
  assumptions: { /* test assumptions */ }
});
```

## Support & Resources

- **Documentation**: https://docs.financeanalyst-pro.com
- **API Status**: https://status.financeanalyst-pro.com
- **Support**: support@financeanalyst-pro.com
- **Community**: https://community.financeanalyst-pro.com
- **GitHub**: https://github.com/financeanalyst-pro/api-examples
