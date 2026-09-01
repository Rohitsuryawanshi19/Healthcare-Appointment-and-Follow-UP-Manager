import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UserCheck,
  Users,
  Calendar,
  CalendarCheck,
  CalendarX,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Plus,
  Clock,
  Activity,
  CheckCircle2,
  XCircle,
  Building,
  UserPlus,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { PageHeader } from '../../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar, AvatarFallback } from '../../components/ui/Avatar';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useToast } from '../../components/ui/Toast';
import { PageTransition } from '../../components/ui/PageTransition';
import { containerVariants, itemVariants } from '../../lib/animations';

export default function AdminDashboardPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState(null);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, doctorsRes] = await Promise.all([
        adminService.getStats(),
        adminService.getDoctors({ status: 'pending' }),
      ]);
      setStats(statsRes.data);
      setPendingDoctors(doctorsRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load administrator metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickVerify = async (doctorId, status) => {
    try {
      await adminService.updateDoctorVerification(doctorId, status);
      toast({
        title: `Doctor ${status === 'verified' ? 'Verified' : 'Rejected'}`,
        description: `Credentials successfully marked as ${status}.`,
        variant: status === 'verified' ? 'success' : 'warning',
      });
      loadData();
    } catch (err) {
      toast({
        title: 'Action Failed',
        description: err.message || 'Unable to update verification status.',
        variant: 'error',
      });
    }
  };

  if (loading) {
    return <LoadingState label="Aggregating clinical administration metrics..." variant="pulse" />;
  }

  if (error) {
    return <ErrorState title="Admin Dashboard Unavailable" description={error} onRetry={loadData} />;
  }

  const statCards = [
    {
      title: 'Total Practitioners',
      value: stats?.totalDoctors || 0,
      subtext: `${stats?.verifiedDoctors || 0} Verified • ${stats?.pendingVerification || 0} Pending`,
      icon: UserCheck,
      color: 'bg-teal-50 text-teal-700 border-teal-200',
      link: '/admin/doctors',
    },
    {
      title: 'Active Patients',
      value: stats?.totalPatients || 0,
      subtext: 'Registered platform users',
      icon: Users,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      link: '/admin/users?role=patient',
    },
    {
      title: "Today's Consultations",
      value: stats?.todayAppointments || 0,
      subtext: `${stats?.upcomingAppointments || 0} Total Upcoming`,
      icon: CalendarCheck,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      link: '/admin/appointments',
    },
    {
      title: 'Concluded Consultations',
      value: stats?.completedAppointments || 0,
      subtext: `${stats?.cancelledAppointments || 0} Cancelled`,
      icon: Activity,
      color: 'bg-slate-50 text-slate-700 border-slate-200',
      link: '/admin/appointments?status=completed',
    },
  ];

  return (
    <PageTransition className="space-y-8 text-left max-w-6xl mx-auto">
      <PageHeader
        title="Hospital System Administration"
        description="Oversee verified clinical staff, monitor platform appointment load, and review credentialing applications."
        actions={
          <div className="flex items-center gap-2">
            <Link to="/admin/doctors/new">
              <Button variant="primary" size="md" leftIcon={<Plus className="h-4 w-4" />}>
                Register Doctor
              </Button>
            </Link>
          </div>
        }
      />

      {/* 4 Core Platform Metric Cards */}
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div key={idx} variants={itemVariants}>
              <Link to={kpi.link} className="block group">
                <Card className="p-5 hover:border-teal-300 transition-all">
                  <div className="flex items-center justify-between">
                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center border ${kpi.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-teal-600 transition-colors" />
                  </div>
                  <div className="mt-3">
                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
                      {kpi.title}
                    </span>
                    <span className="text-2xl font-bold text-slate-900 block mt-0.5">{kpi.value}</span>
                    <span className="text-xs text-slate-500 mt-1 block">{kpi.subtext}</span>
                  </div>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Doctor Verification Queue */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-teal-600" /> Doctor Verification Queue
            </CardTitle>
            <CardDescription>Practitioners awaiting medical council license verification.</CardDescription>
          </div>
          <Badge variant={pendingDoctors.length > 0 ? 'warning' : 'secondary'} size="sm">
            {pendingDoctors.length} Pending
          </Badge>
        </CardHeader>

        <CardContent className="pt-0">
          {pendingDoctors.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50/60 rounded-xl">
              No doctor applications currently pending review.
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingDoctors.slice(0, 5).map((doc) => (
                <div
                  key={doc._id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <Avatar size="md">
                      <AvatarFallback className="bg-amber-50 text-amber-900 font-bold">
                        {doc.userId?.name?.substring(0, 2).toUpperCase() || 'DR'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{doc.userId?.name}</h4>
                      <p className="text-teal-700 font-medium">{doc.specialization} • {doc.qualification}</p>
                      <p className="text-slate-400 text-[11px]">
                        Reg #{doc.registrationNumber} ({doc.registrationCouncil}) • {doc.experience} Yrs Exp
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Link to={`/admin/doctors/${doc._id}`}>
                      <Button variant="ghost" size="sm" className="text-xs">
                        Review Profile
                      </Button>
                    </Link>
                    <Button
                      variant="primary"
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-xs h-8"
                      onClick={() => handleQuickVerify(doc._id, 'verified')}
                      leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-rose-600 hover:bg-rose-50 border-rose-200 text-xs h-8"
                      onClick={() => handleQuickVerify(doc._id, 'rejected')}
                      leftIcon={<XCircle className="h-3.5 w-3.5" />}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageTransition>
  );
}
