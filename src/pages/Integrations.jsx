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
      color: 'bg-orange-500',
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
      color: 'bg-blue-500',
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
      color: 'bg-indigo-500',
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
      color: 'bg-green-500',
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
      color: 'bg-purple-500',
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
      color: 'bg-cyan-500',
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
      color: 'bg-gray-500',
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
      color: 'bg-emerald-500',
      features: ['Data export', 'Model templates', 'Live data feeds', 'Automated reports'],
      pricing: 'Office 365',
      lastSync: '1 hour ago'
    }
  ];

  const getStatusInfo = status => {
    switch (status) {
      case 'connected':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bg: 'bg-green-100',
          text: 'Connected'
        };
      case 'configured':
        return { icon: Settings, color: 'text-blue-500', bg: 'bg-blue-100', text: 'Configured' };
      case 'error':
        return { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-100', text: 'Error' };
      case 'available':
        return { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100', text: 'Available' };
      default:
        return { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100', text: 'Unknown' };
    }
  };

  const filteredIntegrations =
    activeCategory === 'all'
      ? integrations
      : integrations.filter(integration => integration.category === activeCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Integrations</h1>
            <p className="text-gray-600">
              Connect your financial analysis platform with external data sources and tools
            </p>
          </div>

          {/* Integration Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">5</p>
                  <p className="text-sm text-gray-600">Connected</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Zap className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">3</p>
                  <p className="text-sm text-gray-600">Available</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">1</p>
                  <p className="text-sm text-gray-600">Error</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Database className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">50+</p>
                  <p className="text-sm text-gray-600">Available</p>
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
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
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
                          <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                          <p className="text-sm text-gray-600">{integration.provider}</p>
                        </div>
                      </div>
                      <div className={`p-1 rounded-full ${statusInfo.bg}`}>
                        <statusInfo.icon className={`w-4 h-4 ${statusInfo.color}`} />
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">{integration.description}</p>

                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Status</span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}
                        >
                          {statusInfo.text}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Pricing</span>
                        <span className="font-medium">{integration.pricing}</span>
                      </div>
                      {integration.lastSync && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Last Sync</span>
                          <span className="font-medium">{integration.lastSync}</span>
                        </div>
                      )}
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Features</h4>
                      <div className="flex flex-wrap gap-1">
                        {integration.features.slice(0, 3).map((feature, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                          >
                            {feature}
                          </span>
                        ))}
                        {integration.features.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
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
                          className="flex-1 text-red-600 border-red-200"
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
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Code className="w-8 h-8 text-gray-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Need a Custom Integration?
              </h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
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
