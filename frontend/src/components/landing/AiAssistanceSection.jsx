import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Activity, FileText, ArrowRight, CheckCircle2, AlertTriangle, Pill } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { StatusBadge } from '../ui/StatusBadge';

export function AiAssistanceSection() {
  const [activeTab, setActiveTab] = useState('pre-visit');

  return (
    <section id="ai-assistant" className="py-20 bg-white border-y border-slate-200/80 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            <Sparkles className="w-3.5 h-3.5" /> CareFlow Clinical Intelligence
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            AI assistance before, during, and after every visit.
          </h2>
          <p className="text-base text-slate-600">
            Powered by resilient local and cloud language models, CareFlow bridges the communication gap between physician notes and patient understanding.
          </p>

          {/* Toggle Tab Buttons */}
          <div className="pt-4 flex justify-center">
            <div className="inline-flex rounded-2xl bg-slate-100 p-1.5 border border-slate-200 shadow-2xs">
              <button
                onClick={() => setActiveTab('pre-visit')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'pre-visit'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1. Pre-Visit Triage Analysis
              </button>
              <button
                onClick={() => setActiveTab('post-visit')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'post-visit'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2. Post-Visit Patient Summary & Regimen
              </button>
            </div>
          </div>
        </div>

        {/* Live Visual Interactive Comparison Card */}
        {activeTab === 'pre-visit' ? (
          <motion.div
            key="pre-visit"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid lg:grid-cols-12 gap-8 items-center bg-slate-50 p-6 sm:p-10 rounded-3xl border border-slate-200/90"
          >
            {/* Input Box */}
            <div className="lg:col-span-5 space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Input: Raw Patient Symptoms
              </span>
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
                <p className="text-xs text-slate-700 leading-relaxed italic">
                  "I've had a recurring throbbing headache on the right side for 3 days, especially when looking at screens. Mild nausea this morning, sensitive to bright lights."
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span>Submitted 10m before appointment</span>
                </div>
              </div>
            </div>

            {/* Transform Indicator */}
            <div className="lg:col-span-2 flex justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 text-white shadow-md shadow-teal-600/30">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>

            {/* Output Box */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                  AI Output: Structured Clinical Triage
                </span>
                <Badge variant="warning" size="sm" dot>
                  Urgency: Medium
                </Badge>
              </div>

              <div className="p-5 rounded-2xl bg-teal-900 text-white shadow-md space-y-4">
                <div>
                  <span className="text-[11px] font-bold text-teal-300 uppercase tracking-wider">
                    Chief Complaint
                  </span>
                  <p className="text-xs text-slate-100 font-medium mt-0.5">
                    Unilateral pulsating cephalea with photophobia and mild nausea.
                  </p>
                </div>

                <div className="border-t border-teal-800 pt-3">
                  <span className="text-[11px] font-bold text-teal-300 uppercase tracking-wider">
                    3 Suggested Diagnostic Inquiries for Doctor
                  </span>
                  <ul className="text-xs text-slate-200 space-y-1.5 mt-1.5 list-disc pl-4">
                    <li>Evaluate for migraine with aura vs tension cephalea.</li>
                    <li>Check history of visual scotomas or sensory auras.</li>
                    <li>Assess caffeine, hydration, and prolonged screen ergonomics.</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="post-visit"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid lg:grid-cols-12 gap-8 items-center bg-slate-50 p-6 sm:p-10 rounded-3xl border border-slate-200/90"
          >
            {/* Input Doctor Notes */}
            <div className="lg:col-span-5 space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Input: Dense Clinical Notes & Rx
              </span>
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3 font-mono text-xs text-slate-700">
                <p>Dx: Acute Migraine w/o aura.</p>
                <p>Rx: Sumatriptan 50mg PRN at onset. PCM 650mg TDS x 3d. Hydration &gt; 2.5L. Review in 14d if refractory.</p>
              </div>
            </div>

            {/* Transform Indicator */}
            <div className="lg:col-span-2 flex justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 text-white shadow-md shadow-teal-600/30">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>

            {/* Output Patient Summary */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                  Output: Patient-Friendly Care Plan
                </span>
                <Badge variant="success" size="sm">
                  Plain Language
                </Badge>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-teal-200 shadow-md space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Doctor's Summary
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    You were diagnosed with a classic migraine headache. Your doctor provided medication to relieve pain and recommends rest in a quiet, dark room.
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Pill className="h-3.5 w-3.5 text-teal-600" /> Daily Medication Schedule
                  </span>
                  <div className="bg-teal-50/70 p-2.5 rounded-xl text-xs text-teal-950 font-medium space-y-1">
                    <p>• <strong>Sumatriptan (50mg):</strong> Take 1 tablet only when headache starts.</p>
                    <p>• <strong>Paracetamol (650mg):</strong> 1 tablet 3 times daily with meals for 3 days.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
