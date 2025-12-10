import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// PUBLIC_INTERFACE
export default function ProtectedRoute({ requiredRole, children }) {
  /**
   * Route guard that checks authentication and role presence.
   * - If no currentUser, redirect to /staff/login (mock selector page)
   * - If requiredRole provided, ensure user has that role
   */
  const { currentUser, hasRole } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/staff/login" replace state={{ from: location }} />;
  }
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/staff/forbidden" replace />;
  }

  return children || <Outlet />;
}
