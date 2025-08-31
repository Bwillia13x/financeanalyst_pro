import React, { useState, useEffect } from 'react';

import { useAuth } from '../../contexts/AuthContext';
import { trackComponentRender } from '../../utils/performanceMonitoring';

const Register = ({
  onRegister,
  onLogin,
  className = '',
  redirectUrl = '/dashboard'
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    agreeToTerms: false
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register } = useAuth();

  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      trackComponentRender('Register', endTime - startTime);
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

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

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
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Terms validation
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
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
      const result = await register({
        email: formData.email,
        password: formData.password,
        name: formData.name
      });

      if (result.success) {
        if (onRegister) {
          onRegister({
            user: result.user,
            redirectUrl
          });
        }
      } else {
        // Handle validation errors from backend
        if (result.validationErrors) {
          const backendErrors = {};
          result.validationErrors.forEach(err => {
            if (err.path) {
              backendErrors[err.path] = err.msg;
            }
          });
          setErrors(backendErrors);
        } else {
          setErrors({
            general: result.error || 'Registration failed. Please try again.'
          });
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({
        general: 'An error occurred during registration. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    if (onLogin) {
      onLogin();
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className={`register-container ${className}`}>
      <div className="register-card">
        <div className="register-header">
          <h2>Create Account</h2>
          <p>Join FinanceAnalyst Pro today</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          {errors.general && <div className="error-message general-error">{errors.general}</div>}

          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={errors.name ? 'error' : ''}
              placeholder="Enter your full name"
              disabled={isLoading}
              autoComplete="name"
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

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
                placeholder="Create a password"
                disabled={isLoading}
                autoComplete="new-password"
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

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={errors.confirmPassword ? 'error' : ''}
                placeholder="Confirm your password"
                disabled={isLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={toggleConfirmPasswordVisibility}
                disabled={isLoading}
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleInputChange}
                disabled={isLoading}
              />
              <span>I agree to the <a href="/terms" target="_blank">Terms of Service</a> and <a href="/privacy" target="_blank">Privacy Policy</a></span>
            </label>
            {errors.agreeToTerms && <span className="error-message">{errors.agreeToTerms}</span>}
          </div>

          <button type="submit" className="register-button" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>

          <div className="register-footer">
            <p>
              Already have an account?{' '}
              <button
                type="button"
                className="login-link"
                onClick={handleLoginRedirect}
                disabled={isLoading}
              >
                Sign in
              </button>
            </p>
          </div>
        </form>
      </div>

      <style>
        {`
        .register-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 1rem;
        }

        .register-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          padding: 2rem;
          width: 100%;
          max-width: 450px;
        }

        .register-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .register-header h2 {
          margin: 0 0 0.5rem 0;
          color: #1e293b;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .register-header p {
          margin: 0;
          color: #64748b;
          font-size: 0.875rem;
        }

        .register-form {
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

        .checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          cursor: pointer;
          color: #374151;
          font-size: 0.875rem;
          line-height: 1.4;
        }

        .checkbox-label input[type="checkbox"] {
          width: auto;
          margin: 0;
          margin-top: 0.125rem;
        }

        .checkbox-label a {
          color: #3b82f6;
          text-decoration: underline;
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

        .register-button {
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

        .register-button:hover:not(:disabled) {
          background: #2563eb;
        }

        .register-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .register-footer {
          text-align: center;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
          color: #64748b;
        }

        .login-link {
          background: none;
          border: none;
          color: #3b82f6;
          cursor: pointer;
          font-weight: 600;
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .register-container {
            padding: 0.5rem;
          }

          .register-card {
            padding: 1.5rem;
          }
        }
      `}
      </style>
    </div>
  );
};

export default Register;
