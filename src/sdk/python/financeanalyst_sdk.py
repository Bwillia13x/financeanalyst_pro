"""
FinanceAnalyst Pro Python SDK

A comprehensive Python SDK for the FinanceAnalyst Pro platform,
providing easy access to financial data, analytics, and AI capabilities.

Usage:
    from financeanalyst_sdk import FinanceAnalystAPI

    api = FinanceAnalystAPI(api_key='your_api_key')
    quote = api.get_stock_quote('AAPL')
    analysis = api.analyze_portfolio(portfolio_data)
"""

import requests
import json
import time
from typing import Dict, List, Optional, Union, Any
from dataclasses import dataclass
from datetime import datetime, timedelta
import pandas as pd
import numpy as np


@dataclass
class APIConfig:
    """Configuration for API connections"""
    base_url: str = "https://api.financeanalystpro.com/v1"
    api_key: Optional[str] = None
    client_id: Optional[str] = None
    client_secret: Optional[str] = None
    timeout: int = 30
    max_retries: int = 3
    rate_limit_buffer: float = 0.1


@dataclass
class TokenResponse:
    """OAuth2 token response"""
    access_token: str
    refresh_token: str
    expires_in: int
    token_type: str = "Bearer"


class FinanceAnalystAPI:
    """
    Main API client for FinanceAnalyst Pro

    Provides access to all platform capabilities including:
    - Real-time market data
    - Financial analytics
    - Portfolio management
    - Risk analysis
    - AI/ML insights
    - Options pricing
    - Derivatives analysis
    """

    def __init__(self, api_key: Optional[str] = None, config: Optional[APIConfig] = None):
        """
        Initialize the API client

        Args:
            api_key: Your API key for authentication
            config: Optional APIConfig object for advanced configuration
        """
        self.config = config or APIConfig()
        if api_key:
            self.config.api_key = api_key

        self.session = requests.Session()
        self._tokens: Optional[TokenResponse] = None
        self._last_request_time = 0
        self._request_count = 0

        # Set default headers
        self.session.headers.update({
            'User-Agent': 'FinanceAnalystPro-Python-SDK/1.0',
            'Content-Type': 'application/json'
        })

        if self.config.api_key:
            self.session.headers['X-API-Key'] = self.config.api_key

    def authenticate(self, username: str, password: str) -> TokenResponse:
        """
        Authenticate using username/password and get OAuth2 tokens

        Args:
            username: Your username
            password: Your password

        Returns:
            TokenResponse object with access tokens
        """
        auth_data = {
            'grant_type': 'password',
            'username': username,
            'password': password,
            'client_id': self.config.client_id,
            'client_secret': self.config.client_secret
        }

        response = self._request('POST', '/auth/token', data=auth_data)
        token_data = response.json()

        self._tokens = TokenResponse(**token_data)
        self.session.headers['Authorization'] = f"Bearer {self._tokens.access_token}"

        return self._tokens

    def refresh_token(self) -> TokenResponse:
        """
        Refresh the access token using the refresh token

        Returns:
            New TokenResponse object
        """
        if not self._tokens or not self._tokens.refresh_token:
            raise ValueError("No refresh token available")

        refresh_data = {
            'grant_type': 'refresh_token',
            'refresh_token': self._tokens.refresh_token,
            'client_id': self.config.client_id,
            'client_secret': self.config.client_secret
        }

        response = self._request('POST', '/auth/token', data=refresh_data)
        token_data = response.json()

        self._tokens = TokenResponse(**token_data)
        self.session.headers['Authorization'] = f"Bearer {self._tokens.access_token}"

        return self._tokens

    def _request(self, method: str, endpoint: str,
                 params: Optional[Dict] = None,
                 data: Optional[Dict] = None,
                 json_data: Optional[Dict] = None) -> requests.Response:
        """
        Make an authenticated API request with rate limiting and error handling
        """
        url = f"{self.config.base_url}{endpoint}"

        # Rate limiting
        self._handle_rate_limiting()

        # Prepare request data
        kwargs = {
            'method': method,
            'url': url,
            'timeout': self.config.timeout
        }

        if params:
            kwargs['params'] = params

        if data:
            kwargs['data'] = json.dumps(data)

        if json_data:
            kwargs['json'] = json_data

        # Make request with retries
        for attempt in range(self.config.max_retries):
            try:
                response = self.session.request(**kwargs)

                # Handle rate limiting
                if response.status_code == 429:
                    retry_after = int(response.headers.get('Retry-After', 60))
                    time.sleep(retry_after)
                    continue

                # Handle authentication errors
                if response.status_code == 401 and self._tokens:
                    try:
                        self.refresh_token()
                        # Retry with new token
                        if 'Authorization' in self.session.headers:
                            kwargs['headers'] = self.session.headers.copy()
                        response = self.session.request(**kwargs)
                    except Exception:
                        pass

                response.raise_for_status()
                return response

            except requests.exceptions.RequestException as e:
                if attempt == self.config.max_retries - 1:
                    raise e
                time.sleep(2 ** attempt)  # Exponential backoff

        raise RuntimeError("Request failed after all retries")

    def _handle_rate_limiting(self):
        """Handle rate limiting to avoid API limits"""
        current_time = time.time()

        # Simple rate limiting - max 10 requests per second
        if current_time - self._last_request_time < 0.1:
            time.sleep(0.1)

        self._last_request_time = current_time
        self._request_count += 1

    # Market Data Methods

    def get_stock_quote(self, symbol: str) -> Dict:
        """
        Get real-time stock quote

        Args:
            symbol: Stock symbol (e.g., 'AAPL')

        Returns:
            Dictionary with quote data
        """
        response = self._request('GET', f'/market/quote/{symbol}')
        return response.json()

    def get_historical_data(self, symbol: str,
                           period: str = '1y',
                           interval: str = '1d') -> pd.DataFrame:
        """
        Get historical stock data

        Args:
            symbol: Stock symbol
            period: Time period ('1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max')
            interval: Data interval ('1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h', '1d', '5d', '1wk', '1mo', '3mo')

        Returns:
            Pandas DataFrame with historical data
        """
        response = self._request('GET', f'/market/history/{symbol}',
                               params={'period': period, 'interval': interval})
        data = response.json()

        # Convert to DataFrame
        df = pd.DataFrame(data['data'])
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='s')
        df.set_index('timestamp', inplace=True)

        return df

    def get_company_info(self, symbol: str) -> Dict:
        """
        Get company information and profile

        Args:
            symbol: Stock symbol

        Returns:
            Dictionary with company information
        """
        response = self._request('GET', f'/company/{symbol}/info')
        return response.json()

    def get_company_financials(self, symbol: str,
                              statement_type: str = 'income',
                              period: str = 'annual') -> pd.DataFrame:
        """
        Get company financial statements

        Args:
            symbol: Stock symbol
            statement_type: 'income', 'balance', 'cashflow'
            period: 'annual' or 'quarterly'

        Returns:
            Pandas DataFrame with financial data
        """
        response = self._request('GET', f'/company/{symbol}/financials',
                               params={'type': statement_type, 'period': period})
        data = response.json()

        return pd.DataFrame(data['data'])

    def get_market_indices(self) -> Dict:
        """
        Get major market indices data

        Returns:
            Dictionary with indices data
        """
        response = self._request('GET', '/market/indices')
        return response.json()

    # Analytics Methods

    def analyze_portfolio(self, portfolio: Dict) -> Dict:
        """
        Analyze a portfolio with comprehensive metrics

        Args:
            portfolio: Portfolio data with assets and weights

        Returns:
            Dictionary with portfolio analysis results
        """
        response = self._request('POST', '/analytics/portfolio', json_data=portfolio)
        return response.json()

    def calculate_risk(self, portfolio: Dict,
                      method: str = 'parametric',
                      confidence_level: float = 0.95) -> Dict:
        """
        Calculate portfolio risk metrics including VaR

        Args:
            portfolio: Portfolio data
            method: Risk calculation method ('parametric', 'historical', 'monte_carlo')
            confidence_level: Confidence level for VaR (0.95, 0.99, etc.)

        Returns:
            Dictionary with risk analysis results
        """
        data = {
            'portfolio': portfolio,
            'method': method,
            'confidence_level': confidence_level
        }

        response = self._request('POST', '/analytics/risk', json_data=data)
        return response.json()

    def price_options(self, option_params: Dict) -> Dict:
        """
        Price options using Black-Scholes and other models

        Args:
            option_params: Option parameters including type, strike, expiry, etc.

        Returns:
            Dictionary with option pricing results and Greeks
        """
        response = self._request('POST', '/analytics/options', json_data=option_params)
        return response.json()

    def analyze_derivatives(self, derivatives: List[Dict]) -> Dict:
        """
        Analyze derivatives portfolio

        Args:
            derivatives: List of derivative instruments

        Returns:
            Dictionary with derivatives analysis
        """
        response = self._request('POST', '/analytics/derivatives', json_data=derivatives)
        return response.json()

    def stress_test_portfolio(self, portfolio: Dict, scenarios: List[Dict]) -> Dict:
        """
        Perform stress testing on portfolio

        Args:
            portfolio: Portfolio data
            scenarios: List of stress scenarios

        Returns:
            Dictionary with stress test results
        """
        data = {
            'portfolio': portfolio,
            'scenarios': scenarios
        }

        response = self._request('POST', '/analytics/stress-test', json_data=data)
        return response.json()

    # AI/ML Methods

    def generate_insights(self, data: Dict, context: Optional[Dict] = None) -> Dict:
        """
        Generate AI-powered financial insights

        Args:
            data: Financial data for analysis
            context: Optional context information

        Returns:
            Dictionary with AI-generated insights
        """
        payload = {'data': data}
        if context:
            payload['context'] = context

        response = self._request('POST', '/ai/insights', json_data=payload)
        return response.json()

    def predict_metrics(self, data: Dict,
                       horizon: int = 12,
                       model: str = 'auto') -> Dict:
        """
        Predict financial metrics using machine learning

        Args:
            data: Historical financial data
            horizon: Prediction horizon in periods
            model: ML model to use ('auto', 'linear', 'rf', 'nn')

        Returns:
            Dictionary with predictions and confidence intervals
        """
        payload = {
            'data': data,
            'horizon': horizon,
            'model': model
        }

        response = self._request('POST', '/ai/predict', json_data=payload)
        return response.json()

    def analyze_sentiment(self, text: str, source: str = 'news') -> Dict:
        """
        Analyze sentiment of financial text

        Args:
            text: Text to analyze
            source: Source of text ('news', 'social', 'earnings')

        Returns:
            Dictionary with sentiment analysis results
        """
        payload = {
            'text': text,
            'source': source
        }

        response = self._request('POST', '/ai/sentiment', json_data=payload)
        return response.json()

    # Webhook Management

    def register_webhook(self, endpoint: str, events: List[str],
                        secret: Optional[str] = None) -> str:
        """
        Register a webhook for real-time notifications

        Args:
            endpoint: Your webhook endpoint URL
            events: List of events to subscribe to
            secret: Optional secret for webhook signature verification

        Returns:
            Webhook ID
        """
        payload = {
            'endpoint': endpoint,
            'events': events
        }

        if secret:
            payload['secret'] = secret

        response = self._request('POST', '/webhooks/register', json_data=payload)
        result = response.json()

        return result['webhook_id']

    def unregister_webhook(self, webhook_id: str) -> bool:
        """
        Unregister a webhook

        Args:
            webhook_id: ID of webhook to remove

        Returns:
            Success status
        """
        response = self._request('DELETE', f'/webhooks/{webhook_id}')
        return response.status_code == 200

    def list_webhooks(self) -> List[Dict]:
        """
        List all registered webhooks

        Returns:
            List of webhook configurations
        """
        response = self._request('GET', '/webhooks')
        return response.json()['webhooks']

    # Integration Methods

    def connect_integration(self, provider: str, credentials: Dict) -> Dict:
        """
        Connect to third-party financial data provider

        Args:
            provider: Provider name ('bloomberg', 'refinitiv', 'morningstar', etc.)
            credentials: Authentication credentials for the provider

        Returns:
            Connection status and details
        """
        response = self._request('POST', f'/integrations/{provider}/connect',
                               json_data=credentials)
        return response.json()

    def disconnect_integration(self, provider: str) -> bool:
        """
        Disconnect from third-party provider

        Args:
            provider: Provider name

        Returns:
            Success status
        """
        response = self._request('POST', f'/integrations/{provider}/disconnect')
        return response.status_code == 200

    def get_integrated_data(self, provider: str, endpoint: str,
                           params: Optional[Dict] = None) -> Union[Dict, pd.DataFrame]:
        """
        Get data from connected third-party provider

        Args:
            provider: Provider name
            endpoint: API endpoint on the provider
            params: Optional query parameters

        Returns:
            Provider data (dict or DataFrame)
        """
        response = self._request('GET', f'/integrations/{provider}/{endpoint}',
                               params=params or {})
        return response.json()

    # Utility Methods

    def get_api_status(self) -> Dict:
        """
        Get API status and health information

        Returns:
            Dictionary with API health status
        """
        try:
            response = self._request('GET', '/health')
            return response.json()
        except Exception as e:
            return {
                'status': 'error',
                'message': str(e),
                'timestamp': datetime.now().isoformat()
            }

    def get_usage_stats(self) -> Dict:
        """
        Get API usage statistics

        Returns:
            Dictionary with usage statistics
        """
        response = self._request('GET', '/usage/stats')
        return response.json()

    def create_portfolio_from_csv(self, csv_path: str,
                                 symbol_col: str = 'symbol',
                                 weight_col: str = 'weight') -> Dict:
        """
        Create portfolio from CSV file

        Args:
            csv_path: Path to CSV file
            symbol_col: Column name for symbols
            weight_col: Column name for weights

        Returns:
            Portfolio dictionary
        """
        df = pd.read_csv(csv_path)
        assets = []

        for _, row in df.iterrows():
            assets.append({
                'symbol': row[symbol_col],
                'weight': row[weight_col],
                'quantity': row.get('quantity', 100)  # Default quantity
            })

        return {
            'assets': assets,
            'created_from': 'csv',
            'timestamp': datetime.now().isoformat()
        }

    def export_to_excel(self, data: Dict, filename: str):
        """
        Export analysis results to Excel file

        Args:
            data: Analysis results dictionary
            filename: Output filename
        """
        with pd.ExcelWriter(filename, engine='openpyxl') as writer:
            for sheet_name, sheet_data in data.items():
                if isinstance(sheet_data, list):
                    pd.DataFrame(sheet_data).to_excel(writer, sheet_name=sheet_name, index=False)
                elif isinstance(sheet_data, dict):
                    pd.DataFrame([sheet_data]).to_excel(writer, sheet_name=sheet_name, index=False)


# Convenience functions for common use cases

def quick_portfolio_analysis(symbols: List[str],
                           weights: Optional[List[float]] = None) -> Dict:
    """
    Quick portfolio analysis for a list of symbols

    Args:
        symbols: List of stock symbols
        weights: Optional list of weights (equal weight if not provided)

    Returns:
        Portfolio analysis results
    """
    if not weights:
        weights = [1.0 / len(symbols)] * len(symbols)

    portfolio = {
        'assets': [
            {'symbol': symbol, 'weight': weight}
            for symbol, weight in zip(symbols, weights)
        ]
    }

    api = FinanceAnalystAPI()
    return api.analyze_portfolio(portfolio)


def bulk_quote_request(symbols: List[str]) -> Dict:
    """
    Get quotes for multiple symbols efficiently

    Args:
        symbols: List of stock symbols

    Returns:
        Dictionary with quotes for all symbols
    """
    api = FinanceAnalystAPI()

    # Note: This would typically use a bulk endpoint
    # For now, we'll make individual requests
    quotes = {}
    for symbol in symbols:
        try:
            quotes[symbol] = api.get_stock_quote(symbol)
        except Exception as e:
            quotes[symbol] = {'error': str(e)}

    return quotes


# Example usage and demo functions

def demo_basic_usage():
    """Demonstrate basic API usage"""
    print("FinanceAnalyst Pro Python SDK Demo")
    print("=" * 40)

    # Initialize API (replace with your actual API key)
    api = FinanceAnalystAPI(api_key='your_api_key_here')

    # Get API status
    print("API Status:", api.get_api_status())

    # Example: Get stock quote
    try:
        quote = api.get_stock_quote('AAPL')
        print(f"AAPL Quote: ${quote.get('price', 'N/A')}")
    except Exception as e:
        print(f"Quote request failed: {e}")

    # Example: Simple portfolio analysis
    try:
        portfolio = {
            'assets': [
                {'symbol': 'AAPL', 'weight': 0.4},
                {'symbol': 'MSFT', 'weight': 0.3},
                {'symbol': 'GOOGL', 'weight': 0.3}
            ]
        }

        analysis = api.analyze_portfolio(portfolio)
        print(f"Portfolio Analysis: {analysis.get('status', 'Completed')}")
    except Exception as e:
        print(f"Portfolio analysis failed: {e}")


if __name__ == "__main__":
    demo_basic_usage()