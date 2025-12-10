import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Simple client-side authentication and RBAC context with mock mode using localStorage.
 * If REACT_APP_API_BASE is set, this context is still used but should be fed by actual backend later.
 */

// Storage keys
const AUTH_USER_KEY = 'auth:currentUser';
const AUTH_MODE_KEY = 'auth:mode';

// Default role-permission map in mock mode
export const DEFAULT_ROLE_PERMISSIONS = {
  ADMIN: ['manage_libraries', 'manage_staff', 'manage_inventory', 'view_reports'],
  LIBRARIAN: ['manage_inventory', 'view_reports'],
  ASSISTANT: ['view_reports'],
};

// PUBLIC_INTERFACE
export const AuthContext = createContext(null);

/**
 * Load persisted user from localStorage
 */
function loadUser() {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Persist user to localStorage
 */
function saveUser(user) {
  try {
    if (!user) {
      localStorage.removeItem(AUTH_USER_KEY);
    } else {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    }
  } catch {
    // ignore
  }
}

/**
 * Determine if we run in mock mode: when REACT_APP_API_BASE is not provided.
 */
function isMockMode() {
  const mode = localStorage.getItem(AUTH_MODE_KEY);
  if (mode === 'mock') return true;
  if (mode === 'real') return false;
  const fromEnv = !!(process.env.REACT_APP_API_BASE);
  return !fromEnv;
}

/**
 * Build a mock user from a role name
 */
function buildMockUserForRole(role) {
  const roles = [role];
  const permissions = Array.from(new Set((DEFAULT_ROLE_PERMISSIONS[role] || [])));
  return {
    id: 'mock-user',
    name: `Mock ${role}`,
    roles,
    permissions,
  };
}

/**
 * PUBLIC_INTERFACE
 * AuthProvider supplies currentUser, hasRole, hasPermission, login/logout, and mock/real flag.
 */
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => loadUser());
  const [mock, setMock] = useState(isMockMode());

  useEffect(() => {
    // persist current user
    saveUser(currentUser);
  }, [currentUser]);

  useEffect(() => {
    // respond to external changes (e.g., other tabs)
    const onStorage = (e) => {
      if (e.key === AUTH_USER_KEY) {
        try {
          setCurrentUser(e.newValue ? JSON.parse(e.newValue) : null);
        } catch {}
      } else if (e.key === AUTH_MODE_KEY) {
        setMock(isMockMode());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const hasRole = useMemo(() => {
    return (role) => !!(currentUser?.roles || []).includes(role);
  }, [currentUser]);

  const hasPermission = useMemo(() => {
    return (perm) => !!(currentUser?.permissions || []).includes(perm);
  }, [currentUser]);

  const loginAsRole = (role) => {
    const user = buildMockUserForRole(role);
    setCurrentUser(user);
    try { localStorage.setItem(AUTH_MODE_KEY, 'mock'); } catch {}
    setMock(true);
  };

  const login = async (credentials) => {
    // Placeholder to integrate with real backend later
    // For now, just set mock user based on passed role or default ADMIN
    const role = credentials?.role || 'ADMIN';
    loginAsRole(role);
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const value = useMemo(() => ({
    currentUser,
    hasRole,
    hasPermission,
    login,
    logout,
    mock,
    // helper to switch role quickly in mock
    loginAsRole,
  }), [currentUser, hasRole, hasPermission, mock]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAuth() {
  /** Access auth context values in components. */
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
