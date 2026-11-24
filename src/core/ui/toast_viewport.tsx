import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from 'lucide-react';
import {
  useActivityUiStore,
  type ToastVariant,
} from '@/features/activities/presentation/state/use_activity_ui_store';

/**
 * Viewport notifikasi Toast di pojok kanan bawah.
 * Analogi Flutter: overlay `SnackBar` global.
 */

const variantStyles: Record<ToastVariant, string> = {
  success: 'border-lime-400/60 bg-slate-900/95 text-lime-300',
  info: 'border-cyan-400/60 bg-slate-900/95 text-cyan-300',
  warning: 'border-amber-400/60 bg-slate-900/95 text-amber-300',
  error: 'border-rose-500/60 bg-slate-900/95 text-rose-300',
};

function ToastIcon({ variant }: { variant: ToastVariant }) {
  switch (variant) {
    case 'success':
      return <CheckCircle2 className="h-4 w-4 shrink-0 text-lime-400" />;
    case 'info':
      return <Info className="h-4 w-4 shrink-0 text-cyan-400" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />;
    case 'error':
      return <XCircle className="h-4 w-4 shrink-0 text-rose-400" />;
  }
}

export function ToastViewport() {
  const toasts = useActivityUiStore((s) => s.toasts);
  const dismissToast = useActivityUiStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-full max-w-md flex-col gap-2.5 px-4"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-xs shadow-2xl backdrop-blur-md transition-all sm:text-sm ${variantStyles[toast.variant]}`}
        >
          <div className="flex items-center gap-2.5">
            <ToastIcon variant={toast.variant} />
            <span className="font-medium text-slate-100">{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            aria-label="Tutup notifikasi"
            className="ml-2 text-slate-400 transition hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
