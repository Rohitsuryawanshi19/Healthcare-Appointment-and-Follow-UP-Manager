import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Award, UserCheck, FileCheck, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';

const trustPillars = [
  {
    icon: ShieldCheck,
    title: 'HIPAA & Privacy Compliant',
    description: 'Strict adherence to global healthcare data protection benchmarks with audited role-based security policies.',
  },
  {
    icon: Lock,
    title: '256-Bit End-to-End Encryption',
    description: 'All patient health records, chief complaints, and clinical notes are encrypted at rest and in transit.',
  },
  {
    icon: UserCheck,
    title: '100% Verified Practitioners',
    description: 'Every medical specialist undergo manual verification of credentials, medical council registration, and clinic affiliation.',
  },
  {
    icon: FileCheck,
    title: 'Audit Logging & Consent Tracking',
    description: 'Complete audit logs of appointment modifications, cancellations, notes submissions, and notification deliveries.',
  },
];

export function TrustSection() {
  return (
    <section className="py-20 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            <ShieldCheck className="w-3.5 h-3.5" /> Enterprise Trust & Compliance
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Security and privacy engineered into every layer.
          </h2>
          <p className="text-base text-slate-600">
            Healthcare data requires the highest level of confidentiality. CareFlow guarantees patient safety, physician privacy, and compliance.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustPillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-6 space-y-3 hover:bg-white hover:shadow-sm hover:border-slate-300 transition-all"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 font-bold">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">{pillar.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {pillar.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
