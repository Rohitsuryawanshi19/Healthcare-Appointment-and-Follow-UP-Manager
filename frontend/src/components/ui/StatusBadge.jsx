import React from 'react';
import { Badge } from './Badge';

const statusConfig = {
  confirmed: { variant: 'success', label: 'Confirmed', dotColor: 'bg-emerald-500' },
  scheduled: { variant: 'info', label: 'Scheduled', dotColor: 'bg-sky-500' },
  pending: { variant: 'warning', label: 'Pending Review', dotColor: 'bg-amber-500' },
  in_progress: { variant: 'primary', label: 'In Progress', dotColor: 'bg-teal-500 animate-pulse' },
  completed: { variant: 'neutral', label: 'Completed', dotColor: 'bg-slate-500' },
  cancelled: { variant: 'error', label: 'Cancelled', dotColor: 'bg-rose-500' },
  urgent: { variant: 'error', label: 'Urgent Attention', dotColor: 'bg-rose-600 animate-ping' },
  on_leave: { variant: 'warning', label: 'On Leave', dotColor: 'bg-amber-500' },
  available: { variant: 'success', label: 'Available', dotColor: 'bg-emerald-500' },
};

export function StatusBadge({ status, label, className, size = 'md' }) {
  const normalizedKey = String(status || '').toLowerCase().replace(/[\s-]/g, '_');
  const config = statusConfig[normalizedKey] || {
    variant: 'neutral',
    label: label || status || 'Unknown',
    dotColor: 'bg-slate-400',
  };

  return (
    <Badge
      variant={config.variant}
      size={size}
      dot={true}
      dotColor={config.dotColor}
      className={className}
    >
      {label || config.label}
    </Badge>
  );
}
