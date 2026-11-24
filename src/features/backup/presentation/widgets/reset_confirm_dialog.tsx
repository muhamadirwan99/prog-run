import { AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/core/ui/alert_dialog';
import { useActivityUiStore } from '@/features/activities/presentation/state/use_activity_ui_store';
import { backupService } from '@/features/backup/data/services/backup_service';

/**
 * Dialog Konfirmasi Reset Semua Data Lokal (Radix AlertDialog).
 */
export function ResetConfirmDialog() {
  const isOpen = useActivityUiStore((s) => s.isResetDialogOpen);
  const setOpen = useActivityUiStore((s) => s.setResetDialogOpen);
  const setLastImportBanner = useActivityUiStore((s) => s.setLastImportBanner);
  const showToast = useActivityUiStore((s) => s.showToast);

  async function handleConfirmReset() {
    await backupService.resetAllLocalData();
    setLastImportBanner(null);
    setOpen(false);
    showToast('Seluruh data lokal di IndexedDB berhasil direset.', 'info');
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setOpen}>
      <AlertDialogContent className="space-y-4">
        <div className="flex items-center gap-3 text-rose-400">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <AlertDialogTitle className="font-display text-base font-bold text-white">
              Hapus Seluruh Data Lokal?
            </AlertDialogTitle>
            <p className="text-xs text-slate-400">
              Tindakan ini akan mengosongkan database IndexedDB di browser ini.
            </p>
          </div>
        </div>

        <AlertDialogDescription className="text-xs leading-relaxed text-slate-300">
          Pastikan Anda sudah menekan tombol <strong>Export (.json)</strong> terlebih
          dahulu jika masih ingin menyimpan riwayat lari, rute GPX, dan checklist kuartal
          Anda.
        </AlertDialogDescription>

        <div className="flex justify-end gap-2 pt-2">
          <AlertDialogCancel asChild>
            <button
              type="button"
              className="cursor-pointer rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
            >
              Batal
            </button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <button
              type="button"
              onClick={() => void handleConfirmReset()}
              className="cursor-pointer rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-400"
            >
              Ya, Reset Semua Data
            </button>
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
