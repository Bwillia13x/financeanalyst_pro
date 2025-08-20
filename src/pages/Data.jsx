import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Database, 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Settings, 
  Plus, 
  RefreshCw, 
  Download, 
  Upload,
  FileText,
  TrendingUp,
  Zap,
  Globe,
  Shield
} from 'lucide-react';

import Header from '../components/ui/Header';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';

const Data = () => {
  const [activeTab, setActiveTab] = useState('sources');
  const [dataSources, setDataSources] = useState([
    {
      id: 1,
      name: 'Bloomberg Terminal',
      type: 'Market Data',
      status: 'connected',
      lastSync: '2 minutes ago',
      records: '1.2M',
      latency: '45ms',
      icon: Globe,
    },
    {
      id: 2,
      name: 'Yahoo Finance',
      type: 'Market Data',
      status: 'connected',
      lastSync: '5 minutes ago',
      records: '850K',
      latency: '120ms',
      icon: TrendingUp,
    },
    {
      id: 3,
      name: 'FactSet',
      type: 'Fundamentals',
      status: 'warning',
      lastSync: '1 hour ago',
      records: '450K',
      latency: '200ms',
      icon: FileText,
    },
    {
      id: 4,
      name: 'Refinitiv Eikon',
      type: 'Market Data',
      status: 'error',
      lastSync: 'Failed',
      records: '0',
      latency: 'N/A',
      icon: Database,
    },
    {
      id: 5,
      name: 'Alpha Vantage',
      type: 'Technical Data',
      status: 'connected',
      lastSync: '10 minutes ago',
      records: '320K',
      latency: '300ms',
      icon: Activity,
    },
  ]);

  const [systemHealth, setSystemHealth] = useState({
    overall: 'good',
    dataQuality: 95,
    uptime: 99.8,
    throughput: '45.2k req/min',
    errorRate: 0.02,
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleRefreshAll = () => {
    setDataSources(sources => 
      sources.map(source => ({
        ...source,
        lastSync: source.status === 'connected' ? 'Syncing...' : source.lastSync
      }))
    );

    setTimeout(() => {
      setDataSources(sources => 
        sources.map(source => ({
          ...source,
          lastSync: source.status === 'connected' ? 'Just now' : source.lastSync
        }))
      );
    }, 2000);
  };

  const renderDataSources = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Data Sources</h2>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleRefreshAll}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh All
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Source
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {dataSources.map((source) => (
          <motion.div
            key={source.id}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <source.icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{source.name}</h3>
                    <p className="text-sm text-gray-600">{source.type}</p>
                  </div>
                </div>
                {getStatusIcon(source.status)}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(source.status)}`}>
                    {source.status}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Last Sync</span>
                  <span className="font-medium">{source.lastSync}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Records</span>
                  <span className="font-medium">{source.records}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Latency</span>
                  <span className="font-medium">{source.latency}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <Button variant="outline" size="sm" className="w-full">
                  <Settings className="w-4 h-4 mr-2" />
                  Configure
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderSystemHealth = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">System Health</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900">Overall Health</h3>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <p className="text-2xl font-bold text-green-600">Good</p>
          <p className="text-sm text-gray-600 mt-1">All systems operational</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900">Data Quality</h3>
            <Shield className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-600">{systemHealth.dataQuality}%</p>
          <p className="text-sm text-gray-600 mt-1">Quality score</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900">Uptime</h3>
            <Activity className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-600">{systemHealth.uptime}%</p>
          <p className="text-sm text-gray-600 mt-1">Last 30 days</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900">Throughput</h3>
            <Zap className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-purple-600">{systemHealth.throughput}</p>
          <p className="text-sm text-gray-600 mt-1">Current rate</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Data Flow Monitoring</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Market Data Ingestion</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Active</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Fundamental Data Processing</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Active</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Real-time Updates</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium">Delayed</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Data Validation</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Active</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Bloomberg data sync completed</p>
                <p className="text-xs text-gray-600">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Yahoo Finance API updated</p>
                <p className="text-xs text-gray-600">5 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">FactSet connection timeout</p>
                <p className="text-xs text-gray-600">1 hour ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Refinitiv authentication failed</p>
                <p className="text-xs text-gray-600">2 hours ago</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderDataManagement = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Data Management</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Download className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Data Export</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Export data to various formats for external analysis or backup
          </p>
          <Button variant="outline" className="w-full">
            Export Data
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Upload className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Data Import</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Import custom datasets or historical data from CSV/Excel files
          </p>
          <Button variant="outline" className="w-full">
            Import Data
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Database className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Data Cleanup</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Clean and validate data to ensure accuracy and consistency
          </p>
          <Button variant="outline" className="w-full">
            Run Cleanup
          </Button>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Data Storage Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">1.2TB</p>
            <p className="text-sm text-gray-600">Total Storage</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">850GB</p>
            <p className="text-sm text-gray-600">Used Space</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">350GB</p>
            <p className="text-sm text-gray-600">Available</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">2.4M</p>
            <p className="text-sm text-gray-600">Total Records</p>
          </div>
        </div>
        <div className="mt-6">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '70%' }}></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">70% storage utilization</p>
        </div>
      </Card>
    </div>
  );

  const tabs = [
    { id: 'sources', label: 'Data Sources', component: renderDataSources },
    { id: 'health', label: 'System Health', component: renderSystemHealth },
    { id: 'management', label: 'Data Management', component: renderDataManagement },
  ];

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Center</h1>
            <p className="text-gray-600">
              Monitor, manage, and configure your financial data sources and pipelines
            </p>
          </div>

          <div className="mb-6">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {tabs.find(tab => tab.id === activeTab)?.component()}
        </motion.div>
      </div>
    </div>
  );
};

export default Data;