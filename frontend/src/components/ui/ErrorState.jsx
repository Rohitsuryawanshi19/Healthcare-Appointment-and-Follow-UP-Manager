import React from 'react';
import { AlertOctagon, RotateCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export function ErrorState({
  title = 'Failed to load information',
  description = 'An unexpected error occurred while communicating with the healthcare server.',
  onRetry,
  retryLabel = 'Try Again',
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-rose-200 bg-rose-50/40',
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mb-3 shadow-xs">
        <AlertOctagon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-rose-950">{title}</h3>
      <p className="mt-1 text-sm text-rose-700/80 max-w-sm leading-relaxed">{description}</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="mt-4 border-rose-300 text-rose-800 hover:bg-rose-100/60"
          leftIcon={<RotateCw className="h-3.5 w-3.5" />}
        >
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
