/**
 * Security utilities for input sanitization and validation
 */

// XSS Prevention
export const sanitizeInput = input => {
  if (typeof input !== 'string') return input;

  return input
    .replace(/<script[^>]*>(.*?)<\/script>/gi, '$1') // Extract content from script tags
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/\son\w+="[^"]*"/gi, '') // Remove event handlers in HTML context (with leading space)
    .replace(/\son\w+='[^']*'/gi, '') // Remove event handlers in HTML context (with leading space)
    .replace(/on\w+=/gi, '') // Remove event handler attribute names
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
};

// SQL Injection Prevention (for any future backend integration)
export const sanitizeSQL = input => {
  if (typeof input !== 'string') return input;

  return input
    .replace(/['";\\]/g, '') // Remove SQL injection characters
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*.*?\*\//g, ''); // Remove SQL block comments
};

// Ticker Symbol Validation
export const validateTicker = ticker => {
  if (!ticker || typeof ticker !== 'string') return false;

  // Valid ticker: 1-5 uppercase letters, optionally followed by a dot and 1-2 letters
  const tickerRegex = /^[A-Z]{1,5}(\.[A-Z]{1,2})?$/;
  return tickerRegex.test(ticker.toUpperCase()) && ticker.length <= 8;
};

// Email Validation
export const validateEmail = email => {
  if (!email || typeof email !== 'string') return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

// URL Validation for API endpoints
export const validateURL = url => {
  if (!url || typeof url !== 'string') return false;

  try {
    const urlObj = new URL(url);
    // Only allow HTTPS for external APIs
    return urlObj.protocol === 'https:' && urlObj.hostname !== 'localhost';
  } catch {
    return false;
  }
};

// Rate Limiting Helper
export class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }

  isAllowed(identifier) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Clean old requests
    if (this.requests.has(identifier)) {
      const userRequests = this.requests
        .get(identifier)
        .filter(timestamp => timestamp > windowStart);
      this.requests.set(identifier, userRequests);
    }

    const currentRequests = this.requests.get(identifier) || [];

    if (currentRequests.length >= this.maxRequests) {
      return false;
    }

    currentRequests.push(now);
    this.requests.set(identifier, currentRequests);
    return true;
  }

  getRemainingRequests(identifier) {
    const currentRequests = this.requests.get(identifier) || [];
    return Math.max(0, this.maxRequests - currentRequests.length);
  }

  getResetTime(identifier) {
    const currentRequests = this.requests.get(identifier) || [];
    if (currentRequests.length === 0) return 0;

    const oldestRequest = Math.min(...currentRequests);
    return oldestRequest + this.windowMs;
  }
}

// Content Security Policy Violation Reporter
export const reportCSPViolation = violationEvent => {
  console.warn('CSP Violation:', {
    blockedURI: violationEvent.blockedURI,
    violatedDirective: violationEvent.violatedDirective,
    originalPolicy: violationEvent.originalPolicy,
    timestamp: new Date().toISOString()
  });

  // In production, send to monitoring service
  if (import.meta.env.PROD && import.meta.env.VITE_MONITORING_ENDPOINT) {
    fetch(import.meta.env.VITE_MONITORING_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'csp_violation',
        violation: {
          blockedURI: violationEvent.blockedURI,
          violatedDirective: violationEvent.violatedDirective,
          timestamp: new Date().toISOString()
        }
      })
    }).catch(console.error);
  }
};

// Secure Random String Generator
export const generateSecureToken = (length = 32) => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// API Key Masking for Logs
export const maskApiKey = apiKey => {
  if (!apiKey || typeof apiKey !== 'string') return '[INVALID]';
  if (apiKey === 'demo') return '[DEMO]';

  const length = apiKey.length;
  if (length <= 8) return '*'.repeat(length);

  return apiKey.substring(0, 4) + '*'.repeat(length - 8) + apiKey.substring(length - 4);
};

// Environment Variable Validation
export const validateEnvironment = (env = import.meta.env) => {
  const requiredVars = ['VITE_APP_ENV'];

  const missing = requiredVars.filter(varName => !env[varName]);

  if (missing.length > 0) {
    console.warn('Missing environment variables:', missing);
  }

  // Validate API keys format if provided
  const apiKeys = {
    VITE_ALPHA_VANTAGE_API_KEY: /^[A-Z0-9]{16}$/,
    VITE_FMP_API_KEY: /^[a-f0-9]{32}$/
  };

  Object.entries(apiKeys).forEach(([varName, pattern]) => {
    const value = env[varName];
    if (value && value !== 'demo' && !pattern.test(value)) {
      console.warn(`Invalid format for ${varName}`);
    }
  });

  return missing.length === 0;
};

// Initialize CSP violation reporting
if (typeof window !== 'undefined') {
  document.addEventListener('securitypolicyviolation', reportCSPViolation);
}
