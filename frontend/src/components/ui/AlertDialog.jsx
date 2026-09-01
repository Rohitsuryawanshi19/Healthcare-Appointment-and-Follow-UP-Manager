import React, { forwardRef } from 'react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { cn } from '../../lib/utils';

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
export const AlertDialogPortal = AlertDialogPrimitive.Portal;

export const AlertDialogOverlay = forwardRef(function AlertDialogOverlay(
  { className, ...props },
  ref
) {
  return (
    <AlertDialogPrimitive.Overlay
      ref={ref}
      className={cn(
        'fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs',
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className
      )}
      {...props}
    />
  );
});

export const AlertDialogContent = forwardRef(function AlertDialogContent(
  { className, ...props },
  ref
) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        ref={ref}
        className={cn(
          'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl duration-200',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
          className
        )}
        {...props}
      />
    </AlertDialogPortal>
  );
});

export const AlertDialogHeader = function AlertDialogHeader({ className, ...props }) {
  return <div className={cn('flex flex-col space-y-2 text-left', className)} {...props} />;
};

export const AlertDialogFooter = function AlertDialogFooter({ className, ...props }) {
  return (
    <div
      className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 mt-4', className)}
      {...props}
    />
  );
};

export const AlertDialogTitle = forwardRef(function AlertDialogTitle(
  { className, ...props },
  ref
) {
  return (
    <AlertDialogPrimitive.Title
      ref={ref}
      className={cn('text-lg font-bold tracking-tight text-slate-900', className)}
      {...props}
    />
  );
});

export const AlertDialogDescription = forwardRef(function AlertDialogDescription(
  { className, ...props },
  ref
) {
  return (
    <AlertDialogPrimitive.Description
      ref={ref}
      className={cn('text-sm text-slate-500 leading-relaxed', className)}
      {...props}
    />
  );
});

export const AlertDialogAction = forwardRef(function AlertDialogAction(
  { className, variant = 'primary', ...props },
  ref
) {
  return (
    <AlertDialogPrimitive.Action
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors cursor-pointer',
        variant === 'destructive'
          ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-600/20'
          : 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm shadow-teal-600/20',
        className
      )}
      {...props}
    />
  );
});

export const AlertDialogCancel = forwardRef(function AlertDialogCancel(
  { className, ...props },
  ref
) {
  return (
    <AlertDialogPrimitive.Cancel
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer',
        className
      )}
      {...props}
    />
  );
});
