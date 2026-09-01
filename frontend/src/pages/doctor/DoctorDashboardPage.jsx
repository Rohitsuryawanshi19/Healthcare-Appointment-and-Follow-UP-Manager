import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CalendarCheck,
  Calendar,
  CheckCircle2,
  CalendarX,
  Clock,
  ArrowRight,
  ShieldCheck,
  User,
  Sparkles,
  AlertTriangle,
  Eye,
  Check,
  Stethoscope,
  Activity,
  FileText,
} from 'lucide-react';
import { doctorService } from '../../services/doctorService';
import { PageHeader } from '../../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Avatar, AvatarFallback } from '../../components/ui/Avatar';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useToast } from '../../components/ui/Toast';
import { PageTransition } from '../../components/ui/PageTransition';
import { containerVariants, itemVariants } from '../../lib/animations';

export default function DoctorDashboardPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await doctorService.getDashboard();
      setDashboardData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load doctor dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const getUrgencyBadge = (urgency = 'low') => {
    const norm = String(urgency).toLowerCase();
    switch (norm) {
      case 'emergency':
      case 'high':
        return (
          <Badge variant="error" size="sm" dot>
            High Urgency
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="warning" size="sm" dot>
            Medium Urgency
          </Badge>
        );
      default:
        return (
          <Badge variant="success" size="sm" dot>
            Standard Routine
          </Badge>
        );
    }
  };

  if (loading) {
    return <LoadingState label="Loading clinical appointment queue..." variant="pulse" />;
  }

  if (error || !dashboardData) {
    return <ErrorState title="Doctor Portal Offline" description={error} onRetry={loadDashboard} />;
  }

  const {
    todayAppointments = 0,
    upcomingAppointments = 0,
    completedAppointments = 0,
    cancelledAppointments = 0,
    nextAppointments = [],
    doctor,
  } = dashboardData;

  const kpis = [
    {
      title: "Today's Consultations",
      value: todayAppointments,
      icon: CalendarCheck,
      color: 'bg-teal-50 text-teal-700 border-teal-200',
    },
    {
      title: 'Upcoming Queue',
      value: upcomingAppointments,
      icon: Calendar,
      color: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    {
      title: 'Completed Visits',
      value: completedAppointments,
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      title: 'Cancelled Slots',
      value: cancelledAppointments,
      icon: CalendarX,
      color: 'bg-rose-50 text-rose-700 border-rose-200',
    },
  ];

  return (
    <PageTransition className="space-y-8 text-left max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Clinical Workspace: Dr. {doctor?.userId?.name || 'Physician'}
            </h1>
            <Badge variant="success" size="sm" className="gap-1 hidden sm:inline-flex">
              <ShieldCheck className="h-3 w-3" /> Verified Clinician
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {doctor?.specialization} • {doctor?.qualification} • Registration #{doctor?.registrationNumber}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/doctor/schedule">
            <Button variant="outline" size="sm" leftIcon={<Clock className="h-3.5 w-3.5" />}>
              Manage Schedule
            </Button>
          </Link>
          <Link to="/doctor/appointments">
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
              All Appointments
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div key={idx} variants={itemVariants}>
              <Card className="p-5 flex items-center gap-4 hover:shadow-xs transition-shadow">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border ${kpi.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
                    {kpi.title}
                  </span>
                  <span className="text-2xl font-bold text-slate-900">{kpi.value}</span>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Main Clinical Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="h-4 w-4 text-teal-600" /> Active Clinical Queue
            </h3>
            <p className="text-xs text-slate-500">Upcoming and in-progress patient consultations.</p>
          </div>
          <Badge variant="primary" size="sm">
            {nextAppointments.length} In Queue
          </Badge>
        </div>

        {nextAppointments.length === 0 ? (
          <Card className="p-10 text-center border-dashed border-slate-200 bg-slate-50/50">
            <div className="max-w-md mx-auto space-y-2">
              <Stethoscope className="h-8 w-8 text-slate-400 mx-auto" />
              <h4 className="font-bold text-slate-900 text-sm">Clinical Queue Clear</h4>
              <p className="text-xs text-slate-500">
                You have no pending consultations in your immediate queue. New appointments will appear here automatically.
              </p>
            </div>
          </Card>
        ) : (
          <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-3">
            {nextAppointments.map((appt) => {
              const urgency = appt.aiSummary?.triageUrgency || 'low';
              return (
                <motion.div key={appt._id} variants={itemVariants}>
                  <Card className="p-5 hover:border-teal-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <Avatar size="lg">
                        <AvatarFallback className="bg-teal-50 text-teal-900 font-bold">
                          {appt.patientId?.name?.substring(0, 2).toUpperCase() || 'PT'}
                        </AvatarFallback>
                      </Avatar>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">{appt.patientId?.name || 'Patient'}</h4>
                          <StatusBadge status={appt.status} size="sm" />
                          {getUrgencyBadge(urgency)}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-600">
                          <span className="font-semibold text-slate-800">
                            {appt.date} • {appt.startTime} - {appt.endTime}
                          </span>
                          <span>•</span>
                          <span className="text-slate-500">{appt.patientId?.email}</span>
                        </div>

                        {appt.symptoms && (
                          <p className="text-xs text-slate-700 italic line-clamp-1 pt-0.5">
                            "{appt.symptoms}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      <Link to={`/doctor/appointments/${appt._id}`}>
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<FileText className="h-3.5 w-3.5" />}
                          rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                        >
                          Open Consultation
                        </Button>
                      </Link>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
