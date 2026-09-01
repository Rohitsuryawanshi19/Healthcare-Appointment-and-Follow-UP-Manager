import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Plus,
  Trash2,
  Save,
  Send,
  XCircle,
  Stethoscope,
  Activity,
} from 'lucide-react';
import { doctorService } from '../../services/doctorService';
import { PageHeader } from '../../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Avatar, AvatarFallback } from '../../components/ui/Avatar';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
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

export default function DoctorAppointmentDetailsPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Doctor Consultation Form state
  const [diagnosis, setDiagnosis] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [followUpInstructions, setFollowUpInstructions] = useState('');
  const [medicines, setMedicines] = useState([
    { name: '', dosage: '500mg', frequency: 'Twice daily', duration: '5 days', timing: 'after_meal', instructions: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const loadAppointment = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await doctorService.getAppointmentById(id);
      const appt = res.data;
      setAppointment(appt);
      setDiagnosis(appt.diagnosis || '');
      setDoctorNotes(appt.doctorNotes || '');
      setFollowUpInstructions(appt.followUpInstructions || '');

      if (appt.prescriptionId?.medicines?.length > 0) {
        setMedicines(appt.prescriptionId.medicines);
      }
    } catch (err) {
      setError(err.message || 'Failed to load appointment details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointment();
  }, [id]);

  const handleAddMedicine = () => {
    setMedicines([
      ...medicines,
      { name: '', dosage: '500mg', frequency: 'Twice daily', duration: '5 days', timing: 'after_meal', instructions: '' },
    ]);
  };

  const handleRemoveMedicine = (idx) => {
    setMedicines(medicines.filter((_, i) => i !== idx));
  };

  const handleMedicineChange = (idx, field, value) => {
    const updated = [...medicines];
    updated[idx][field] = value;
    setMedicines(updated);
  };

  // Save Draft (without completing)
  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      await doctorService.saveDoctorNotes(id, doctorNotes);
      const validMeds = medicines.filter((m) => m.name && m.name.trim() !== '');
      if (validMeds.length > 0) {
        await doctorService.savePrescription(id, {
          medicines: validMeds,
          instructions: followUpInstructions,
        });
      }

      toast({
        title: 'Draft Saved',
        description: 'Clinical observations saved without closing consultation.',
        variant: 'info',
      });
      loadAppointment();
    } catch (err) {
      toast({
        title: 'Save Failed',
        description: err.message || 'Error saving consultation draft.',
        variant: 'error',
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Complete Consultation
  const handleCompleteConsultation = async (e) => {
    if (e) e.preventDefault();

    if (!diagnosis.trim() && !doctorNotes.trim()) {
      toast({
        title: 'Missing Observations',
        description: 'Please provide either a clinical assessment diagnosis or clinical doctor notes.',
        variant: 'warning',
      });
      return;
    }

    const validMeds = medicines.filter((m) => m.name && m.name.trim() !== '');

    setIsSubmitting(true);
    try {
      const res = await doctorService.submitConsultation(id, {
        diagnosis: diagnosis.trim(),
        doctorNotes: doctorNotes.trim(),
        followUpInstructions: followUpInstructions.trim(),
        medicines: validMeds,
      });

      toast({
        title: 'Consultation Concluded',
        description: 'Appointment marked completed and prescription issued to patient.',
        variant: 'success',
      });

      loadAppointment();
    } catch (err) {
      toast({
        title: 'Consultation Submission Failed',
        description: err.message || 'Error completing consultation workflow.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await doctorService.updateAppointmentStatus(id, newStatus);
      toast({
        title: 'Status Updated',
        description: `Appointment status is now ${newStatus}.`,
        variant: 'success',
      });
      loadAppointment();
    } catch (err) {
      toast({
        title: 'Update Failed',
        description: err.message || 'Error changing appointment status.',
        variant: 'error',
      });
    }
  };

  if (loading) {
    return <LoadingState label="Loading EHR clinical workspace..." />;
  }

  if (error || !appointment) {
    return <ErrorState title="Appointment Not Found" description={error} onRetry={loadAppointment} />;
  }

  const isCompleted = appointment.status === 'completed';

  return (
    <PageTransition className="space-y-6 text-left max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/doctor/appointments">
            <Button variant="ghost" size="icon" aria-label="Back to appointments">
              <ArrowLeft className="h-4 w-4 text-slate-600" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Clinical Consultation: {appointment.patientId?.name}
              </h1>
              <StatusBadge status={appointment.status} size="sm" />
            </div>
            <p className="text-xs text-slate-500">
              {appointment.date} • {appointment.startTime} - {appointment.endTime}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {!isCompleted && (
            <Button
              variant="primary"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
              leftIcon={<CheckCircle2 className="h-4 w-4" />}
              isLoading={isSubmitting}
              onClick={handleCompleteConsultation}
            >
              Conclude & Complete Visit
            </Button>
          )}
          {appointment.status !== 'cancelled' && !isCompleted && (
            <Button
              variant="outline"
              size="sm"
              className="text-rose-600 hover:bg-rose-50 border-rose-200"
              leftIcon={<XCircle className="h-3.5 w-3.5" />}
              onClick={() => handleStatusChange('cancelled')}
            >
              Cancel Visit
            </Button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column: Patient Info, Submitted Symptoms, and AI Pre-Visit Summary */}
        <div className="md:col-span-1 space-y-6">
          {/* Patient Card */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <Avatar size="lg">
                <AvatarFallback className="bg-teal-50 text-teal-800 font-bold">
                  {appointment.patientId?.name?.substring(0, 2).toUpperCase() || 'PT'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{appointment.patientId?.name}</h3>
                <p className="text-[11px] text-slate-400">Registered Patient</p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{appointment.patientId?.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{appointment.patientId?.phone || 'No phone recorded'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>Consultation Date: {appointment.date}</span>
              </div>
            </div>
          </Card>

          {/* Patient Reported Symptoms */}
          <Card className="p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Patient Submitted Symptoms
            </h4>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed italic">
              {appointment.symptoms ? (
                `"${appointment.symptoms}"`
              ) : (
                <span className="text-slate-400 not-italic">No pre-visit symptoms submitted by patient.</span>
              )}
            </div>
          </Card>

          {/* AI Pre-Visit Summary Card */}
          <Card className="p-5 space-y-3.5 border-teal-200 bg-teal-50/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-950 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-teal-600 shrink-0" /> AI Pre-Visit Summary
              </span>
              {appointment.aiSummary?.triageUrgency && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                    ['high', 'emergency'].includes(appointment.aiSummary.triageUrgency.toLowerCase())
                      ? 'bg-rose-100 text-rose-800 border-rose-200'
                      : ['medium', 'moderate'].includes(appointment.aiSummary.triageUrgency.toLowerCase())
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}
                >
                  Urgency: {appointment.aiSummary.triageUrgency}
                </span>
              )}
            </div>

            {appointment.aiSummary?.chiefComplaint ? (
              <div className="space-y-3 text-xs text-slate-800">
                <div className="p-3 bg-white rounded-xl border border-teal-100 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Chief Complaint
                  </span>
                  <p className="font-medium text-slate-900 leading-relaxed">
                    {appointment.aiSummary.chiefComplaint}
                  </p>
                </div>

                {appointment.aiSummary.suggestedQuestions?.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] uppercase font-bold text-teal-900 block tracking-wider">
                      Suggested Clinical Inquiries
                    </span>
                    <div className="space-y-1.5">
                      {appointment.aiSummary.suggestedQuestions.map((q, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-lg bg-white/90 border border-teal-200/80 text-[11px] text-slate-800 flex items-start gap-2 leading-snug"
                        >
                          <span className="font-bold text-teal-700 select-none">{i + 1}.</span>
                          <span>{q}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Medical Safety Disclaimer */}
                <div className="pt-2 border-t border-teal-200 text-[10px] text-slate-500 leading-normal flex items-start gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span>
                    {appointment.aiSummary.disclaimer ||
                      'AI-generated informational summary. This does not constitute a medical diagnosis.'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-teal-800/80 bg-white/60 rounded-xl border border-dashed border-teal-200">
                {appointment.symptoms
                  ? 'AI symptom summary processing. Triage information will appear shortly.'
                  : 'No patient pre-visit symptoms reported for automated triage analysis.'}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Doctor Consultation Form & Prescription Workspace */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-teal-600" />
                  <CardTitle>Doctor Consultation Form</CardTitle>
                </div>
                {isCompleted && (
                  <Badge variant="success" size="sm">
                    Consultation Concluded
                  </Badge>
                )}
              </div>
              <CardDescription>
                Record clinical diagnosis, doctor notes, electronic prescription, and follow-up advice.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* 1. Clinical Diagnosis / Assessment Field */}
              <div className="space-y-1.5">
                <Label htmlFor="diagnosis-input" required>
                  Diagnosis / Clinical Assessment
                </Label>
                <Input
                  id="diagnosis-input"
                  placeholder="e.g. Acute Bacterial Pharyngitis, Sinus Arrhythmia, Essential Hypertension..."
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                />
              </div>

              {/* 2. Doctor Clinical Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="doctor-notes" required>
                  Doctor Clinical Examination Notes & Observations
                </Label>
                <textarea
                  id="doctor-notes"
                  rows={5}
                  placeholder="Enter detailed clinical findings, vital signs (BP, Pulse, SpO2), physical examination observations, and differential diagnosis..."
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
                />
              </div>

              {/* 3. Electronic Prescription Builder */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1.5">
                    <Pill className="h-3.5 w-3.5 text-teal-600" /> Prescribed Medications (Optional)
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddMedicine}
                    leftIcon={<Plus className="h-3 w-3" />}
                  >
                    Add Medicine
                  </Button>
                </div>

                <div className="space-y-3">
                  {medicines.map((med, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700">
                          Medicine #{idx + 1}
                        </span>
                        {medicines.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-rose-600 h-6 px-2 text-[11px]"
                            onClick={() => handleRemoveMedicine(idx)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" /> Remove
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                        <div>
                          <Label className="text-[10px]">Medicine Name</Label>
                          <Input
                            placeholder="e.g. Amoxicillin"
                            value={med.name}
                            onChange={(e) => handleMedicineChange(idx, 'name', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-[10px]">Dosage</Label>
                          <Input
                            placeholder="e.g. 500mg"
                            value={med.dosage}
                            onChange={(e) => handleMedicineChange(idx, 'dosage', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-[10px]">Frequency</Label>
                          <Input
                            placeholder="e.g. Twice daily"
                            value={med.frequency}
                            onChange={(e) => handleMedicineChange(idx, 'frequency', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-[10px]">Duration</Label>
                          <Input
                            placeholder="e.g. 5 days"
                            value={med.duration}
                            onChange={(e) => handleMedicineChange(idx, 'duration', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <Label className="text-[10px]">Meal Timing</Label>
                          <select
                            value={med.timing}
                            onChange={(e) => handleMedicineChange(idx, 'timing', e.target.value)}
                            className="w-full h-9 px-3 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-teal-600"
                          >
                            <option value="after_meal">After Meal</option>
                            <option value="before_meal">Before Meal</option>
                            <option value="with_meal">With Meal</option>
                            <option value="bedtime">At Bedtime</option>
                            <option value="as_needed">As Needed (SOS)</option>
                          </select>
                        </div>
                        <div>
                          <Label className="text-[10px]">Special Instructions</Label>
                          <Input
                            placeholder="e.g. Drink plenty of water"
                            value={med.instructions}
                            onChange={(e) => handleMedicineChange(idx, 'instructions', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Follow-Up & Lifestyle Advice */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <Label htmlFor="follow-up">Follow-Up Instructions & Advice</Label>
                <textarea
                  id="follow-up"
                  rows={3}
                  placeholder="e.g. Return for follow-up review in 7 days. Avoid cold beverages and get adequate rest..."
                  value={followUpInstructions}
                  onChange={(e) => setFollowUpInstructions(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
                />
              </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between border-t border-slate-100 pt-4">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleSaveDraft}
                isLoading={isSavingDraft}
                leftIcon={<Save className="h-4 w-4" />}
              >
                Save Draft Observations
              </Button>

              <Button
                type="button"
                variant="primary"
                size="md"
                className="bg-teal-600 hover:bg-teal-700"
                isLoading={isSubmitting}
                onClick={handleCompleteConsultation}
                leftIcon={<CheckCircle2 className="h-4 w-4" />}
              >
                {isCompleted ? 'Update Consultation' : 'Submit & Complete Consultation'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
