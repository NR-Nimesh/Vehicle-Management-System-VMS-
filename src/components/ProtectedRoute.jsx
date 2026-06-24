import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // Not logged in, redirect to login page
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Logged in but doesn't have the right role
    // Display an alert or simply redirect
    // React state can be used or just a window.alert
    if (user.role === 'user') {
      window.alert("Access Denied: You do not have permission to access this page.");
      return <Navigate to="/billing" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
}
