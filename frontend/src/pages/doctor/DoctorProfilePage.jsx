import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Stethoscope,
  Award,
  FileCheck,
  Building,
  IndianRupee,
  ShieldCheck,
  Save,
  Lock,
} from 'lucide-react';
import { doctorService } from '../../services/doctorService';
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

export default function DoctorProfilePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [doctor, setDoctor] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    phone: '',
    qualification: '',
    experience: 0,
    consultationFee: 500,
    bio: '',
  });

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await doctorService.getProfile();
      const doc = res.data;
      setDoctor(doc);
      setFormData({
        phone: doc.userId?.phone || '',
        qualification: doc.qualification || '',
        experience: doc.experience || 0,
        consultationFee: doc.consultationFee || 500,
        bio: doc.bio || '',
      });
    } catch (err) {
      setError(err.message || 'Failed to load doctor profile.');
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
      await doctorService.updateProfile(formData);
      toast({
        title: 'Profile Updated',
        description: 'Your clinical details have been saved.',
        variant: 'success',
      });
      loadProfile();
    } catch (err) {
      toast({
        title: 'Update Failed',
        description: err.message || 'Error updating profile.',
        variant: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <LoadingState label="Loading physician profile..." />;
  }

  if (error || !doctor) {
    return <ErrorState title="Profile Error" description={error} onRetry={loadProfile} />;
  }

  return (
    <PageTransition className="space-y-6 text-left max-w-4xl mx-auto">
      <PageHeader
        title="Physician Profile & Credentials"
        description="Manage your contact details, consultation fees, and professional background."
        badge={
          doctor.verificationStatus === 'verified' ? (
            <Badge variant="success" size="sm" dot>
              Verified Physician
            </Badge>
          ) : (
            <Badge variant="warning" size="sm" dot>
              Pending Verification
            </Badge>
          )
        }
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Read-Only Official Credentials Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-slate-400" />
                <CardTitle>Medical Council Registration (Admin Controlled)</CardTitle>
              </div>
              <Badge variant="secondary" size="sm">Read-Only</Badge>
            </div>
            <CardDescription>
              Official registration details are verified and managed by clinic administration.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Doctor Full Name</span>
              <span className="font-bold text-slate-900 text-sm">{doctor.userId?.name}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Specialization</span>
              <span className="font-bold text-slate-900 text-sm">{doctor.specialization}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Registration Number</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{doctor.registrationNumber}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Medical Council</span>
              <span className="font-medium text-slate-900">{doctor.registrationCouncil}</span>
            </div>
          </CardContent>
        </Card>

        {/* Editable Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Editable Practice Details</CardTitle>
            <CardDescription>
              Update your contact phone, qualification degrees, fees, and bio summary.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="doc-phone">Contact Phone</Label>
                <Input
                  id="doc-phone"
                  placeholder="+91 98765 43210"
                  leftIcon={<Phone className="h-4 w-4" />}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="doc-qual">Qualifications</Label>
                <Input
                  id="doc-qual"
                  placeholder="MBBS, MD"
                  leftIcon={<Award className="h-4 w-4" />}
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="doc-fee">Consultation Fee (₹)</Label>
                <Input
                  id="doc-fee"
                  type="number"
                  leftIcon={<IndianRupee className="h-4 w-4" />}
                  value={formData.consultationFee}
                  onChange={(e) => setFormData({ ...formData, consultationFee: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="doc-exp">Experience (Years)</Label>
                <Input
                  id="doc-exp"
                  type="number"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <Label htmlFor="doc-bio">Professional Bio & Clinical Philosophy</Label>
              <textarea
                id="doc-bio"
                rows={4}
                placeholder="Share your clinical background, specialized hospital training, and patient care approach..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
              />
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
    </PageTransition>
  );
}
