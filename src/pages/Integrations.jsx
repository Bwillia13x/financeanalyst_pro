import { motion } from 'framer-motion';
import {
  Zap,
  Settings,
  Plus,
  CheckCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  Globe,
  Database,
  BarChart3,
  TrendingUp,
  FileText,
  Code,
  Webhook,
  Key,
  Link as LinkIcon
} from 'lucide-react';
import React, { useState } from 'react';

import Button from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import Header from '../components/ui/Header';
import StatusBadge from '../components/ui/StatusBadge';

const Integrations = () => {
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All Integrations' },
    { id: 'data', label: 'Data Providers' },
    { id: 'trading', label: 'Trading Platforms' },
    { id: 'analytics', label: 'Analytics Tools' },
    { id: 'reporting', label: 'Reporting' },
    { id: 'api', label: 'APIs & Webhooks' }
  ];

  const integrations = [
    {
      id: 1,
      name: 'Bloomberg Terminal',
      description: 'Professional-grade market data and analytics platform',
      category: 'data',
      status: 'connected',
      provider: 'Bloomberg L.P.',
      icon: Globe,
      color: 'bg-warning',
      features: ['Real-time market data', 'Historical data', 'News feeds', 'Analytics'],
      pricing: 'Enterprise',
      lastSync: '2 minutes ago'
    },
    {
      id: 2,
      name: 'Interactive Brokers',
      description: 'Multi-asset trading platform with global market access',
      category: 'trading',
      status: 'available',
      provider: 'Interactive Brokers',
      icon: BarChart3,
      color: 'bg-accent',
      features: ['Portfolio tracking', 'Order execution', 'Account data', 'Risk management'],
      pricing: 'Free with account',
      lastSync: null
    },
    {
      id: 3,
      name: 'Refinitiv Eikon',
      description: 'Comprehensive financial data and analytics solution',
      category: 'data',
      status: 'error',
      provider: 'Refinitiv',
      icon: Database,
      color: 'bg-accent',
      features: ['Market data', 'Company fundamentals', 'ESG data', 'Research'],
      pricing: 'Subscription',
      lastSync: 'Failed 2 hours ago'
    },
    {
      id: 4,
      name: 'Alpha Vantage',
      description: 'Free APIs for real-time and historical financial data',
      category: 'data',
      status: 'connected',
      provider: 'Alpha Vantage Inc.',
      icon: TrendingUp,
      color: 'bg-success',
      features: ['Stock prices', 'Technical indicators', 'Forex data', 'Crypto data'],
      pricing: 'Freemium',
      lastSync: '10 minutes ago'
    },
    {
      id: 5,
      name: 'Slack',
      description: 'Team communication and notification platform',
      category: 'reporting',
      status: 'connected',
      provider: 'Slack Technologies',
      icon: LinkIcon,
      color: 'bg-accent',
      features: ['Alert notifications', 'Report sharing', 'Team collaboration', 'Bot integration'],
      pricing: 'Free/Paid',
      lastSync: '5 minutes ago'
    },
    {
      id: 6,
      name: 'Tableau',
      description: 'Advanced data visualization and business intelligence',
      category: 'analytics',
      status: 'available',
      provider: 'Salesforce',
      icon: BarChart3,
      color: 'bg-accent',
      features: ['Data visualization', 'Dashboard creation', 'Advanced analytics', 'Reporting'],
      pricing: 'Subscription',
      lastSync: null
    },
    {
      id: 7,
      name: 'Webhook Integration',
      description: 'Custom webhook endpoints for real-time data streaming',
      category: 'api',
      status: 'configured',
      provider: 'Custom',
      icon: Webhook,
      color: 'bg-muted',
      features: ['Real-time updates', 'Custom triggers', 'Data streaming', 'Event notifications'],
      pricing: 'Free',
      lastSync: 'Continuous'
    },
    {
      id: 8,
      name: 'Microsoft Excel',
      description: 'Export data and models directly to Excel spreadsheets',
      category: 'reporting',
      status: 'connected',
      provider: 'Microsoft',
      icon: FileText,
      color: 'bg-success',
      features: ['Data export', 'Model templates', 'Live data feeds', 'Automated reports'],
      pricing: 'Office 365',
      lastSync: '1 hour ago'
    }
  ];

  const getStatusInfo = status => {
    switch (status) {
      case 'connected':
        return { icon: CheckCircle, tone: 'success', label: 'Connected' };
      case 'configured':
        return { icon: Settings, tone: 'neutral', label: 'Configured' };
      case 'error':
        return { icon: AlertTriangle, tone: 'destructive', label: 'Error' };
      case 'available':
        return { icon: Clock, tone: 'neutral', label: 'Available' };
      default:
        return { icon: Clock, tone: 'neutral', label: 'Unknown' };
    }
  };

  const filteredIntegrations =
    activeCategory === 'all'
      ? integrations
      : integrations.filter(integration => integration.category === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Integrations</h1>
            <p className="text-foreground-secondary">
              Connect your financial analysis platform with external data sources and tools
            </p>
          </div>

          {/* Integration Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-success/10 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">5</p>
                  <p className="text-sm text-foreground-secondary">Connected</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Zap className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">3</p>
                  <p className="text-sm text-foreground-secondary">Available</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">1</p>
                  <p className="text-sm text-foreground-secondary">Error</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Database className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">50+</p>
                  <p className="text-sm text-foreground-secondary">Available</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Category Filter */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeCategory === category.id
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-card text-foreground hover:bg-muted/50'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* Integrations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIntegrations.map(integration => {
              const statusInfo = getStatusInfo(integration.status);

              return (
                <motion.div
                  key={integration.id}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="p-6 h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${integration.color}`}>
                          <integration.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{integration.name}</h3>
                          <p className="text-sm text-foreground-secondary">{integration.provider}</p>
                        </div>
                      </div>
                      <div
                        className={`p-1 rounded-full ${
                          statusInfo.tone === 'success'
                            ? 'bg-success/10'
                            : statusInfo.tone === 'destructive'
                              ? 'bg-destructive/10'
                              : statusInfo.tone === 'warning'
                                ? 'bg-warning/10'
                                : 'bg-muted'
                        }`}
                      >
                        <statusInfo.icon
                          className={`w-4 h-4 ${
                            statusInfo.tone === 'success'
                              ? 'text-success'
                              : statusInfo.tone === 'destructive'
                                ? 'text-destructive'
                                : statusInfo.tone === 'warning'
                                  ? 'text-warning'
                                  : 'text-foreground-secondary'
                          }`}
                        />
                      </div>
                    </div>

                    <p className="text-sm text-foreground-secondary mb-4">{integration.description}</p>

                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground-secondary">Status</span>
                        <StatusBadge tone={statusInfo.tone} size="xs" variant="soft">
                          {statusInfo.label}
                        </StatusBadge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground-secondary">Pricing</span>
                        <span className="font-medium">{integration.pricing}</span>
                      </div>
                      {integration.lastSync && (
                        <div className="flex justify-between text-sm">
                          <span className="text-foreground-secondary">Last Sync</span>
                          <span className="font-medium">{integration.lastSync}</span>
                        </div>
                      )}
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-foreground mb-2">Features</h4>
                      <div className="flex flex-wrap gap-1">
                        {integration.features.slice(0, 3).map((feature, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-muted text-foreground-secondary text-xs rounded-md"
                          >
                            {feature}
                          </span>
                        ))}
                        {integration.features.length > 3 && (
                          <span className="px-2 py-1 bg-muted text-foreground-secondary text-xs rounded-md">
                            +{integration.features.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      {integration.status === 'connected' || integration.status === 'configured' ? (
                        <>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Settings className="w-4 h-4 mr-1" />
                            Configure
                          </Button>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </>
                      ) : integration.status === 'error' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                        >
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          Fix Error
                        </Button>
                      ) : (
                        <Button size="sm" className="flex-1">
                          <Plus className="w-4 h-4 mr-1" />
                          Connect
                        </Button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Custom Integration CTA */}
          <div className="mt-12">
            <Card className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-muted rounded-lg">
                  <Code className="w-8 h-8 text-foreground-secondary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Need a Custom Integration?
              </h3>
              <p className="text-foreground-secondary mb-6 max-w-2xl mx-auto">
                We can help you build custom integrations with your specific data sources, trading
                platforms, or internal systems. Contact our integration team to discuss your
                requirements.
              </p>
              <div className="flex justify-center space-x-4">
                <Button variant="outline">
                  <Key className="w-4 h-4 mr-2" />
                  API Documentation
                </Button>
                <Button>Contact Integration Team</Button>
              </div>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Integrations;
