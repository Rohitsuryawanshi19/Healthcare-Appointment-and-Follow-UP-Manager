import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Shield, ArrowRight, Sparkles, Stethoscope } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-600 text-white font-bold text-lg shadow-sm shadow-teal-600/30 group-hover:bg-teal-700 transition-colors">
            C
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl tracking-tight text-slate-900 leading-none">
              Care<span className="text-teal-600">Flow</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none mt-1">
              Healthcare SaaS
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#how-it-works" className="hover:text-teal-700 transition-colors">
            How it Works
          </a>
          <a href="#features" className="hover:text-teal-700 transition-colors">
            Features
          </a>
          <a href="#ai-assistant" className="hover:text-teal-700 transition-colors flex items-center gap-1.5">
            AI Clinical Assistant
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
          </a>
          <a href="#benefits" className="hover:text-teal-700 transition-colors">
            Benefits
          </a>
          <Link to="/design-system" className="hover:text-teal-700 transition-colors">
            Design System
          </Link>
        </nav>

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/auth/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <a href="#search-doctors">
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
              Find a Doctor
            </Button>
          </a>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-ring"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-4 shadow-xl">
          <nav className="flex flex-col space-y-3 pt-2 text-sm font-medium text-slate-700">
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              How it Works
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              Features
            </a>
            <a
              href="#ai-assistant"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between"
            >
              AI Clinical Assistant
              <Badge variant="primary" size="sm">
                Smart
              </Badge>
            </a>
            <a
              href="#benefits"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              Benefits
            </a>
            <Link
              to="/design-system"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              Design System Showcase
            </Link>
          </nav>
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
            <Link to="/auth/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full justify-center">
                Sign In
              </Button>
            </Link>
            <a href="#search-doctors" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" className="w-full justify-center">
                Find a Doctor
              </Button>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
