import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { authenticationService } from '../../services/security/AuthenticationService';
import { securityAuditService } from '../../services/security/SecurityAuditService';

const SecurityDashboard = () => {
  const [authData, setAuthData] = useState(null);
  const [auditData, setAuditData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSecurityData();
    const interval = setInterval(loadSecurityData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSecurityData = async () => {
    try {
      setIsLoading(true);
      const [authStats, auditStats] = await Promise.all([
        authenticationService.getStats(),
        securityAuditService.getAuditStats()
      ]);
      setAuthData(authStats);
      setAuditData(auditStats);
    } catch (error) {
      console.error('Failed to load security data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = num => new Intl.NumberFormat().format(num);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent mx-auto mb-4"></div>
          <p className="text-foreground-secondary">Loading security dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Security Dashboard</h2>
          <p className="text-foreground-secondary mt-1">
            Comprehensive security monitoring and compliance overview
          </p>
        </div>
        <Button onClick={loadSecurityData} variant="outline">
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {authData && (
          <Card>
            <CardHeader>
              <CardTitle>Authentication</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Total Users</span>
                  <span className="font-medium">{formatNumber(authData.totalUsers)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Active Users</span>
                  <span className="font-medium text-green-600">
                    {formatNumber(authData.activeUsers)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Locked Accounts</span>
                  <span
                    className={`font-medium ${authData.lockedAccounts > 0 ? 'text-red-600' : 'text-green-600'}`}
                  >
                    {formatNumber(authData.lockedAccounts)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {auditData && (
          <Card>
            <CardHeader>
              <CardTitle>Security Audit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Total Events</span>
                  <span className="font-medium">{formatNumber(auditData.totalLogs)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Critical Events</span>
                  <span className="font-medium text-red-600">
                    {formatNumber(auditData.criticalEvents)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Active Alerts</span>
                  <span
                    className={`font-medium ${auditData.activeAlerts > 0 ? 'text-red-600' : 'text-green-600'}`}
                  >
                    {formatNumber(auditData.activeAlerts)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Security Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <div className="font-medium text-red-800 mb-1">🚨 Critical Priority</div>
              <div className="text-sm text-red-700">
                Enable multi-factor authentication for all administrator accounts
              </div>
            </div>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <div className="font-medium text-yellow-800 mb-1">⚠️ High Priority</div>
              <div className="text-sm text-yellow-700">
                Review and update data retention policies for GDPR compliance
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityDashboard;
