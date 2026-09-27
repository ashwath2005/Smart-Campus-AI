import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_DEFAULT_REDIRECTS } from '../../constants/roles';
import { ROUTES } from '../../constants/routes';
import '../../components/ProtectedRoute/ProtectedRoute.css';

/**
 * Route protection guard based on authentication and authorized roles.
 */
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
    // Redirect to login preserving the attempted destination
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (user.role === 'student' && user.is_first_login && location.pathname !== ROUTES.CHANGE_PASSWORD) {
    return <Navigate to={ROUTES.CHANGE_PASSWORD} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Role not authorized, redirect to their default dashboard
    const redirectPath = ROLE_DEFAULT_REDIRECTS[user.role] || ROUTES.LOGIN;
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
