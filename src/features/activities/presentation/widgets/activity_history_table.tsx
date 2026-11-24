import {
  Eye,
  FileSpreadsheet,
  ListChecks,
  MapPin,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useMemo } from 'react';
import {
  formatDateIndo,
  formatDurationHMS,
  formatPaceMinKm,
} from '@/core/utils/formatters';
import { createDemoRunBundles } from '@/features/activities/data/datasources/demo_data_generator';
import { activityRepository } from '@/features/activities/data/repositories/activity_repository';
import type { RunActivity } from '@/features/activities/domain/entities/activity';
import {
  useActivityUiStore,
  type ActivityFilterMode,
  type ActivitySortMode,
} from '@/features/activities/presentation/state/use_activity_ui_store';
import { programRepository } from '@/features/training_program/data/repositories/program_repository';

/**
 * Tabel Riwayat Aktivitas Lari + Pencarian, Filter, dan Sorting.
 * Klik pada baris mana pun untuk membuka modal Peta Rute & Split per Km.
 */
export function ActivityHistoryTable({ activities }: { activities: RunActivity[] }) {
  const searchQuery = useActivityUiStore((s) => s.searchQuery);
  const filterMode = useActivityUiStore((s) => s.filterMode);
  const sortMode = useActivityUiStore((s) => s.sortMode);
  const setSearchQuery = useActivityUiStore((s) => s.setSearchQuery);
  const setFilterMode = useActivityUiStore((s) => s.setFilterMode);
  const setSortMode = useActivityUiStore((s) => s.setSortMode);
  const openActivityDetail = useActivityUiStore((s) => s.openActivityDetail);
  const showToast = useActivityUiStore((s) => s.showToast);

  // useMemo (analogi: cached getter) agar filter/sort tidak dihitung ulang jika deps sama
  const filteredActivities = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    const filtered = activities.filter((act) => {
      const matchSearch =
        !query ||
        act.name.toLowerCase().includes(query) ||
        formatDateIndo(act.dateIso).toLowerCase().includes(query) ||
        act.stravaActivityId.toLowerCase().includes(query);

      if (!matchSearch) return false;
      if (filterMode === 'gpx') return act.hasGpx;
      if (filterMode === '5k') return act.distanceKm >= 5.0;
      return true;
    });

    return filtered.sort((a, b) => {
      switch (sortMode) {
        case 'date_asc':
          return new Date(a.dateIso).getTime() - new Date(b.dateIso).getTime();
        case 'pace_asc':
          return a.paceSecPerKm - b.paceSecPerKm;
        case 'dist_desc':
          return b.distanceKm - a.distanceKm;
        case 'date_desc':
        default:
          return new Date(b.dateIso).getTime() - new Date(a.dateIso).getTime();
      }
    });
  }, [activities, searchQuery, filterMode, sortMode]);

  async function handleDelete(stravaActivityId: string) {
    await activityRepository.deleteById(stravaActivityId);
    showToast('Aktivitas berhasil dihapus dari database lokal.', 'info');
  }

  async function handleQuickLoadDemo() {
    const bundles = createDemoRunBundles();
    const res = await activityRepository.upsertBatch(bundles);
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
    showToast(`${res.added} sesi simulasi lari dimuat.`, 'success');
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl">
      {/* Header & Search/Filter Controls */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-800 p-5 md:flex-row md:items-center">
        <div>
          <h3 className="flex items-center gap-2 font-display text-lg font-bold text-white">
            <ListChecks className="h-5 w-5 text-lime-400" />
            <span>Daftar Riwayat Aktivitas Lari</span>
            <span className="rounded-full bg-slate-800 px-2.5 py-0.5 font-mono text-xs text-lime-400">
              {filteredActivities.length} Sesi
            </span>
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Klik pada baris aktivitas untuk membuka{' '}
            <strong>Peta Rute Interaktif (React Leaflet)</strong> dan analisis{' '}
            <strong>Split per Kilometer</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama lari / tanggal..."
              className="w-48 rounded-xl border border-slate-800 bg-slate-950 py-2 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-lime-400 focus:outline-none sm:w-56"
            />
          </div>

          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as ActivityFilterMode)}
            aria-label="Filter sumber data"
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-lime-400 focus:outline-none"
          >
            <option value="all">Semua Sumber Data</option>
            <option value="gpx">Dengan Rute GPX &amp; Split</option>
            <option value="5k">Jarak ≥ 5.0 KM</option>
          </select>

          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as ActivitySortMode)}
            aria-label="Urutkan aktivitas"
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-lime-400 focus:outline-none"
          >
            <option value="date_desc">Terbaru → Terlama</option>
            <option value="date_asc">Terlama → Terbaru</option>
            <option value="pace_asc">Pace Tercepat</option>
            <option value="dist_desc">Jarak Terjauh</option>
          </select>
        </div>
      </div>

      {/* Table atau Empty State */}
      {filteredActivities.length === 0 ? (
        <div className="space-y-3 px-4 py-14 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 text-slate-600">
            <MapPin className="h-7 w-7" />
          </div>
          <div className="mx-auto max-w-md">
            <h4 className="text-base font-bold text-white">
              {activities.length === 0
                ? 'Belum Ada Data Aktivitas Lari'
                : 'Tidak Ada Aktivitas yang Cocok'}
            </h4>
            <p className="mt-1 text-xs text-slate-400">
              {activities.length === 0
                ? 'Unggah arsip .zip Strava Bulk Export Anda di atas, atau muat data simulasi untuk langsung menguji peta rute, split per km, dan prediksi 10K.'
                : 'Coba ubah kata kunci pencarian atau filter di kanan atas.'}
            </p>
          </div>
          {activities.length === 0 && (
            <button
              type="button"
              onClick={() => void handleQuickLoadDemo()}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-lime-400 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-lime-300"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Muat 12 Sesi Lari Simulasi Sekarang</span>
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/60 font-mono text-[11px] uppercase text-slate-400">
                <th className="px-4 py-3.5">Tanggal</th>
                <th className="px-4 py-3.5">Nama Aktivitas</th>
                <th className="px-4 py-3.5 text-right">Jarak</th>
                <th className="px-4 py-3.5 text-right">Moving Time</th>
                <th className="px-4 py-3.5 text-right">Moving Pace</th>
                <th className="hidden px-4 py-3.5 text-right sm:table-cell">Elevasi</th>
                <th className="px-4 py-3.5 text-center">Data Rute &amp; Split</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs sm:text-sm">
              {filteredActivities.map((act) => {
                const isSub6 = act.paceSecPerKm <= 360;
                const paceBadgeClass = isSub6
                  ? 'border-lime-400/40 bg-lime-400/20 text-lime-300'
                  : act.paceSecPerKm <= 480
                    ? 'border-cyan-400/30 bg-cyan-400/15 text-cyan-300'
                    : 'border-slate-700 bg-slate-800 text-slate-200';

                return (
                  <tr
                    key={act.stravaActivityId}
                    onClick={() => openActivityDetail(act.stravaActivityId)}
                    className="group cursor-pointer transition hover:bg-slate-800/60"
                  >
                    <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-slate-300">
                      {formatDateIndo(act.dateIso)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-white transition group-hover:text-lime-400">
                        {act.name}
                      </div>
                      <div className="max-w-xs truncate font-mono text-[11px] text-slate-500">
                        ID: {act.stravaActivityId}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right font-mono font-bold text-white">
                      {act.distanceKm.toFixed(2)}{' '}
                      <span className="text-xs font-normal text-lime-400">km</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right font-mono text-slate-300">
                      {formatDurationHMS(act.movingTimeSec)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right">
                      <span
                        className={`rounded-lg border px-2.5 py-1 font-mono text-xs font-bold ${paceBadgeClass}`}
                      >
                        {formatPaceMinKm(act.paceSecPerKm)} /km
                      </span>
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3.5 text-right font-mono text-slate-400 sm:table-cell">
                      +{act.elevationGain || 0} m
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-center">
                      {act.hasGpx ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 font-mono text-[11px] text-emerald-300">
                          <MapPin className="h-3 w-3" />
                          GPX + {act.splits.length} Split
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-400">
                          <FileSpreadsheet className="h-3 w-3" />
                          Ringkasan CSV
                        </span>
                      )}
                    </td>
                    <td
                      className="whitespace-nowrap px-4 py-3.5 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openActivityDetail(act.stravaActivityId)}
                          className="flex cursor-pointer items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-lime-400 hover:text-slate-950"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span className="hidden md:inline">Detail</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(act.stravaActivityId)}
                          title="Hapus Aktivitas"
                          className="cursor-pointer rounded-lg bg-slate-900 p-1.5 text-slate-500 transition hover:bg-rose-950 hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
