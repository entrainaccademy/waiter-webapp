import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import socketService from '../services/socket';

const AuthContext = createContext(null);

export const DEFAULT_ROLE_PERMISSIONS = {
  SUPER_ADMIN: ['*'],
  ADMIN: [
    'dashboard:view',
    'staff:manage',
    'menu:manage',
    'orders:create',
    'orders:view',
    'orders:manage',
    'kot:view',
    'kot:manage',
    'billing:create',
    'billing:view',
    'payments:manage',
    'inventory:manage',
    'reports:view',
    'settings:manage',
  ],
  MANAGER: [
    'dashboard:view',
    'staff:manage',
    'menu:manage',
    'orders:create',
    'orders:view',
    'orders:manage',
    'kot:view',
    'kot:manage',
    'billing:create',
    'billing:view',
    'payments:manage',
    'inventory:manage',
    'reports:view',
  ],
  CASHIER: [
    'dashboard:view',
    'orders:create',
    'orders:view',
    'orders:manage',
    'kot:view',
    'kot:manage',
    'billing:create',
    'billing:view',
    'payments:manage',
  ],
  WAITER: [
    'dashboard:view',
    'orders:create',
    'orders:view',
    'kot:view',
  ],
  KITCHEN_STAFF: [
    'dashboard:view',
    'orders:view',
    'orders:manage',
    'kot:view',
    'kot:manage',
  ],
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => authService.getStoredUser());
  const [token, setToken] = useState(() => authService.getStoredToken());
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [socketConnected, setSocketConnected] = useState(false);

  // Connectivity tracking
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Socket status tracking
  useEffect(() => {
    const onSocketConnected = () => setSocketConnected(true);
    const onSocketDisconnected = () => setSocketConnected(false);

    window.addEventListener('socket:connected', onSocketConnected);
    window.addEventListener('socket:disconnected', onSocketDisconnected);

    return () => {
      window.removeEventListener('socket:connected', onSocketConnected);
      window.removeEventListener('socket:disconnected', onSocketDisconnected);
    };
  }, []);

  // Session expired event handler
  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
  }, []);

  // Initialize and verify user on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = authService.getStoredToken();
      if (storedToken) {
        try {
          const freshUser = await authService.getMe();
          setUser(freshUser);
          setToken(storedToken);
          socketService.connect();
        } catch (err) {
          console.warn('Initial session check failed:', err.message);
          // If offline, keep stored session
          if (!navigator.onLine && authService.getStoredUser()) {
            setUser(authService.getStoredUser());
          } else {
            await authService.logout();
            setUser(null);
            setToken(null);
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const { accessToken, user: loggedInUser } = await authService.login(email, password);
    setToken(accessToken);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const logout = async () => {
    await authService.logout();
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    try {
      const freshUser = await authService.getMe();
      setUser(freshUser);
      return freshUser;
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
      return null;
    }
  };

  /**
   * Checks if user has a specific permission.
   * SuperAdmin & Restaurant Admin possess all permissions.
   */
  const hasPermission = useCallback(
    (permission) => {
      if (!user) return false;
      if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') return true;

      const userExplicit = Array.isArray(user.permissions) ? user.permissions : [];
      const roleDefaults = DEFAULT_ROLE_PERMISSIONS[user.role] || [];
      const effective = new Set([...userExplicit, ...roleDefaults]);

      return effective.has(permission);
    },
    [user]
  );

  const hasAnyPermission = useCallback(
    (permissions = []) => {
      if (!user) return false;
      if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') return true;
      return permissions.some((p) => hasPermission(p));
    },
    [user, hasPermission]
  );

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(token && user),
    isOnline,
    socketConnected,
    login,
    logout,
    refreshProfile,
    hasPermission,
    hasAnyPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
