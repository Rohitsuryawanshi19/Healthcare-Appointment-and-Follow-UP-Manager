import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/ui/LoadingState';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingState label="Verifying clinical credentials..." variant="pulse" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login preserving destination
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
}
