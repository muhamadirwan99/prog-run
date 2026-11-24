import {
  Check,
  CheckCircle2,
  CloudUpload,
  FileArchive,
  Loader2,
  Plus,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { useRef, useState, type DragEvent } from 'react';
import { Progress } from '@/core/ui/progress';
import {
  createDemoRunBundles,
  downloadSampleStravaZip,
} from '@/features/activities/data/datasources/demo_data_generator';
import { parseStravaFilesInWorker } from '@/features/activities/data/datasources/strava_import_service';
import { activityRepository } from '@/features/activities/data/repositories/activity_repository';
import { useActivityUiStore } from '@/features/activities/presentation/state/use_activity_ui_store';
import { programRepository } from '@/features/training_program/data/repositories/program_repository';

/**
 * Widget Smart Import Strava (.zip, .gpx, .gpx.gz).
 * Seluruh ekstraksi & perhitungan Haversine dijalankan di Web Worker (background thread)
 * lalu hasilnya di-upsert atomik ke IndexedDB Dexie.
 */
export function StravaDropzoneCard() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const importProgress = useActivityUiStore((s) => s.importProgress);
  const lastImportBanner = useActivityUiStore((s) => s.lastImportBanner);
  const setImportProgress = useActivityUiStore((s) => s.setImportProgress);
  const resetImportProgress = useActivityUiStore((s) => s.resetImportProgress);
  const setLastImportBanner = useActivityUiStore((s) => s.setLastImportBanner);
  const setManualRunOpen = useActivityUiStore((s) => s.setManualRunOpen);
  const showToast = useActivityUiStore((s) => s.showToast);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    setImportProgress({
      isImporting: true,
      title: 'Menyiapkan Web Worker...',
      detail: `Membaca ${files.length} file terpilih`,
      percent: 5,
    });

    try {
      const workerResult = await parseStravaFilesInWorker(files, (p) => {
        setImportProgress({
          isImporting: true,
          title: p.title,
          detail: p.detail,
          percent: p.percent,
        });
      });

      const summary = await activityRepository.upsertBatch(workerResult.bundles);

      for (const warn of workerResult.warnings) {
        showToast(warn, 'warning');
      }

      const msg = `${summary.added} aktivitas lari baru ditambahkan, ${summary.updated} aktivitas lama diperbarui.`;
      setLastImportBanner(`Import Berhasil: ${msg}`);
      showToast(msg, 'success');
    } catch (err) {
      const errMsg =
        err instanceof Error ? err.message : 'Pastikan format arsip Strava valid.';
      showToast(`Gagal memproses file: ${errMsg}`, 'error');
    } finally {
      resetImportProgress();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handleLoadDemo() {
    try {
      const demoBundles = createDemoRunBundles();
      const summary = await activityRepository.upsertBatch(demoBundles);

      await programRepository.saveFullState({
        activeQuarter: 3,
        quarterMilestones: {
          1: [true, true, true],
          2: [true, true, true],
          3: [true, false, false],
          4: [false, false, false],
        },
        weeklyChecklist: {},
      });

      const msg = `Data Simulasi Dimuat: ${summary.added} sesi baru ditambahkan, ${summary.updated} sesi diperbarui.`;
      setLastImportBanner(msg);
      showToast(msg, 'success');
    } catch {
      showToast('Gagal memuat data simulasi ke IndexedDB.', 'error');
    }
  }

  async function handleDownloadSampleZip() {
    try {
      showToast('Membuat sampel arsip strava_export_sample.zip...', 'info');
      await downloadSampleStravaZip();
      showToast(
        'Sampel strava_export_sample.zip diunduh! Silakan tarik ke kotak Drag & Drop.',
        'success',
      );
    } catch {
      showToast('Gagal membuat sampel .zip Strava.', 'error');
    }
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    void handleFiles(e.dataTransfer.files);
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl sm:p-6">
      <div className="grid grid-cols-1 items-center gap-5 lg:grid-cols-12">
        {/* Kiri: Penjelasan & tombol cepat */}
        <div className="space-y-3 lg:col-span-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
            <Zap className="h-3.5 w-3.5" />
            <span>Smart Strava Importer (Web Worker)</span>
          </div>

          <h2 className="font-display text-lg font-bold text-white sm:text-xl">
            Unggah Arsip <span className="text-lime-400">.ZIP Strava</span> atau File{' '}
            <span className="text-cyan-400">.GPX</span>
          </h2>

          <p className="text-xs leading-relaxed text-slate-400 sm:text-sm">
            Otomatis mengekstrak{' '}
            <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-slate-200">
              activities.csv
            </code>
            , memfilter aktivitas lari, mendekode rute{' '}
            <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-slate-200">
              .gpx
            </code>{' '}
            &amp;{' '}
            <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-slate-200">
              .gpx.gz
            </code>{' '}
            di <em>background thread</em>, menghitung <em>Moving Pace</em> &amp;{' '}
            <em>Split per Km</em>, lalu melakukan <strong>Upsert Anti-Duplikat</strong> ke
            IndexedDB.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleLoadDemo}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-400 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-lime-500/10 transition hover:from-lime-300 hover:to-emerald-300"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Muat Data Simulasi (Demo)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSampleZip}
              title="Unduh sampel file .zip berformat Strava Bulk Export asli untuk dites"
              className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-slate-800 px-3 py-2 text-xs font-semibold text-cyan-300 transition hover:bg-slate-700"
            >
              <FileArchive className="h-3.5 w-3.5" />
              <span>Unduh Sampel .ZIP Strava</span>
            </button>

            <button
              type="button"
              onClick={() => setManualRunOpen(true)}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Input Lari Manual</span>
            </button>
          </div>
        </div>

        {/* Kanan: Area Drag & Drop */}
        <div className="lg:col-span-7">
          <div
            role="button"
            tabIndex={0}
            onClick={() => !importProgress.isImporting && fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && !importProgress.isImporting) {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragEnter={handleDragOver}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`group relative cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
              isDragOver
                ? 'scale-[1.005] border-lime-400 bg-lime-400/10'
                : 'border-slate-700 bg-slate-950/60 hover:border-lime-400/70'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,.gpx,.gz"
              multiple
              className="hidden"
              onChange={(e) => void handleFiles(e.target.files)}
            />

            {!importProgress.isImporting ? (
              <div className="space-y-2.5">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 shadow-inner transition group-hover:scale-105 group-hover:border-lime-400/50">
                  <CloudUpload className="h-7 w-7 text-lime-400" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-white sm:text-base">
                    Tarik &amp; Lepaskan file{' '}
                    <span className="font-mono text-lime-400">export_strava.zip</span> di
                    sini
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Atau klik untuk memilih file (
                    <code className="font-mono text-slate-300">.zip</code>,{' '}
                    <code className="font-mono text-slate-300">.gpx</code>,{' '}
                    <code className="font-mono text-slate-300">.gpx.gz</code>) &bull;
                    100% lokal di browser Anda
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] text-slate-400">
                  {[
                    'Auto-Filter Run',
                    'Web Worker Thread',
                    'Pako .gpx.gz',
                    'Anti-Duplikat ID',
                  ].map((badge) => (
                    <span
                      key={badge}
                      className="inline-flex items-center gap-1 rounded border border-slate-800 bg-slate-900 px-2 py-0.5"
                    >
                      <Check className="h-3 w-3 text-emerald-400" />
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3 py-2">
                <div className="flex items-center justify-center gap-2.5 text-lime-400">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-sm font-semibold sm:text-base">
                    {importProgress.title}
                  </span>
                </div>
                <div className="mx-auto w-full max-w-md">
                  <Progress value={importProgress.percent} className="h-2.5" />
                </div>
                <p className="truncate font-mono text-xs text-slate-400">
                  {importProgress.detail} ({importProgress.percent}%)
                </p>
              </div>
            )}
          </div>

          {/* Banner ringkasan hasil import terakhir */}
          {lastImportBanner && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-emerald-500/40 bg-emerald-950/60 px-4 py-2.5 text-xs">
              <div className="flex items-center gap-2.5 text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span className="font-medium">{lastImportBanner}</span>
              </div>
              <button
                type="button"
                onClick={() => setLastImportBanner(null)}
                aria-label="Tutup ringkasan import"
                className="text-slate-400 transition hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
