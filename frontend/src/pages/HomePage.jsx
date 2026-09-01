import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  ShieldCheck,
  CalendarCheck,
  ArrowRight,
  Sparkles,
  Layers,
  HeartPulse,
  Clock
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PageHeader } from '../layouts/PageHeader';
import { PageTransition } from '../components/ui/PageTransition';

export default function HomePage() {
  return (
    <PageTransition className="space-y-10">
      <PageHeader
        title="Clinical Management Dashboard"
        description="CareFlow provides unified scheduling, clinical triage, and intelligent appointment workflows."
        badge={<Badge variant="primary" dot>Operational</Badge>}
        actions={
          <div className="flex gap-3">
            <Link to="/design-system">
              <Button variant="primary" leftIcon={<Layers className="h-4 w-4" />}>
                Explore Design System
              </Button>
            </Link>
          </div>
        }
      />

      {/* Hero Showcase Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-800 via-teal-900 to-slate-950 p-8 sm:p-12 text-white shadow-xl">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-teal-400/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-teal-300 text-xs font-semibold backdrop-blur-xs border border-white/10">
            <Sparkles className="h-3.5 w-3.5" /> CareFlow Healthcare SaaS v1.0
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Restrained, modern, and accessible design system for clinical workflows.
          </h2>
          <p className="text-sm sm:text-base text-teal-100/80 leading-relaxed">
            Built from scratch with Tailwind CSS, Radix UI primitives, and subtle Framer Motion micro-interactions.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link to="/design-system">
              <Button variant="subtle" size="md" rightIcon={<ArrowRight className="h-4 w-4" />}>
                View All Components & Tokens
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Component Preview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card hoverable>
          <CardHeader>
            <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-2">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <CardTitle>Atomic Radix Primitives</CardTitle>
            <CardDescription>
              Dialogs, dropdowns, selects, tabs, and tooltips with full keyboard navigation and ARIA tags.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="primary">Radix Select</Badge>
              <Badge variant="secondary">Radix Dialog</Badge>
              <Badge variant="info">Radix Dropdown</Badge>
            </div>
          </CardContent>
        </Card>

        <Card hoverable>
          <CardHeader>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <CardTitle>Medical Domain Badges</CardTitle>
            <CardDescription>
              Domain-specific clinical status indicators with animated presence dots for real-time triaging.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="confirmed" />
              <StatusBadge status="urgent" />
              <StatusBadge status="pending" />
            </div>
          </CardContent>
        </Card>

        <Card hoverable>
          <CardHeader>
            <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-2">
              <Activity className="h-5 w-5" />
            </div>
            <CardTitle>Accessible Forms & Toasts</CardTitle>
            <CardDescription>
              Error states, custom focus rings, helper messages, and Framer Motion animated toasts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="success" dot>Toast System</Badge>
              <Badge variant="warning" dot>Form Validation</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
