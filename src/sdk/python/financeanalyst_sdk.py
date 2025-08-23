"""
FinanceAnalyst Pro Python SDK
Official Python client library for FinanceAnalyst Pro API v1
"""

import requests
import json
import time
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
import pandas as pd
from dataclasses import dataclass
from enum import Enum

__version__ = "1.0.0"
__author__ = "FinanceAnalyst Pro Team"


class APIError(Exception):
    """Base exception for API errors"""
    def __init__(self, message: str, status_code: int = None, response: Dict = None):
        self.message = message
        self.status_code = status_code
        self.response = response
        super().__init__(self.message)


class RateLimitError(APIError):
    """Exception raised when rate limit is exceeded"""
    pass


class AuthenticationError(APIError):
    """Exception raised for authentication failures"""
    pass


class ValidationError(APIError):
    """Exception raised for request validation failures"""
    pass


@dataclass
class APIResponse:
    """Standardized API response wrapper"""
    success: bool
    data: Dict
    metadata: Dict = None
    error: Dict = None
    request_id: str = None


class AnalysisType(Enum):
    """Supported analysis types"""
    BANKING_CREDIT_PORTFOLIO = "banking/credit-portfolio"
    REAL_ESTATE_VALUATION = "real-estate/property-valuation"
    HEALTHCARE_PIPELINE = "healthcare/drug-pipeline"
    ENERGY_RESERVES = "energy/reserves-valuation"
    SAAS_METRICS = "technology/saas-metrics"


class ExportFormat(Enum):
    """Supported export formats"""
    PDF = "pdf"
    EXCEL = "excel"
    CSV = "csv"


class ChartType(Enum):
    """Supported chart types"""
    LINE = "line"
    BAR = "bar"
    PIE = "pie"
    SCATTER = "scatter"
    CANDLESTICK = "candlestick"
    HEATMAP = "heatmap"


class FinanceAnalystClient:
    """Main client class for FinanceAnalyst Pro API"""
    
    def __init__(self, api_key: str = None, base_url: str = None, timeout: int = 30):
        """
        Initialize the FinanceAnalyst Pro client
        
        Args:
            api_key: Your API key
            base_url: API base URL (defaults to production)
            timeout: Request timeout in seconds
        """
        self.api_key = api_key
        self.base_url = base_url or "https://api.financeanalyst.pro/v1"
        self.timeout = timeout
        self.session = requests.Session()
        
        # Set default headers
        self.session.headers.update({
            'X-API-Key': self.api_key,
            'Content-Type': 'application/json',
            'User-Agent': f'financeanalyst-python-sdk/{__version__}'
        })
    
    def _make_request(self, method: str, endpoint: str, **kwargs) -> APIResponse:
        """Make HTTP request to API"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        try:
            response = self.session.request(
                method=method,
                url=url,
                timeout=self.timeout,
                **kwargs
            )
            
            # Handle rate limiting
            if response.status_code == 429:
                raise RateLimitError("Rate limit exceeded", response.status_code, response.json())
            
            # Handle authentication errors
            if response.status_code == 401:
                raise AuthenticationError("Authentication failed", response.status_code, response.json())
            
            # Handle validation errors
            if response.status_code == 400:
                raise ValidationError("Request validation failed", response.status_code, response.json())
            
            # Raise for other HTTP errors
            response.raise_for_status()
            
            data = response.json()
            return APIResponse(
                success=data.get('success', True),
                data=data.get('data', {}),
                metadata=data.get('metadata', {}),
                error=data.get('error'),
                request_id=response.headers.get('X-Request-ID')
            )
            
        except requests.exceptions.RequestException as e:
            raise APIError(f"Request failed: {str(e)}")
    
    def get(self, endpoint: str, params: Dict = None) -> APIResponse:
        """Make GET request"""
        return self._make_request('GET', endpoint, params=params)
    
    def post(self, endpoint: str, data: Dict = None) -> APIResponse:
        """Make POST request"""
        return self._make_request('POST', endpoint, json=data)
    
    def put(self, endpoint: str, data: Dict = None) -> APIResponse:
        """Make PUT request"""
        return self._make_request('PUT', endpoint, json=data)
    
    def delete(self, endpoint: str) -> APIResponse:
        """Make DELETE request"""
        return self._make_request('DELETE', endpoint)


class CompanyData:
    """Company data management"""
    
    def __init__(self, client: FinanceAnalystClient):
        self.client = client
    
    def get_financials(self, company_id: str, period: str = 'annual', years: int = 5) -> pd.DataFrame:
        """
        Get company financial data
        
        Args:
            company_id: Company identifier
            period: 'annual' or 'quarterly'
            years: Number of years of data
            
        Returns:
            DataFrame with financial data
        """
        response = self.client.get(
            f'companies/{company_id}/financials',
            params={'period': period, 'years': years}
        )
        
        if response.success:
            return pd.DataFrame(response.data['financials'])
        else:
            raise APIError(f"Failed to get financials: {response.error}")
    
    def get_market_data(self, symbols: List[str], period: str = '1y') -> Dict:
        """
        Get market data for symbols
        
        Args:
            symbols: List of symbols
            period: Time period
            
        Returns:
            Market data dictionary
        """
        response = self.client.get(
            'markets/indices',
            params={'symbols': ','.join(symbols), 'period': period}
        )
        
        if response.success:
            return response.data['market_data']
        else:
            raise APIError(f"Failed to get market data: {response.error}")


class SpecializedAnalytics:
    """Specialized analytics for different industries"""
    
    def __init__(self, client: FinanceAnalystClient):
        self.client = client
    
    def analyze_banking_portfolio(self, portfolio_data: Dict, analysis_type: str = 'risk_assessment') -> Dict:
        """
        Analyze banking credit portfolio
        
        Args:
            portfolio_data: Portfolio data dictionary
            analysis_type: Type of analysis to perform
            
        Returns:
            Analysis results
        """
        response = self.client.post(
            'analytics/specialized/banking/credit-portfolio',
            data={
                'portfolio_data': portfolio_data,
                'analysis_type': analysis_type
            }
        )
        
        if response.success:
            return response.data
        else:
            raise APIError(f"Banking analysis failed: {response.error}")
    
    def analyze_real_estate(self, property_data: Dict, methods: List[str] = None) -> Dict:
        """
        Analyze real estate property
        
        Args:
            property_data: Property data dictionary
            methods: Valuation methods to use
            
        Returns:
            Valuation results
        """
        methods = methods or ['dcf', 'cap_rate', 'comparable_sales']
        
        response = self.client.post(
            'analytics/specialized/real-estate/property-valuation',
            data={
                'property_data': property_data,
                'valuation_methods': methods
            }
        )
        
        if response.success:
            return response.data
        else:
            raise APIError(f"Real estate analysis failed: {response.error}")
    
    def analyze_drug_pipeline(self, pipeline_data: Dict, scope: List[str] = None) -> Dict:
        """
        Analyze healthcare drug pipeline
        
        Args:
            pipeline_data: Pipeline data dictionary
            scope: Analysis scope
            
        Returns:
            Pipeline analysis results
        """
        scope = scope or ['valuation', 'clinical_trials', 'regulatory_risk']
        
        response = self.client.post(
            'analytics/specialized/healthcare/drug-pipeline',
            data={
                'pipeline_data': pipeline_data,
                'analysis_scope': scope
            }
        )
        
        if response.success:
            return response.data
        else:
            raise APIError(f"Healthcare analysis failed: {response.error}")
    
    def analyze_energy_reserves(self, asset_data: Dict, methods: List[str] = None) -> Dict:
        """
        Analyze energy reserves
        
        Args:
            asset_data: Asset data dictionary
            methods: Valuation methods
            
        Returns:
            Reserves valuation results
        """
        methods = methods or ['pv10', 'pv15', 'risked_value']
        
        response = self.client.post(
            'analytics/specialized/energy/reserves-valuation',
            data={
                'asset_data': asset_data,
                'valuation_methods': methods
            }
        )
        
        if response.success:
            return response.data
        else:
            raise APIError(f"Energy analysis failed: {response.error}")
    
    def analyze_saas_metrics(self, saas_data: Dict, categories: List[str] = None) -> Dict:
        """
        Analyze SaaS metrics
        
        Args:
            saas_data: SaaS data dictionary
            categories: Metric categories to analyze
            
        Returns:
            SaaS metrics analysis
        """
        categories = categories or ['revenue', 'customer', 'unit_economics', 'cohort']
        
        response = self.client.post(
            'analytics/specialized/technology/saas-metrics',
            data={
                'saas_data': saas_data,
                'metric_categories': categories
            }
        )
        
        if response.success:
            return response.data
        else:
            raise APIError(f"SaaS analysis failed: {response.error}")


class AIAnalytics:
    """AI/ML powered analytics"""
    
    def __init__(self, client: FinanceAnalystClient):
        self.client = client
    
    def forecast_revenue(self, company_data: Dict, horizon: int = 12, models: List[str] = None) -> Dict:
        """
        Forecast company revenue using AI models
        
        Args:
            company_data: Company historical data
            horizon: Forecast horizon in months
            models: Preferred models to use
            
        Returns:
            Revenue forecast results
        """
        response = self.client.post(
            'ai/predictions/revenue',
            data={
                'company_data': company_data,
                'forecast_horizon': horizon,
                'model_preferences': models
            }
        )
        
        if response.success:
            return response.data
        else:
            raise APIError(f"Revenue forecasting failed: {response.error}")
    
    def analyze_document(self, document: Dict, analysis_types: List[str] = None) -> Dict:
        """
        Analyze document using NLP
        
        Args:
            document: Document data
            analysis_types: Types of analysis to perform
            
        Returns:
            Document analysis results
        """
        analysis_types = analysis_types or ['sentiment', 'entities', 'metrics', 'summary']
        
        response = self.client.post(
            'ai/nlp/analyze-document',
            data={
                'document': document,
                'analysis_types': analysis_types
            }
        )
        
        if response.success:
            return response.data
        else:
            raise APIError(f"Document analysis failed: {response.error}")
    
    def recognize_chart(self, image_data: Dict, extract_data: bool = True) -> Dict:
        """
        Recognize and extract data from chart images
        
        Args:
            image_data: Image data dictionary
            extract_data: Whether to extract underlying data
            
        Returns:
            Chart recognition results
        """
        response = self.client.post(
            'ai/computer-vision/recognize-chart',
            data={
                'image_data': image_data,
                'extract_data': extract_data
            }
        )
        
        if response.success:
            return response.data
        else:
            raise APIError(f"Chart recognition failed: {response.error}")


class Collaboration:
    """Collaboration and workspace management"""
    
    def __init__(self, client: FinanceAnalystClient):
        self.client = client
    
    def get_workspace_users(self, workspace_id: str) -> List[Dict]:
        """Get users in workspace"""
        response = self.client.get(f'workspaces/{workspace_id}/users')
        
        if response.success:
            return response.data['users']
        else:
            raise APIError(f"Failed to get workspace users: {response.error}")
    
    def create_comment(self, analysis_id: str, content: str, parent_id: str = None) -> Dict:
        """Create a comment on analysis"""
        response = self.client.post(
            'comments',
            data={
                'analysis_id': analysis_id,
                'content': content,
                'parent_id': parent_id
            }
        )
        
        if response.success:
            return response.data
        else:
            raise APIError(f"Failed to create comment: {response.error}")
    
    def get_version_history(self, analysis_id: str, limit: int = 20) -> List[Dict]:
        """Get version history for analysis"""
        response = self.client.get(
            f'versions/{analysis_id}/history',
            params={'limit': limit}
        )
        
        if response.success:
            return response.data['versions']
        else:
            raise APIError(f"Failed to get version history: {response.error}")


class Visualization:
    """Data visualization and export"""
    
    def __init__(self, client: FinanceAnalystClient):
        self.client = client
    
    def create_chart(self, data: Dict, chart_type: str, config: Dict = None) -> Dict:
        """
        Create visualization
        
        Args:
            data: Chart data
            chart_type: Type of chart
            config: Chart configuration
            
        Returns:
            Visualization result
        """
        response = self.client.post(
            'visualizations/create',
            data={
                'data': data,
                'chart_type': chart_type,
                'configuration': config or {}
            }
        )
        
        if response.success:
            return response.data
        else:
            raise APIError(f"Failed to create visualization: {response.error}")
    
    def export_analysis(self, analysis_id: str, format: str, template: str = None) -> Dict:
        """
        Export analysis
        
        Args:
            analysis_id: Analysis ID
            format: Export format (pdf, excel, csv)
            template: Template to use
            
        Returns:
            Export result with download URL
        """
        response = self.client.post(
            'export',
            data={
                'analysis_id': analysis_id,
                'format': format,
                'template': template
            }
        )
        
        if response.success:
            return response.data
        else:
            raise APIError(f"Failed to export analysis: {response.error}")


class WebhookManager:
    """Webhook management"""
    
    def __init__(self, client: FinanceAnalystClient):
        self.client = client
        self.base_endpoint = 'webhooks'
    
    def register_webhook(self, url: str, events: List[str], secret: str = None, **metadata) -> Dict:
        """Register a new webhook"""
        data = {
            'url': url,
            'events': events,
            'secret': secret,
            **metadata
        }
        
        response = self.client.post(self.base_endpoint, data=data)
        
        if response.success:
            return response.data
        else:
            raise APIError(f"Failed to register webhook: {response.error}")
    
    def list_webhooks(self, active_only: bool = True) -> List[Dict]:
        """List registered webhooks"""
        params = {'active': active_only} if active_only else {}
        response = self.client.get(self.base_endpoint, params=params)
        
        if response.success:
            return response.data['webhooks']
        else:
            raise APIError(f"Failed to list webhooks: {response.error}")
    
    def delete_webhook(self, webhook_id: str) -> bool:
        """Delete a webhook"""
        response = self.client.delete(f'{self.base_endpoint}/{webhook_id}')
        return response.success


class FinanceAnalyst:
    """Main SDK class providing access to all functionality"""
    
    def __init__(self, api_key: str = None, base_url: str = None, timeout: int = 30):
        """
        Initialize FinanceAnalyst SDK
        
        Args:
            api_key: Your API key
            base_url: API base URL
            timeout: Request timeout
        """
        self.client = FinanceAnalystClient(api_key, base_url, timeout)
        
        # Initialize service modules
        self.companies = CompanyData(self.client)
        self.analytics = SpecializedAnalytics(self.client)
        self.ai = AIAnalytics(self.client)
        self.collaboration = Collaboration(self.client)
        self.visualization = Visualization(self.client)
        self.webhooks = WebhookManager(self.client)
    
    def get_analysis(self, analysis_id: str) -> Dict:
        """Get analysis results by ID"""
        response = self.client.get(f'analysis/{analysis_id}/results')
        
        if response.success:
            return response.data
        else:
            raise APIError(f"Failed to get analysis: {response.error}")
    
    def calculate_dcf(self, company_id: str, assumptions: Dict, scenarios: List[str] = None) -> Dict:
        """Calculate DCF valuation"""
        scenarios = scenarios or ['base']
        
        response = self.client.post(
            'models/dcf/calculate',
            data={
                'company_id': company_id,
                'assumptions': assumptions,
                'scenarios': scenarios
            }
        )
        
        if response.success:
            return response.data
        else:
            raise APIError(f"DCF calculation failed: {response.error}")
    
    def get_benchmarks(self, sector: str, metrics: List[str] = None) -> Dict:
        """Get industry benchmarks"""
        params = {}
        if metrics:
            params['metrics'] = ','.join(metrics)
        
        response = self.client.get(f'benchmarks/industry/{sector}', params=params)
        
        if response.success:
            return response.data
        else:
            raise APIError(f"Failed to get benchmarks: {response.error}")


# Utility functions
def create_client(api_key: str = None, **kwargs) -> FinanceAnalyst:
    """Create a new FinanceAnalyst client"""
    return FinanceAnalyst(api_key=api_key, **kwargs)


def load_config(config_file: str = None) -> Dict:
    """Load configuration from file"""
    import os
    import configparser
    
    config_file = config_file or os.path.expanduser('~/.financeanalyst/config')
    
    if os.path.exists(config_file):
        config = configparser.ConfigParser()
        config.read(config_file)
        return dict(config['default']) if 'default' in config else {}
    
    return {}


# Export main classes and functions
__all__ = [
    'FinanceAnalyst',
    'FinanceAnalystClient', 
    'CompanyData',
    'SpecializedAnalytics',
    'AIAnalytics',
    'Collaboration',
    'Visualization',
    'WebhookManager',
    'APIError',
    'RateLimitError',
    'AuthenticationError',
    'ValidationError',
    'AnalysisType',
    'ExportFormat',
    'ChartType',
    'create_client',
    'load_config'
]
