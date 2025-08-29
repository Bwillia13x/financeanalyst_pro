# API Response Shapes and Validation Contracts

This document defines the expected request/response formats for FinanceAnalyst Pro backend APIs to ensure frontend compatibility and robust error handling.

Last updated: 2025-08-29 12:05:02-06:00

## Conventions

- All endpoints respond with JSON.
- Success payloads include `success: true` and a data object specific to the endpoint.
- Error payloads use the standardized helpers in `backend/utils/responseHelpers.js`.
- Ticker symbols are case-insensitive and may contain letters, digits, dots, and dashes using the regex: `/^[A-Z0-9.-]{1,10}$/i`.
- All times are ISO strings.

---

## Market Data

### GET /api/market-data/quote/:symbol

- Path params: `symbol` (regex above)
- Example response:
```json
{
  "success": true,
  "quote": {
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "regularMarketPrice": 217.34,
    "change": 1.12,
    "changePercent": 0.52,
    "marketCap": 3400000000000,
    "sector": "Technology"
  },
  "timestamp": "2025-08-29T18:00:00.000Z"
}
```
- Not found (example):
```json
{
  "success": false,
  "error": {
    "message": "Symbol not found",
    "code": "NOT_FOUND",
    "timestamp": "2025-08-29T18:00:00.000Z"
  }
}
```

### GET /api/market-data/historical/:symbol

- Query: `range` (e.g., `1mo`, `3mo`, `6mo`, `1y`, `2y`, `5y`), `interval` (e.g., `1d`, `1wk`, `1mo`). Defaults supported.
- Response:
```json
{
  "success": true,
  "historical": {
    "prices": [
      { "date": "2025-08-01", "open": 210.0, "high": 218.0, "low": 208.5, "close": 217.3, "volume": 123456789 }
    ]
  },
  "timestamp": "2025-08-29T18:00:00.000Z"
}
```
- Validation error (example invalid range):
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [ { "field": "range", "message": "Invalid value" } ],
    "timestamp": "2025-08-29T18:00:00.000Z"
  }
}
```

### GET /api/market-data/intraday/:symbol

- Query: `interval` (e.g., `1min`, `5min`, `15min`, `30min`, `60min`). Default `5min`.
- Response:
```json
{
  "success": true,
  "intraday": {
    "interval": "5min",
    "points": [ { "time": "2025-08-29T17:55:00Z", "open": 216.7, "high": 216.9, "low": 216.5, "close": 216.8, "volume": 120345 } ]
  },
  "timestamp": "2025-08-29T18:00:00.000Z"
}
```

### POST /api/market-data/batch-quotes

- Body: `{ "symbols": ["AAPL", "MSFT", "BRK.B"] }`
  - `symbols` must be an array (min 1, recommended max 100), each item matches the ticker regex.
- Response:
```json
{
  "success": true,
  "quotes": [
    { "symbol": "AAPL", "regularMarketPrice": 217.34 },
    { "symbol": "MSFT", "regularMarketPrice": 432.01 },
    { "symbol": "BRK.B", "regularMarketPrice": 416.52 }
  ],
  "timestamp": "2025-08-29T18:00:00.000Z"
}
```
- Validation error (example):
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [ { "field": "symbols", "message": "Must be an array" } ],
    "timestamp": "2025-08-29T18:00:00.000Z"
  }
}
```

---

## Financial Statements

Shared behaviors:
- Routes: `/api/financial-statements/{income|balance|cash-flow|ratios}/:symbol`
- Params: `symbol` uses the same ticker regex; `period` optional (`annual`|`quarter`); `limit` optional int (1..10).
- Response (example for income):
```json
{
  "symbol": "AAPL",
  "statementType": "income",
  "period": "annual",
  "data": [
    {
      "symbol": "AAPL",
      "date": "2024-09-28",
      "period": "FY",
      "revenue": 383285000000,
      "costOfRevenue": 214000000000,
      "grossProfit": 169285000000,
      "operatingIncome": 114301000000,
      "netIncome": 96995000000
    }
  ],
  "timestamp": "2025-08-29T18:00:00.000Z",
  "source": "fmp|alpha_vantage"
}
```
- Errors use `sendAPIError(res, message, error, status, code, extra)`

---

## Error Response Format (Standard)

Using `backend/utils/responseHelpers.js`:
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [ { "field": "symbols", "message": "Must be an array" } ],
    "timestamp": "2025-08-29T18:00:00.000Z"
  }
}
```

Notes:
- In development, stack traces may be included.
- Some legacy tests check a top-level `message`; to maintain compatibility, consider including both `message` and `error.message` temporarily when changing routes.

---

## Validation Policy

- Ticker regex: `/^[A-Z0-9.-]{1,10}$/i`
- Batch: `symbols` must be an array; item validator uses the same regex.
- Query params are validated for allowed values and ranges per route.

---

## Alignment Checklist

- Frontend baseURL points to the backend origin and includes `/api`.
- Backend CORS `FRONTEND_URL` matches the frontend origin.
- Batch quotes path is `/api/market-data/batch-quotes`.
- Response shapes match definitions above.
