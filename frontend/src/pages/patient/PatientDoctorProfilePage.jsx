import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  Calendar,
  Clock,
  Award,
  Building,
  FileCheck,
  IndianRupee,
  Star,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  CalendarDays,
} from 'lucide-react';
import { patientService } from '../../services/patientService';
import { PageHeader } from '../../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar, AvatarFallback } from '../../components/ui/Avatar';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useToast } from '../../components/ui/Toast';
import { PageTransition } from '../../components/ui/PageTransition';

export default function PatientDoctorProfilePage() {
  const { id } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Live availability state
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [availability, setAvailability] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const loadDoctor = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await patientService.getDoctorById(id);
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load doctor profile.');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailability = async (date) => {
    setLoadingSlots(true);
    try {
      const res = await patientService.getDoctorAvailability(id, date);
      setAvailability(res.data);
      setSelectedSlot(null);
    } catch (err) {
      toast({
        title: 'Availability Notice',
        description: err.message || 'Unable to fetch slots for selected date.',
        variant: 'info',
      });
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    loadDoctor();
  }, [id]);

  useEffect(() => {
    if (id && selectedDate) {
      loadAvailability(selectedDate);
    }
  }, [id, selectedDate]);

  if (loading) {
    return <LoadingState label="Loading physician clinical profile..." />;
  }

  if (error || !data) {
    return <ErrorState title="Doctor Not Found" description={error} onRetry={loadDoctor} />;
  }

  const { doctor, leaves = [] } = data;

  return (
    <PageTransition className="space-y-8 text-left max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Link to="/patient/doctors">
          <Button variant="ghost" size="icon" aria-label="Back to doctors list">
            <ArrowLeft className="h-4 w-4 text-slate-600" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {doctor.userId?.name}
            </h1>
            {doctor.verificationStatus === 'verified' && (
              <Badge variant="success" size="sm" dot>
                Verified Specialist
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500">
            {doctor.specialization} • {doctor.qualification}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column: Doctor Card & Verification Badges */}
        <div className="md:col-span-1 space-y-6">
          <Card className="p-6 text-center space-y-4">
            <Avatar size="xl" className="mx-auto">
              <AvatarFallback className="bg-teal-600 text-white font-bold text-xl">
                {doctor.userId?.name?.substring(0, 2).toUpperCase() || 'DR'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold text-slate-900 text-base">{doctor.userId?.name}</h3>
              <p className="text-xs text-teal-700 font-semibold">{doctor.specialization}</p>
              <p className="text-[11px] text-slate-400">{doctor.qualification}</p>
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-2 text-xs text-left text-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Experience:</span>
                <span className="font-bold text-slate-900">{doctor.experience} Years</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Consultation Fee:</span>
                <span className="font-bold text-teal-700">₹{doctor.consultationFee} / session</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Slot Duration:</span>
                <span className="font-medium text-slate-800">{doctor.slotDuration} minutes</span>
              </div>
            </div>
          </Card>

          {/* Verification Box */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                State Council Credentials
              </h4>
            </div>
            <div className="space-y-2 text-xs text-slate-600">
              <p>
                <strong>Registration No:</strong>{' '}
                <span className="font-mono text-slate-900 font-semibold">{doctor.registrationNumber}</span>
              </p>
              <p>
                <strong>Medical Council:</strong> {doctor.registrationCouncil}
              </p>
              <p>
                <strong>Verification:</strong>{' '}
                <span className="capitalize text-emerald-700 font-semibold">{doctor.verificationStatus}</span>
              </p>
            </div>
          </Card>
        </div>

        {/* Right Column: Biography, Live Availability Engine & Working Hours */}
        <div className="md:col-span-2 space-y-6">
          {/* Biography */}
          <Card>
            <CardHeader>
              <CardTitle>Professional Biography</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-600 leading-relaxed">
              {doctor.bio || (
                <span className="italic text-slate-400">
                  Senior specialist dedicated to evidence-based patient-centric care, preventive therapies, and comprehensive clinical consultations.
                </span>
              )}
            </CardContent>
          </Card>

          {/* Live Availability Engine Slot Selector */}
          <Card className="border-teal-200 shadow-sm">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-teal-600" /> Live Consultation Availability
                  </CardTitle>
                  <CardDescription>
                    Real-time backend slot generation based on doctor schedule and booking status.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    min={todayStr}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="h-8 rounded-lg border border-slate-300 px-2.5 text-xs bg-white text-slate-900 focus:outline-none focus:border-teal-600 cursor-pointer"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingSlots ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Checking backend slot engine...
                </div>
              ) : !availability ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  Select a date to check availability.
                </div>
              ) : availability.isOnLeave ? (
                <div className="p-6 text-center text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl space-y-1">
                  <span className="font-bold block text-sm">Doctor on Scheduled Leave</span>
                  <p>{availability.leaveReason || 'Doctor is out of clinic on this date.'}</p>
                </div>
              ) : !availability.isWorkingDay ? (
                <div className="p-6 text-center text-xs bg-slate-50 border border-slate-200 text-slate-600 rounded-xl">
                  <span className="font-bold block text-sm mb-1">Non-Working Day</span>
                  <p>Doctor is off duty on {availability.dayOfWeek}s.</p>
                </div>
              ) : availability.slots.length === 0 ? (
                <div className="p-6 text-center text-xs bg-slate-50 border border-slate-200 text-slate-500 rounded-xl">
                  No consultation slots configured for this date.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {availability.slots.map((slot) => {
                      const isAvailable = slot.status === 'available';
                      const isBooked = slot.status === 'booked';
                      const isHeld = slot.status === 'held';
                      const isUnavailable = slot.status === 'unavailable';
                      const isSelected = selectedSlot === slot.startTime;

                      return (
                        <button
                          key={slot.startTime}
                          disabled={!isAvailable}
                          onClick={() => setSelectedSlot(slot.startTime)}
                          className={`p-3 rounded-xl border text-xs font-semibold transition-all select-none ${
                            isSelected
                              ? 'bg-teal-600 text-white border-teal-600 shadow-sm ring-2 ring-teal-600/20'
                              : isAvailable
                              ? 'bg-white border-teal-200 text-slate-800 hover:border-teal-500 hover:text-teal-700 cursor-pointer'
                              : isBooked
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                              : isHeld
                              ? 'bg-amber-50 text-amber-600 border-amber-200 cursor-not-allowed'
                              : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                          }`}
                        >
                          {slot.startTime}
                          <span className="block text-[10px] font-normal opacity-80 mt-0.5 capitalize">
                            {isSelected
                              ? 'Selected'
                              : isAvailable
                              ? 'Available'
                              : isBooked
                              ? 'Booked'
                              : isHeld
                              ? 'Held'
                              : 'Past / Off'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200 text-xs text-teal-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      {selectedSlot ? (
                        <>
                          Selected Slot: <strong>{selectedSlot}</strong> on {availability.date} ({availability.slotDuration} min)
                        </>
                      ) : (
                        'Choose an open slot to begin pre-visit symptom triage.'
                      )}
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={!selectedSlot}
                      onClick={() => {
                        navigate(`/patient/book/${id}?date=${selectedDate}&slot=${selectedSlot}`);
                      }}
                    >
                      Book Selected Slot
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weekly Working Hours Matrix */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Working Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                {doctor.workingHours?.map((slot) => (
                  <div
                    key={slot.day}
                    className={`p-2.5 rounded-xl border ${
                      slot.isAvailable ? 'bg-teal-50/50 border-teal-200' : 'bg-slate-50 border-slate-200/60 opacity-60'
                    }`}
                  >
                    <span className="font-bold text-slate-800 block">{slot.day.substring(0, 3)}</span>
                    <span className="text-[11px] text-slate-500">
                      {slot.isAvailable ? `${slot.startTime} - ${slot.endTime}` : 'Off'}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
