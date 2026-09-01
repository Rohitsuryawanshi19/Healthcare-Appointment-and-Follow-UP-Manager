import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, ShieldCheck, Heart } from 'lucide-react';
import { Button } from '../ui/Button';

export function CtaSection() {
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-900 via-teal-950 to-slate-950 p-8 sm:p-14 text-white shadow-2xl">
          {/* Ambient Glow Graphic */}
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-teal-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-6 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-teal-300 text-xs font-semibold backdrop-blur-xs border border-white/10">
              <Sparkles className="h-3.5 w-3.5" /> Start Streamlining Your Practice Today
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Ready for a smarter, conflict-free healthcare experience?
            </h2>

            <p className="text-base sm:text-lg text-teal-100/80 leading-relaxed max-w-2xl">
              Join thousands of patients and leading clinical practices using CareFlow to simplify scheduling, pre-visit triage, and post-visit follow-ups.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center sm:justify-start">
              <a href="#search-doctors">
                <Button variant="primary" size="lg" className="w-full sm:w-auto bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold border-none shadow-lg shadow-teal-500/30" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Find a Doctor
                </Button>
              </a>
              <Link to="/auth/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-teal-300/40 text-teal-100 hover:bg-white/10 hover:text-white">
                  Physician / Clinic Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
