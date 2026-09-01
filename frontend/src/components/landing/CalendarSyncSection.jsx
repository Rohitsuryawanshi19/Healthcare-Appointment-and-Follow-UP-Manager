import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, Clock, Bell, RefreshCw, Smartphone, ShieldCheck } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export function CalendarSyncSection() {
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Text Description */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              <Calendar className="w-3.5 h-3.5" /> Two-Way Calendar Integration
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Synchronized with your everyday Google Calendar.
            </h2>
            <p className="text-base text-slate-600 leading-relaxed font-normal">
              Never miss a clinical consultation. Every confirmed appointment automatically generates formatted calendar events with meeting links, doctor location, and reminder notifications for both parties.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  ✓
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">OAuth 2.0 Secure Authorization</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Connect your Google account once; revoke access anytime from privacy settings.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  ✓
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Automated Event Lifecycle</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Rescheduled or cancelled appointments automatically update in Google Calendar without manual cleanup.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  ✓
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">24-Hour & 1-Hour Reminders</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Receive native calendar notifications directly on your mobile device, tablet, and smartwatch.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Visual Calendar Graphic Card */}
          <div className="lg:col-span-6">
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                    G
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Google Calendar Event</h3>
                    <p className="text-[11px] text-slate-400">Status: Synced via CareFlow OAuth</p>
                  </div>
                </div>
                <Badge variant="success" size="sm" dot>
                  Active Sync
                </Badge>
              </div>

              {/* Event Card Mock */}
              <div className="rounded-2xl border-l-4 border-l-teal-600 bg-teal-50/40 p-4 border border-slate-200/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-900">
                    Clinical Consultation • Dr. Rahul Sharma
                  </span>
                  <span className="text-[11px] font-mono text-teal-700 bg-teal-100/80 px-2 py-0.5 rounded-md font-semibold">
                    10:30 AM - 11:00 AM
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Cardiology Consultation at Metro Health Clinic • Room 304
                </p>
                <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-400" /> 30 min duration
                  </span>
                  <span className="flex items-center gap-1">
                    <Bell className="h-3 w-3 text-slate-400" /> Reminder: 15m before
                  </span>
                </div>
              </div>

              {/* Synchronized timeline preview */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Upcoming Agenda Preview
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
                    <span className="font-semibold">09:00 AM - Staff Clinical Briefing</span>
                    <span className="text-slate-400">Daily Standup</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-teal-50 border border-teal-200/80 text-teal-900 font-semibold">
                    <span>10:30 AM - Patient Rohit Suryawanshi (CareFlow)</span>
                    <Badge variant="primary" size="sm">Confirmed</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
                    <span className="font-semibold">02:00 PM - Diagnostic Review Meeting</span>
                    <span className="text-slate-400">Conference Room B</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
