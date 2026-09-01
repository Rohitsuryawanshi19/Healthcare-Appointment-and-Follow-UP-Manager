import React from 'react';
import { cn } from '../lib/utils';

export function PageHeader({
  title,
  description,
  badge,
  breadcrumbs,
  actions,
  className,
}) {
  return (
    <div className={cn('flex flex-col gap-3 pb-6 border-b border-slate-200/80 mb-6', className)}>
      {breadcrumbs && (
        <nav className="flex items-center text-xs text-slate-500 gap-1.5 font-medium">
          {breadcrumbs}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>
          {description && (
            <p className="text-sm text-slate-500 leading-relaxed max-w-3xl">
              {description}
            </p>
          )}
        </div>

        {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
