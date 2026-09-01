import React from 'react';
import { motion } from 'framer-motion';
import { Search, Calendar, FileText, BellRing, ArrowRight } from 'lucide-react';

const steps = [
  {
    step: '01',
    icon: Search,
    title: 'Find Specialist & Slot',
    description: 'Filter verified doctors by specialty, rating, and fee. Select your preferred consultation time slot with a guaranteed 10-minute hold lock.',
  },
  {
    step: '02',
    icon: FileText,
    title: 'Share Pre-Visit Symptoms',
    description: 'Provide your symptoms beforehand. CareFlow’s clinical AI generates an urgency triage rating and suggested diagnostic questions for your physician.',
  },
  {
    step: '03',
    icon: Calendar,
    title: 'Attend Consultation',
    description: 'Receive instant confirmation, automated email alerts, and two-way Google Calendar event synchronization for seamless time management.',
  },
  {
    step: '04',
    icon: BellRing,
    title: 'Medication & Reminders',
    description: 'Access patient-friendly summaries of clinical notes, tailored prescription schedules, and proactive dosage reminders.',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            <span>Seamless 4-Step Process</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How CareFlow streamlines your care.
          </h2>
          <p className="text-base text-slate-600">
            From discovering the right physician to managing post-visit medication, every touchpoint is engineered for clarity and reliability.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="relative rounded-2xl border border-slate-200/90 bg-white p-7 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 font-bold">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="font-mono text-2xl font-extrabold text-slate-200">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
