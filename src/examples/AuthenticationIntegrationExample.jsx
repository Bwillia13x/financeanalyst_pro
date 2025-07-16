/**
 * Authentication Integration Example
 * Demonstrates complete authentication system integration with financial modeling
 */

import {
  Shield,
  User,
  Lock,
  Key,
  Database,
  Settings,
  LogOut,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Users
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import LoginForm from '../components/auth/LoginForm.jsx';
import ProtectedRoute, { useAuth, PermissionGate } from '../components/auth/ProtectedRoute.jsx';
import UserProfile from '../components/auth/UserProfile.jsx';
import { authService, USER_ROLES, PERMISSIONS } from '../services/authService.js';
import { encryptionService } from '../services/encryptionService.js';
import { userContextService } from '../services/userContextService.js';

const AuthenticationIntegrationExample = () => {
  const [currentView, setCurrentView] = useState('login');
  const [showProfile, setShowProfile] = useState(false);
  const [contextStats, setContextStats] = useState(null);
  const [encryptionStatus, setEncryptionStatus] = useState(null);

  const { user, isAuthenticated, hasPermission, hasRole, logout } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      setCurrentView('dashboard');
      loadContextData();
    } else {
      setCurrentView('login');
    }
  }, [isAuthenticated]);

  const loadContextData = async() => {
    try {
      const stats = await userContextService.getContextStats();
      setContextStats(stats);

      const encStatus = encryptionService.getStatus();
      setEncryptionStatus(encStatus);
    } catch (error) {
      console.error('Failed to load context data:', error);
    }
  };

  const handleLoginSuccess = (userData) => {
    console.log('Login successful:', userData);
    setCurrentView('dashboard');
  };

  const handleLogout = async() => {
    await logout();
    setCurrentView('login');
    setShowProfile(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LoginForm
          onLoginSuccess={handleLoginSuccess}
          onSwitchToRegister={() => alert('Registration will be implemented in production')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">
                Finance Analyst Pro - Authenticated
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{user?.name}</div>
                  <div className="text-gray-500">{user?.role}</div>
                </div>
              </div>

              <button
                onClick={() => setShowProfile(true)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Settings className="h-5 w-5" />
              </button>

              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Authentication Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-green-600" />
              Authentication Status
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span className="font-medium text-green-900">Authenticated</span>
                </div>
                <div className="text-sm text-green-700 mt-1">
                  Session active and secure
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="font-medium text-blue-900">Role: {user?.role}</span>
                </div>
                <div className="text-sm text-blue-700 mt-1">
                  {authService.getUserPermissions().length} permissions
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Database className="h-5 w-5 text-purple-600 mr-2" />
                  <span className="font-medium text-purple-900">Data Isolated</span>
                </div>
                <div className="text-sm text-purple-700 mt-1">
                  User-specific workspace
                </div>
              </div>
            </div>
          </div>

          {/* Role-Based Features */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Role-Based Access Control Demo
            </h2>

            <div className="space-y-4">
              {/* Admin Only Features */}
              <PermissionGate requiredRoles={[USER_ROLES.ADMIN]}>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Key className="h-5 w-5 text-red-600 mr-2" />
                    <span className="font-medium text-red-900">Admin Features</span>
                  </div>
                  <div className="text-sm text-red-700 mt-2">
                    ✅ User Management<br />
                    ✅ System Configuration<br />
                    ✅ View Logs<br />
                    ✅ All Data Access
                  </div>
                </div>
              </PermissionGate>

              {/* Analyst Features */}
              <PermissionGate requiredRoles={[USER_ROLES.ANALYST, USER_ROLES.ADMIN]}>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Database className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="font-medium text-blue-900">Analyst Features</span>
                  </div>
                  <div className="text-sm text-blue-700 mt-2">
                    ✅ Create/Edit Models<br />
                    ✅ Export Data<br />
                    ✅ API Access<br />
                    ✅ Bulk Operations
                  </div>
                </div>
              </PermissionGate>

              {/* Viewer Features */}
              <PermissionGate requiredRoles={[USER_ROLES.VIEWER, USER_ROLES.ANALYST, USER_ROLES.ADMIN]}>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Eye className="h-5 w-5 text-green-600 mr-2" />
                    <span className="font-medium text-green-900">Viewer Features</span>
                  </div>
                  <div className="text-sm text-green-700 mt-2">
                    ✅ Read Models<br />
                    ✅ Export Data<br />
                    ❌ Edit Models<br />
                    ❌ User Management
                  </div>
                </div>
              </PermissionGate>

              {/* Permission-Based Features */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PermissionGate requiredPermissions={[PERMISSIONS.WRITE_MODELS]}>
                  <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                    Create New Model
                  </button>
                </PermissionGate>

                <PermissionGate
                  requiredPermissions={[PERMISSIONS.WRITE_MODELS]}
                  fallback={
                    <button className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-lg cursor-not-allowed">
                      Create New Model (No Permission)
                    </button>
                  }
                >
                  <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                    Create New Model
                  </button>
                </PermissionGate>
              </div>
            </div>
          </div>

          {/* User Context & Data Isolation */}
          {contextStats && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                User Context & Data Isolation
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">User Context</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>User ID:</span>
                      <span className="font-mono text-xs">{contextStats.userId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Role:</span>
                      <span className="font-medium">{contextStats.userRole}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Workspace:</span>
                      <span className="font-mono text-xs">{contextStats.workspaceId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cache Size:</span>
                      <span className="font-medium">{contextStats.cacheSize} items</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Data Isolation</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    {Object.entries(contextStats.dataItems).map(([type, count]) => (
                      <div key={type} className="flex justify-between">
                        <span className="capitalize">{type}:</span>
                        <span className="font-medium">{count} items</span>
                      </div>
                    ))}
                    {Object.keys(contextStats.dataItems).length === 0 && (
                      <div className="text-gray-500 text-center py-2">
                        No user-specific data yet
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Features */}
          {encryptionStatus && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Security Features
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                    <Lock className="h-4 w-4 mr-2" />
                    Encryption
                  </h3>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className={`font-medium ${encryptionStatus.supported ? 'text-green-600' : 'text-red-600'}`}>
                        {encryptionStatus.supported ? 'Supported' : 'Not Supported'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Algorithm:</span>
                      <span className="font-medium">{encryptionStatus.algorithm}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Key Length:</span>
                      <span className="font-medium">{encryptionStatus.keyLength} bits</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Session Security
                  </h3>
                  <div className="text-sm space-y-1">
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      JWT Token Authentication
                    </div>
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Automatic Token Refresh
                    </div>
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Session Monitoring
                    </div>
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Account Lockout Protection
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Multi-User Ready
                  </h3>
                  <div className="text-sm space-y-1">
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      User Data Isolation
                    </div>
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Role-Based Access Control
                    </div>
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Workspace Management
                    </div>
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Shared Data Controls
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Demo Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Demo Actions
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => setShowProfile(true)}
                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <User className="h-4 w-4 mr-2" />
                View Profile
              </button>

              <PermissionGate requiredPermissions={[PERMISSIONS.WRITE_MODELS]}>
                <button
                  onClick={() => alert('Model creation would be implemented here')}
                  className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Create Model
                </button>
              </PermissionGate>

              <PermissionGate requiredPermissions={[PERMISSIONS.EXPORT_DATA]}>
                <button
                  onClick={() => alert('Data export would be implemented here')}
                  className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Export Data
                </button>
              </PermissionGate>

              <button
                onClick={handleLogout}
                className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* User Profile Modal */}
      {showProfile && (
        <UserProfile onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
};

export default AuthenticationIntegrationExample;
