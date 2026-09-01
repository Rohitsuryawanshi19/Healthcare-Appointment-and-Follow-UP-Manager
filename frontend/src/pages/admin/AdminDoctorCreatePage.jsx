import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  User,
  Mail,
  Lock,
  Phone,
  Stethoscope,
  Award,
  FileCheck,
  Building,
  Clock,
  IndianRupee,
  ArrowLeft,
  Check,
  AlertCircle,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { PageHeader } from '../../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import { PageTransition } from '../../components/ui/PageTransition';

const doctorCreateSchema = z.object({
  name: z.string().min(2, 'Doctor name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Temporary password must be at least 6 characters'),
  phone: z.string().optional(),
  specialization: z.string().min(2, 'Specialization is required'),
  qualification: z.string().min(2, 'Qualification is required (e.g. MBBS, MD)'),
  registrationNumber: z.string().min(3, 'Registration number is required'),
  registrationCouncil: z.string().min(2, 'Medical council authority is required'),
  experience: z.coerce.number().min(0, 'Experience must be 0 or greater'),
  consultationFee: z.coerce.number().min(0, 'Fee must be 0 or greater'),
  slotDuration: z.coerce.number().min(10, 'Slot duration must be at least 10 mins'),
  bio: z.string().optional(),
  verificationStatus: z.enum(['pending', 'verified', 'rejected']),
});

const defaultSchedule = [
  { day: 'Monday', isAvailable: true, startTime: '09:00', endTime: '17:00' },
  { day: 'Tuesday', isAvailable: true, startTime: '09:00', endTime: '17:00' },
  { day: 'Wednesday', isAvailable: true, startTime: '09:00', endTime: '17:00' },
  { day: 'Thursday', isAvailable: true, startTime: '09:00', endTime: '17:00' },
  { day: 'Friday', isAvailable: true, startTime: '09:00', endTime: '17:00' },
  { day: 'Saturday', isAvailable: false, startTime: '09:00', endTime: '13:00' },
  { day: 'Sunday', isAvailable: false, startTime: '09:00', endTime: '13:00' },
];

export default function AdminDoctorCreatePage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workingHours, setWorkingHours] = useState(defaultSchedule);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(doctorCreateSchema),
    defaultValues: {
      name: '',
      email: '',
      password: 'TemporaryPassword123!',
      phone: '',
      specialization: 'Cardiology',
      qualification: 'MBBS, MD',
      registrationNumber: '',
      registrationCouncil: 'Medical Council of India (MCI)',
      experience: 5,
      consultationFee: 500,
      slotDuration: 30,
      bio: '',
      verificationStatus: 'verified',
    },
  });

  const selectedStatus = watch('verificationStatus');

  const handleDayToggle = (index) => {
    const updated = [...workingHours];
    updated[index].isAvailable = !updated[index].isAvailable;
    setWorkingHours(updated);
  };

  const handleTimeChange = (index, field, value) => {
    const updated = [...workingHours];
    updated[index][field] = value;
    setWorkingHours(updated);
  };

  const onSubmit = async (values) => {
    setServerError('');
    setIsSubmitting(true);
    try {
      await adminService.createDoctor({
        ...values,
        workingHours,
      });
      toast({
        title: 'Doctor Created Successfully',
        description: `Credentials provisioned for ${values.name}.`,
        variant: 'success',
      });
      navigate('/admin/doctors');
    } catch (err) {
      setServerError(err.message || 'Failed to create doctor profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition className="space-y-6 text-left max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link to="/admin/doctors">
          <Button variant="ghost" size="icon" aria-label="Back to doctors list">
            <ArrowLeft className="h-4 w-4 text-slate-600" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Provision New Doctor Account
          </h1>
          <p className="text-xs text-slate-500">
            Set up login credentials, medical registration details, and clinic working hours.
          </p>
        </div>
      </div>

      {serverError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Account Credentials */}
        <Card>
          <CardHeader>
            <CardTitle>1. Account & Contact Credentials</CardTitle>
            <CardDescription>
              Physician login details and contact information.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" required>
                Doctor Full Name
              </Label>
              <Input
                id="name"
                placeholder="Dr. Rajesh Gupta"
                leftIcon={<User className="h-4 w-4" />}
                error={errors.name?.message}
                {...register('name')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" required>
                Email Address (Login Username)
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="dr.gupta@careflow.health"
                leftIcon={<Mail className="h-4 w-4" />}
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" required>
                Initial Temporary Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••••••"
                leftIcon={<Lock className="h-4 w-4" />}
                error={errors.password?.message}
                {...register('password')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 98765 43210"
                leftIcon={<Phone className="h-4 w-4" />}
                error={errors.phone?.message}
                {...register('phone')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Medical Credentials & Verification */}
        <Card>
          <CardHeader>
            <CardTitle>2. Medical Council Credentials & Verification</CardTitle>
            <CardDescription>
              Official registration and professional background details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="specialization" required>
                  Specialization
                </Label>
                <Input
                  id="specialization"
                  placeholder="e.g. Cardiology, Orthopedics, Pediatrics"
                  leftIcon={<Stethoscope className="h-4 w-4" />}
                  error={errors.specialization?.message}
                  {...register('specialization')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="qualification" required>
                  Qualification
                </Label>
                <Input
                  id="qualification"
                  placeholder="e.g. MBBS, MD, DM"
                  leftIcon={<Award className="h-4 w-4" />}
                  error={errors.qualification?.message}
                  {...register('qualification')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="registrationNumber" required>
                  State Council Registration No.
                </Label>
                <Input
                  id="registrationNumber"
                  placeholder="e.g. MCI-2018-84729"
                  leftIcon={<FileCheck className="h-4 w-4" />}
                  error={errors.registrationNumber?.message}
                  {...register('registrationNumber')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="registrationCouncil" required>
                  Medical Council Authority
                </Label>
                <Input
                  id="registrationCouncil"
                  placeholder="e.g. Delhi Medical Council"
                  leftIcon={<Building className="h-4 w-4" />}
                  error={errors.registrationCouncil?.message}
                  {...register('registrationCouncil')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="experience">Experience (Years)</Label>
                <Input
                  id="experience"
                  type="number"
                  error={errors.experience?.message}
                  {...register('experience')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="consultationFee">Consultation Fee (₹)</Label>
                <Input
                  id="consultationFee"
                  type="number"
                  leftIcon={<IndianRupee className="h-4 w-4" />}
                  error={errors.consultationFee?.message}
                  {...register('consultationFee')}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="slotDuration">Slot Duration (Minutes)</Label>
                <Input
                  id="slotDuration"
                  type="number"
                  leftIcon={<Clock className="h-4 w-4" />}
                  error={errors.slotDuration?.message}
                  {...register('slotDuration')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="verificationStatus">Initial Verification Status</Label>
                <Select
                  value={selectedStatus}
                  onValueChange={(val) => setValue('verificationStatus', val)}
                >
                  <SelectTrigger id="verificationStatus">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="verified">Verified (Directly Available)</SelectItem>
                    <SelectItem value="pending">Pending Review</SelectItem>
                    <SelectItem value="rejected">Rejected / Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <Label htmlFor="bio">Professional Bio</Label>
              <textarea
                id="bio"
                rows={3}
                placeholder="Brief summary of clinical expertise, hospital attachments, and accolades..."
                className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
                {...register('bio')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Working Hours Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>3. Clinic Schedule & Working Hours</CardTitle>
            <CardDescription>
              Default consultation hours used to generate booking slots.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
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
                    id={`day-${schedule.day}`}
                    checked={schedule.isAvailable}
                    onChange={() => handleDayToggle(idx)}
                    className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                  <label htmlFor={`day-${schedule.day}`} className="font-semibold text-slate-800 cursor-pointer">
                    {schedule.day}
                  </label>
                </div>

                {schedule.isAvailable ? (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Hours:</span>
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
          <CardFooter className="flex justify-end gap-3 pt-4">
            <Link to="/admin/doctors">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              leftIcon={<Check className="h-4 w-4" />}
            >
              Provision & Save Doctor
            </Button>
          </CardFooter>
        </Card>
      </form>
    </PageTransition>
  );
}
