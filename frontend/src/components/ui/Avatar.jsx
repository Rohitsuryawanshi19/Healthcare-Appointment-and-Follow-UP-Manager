import React, { forwardRef } from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '../../lib/utils';

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg font-semibold',
};

const statusSizeClasses = {
  sm: 'h-2 w-2 ring-1.5',
  md: 'h-2.5 w-2.5 ring-2',
  lg: 'h-3 w-3 ring-2',
  xl: 'h-3.5 w-3.5 ring-2',
};

export const Avatar = forwardRef(function Avatar(
  { className, size = 'md', status, children, ...props },
  ref
) {
  return (
    <div className="relative inline-block">
      <AvatarPrimitive.Root
        ref={ref}
        className={cn(
          'relative flex shrink-0 overflow-hidden rounded-full bg-slate-100 font-medium text-slate-700 select-none ring-1 ring-slate-200/80',
          sizeClasses[size] || sizeClasses.md,
          className
        )}
        {...props}
      >
        {children}
      </AvatarPrimitive.Root>
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full ring-white',
            status === 'online' && 'bg-emerald-500',
            status === 'busy' && 'bg-amber-500',
            status === 'offline' && 'bg-slate-400',
            statusSizeClasses[size] || statusSizeClasses.md
          )}
        />
      )}
    </div>
  );
});

export const AvatarImage = forwardRef(function AvatarImage({ className, ...props }, ref) {
  return (
    <AvatarPrimitive.Image
      ref={ref}
      className={cn('aspect-square h-full w-full object-cover', className)}
      {...props}
    />
  );
});

export const AvatarFallback = forwardRef(function AvatarFallback({ className, ...props }, ref) {
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-teal-50 text-teal-800 font-semibold',
        className
      )}
      {...props}
    />
  );
});
