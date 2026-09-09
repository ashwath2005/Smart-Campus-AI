import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './ProtectedRoute.css';

export const ProtectedRoute = ({
  children,
  allowedRoles,
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="protected-route-loading-container">
        <div className="protected-route-loading-content">
          <div className="protected-route-spinner" />
          <p className="protected-route-loading-text">Loading Smart Campus...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login but save current location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role === 'student' && user.is_first_login && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Role not authorized, redirect to their default dashboard
    const defaultPaths = {
      student: '/dashboard',
      faculty: '/faculty',
      hod: '/hod',
      admin: '/admin',
      security: '/gate-security',
      guardian: '/guardian-gate-pass',
    };
    return <Navigate to={defaultPaths[user.role] || '/login'} replace />;
  }

  return <>{children}</>;
};
