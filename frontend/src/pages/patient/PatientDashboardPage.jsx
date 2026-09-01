import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  CalendarCheck,
  Clock,
  Pill,
  Search,
  UserCheck,
  ShieldCheck,
  ArrowRight,
  Eye,
  CheckCircle2,
  Sparkles,
  Heart,
  Stethoscope,
  Activity,
  Timer,
  ChevronRight,
  Bell,
} from 'lucide-react';
import { patientService } from '../../services/patientService';
import { PageHeader } from '../../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Avatar, AvatarFallback } from '../../components/ui/Avatar';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { PageTransition } from '../../components/ui/PageTransition';
import { containerVariants, itemVariants } from '../../lib/animations';

export default function PatientDashboardPage() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await patientService.getDashboard();
      setDashboardData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load patient dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return <LoadingState label="Loading your personalized healthcare overview..." variant="pulse" />;
  }

  if (error || !dashboardData) {
    return <ErrorState title="Dashboard Offline" description={error} onRetry={loadDashboard} />;
  }

  const {
    nextAppointment,
    upcomingAppointments = [],
    recentAppointments = [],
    medicationReminders = [],
  } = dashboardData;

  return (
    <PageTransition className="space-y-8 text-left max-w-6xl mx-auto">
      <PageHeader
        title="My Health & Care Dashboard"
        description="Track your scheduled specialist consultations, pre-visit symptoms, and active medication regimens."
        actions={
          <Link to="/patient/doctors">
            <Button variant="primary" size="md" leftIcon={<Search className="h-4 w-4" />}>
              Find a Doctor
            </Button>
          </Link>
        }
      />

      {/* Hero: Next Upcoming Appointment Banner */}
      {nextAppointment ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-teal-200 bg-gradient-to-br from-teal-50/80 via-white to-slate-50 p-6 sm:p-8 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-sm shadow-teal-600/30">
                  <CalendarCheck className="h-7 w-7" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="primary" size="sm" dot>
                      Next Upcoming Visit
                    </Badge>
                    <StatusBadge status={nextAppointment.status} size="sm" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Consultation with {nextAppointment.doctorId?.userId?.name || 'Specialist'}
                  </h2>
                  <p className="text-xs text-teal-800 font-semibold">
                    {nextAppointment.doctorId?.specialization} • {nextAppointment.doctorId?.qualification}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
                    <span className="flex items-center gap-1.5 font-bold text-slate-800 bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200">
                      <Calendar className="h-3.5 w-3.5 text-teal-600" />
                      {nextAppointment.date}
                    </span>
                    <span className="flex items-center gap-1.5 font-bold text-slate-800 bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200">
                      <Clock className="h-3.5 w-3.5 text-teal-600" />
                      {nextAppointment.startTime} - {nextAppointment.endTime}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto shrink-0">
                <Link to={`/patient/appointments/${nextAppointment._id}`} className="w-full sm:w-auto">
                  <Button variant="primary" size="md" className="w-full" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    View Consultation Details
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </motion.div>
      ) : (
        <Card className="p-8 sm:p-10 text-center border-dashed border-slate-200 bg-slate-50/50">
          <div className="max-w-md mx-auto space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center mx-auto">
              <Calendar className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">No Upcoming Appointments</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              You do not have any scheduled consultations at the moment. Browse verified doctors to book your next health checkup.
            </p>
            <Link to="/patient/doctors">
              <Button variant="primary" size="sm" className="mt-2" leftIcon={<Search className="h-3.5 w-3.5" />}>
                Find a Doctor
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* 3 Key Metric Overview Tiles */}
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <motion.div variants={itemVariants}>
          <Card className="p-5 flex items-center gap-4 hover:shadow-xs transition-shadow">
            <div className="h-11 w-11 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Upcoming Visits</span>
              <span className="text-2xl font-bold text-slate-900">{upcomingAppointments.length}</span>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="p-5 flex items-center gap-4 hover:shadow-xs transition-shadow">
            <div className="h-11 w-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
              <Pill className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Active Medications</span>
              <span className="text-2xl font-bold text-slate-900">{medicationReminders.length}</span>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="p-5 flex items-center gap-4 hover:shadow-xs transition-shadow">
            <div className="h-11 w-11 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Concluded Visits</span>
              <span className="text-2xl font-bold text-slate-900">{recentAppointments.length}</span>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Main Grid: Upcoming Consultations & Active Medication Schedule */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Upcoming Consultations */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-teal-600" /> Upcoming Consultations
            </h3>
            <Link to="/patient/appointments" className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1">
              View All <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {upcomingAppointments.length === 0 ? (
            <Card className="p-8 text-center text-xs text-slate-400 bg-slate-50/60 rounded-2xl">
              No upcoming appointments scheduled.
            </Card>
          ) : (
            <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-3">
              {upcomingAppointments.slice(0, 4).map((appt) => (
                <motion.div key={appt._id} variants={itemVariants}>
                  <Card className="p-4 hover:border-teal-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar size="md">
                        <AvatarFallback className="bg-teal-50 text-teal-800 font-bold">
                          {appt.doctorId?.userId?.name?.substring(0, 2).toUpperCase() || 'DR'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {appt.doctorId?.userId?.name || 'Physician'}
                        </h4>
                        <p className="text-xs text-teal-700 font-medium">{appt.doctorId?.specialization}</p>
                        <p className="text-[11px] text-slate-400">
                          {appt.date} • {appt.startTime} - {appt.endTime}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <StatusBadge status={appt.status} size="sm" />
                      <Link to={`/patient/appointments/${appt._id}`}>
                        <Button variant="ghost" size="sm" className="text-xs">
                          Details
                        </Button>
                      </Link>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Right 1 Col: Active Medication Schedule */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Pill className="h-4 w-4 text-teal-600" /> Dose Schedule
            </h3>
            <Link to="/patient/medications" className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1">
              Medications <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {medicationReminders.length === 0 ? (
            <Card className="p-8 text-center text-xs text-slate-400 bg-slate-50/60 rounded-2xl">
              No active prescriptions recorded.
            </Card>
          ) : (
            <div className="space-y-3">
              {medicationReminders.slice(0, 3).map((med, idx) => (
                <Card key={idx} className="p-4 border-teal-100 bg-white space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-bold text-slate-900 text-xs">{med.medicineName || med.name}</h5>
                      <span className="text-[11px] text-teal-700 font-mono font-medium">{med.dosage}</span>
                    </div>
                    <Badge variant="success" size="sm">
                      Active
                    </Badge>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <Timer className="h-3 w-3 text-slate-400" />
                    <span>Frequency: {med.frequency}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
