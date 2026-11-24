import * as TabsPrimitive from '@radix-ui/react-tabs';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/core/utils/cn';

/**
 * Shared Tabs berbasis Radix UI.
 * Analogi Flutter: `DefaultTabController` + `TabBar` + `TabBarView`.
 */

export const Tabs = TabsPrimitive.Root;

export function TabsList({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex items-center rounded-xl border border-slate-800 bg-slate-900 p-1',
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-400 transition-all hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 sm:text-sm data-[state=active]:bg-lime-400 data-[state=active]:text-slate-950 data-[state=active]:shadow',
        className,
      )}
      {...props}
    />
  );
}

export const TabsContent = TabsPrimitive.Content;
