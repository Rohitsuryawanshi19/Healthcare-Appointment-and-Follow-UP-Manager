import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { GoogleLogin } from '@react-oauth/google';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { useToast } from '../../components/ui/Toast';
import { PageTransition } from '../../components/ui/PageTransition';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function LoginPage() {
  const { login, googleLogin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const redirectByRole = (user) => {
    if (user?.role === 'doctor') {
      navigate('/doctor/dashboard', { replace: true });
    } else if (user?.role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    } else {
      navigate(from === '/' ? '/dashboard' : from, { replace: true });
    }
  };

  const onSubmit = async (values) => {
    setServerError('');
    setIsSubmitting(true);
    try {
      const res = await login(values);
      toast({
        title: 'Welcome Back',
        description: `Signed in as ${res?.data?.user?.name}`,
        variant: 'success',
      });
      redirectByRole(res?.data?.user);
    } catch (err) {
      setServerError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      toast({
        title: 'Google Sign-In Failed',
        description: 'No credential token received from Google.',
        variant: 'error',
      });
      return;
    }

    setServerError('');
    setIsSubmitting(true);
    try {
      const res = await googleLogin(credentialResponse.credential);
      toast({
        title: 'Welcome to CareFlow',
        description: `Signed in as ${res?.data?.user?.name}`,
        variant: 'success',
      });
      redirectByRole(res?.data?.user);
    } catch (err) {
      setServerError(err.message || 'Google authentication failed. Please try again.');
      toast({
        title: 'Google Sign-In Error',
        description: err.message || 'Authentication failed',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    toast({
      title: 'Google Sign-In Failed',
      description: 'Could not connect with Google Identity Services.',
      variant: 'error',
    });
  };

  return (
    <PageTransition className="space-y-6">
      <div className="space-y-1 text-left">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Sign in to CareFlow
        </h1>
        <p className="text-sm text-slate-500">
          Access your clinical dashboard, scheduled visits, and health records.
        </p>
      </div>

      {serverError && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium animate-in fade-in-50">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Google Sign-In Button */}
      <div className="flex justify-center w-full">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          theme="outline"
          size="large"
          text="signin_with"
          shape="rectangular"
          width="100%"
        />
      </div>

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider">
            Or continue with email
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
        <div className="space-y-1.5">
          <Label htmlFor="email" required>
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="name@careflow.health"
            leftIcon={<Mail className="h-4 w-4" />}
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" required>
              Password
            </Label>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••••••"
            leftIcon={<Lock className="h-4 w-4" />}
            error={errors.password?.message}
            {...register('password')}
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full justify-center shadow-md shadow-teal-600/20 mt-2"
          isLoading={isSubmitting}
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          Sign In
        </Button>
      </form>

      {/* Quick Demo Fill Options */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
          Quick Demo Credentials
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setValue('email', 'patient.a@demo.com');
              setValue('password', 'DemoPassword123!');
            }}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:border-teal-400 hover:text-teal-700 transition-colors cursor-pointer"
          >
            Patient Demo
          </button>
          <button
            type="button"
            onClick={() => {
              setValue('email', 'doctor@demo.com');
              setValue('password', 'DemoPassword123!');
            }}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:border-teal-400 hover:text-teal-700 transition-colors cursor-pointer"
          >
            Doctor Demo
          </button>
          <button
            type="button"
            onClick={() => {
              setValue('email', 'admin@demo.com');
              setValue('password', 'DemoPassword123!');
            }}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:border-teal-400 hover:text-teal-700 transition-colors cursor-pointer"
          >
            Admin Demo
          </button>
        </div>
      </div>

      <div className="text-center text-xs text-slate-500 pt-2">
        Don't have an account yet?{' '}
        <Link to="/auth/register" className="font-bold text-teal-700 hover:underline">
          Create Patient Account
        </Link>
      </div>
    </PageTransition>
  );
}
