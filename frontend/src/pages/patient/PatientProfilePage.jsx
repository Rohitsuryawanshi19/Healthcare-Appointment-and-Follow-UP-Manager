import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Save, ShieldCheck, CheckCircle2, AlertCircle, Link2, Unlink } from 'lucide-react';
import { patientService } from '../../services/patientService';
import { calendarService } from '../../services/calendarService';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useToast } from '../../components/ui/Toast';
import { PageTransition } from '../../components/ui/PageTransition';

export default function PatientProfilePage() {
  const { toast } = useToast();
  const { checkAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [calendarStatus, setCalendarStatus] = useState({ isConnected: false, calendarEmail: '' });
  const [isConnectingCalendar, setIsConnectingCalendar] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    createdAt: '',
  });

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const [profileRes, calRes] = await Promise.all([
        patientService.getProfile(),
        calendarService.getStatus().catch(() => ({ data: { isConnected: false } })),
      ]);

      setFormData({
        name: profileRes.data.name || '',
        email: profileRes.data.email || '',
        phone: profileRes.data.phone || '',
        createdAt: profileRes.data.createdAt || '',
      });

      setCalendarStatus(calRes.data || { isConnected: false, calendarEmail: '' });
    } catch (err) {
      setError(err.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await patientService.updateProfile({
        name: formData.name,
        phone: formData.phone,
      });
      toast({
        title: 'Profile Updated',
        description: 'Your account details have been saved.',
        variant: 'success',
      });
      await checkAuth();
      loadProfile();
    } catch (err) {
      toast({
        title: 'Save Failed',
        description: err.message || 'Error updating profile.',
        variant: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnectCalendar = async () => {
    setIsConnectingCalendar(true);
    try {
      const res = await calendarService.getConnectUrl('/patient/profile');
      if (res.data?.authUrl) {
        window.location.href = res.data.authUrl;
      }
    } catch (err) {
      toast({
        title: 'Calendar Connection Failed',
        description: err.message || 'Could not initiate Google OAuth.',
        variant: 'error',
      });
      setIsConnectingCalendar(false);
    }
  };

  const handleDisconnectCalendar = async () => {
    try {
      await calendarService.disconnect();
      toast({
        title: 'Calendar Disconnected',
        description: 'Google Calendar sync is disabled.',
        variant: 'info',
      });
      loadProfile();
    } catch (err) {
      toast({
        title: 'Disconnect Error',
        description: err.message,
        variant: 'error',
      });
    }
  };

  if (loading) {
    return <LoadingState label="Loading your patient profile..." />;
  }

  if (error) {
    return <ErrorState title="Profile Error" description={error} onRetry={loadProfile} />;
  }

  return (
    <PageTransition className="space-y-6 text-left max-w-3xl mx-auto">
      <PageHeader
        title="Patient Account & Profile Settings"
        description="Manage your contact information, review security status, and connect third-party calendars."
      />

      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Your contact details used for appointment confirmations and notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pat-name" required>
                Full Name
              </Label>
              <Input
                id="pat-name"
                placeholder="Johnathan Doe"
                leftIcon={<User className="h-4 w-4" />}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pat-email">
                Email Address (Account Username)
              </Label>
              <Input
                id="pat-email"
                type="email"
                disabled
                leftIcon={<Mail className="h-4 w-4" />}
                value={formData.email}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pat-phone">
                Phone Number
              </Label>
              <Input
                id="pat-phone"
                type="tel"
                placeholder="+1 (555) 019-2834"
                leftIcon={<Phone className="h-4 w-4" />}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-teal-600" /> Account Registered:
              </span>
              <span className="font-mono text-slate-700">
                {formData.createdAt ? new Date(formData.createdAt).toLocaleDateString() : 'Active Member'}
              </span>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              isLoading={isSaving}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Save Profile Changes
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* Google Calendar Integration Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm">Google Calendar Integration</CardTitle>
                <CardDescription>
                  Automatically synchronize confirmed, rescheduled, and cancelled consultations.
                </CardDescription>
              </div>
            </div>
            {calendarStatus.isConnected ? (
              <Badge variant="success" size="sm">
                Connected
              </Badge>
            ) : (
              <Badge variant="default" size="sm">
                Not Connected
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-2">
          {calendarStatus.isConnected ? (
            <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-teal-950">
                  <CheckCircle2 className="h-4 w-4 text-teal-600" />
                  Synced to Google Account: {calendarStatus.calendarEmail || formData.email}
                </div>
                <p className="text-slate-600 text-[11px]">
                  Appointments are automatically created and kept in sync with reminders.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnectCalendar}
                className="text-rose-600 hover:bg-rose-50 border-rose-200"
                leftIcon={<Unlink className="h-3.5 w-3.5" />}
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <p className="text-slate-600">
                Connect your Google Calendar via OAuth 2.0 to sync medical visit schedules directly to your personal agenda.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleConnectCalendar}
                isLoading={isConnectingCalendar}
                leftIcon={<Link2 className="h-3.5 w-3.5 text-teal-600" />}
              >
                Connect Google Calendar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </PageTransition>
  );
}
