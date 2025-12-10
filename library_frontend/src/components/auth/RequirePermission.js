import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// PUBLIC_INTERFACE
export default function RequirePermission({ permission, children, fallback = null }) {
  /**
   * Wraps children and renders them only if the current user has the given permission.
   * If not, renders fallback or navigates to /staff/forbidden if fallback is null.
   */
  const { currentUser, hasPermission } = useAuth() || {};

  if (!currentUser) {
    return <Navigate to="/staff/login" replace />;
  }
  if (!hasPermission || !hasPermission(permission)) {
    return fallback ?? <Navigate to="/staff/forbidden" replace />;
  }
  return children;
}

// PUBLIC_INTERFACE
export function RequirePermissionWrapper(props) {
  return <RequirePermission {...props} />;
}
