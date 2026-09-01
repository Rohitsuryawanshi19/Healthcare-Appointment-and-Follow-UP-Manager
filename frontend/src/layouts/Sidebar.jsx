import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Calendar,
  Users,
  UserCheck,
  Clock,
  Settings,
  LayoutDashboard,
  ShieldCheck,
  UserPlus,
  Stethoscope,
  FileText,
  User,
  Pill,
  Search,
  ChevronRight,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { Badge } from '../components/ui/Badge';

export function Sidebar({ className, onCloseMobile }) {
  const { role, user } = useAuth();
  const isAdmin = role === 'admin';
  const isDoctor = role === 'doctor';
  const isPatient = role === 'patient' || !role;

  const patientNavItems = [
    { label: 'Patient Dashboard', to: '/patient/dashboard', icon: LayoutDashboard },
    { label: 'Find a Doctor', to: '/patient/doctors', icon: Search, badge: 'Doctors' },
    { label: 'My Appointments', to: '/patient/appointments', icon: Calendar },
    { label: 'Medications & Rx', to: '/patient/medications', icon: Pill },
    { label: 'My Profile', to: '/patient/profile', icon: User },
    { label: 'Design System', to: '/design-system', icon: Layers, isNew: true },
  ];

  const doctorNavItems = [
    { label: 'Doctor Dashboard', to: '/doctor/dashboard', icon: Stethoscope, badge: 'Doctor' },
    { label: 'Patient Consultations', to: '/doctor/appointments', icon: Calendar },
    { label: 'Schedule & Leaves', to: '/doctor/schedule', icon: Clock },
    { label: 'Physician Profile', to: '/doctor/profile', icon: User },
    { label: 'Design System', to: '/design-system', icon: Layers, isNew: true },
  ];

  const adminNavItems = [
    { label: 'Admin Console', to: '/admin/dashboard', icon: ShieldCheck, badge: 'Admin' },
    { label: 'Doctors Directory', to: '/admin/doctors', icon: UserCheck },
    { label: 'Add New Doctor', to: '/admin/doctors/create', icon: UserPlus },
    { label: 'Appointments Audit', to: '/admin/appointments', icon: Calendar },
    { label: 'User Directory', to: '/admin/users', icon: Users },
    { label: 'Design System', to: '/design-system', icon: Layers, isNew: true },
  ];

  const navItems = isAdmin ? adminNavItems : isDoctor ? doctorNavItems : patientNavItems;

  return (
    <aside
      className={cn(
        'flex flex-col h-full w-64 border-r border-slate-200/80 bg-white select-none',
        className
      )}
    >
      {/* Clinic / Role Context Badge */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-200/60">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                isAdmin
                  ? 'bg-purple-100 text-purple-800'
                  : isDoctor
                  ? 'bg-teal-100 text-teal-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {isAdmin ? 'AD' : isDoctor ? 'DR' : 'PT'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
                {isAdmin ? 'CareFlow Admin Hub' : isDoctor ? 'Physician Suite' : 'Patient Health Hub'}
              </p>
              <p className="text-[10px] text-slate-500 truncate leading-tight mt-0.5 capitalize">
                {user?.role || 'Patient'} Account
              </p>
            </div>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {isAdmin ? 'Administrative Suite' : isDoctor ? 'Clinical Suite' : 'Care Navigation'}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-teal-50/80 text-teal-800 font-semibold shadow-xs border border-teal-200/50'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0 transition-colors',
                      isActive ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600'
                    )}
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <Badge variant={isAdmin ? 'error' : isDoctor ? 'primary' : 'secondary'} size="sm">
                      {item.badge}
                    </Badge>
                  )}
                  {item.isNew && (
                    <Badge variant="info" size="sm">
                      New
                    </Badge>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/40">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            CareFlow Secure
          </span>
          <span className="font-mono text-[11px] text-slate-400">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
}
