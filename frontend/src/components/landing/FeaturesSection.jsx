import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Sparkles,
  CalendarCheck,
  Bell,
  Clock,
  Users,
  Activity,
  Lock,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';

const features = [
  {
    icon: Lock,
    title: 'Atomic Slot Hold Protection',
    description: '10-minute temporary mutex reservation prevents double-booking race conditions during high concurrent traffic.',
    tag: 'Concurrency Safe',
  },
  {
    icon: Sparkles,
    title: 'AI Pre-Visit Triage',
    description: 'Analyzes patient symptoms before the visit to extract chief complaints, triage urgency level, and prepare doctor questions.',
    tag: 'Clinical AI',
  },
  {
    icon: Activity,
    title: 'Post-Visit Schedule Generator',
    description: 'Transforms dense medical notes into plain patient-friendly summaries and actionable daily medication regimens.',
    tag: 'Automated Notes',
  },
  {
    icon: CalendarCheck,
    title: 'Google Calendar Two-Way Sync',
    description: 'Automated OAuth 2.0 calendar event creation, updates, and cancellations synced directly into doctor and patient calendars.',
    tag: 'OAuth 2.0',
  },
  {
    icon: Clock,
    title: 'Doctor Leave Auto-Handling',
    description: 'Intelligent conflict scanner detects overlapping bookings when a physician marks leave, automatically alerting affected patients.',
    tag: 'Leave Protection',
  },
  {
    icon: Users,
    title: 'Multi-Role Dedicated Portals',
    description: 'Tailored interfaces and granular permissions for Patients, Practicing Doctors, and Healthcare Administrators.',
    tag: 'RBAC Security',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-white border-y border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            <span>Engineering & Clinical Excellence</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Built for enterprise reliability and clinical precision.
          </h2>
          <p className="text-base text-slate-600">
            Everything medical practices and patients require to eliminate administrative friction and prevent scheduling conflicts.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
              >
                <Card hoverable className="h-full flex flex-col justify-between p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 font-bold">
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="secondary" size="sm">
                        {feat.tag}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg text-slate-900">{feat.title}</CardTitle>
                    <CardDescription className="text-sm text-slate-600 leading-relaxed">
                      {feat.description}
                    </CardDescription>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
