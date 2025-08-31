import React from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';

import Register from '../components/auth/Register';
import { useAuth } from '../contexts/AuthContext';

const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();

  // If already authenticated, redirect to dashboard or intended destination
  if (!loading && isAuthenticated) {
    const from = location.state?.from?.pathname || '/financial-model-workspace';
    return <Navigate to={from} replace />;
  }

  // Show loading while checking auth status
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const handleRegister = _registerData => {
    // Navigate to intended destination or dashboard
    const from = location.state?.from?.pathname || '/financial-model-workspace';
    navigate(from, { replace: true });
  };

  const handleLogin = () => {
    navigate('/login', { state: location.state });
  };

  return <Register onRegister={handleRegister} onLogin={handleLogin} />;
};

export default RegisterPage;
