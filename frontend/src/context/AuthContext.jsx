import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { connectSocket, disconnectSocket } from '../services/socket';
import { useToast } from '../components/ui/Toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Check existing session via HTTP-only cookie on mount
  const checkAuth = useCallback(async () => {
    try {
      const res = await authService.getMe();
      if (res?.data?.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Connect socket on active user session and listen for real-time notifications
  useEffect(() => {
    if (!user) {
      disconnectSocket();
      return;
    }

    const socket = connectSocket();
    if (!socket) return;

    const handleNotification = (notif) => {
      if (!notif) return;
      toast({
        title: notif.title || 'CareFlow Notification',
        description: notif.message || notif.description || '',
        variant: notif.variant || (notif.type === 'appointment_cancelled' ? 'warning' : 'info'),
      });
    };

    socket.on('notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
    };
  }, [user, toast]);

  // Login handler
  const login = async (credentials) => {
    const res = await authService.login(credentials);
    if (res?.data?.user) {
      setUser(res.data.user);
    }
    return res;
  };

  // Register handler (patient-only)
  const register = async (patientData) => {
    const res = await authService.register(patientData);
    if (res?.data?.user) {
      setUser(res.data.user);
    }
    return res;
  };

  // Google login/signup handler
  const googleLogin = async (idToken) => {
    const res = await authService.googleAuth(idToken);
    if (res?.data?.user) {
      setUser(res.data.user);
    }
    return res;
  };

  // Logout handler
  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      disconnectSocket();
      setUser(null);
    }
  };

  const value = {
    user,
    role: user?.role || null,
    isAuthenticated: Boolean(user),
    loading,
    login,
    register,
    googleLogin,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
