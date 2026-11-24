import * as ProgressPrimitive from '@radix-ui/react-progress';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/core/utils/cn';

/**
 * Shared Progress Bar berbasis Radix UI.
 * Analogi Flutter: `LinearProgressIndicator(value: percent / 100)`.
 */

export function Progress({
  className,
  indicatorClassName,
  value = 0,
  ...props
}: ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
  indicatorClassName?: string;
}) {
  const safeValue = Math.min(100, Math.max(0, value ?? 0));

  return (
    <ProgressPrimitive.Root
      value={safeValue}
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-slate-800',
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          'h-full rounded-full bg-gradient-to-r from-lime-400 via-emerald-400 to-cyan-400 transition-all duration-300',
          indicatorClassName,
        )}
        style={{ width: `${safeValue}%` }}
      />
    </ProgressPrimitive.Root>
  );
}
