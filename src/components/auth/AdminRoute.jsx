import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const AdminRoute = ({ children }) => {
  const location = useLocation();
  let isAdmin = false;
  try {
    const raw = localStorage.getItem('user');
    if (raw) {
      const user = JSON.parse(raw);
      isAdmin = user?.role === 'admin';
    }
  } catch {}

  if (!isAdmin) {
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }
  return children;
};

export default AdminRoute;

