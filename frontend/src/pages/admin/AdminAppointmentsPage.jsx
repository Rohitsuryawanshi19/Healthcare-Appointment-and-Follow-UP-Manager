import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Calendar, Filter, Search, User, Clock, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { PageHeader } from '../../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Avatar, AvatarFallback } from '../../components/ui/Avatar';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { PageTransition } from '../../components/ui/PageTransition';

export default function AdminAppointmentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const statusFilter = searchParams.get('status') || 'all';

  const loadAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await adminService.getAppointments(params);
      setAppointments(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [statusFilter]);

  return (
    <PageTransition className="space-y-6 text-left">
      <PageHeader
        title="System Appointments Audit"
        description="Review all clinical consultations, slot locks, patient symptom summaries, and cancellation logs across all clinic providers."
        badge={<Badge variant="primary">{appointments.length} Consultations</Badge>}
      />

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'all', label: 'All Consultations' },
            { id: 'confirmed', label: 'Confirmed' },
            { id: 'held', label: 'Held / Booking Lock' },
            { id: 'pending', label: 'Pending Review' },
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'all') {
                  searchParams.delete('status');
                } else {
                  searchParams.set('status', tab.id);
                }
                setSearchParams(searchParams);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Main Appointments Table */}
      {loading ? (
        <LoadingState label="Auditing appointments database..." />
      ) : error ? (
        <ErrorState title="Error Loading Consultations" description={error} onRetry={loadAppointments} />
      ) : appointments.length === 0 ? (
        <Card className="p-12 text-center text-xs text-slate-500">
          No appointments found for the selected status.
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3.5 px-4">Patient</th>
                  <th className="py-3.5 px-4">Doctor</th>
                  <th className="py-3.5 px-4">Date & Time Slot</th>
                  <th className="py-3.5 px-4">Pre-Visit Chief Complaint</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((appt) => (
                  <tr key={appt._id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Patient */}
                    <td className="py-4 px-4 font-semibold text-slate-900">
                      <div>{appt.patientId?.name || 'Anonymous Patient'}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{appt.patientId?.email}</div>
                    </td>

                    {/* Doctor */}
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-800">
                        {appt.doctorId?.userId?.name || 'Specialist'}
                      </div>
                      <div className="text-[11px] text-teal-700 font-medium">
                        {appt.doctorId?.specialization || 'Clinical Generalist'}
                      </div>
                    </td>

                    {/* Date & Time */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900">{appt.date}</div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {appt.startTime} - {appt.endTime}
                      </div>
                    </td>

                    {/* Symptoms / Chief complaint */}
                    <td className="py-4 px-4 max-w-xs">
                      {appt.aiSummary?.chiefComplaint ? (
                        <div className="text-slate-800 font-medium truncate">
                          {appt.aiSummary.chiefComplaint}
                        </div>
                      ) : appt.symptoms ? (
                        <div className="text-slate-600 truncate italic">"{appt.symptoms}"</div>
                      ) : (
                        <span className="text-slate-400 italic">No notes recorded</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <StatusBadge status={appt.status} size="sm" />
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
