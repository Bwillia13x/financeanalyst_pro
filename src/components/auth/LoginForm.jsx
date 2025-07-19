/**
 * Login Form Component
 * Provides user authentication interface with comprehensive security features
 */

import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
  CheckCircle,
  Loader2,
  Shield
} from 'lucide-react';
import { useState, useEffect } from 'react';

import { authService } from '../../services/authService.js';
import { apiLogger } from '../../utils/apiLogger.js';

const LoginForm = ({ onLoginSuccess, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [loginAttempts, setLoginAttempts] = useState(0);

  // Demo credentials helper
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);

  const demoAccounts = [
    { email: 'admin@financeanalyst.pro', password: 'admin123', role: 'Admin' },
    { email: 'analyst@financeanalyst.pro', password: 'analyst123', role: 'Analyst' },
    { email: 'viewer@financeanalyst.pro', password: 'viewer123', role: 'Viewer' }
  ];

  useEffect(() => {
    // Clear errors when form data changes
    if (error) setError('');
    if (Object.keys(validationErrors).length > 0) setValidationErrors({});
  }, [formData.email, formData.password]);

  const validateForm = () => {
    const errors = {};

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async(e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await authService.login(
        formData.email,
        formData.password,
        formData.rememberMe
      );

      if (result.success) {
        apiLogger.log('INFO', 'Login successful', {
          email: formData.email,
          role: result.user.role
        });

        if (onLoginSuccess) {
          onLoginSuccess(result.user);
        }
      }
    } catch (error) {
      setError(error.message);
      setLoginAttempts(prev => prev + 1);

      apiLogger.log('ERROR', 'Login failed', {
        email: formData.email,
        error: error.message,
        attempts: loginAttempts + 1
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const fillDemoCredentials = (account) => {
    setFormData(prev => ({
      ...prev,
      email: account.email,
      password: account.password
    }));
    setShowDemoCredentials(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Access your financial analysis workspace
          </p>
        </div>

        {/* Demo Credentials Helper */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-900">Demo Mode</span>
            </div>
            <button
              onClick={() => setShowDemoCredentials(!showDemoCredentials)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {showDemoCredentials ? 'Hide' : 'Show'} Demo Accounts
            </button>
          </div>

          {showDemoCredentials && (
            <div className="mt-3 space-y-2">
              {demoAccounts.map((account, index) => (
                <button
                  key={index}
                  onClick={() => fillDemoCredentials(account)}
                  className="w-full text-left p-2 bg-white rounded border hover:bg-gray-50 transition-colors"
                >
                  <div className="text-sm font-medium text-gray-900">{account.role}</div>
                  <div className="text-xs text-gray-500">{account.email}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    validationErrors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email"
                />
              </div>
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {validationErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    validationErrors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {validationErrors.password}
                </p>
              )}
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <button
                type="button"
                className="font-medium text-blue-600 hover:text-blue-500"
                onClick={() => {
                  // TODO: Implement forgot password
                  alert('Forgot password functionality will be implemented in production');
                }}
              >
                Forgot your password?
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                <div className="text-sm text-red-700">{error}</div>
              </div>
            </div>
          )}

          {/* Login Attempts Warning */}
          {loginAttempts >= 3 && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-amber-400 mr-2 mt-0.5" />
                <div className="text-sm text-amber-700">
                  Multiple failed attempts detected. Account may be temporarily locked after 5 failed attempts.
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <span className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign up
              </button>
            </span>
          </div>
        </form>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Your data is protected with enterprise-grade security.
            <br />
            Sessions automatically expire after 24 hours of inactivity.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
