import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function RoleRoute({ allowedRoles = [], children }) {
  const { user, role } = useAuth();

  const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());
  const userRole = (role || '').toLowerCase();

  if (!normalizedAllowed.includes(userRole)) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-4">
        <div className="h-14 w-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center ring-8 ring-rose-50/50">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Your account role (<span className="font-semibold capitalize">{role || 'guest'}</span>) does not have authorization to view this clinical portal.
        </p>
        <p className="text-xs text-slate-400">
          Required roles: {allowedRoles.join(', ')}
        </p>
        <Button variant="primary" size="sm" onClick={() => window.history.back()}>
          Return Back
        </Button>
      </div>
    );
  }

  return children ? children : <Outlet />;
}
