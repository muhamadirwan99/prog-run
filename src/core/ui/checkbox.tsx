import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/core/utils/cn';

/**
 * Shared Checkbox aksesibel berbasis Radix UI.
 * Mendukung keyboard navigation (Space/Tab) dan varian warna accent per hari latihan.
 */

type CheckboxAccent = 'lime' | 'cyan' | 'emerald';

const accentClasses: Record<CheckboxAccent, string> = {
  lime: 'data-[state=checked]:border-lime-400 data-[state=checked]:bg-lime-400 data-[state=checked]:text-slate-950 focus-visible:ring-lime-400',
  cyan: 'data-[state=checked]:border-cyan-400 data-[state=checked]:bg-cyan-400 data-[state=checked]:text-slate-950 focus-visible:ring-cyan-400',
  emerald:
    'data-[state=checked]:border-emerald-400 data-[state=checked]:bg-emerald-400 data-[state=checked]:text-slate-950 focus-visible:ring-emerald-400',
};

export function Checkbox({
  className,
  accent = 'lime',
  ...props
}: ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & {
  accent?: CheckboxAccent;
}) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'flex h-4.5 w-4.5 shrink-0 cursor-pointer items-center justify-center rounded border border-slate-600 bg-slate-950 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
        accentClasses[accent],
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center">
        <Check className="h-3.5 w-3.5 stroke-[3]" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
