import React, { useState } from 'react';
import { PageHeader } from '../layouts/PageHeader';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from '../components/ui/Select';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/Dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '../components/ui/Dropdown';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { SimpleTooltip } from '../components/ui/Tooltip';
import { useToast } from '../components/ui/Toast';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/Avatar';
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { PageTransition } from '../components/ui/PageTransition';

import {
  Calendar,
  Search,
  Mail,
  Lock,
  Plus,
  Trash2,
  FileText,
  User,
  MoreVertical,
  Activity,
  Heart,
  ShieldCheck,
  Stethoscope,
  Sparkles,
} from 'lucide-react';

export default function DesignSystemShowcase() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('components');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedRole, setSelectedRole] = useState('doctor');

  return (
    <PageTransition className="space-y-10">
      <PageHeader
        title="Design System & Component Library"
        description="Core design tokens, atomic UI primitives, and layout systems engineered for the CareFlow healthcare platform."
        badge={<Badge variant="primary">v1.0.0 Architecture</Badge>}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast({
                  title: 'Design System Verified',
                  description: 'All Radix UI primitives & Framer Motion transitions operational.',
                  variant: 'success',
                })
              }
            >
              Trigger Success Toast
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setIsDialogOpen(true)}
            >
              Open Dialog Modal
            </Button>
          </div>
        }
      />

      {/* Tabs for Sectioning */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList variant="pills">
          <TabsTrigger value="components" variant="pills">
            Atomic Primitives
          </TabsTrigger>
          <TabsTrigger value="feedback" variant="pills">
            States & Feedback
          </TabsTrigger>
          <TabsTrigger value="tokens" variant="pills">
            Design Tokens & Palette
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Atomic Primitives */}
        <TabsContent value="components" className="space-y-8">
          {/* Section: Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Buttons & Actions</CardTitle>
              <CardDescription>
                Accessible buttons supporting variants, sizes, icon slots, and active loading states.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-3 items-center">
                <Button variant="primary">Primary Action</Button>
                <Button variant="secondary">Secondary Action</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="subtle">Subtle Teal</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link Style</Button>
              </div>

              <div className="flex flex-wrap gap-3 items-center pt-2">
                <Button size="sm" variant="primary" leftIcon={<Plus className="h-3.5 w-3.5" />}>
                  Small With Icon
                </Button>
                <Button size="md" variant="primary" leftIcon={<Calendar className="h-4 w-4" />}>
                  Medium Default
                </Button>
                <Button size="lg" variant="primary" rightIcon={<Sparkles className="h-4 w-4" />}>
                  Large Call To Action
                </Button>
                <Button size="icon" variant="outline" aria-label="Search">
                  <Search className="h-4 w-4" />
                </Button>
                <Button variant="primary" isLoading>
                  Processing
                </Button>
                <Button variant="outline" disabled>
                  Disabled
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Section: Form Controls & Inputs */}
          <Card>
            <CardHeader>
              <CardTitle>Form Controls & Inputs</CardTitle>
              <CardDescription>
                Inputs, labels, select menus, and field validation feedback.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="demo-name" required>
                    Patient Full Name
                  </Label>
                  <Input
                    id="demo-name"
                    placeholder="e.g. Johnathan Doe"
                    leftIcon={<User className="h-4 w-4" />}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="demo-email">Contact Email</Label>
                  <Input
                    id="demo-email"
                    type="email"
                    placeholder="patient@careflow.health"
                    leftIcon={<Mail className="h-4 w-4" />}
                    helperText="We send appointment reminders to this address."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="demo-error">Field With Validation Error</Label>
                  <Input
                    id="demo-error"
                    defaultValue="invalid-medical-id"
                    error="Medical Registration ID must be 8 alphanumeric digits."
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="demo-role" required>
                    Clinical Role (Radix Select)
                  </Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger id="demo-role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Practitioners</SelectLabel>
                        <SelectItem value="doctor">Medical Doctor (MD)</SelectItem>
                        <SelectItem value="surgeon">General Surgeon</SelectItem>
                        <SelectItem value="cardiologist">Cardiologist</SelectItem>
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Staff & Admin</SelectLabel>
                        <SelectItem value="nurse">Clinical Nurse</SelectItem>
                        <SelectItem value="admin">System Administrator</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Interactive Tooltip (Radix Tooltip)</Label>
                  <div className="pt-2">
                    <SimpleTooltip content="Automated conflict detection prevents double booking of doctor slots.">
                      <Button variant="outline" size="sm" leftIcon={<ShieldCheck className="h-4 w-4 text-teal-600" />}>
                        Hover for Tooltip
                      </Button>
                    </SimpleTooltip>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Interactive Dropdown Menu (Radix Dropdown)</Label>
                  <div className="pt-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" rightIcon={<MoreVertical className="h-4 w-4" />}>
                          Options Menu
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        <DropdownMenuLabel>Clinical Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <FileText className="h-4 w-4 text-slate-500" /> View Medical History
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Calendar className="h-4 w-4 text-slate-500" /> Reschedule Visit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem destructive>
                          <Trash2 className="h-4 w-4" /> Cancel Appointment
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section: Badges & Statuses */}
          <Card>
            <CardHeader>
              <CardTitle>Badges & Status Badges</CardTitle>
              <CardDescription>
                Color-coded indicators designed for triage urgency and appointment statuses.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Healthcare Status Badges (Domain Specific)
                </span>
                <div className="flex flex-wrap gap-2.5 items-center">
                  <StatusBadge status="confirmed" />
                  <StatusBadge status="scheduled" />
                  <StatusBadge status="pending" />
                  <StatusBadge status="in_progress" />
                  <StatusBadge status="completed" />
                  <StatusBadge status="cancelled" />
                  <StatusBadge status="urgent" />
                  <StatusBadge status="on_leave" />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Generic Semantic Badges
                </span>
                <div className="flex flex-wrap gap-2.5 items-center">
                  <Badge variant="primary">Primary Teal</Badge>
                  <Badge variant="secondary">Secondary Slate</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="success" dot>Success Active</Badge>
                  <Badge variant="warning" dot>Warning Review</Badge>
                  <Badge variant="error" dot>Critical Error</Badge>
                  <Badge variant="info">Information</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section: Avatars */}
          <Card>
            <CardHeader>
              <CardTitle>User & Practitioner Avatars</CardTitle>
              <CardDescription>
                Radix Avatars with automatic fallback initials and live online presence indicators.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-6 items-center">
              <div className="flex items-center gap-3">
                <Avatar size="xl" status="online">
                  <AvatarFallback>DR</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Dr. Rahul Sharma</p>
                  <p className="text-xs text-slate-500">Chief of Cardiology (Online)</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Avatar size="lg" status="busy">
                  <AvatarFallback>AP</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Dr. Anita Patel</p>
                  <p className="text-xs text-slate-500">In Consultation (Busy)</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Avatar size="md" status="offline">
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Johnathan Doe</p>
                  <p className="text-xs text-slate-500">Patient (Offline)</p>
                </div>
              </div>

              <Avatar size="sm">
                <AvatarFallback>SP</AvatarFallback>
              </Avatar>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: States & Feedback */}
        <TabsContent value="feedback" className="space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Empty State Pattern</CardTitle>
                <CardDescription>Standardized empty feedback placeholder.</CardDescription>
              </CardHeader>
              <CardContent>
                <EmptyState
                  icon={Calendar}
                  title="No Scheduled Consultations"
                  description="There are no patient appointments scheduled for this practitioner today."
                  actionLabel="Schedule Appointment"
                  onAction={() =>
                    toast({
                      title: 'Action Triggered',
                      description: 'Opened booking workflow modal.',
                      variant: 'info',
                    })
                  }
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error State Pattern</CardTitle>
                <CardDescription>Resilient error feedback with retry handler.</CardDescription>
              </CardHeader>
              <CardContent>
                <ErrorState
                  title="Failed to Load Electronic Health Record"
                  description="Database query timed out while fetching lab results."
                  onRetry={() =>
                    toast({
                      title: 'Retrying Connection',
                      description: 'Querying medical records cluster...',
                      variant: 'warning',
                    })
                  }
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Loading States</CardTitle>
                <CardDescription>Custom medical pulse & spinner variations.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <LoadingState variant="pulse" label="Analyzing Triage Data..." />
                <LoadingState variant="spinner" label="Syncing Calendar..." />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Skeleton Placeholders</CardTitle>
                <CardDescription>Content loading skeletons preventing layout shift.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <SkeletonCard />
              </CardContent>
            </Card>
          </div>

          {/* Toast Notification Triggers */}
          <Card>
            <CardHeader>
              <CardTitle>Interactive Toast Notifications</CardTitle>
              <CardDescription>Accessible non-blocking alerts with Framer Motion animations.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toast({
                    title: 'Appointment Confirmed',
                    description: 'Email receipt and calendar invite sent to patient.',
                    variant: 'success',
                  })
                }
              >
                Success Toast
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toast({
                    title: 'Slot Conflict Detected',
                    description: 'Doctor is on scheduled leave during this time.',
                    variant: 'warning',
                  })
                }
              >
                Warning Toast
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toast({
                    title: 'Authentication Failed',
                    description: 'Session expired. Please sign in again.',
                    variant: 'error',
                  })
                }
              >
                Error Toast
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toast({
                    title: 'AI Symptom Analysis Generated',
                    description: 'Pre-visit chief complaint triage ready for review.',
                    variant: 'info',
                  })
                }
              >
                Info Toast
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Design Tokens & Palette */}
        <TabsContent value="tokens" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Healthcare Color System</CardTitle>
              <CardDescription>
                Restrained medical color palette ensuring WCAG AA contrast compliance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Primary Teal Palette */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-800">Primary Clinical Teal</h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2">
                  {[
                    { label: '50', bg: 'bg-teal-50', text: 'text-teal-900', hex: '#f0fdfa' },
                    { label: '100', bg: 'bg-teal-100', text: 'text-teal-900', hex: '#ccfbf1' },
                    { label: '200', bg: 'bg-teal-200', text: 'text-teal-900', hex: '#99f6e4' },
                    { label: '300', bg: 'bg-teal-300', text: 'text-teal-900', hex: '#5eead4' },
                    { label: '400', bg: 'bg-teal-400', text: 'text-teal-900', hex: '#2dd4bf' },
                    { label: '500', bg: 'bg-teal-500', text: 'text-white', hex: '#14b8a6' },
                    { label: '600', bg: 'bg-teal-600', text: 'text-white', hex: '#0d9488' },
                    { label: '700', bg: 'bg-teal-700', text: 'text-white', hex: '#0f766e' },
                    { label: '800', bg: 'bg-teal-800', text: 'text-white', hex: '#115e59' },
                    { label: '900', bg: 'bg-teal-900', text: 'text-white', hex: '#134e4a' },
                  ].map((c) => (
                    <div key={c.label} className="flex flex-col rounded-xl overflow-hidden border border-slate-200/60 shadow-2xs">
                      <div className={`h-12 ${c.bg} flex items-center justify-center font-bold text-xs ${c.text}`}>
                        {c.label}
                      </div>
                      <div className="p-1.5 bg-white text-center">
                        <span className="text-[10px] font-mono text-slate-500">{c.hex}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Semantic Feedback Colors */}
              <div className="space-y-2 pt-4">
                <h4 className="text-sm font-semibold text-slate-800">Semantic Medical Feedback</h4>
                <div className="grid sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                    <p className="font-semibold text-xs">Success / Verified</p>
                    <p className="text-[11px] text-emerald-700 mt-1">#16a34a • Appointments confirmed & records saved</p>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                    <p className="font-semibold text-xs">Warning / Triage</p>
                    <p className="text-[11px] text-amber-700 mt-1">#d97706 • Pending reviews, leave conflicts & holds</p>
                  </div>
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
                    <p className="font-semibold text-xs">Error / Critical</p>
                    <p className="text-[11px] text-rose-700 mt-1">#dc2626 • Cancellations & urgent clinical triage</p>
                  </div>
                  <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-sky-900">
                    <p className="font-semibold text-xs">Information / Sync</p>
                    <p className="text-[11px] text-sky-700 mt-1">#0284c7 • Teleconsultation & calendar status</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Interactive Modal Dialog (Radix Dialog) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Clinical Appointment</DialogTitle>
            <DialogDescription>
              Demonstration of modal dialog with accessible focus management and smooth transitions.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="patient-select" required>
                Select Patient
              </Label>
              <Input id="patient-select" placeholder="Search patient name..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date-input" required>
                Preferred Date
              </Label>
              <Input id="date-input" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setIsDialogOpen(false);
                toast({
                  title: 'Dialog Action Complete',
                  description: 'Modal closed with confirmed payload.',
                  variant: 'success',
                });
              }}
            >
              Confirm Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
