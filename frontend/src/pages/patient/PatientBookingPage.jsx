import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  User,
  ShieldCheck,
  Stethoscope,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  IndianRupee,
  Sparkles,
  ChevronRight,
  Timer,
  Lock,
} from 'lucide-react';
import { patientService } from '../../services/patientService';
import { appointmentService } from '../../services/appointmentService';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar, AvatarFallback } from '../../components/ui/Avatar';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useToast } from '../../components/ui/Toast';
import { PageTransition } from '../../components/ui/PageTransition';
import { AiSymptomChatWidget } from '../../components/patient/AiSymptomChatWidget';

export default function PatientBookingPage() {
  const { doctorId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // Wizard state: 1: Doctor, 2: Date & Slot, 3: Symptoms, 4: Review
  const [currentStep, setCurrentStep] = useState(doctorId ? 2 : 1);

  // Doctors list for step 1 if not pre-selected
  const [doctorsList, setDoctorsList] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loadingDoc, setLoadingDoc] = useState(false);

  // Date & Slot state (Step 2)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(searchParams.get('date') || todayStr);
  const [availability, setAvailability] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(searchParams.get('slot') || '');

  // Slot Hold State (5-minute countdown)
  const [heldAppointmentId, setHeldAppointmentId] = useState(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(null);
  const [isHoldingSlot, setIsHoldingSlot] = useState(false);

  // Symptoms state (Step 3)
  const [symptoms, setSymptoms] = useState('');

  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load selected doctor if doctorId param is present
  useEffect(() => {
    if (doctorId) {
      setLoadingDoc(true);
      patientService
        .getDoctorById(doctorId)
        .then((res) => {
          setSelectedDoctor(res.data.doctor);
        })
        .catch((err) => {
          toast({
            title: 'Error',
            description: err.message || 'Failed to load doctor details.',
            variant: 'error',
          });
        })
        .finally(() => setLoadingDoc(false));
    } else {
      patientService.getDoctors({ verifiedOnly: 'true' }).then((res) => {
        setDoctorsList(res.data || []);
      });
    }
  }, [doctorId]);

  // Load Availability when selectedDoctor and selectedDate change
  const loadAvailability = (date) => {
    if (selectedDoctor && date) {
      setLoadingSlots(true);
      patientService
        .getDoctorAvailability(selectedDoctor._id, date)
        .then((res) => {
          setAvailability(res.data);
          const matching = res.data.slots?.find(
            (s) => s.startTime === selectedSlot && s.status === 'available'
          );
          if (!matching && !heldAppointmentId) setSelectedSlot('');
        })
        .catch((err) => {
          toast({
            title: 'Availability Notice',
            description: err.message || 'Unable to load slots for this date.',
            variant: 'info',
          });
          setAvailability(null);
        })
        .finally(() => setLoadingSlots(false));
    }
  };

  useEffect(() => {
    loadAvailability(selectedDate);
  }, [selectedDoctor, selectedDate]);

  // 5-Minute Countdown Timer Hook for Slot Hold
  useEffect(() => {
    if (!holdExpiresAt) {
      setSecondsRemaining(null);
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((new Date(holdExpiresAt) - new Date()) / 1000));
      setSecondsRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        toast({
          title: 'Hold Expired',
          description: 'Your 5-minute reservation expired. Please re-select a slot.',
          variant: 'warning',
        });
        setHeldAppointmentId(null);
        setHoldExpiresAt(null);
        setSelectedSlot('');
        setCurrentStep(2);
        loadAvailability(selectedDate);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [holdExpiresAt, selectedDate, selectedDoctor]);

  // Action: Hold Slot (Step 2)
  const handleSelectSlot = async (slotTime) => {
    if (!selectedDoctor || !selectedDate) return;
    setIsHoldingSlot(true);

    try {
      const res = await appointmentService.holdSlot({
        doctorId: selectedDoctor._id,
        date: selectedDate,
        startTime: slotTime,
      });

      setSelectedSlot(slotTime);
      setHeldAppointmentId(res.data.appointmentId);
      setHoldExpiresAt(res.data.expiresAt);
      setSecondsRemaining(res.data.remainingSeconds || 300);

      toast({
        title: 'Slot Held for 5 Minutes',
        description: `Reserved ${slotTime} exclusively for your checkout.`,
        variant: 'info',
      });
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'Sorry, this slot was just booked by another patient.';

      toast({
        title: 'Slot Unavailable',
        description: errorMsg,
        variant: 'error',
      });
      setSelectedSlot('');
      loadAvailability(selectedDate);
    } finally {
      setIsHoldingSlot(false);
    }
  };

  // Final Booking Confirmation Action
  const handleConfirmBooking = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot) {
      toast({
        title: 'Missing Details',
        description: 'Please ensure doctor, date, and slot are selected.',
        variant: 'warning',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await appointmentService.createAppointment({
        holdId: heldAppointmentId,
        doctorId: selectedDoctor._id,
        date: selectedDate,
        startTime: selectedSlot,
        symptoms: symptoms.trim(),
        status: 'confirmed',
      });

      // Clear hold state
      setHeldAppointmentId(null);
      setHoldExpiresAt(null);

      toast({
        title: 'Appointment Confirmed',
        description: 'Your clinical consultation slot has been reserved.',
        variant: 'success',
      });

      navigate(`/patient/booking/confirmation/${res.data._id}`);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'Sorry, this slot was just booked by another patient.';

      toast({
        title: 'Slot Unavailable',
        description: errorMsg,
        variant: 'error',
      });

      // Auto-refresh availability from backend and reset
      loadAvailability(selectedDate);
      setSelectedSlot('');
      setHeldAppointmentId(null);
      setHoldExpiresAt(null);
      setCurrentStep(2);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, label: 'Doctor Selection' },
    { num: 2, label: 'Date & Slot' },
    { num: 3, label: 'Symptom Triage' },
    { num: 4, label: 'Review & Confirm' },
  ];

  const formatCountdown = (secs) => {
    if (secs == null || isNaN(secs)) return '05:00';
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <PageTransition className="space-y-6 text-left max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <PageHeader
          title="Schedule Clinical Consultation"
          description="Book your direct one-on-one session with a verified specialist."
        />

        {/* Real-Time Hold Countdown Timer Badge */}
        {secondsRemaining != null && secondsRemaining > 0 && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`px-4 py-2 rounded-2xl border flex items-center gap-2.5 font-bold text-xs shadow-xs select-none ${
              secondsRemaining < 60
                ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                : secondsRemaining < 180
                ? 'bg-amber-50 border-amber-300 text-amber-700'
                : 'bg-emerald-50 border-emerald-300 text-emerald-800'
            }`}
          >
            <Timer className="h-4 w-4 shrink-0" />
            <span>Slot Reserved: {formatCountdown(secondsRemaining)}</span>
          </motion.div>
        )}
      </div>

      {/* Stepper Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 overflow-x-auto">
        {steps.map((step) => {
          const isDone = currentStep > step.num;
          const isCurrent = currentStep === step.num;
          return (
            <div key={step.num} className="flex items-center gap-2">
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                  isCurrent
                    ? 'bg-teal-600 text-white shadow-xs'
                    : isDone
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : step.num}
              </div>
              <span
                className={`text-xs font-semibold whitespace-nowrap ${
                  isCurrent ? 'text-slate-900' : isDone ? 'text-slate-700' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
              {step.num < 4 && <ChevronRight className="h-3.5 w-3.5 text-slate-300 mx-1" />}
            </div>
          );
        })}
      </div>
 
      {/* Optional AI Symptom Exploration Chat Widget */}
      <AiSymptomChatWidget />

      <AnimatePresence mode="wait">
        {/* STEP 1: Select Doctor */}
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-6 space-y-4">
              <CardHeader className="p-0">
                <CardTitle>Select Medical Specialist</CardTitle>
                <CardDescription>Choose a verified physician for your consultation.</CardDescription>
              </CardHeader>
              <div className="grid sm:grid-cols-2 gap-3.5 pt-2">
                {doctorsList.map((doc) => (
                  <div
                    key={doc._id}
                    onClick={() => {
                      setSelectedDoctor(doc);
                      setCurrentStep(2);
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      selectedDoctor?._id === doc._id
                        ? 'border-teal-600 bg-teal-50/40 ring-1 ring-teal-600'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar size="md">
                        <AvatarFallback className="bg-teal-50 text-teal-800 font-bold">
                          {doc.userId?.name?.substring(0, 2).toUpperCase() || 'DR'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{doc.userId?.name}</h4>
                        <p className="text-xs text-teal-700 font-semibold">{doc.specialization}</p>
                        <p className="text-[11px] text-slate-400">
                          {doc.experience} Yrs Exp • ₹{doc.consultationFee}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* STEP 2: Select Date & Slot (with 5-minute hold) */}
        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Select Date & Reserve Consultation Slot</CardTitle>
                  <CardDescription>
                    {selectedDoctor
                      ? `Consulting with ${selectedDoctor.userId?.name} (${selectedDoctor.specialization})`
                      : 'Select an open appointment slot.'}
                  </CardDescription>
                </div>
                {!doctorId && (
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)}>
                    Change Doctor
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5 max-w-xs">
                  <Label htmlFor="book-date" required>
                    Consultation Date
                  </Label>
                  <Input
                    id="book-date"
                    type="date"
                    min={todayStr}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>

                {/* Slots Grid */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <Label required>Available Slots ({selectedDate})</Label>
                    <span className="text-[11px] text-slate-400">
                      Selecting a slot locks it for 5 minutes
                    </span>
                  </div>

                  {loadingSlots ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      Calculating live slot availability...
                    </div>
                  ) : !availability ? (
                    <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                      Select a valid date above.
                    </div>
                  ) : availability.isOnLeave ? (
                    <div className="p-6 text-center text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                      <strong>Doctor on Leave:</strong> {availability.leaveReason || 'Not available'}
                    </div>
                  ) : !availability.isWorkingDay ? (
                    <div className="p-6 text-center text-xs bg-slate-50 border border-slate-200 text-slate-600 rounded-xl">
                      Doctor is off duty on {availability.dayOfWeek}s.
                    </div>
                  ) : availability.slots.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                      No slots available for this date.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {availability.slots.map((slot) => {
                        const isAvail = slot.status === 'available';
                        const isSelected = selectedSlot === slot.startTime;
                        return (
                          <button
                            key={slot.startTime}
                            disabled={!isAvail && !isSelected}
                            type="button"
                            onClick={() => handleSelectSlot(slot.startTime)}
                            className={`p-3 rounded-xl border text-xs font-semibold transition-all select-none ${
                              isSelected
                                ? 'bg-teal-600 text-white border-teal-600 shadow-sm ring-2 ring-teal-600/20'
                                : isAvail
                                ? 'bg-white border-slate-200 text-slate-800 hover:border-teal-500 hover:text-teal-700 cursor-pointer'
                                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through opacity-60'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{slot.startTime}</span>
                              {isSelected && <Lock className="h-3 w-3 text-white" />}
                            </div>
                            <span className="block text-[10px] font-normal opacity-80 mt-0.5">
                              {isSelected ? 'Held (5m)' : isAvail ? 'Available' : slot.status}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button
                  variant="primary"
                  size="md"
                  disabled={!selectedSlot || isHoldingSlot}
                  onClick={() => setCurrentStep(3)}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Continue to Symptoms
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* STEP 3: Enter Symptoms */}
        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-6 space-y-6">
              <CardHeader className="p-0">
                <CardTitle>Pre-Visit Symptoms & Chief Complaint</CardTitle>
                <CardDescription>
                  Share your primary symptoms and concerns with the doctor before your visit.
                </CardDescription>
              </CardHeader>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="symptoms-input">
                    Describe your symptoms, duration, and any current medications
                  </Label>
                  <textarea
                    id="symptoms-input"
                    rows={5}
                    placeholder="e.g. Experiencing persistent migraine headaches in the afternoon for the past 4 days. Light sensitivity and slight nausea..."
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-900 flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>
                    CareFlow pre-visit symptom notes assist your physician during consultation for tailored treatment planning.
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Button variant="ghost" size="sm" onClick={() => setCurrentStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setCurrentStep(4)}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Review Consultation
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* STEP 4: Review & Confirm */}
        {currentStep === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-6 space-y-6">
              <CardHeader className="p-0">
                <CardTitle>Review & Confirm Appointment</CardTitle>
                <CardDescription>
                  Verify all consultation details before confirming your booking.
                </CardDescription>
              </CardHeader>

              <div className="space-y-4 text-xs">
                {/* Doctor Box */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar size="lg">
                      <AvatarFallback className="bg-teal-600 text-white font-bold">
                        {selectedDoctor?.userId?.name?.substring(0, 2).toUpperCase() || 'DR'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {selectedDoctor?.userId?.name}
                      </h4>
                      <p className="text-teal-700 font-semibold">{selectedDoctor?.specialization}</p>
                      <p className="text-slate-400 text-[11px]">{selectedDoctor?.qualification}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Fee</span>
                    <span className="font-bold text-slate-900 text-base">
                      ₹{selectedDoctor?.consultationFee}
                    </span>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Date</span>
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-teal-600" /> {selectedDate}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Time Window</span>
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-teal-600" /> {selectedSlot} (30 min duration)
                    </span>
                  </div>
                </div>

                {/* Patient Info */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Patient Details</span>
                  <div className="font-semibold text-slate-900">{user?.name}</div>
                  <div className="text-slate-500">{user?.email} • {user?.phone || 'No phone'}</div>
                </div>

                {/* Symptoms summary */}
                {symptoms && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Pre-Visit Chief Complaint
                    </span>
                    <p className="text-slate-700 italic">"{symptoms}"</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Button variant="ghost" size="sm" onClick={() => setCurrentStep(3)}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Edit Symptoms
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleConfirmBooking}
                  isLoading={isSubmitting}
                  leftIcon={<CheckCircle2 className="h-4 w-4" />}
                >
                  Confirm Booking (Release Hold)
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
