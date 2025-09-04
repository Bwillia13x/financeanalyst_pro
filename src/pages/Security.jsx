import React, { useState, useEffect } from 'react';

import SecurityDashboard from '../components/Security/SecurityDashboard';
import Button from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Input from '../components/ui/Input';
import { authenticationService } from '../services/security/AuthenticationService';
import { complianceMonitoringService } from '../services/security/ComplianceMonitoringService';
import { dataProtectionService } from '../services/security/DataProtectionService';
import { securityAuditService } from '../services/security/SecurityAuditService';

const Security = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationStatus, setInitializationStatus] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize all security services
  useEffect(() => {
    initializeServices();
    checkAuthentication();
  }, []);

  const initializeServices = async () => {
    const status = {};

    try {
      await authenticationService.initialize();
      status.auth = 'initialized';
    } catch (error) {
      status.auth = 'failed';
      console.error('Failed to initialize Authentication Service:', error);
    }

    try {
      await securityAuditService.initialize();
      status.audit = 'initialized';
    } catch (error) {
      status.audit = 'failed';
      console.error('Failed to initialize Security Audit Service:', error);
    }

    try {
      await dataProtectionService.initialize();
      status.protection = 'initialized';
    } catch (error) {
      status.protection = 'failed';
      console.error('Failed to initialize Data Protection Service:', error);
    }

    try {
      await complianceMonitoringService.initialize();
      status.compliance = 'initialized';
    } catch (error) {
      status.compliance = 'failed';
      console.error('Failed to initialize Compliance Monitoring Service:', error);
    }

    setInitializationStatus(status);
    setIsInitialized(Object.values(status).every(s => s === 'initialized'));
  };

  const checkAuthentication = () => {
    const user = authenticationService.getCurrentUser();
    setCurrentUser(user);
    setIsAuthenticated(!!user);
  };

  const exportSecurityData = () => {
    const data = {
      authentication: authenticationService.getStats(),
      audit: securityAuditService.getAuditStats(),
      protection: dataProtectionService.getProtectionStats(),
      compliance: complianceMonitoringService.getComplianceMetrics(),
      exportTimestamp: Date.now()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `security-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'authentication', name: 'Authentication', icon: '🔐' },
    { id: 'audit', name: 'Audit', icon: '📋' },
    { id: 'protection', name: 'Data Protection', icon: '🛡️' },
    { id: 'compliance', name: 'Compliance', icon: '⚖️' },
    { id: 'settings', name: 'Settings', icon: '⚙️' }
  ];

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Security System</h2>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent mx-auto mb-4" />
            <p className="text-foreground-secondary mb-6">Initializing security services...</p>

            <div className="max-w-md mx-auto space-y-2">
              {Object.entries(initializationStatus).map(([service, status]) => (
                <div
                  key={service}
                  className="flex items-center justify-between p-2 border border-border rounded"
                >
                  <span className="capitalize">{service} Service</span>
                  <span
                    className={`text-sm ${
                      status === 'initialized'
                        ? 'text-green-600'
                        : status === 'failed'
                          ? 'text-red-600'
                          : 'text-yellow-600'
                    }`}
                  >
                    {status === 'initialized' ? '✅' : status === 'failed' ? '❌' : '⏳'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-brand-accent text-white'
                      : 'text-foreground-secondary hover:text-foreground hover:bg-background-secondary'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {currentUser && (
                <span className="text-sm text-foreground-secondary">
                  Logged in as: {currentUser.email}
                </span>
              )}
              <Button onClick={exportSecurityData} variant="outline">
                Export Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'dashboard' && <SecurityDashboard />}

        {activeTab === 'authentication' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Authentication Management</h2>
                <p className="text-foreground-secondary mt-1">
                  User authentication, authorization, and access control
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-background-secondary p-4 rounded overflow-auto max-h-96">
                    {JSON.stringify(authenticationService.getStats(), null, 2)}
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Authentication Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={() => console.log('Enable MFA for current user')}
                    className="w-full"
                  >
                    Enable MFA
                  </Button>
                  <Button
                    onClick={() => console.log('Change password')}
                    variant="outline"
                    className="w-full"
                  >
                    Change Password
                  </Button>
                  <Button
                    onClick={() =>
                      authenticationService.logout(
                        localStorage.getItem('auth_tokens')?.split('.')[0]
                      )
                    }
                    variant="outline"
                    className="w-full text-red-600"
                  >
                    Logout All Sessions
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Security Audit</h2>
                <p className="text-foreground-secondary mt-1">
                  Security event logging and monitoring
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Audit Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-background-secondary p-4 rounded overflow-auto max-h-96">
                    {JSON.stringify(securityAuditService.getAuditStats(), null, 2)}
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Audit Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={() => securityAuditService.generateSecurityReport()}
                    className="w-full"
                  >
                    Generate Report
                  </Button>
                  <Button
                    onClick={() => console.log('Search audit logs')}
                    variant="outline"
                    className="w-full"
                  >
                    Search Logs
                  </Button>
                  <Button
                    onClick={() => console.log('Export audit data')}
                    variant="outline"
                    className="w-full"
                  >
                    Export Logs
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'protection' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Data Protection</h2>
                <p className="text-foreground-secondary mt-1">
                  Data encryption, masking, and privacy controls
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Protection Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-background-secondary p-4 rounded overflow-auto max-h-96">
                    {JSON.stringify(dataProtectionService.getProtectionStats(), null, 2)}
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data Protection Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={() => console.log('Request data access')} className="w-full">
                    Request Data Access
                  </Button>
                  <Button
                    onClick={() => console.log('Request data erasure')}
                    variant="outline"
                    className="w-full"
                  >
                    Request Data Erasure
                  </Button>
                  <Button
                    onClick={() => console.log('Update consent')}
                    variant="outline"
                    className="w-full"
                  >
                    Update Consent
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Compliance Monitoring</h2>
                <p className="text-foreground-secondary mt-1">
                  Regulatory compliance tracking and reporting
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-background-secondary p-4 rounded overflow-auto max-h-96">
                    {JSON.stringify(complianceMonitoringService.getComplianceMetrics(), null, 2)}
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Compliance Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={() => complianceMonitoringService.performComplianceChecks()}
                    className="w-full"
                  >
                    Run Compliance Check
                  </Button>
                  <Button
                    onClick={() => complianceMonitoringService.generateComplianceReports()}
                    variant="outline"
                    className="w-full"
                  >
                    Generate Report
                  </Button>
                  <Button
                    onClick={() => complianceMonitoringService.performRiskAssessment()}
                    variant="outline"
                    className="w-full"
                  >
                    Risk Assessment
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Security Settings</h2>
                <p className="text-foreground-secondary mt-1">
                  Configure security policies and settings
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Password Policy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-secondary">Minimum Length</span>
                    <span className="font-medium">12 characters</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-secondary">Require Uppercase</span>
                    <span className="font-medium">✅ Enabled</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-secondary">Require Numbers</span>
                    <span className="font-medium">✅ Enabled</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-secondary">Require Special Chars</span>
                    <span className="font-medium">✅ Enabled</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Session Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-secondary">Session Timeout</span>
                    <span className="font-medium">24 hours</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-secondary">Max Login Attempts</span>
                    <span className="font-medium">5 attempts</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-secondary">Account Lock Duration</span>
                    <span className="font-medium">15 minutes</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-foreground-secondary">Security Services:</span>
                      <span className="font-medium ml-2">4 Active</span>
                    </div>
                    <div>
                      <span className="text-foreground-secondary">Compliance Frameworks:</span>
                      <span className="font-medium ml-2">5 Supported</span>
                    </div>
                    <div>
                      <span className="text-foreground-secondary">Encryption:</span>
                      <span className="font-medium ml-2">AES-GCM Enabled</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Security;
