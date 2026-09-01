import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ShieldCheck, HeartPulse, Sparkles, Clock, CheckCircle2 } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900">
      {/* Left Feature/Brand Panel (Desktop) */}
      <div className="hidden md:flex md:w-1/2 lg:w-5/12 bg-gradient-to-br from-teal-800 via-teal-900 to-slate-950 p-10 lg:p-14 text-white flex-col justify-between relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-teal-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />

        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-500 text-white font-bold text-lg shadow-md shadow-teal-500/30">
              C
            </div>
            <span className="font-bold text-2xl tracking-tight text-white">
              Care<span className="text-teal-400">Flow</span>
            </span>
          </Link>
        </div>

        <div className="relative z-10 space-y-8 my-auto py-12">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-teal-300 text-xs font-semibold backdrop-blur-xs border border-white/10">
              <Sparkles className="h-3.5 w-3.5" /> Clinical Intelligence Suite
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Next-generation healthcare appointments & clinical coordination.
            </h2>
            <p className="text-sm text-teal-100/80 leading-relaxed max-w-md">
              Designed for modern hospitals, medical practices, and teleconsultation clinics.
            </p>
          </div>

          <div className="space-y-3.5 pt-4">
            <div className="flex items-center gap-3 text-sm text-slate-200">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500/20 text-teal-400 shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span>Automated pre-visit assessments & urgency triage</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-200">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500/20 text-teal-400 shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span>Zero double-booking guarantee with atomic slot holds</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-200">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500/20 text-teal-400 shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span>Patient-friendly medication schedules and Google Calendar sync</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-teal-200/70 border-t border-white/10 pt-6">
          <span>HIPAA & GDPR Ready</span>
          <span>99.9% Uptime SLA</span>
        </div>
      </div>

      {/* Right Content / Form Container */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-16">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="md:hidden flex items-center gap-2 mb-8">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white font-bold text-base">
              C
            </div>
            <span className="font-bold text-xl text-slate-900">CareFlow</span>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  );
}
