import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, Search, Mail, Phone, Calendar, Shield, UserCheck, Heart } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { PageHeader } from '../../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar, AvatarFallback } from '../../components/ui/Avatar';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { PageTransition } from '../../components/ui/PageTransition';

export default function AdminUsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const roleFilter = searchParams.get('role') || 'all';

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (roleFilter !== 'all') params.role = roleFilter;
      if (searchQuery) params.search = searchQuery;

      const res = await adminService.getUsers(params);
      setUsers(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch user directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter, searchQuery]);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <Badge variant="error" size="sm" dot>Admin</Badge>;
      case 'doctor':
        return <Badge variant="primary" size="sm" dot>Doctor</Badge>;
      default:
        return <Badge variant="secondary" size="sm" dot>Patient</Badge>;
    }
  };

  return (
    <PageTransition className="space-y-6 text-left">
      <PageHeader
        title="User Account Directory"
        description="Comprehensive directory of all registered Patients, Practicing Doctors, and System Administrators."
        badge={<Badge variant="primary">{users.length} Registered Accounts</Badge>}
      />

      {/* Filters and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {[
              { id: 'all', label: 'All Accounts' },
              { id: 'patient', label: 'Patients Only' },
              { id: 'doctor', label: 'Doctors Only' },
              { id: 'admin', label: 'Administrators' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'all') {
                    searchParams.delete('role');
                  } else {
                    searchParams.set('role', tab.id);
                  }
                  setSearchParams(searchParams);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  roleFilter === tab.id
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white"
            />
          </div>
        </div>
      </Card>

      {/* Users Table */}
      {loading ? (
        <LoadingState label="Loading accounts..." />
      ) : error ? (
        <ErrorState title="Error Loading Users" description={error} onRetry={loadUsers} />
      ) : users.length === 0 ? (
        <Card className="p-12 text-center text-xs text-slate-500">
          No user accounts found matching your filter criteria.
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Registered Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <Avatar size="sm">
                          <AvatarFallback className="bg-slate-100 text-slate-700 font-bold">
                            {user.name?.substring(0, 2).toUpperCase() || 'US'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div>{user.name}</div>
                          <div className="text-[11px] text-slate-400 font-normal">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      <div>{user.phone || 'No phone recorded'}</div>
                    </td>
                    <td className="py-4 px-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="py-4 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </PageTransition>
  );
}
