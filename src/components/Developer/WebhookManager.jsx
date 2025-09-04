import {
  Zap,
  Plus,
  Minus,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe,
  Shield,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

const WebhookManager = ({ className = '' }) => {
  const [webhooks, setWebhooks] = useState([
    {
      id: 'webhook_001',
      endpoint: 'https://myapp.com/webhooks/finance',
      events: ['market_data', 'portfolio_alert'],
      secret: 'wh_sec_123456789',
      active: true,
      createdAt: '2024-01-10T10:00:00Z',
      lastTriggered: '2024-01-15T14:30:00Z',
      successCount: 95,
      failureCount: 2
    },
    {
      id: 'webhook_002',
      endpoint: 'https://tradingbot.com/alerts',
      events: ['analysis_complete', 'news_alert'],
      secret: 'wh_sec_abcdef123',
      active: true,
      createdAt: '2024-01-12T08:15:00Z',
      lastTriggered: '2024-01-15T16:45:00Z',
      successCount: 87,
      failureCount: 1
    }
  ]);

  const [newWebhook, setNewWebhook] = useState({
    endpoint: '',
    events: [],
    secret: '',
    active: true
  });

  const [showSecret, setShowSecret] = useState({});
  const [isCreating, setIsCreating] = useState(false);
  const [recentDeliveries, setRecentDeliveries] = useState([
    {
      id: 'del_001',
      webhookId: 'webhook_001',
      event: 'market_data',
      status: 'success',
      timestamp: '2024-01-15T16:50:00Z',
      responseTime: 245
    },
    {
      id: 'del_002',
      webhookId: 'webhook_002',
      event: 'news_alert',
      status: 'success',
      timestamp: '2024-01-15T16:45:00Z',
      responseTime: 189
    },
    {
      id: 'del_003',
      webhookId: 'webhook_001',
      event: 'portfolio_alert',
      status: 'failed',
      timestamp: '2024-01-15T16:30:00Z',
      error: 'Connection timeout'
    }
  ]);

  const availableEvents = [
    {
      id: 'market_data',
      name: 'Market Data Updates',
      description: 'Real-time price and volume updates'
    },
    {
      id: 'portfolio_alert',
      name: 'Portfolio Alerts',
      description: 'Risk threshold breaches and warnings'
    },
    {
      id: 'analysis_complete',
      name: 'Analysis Complete',
      description: 'When analysis jobs finish processing'
    },
    {
      id: 'news_alert',
      name: 'News Alerts',
      description: 'Breaking financial news and announcements'
    },
    {
      id: 'earnings_release',
      name: 'Earnings Releases',
      description: 'Company earnings announcements'
    },
    { id: 'economic_data', name: 'Economic Data', description: 'Economic indicators and reports' },
    {
      id: 'options_activity',
      name: 'Options Activity',
      description: 'Unusual options trading activity'
    },
    {
      id: 'sentiment_change',
      name: 'Sentiment Changes',
      description: 'Significant sentiment shifts'
    }
  ];

  const createWebhook = async () => {
    if (!newWebhook.endpoint || newWebhook.events.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    setIsCreating(true);

    try {
      // Mock API call - in real implementation, this would call the webhook registration endpoint
      await new Promise(resolve => setTimeout(resolve, 1500));

      const webhook = {
        id: `webhook_${Date.now()}`,
        ...newWebhook,
        secret: newWebhook.secret || `wh_sec_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        lastTriggered: null,
        successCount: 0,
        failureCount: 0
      };

      setWebhooks(prev => [...prev, webhook]);
      setNewWebhook({
        endpoint: '',
        events: [],
        secret: '',
        active: true
      });
    } catch (error) {
      console.error('Failed to create webhook:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const deleteWebhook = webhookId => {
    setWebhooks(prev => prev.filter(w => w.id !== webhookId));
  };

  const toggleWebhook = webhookId => {
    setWebhooks(prev => prev.map(w => (w.id === webhookId ? { ...w, active: !w.active } : w)));
  };

  const toggleEvent = eventId => {
    setNewWebhook(prev => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter(e => e !== eventId)
        : [...prev.events, eventId]
    }));
  };

  const generateSecret = () => {
    const secret = `wh_sec_${Math.random().toString(36).substr(2, 9)}${Date.now().toString(36)}`;
    setNewWebhook(prev => ({ ...prev, secret }));
  };

  const formatTimestamp = timestamp => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  const getSuccessRate = webhook => {
    const total = webhook.successCount + webhook.failureCount;
    return total > 0 ? ((webhook.successCount / total) * 100).toFixed(1) : 0;
  };

  const getDeliveryStatusColor = status => {
    switch (status) {
      case 'success':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      case 'pending':
        return 'text-yellow-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className={`bg-slate-800 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-500/20 rounded-lg">
            <Zap className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Webhook Manager</h3>
            <p className="text-xs text-slate-400">
              {webhooks.length} webhook{webhooks.length !== 1 ? 's' : ''} configured
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setNewWebhook(prev => ({ ...prev, active: !prev.active }))}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Create webhook"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Create Webhook Form */}
      {newWebhook.active && (
        <div className="p-4 border-b border-slate-700 bg-slate-700/50">
          <h4 className="text-sm font-semibold text-white mb-4">Create New Webhook</h4>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-2">Endpoint URL</label>
              <input
                type="url"
                value={newWebhook.endpoint}
                onChange={e => setNewWebhook(prev => ({ ...prev, endpoint: e.target.value }))}
                placeholder="https://your-app.com/webhooks/finance"
                className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Events to Subscribe</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {availableEvents.map(event => (
                  <label key={event.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={newWebhook.events.includes(event.id)}
                      onChange={() => toggleEvent(event.id)}
                      className="rounded border-slate-500"
                    />
                    <div>
                      <div className="text-white">{event.name}</div>
                      <div className="text-xs text-slate-400">{event.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Webhook Secret</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={newWebhook.secret}
                  onChange={e => setNewWebhook(prev => ({ ...prev, secret: e.target.value }))}
                  placeholder="Auto-generate or enter custom secret"
                  className="flex-1 px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                />
                <button
                  onClick={generateSecret}
                  className="px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white text-sm rounded transition-colors"
                >
                  Generate
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setNewWebhook(prev => ({ ...prev, active: false }))}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white text-sm rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createWebhook}
                disabled={isCreating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white text-sm rounded transition-colors"
              >
                {isCreating ? 'Creating...' : 'Create Webhook'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Webhooks List */}
      <div className="p-4 space-y-4">
        <h4 className="text-sm font-semibold text-white">Active Webhooks</h4>

        {webhooks.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No webhooks configured</p>
            <p className="text-sm">Create your first webhook to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {webhooks.map(webhook => (
              <div
                key={webhook.id}
                className="bg-slate-700/50 rounded-lg p-4 border border-slate-600"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Globe className="w-4 h-4 text-blue-400" />
                      <code className="text-purple-400 font-mono text-sm">{webhook.endpoint}</code>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          webhook.active
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {webhook.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 mb-3">
                      Created: {formatTimestamp(webhook.createdAt)} | Last triggered:{' '}
                      {formatTimestamp(webhook.lastTriggered)}
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-green-400">{webhook.successCount} success</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span className="text-red-400">{webhook.failureCount} failed</span>
                      </div>
                      <div className="text-slate-400">{getSuccessRate(webhook)}% success rate</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleWebhook(webhook.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        webhook.active
                          ? 'text-green-400 hover:bg-green-500/20'
                          : 'text-slate-400 hover:bg-slate-600'
                      }`}
                      aria-label={webhook.active ? 'Deactivate webhook' : 'Activate webhook'}
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteWebhook(webhook.id)}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      aria-label="Delete webhook"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h6 className="text-white font-medium text-sm mb-2">Subscribed Events:</h6>
                  <div className="flex flex-wrap gap-2">
                    {webhook.events.map(eventId => {
                      const event = availableEvents.find(e => e.id === eventId);
                      return (
                        <span
                          key={eventId}
                          className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs"
                        >
                          {event?.name || eventId}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-slate-400" />
                      <span className="text-xs text-slate-400">Secret:</span>
                      <code className="text-xs text-slate-300 font-mono">
                        {showSecret[webhook.id]
                          ? webhook.secret
                          : `${webhook.secret.substring(0, 10)}...`}
                      </code>
                      <button
                        onClick={() =>
                          setShowSecret(prev => ({
                            ...prev,
                            [webhook.id]: !prev[webhook.id]
                          }))
                        }
                        className="text-slate-400 hover:text-white"
                      >
                        {showSecret[webhook.id] ? (
                          <EyeOff className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                    <div className="text-xs text-slate-500">ID: {webhook.id}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Deliveries */}
      {recentDeliveries.length > 0 && (
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-white">Recent Deliveries</h4>
            <button className="text-xs text-slate-400 hover:text-white">View All</button>
          </div>

          <div className="space-y-2">
            {recentDeliveries.slice(0, 5).map(delivery => (
              <div
                key={delivery.id}
                className="flex items-center justify-between p-3 bg-slate-700/30 rounded"
              >
                <div className="flex items-center gap-3">
                  {delivery.status === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  )}
                  <div>
                    <div className="text-sm text-white">{delivery.event}</div>
                    <div className="text-xs text-slate-400">
                      {formatTimestamp(delivery.timestamp)}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-sm ${getDeliveryStatusColor(delivery.status)}`}>
                    {delivery.status}
                  </div>
                  {delivery.responseTime && (
                    <div className="text-xs text-slate-500">{delivery.responseTime}ms</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WebhookManager;
