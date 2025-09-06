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
import React, { useState } from 'react';

import Button from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import Header from '../components/ui/Header';
import MetricCard from '../components/ui/MetricCard';
import TabNav from '../components/ui/TabNav';

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
      icon: Globe
    },
    {
      id: 2,
      name: 'Yahoo Finance',
      type: 'Market Data',
      status: 'connected',
      lastSync: '5 minutes ago',
      records: '850K',
      latency: '120ms',
      icon: TrendingUp
    },
    {
      id: 3,
      name: 'FactSet',
      type: 'Fundamentals',
      status: 'warning',
      lastSync: '1 hour ago',
      records: '450K',
      latency: '200ms',
      icon: FileText
    },
    {
      id: 4,
      name: 'Refinitiv Eikon',
      type: 'Market Data',
      status: 'error',
      lastSync: 'Failed',
      records: '0',
      latency: 'N/A',
      icon: Database
    },
    {
      id: 5,
      name: 'Alpha Vantage',
      type: 'Technical Data',
      status: 'connected',
      lastSync: '10 minutes ago',
      records: '320K',
      latency: '300ms',
      icon: Activity
    }
  ]);

  const [systemHealth, _setSystemHealth] = useState({
    overall: 'good',
    dataQuality: 95,
    uptime: 99.8,
    throughput: '45.2k req/min',
    errorRate: 0.02
  });

  const getStatusIcon = status => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-warning" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Clock className="w-5 h-5 text-foreground-secondary" />;
    }
  };

  const getStatusColor = status => {
    switch (status) {
      case 'connected':
        return 'bg-success/10 text-success border border-success/30';
      case 'warning':
        return 'bg-warning/10 text-warning border border-warning/30';
      case 'error':
        return 'bg-destructive/10 text-destructive border border-destructive/30';
      default:
        return 'bg-muted text-foreground border border-border';
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
        <h2 className="text-xl font-semibold text-foreground">Data Sources</h2>
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
        {dataSources.map(source => (
          <motion.div key={source.id} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <source.icon className="w-5 h-5 text-foreground-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{source.name}</h3>
                    <p className="text-sm text-foreground-secondary">{source.type}</p>
                  </div>
                </div>
                {getStatusIcon(source.status)}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-secondary">Status</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(source.status)}`}
                  >
                    {source.status}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-secondary">Last Sync</span>
                  <span className="font-medium text-foreground">{source.lastSync}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-secondary">Records</span>
                  <span className="font-medium text-foreground">{source.records}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-secondary">Latency</span>
                  <span className="font-medium text-foreground">{source.latency}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
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
      <h2 className="text-xl font-semibold text-foreground">System Health</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Overall Health" value="Good" color="success" caption="All systems operational" icon={CheckCircle} />
        <MetricCard label="Data Quality" value={`${systemHealth.dataQuality}%`} color="primary" caption="Quality score" icon={Shield} />
        <MetricCard label="Uptime" value={`${systemHealth.uptime}%`} color="success" caption="Last 30 days" icon={Activity} />
        <MetricCard label="Throughput" value={systemHealth.throughput} color="accent" caption="Current rate" icon={Zap} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Data Flow Monitoring</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground-secondary">Market Data Ingestion</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success rounded-full" />
                <span className="text-sm font-medium">Active</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground-secondary">Fundamental Data Processing</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success rounded-full" />
                <span className="text-sm font-medium">Active</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground-secondary">Real-time Updates</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-warning rounded-full" />
                <span className="text-sm font-medium">Delayed</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground-secondary">Data Validation</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success rounded-full" />
                <span className="text-sm font-medium">Active</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <div className="flex-1">
                <p className="text-sm font-medium">Bloomberg data sync completed</p>
                <p className="text-xs text-foreground-secondary">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <div className="flex-1">
                <p className="text-sm font-medium">Yahoo Finance API updated</p>
                <p className="text-xs text-foreground-secondary">5 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-warning rounded-full" />
              <div className="flex-1">
                <p className="text-sm font-medium">FactSet connection timeout</p>
                <p className="text-xs text-foreground-secondary">1 hour ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-destructive rounded-full" />
              <div className="flex-1">
                <p className="text-sm font-medium">Refinitiv authentication failed</p>
                <p className="text-xs text-foreground-secondary">2 hours ago</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderDataManagement = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Data Management</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Data Export</h3>
          </div>
          <p className="text-sm text-foreground-secondary mb-4">
            Export data to various formats for external analysis or backup
          </p>
          <Button variant="outline" className="w-full">
            Export Data
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-success/10 rounded-lg">
              <Upload className="w-5 h-5 text-success" />
            </div>
            <h3 className="font-semibold text-foreground">Data Import</h3>
          </div>
          <p className="text-sm text-foreground-secondary mb-4">
            Import custom datasets or historical data from CSV/Excel files
          </p>
          <Button variant="outline" className="w-full">
            Import Data
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Database className="w-5 h-5 text-accent" />
            </div>
            <h3 className="font-semibold text-foreground">Data Cleanup</h3>
          </div>
          <p className="text-sm text-foreground-secondary mb-4">
            Clean and validate data to ensure accuracy and consistency
          </p>
          <Button variant="outline" className="w-full">
            Run Cleanup
          </Button>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold text-foreground mb-4">Data Storage Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">1.2TB</p>
            <p className="text-sm text-foreground-secondary">Total Storage</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-success">850GB</p>
            <p className="text-sm text-foreground-secondary">Used Space</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-warning">350GB</p>
            <p className="text-sm text-foreground-secondary">Available</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-accent">2.4M</p>
            <p className="text-sm text-foreground-secondary">Total Records</p>
          </div>
        </div>
        <div className="mt-6">
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full" style={{ width: '70%' }} />
          </div>
          <p className="text-sm text-foreground-secondary mt-2">70% storage utilization</p>
        </div>
      </Card>
    </div>
  );

  const tabs = [
    { id: 'sources', label: 'Data Sources', component: renderDataSources },
    { id: 'health', label: 'System Health', component: renderSystemHealth },
    { id: 'management', label: 'Data Management', component: renderDataManagement }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Data Center</h1>
            <p className="text-foreground-secondary">
              Monitor, manage, and configure your financial data sources and pipelines
            </p>
          </div>

          <div className="mb-6">
            <TabNav items={tabs} activeId={activeTab} onChange={setActiveTab} />
          </div>

          {tabs.find(tab => tab.id === activeTab)?.component()}
        </motion.div>
      </div>
    </div>
  );
};

export default Data;
