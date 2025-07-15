import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Progress } from '../../../components/ui/Progress';
import { Alert, AlertDescription } from '../../../components/ui/Alert';
import { CheckCircle, XCircle, AlertTriangle, Key, Wifi } from 'lucide-react';

const ApiStatusPanel = ({ 
  apiHealthStatus = {}, 
  realDataEnabled = false, 
  dataSources = [],
  dataQuality = {} 
}) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'error':
      case 'disconnected':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const connectedSources = dataSources.filter(source => source.status === 'connected').length;
  const totalSources = dataSources.length;
  const connectionPercentage = totalSources > 0 ? (connectedSources / totalSources) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="h-5 w-5" />
          API Status & Data Quality
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(realDataEnabled ? 'connected' : 'disconnected')}
            <span className="font-medium">
              Real Data: {realDataEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <Badge className={getStatusColor(realDataEnabled ? 'connected' : 'disconnected')}>
            {realDataEnabled ? 'Live' : 'Demo Mode'}
          </Badge>
        </div>

        {/* Connection Health */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Connection Health</span>
            <span>{connectedSources}/{totalSources} sources</span>
          </div>
          <Progress value={connectionPercentage} className="h-2" />
        </div>

        {/* Data Sources Status */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Data Sources</h4>
          <div className="space-y-2">
            {dataSources.map((source) => (
              <div key={source.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {getStatusIcon(source.status)}
                  <span>{source.name}</span>
                  {source.requiresKey && (
                    <Key className="h-3 w-3 text-gray-400" title="Requires API Key" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getStatusColor(source.status)}`}
                  >
                    {source.status}
                  </Badge>
                  {source.status === 'connected' && (
                    <span className="text-xs text-gray-500">{source.latency}ms</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API Health Details */}
        {Object.keys(apiHealthStatus).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">API Health Details</h4>
            <div className="space-y-1 text-xs">
              {Object.entries(apiHealthStatus).map(([source, health]) => (
                <div key={source} className="flex items-center justify-between">
                  <span className="capitalize">{source.toLowerCase().replace('_', ' ')}</span>
                  <div className="flex items-center gap-2">
                    <span>Success: {(health.successRate * 100).toFixed(1)}%</span>
                    <span>Avg: {health.avgResponseTime.toFixed(0)}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Quality Metrics */}
        {Object.keys(dataQuality).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Data Quality</h4>
            <div className="space-y-1">
              {Object.entries(dataQuality).map(([symbol, quality]) => (
                <div key={symbol} className="flex items-center justify-between text-sm">
                  <span>{symbol}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={quality} className="h-1 w-16" />
                    <span className="text-xs">{quality}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alerts */}
        {!realDataEnabled && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Running in demo mode. Add API keys to enable real-time data.
              <br />
              <span className="text-xs text-gray-600">
                Set VITE_ALPHA_VANTAGE_API_KEY or VITE_FMP_API_KEY in your .env file
              </span>
            </AlertDescription>
          </Alert>
        )}

        {realDataEnabled && connectedSources < totalSources && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Some data sources are unavailable. Check your API keys and network connection.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default ApiStatusPanel;
