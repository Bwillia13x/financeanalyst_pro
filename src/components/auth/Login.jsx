import React, { useState, useEffect } from 'react';

import { trackComponentRender } from '../../utils/performanceMonitoring';

const Login = ({
  onLogin,
  onForgotPassword,
  onRegister,
  className = '',
  redirectUrl = '/dashboard'
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);

  useEffect(() => {
    // Track component performance
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      trackComponentRender('Login', endTime - startTime);
    };
  }, []);

  const handleInputChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // Rate limiting check
    if (loginAttempts >= 5) {
      newErrors.general = 'Too many failed login attempts. Please try again later.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate authentication logic
      const isValidCredentials = await authenticateUser(formData.email, formData.password);

      if (isValidCredentials) {
        // Successful login
        setLoginAttempts(0);

        if (onLogin) {
          onLogin({
            user: {
              id: 'user123',
              email: formData.email,
              name: 'John Doe'
            },
            token: 'jwt_token_here',
            redirectUrl
          });
        }
      } else {
        // Failed login
        setLoginAttempts(prev => prev + 1);
        setErrors({
          general: 'Invalid email or password. Please try again.'
        });
      }
    } catch (_error) {
      setErrors({
        general: 'An error occurred during login. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const authenticateUser = async (email, password) => {
    // Simulate authentication - in real app, this would call an API
    return new Promise(resolve => {
      setTimeout(() => {
        // Simple validation for demo purposes
        // In real app, this would verify against server
        const validEmail = 'demo@financeanalyst.com';
        const validPassword = 'demo123';

        resolve(email === validEmail && password === validPassword);
      }, 500);
    });
  };

  const handleForgotPassword = () => {
    if (onForgotPassword) {
      onForgotPassword(formData.email);
    }
  };

  const handleRegister = () => {
    if (onRegister) {
      onRegister();
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={`login-container ${className}`}>
      <div className="login-card">
        <div className="login-header">
          <h2>Welcome Back</h2>
          <p>Sign in to your FinanceAnalyst Pro account</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {errors.general && <div className="error-message general-error">{errors.general}</div>}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={errors.email ? 'error' : ''}
              placeholder="Enter your email"
              disabled={isLoading}
              autoComplete="email"
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={errors.password ? 'error' : ''}
                placeholder="Enter your password"
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
                disabled={isLoading}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleInputChange}
                disabled={isLoading}
              />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              className="forgot-password-link"
              onClick={handleForgotPassword}
              disabled={isLoading}
            >
              Forgot password?
            </button>
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>

          <div className="login-footer">
            <p>
              Don&#39;t have an account?{' '}
              <button
                type="button"
                className="register-link"
                onClick={handleRegister}
                disabled={isLoading}
              >
                Sign up
              </button>
            </p>
          </div>
        </form>

        {loginAttempts > 0 && (
          <div className="login-attempts">Login attempts: {loginAttempts}/5</div>
        )}
      </div>

      <style>
        {`
        .login-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 1rem;
        }

        .login-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          padding: 2rem;
          width: 100%;
          max-width: 400px;
        }

        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .login-header h2 {
          margin: 0 0 0.5rem 0;
          color: #1e293b;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .login-header p {
          margin: 0;
          color: #64748b;
          font-size: 0.875rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-weight: 600;
          color: #374151;
          font-size: 0.875rem;
        }

        .form-group input {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.2s ease;
        }

        .form-group input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-group input.error {
          border-color: #ef4444;
        }

        .password-input-container {
          position: relative;
        }

        .password-toggle {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          color: #64748b;
        }

        .error-message {
          color: #ef4444;
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }

        .general-error {
          background: #fef2f2;
          color: #dc2626;
          padding: 0.75rem;
          border-radius: 6px;
          border: 1px solid #fecaca;
          text-align: center;
        }

        .form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          color: #374151;
        }

        .checkbox-label input[type="checkbox"] {
          width: auto;
          margin: 0;
        }

        .forgot-password-link {
          background: none;
          border: none;
          color: #3b82f6;
          cursor: pointer;
          text-decoration: underline;
          font-size: 0.875rem;
        }

        .login-button {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 0.75rem 1rem;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .login-button:hover:not(:disabled) {
          background: #2563eb;
        }

        .login-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .login-footer {
          text-align: center;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
          color: #64748b;
        }

        .register-link {
          background: none;
          border: none;
          color: #3b82f6;
          cursor: pointer;
          font-weight: 600;
          text-decoration: underline;
        }

        .login-attempts {
          margin-top: 1rem;
          padding: 0.75rem;
          background: #fffbeb;
          border: 1px solid #fbbf24;
          border-radius: 6px;
          color: #92400e;
          font-size: 0.875rem;
          text-align: center;
        }

        @media (max-width: 480px) {
          .login-container {
            padding: 0.5rem;
          }

          .login-card {
            padding: 1.5rem;
          }

          .form-options {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }
        }
      `}
      </style>
    </div>
  );
};

export default Login;
