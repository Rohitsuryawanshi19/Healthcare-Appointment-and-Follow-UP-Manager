import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  Building,
  FileText,
  ArrowRight,
  Printer,
  CalendarCheck,
} from 'lucide-react';
import { appointmentService } from '../../services/appointmentService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Avatar, AvatarFallback } from '../../components/ui/Avatar';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { PageTransition } from '../../components/ui/PageTransition';

export default function PatientBookingConfirmationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAppointment = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await appointmentService.getAppointmentById(id);
      setAppointment(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load booking confirmation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointment();
  }, [id]);

  if (loading) {
    return <LoadingState label="Verifying confirmed consultation details..." />;
  }

  if (error || !appointment) {
    return <ErrorState title="Booking Record Not Found" description={error} onRetry={loadAppointment} />;
  }

  const { doctorId, patientId } = appointment;

  return (
    <PageTransition className="space-y-6 text-left max-w-3xl mx-auto py-4">
      {/* Celebration Header */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center space-y-3 pb-2"
      >
        <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Appointment Confirmed!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Your clinical consultation is confirmed and scheduled in the EHR system.
          </p>
        </div>
      </motion.div>

      {/* Main Confirmation Card */}
      <Card className="overflow-hidden border-slate-200 shadow-lg">
        {/* Banner */}
        <div className="bg-slate-900 text-white p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Booking Reference
            </span>
            <div className="font-mono font-bold text-sm text-teal-400">#{appointment._id}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300">Status:</span>
            <StatusBadge status={appointment.status} size="sm" />
          </div>
        </div>

        <CardContent className="p-6 space-y-6 text-xs">
          {/* Doctor Details */}
          <div className="flex items-start justify-between p-4 rounded-2xl bg-teal-50/50 border border-teal-100">
            <div className="flex items-center gap-3.5">
              <Avatar size="lg">
                <AvatarFallback className="bg-teal-600 text-white font-bold text-base">
                  {doctorId?.userId?.name?.substring(0, 2).toUpperCase() || 'DR'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-base">
                  <span>{doctorId?.userId?.name}</span>
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="text-xs text-teal-800 font-semibold">{doctorId?.specialization}</p>
                <p className="text-[11px] text-slate-500">
                  {doctorId?.qualification} • {doctorId?.registrationCouncil}
                </p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Consultation Fee</span>
              <div className="font-bold text-slate-900 text-base">₹{doctorId?.consultationFee}</div>
            </div>
          </div>

          {/* Schedule Window */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">
                Appointment Date
              </span>
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4 text-teal-600" /> {appointment.date}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">
                Time Window
              </span>
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-teal-600" /> {appointment.startTime} - {appointment.endTime}
              </div>
            </div>
          </div>

          {/* Patient Details */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">
              Patient Account
            </span>
            <div className="font-semibold text-slate-900 text-sm">{patientId?.name}</div>
            <div className="text-slate-500">{patientId?.email} • {patientId?.phone || 'No phone recorded'}</div>
          </div>

          {/* Submitted Symptoms */}
          {appointment.symptoms && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">
                Pre-Visit Chief Complaint
              </span>
              <p className="text-slate-700 italic">"{appointment.symptoms}"</p>
            </div>
          )}
        </CardContent>

        {/* Footer Actions */}
        <CardFooter className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            leftIcon={<Printer className="h-4 w-4" />}
          >
            Print Receipt
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link to="/patient/dashboard" className="w-full sm:w-auto">
              <Button variant="ghost" size="sm" className="w-full">
                Dashboard
              </Button>
            </Link>
            <Link to={`/patient/appointments/${appointment._id}`} className="w-full sm:w-auto">
              <Button variant="primary" size="sm" className="w-full" rightIcon={<ArrowRight className="h-4 w-4" />}>
                View Consultation Details
              </Button>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </PageTransition>
  );
}
