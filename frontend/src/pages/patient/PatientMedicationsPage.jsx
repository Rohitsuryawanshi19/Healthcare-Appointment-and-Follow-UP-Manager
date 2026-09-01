import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pill,
  Calendar,
  User,
  Clock,
  AlertCircle,
  CheckCircle2,
  Bell,
  Timer,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Activity,
  History,
} from 'lucide-react';
import { patientService } from '../../services/patientService';
import { PageHeader } from '../../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { PageTransition } from '../../components/ui/PageTransition';

export default function PatientMedicationsPage() {
  const [data, setData] = useState({ medications: [], prescriptions: [], recentReminders: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed' | 'reminders'

  const loadMedications = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await patientService.getMedications();
      setData(res.data || { medications: [], prescriptions: [], recentReminders: [] });
    } catch (err) {
      setError(err.message || 'Failed to load prescriptions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedications();
  }, []);

  const formatReminderTime = (dateStr) => {
    if (!dateStr) return 'Completed / As Needed';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) return `Today at ${timeStr}`;

    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) return `Tomorrow at ${timeStr}`;

    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeStr}`;
  };

  if (loading) {
    return <LoadingState label="Loading prescription medications and reminder schedule..." />;
  }

  if (error) {
    return <ErrorState title="Medications Offline" description={error} onRetry={loadMedications} />;
  }

  const activeMeds = data.medications.filter((m) => m.isActive);
  const completedMeds = data.medications.filter((m) => !m.isActive);

  return (
    <PageTransition className="space-y-6 text-left max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <PageHeader
          title="Prescriptions & Medication Reminders"
          description="Track active drug regimens, scheduled dose reminders, and doctor instructions."
        />
        <Badge variant="primary" size="md">
          {activeMeds.length} Active Regimens
        </Badge>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'active'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Active Medications ({activeMeds.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'completed'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Past / Concluded ({completedMeds.length})
        </button>
        <button
          onClick={() => setActiveTab('reminders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'reminders'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Bell className="h-3.5 w-3.5" /> Reminder Log
        </button>
      </div>

      {/* TAB 1: ACTIVE MEDICATIONS */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {activeMeds.length === 0 ? (
            <Card className="p-12 text-center text-xs text-slate-500 space-y-2">
              <Pill className="h-8 w-8 text-slate-400 mx-auto" />
              <p>No active medications in your schedule. All prescribed regimens are up to date.</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {activeMeds.map((med) => (
                <Card
                  key={med.id}
                  className="p-5 flex flex-col justify-between space-y-4 border-teal-200 hover:shadow-md transition-shadow"
                >
                  <div className="space-y-3">
                    {/* Header: Medicine Name + Timing Badge */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold shrink-0">
                          <Pill className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">
                            {med.name} <span className="text-teal-700 font-normal">({med.dosage})</span>
                          </h4>
                          <p className="text-[11px] text-slate-400">Dr. {med.doctorName}</p>
                        </div>
                      </div>
                      <Badge variant="success" size="sm">
                        {med.timing?.replace('_', ' ') || 'After meal'}
                      </Badge>
                    </div>

                    {/* Schedule & Duration Specs */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Frequency</span>
                        <span className="font-semibold text-slate-800">{med.frequency}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Duration</span>
                        <span className="font-semibold text-slate-800">{med.duration}</span>
                      </div>
                    </div>

                    {/* Next Reminder Box */}
                    <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200 flex items-center justify-between text-xs text-teal-950">
                      <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-teal-600 shrink-0" />
                        <div>
                          <span className="text-[10px] text-teal-700 uppercase font-bold block">
                            Next Dose Reminder
                          </span>
                          <span className="font-bold">{formatReminderTime(med.nextReminder)}</span>
                        </div>
                      </div>
                      <Badge variant="primary" size="sm">
                        Active
                      </Badge>
                    </div>

                    {/* Doctor Instructions */}
                    {med.instructions && (
                      <div className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 italic">
                        "{med.instructions}"
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Course Progress</span>
                      <span>Day {med.daysElapsed + 1} of {med.durationDays}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-teal-600 h-full rounded-full transition-all"
                        style={{ width: `${med.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COMPLETED MEDICATIONS */}
      {activeTab === 'completed' && (
        <div className="space-y-4">
          {completedMeds.length === 0 ? (
            <Card className="p-12 text-center text-xs text-slate-500">
              No concluded medication regimens.
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {completedMeds.map((med) => (
                <Card key={med.id} className="p-5 space-y-3 opacity-75 bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        {med.name} ({med.dosage})
                      </h4>
                      <p className="text-[11px] text-slate-400">Prescribed by Dr. {med.doctorName}</p>
                    </div>
                    <Badge variant="default" size="sm">
                      Completed
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600">
                    Completed {med.duration} course ({med.frequency}).
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REMINDER NOTIFICATION LOG */}
      {activeTab === 'reminders' && (
        <Card className="p-5 space-y-4">
          <CardHeader className="p-0">
            <CardTitle className="text-sm">Medication Dose Reminder Log</CardTitle>
            <CardDescription>
              Chronological log of automated reminder alerts triggered by your prescription schedules.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 pt-2 space-y-2.5">
            {data.recentReminders.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                No reminders dispatched yet.
              </div>
            ) : (
              data.recentReminders.map((r) => (
                <div
                  key={r._id}
                  className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900">{r.title}</h5>
                      <p className="text-slate-600 text-[11px]">{r.message}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant={r.status === 'sent' ? 'success' : 'warning'} size="sm">
                      {r.status}
                    </Badge>
                    <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                      {new Date(r.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </PageTransition>
  );
}
