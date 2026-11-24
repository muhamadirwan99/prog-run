import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Helper `cn` untuk menggabungkan class CSS Tailwind secara aman tanpa bentrok.
 * Contoh: cn('px-4 py-2', isActive && 'bg-lime-400', className)
 * (Analogi Flutter: mirip `.copyWith()` pada BoxDecoration / TextStyle agar override rapi.)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
