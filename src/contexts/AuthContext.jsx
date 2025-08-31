import React, { createContext, useContext, useState, useEffect } from 'react';

import secureApiClient from '../services/secureApiClient';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      const storedUser = localStorage.getItem('user');

      if (accessToken && refreshToken && storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);

        // Set up axios interceptor for authentication
        setupAxiosInterceptors();
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const setupAxiosInterceptors = () => {
    // Request interceptor to add auth token
    secureApiClient.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    secureApiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && !error.config._retry) {
          error.config._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await secureApiClient.post('/auth/refresh', {
                refreshToken
              });

              if (response.data.success) {
                localStorage.setItem('accessToken', response.data.accessToken);
                error.config.headers.Authorization = `Bearer ${response.data.accessToken}`;
                return secureApiClient.request(error.config);
              }
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  };

  const login = async (credentials) => {
    try {
      const response = await secureApiClient.post('/auth/login', credentials);

      if (response.data.success) {
        const { user: userData, accessToken, refreshToken } = response.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));

        setUser(userData);
        setIsAuthenticated(true);
        setupAxiosInterceptors();

        return { success: true, user: userData };
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await secureApiClient.post('/auth/register', userData);

      if (response.data.success) {
        const { user: newUser, accessToken, refreshToken } = response.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(newUser));

        setUser(newUser);
        setIsAuthenticated(true);
        setupAxiosInterceptors();

        return { success: true, user: newUser };
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed',
        validationErrors: error.response?.data?.errors
      };
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await secureApiClient.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local storage regardless of API call result
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('rememberMe');

      setUser(null);
      setIsAuthenticated(false);

      // Clear axios interceptors
      secureApiClient.interceptors.request.clear();
      secureApiClient.interceptors.response.clear();
    }
  };

  const refreshAuthToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await secureApiClient.post('/auth/refresh', {
        refreshToken
      });

      if (response.data.success) {
        localStorage.setItem('accessToken', response.data.accessToken);
        return response.data.accessToken;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      throw error;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshAuthToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
