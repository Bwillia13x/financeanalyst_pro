import { verifyAccessToken, extractToken } from '../utils/auth.js';
import { sendAPIError } from '../utils/responseHelpers.js';

/**
 * Authentication middleware - verifies JWT tokens
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = extractToken(authHeader);

  if (!token) {
    return sendAPIError(res, 'Access token required', null, 401, 'MISSING_TOKEN');
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return sendAPIError(res, 'Invalid or expired token', error, 401, 'INVALID_TOKEN');
  }
};

/**
 * Optional authentication middleware - continues if no token provided
 */
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = extractToken(authHeader);

  if (token) {
    try {
      const decoded = verifyAccessToken(token);
      req.user = decoded;
    } catch (error) {
      // Continue without auth if token is invalid
      req.user = null;
    }
  }
  
  next();
};

/**
 * Role-based authorization middleware
 */
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendAPIError(res, 'Authentication required', null, 401, 'AUTH_REQUIRED');
    }

    const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    
    const hasRole = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasRole) {
      return sendAPIError(res, 'Insufficient permissions', null, 403, 'INSUFFICIENT_PERMISSIONS');
    }
    
    next();
  };
};
