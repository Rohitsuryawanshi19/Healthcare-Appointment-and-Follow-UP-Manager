import React from 'react';
import { cn } from '../../lib/utils';

const variantClasses = {
  primary: 'bg-teal-50 text-teal-700 border-teal-200/80',
  secondary: 'bg-slate-100 text-slate-700 border-slate-200',
  outline: 'bg-transparent text-slate-600 border-slate-300',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  error: 'bg-rose-50 text-rose-700 border-rose-200',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
  neutral: 'bg-slate-50 text-slate-600 border-slate-200',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs font-medium',
  lg: 'px-3 py-1.5 text-sm font-medium',
};

export function Badge({
  className,
  variant = 'primary',
  size = 'md',
  dot = false,
  dotColor,
  children,
  ...props
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium tracking-tight select-none transition-colors',
        variantClasses[variant] || variantClasses.primary,
        sizeClasses[size] || sizeClasses.md,
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            dotColor ||
              (variant === 'success'
                ? 'bg-emerald-500'
                : variant === 'error'
                ? 'bg-rose-500'
                : variant === 'warning'
                ? 'bg-amber-500'
                : variant === 'info'
                ? 'bg-sky-500'
                : 'bg-teal-500')
          )}
        />
      )}
      {children}
    </span>
  );
}
