import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Pill,
  FileText,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  XCircle,
  Activity,
  AlertTriangle,
  RotateCw,
  HelpCircle,
} from 'lucide-react';
import { patientService } from '../../services/patientService';
import { appointmentService } from '../../services/appointmentService';
import { aiService } from '../../services/aiService';
import { calendarService } from '../../services/calendarService';
import { PageHeader } from '../../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Avatar, AvatarFallback } from '../../components/ui/Avatar';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/Dialog';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '../../components/ui/AlertDialog';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useToast } from '../../components/ui/Toast';
import { PageTransition } from '../../components/ui/PageTransition';

export default function PatientAppointmentDetailsPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Reschedule Dialog State
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newSlot, setNewSlot] = useState('');
  const [availability, setAvailability] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Cancellation State
  const [isCancelling, setIsCancelling] = useState(false);

  // Post-Visit AI Summary Retry State
  const [isRetryingAI, setIsRetryingAI] = useState(false);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);

  // Sync / Retry Google Calendar Event
  const handleSyncCalendar = async () => {
    setIsSyncingCalendar(true);
    try {
      const res = await calendarService.syncAppointment(id);
      toast({
        title: res.success ? 'Calendar Synchronized' : 'Calendar Sync Notice',
        description: res.message,
        variant: res.success ? 'success' : 'warning',
      });
      loadAppointment();
    } catch (err) {
      toast({
        title: 'Sync Failed',
        description: err.message || 'Error communicating with Google Calendar.',
        variant: 'error',
      });
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  const loadAppointment = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await patientService.getAppointmentById(id);
      setAppointment(res.data);
      setNewDate(res.data.date);
    } catch (err) {
      setError(err.message || 'Failed to load appointment details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointment();
  }, [id]);

  // Load live slots when reschedule date changes
  useEffect(() => {
    if (appointment?.doctorId?._id && newDate && isRescheduleOpen) {
      setLoadingSlots(true);
      patientService
        .getDoctorAvailability(appointment.doctorId._id, newDate)
        .then((res) => {
          setAvailability(res.data);
          setNewSlot('');
        })
        .catch(() => {
          setAvailability(null);
        })
        .finally(() => setLoadingSlots(false));
    }
  }, [appointment, newDate, isRescheduleOpen]);

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await appointmentService.cancelAppointment(id);
      toast({
        title: 'Appointment Cancelled',
        description: 'Your appointment has been cancelled and the slot is released.',
        variant: 'info',
      });
      loadAppointment();
    } catch (err) {
      toast({
        title: 'Cancellation Failed',
        description: err.message || 'Error cancelling appointment.',
        variant: 'error',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!newDate || !newSlot) {
      toast({
        title: 'Missing Slot',
        description: 'Please select a new date and open time slot.',
        variant: 'warning',
      });
      return;
    }

    setIsRescheduling(true);
    try {
      const res = await appointmentService.rescheduleAppointment(id, {
        newDate,
        newStartTime: newSlot,
      });

      toast({
        title: 'Appointment Rescheduled',
        description: `Successfully moved to ${newDate} at ${newSlot}.`,
        variant: 'success',
      });

      setIsRescheduleOpen(false);
      navigate(`/patient/appointments/${res.data._id}`);
    } catch (err) {
      toast({
        title: 'Reschedule Failed',
        description: err.message || 'Slot collision or error rescheduling.',
        variant: 'error',
      });
    } finally {
      setIsRescheduling(false);
    }
  };

  // Retry / Refresh Post-Visit AI Summary
  const handleRetryPostVisitAI = async () => {
    setIsRetryingAI(true);
    try {
      await aiService.getPostVisitSummary({ appointmentId: id });
      toast({
        title: 'AI Summary Generated',
        description: 'Patient-friendly care plan updated from clinician notes.',
        variant: 'success',
      });
      loadAppointment();
    } catch (err) {
      toast({
        title: 'Summary Notice',
        description: err.message || 'Unable to regenerate summary at this time.',
        variant: 'info',
      });
    } finally {
      setIsRetryingAI(false);
    }
  };

  if (loading) {
    return <LoadingState label="Loading consultation summary and care plan..." />;
  }

  if (error || !appointment) {
    return <ErrorState title="Appointment Not Found" description={error} onRetry={loadAppointment} />;
  }

  const { doctorId, prescriptionId, postVisitSummary } = appointment;
  const isCancellable = ['confirmed', 'held', 'pending'].includes(appointment.status);
  const isCompleted = appointment.status === 'completed';

  return (
    <PageTransition className="space-y-6 text-left max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/patient/appointments">
            <Button variant="ghost" size="icon" aria-label="Back to appointments">
              <ArrowLeft className="h-4 w-4 text-slate-600" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Consultation with {doctorId?.userId?.name || 'Physician'}
              </h1>
              <StatusBadge status={appointment.status} size="sm" />
              {appointment.googleCalendarEventId ? (
                <Badge variant="success" size="sm" className="hidden sm:inline-flex gap-1 items-center">
                  <Calendar className="h-3 w-3" /> G-Cal Synced
                </Badge>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-6 px-2 text-slate-500 hover:text-teal-700 hidden sm:inline-flex"
                  isLoading={isSyncingCalendar}
                  onClick={handleSyncCalendar}
                  leftIcon={<Calendar className="h-3 w-3" />}
                >
                  Sync Calendar
                </Button>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {appointment.date} • {appointment.startTime} - {appointment.endTime}
            </p>
          </div>
        </div>

        {/* Reschedule and Cancel Actions */}
        {isCancellable && (
          <div className="flex items-center gap-2">
            {/* Reschedule Modal */}
            <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" leftIcon={<CalendarDays className="h-3.5 w-3.5" />}>
                  Reschedule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Reschedule Consultation</DialogTitle>
                  <DialogDescription>
                    Select a new date and open time slot for Dr. {doctorId?.userId?.name}.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleReschedule} className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="resched-date">New Date</Label>
                    <Input
                      id="resched-date"
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Select Open Slot</Label>
                    {loadingSlots ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        Checking slot availability...
                      </div>
                    ) : !availability?.slots?.length ? (
                      <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                        No available slots on this date.
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                        {availability.slots.map((slot) => {
                          const isAvail = slot.status === 'available';
                          const isSelected = newSlot === slot.startTime;
                          return (
                            <button
                              key={slot.startTime}
                              disabled={!isAvail}
                              type="button"
                              onClick={() => setNewSlot(slot.startTime)}
                              className={`p-2 rounded-xl border text-xs font-semibold select-none transition-all ${
                                isSelected
                                  ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                                  : isAvail
                                  ? 'bg-white border-slate-200 text-slate-800 hover:border-teal-400 cursor-pointer'
                                  : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                              }`}
                            >
                              {slot.startTime}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <DialogFooter className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsRescheduleOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={!newSlot || isRescheduling}
                      isLoading={isRescheduling}
                    >
                      Confirm Reschedule
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Cancel Appointment Alert Dialog */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-rose-600 hover:bg-rose-50 border-rose-200"
                  leftIcon={<XCircle className="h-3.5 w-3.5" />}
                >
                  Cancel Visit
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel This Appointment?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel your consultation with Dr. {doctorId?.userId?.name} on {appointment.date} at {appointment.startTime}? Your slot will be released for other patients.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={handleCancel}
                  >
                    Yes, Cancel Appointment
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column: Doctor Info & Pre-Visit Symptoms */}
        <div className="md:col-span-1 space-y-6">
          {/* Doctor Card */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <Avatar size="lg">
                <AvatarFallback className="bg-teal-50 text-teal-800 font-bold">
                  {doctorId?.userId?.name?.substring(0, 2).toUpperCase() || 'DR'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{doctorId?.userId?.name}</h3>
                <p className="text-xs text-teal-700 font-medium">{doctorId?.specialization}</p>
                <p className="text-[11px] text-slate-400">{doctorId?.qualification}</p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{doctorId?.userId?.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Verified • {doctorId?.registrationCouncil}</span>
              </div>
            </div>
          </Card>

          {/* Submitted Pre-Visit Symptoms */}
          <Card className="p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              My Pre-Visit Symptoms
            </h4>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed italic">
              {appointment.symptoms ? (
                `"${appointment.symptoms}"`
              ) : (
                <span className="text-slate-400 not-italic">No symptoms submitted before consultation.</span>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Diagnosis, Doctor Notes, Prescription & AI Post-Visit Care Plan */}
        <div className="md:col-span-2 space-y-6">
          {/* Clinical Assessment / Diagnosis */}
          {appointment.diagnosis && (
            <Card className="border-teal-200 bg-teal-50/30">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-teal-600" />
                  <CardTitle className="text-base">Clinical Assessment & Diagnosis</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="p-3.5 rounded-xl bg-white border border-teal-200 text-sm font-semibold text-teal-950">
                  {appointment.diagnosis}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Doctor Clinical Notes */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-teal-600" />
                <CardTitle>Doctor Clinical Notes & Findings</CardTitle>
              </div>
              <CardDescription>Official observations recorded by your doctor during the consultation.</CardDescription>
            </CardHeader>
            <CardContent>
              {appointment.doctorNotes ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono leading-relaxed whitespace-pre-wrap">
                  {appointment.doctorNotes}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  Doctor clinical notes will appear here once the consultation is concluded.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Linked Prescription Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Pill className="h-4 w-4 text-teal-600" />
                <CardTitle>Prescribed Medications & Regimen</CardTitle>
              </div>
              <CardDescription>Prescribed medications linked to this visit.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!prescriptionId || !prescriptionId.medicines?.length ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  No electronic prescription generated for this visit.
                </div>
              ) : (
                <>
                  <div className="space-y-2.5">
                    {prescriptionId.medicines.map((med, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-teal-100 bg-teal-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900 block">
                            {med.name} <span className="text-teal-700 font-mono font-normal">({med.dosage})</span>
                          </span>
                          <span className="text-slate-500 text-[11px]">
                            {med.frequency} • {med.duration} • Timing: {med.timing?.replace('_', ' ')}
                          </span>
                        </div>
                        {med.instructions && (
                          <span className="text-[11px] text-slate-600 italic sm:text-right">
                            "{med.instructions}"
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {prescriptionId.instructions && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                      <strong>General Advice:</strong> {prescriptionId.instructions}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* AI Post-Visit Care Plan Container (5-part summary) */}
          <Card className="border-teal-200 bg-teal-50/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-teal-600" />
                  <CardTitle>AI Patient Care Plan (Plain Language)</CardTitle>
                </div>
                {isCompleted && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-teal-700 hover:bg-teal-100/50 text-xs h-7 px-2.5"
                    isLoading={isRetryingAI}
                    onClick={handleRetryPostVisitAI}
                    leftIcon={<RotateCw className="h-3 w-3" />}
                  >
                    Refresh Plan
                  </Button>
                )}
              </div>
              <CardDescription>
                Automated plain-language summary of your diagnosis, medication schedule, and follow-up guidance.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 text-xs">
              {postVisitSummary?.whatWasDiscussed ? (
                <div className="space-y-4">
                  {/* 1. What was discussed */}
                  <div className="p-3.5 rounded-xl bg-white border border-teal-100 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-teal-900 block tracking-wider">
                      1. What Was Discussed
                    </span>
                    <p className="text-slate-800 leading-relaxed">
                      {postVisitSummary.whatWasDiscussed}
                    </p>
                  </div>

                  {/* 2. Medication Schedule */}
                  {postVisitSummary.medicationSchedule?.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-white border border-teal-100 space-y-2">
                      <span className="text-[10px] uppercase font-bold text-teal-900 block tracking-wider">
                        2. Medication Schedule
                      </span>
                      <ul className="space-y-1.5">
                        {postVisitSummary.medicationSchedule.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-slate-800">
                            <Pill className="h-3.5 w-3.5 text-teal-600 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 3. Important Instructions */}
                  {postVisitSummary.importantInstructions?.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-white border border-teal-100 space-y-2">
                      <span className="text-[10px] uppercase font-bold text-teal-900 block tracking-wider">
                        3. Important Care Instructions
                      </span>
                      <ul className="space-y-1.5">
                        {postVisitSummary.importantInstructions.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-slate-800">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 4. Follow-up steps */}
                  {postVisitSummary.followUpSteps && (
                    <div className="p-3.5 rounded-xl bg-white border border-teal-100 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-teal-900 block tracking-wider">
                        4. Follow-Up Steps
                      </span>
                      <p className="text-slate-800 leading-relaxed">
                        {postVisitSummary.followUpSteps}
                      </p>
                    </div>
                  )}

                  {/* 5. When to seek professional help */}
                  {postVisitSummary.whenToSeekHelp && (
                    <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-rose-900 block tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-600" /> 5. When to Seek Urgent Professional Help
                      </span>
                      <p className="text-rose-950 leading-relaxed">
                        {postVisitSummary.whenToSeekHelp}
                      </p>
                    </div>
                  )}

                  {/* Mandatory Legal Disclaimer */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-600 leading-normal flex items-start gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-teal-600 shrink-0 mt-0.5" />
                    <span>
                      {postVisitSummary.disclaimer ||
                        "This summary is generated from your clinician's notes. Follow your clinician's instructions."}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-500 bg-white/70 rounded-xl border border-dashed border-teal-200 space-y-3">
                  <p>
                    {isCompleted
                      ? 'AI post-visit summary is being compiled from your clinical notes.'
                      : 'AI post-visit care plan will generate automatically once the doctor concludes your consultation.'}
                  </p>
                  {isCompleted && (
                    <Button
                      variant="outline"
                      size="sm"
                      isLoading={isRetryingAI}
                      onClick={handleRetryPostVisitAI}
                      leftIcon={<Sparkles className="h-3 w-3" />}
                    >
                      Generate Care Plan Now
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
