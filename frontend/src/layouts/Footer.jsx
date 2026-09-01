import React from 'react';
import { cn } from '../lib/utils';
import { ShieldCheck, Heart, Lock } from 'lucide-react';

export function Footer({ className }) {
  return (
    <footer className={cn('border-t border-slate-200/80 pt-6 pb-4 text-xs text-slate-500', className)}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">CareFlow Healthcare Platform</span>
          <span>•</span>
          <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
        </div>

        <div className="flex items-center gap-4 text-slate-500">
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/60">
            <Lock className="h-3 w-3 text-teal-600" /> 256-bit Encrypted
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/60">
            <ShieldCheck className="h-3 w-3 text-teal-600" /> HIPAA Security
          </span>
        </div>
      </div>
    </footer>
  );
}
