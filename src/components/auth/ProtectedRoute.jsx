/**
 * Protected Route Component
 * Provides route protection and role-based access control
 */

import { Shield, AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { authService } from '../../services/authService.js';
import { apiLogger } from '../../utils/apiLogger.js';

const ProtectedRoute = ({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  fallbackComponent = null,
  redirectTo = '/login'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    checkAuthentication();

    // Listen for auth changes
    const unsubscribe = authService.addAuthListener((event, userData) => {
      if (event === 'login' || event === 'session_restored') {
        setIsAuthenticated(true);
        setUser(userData);
        checkAccess(userData);
      } else if (event === 'logout') {
        setIsAuthenticated(false);
        setUser(null);
        setHasAccess(false);
      }
    });

    return unsubscribe;
  }, [requiredRoles, requiredPermissions]);

  const checkAuthentication = async() => {
    try {
      const authenticated = authService.isAuthenticated();
      const currentUser = authService.getCurrentUser();

      setIsAuthenticated(authenticated);
      setUser(currentUser);

      if (authenticated && currentUser) {
        checkAccess(currentUser);
      } else {
        setHasAccess(false);
      }
    } catch (error) {
      apiLogger.log('ERROR', 'Authentication check failed', { error: error.message });
      setIsAuthenticated(false);
      setHasAccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAccess = (currentUser) => {
    if (!currentUser) {
      setHasAccess(false);
      return;
    }

    // Check role requirements
    const hasRequiredRole = requiredRoles.length === 0 ||
      requiredRoles.some(role => authService.hasRole(role));

    // Check permission requirements
    const hasRequiredPermissions = requiredPermissions.length === 0 ||
      requiredPermissions.every(permission => authService.hasPermission(permission));

    const access = hasRequiredRole && hasRequiredPermissions;
    setHasAccess(access);

    // Log access attempt
    apiLogger.log(access ? 'INFO' : 'WARN', 'Route access check', {
      userId: currentUser.id,
      route: location.pathname,
      requiredRoles,
      requiredPermissions,
      userRole: currentUser.role,
      userPermissions: authService.getUserPermissions(),
      accessGranted: access
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // Authenticated but no access - show access denied
  if (!hasAccess) {
    if (fallbackComponent) {
      return fallbackComponent;
    }

    return <AccessDenied user={user} requiredRoles={requiredRoles} requiredPermissions={requiredPermissions} />;
  }

  // Authenticated and has access - render children
  return children;
};

/**
 * Access Denied Component
 */
const AccessDenied = ({ user, requiredRoles, requiredPermissions }) => {
  const userPermissions = authService.getUserPermissions();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <Shield className="h-8 w-8 text-red-600" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Access Denied
        </h2>

        <p className="text-gray-600 mb-6">
          You don't have permission to access this resource.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-medium text-gray-900 mb-2">Your Access Level:</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <div>Role: <span className="font-medium">{user?.role || 'Unknown'}</span></div>
            <div>Permissions: <span className="font-medium">{userPermissions.length}</span></div>
          </div>
        </div>

        {(requiredRoles.length > 0 || requiredPermissions.length > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-600 mr-2 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900 mb-2">Required Access:</h4>
                {requiredRoles.length > 0 && (
                  <div className="text-sm text-amber-700 mb-1">
                    Roles: {requiredRoles.join(', ')}
                  </div>
                )}
                {requiredPermissions.length > 0 && (
                  <div className="text-sm text-amber-700">
                    Permissions: {requiredPermissions.join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => window.history.back()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>

          <button
            onClick={() => window.location.href = '/dashboard'}
            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>

        <div className="mt-6 text-xs text-gray-500">
          If you believe this is an error, please contact your administrator.
        </div>
      </div>
    </div>
  );
};

/**
 * Higher-order component for protecting components
 */
export const withAuth = (Component, options = {}) => {
  return function AuthenticatedComponent(props) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
};

/**
 * Hook for checking permissions in components
 */
export const useAuth = () => {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());

  useEffect(() => {
    const unsubscribe = authService.addAuthListener((event, userData) => {
      if (event === 'login' || event === 'session_restored') {
        setIsAuthenticated(true);
        setUser(userData);
      } else if (event === 'logout') {
        setIsAuthenticated(false);
        setUser(null);
      }
    });

    return unsubscribe;
  }, []);

  return {
    user,
    isAuthenticated,
    hasPermission: (permission) => authService.hasPermission(permission),
    hasRole: (...roles) => authService.hasRole(...roles),
    getUserPermissions: () => authService.getUserPermissions(),
    login: authService.login.bind(authService),
    logout: authService.logout.bind(authService)
  };
};

/**
 * Permission-based conditional rendering component
 */
export const PermissionGate = ({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  fallback = null,
  requireAll = true
}) => {
  const { hasPermission, hasRole } = useAuth();

  // Check permissions
  const permissionCheck = requiredPermissions.length === 0 ||
    (requireAll
      ? requiredPermissions.every(permission => hasPermission(permission))
      : requiredPermissions.some(permission => hasPermission(permission))
    );

  // Check roles
  const roleCheck = requiredRoles.length === 0 ||
    (requireAll
      ? requiredRoles.every(role => hasRole(role))
      : requiredRoles.some(role => hasRole(role))
    );

  const hasAccess = permissionCheck && roleCheck;

  return hasAccess ? children : fallback;
};

export default ProtectedRoute;
