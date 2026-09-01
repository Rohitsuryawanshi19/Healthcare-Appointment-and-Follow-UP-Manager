import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  UserCheck,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  Mail,
  Phone,
  FileCheck,
  Building,
  Award,
  IndianRupee,
  Activity,
  Edit,
  Plus,
  Trash2,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { PageHeader } from '../../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar, AvatarFallback } from '../../components/ui/Avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/Dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '../../components/ui/AlertDialog';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useToast } from '../../components/ui/Toast';
import { PageTransition } from '../../components/ui/PageTransition';

export default function AdminDoctorDetailsPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  // Leave Management State
  const [isAddLeaveModalOpen, setIsAddLeaveModalOpen] = useState(false);
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('Administrative Leave');
  const [leavePreview, setLeavePreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [isConfirmAlertOpen, setIsConfirmAlertOpen] = useState(false);
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  const loadDoctor = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getDoctorById(id);
      setData(res.data);
      setEditFormData({
        name: res.data.doctor.userId?.name || '',
        phone: res.data.doctor.userId?.phone || '',
        specialization: res.data.doctor.specialization || '',
        qualification: res.data.doctor.qualification || '',
        registrationNumber: res.data.doctor.registrationNumber || '',
        registrationCouncil: res.data.doctor.registrationCouncil || '',
        experience: res.data.doctor.experience || 0,
        consultationFee: res.data.doctor.consultationFee || 500,
        slotDuration: res.data.doctor.slotDuration || 30,
        bio: res.data.doctor.bio || '',
      });
    } catch (err) {
      setError(err.message || 'Failed to load doctor profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctor();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      await adminService.updateDoctorVerification(id, newStatus);
      toast({
        title: 'Status Updated',
        description: `Doctor verification marked as ${newStatus}.`,
        variant: newStatus === 'verified' ? 'success' : 'warning',
      });
      loadDoctor();
    } catch (err) {
      toast({
        title: 'Update Failed',
        description: err.message || 'Error updating verification status.',
        variant: 'error',
      });
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await adminService.updateDoctor(id, editFormData);
      toast({
        title: 'Profile Updated',
        description: 'Doctor details saved successfully.',
        variant: 'success',
      });
      setIsEditModalOpen(false);
      loadDoctor();
    } catch (err) {
      toast({
        title: 'Save Failed',
        description: err.message || 'Error saving doctor details.',
        variant: 'error',
      });
    }
  };

  // Preview affected appointments when date changes
  const handleCheckLeavePreview = async (e) => {
    e.preventDefault();
    if (!leaveDate) {
      toast({ title: 'Date Required', description: 'Please select a leave date.', variant: 'warning' });
      return;
    }

    setLoadingPreview(true);
    try {
      const res = await adminService.getDoctorLeavePreview(id, leaveDate);
      setLeavePreview(res.data);
      setIsConfirmAlertOpen(true);
    } catch (err) {
      toast({
        title: 'Preview Failed',
        description: err.message || 'Could not fetch appointment preview.',
        variant: 'error',
      });
    } finally {
      setLoadingPreview(false);
    }
  };

  // Confirmed submission of leave
  const handleConfirmAddLeave = async () => {
    setIsSubmittingLeave(true);
    try {
      const res = await adminService.addDoctorLeave(id, {
        date: leaveDate,
        reason: leaveReason,
      });

      toast({
        title: 'Doctor Marked Unavailable',
        description: `Leave recorded on ${leaveDate}. ${res.data?.affectedCount || 0} appointments cancelled and notified.`,
        variant: 'success',
      });

      setIsConfirmAlertOpen(false);
      setIsAddLeaveModalOpen(false);
      setLeaveDate('');
      setLeavePreview(null);
      loadDoctor();
    } catch (err) {
      toast({
        title: 'Leave Placement Failed',
        description: err.message || 'Error marking doctor unavailable.',
        variant: 'error',
      });
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  const handleRemoveLeave = async (leaveId) => {
    try {
      await adminService.removeDoctorLeave(id, leaveId);
      toast({
        title: 'Leave Removed',
        description: 'Doctor availability restored for this date.',
        variant: 'info',
      });
      loadDoctor();
    } catch (err) {
      toast({
        title: 'Removal Failed',
        description: err.message || 'Error removing leave.',
        variant: 'error',
      });
    }
  };

  if (loading) {
    return <LoadingState label="Loading doctor verification & schedule records..." />;
  }

  if (error || !data) {
    return <ErrorState title="Doctor Not Found" description={error} onRetry={loadDoctor} />;
  }

  const { doctor, leaves } = data;
  const isVerified = doctor.verificationStatus === 'verified';
  const isPending = doctor.verificationStatus === 'pending';
  const isRejected = doctor.verificationStatus === 'rejected';

  return (
    <PageTransition className="space-y-6 text-left max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/admin/doctors">
            <Button variant="ghost" size="icon" aria-label="Back to doctors">
              <ArrowLeft className="h-4 w-4 text-slate-600" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {doctor.userId?.name || 'Doctor Profile'}
              </h1>
              {isVerified && (
                <Badge variant="success" size="sm" className="gap-1">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </Badge>
              )}
              {isPending && <Badge variant="warning" size="sm">Verification Pending</Badge>}
              {isRejected && <Badge variant="danger" size="sm">Verification Rejected</Badge>}
              {doctor.demoData && (
                <Badge variant="secondary" size="sm" className="text-xs">
                  Synthetic Demo Profile
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {doctor.specialization} • Registered {new Date(doctor.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Verification Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            leftIcon={<Edit className="h-3.5 w-3.5" />}
          >
            Edit Record
          </Button>

          {isPending && (
            <>
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => handleStatusChange('verified')}
                leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
              >
                Approve & Verify
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-rose-600 hover:bg-rose-50 border-rose-200"
                onClick={() => handleStatusChange('rejected')}
                leftIcon={<XCircle className="h-3.5 w-3.5" />}
              >
                Reject
              </Button>
            </>
          )}

          {isVerified && (
            <Button
              variant="outline"
              size="sm"
              className="text-rose-600 hover:bg-rose-50 border-rose-200"
              onClick={() => handleStatusChange('rejected')}
              leftIcon={<XCircle className="h-3.5 w-3.5" />}
            >
              Revoke Verification
            </Button>
          )}

          {isRejected && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleStatusChange('verified')}
              leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
            >
              Re-Verify Doctor
            </Button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column: Profile Card & Bio */}
        <div className="md:col-span-1 space-y-6">
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <Avatar size="lg">
                <AvatarFallback className="bg-teal-50 text-teal-800 font-bold">
                  {doctor.userId?.name?.substring(0, 2).toUpperCase() || 'DR'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{doctor.userId?.name}</h3>
                <p className="text-xs text-teal-700 font-medium">{doctor.specialization}</p>
                <p className="text-[11px] text-slate-400">{doctor.qualification}</p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{doctor.userId?.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{doctor.userId?.phone || 'No phone recorded'}</span>
              </div>
              <div className="flex items-center gap-2">
                <IndianRupee className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>₹{doctor.consultationFee} Consultation Fee</span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider mb-1">
                Biography
              </span>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "{doctor.bio || 'No clinical biography provided yet.'}"
              </p>
            </div>
          </Card>
        </div>

        {/* Right Column: Credentials, Schedule & Leaves */}
        <div className="md:col-span-2 space-y-6">
          {/* Medical Registration Details */}
          <Card>
            <CardHeader>
              <CardTitle>Medical Council Registration</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Registration Number</span>
                <span className="font-mono text-sm font-bold text-slate-900">{doctor.registrationNumber}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Council Authority</span>
                <span className="font-medium text-slate-900">{doctor.registrationCouncil}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Clinical Experience</span>
                <span className="font-medium text-slate-900">{doctor.experience} Years</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Slot Duration</span>
                <span className="font-medium text-slate-900">{doctor.slotDuration} Minutes</span>
              </div>
            </CardContent>
          </Card>

          {/* Working Hours Schedule Matrix */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Working Hours</CardTitle>
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

          {/* Hardened Scheduled Doctor Leaves & Unavailability */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Doctor Leave & Unavailability</CardTitle>
                <CardDescription>
                  Mark doctor unavailable on specific dates. Automatically cancels and notifies affected patients.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddLeaveModalOpen(true)}
                leftIcon={<Plus className="h-3.5 w-3.5" />}
              >
                Mark Unavailable
              </Button>
            </CardHeader>
            <CardContent>
              {leaves.length === 0 ? (
                <div className="p-5 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  No upcoming leave dates recorded for this physician.
                </div>
              ) : (
                <div className="space-y-2">
                  {leaves.map((leave) => (
                    <div
                      key={leave._id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <div>
                          <span className="font-bold text-slate-900 block">{leave.date}</span>
                          <span className="text-slate-500 text-[11px]">{leave.reason || 'Personal Leave'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="warning" size="sm">
                          Unavailable
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-rose-600 hover:bg-rose-50"
                          onClick={() => handleRemoveLeave(leave._id)}
                          title="Remove leave and restore availability"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Leave Date Dialog */}
      <Dialog open={isAddLeaveModalOpen} onOpenChange={setIsAddLeaveModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Doctor Unavailable</DialogTitle>
            <DialogDescription>
              Select a date to place Dr. {doctor.userId?.name} on scheduled leave.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCheckLeavePreview} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="leave-date" required>
                Leave Date (YYYY-MM-DD)
              </Label>
              <Input
                id="leave-date"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={leaveDate}
                onChange={(e) => setLeaveDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="leave-reason">
                Reason / Note
              </Label>
              <Input
                id="leave-reason"
                placeholder="Annual Medical Conference / Personal Leave"
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddLeaveModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!leaveDate || loadingPreview}
                isLoading={loadingPreview}
              >
                Preview Affected Appointments
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Radix Confirmation AlertDialog for Leave Placement */}
      <AlertDialog open={isConfirmAlertOpen} onOpenChange={setIsConfirmAlertOpen}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-700">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
              Confirm Doctor Unavailability on {leaveDate}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p className="font-semibold text-slate-800">
                You are about to mark this doctor unavailable. {leavePreview?.affectedCount || 0} existing appointment(s) will be affected.
              </p>

              {leavePreview?.affectedAppointments?.length > 0 ? (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Affected Consultations to be Cancelled & Notified:
                  </span>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 text-xs">
                    {leavePreview.affectedAppointments.map((appt) => (
                      <div
                        key={appt._id}
                        className="p-2.5 rounded-lg border border-rose-200 bg-rose-50/60 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900">{appt.patientId?.name || 'Patient'}</span>
                          <span className="text-slate-500 block text-[11px]">{appt.patientId?.email}</span>
                        </div>
                        <Badge variant="outline" size="sm" className="font-mono">
                          {appt.startTime} - {appt.endTime}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 italic">
                    All affected patients and the doctor will automatically receive schedule notice emails with rebooking links.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-600">
                  No existing patient bookings found for this date. The doctor's slots will be blocked from future patient booking.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="pt-3">
            <AlertDialogCancel disabled={isSubmittingLeave}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              isLoading={isSubmittingLeave}
              onClick={handleConfirmAddLeave}
            >
              Confirm & Mark Unavailable
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Doctor Modal Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Doctor Profile</DialogTitle>
            <DialogDescription>
              Update medical registration details and fees.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="doc-spec">Specialization</Label>
                <Input
                  id="doc-spec"
                  value={editFormData.specialization}
                  onChange={(e) => setEditFormData({ ...editFormData, specialization: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="doc-qual">Qualification</Label>
                <Input
                  id="doc-qual"
                  value={editFormData.qualification}
                  onChange={(e) => setEditFormData({ ...editFormData, qualification: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="doc-reg">Registration Number</Label>
                <Input
                  id="doc-reg"
                  value={editFormData.registrationNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, registrationNumber: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="doc-council">Registration Council</Label>
                <Input
                  id="doc-council"
                  value={editFormData.registrationCouncil}
                  onChange={(e) => setEditFormData({ ...editFormData, registrationCouncil: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="doc-exp">Experience (Years)</Label>
                <Input
                  id="doc-exp"
                  type="number"
                  value={editFormData.experience}
                  onChange={(e) => setEditFormData({ ...editFormData, experience: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="doc-fee">Consultation Fee (₹)</Label>
                <Input
                  id="doc-fee"
                  type="number"
                  value={editFormData.consultationFee}
                  onChange={(e) => setEditFormData({ ...editFormData, consultationFee: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="doc-dur">Slot Duration (Mins)</Label>
                <Input
                  id="doc-dur"
                  type="number"
                  value={editFormData.slotDuration}
                  onChange={(e) => setEditFormData({ ...editFormData, slotDuration: Number(e.target.value) })}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
