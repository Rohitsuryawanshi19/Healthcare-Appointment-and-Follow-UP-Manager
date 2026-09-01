import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Search,
  Filter,
  Eye,
  Check,
  XCircle,
  FileText,
  User,
  AlertTriangle,
} from 'lucide-react';
import { doctorService } from '../../services/doctorService';
import { PageHeader } from '../../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Avatar, AvatarFallback } from '../../components/ui/Avatar';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useToast } from '../../components/ui/Toast';
import { PageTransition } from '../../components/ui/PageTransition';

export default function DoctorAppointmentsPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filter = searchParams.get('filter') || '';
  const status = searchParams.get('status') || '';

  const loadAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filter) params.filter = filter;
      if (status) params.status = status;

      const res = await doctorService.getAppointments(params);
      let list = res.data || [];

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        list = list.filter(
          (a) =>
            a.patientId?.name?.toLowerCase().includes(query) ||
            a.symptoms?.toLowerCase().includes(query) ||
            a.aiSummary?.chiefComplaint?.toLowerCase().includes(query)
        );
      }

      setAppointments(list);
    } catch (err) {
      setError(err.message || 'Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [filter, status, searchQuery]);

  const handleComplete = async (id) => {
    try {
      await doctorService.updateAppointmentStatus(id, 'completed');
      toast({
        title: 'Status Updated',
        description: 'Consultation marked as completed.',
        variant: 'success',
      });
      loadAppointments();
    } catch (err) {
      toast({
        title: 'Update Failed',
        description: err.message || 'Error updating status.',
        variant: 'error',
      });
    }
  };

  const getUrgencyBadge = (urgency = 'low') => {
    switch (urgency) {
      case 'emergency':
        return <Badge variant="error" size="sm" dot>Emergency</Badge>;
      case 'high':
        return <Badge variant="error" size="sm" dot>High Urgency</Badge>;
      case 'medium':
        return <Badge variant="warning" size="sm" dot>Medium Urgency</Badge>;
      default:
        return <Badge variant="success" size="sm" dot>Standard Routine</Badge>;
    }
  };

  return (
    <PageTransition className="space-y-6 text-left">
      <PageHeader
        title="Patient Consultations & Visits"
        description="Review scheduled appointments, inspect pre-visit symptoms, and access clinical charting records."
        badge={<Badge variant="primary">{appointments.length} Consultations</Badge>}
      />

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {[
              { label: 'All Consultations', filter: '', status: '' },
              { label: 'Today', filter: 'today', status: '' },
              { label: 'Upcoming', filter: 'upcoming', status: '' },
              { label: 'Completed', filter: '', status: 'completed' },
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

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by patient name, symptom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white"
            />
          </div>
        </div>
      </Card>

      {/* Main List */}
      {loading ? (
        <LoadingState label="Loading patient schedule..." />
      ) : error ? (
        <ErrorState title="Error Loading Appointments" description={error} onRetry={loadAppointments} />
      ) : appointments.length === 0 ? (
        <Card className="p-12 text-center text-xs text-slate-500">
          No appointments found matching your selected filters.
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {appointments.map((appt) => (
            <Card key={appt._id} className="p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
              <div className="space-y-3">
                {/* Header: Patient Name & Status */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar size="md">
                      <AvatarFallback className="bg-teal-50 text-teal-800 font-bold">
                        {appt.patientId?.name?.substring(0, 2).toUpperCase() || 'PT'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {appt.patientId?.name || 'Patient'}
                      </h4>
                      <p className="text-[11px] text-slate-400">{appt.patientId?.email}</p>
                    </div>
                  </div>
                  <StatusBadge status={appt.status} size="sm" />
                </div>

                {/* Date & Time Slot + Urgency */}
                <div className="flex items-center justify-between text-xs py-2 border-y border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                    <Clock className="h-3.5 w-3.5 text-teal-600" />
                    <span>{appt.date} • {appt.startTime} - {appt.endTime}</span>
                  </div>
                  <div>
                    {getUrgencyBadge(appt.aiSummary?.triageUrgency)}
                  </div>
                </div>

                {/* Chief Complaint / Symptoms */}
                <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                  <span className="font-semibold text-slate-700 block text-[11px] uppercase tracking-wider mb-0.5">
                    Pre-Visit Notes:
                  </span>
                  <p className="line-clamp-2">
                    {appt.aiSummary?.chiefComplaint || appt.symptoms || 'No pre-visit symptoms recorded.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/doctor/appointments/${appt._id}`)}
                  leftIcon={<Eye className="h-3.5 w-3.5" />}
                >
                  Chart & Notes
                </Button>
                {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                    onClick={() => handleComplete(appt._id)}
                    leftIcon={<Check className="h-3.5 w-3.5" />}
                  >
                    Complete
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageTransition>
  );
}
