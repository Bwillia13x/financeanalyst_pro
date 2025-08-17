# FinanceAnalyst Pro API Documentation

## Overview

FinanceAnalyst Pro provides a comprehensive REST API for financial data retrieval, analysis, and modeling. The API supports real-time market data, company fundamentals, financial statements, and advanced valuation calculations.

## Base URL

```
Production: https://financeanalyst-pro.herokuapp.com/api
Development: http://localhost:3001/api
```

## Authentication

Currently, the API uses API key authentication for external data sources but does not require authentication for basic endpoints. For production deployment, implement proper authentication.

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **General endpoints**: 100 requests per 15 minutes per IP
- **Market data endpoints**: 60 requests per minute per IP  
- **Company data endpoints**: 30 requests per minute per IP
- **Financial statements**: 20 requests per minute per IP

## Response Format

All responses follow a consistent JSON format:

```json
{
  "data": {...},
  "timestamp": "2025-08-16T10:30:00.000Z",
  "source": "data_provider",
  "status": "success"
}
```

Error responses:
```json
{
  "error": "Error description",
  "message": "Detailed error message", 
  "timestamp": "2025-08-16T10:30:00.000Z",
  "status": "error"
}
```

## Endpoints

### 1. Health Check

#### GET /health

Check API health and service status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-16T10:30:00.000Z",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "cache": "active",
    "external_apis": {
      "alpha_vantage": "available",
      "fmp": "available", 
      "yahoo_finance": "available"
    }
  }
}
```

### 2. Market Data

#### GET /market-data/quote/:symbol

Get real-time quote for a stock symbol.

**Parameters:**
- `symbol` (path) - Stock ticker symbol (e.g., AAPL, MSFT)

**Example Request:**
```
GET /api/market-data/quote/AAPL
```

**Response:**
```json
{
  "symbol": "AAPL",
  "price": 185.32,
  "previousClose": 184.50,
  "change": 0.82,
  "changePercent": "0.44%",
  "changePercentNumber": 0.44,
  "volume": 45678900,
  "marketCap": 2890000000000,
  "currency": "USD",
  "exchangeTimezoneName": "America/New_York",
  "timestamp": "2025-08-16T10:30:00.000Z",
  "source": "yahoo_finance"
}
```

#### GET /market-data/historical/:symbol

Get historical price data for a symbol.

**Parameters:**
- `symbol` (path) - Stock ticker symbol
- `range` (query, optional) - Time range: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y (default: 1mo)
- `interval` (query, optional) - Data interval: 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo (default: 1d)

**Example Request:**
```
GET /api/market-data/historical/AAPL?range=3mo&interval=1d
```

**Response:**
```json
{
  "symbol": "AAPL",
  "range": "3mo",
  "interval": "1d", 
  "data": [
    {
      "timestamp": "2025-05-16T20:00:00.000Z",
      "open": 182.50,
      "high": 185.90,
      "low": 181.20,
      "close": 184.30,
      "volume": 52400000
    }
  ],
  "meta": {
    "currency": "USD",
    "exchangeTimezoneName": "America/New_York",
    "instrumentType": "EQUITY"
  },
  "timestamp": "2025-08-16T10:30:00.000Z",
  "source": "yahoo_finance"
}
```

#### POST /market-data/batch

Get quotes for multiple symbols.

**Request Body:**
```json
{
  "symbols": ["AAPL", "MSFT", "GOOGL"]
}
```

**Response:**
```json
{
  "symbols": {
    "AAPL": {
      "symbol": "AAPL",
      "price": 185.32,
      "change": 0.82,
      "changePercent": "0.44%",
      "source": "yahoo_finance"
    },
    "MSFT": {...},
    "GOOGL": {...}
  },
  "timestamp": "2025-08-16T10:30:00.000Z"
}
```

### 3. Company Data

#### GET /company-data/profile/:symbol

Get comprehensive company profile and fundamentals.

**Parameters:**
- `symbol` (path) - Stock ticker symbol

**Example Request:**
```
GET /api/company-data/profile/AAPL
```

**Response:**
```json
{
  "symbol": "AAPL",
  "companyName": "Apple Inc.",
  "description": "Apple Inc. designs, manufactures, and markets smartphones...",
  "industry": "Consumer Electronics",
  "sector": "Technology",
  "country": "USA",
  "city": "Cupertino",
  "address": "One Apple Park Way",
  "phone": "+1-408-996-1010",
  "website": "https://www.apple.com",
  "exchange": "NASDAQ",
  "currency": "USD",
  "marketCap": 2890000000000,
  "employees": 161000,
  "ceo": "Timothy Cook",
  "founded": "1980-12-12",
  "metrics": {
    "beta": 1.25,
    "peRatio": 28.5,
    "priceToBook": 45.2,
    "priceToSales": 7.8,
    "dividendYield": 0.52,
    "debtToEquity": 1.73,
    "returnOnEquity": 175.6,
    "returnOnAssets": 22.5,
    "grossMargin": 43.8,
    "operatingMargin": 29.4,
    "netMargin": 26.3
  },
  "timestamp": "2025-08-16T10:30:00.000Z",
  "source": "fmp"
}
```

#### GET /company-data/peers/:symbol

Get peer companies in the same industry.

**Parameters:**
- `symbol` (path) - Stock ticker symbol
- `limit` (query, optional) - Number of peers to return (1-20, default: 10)

**Response:**
```json
{
  "symbol": "AAPL",
  "peers": [
    {
      "symbol": "MSFT",
      "companyName": "Microsoft Corporation",
      "sector": "Technology",
      "industry": "Software—Infrastructure",
      "marketCap": 2750000000000,
      "peRatio": 32.1,
      "priceToBook": 8.5,
      "returnOnEquity": 42.8
    }
  ],
  "timestamp": "2025-08-16T10:30:00.000Z",
  "source": "fmp"
}
```

#### GET /company-data/dcf/:symbol

Get discounted cash flow valuation.

**Response:**
```json
{
  "symbol": "AAPL",
  "dcfValue": 178.50,
  "stockPrice": 185.32,
  "date": "2025-08-16",
  "timestamp": "2025-08-16T10:30:00.000Z",
  "source": "fmp"
}
```

#### GET /company-data/earnings/:symbol

Get earnings data and estimates.

**Parameters:**
- `limit` (query, optional) - Number of quarters to return (1-20, default: 8)

**Response:**
```json
{
  "symbol": "AAPL",
  "quarterlyEarnings": [
    {
      "fiscalDateEnding": "2025-06-30",
      "reportedDate": "2025-08-01",
      "reportedEPS": 1.52,
      "estimatedEPS": 1.45,
      "surprise": 0.07,
      "surprisePercentage": 4.83
    }
  ],
  "annualEarnings": [
    {
      "fiscalDateEnding": "2024-09-30",
      "reportedEPS": 6.43
    }
  ],
  "timestamp": "2025-08-16T10:30:00.000Z",
  "source": "alpha_vantage"
}
```

### 4. Financial Statements

#### GET /financial-statements/income/:symbol

Get income statement data.

**Parameters:**
- `symbol` (path) - Stock ticker symbol
- `period` (query, optional) - annual or quarterly (default: annual)
- `limit` (query, optional) - Number of periods to return (1-10, default: 5)

**Response:**
```json
{
  "symbol": "AAPL",
  "period": "annual",
  "statements": [
    {
      "fiscalDateEnding": "2024-09-30",
      "totalRevenue": 391035000000,
      "costOfRevenue": 210352000000,
      "grossProfit": 180683000000,
      "operatingExpenses": 55013000000,
      "operatingIncome": 125670000000,
      "netIncome": 101956000000,
      "eps": 6.43,
      "ebitda": 138512000000
    }
  ],
  "timestamp": "2025-08-16T10:30:00.000Z",
  "source": "alpha_vantage"
}
```

#### GET /financial-statements/balance/:symbol

Get balance sheet data.

**Response:**
```json
{
  "symbol": "AAPL",
  "period": "annual",
  "statements": [
    {
      "fiscalDateEnding": "2024-09-30",
      "totalAssets": 364980000000,
      "totalCurrentAssets": 143566000000,
      "cash": 29943000000,
      "totalLiabilities": 255020000000,
      "totalCurrentLiabilities": 123930000000,
      "totalShareholderEquity": 109960000000,
      "retainedEarnings": 84893000000
    }
  ],
  "timestamp": "2025-08-16T10:30:00.000Z",
  "source": "alpha_vantage"
}
```

#### GET /financial-statements/cash-flow/:symbol

Get cash flow statement data.

**Response:**
```json
{
  "symbol": "AAPL",
  "period": "annual", 
  "statements": [
    {
      "fiscalDateEnding": "2024-09-30",
      "operatingCashflow": 118577000000,
      "capitalExpenditures": -9447000000,
      "freeCashFlow": 109130000000,
      "dividendPayout": -15234000000,
      "netIncomeFromContinuingOps": 101956000000
    }
  ],
  "timestamp": "2025-08-16T10:30:00.000Z",
  "source": "alpha_vantage"
}
```

### 5. Economic Data

#### GET /economic-data/indicators

Get key economic indicators.

**Parameters:**
- `indicators` (query, optional) - Comma-separated list: GDP, unemployment, inflation, interest_rates (default: all)

**Response:**
```json
{
  "indicators": {
    "GDP": {
      "value": 28.78,
      "unit": "trillion_usd",
      "period": "Q2 2025",
      "lastUpdated": "2025-07-30"
    },
    "unemployment": {
      "value": 3.8,
      "unit": "percentage",
      "period": "July 2025",
      "lastUpdated": "2025-08-05"
    },
    "inflation": {
      "value": 2.1,
      "unit": "percentage_yoy",
      "period": "July 2025", 
      "lastUpdated": "2025-08-10"
    },
    "interest_rates": {
      "fed_funds_rate": 5.50,
      "ten_year_treasury": 4.25,
      "period": "August 2025",
      "lastUpdated": "2025-08-15"
    }
  },
  "timestamp": "2025-08-16T10:30:00.000Z",
  "source": "fred"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid API key |
| 403 | Forbidden - Rate limit exceeded |
| 404 | Not Found - Symbol or endpoint not found |
| 422 | Unprocessable Entity - Validation failed |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |
| 502 | Bad Gateway - External API error |
| 503 | Service Unavailable - Service temporarily down |

## SDK Usage Examples

### JavaScript/Node.js

```javascript
const FinanceAPI = require('financeanalyst-pro-sdk');

const client = new FinanceAPI({
  baseURL: 'https://financeanalyst-pro.herokuapp.com/api',
  apiKey: 'your-api-key' // If authentication is implemented
});

// Get stock quote
const quote = await client.marketData.getQuote('AAPL');
console.log(quote.price);

// Get company profile  
const profile = await client.companyData.getProfile('AAPL');
console.log(profile.companyName);

// Get financial statements
const income = await client.financialStatements.getIncome('AAPL', {
  period: 'annual',
  limit: 3
});
```

### Python

```python
import requests

base_url = "https://financeanalyst-pro.herokuapp.com/api"

# Get stock quote
response = requests.get(f"{base_url}/market-data/quote/AAPL")
quote = response.json()
print(f"AAPL Price: ${quote['price']}")

# Get company profile
response = requests.get(f"{base_url}/company-data/profile/AAPL")
profile = response.json()
print(f"Company: {profile['companyName']}")
```

### cURL

```bash
# Get stock quote
curl "https://financeanalyst-pro.herokuapp.com/api/market-data/quote/AAPL"

# Get historical data
curl "https://financeanalyst-pro.herokuapp.com/api/market-data/historical/AAPL?range=1mo&interval=1d"

# Get company profile
curl "https://financeanalyst-pro.herokuapp.com/api/company-data/profile/AAPL"
```

## Caching

The API implements intelligent caching to improve performance:

- **Market data**: 1-5 minutes depending on endpoint
- **Company profiles**: 24 hours
- **Financial statements**: 24 hours  
- **Economic indicators**: 1-24 hours depending on update frequency

Cache headers are included in responses:
```
Cache-Control: public, max-age=3600, stale-while-revalidate=60
```

## Data Sources

- **Real-time market data**: Yahoo Finance, Alpha Vantage
- **Company fundamentals**: Financial Modeling Prep (FMP), Alpha Vantage  
- **Financial statements**: Alpha Vantage, SEC EDGAR
- **Economic data**: FRED (Federal Reserve Economic Data)

## Changelog

### v1.0.0 - 2025-08-16
- Initial API release
- Market data endpoints
- Company data endpoints
- Financial statements endpoints
- Economic data endpoints
- Rate limiting implementation
- Comprehensive error handling

## Support

For API support and questions:
- Documentation: [API Docs](https://financeanalyst-pro.herokuapp.com/docs)
- Issues: [GitHub Issues](https://github.com/financeanalyst-pro/api/issues)
- Email: api-support@financeanalyst-pro.com

## Terms of Use

By using this API, you agree to:
- Not exceed rate limits
- Use data for legitimate financial analysis purposes
- Comply with data provider terms of service
- Not redistribute raw data without permission

Data provided is for informational purposes only and should not be considered as investment advice.