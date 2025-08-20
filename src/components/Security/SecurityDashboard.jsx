import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  AlertTriangle, 
  Lock, 
  Eye, 
  Users, 
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  RefreshCw,
  Settings,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import securityService from '../../services/securityService';

const SecurityDashboard = () => {
  const [securityReport, setSecurityReport] = useState(null);
  const [complianceStatus, setComplianceStatus] = useState({});
  const [activeSessions, setActiveSessions] = useState([]);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadSecurityData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadSecurityData, 300000);
    return () => clearInterval(interval);
  }, [selectedTimeframe]);

  const loadSecurityData = async () => {
    setIsLoading(true);
    try {
      // Load security report
      const report = await securityService.generateSecurityReport(selectedTimeframe);
      setSecurityReport(report);
      
      // Load compliance status
      const compliance = await securityService.runComplianceCheck();
      setComplianceStatus(compliance);
      
      // Get active sessions (mock data for demo)
      const sessions = [
        {
          id: 'session_1',
          username: 'analyst_1',
          ip: '192.168.1.100',
          loginTime: new Date(Date.now() - 3600000).toISOString(),
          lastActivity: new Date(Date.now() - 300000).toISOString(),
          location: 'New York, NY'
        },
        {
          id: 'session_2',
          username: 'manager_1',
          ip: '192.168.1.101',
          loginTime: new Date(Date.now() - 7200000).toISOString(),
          lastActivity: new Date(Date.now() - 120000).toISOString(),
          location: 'San Francisco, CA'
        }
      ];
      setActiveSessions(sessions);

      // Get recent security events (mock data for demo)
      const events = [
        {
          id: 'event_1',
          type: 'login_success',
          severity: 'low',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          description: 'Successful login from analyst_1',
          ip: '192.168.1.100'
        },
        {
          id: 'event_2',
          type: 'data_access',
          severity: 'medium',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          description: 'Financial data accessed by manager_1',
          ip: '192.168.1.101'
        },
        {
          id: 'event_3',
          type: 'config_change',
          severity: 'high',
          timestamp: new Date(Date.now() - 5400000).toISOString(),
          description: 'Security policy updated',
          ip: '192.168.1.102'
        }
      ];
      setSecurityEvents(events);

    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'text-green-600 bg-green-100',
      medium: 'text-yellow-600 bg-yellow-100',
      high: 'text-orange-600 bg-orange-100',
      critical: 'text-red-600 bg-red-100'
    };
    return colors[severity] || 'text-gray-600 bg-gray-100';
  };

  const getSeverityIcon = (severity) => {
    const icons = {
      low: CheckCircle,
      medium: Clock,
      high: AlertTriangle,
      critical: XCircle
    };
    return icons[severity] || Clock;
  };

  const getComplianceIcon = (status) => {
    return status === 'compliant' ? CheckCircle : XCircle;
  };

  const getComplianceColor = (status) => {
    return status === 'compliant' 
      ? 'text-green-600 bg-green-100' 
      : 'text-red-600 bg-red-100';
  };

  const exportSecurityReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      timeframe: selectedTimeframe,
      securityReport,
      complianceStatus,
      activeSessions,
      securityEvents
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `security_report_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderOverviewTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Security Metrics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Shield className="mr-2" size={24} />
          Security Metrics
        </h3>
        
        {securityReport && (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {securityReport.summary.totalEvents}
              </div>
              <div className="text-sm text-blue-700">Total Events</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {securityReport.summary.activeSessions}
              </div>
              <div className="text-sm text-green-700">Active Sessions</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {securityReport.summary.highSeverityEvents}
              </div>
              <div className="text-sm text-yellow-700">High Severity</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {securityReport.summary.criticalEvents}
              </div>
              <div className="text-sm text-red-700">Critical Events</div>
            </div>
          </div>
        )}
      </div>

      {/* Compliance Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CheckCircle className="mr-2" size={24} />
          Compliance Status
        </h3>
        
        {complianceStatus.details && (
          <div className="space-y-3">
            {complianceStatus.details.map((compliance) => {
              const Icon = getComplianceIcon(compliance.status);
              return (
                <div key={compliance.regulation} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{compliance.name}</div>
                    <div className="text-sm text-gray-600">{compliance.regulation.toUpperCase()}</div>
                  </div>
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getComplianceColor(compliance.status)}`}>
                    <Icon size={14} />
                    <span className="capitalize">{compliance.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Security Events */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Activity className="mr-2" size={24} />
          Recent Security Events
        </h3>
        
        <div className="overflow-hidden">
          <div className="space-y-3">
            {securityEvents.slice(0, 5).map((event) => {
              const SeverityIcon = getSeverityIcon(event.severity);
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${getSeverityColor(event.severity)}`}>
                      <SeverityIcon size={16} />
                    </div>
                    <div>
                      <div className="font-medium">{event.description}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(event.timestamp).toLocaleString()} • {event.ip}
                      </div>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs ${getSeverityColor(event.severity)}`}>
                    {event.severity.toUpperCase()}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSessionsTab = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Users className="mr-2" size={24} />
          Active Sessions ({activeSessions.length})
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                IP Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Login Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Activity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {activeSessions.map((session) => (
              <tr key={session.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {session.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{session.username}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {session.ip}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {session.location}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(session.loginTime).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(session.lastActivity).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-red-600 hover:text-red-900">
                    Terminate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderEventsTab = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Eye className="mr-2" size={24} />
          Security Events ({securityEvents.length})
        </h3>
      </div>
      
      <div className="divide-y divide-gray-200">
        {securityEvents.map((event) => {
          const SeverityIcon = getSeverityIcon(event.severity);
          return (
            <div key={event.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${getSeverityColor(event.severity)}`}>
                    <SeverityIcon size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{event.description}</h4>
                    <div className="text-sm text-gray-600 mt-1">
                      Type: {event.type.replace('_', ' ')} • IP: {event.ip}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(event.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(event.severity)}`}>
                  {event.severity.toUpperCase()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Shield className="mr-3 text-blue-600" size={36} />
            Security Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor security events, compliance status, and system access
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          <button
            onClick={loadSecurityData}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={exportSecurityReport}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download size={16} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: Activity },
            { id: 'sessions', name: 'Active Sessions', icon: Users },
            { id: 'events', name: 'Security Events', icon: Eye }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={16} />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'sessions' && renderSessionsTab()}
          {activeTab === 'events' && renderEventsTab()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SecurityDashboard;
