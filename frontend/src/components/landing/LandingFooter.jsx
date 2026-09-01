import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Activity, Heart, ArrowUpRight } from 'lucide-react';

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white pt-16 pb-12 text-slate-600 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Col */}
          <div className="col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white font-bold text-base shadow-sm shadow-teal-600/30">
                C
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900 leading-none">
                Care<span className="text-teal-600">Flow</span>
              </span>
            </Link>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              CareFlow is an enterprise full-stack clinical appointment scheduling and intelligent patient follow-up management platform.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> HIPAA Security Verified
              </span>
            </div>
          </div>

          {/* Col 1: Platform */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#how-it-works" className="hover:text-teal-700">How it Works</a></li>
              <li><a href="#features" className="hover:text-teal-700">Features</a></li>
              <li><a href="#ai-assistant" className="hover:text-teal-700">Clinical AI</a></li>
              <li><a href="#search-doctors" className="hover:text-teal-700">Doctor Directory</a></li>
            </ul>
          </div>

          {/* Col 2: Providers */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Providers</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/auth/login" className="hover:text-teal-700">Doctor Portal</Link></li>
              <li><a href="#benefits" className="hover:text-teal-700">Leave Management</a></li>
              <li><a href="#ai-assistant" className="hover:text-teal-700">AI Note Converter</a></li>
              <li><Link to="/design-system" className="hover:text-teal-700">Component Kit</Link></li>
            </ul>
          </div>

          {/* Col 3: Compliance & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Compliance</h4>
            <ul className="space-y-2 text-xs">
              <li className="text-slate-400">HIPAA Guidelines</li>
              <li className="text-slate-400">GDPR Privacy Terms</li>
              <li className="text-slate-400">Encryption Standards</li>
              <li className="text-slate-400">System Status: 99.9%</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>&copy; {new Date().getFullYear()} CareFlow Health Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-slate-600">
              <Lock className="h-3.5 w-3.5 text-teal-600" /> AES-256 Cloud Encrypted
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
