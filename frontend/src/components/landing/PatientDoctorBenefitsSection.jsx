import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Heart, Stethoscope, Shield, Sparkles, Clock, Calendar, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export function PatientDoctorBenefitsSection() {
  const [activeView, setActiveView] = useState('patients');

  return (
    <section id="benefits" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            <span>Tailored Workflows</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Designed for both patients and healthcare providers.
          </h2>
          <p className="text-base text-slate-600">
            CareFlow unifies the entire consultation lifecycle with dedicated features solving patient anxiety and physician burnout.
          </p>

          {/* Toggle Button */}
          <div className="pt-2 flex justify-center">
            <div className="inline-flex rounded-2xl bg-white p-1.5 border border-slate-200 shadow-2xs">
              <button
                onClick={() => setActiveView('patients')}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  activeView === 'patients'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                For Patients
              </button>
              <button
                onClick={() => setActiveView('doctors')}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  activeView === 'doctors'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                For Doctors & Clinics
              </button>
            </div>
          </div>
        </div>

        {/* Benefits Content */}
        <div className="grid lg:grid-cols-2 gap-8 items-stretch">
          {/* Patient Benefits Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`rounded-3xl border p-8 bg-white shadow-sm flex flex-col justify-between space-y-6 ${
              activeView === 'patients' ? 'ring-2 ring-teal-600 border-teal-300' : 'border-slate-200/80 opacity-90'
            }`}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                  <Heart className="h-6 w-6" />
                </div>
                <Badge variant="primary">Patient Portal</Badge>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-slate-900">Seamless, Stress-Free Care</h3>
                <p className="text-sm text-slate-500 mt-1">Everything you need before and after your consultation.</p>
              </div>

              <div className="space-y-3.5">
                {[
                  'Book appointments in under 60 seconds with verified specialists',
                  '10-minute guaranteed slot hold while submitting symptom details',
                  'Pre-visit AI suggestions on key questions to ask your doctor',
                  'Plain-language post-visit medication schedules (no confusing jargon)',
                  'Automatic calendar invites and email dosage reminders',
                  'Easy self-service cancellations and reschedule requests',
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-slate-700">
                    <div className="h-5 w-5 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <a href="#search-doctors">
              <Button variant="primary" size="md" className="w-full justify-center">
                Find a Doctor Now
              </Button>
            </a>
          </motion.div>

          {/* Doctor Benefits Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className={`rounded-3xl border p-8 bg-white shadow-sm flex flex-col justify-between space-y-6 ${
              activeView === 'doctors' ? 'ring-2 ring-teal-600 border-teal-300' : 'border-slate-200/80 opacity-90'
            }`}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <Badge variant="secondary">Physician Suite</Badge>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-slate-900">Zero Administrative Burnout</h3>
                <p className="text-sm text-slate-500 mt-1">Focus on clinical diagnoses while automation handles the rest.</p>
              </div>

              <div className="space-y-3.5">
                {[
                  'Zero double-booking guarantee backed by database atomic locks',
                  'Pre-visit chief complaints and triage urgency ready before patient enters',
                  'AI Clinical note converter: turn brief doctor notes into full patient summaries',
                  'Flexible leave scheduler that auto-cancels and notifies affected patients',
                  'Two-way Google Calendar synchronization for clinics and personal schedules',
                  'Comprehensive practice metrics: consultation counts, ratings, and revenue',
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-slate-700">
                    <div className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link to="/auth/login">
              <Button variant="outline" size="md" className="w-full justify-center">
                Physician Portal Access
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
