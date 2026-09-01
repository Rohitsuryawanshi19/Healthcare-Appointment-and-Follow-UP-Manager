import React from 'react';
import { FileQuestion } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export function EmptyState({
  icon: Icon = FileQuestion,
  title = 'No records found',
  description = 'There are currently no items to display here.',
  actionLabel,
  onAction,
  className,
  children,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-slate-300/90 bg-slate-50/50',
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 mb-4 ring-8 ring-teal-50/50">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500 max-w-sm leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" className="mt-5">
          {actionLabel}
        </Button>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
