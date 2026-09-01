import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { AlertCircle } from 'lucide-react';

export const Input = forwardRef(function Input(
  {
    className,
    type = 'text',
    error,
    helperText,
    leftIcon,
    rightIcon,
    disabled = false,
    ...props
  },
  ref
) {
  const hasError = Boolean(error);

  return (
    <div className="w-full space-y-1.5">
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          ref={ref}
          disabled={disabled}
          className={cn(
            'flex h-10 w-full rounded-xl border bg-white px-3.5 py-2 text-sm text-slate-900 shadow-xs transition-all duration-150',
            'placeholder:text-slate-400 focus-visible:outline-none',
            leftIcon && 'pl-10',
            (rightIcon || hasError) && 'pr-10',
            hasError
              ? 'border-rose-400 focus-visible:border-rose-500 focus-visible:ring-3 focus-visible:ring-rose-500/15'
              : 'border-slate-300 hover:border-slate-400 focus-visible:border-teal-600 focus-visible:ring-3 focus-visible:ring-teal-600/15',
            disabled && 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200',
            className
          )}
          {...props}
        />
        {hasError ? (
          <div className="absolute right-3.5 flex items-center pointer-events-none text-rose-500">
            <AlertCircle className="h-4 w-4" />
          </div>
        ) : rightIcon ? (
          <div className="absolute right-3.5 flex items-center text-slate-400">
            {rightIcon}
          </div>
        ) : null}
      </div>
      {hasError ? (
        <p className="text-xs font-medium text-rose-600 animate-in fade-in-50 duration-150">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
});
