import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Save,
} from 'lucide-react';
import { doctorService } from '../../services/doctorService';
import { PageHeader } from '../../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../components/ui/Select';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useToast } from '../../components/ui/Toast';
import { PageTransition } from '../../components/ui/PageTransition';

export default function DoctorSchedulePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [workingHours, setWorkingHours] = useState([]);
  const [slotDuration, setSlotDuration] = useState(30);
  const [leaves, setLeaves] = useState([]);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  // New leave form state
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('Personal / Conference Leave');
  const [isAddingLeave, setIsAddingLeave] = useState(false);

  const loadSchedule = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await doctorService.getSchedule();
      setWorkingHours(res.data.workingHours || []);
      setSlotDuration(res.data.slotDuration || 30);
      setLeaves(res.data.leaves || []);
    } catch (err) {
      setError(err.message || 'Failed to load doctor schedule.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  const handleDayToggle = (idx) => {
    const updated = [...workingHours];
    updated[idx].isAvailable = !updated[idx].isAvailable;
    setWorkingHours(updated);
  };

  const handleTimeChange = (idx, field, value) => {
    const updated = [...workingHours];
    updated[idx][field] = value;
    setWorkingHours(updated);
  };

  const handleSaveHours = async () => {
    setIsSavingSchedule(true);
    try {
      await doctorService.updateSchedule({
        workingHours,
        slotDuration: Number(slotDuration),
      });
      toast({
        title: 'Schedule Updated',
        description: 'Working hours and slot duration saved successfully.',
        variant: 'success',
      });
      loadSchedule();
    } catch (err) {
      toast({
        title: 'Save Failed',
        description: err.message || 'Error updating schedule.',
        variant: 'error',
      });
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleAddLeave = async (e) => {
    e.preventDefault();
    if (!leaveDate) {
      toast({
        title: 'Date Required',
        description: 'Please select a leave date.',
        variant: 'warning',
      });
      return;
    }

    setIsAddingLeave(true);
    try {
      await doctorService.addLeave({
        date: leaveDate,
        reason: leaveReason,
      });
      toast({
        title: 'Leave Scheduled',
        description: `Leave recorded for ${leaveDate}.`,
        variant: 'success',
      });
      setLeaveDate('');
      loadSchedule();
    } catch (err) {
      toast({
        title: 'Leave Conflict',
        description: err.message || 'Error scheduling leave.',
        variant: 'error',
      });
    } finally {
      setIsAddingLeave(false);
    }
  };

  const handleDeleteLeave = async (id) => {
    try {
      await doctorService.deleteLeave(id);
      toast({
        title: 'Leave Cancelled',
        description: 'Scheduled leave removed from calendar.',
        variant: 'success',
      });
      loadSchedule();
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message || 'Unable to cancel leave.',
        variant: 'error',
      });
    }
  };

  if (loading) {
    return <LoadingState label="Loading consultation schedule & leaves..." />;
  }

  if (error) {
    return <ErrorState title="Schedule Unavailable" description={error} onRetry={loadSchedule} />;
  }

  return (
    <PageTransition className="space-y-8 text-left max-w-4xl mx-auto">
      <PageHeader
        title="Consultation Hours & Leave Management"
        description="Set your weekly consultation availability, appointment slot granularity, and schedule planned leave days."
      />

      {/* Weekly Working Hours Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Weekly Working Hours & Slot Duration</CardTitle>
              <CardDescription>
                Define start and end times for each day of the week.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="slot-dur" className="text-xs">Slot Duration:</Label>
                <select
                  id="slot-dur"
                  value={slotDuration}
                  onChange={(e) => setSlotDuration(Number(e.target.value))}
                  className="h-8 rounded-lg border border-slate-300 text-xs px-2 bg-white text-slate-900 focus:outline-none focus:border-teal-600"
                >
                  <option value={15}>15 mins</option>
                  <option value={20}>20 mins</option>
                  <option value={30}>30 mins</option>
                  <option value={45}>45 mins</option>
                  <option value={60}>60 mins</option>
                </select>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveHours}
                isLoading={isSavingSchedule}
                leftIcon={<Save className="h-3.5 w-3.5" />}
              >
                Save Schedule
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {workingHours.map((schedule, idx) => (
            <div
              key={schedule.day}
              className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs transition-colors ${
                schedule.isAvailable
                  ? 'bg-white border-slate-200'
                  : 'bg-slate-50 border-slate-200/60 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3 w-32">
                <input
                  type="checkbox"
                  id={`doc-day-${schedule.day}`}
                  checked={schedule.isAvailable}
                  onChange={() => handleDayToggle(idx)}
                  className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <label htmlFor={`doc-day-${schedule.day}`} className="font-semibold text-slate-800 cursor-pointer">
                  {schedule.day}
                </label>
              </div>

              {schedule.isAvailable ? (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Available:</span>
                  <input
                    type="time"
                    value={schedule.startTime}
                    onChange={(e) => handleTimeChange(idx, 'startTime', e.target.value)}
                    className="px-2 py-1 rounded-lg border border-slate-300 text-xs bg-white text-slate-800 focus:outline-none focus:border-teal-600"
                  />
                  <span className="text-slate-400">to</span>
                  <input
                    type="time"
                    value={schedule.endTime}
                    onChange={(e) => handleTimeChange(idx, 'endTime', e.target.value)}
                    className="px-2 py-1 rounded-lg border border-slate-300 text-xs bg-white text-slate-800 focus:outline-none focus:border-teal-600"
                  />
                </div>
              ) : (
                <span className="text-slate-400 font-medium">Off Duty</span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Leave Days Management */}
      <div className="grid sm:grid-cols-2 gap-6">
        {/* Schedule Leave Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-teal-600" /> Schedule Planned Leave
            </CardTitle>
            <CardDescription>
              Mark dates when you will be out of the clinic.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleAddLeave}>
            <CardContent className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="leave-date" required>
                  Leave Date
                </Label>
                <Input
                  id="leave-date"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={leaveDate}
                  onChange={(e) => setLeaveDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="leave-reason">Reason for Leave</Label>
                <Input
                  id="leave-reason"
                  placeholder="e.g. Medical Conference, Annual Leave"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isAddingLeave}
                leftIcon={<Plus className="h-3.5 w-3.5" />}
              >
                Schedule Leave
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Scheduled Leaves List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Scheduled Leaves</CardTitle>
              <Badge variant="secondary" size="sm">{leaves.length} Total</Badge>
            </div>
            <CardDescription>
              Upcoming registered leave dates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {leaves.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                No leave days currently scheduled.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {leaves.map((leave) => (
                  <div
                    key={leave._id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-teal-600" />
                        {leave.date}
                      </div>
                      <div className="text-slate-500 text-[11px]">{leave.reason}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteLeave(leave._id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Cancel Leave"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
