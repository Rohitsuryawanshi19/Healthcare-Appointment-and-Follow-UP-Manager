import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export const Card = forwardRef(function Card(
  { className, hoverable = false, children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl border border-slate-200/80 bg-white text-slate-900 shadow-xs transition-all duration-200',
        hoverable && 'hover:shadow-md hover:border-slate-300/80 hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

export const CardHeader = forwardRef(function CardHeader(
  { className, children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6 pb-4', className)}
      {...props}
    >
      {children}
    </div>
  );
});

export const CardTitle = forwardRef(function CardTitle(
  { className, as: Comp = 'h3', children, ...props },
  ref
) {
  return (
    <Comp
      ref={ref}
      className={cn('text-lg font-semibold tracking-tight text-slate-900', className)}
      {...props}
    >
      {children}
    </Comp>
  );
});

export const CardDescription = forwardRef(function CardDescription(
  { className, children, ...props },
  ref
) {
  return (
    <p
      ref={ref}
      className={cn('text-sm text-slate-500 leading-relaxed', className)}
      {...props}
    >
      {children}
    </p>
  );
});

export const CardContent = forwardRef(function CardContent(
  { className, children, ...props },
  ref
) {
  return (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props}>
      {children}
    </div>
  );
});

export const CardFooter = forwardRef(function CardFooter(
  { className, children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0 border-t border-slate-100 mt-4', className)}
      {...props}
    >
      {children}
    </div>
  );
});
