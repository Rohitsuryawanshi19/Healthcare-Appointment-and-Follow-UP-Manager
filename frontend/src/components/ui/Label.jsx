import React, { forwardRef } from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '../../lib/utils';

export const Label = forwardRef(function Label(
  { className, required = false, children, ...props },
  ref
) {
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(
        'text-sm font-medium text-slate-700 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 select-none inline-flex items-center gap-1',
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-rose-500 font-bold">*</span>}
    </LabelPrimitive.Root>
  );
});
