import React from 'react';
import { Loader2, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';

export function LoadingState({
  label = 'Loading clinical data...',
  variant = 'spinner',
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-white/60',
        className
      )}
    >
      {variant === 'pulse' ? (
        <div className="relative flex h-12 w-12 items-center justify-center mb-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-20" />
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-md shadow-teal-600/30">
            <Activity className="h-5 w-5 animate-pulse" />
          </div>
        </div>
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 mb-3">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}
      <p className="text-sm font-medium text-slate-600">{label}</p>
    </div>
  );
}
