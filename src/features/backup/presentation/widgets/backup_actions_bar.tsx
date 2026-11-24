import { Download, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/core/ui/dialog';
import { useActivityUiStore } from '@/features/activities/presentation/state/use_activity_ui_store';
import { backupService } from '@/features/backup/data/services/backup_service';

/**
 * Bar tombol aksi Backup (Export JSON Full/Ringkas, Import JSON tervalidasi Zod, & Reset Data)
 * yang tampil di Header navigasi.
 */
export function BackupActionsBar() {
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [isExportDialogOpen, setExportDialogOpen] = useState(false);

  const setResetDialogOpen = useActivityUiStore((s) => s.setResetDialogOpen);
  const showToast = useActivityUiStore((s) => s.showToast);

  async function handleExport(includeRoutes: boolean) {
    try {
      await backupService.exportToJsonFile(includeRoutes);
      setExportDialogOpen(false);
      showToast(
        includeRoutes
          ? 'Backup Full (.json beserta rute GPX) berhasil diunduh.'
          : 'Backup Ringkas (.json tanpa koordinat GPX) berhasil diunduh.',
        'success',
      );
    } catch {
      showToast('Gagal membuat file backup JSON.', 'error');
    }
  }

  async function handleImportChange(file: File | undefined) {
    if (!file) return;
    try {
      const summary = await backupService.importFromJsonFile(file);
      showToast(
        `Backup dipulihkan: ${summary.added} aktivitas baru, ${summary.updated} diperbarui.`,
        'success',
      );
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'File JSON backup tidak valid.',
        'error',
      );
    } finally {
      if (importInputRef.current) {
        importInputRef.current.value = '';
      }
    }
  }

  return (
    <>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => setExportDialogOpen(true)}
          title="Unduh Backup Database (.json)"
          className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-800"
        >
          <Download className="h-3.5 w-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Export (.json)</span>
        </button>

        <button
          type="button"
          onClick={() => importInputRef.current?.click()}
          title="Impor Backup Database (.json tervalidasi Zod)"
          className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-800"
        >
          <Upload className="h-3.5 w-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Import (.json)</span>
        </button>
        <input
          ref={importInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => void handleImportChange(e.target.files?.[0])}
        />

        <button
          type="button"
          onClick={() => setResetDialogOpen(true)}
          title="Reset semua data lokal"
          className="cursor-pointer rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-400 transition hover:border-rose-800/60 hover:bg-rose-950/60 hover:text-rose-400"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Modal pilih mode Export Backup: Full (dengan rute GPX) vs Ringkas */}
      <Dialog open={isExportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="max-w-md space-y-4 p-5">
          <div>
            <DialogTitle className="font-display text-base font-bold text-white">
              Pilih Format Export Backup (.json)
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs text-slate-400">
              File backup divalidasi dengan skema Zod v2 agar aman dipindahkan antar
              perangkat tanpa backend.
            </DialogDescription>
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => void handleExport(true)}
              className="w-full cursor-pointer rounded-xl border border-lime-400/40 bg-lime-400/10 p-3.5 text-left transition hover:bg-lime-400/20"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-lime-300">
                  Backup Lengkap (Direkomendasikan)
                </span>
                <span className="rounded bg-lime-400/20 px-2 py-0.5 font-mono text-[10px] text-lime-300">
                  + Rute GPX
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-300">
                Menyertakan seluruh aktivitas, splits per km, koordinat peta rute GPS, dan
                progres program 4 kuartal.
              </p>
            </button>

            <button
              type="button"
              onClick={() => void handleExport(false)}
              className="w-full cursor-pointer rounded-xl border border-slate-700 bg-slate-950 p-3.5 text-left transition hover:border-cyan-400/50 hover:bg-slate-800/80"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-100">
                  Backup Ringkas (Ukuran Super Kecil)
                </span>
                <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-cyan-300">
                  Tanpa GPX
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Hanya ringkasan aktivitas, splits per km, dan progres program latihan
                (cocok untuk transfer cepat di HP).
              </p>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
