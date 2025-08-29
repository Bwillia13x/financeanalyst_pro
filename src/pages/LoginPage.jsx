import React from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import Login from '../components/auth/Login';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleLogin = (loginData) => {
    // Navigate to intended destination or dashboard
    const from = location.state?.from?.pathname || '/financial-model-workspace';
    navigate(from, { replace: true });
  };

  const handleRegister = () => {
    navigate('/register', { state: location.state });
  };

  const handleForgotPassword = (email) => {
    // In a real app, this would trigger a password reset email
    alert(`Password reset email would be sent to: ${email}`);
  };

  return (
    <Login
      onLogin={handleLogin}
      onRegister={handleRegister}
      onForgotPassword={handleForgotPassword}
    />
  );
};

export default LoginPage;
