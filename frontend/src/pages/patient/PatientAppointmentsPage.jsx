import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, Clock, Eye, Search, Plus, ArrowRight } from 'lucide-react';
import { patientService } from '../../services/patientService';
import { PageHeader } from '../../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Avatar, AvatarFallback } from '../../components/ui/Avatar';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { PageTransition } from '../../components/ui/PageTransition';

export default function PatientAppointmentsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const filter = searchParams.get('filter') || '';
  const status = searchParams.get('status') || '';

  const loadAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filter) params.filter = filter;
      if (status) params.status = status;

      const res = await patientService.getAppointments(params);
      setAppointments(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load your appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [filter, status]);

  return (
    <PageTransition className="space-y-6 text-left max-w-5xl mx-auto">
      <PageHeader
        title="My Appointments & Consultations"
        description="View upcoming bookings, track slot reservations, and review past physician summaries."
        badge={<Badge variant="primary">{appointments.length} Consultations</Badge>}
        actions={
          <Link to="/patient/doctors">
            <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
              Book New Appointment
            </Button>
          </Link>
        }
      />

      {/* Filter Tabs */}
      <Card className="p-4">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { label: 'All Consultations', filter: '', status: '' },
            { label: 'Upcoming Only', filter: 'upcoming', status: '' },
            { label: 'Completed History', filter: '', status: 'completed' },
            { label: 'Cancelled', filter: '', status: 'cancelled' },
          ].map((tab) => {
            const isActive =
              (tab.filter === filter && tab.status === status) ||
              (!tab.filter && !tab.status && !filter && !status);
            return (
              <button
                key={tab.label}
                onClick={() => {
                  const nextParams = new URLSearchParams();
                  if (tab.filter) nextParams.set('filter', tab.filter);
                  if (tab.status) nextParams.set('status', tab.status);
                  setSearchParams(nextParams);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Appointments List */}
      {loading ? (
        <LoadingState label="Loading your appointments..." />
      ) : error ? (
        <ErrorState title="Error Loading Appointments" description={error} onRetry={loadAppointments} />
      ) : appointments.length === 0 ? (
        <Card className="p-12 text-center text-xs text-slate-500 space-y-3">
          <p>No appointments found for the selected filter.</p>
          <Link to="/patient/doctors">
            <Button variant="primary" size="sm">
              Explore Available Specialists
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {appointments.map((appt) => (
            <Card key={appt._id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-3.5">
                <Avatar size="md">
                  <AvatarFallback className="bg-teal-50 text-teal-800 font-bold">
                    {appt.doctorId?.userId?.name?.substring(0, 2).toUpperCase() || 'DR'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {appt.doctorId?.userId?.name || 'Doctor'}
                  </h4>
                  <p className="text-xs text-teal-700 font-medium">
                    {appt.doctorId?.specialization || 'Clinical Specialist'}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-semibold">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-teal-600" /> {appt.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-teal-600" /> {appt.startTime} - {appt.endTime}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <StatusBadge status={appt.status} size="sm" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/patient/appointments/${appt._id}`)}
                  leftIcon={<Eye className="h-3.5 w-3.5" />}
                >
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageTransition>
  );
}
