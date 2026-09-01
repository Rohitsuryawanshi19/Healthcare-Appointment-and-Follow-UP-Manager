import React from 'react';
import { motion } from 'framer-motion';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  UserCheck,
  Activity,
  HeartPulse,
  Star,
  Stethoscope
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { StatusBadge } from '../ui/StatusBadge';
import { Avatar, AvatarFallback } from '../ui/Avatar';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 bg-gradient-to-b from-teal-50/40 via-white to-slate-50">
      {/* Subtle Background Glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-teal-400/10 via-emerald-300/10 to-sky-400/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="lg:col-span-7 space-y-6 text-left"
          >
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-semibold shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-teal-600" />
              <span>Next-Generation Clinical Scheduling</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
              Healthcare appointments, <span className="text-teal-600">simplified.</span>
            </h1>

            {/* Supporting Message */}
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl font-normal">
              Find verified doctors, book guaranteed conflict-free slots, share symptoms before visits, receive clear follow-up care plans, and manage automated medication reminders.
            </p>

            {/* Key Value Points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                <span>Instant doctor search & slot holds</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                <span>Pre-visit AI symptom triage</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                <span>Google Calendar two-way sync</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                <span>Automated medication schedules</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3.5">
              <a href="#search-doctors">
                <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-md shadow-teal-600/25" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Find a Doctor
                </Button>
              </a>
              <a href="#how-it-works">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Get Started
                </Button>
              </a>
            </div>

            {/* Social Proof Stats */}
            <div className="pt-6 border-t border-slate-200/80 flex items-center gap-8 text-xs text-slate-500">
              <div>
                <span className="block font-bold text-slate-900 text-lg sm:text-xl">500+</span>
                <span>Verified Specialists</span>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div>
                <span className="block font-bold text-slate-900 text-lg sm:text-xl">100%</span>
                <span>Conflict-Free Slots</span>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div>
                <span className="block font-bold text-slate-900 text-lg sm:text-xl">99.8%</span>
                <span>Patient Satisfaction</span>
              </div>
            </div>
          </motion.div>

          {/* Right Hero Interactive Visual Card Deck (Pure UI Graphic) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-5 relative"
          >
            {/* Main Interactive Doctor Appointment Card */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xl space-y-5 relative z-10">
              {/* Doctor Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <Avatar size="lg" status="online">
                    <AvatarFallback className="bg-teal-600 text-white font-bold text-base">
                      DR
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-base">Dr. Rahul Sharma</h3>
                      <ShieldCheck className="h-4 w-4 text-teal-600" />
                    </div>
                    <p className="text-xs text-slate-500 font-medium">Senior Cardiologist • MBBS, MD</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-current" />
                        ))}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-700">4.9</span>
                      <span className="text-[11px] text-slate-400">(128 reviews)</span>
                    </div>
                  </div>
                </div>
                <StatusBadge status="available" size="sm" />
              </div>

              {/* Appointment Slot Selector Preview */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <CalendarCheck className="h-3.5 w-3.5 text-teal-600" /> Today, 10:30 AM
                  </span>
                  <span className="font-semibold text-teal-700">₹600 Fee</span>
                </div>
                <div className="flex gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-teal-600 text-white font-semibold text-xs shadow-xs">
                    10:30 AM (Held)
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs">
                    11:00 AM
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs">
                    02:30 PM
                  </span>
                </div>
              </div>

              {/* AI Pre-Visit Triage Card */}
              <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200/70 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-teal-900 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-teal-600" /> AI Pre-Visit Assessment
                  </span>
                  <Badge variant="warning" size="sm" dot>
                    Urgency: Medium
                  </Badge>
                </div>
                <p className="text-[11px] text-teal-800/90 leading-snug">
                  "Chief Complaint: Recurrent chest tightness after physical exertion. 3 diagnostic questions prepared for Dr. Sharma."
                </p>
              </div>

              {/* Confirmed Action Button Preview */}
              <div className="pt-1">
                <Button variant="primary" size="md" className="w-full justify-center">
                  Confirmed & Synced to Calendar
                </Button>
              </div>
            </div>

            {/* Floating Medication Reminder Badge Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="absolute -bottom-6 -left-6 sm:-left-8 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-lg flex items-center gap-3 z-20 max-w-xs"
            >
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Activity className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900">Medication Alert</p>
                <p className="text-[11px] text-slate-500 truncate">Atorvastatin 10mg • After Dinner</p>
              </div>
              <Badge variant="success" size="sm">
                Active
              </Badge>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
