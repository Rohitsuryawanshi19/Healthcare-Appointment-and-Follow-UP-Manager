import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, Mail, Phone, Lock, AlertCircle, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { PageTransition } from '../../components/ui/PageTransition';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
    phone: z.string().optional(),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export default function RegisterPage() {
  const { register: registerAuth } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values) => {
    setServerError('');
    setIsSubmitting(true);
    try {
      const res = await registerAuth({
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
      });
      toast({
        title: 'Registration Complete',
        description: 'Your patient account has been created successfully.',
        variant: 'success',
      });
      navigate('/', { replace: true });
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please verify your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition className="space-y-6">
      <div className="space-y-1 text-left">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="primary" size="sm" dot>
            Patient Registration
          </Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Create your account
        </h1>
        <p className="text-sm text-slate-500">
          Join CareFlow to book appointments and receive personalized follow-up care.
        </p>
      </div>

      {serverError && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium animate-in fade-in-50">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 text-left">
        <div className="space-y-1.5">
          <Label htmlFor="name" required>
            Full Name
          </Label>
          <Input
            id="name"
            placeholder="Johnathan Doe"
            leftIcon={<User className="h-4 w-4" />}
            error={errors.name?.message}
            {...register('name')}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" required>
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="patient@careflow.health"
            leftIcon={<Mail className="h-4 w-4" />}
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone Number (Optional)</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+1 (555) 019-2834"
            leftIcon={<Phone className="h-4 w-4" />}
            error={errors.phone?.message}
            {...register('phone')}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="password" required>
              Password
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
            <Label htmlFor="confirmPassword" required>
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••••••"
              leftIcon={<Lock className="h-4 w-4" />}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full justify-center shadow-md shadow-teal-600/20 mt-2"
          isLoading={isSubmitting}
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          Create Patient Account
        </Button>
      </form>

      {/* Notice about Doctor / Admin Registration */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 leading-relaxed text-left flex items-start gap-2.5">
        <ShieldCheck className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
        <span>
          <strong>Healthcare Providers:</strong> Doctor and Administrator credentials are provisioned exclusively through authorized institutional clinic administration.
        </span>
      </div>

      <div className="text-center text-xs text-slate-500 pt-1">
        Already have an account?{' '}
        <Link to="/auth/login" className="font-bold text-teal-700 hover:underline">
          Sign In
        </Link>
      </div>
    </PageTransition>
  );
}
