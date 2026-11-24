import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/core/utils/cn';

/**
 * Shared Tooltip berbasis Radix UI.
 * Analogi Flutter: widget `Tooltip(message: '...', child: ...)`.
 */

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({
  className,
  sideOffset = 6,
  ...props
}: ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          'z-50 max-w-xs rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 shadow-xl',
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}
