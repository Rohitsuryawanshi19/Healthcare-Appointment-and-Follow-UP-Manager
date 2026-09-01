import React, { forwardRef } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '../../lib/utils';

export const Tabs = TabsPrimitive.Root;

export const TabsList = forwardRef(function TabsList(
  { className, variant = 'pills', ...props },
  ref
) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center p-1 text-slate-500',
        variant === 'pills' && 'rounded-xl bg-slate-100/90 border border-slate-200/60',
        variant === 'underline' && 'border-b border-slate-200 bg-transparent gap-6 p-0 justify-start w-full',
        className
      )}
      {...props}
    />
  );
});

export const TabsTrigger = forwardRef(function TabsTrigger(
  { className, variant = 'pills', ...props },
  ref
) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all select-none cursor-pointer',
        'focus-visible:outline-2 focus-visible:outline-teal-600 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50',
        variant === 'pills' &&
          'rounded-lg px-3 py-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs hover:text-slate-800',
        variant === 'underline' &&
          'rounded-none border-b-2 border-transparent px-1 pb-3 pt-2 text-slate-500 hover:text-slate-800 data-[state=active]:border-teal-600 data-[state=active]:text-teal-700 font-semibold',
        className
      )}
      {...props}
    />
  );
});

export const TabsContent = forwardRef(function TabsContent(
  { className, ...props },
  ref
) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        'mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600',
        'data-[state=inactive]:hidden animate-in fade-in-50 duration-150',
        className
      )}
      {...props}
    />
  );
});
