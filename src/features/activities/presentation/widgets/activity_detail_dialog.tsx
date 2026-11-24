import { useLiveQuery } from 'dexie-react-hooks';
import {
  BarChart3,
  Loader2,
  Map as MapIcon,
  Radar,
  Zap,
} from 'lucide-react';
import { appDb } from '@/core/database/app_database';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/core/ui/dialog';
import {
  formatDateIndo,
  formatDurationHMS,
  formatPaceMinKm,
} from '@/core/utils/formatters';
import { calculateRiegel10kSeconds } from '@/core/utils/running_math';
import { useActivityUiStore } from '@/features/activities/presentation/state/use_activity_ui_store';
import { RouteMapView } from '@/features/activities/presentation/widgets/route_map_view';

/**
 * Modal Detail Aktivitas Lari (Radix Dialog):
 * - Membaca ringkasan aktivitas dari tabel `activities`.
 * - MELAKUKAN LAZY-LOAD koordinat GPX dari tabel `activityRoutes` HANYA ketika modal ini terbuka!
 */
export function ActivityDetailDialog() {
  const selectedActivityId = useActivityUiStore((s) => s.selectedActivityId);
  const closeActivityDetail = useActivityUiStore((s) => s.closeActivityDetail);

  // Query reaktif Dexie (analogi Flutter: StreamBuilder<RunActivity?>)
  const activity = useLiveQuery(
    () =>
      selectedActivityId
        ? appDb.activities.get(selectedActivityId)
        : undefined,
    [selectedActivityId],
  );

  // Lazy-load koordinat rute dari tabel terpisah `activityRoutes`
  const routeRecord = useLiveQuery(
    () =>
      selectedActivityId
        ? appDb.activityRoutes.get(selectedActivityId)
        : undefined,
    [selectedActivityId],
  );

  const isOpen = Boolean(selectedActivityId);
  const coords = routeRecord?.coords ?? [];
  const riegelSec = activity
    ? calculateRiegel10kSeconds(activity.distanceKm, activity.movingTimeSec)
    : null;

  const splits = activity?.splits ?? [];
  const paces = splits.map((s) => s.paceSecPerKm).filter((p) => p > 0);
  const minPace = paces.length > 0 ? Math.min(...paces) : 0;
  const maxPace = paces.length > 0 ? Math.max(...paces) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeActivityDetail()}>
      <DialogContent className="flex max-h-[92vh] max-w-5xl flex-col overflow-hidden p-0">
        {!activity ? (
          <div className="flex h-64 items-center justify-center gap-2 text-sm text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin text-lime-400" />
            <span>Memuat detail aktivitas...</span>
          </div>
        ) : (
          <>
            {/* Header Modal */}
            <div className="shrink-0 border-b border-slate-800 bg-slate-950 p-4 pr-16 sm:p-5 sm:pr-16">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded border border-lime-400/30 bg-lime-400/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-lime-400">
                  RUN
                </span>
                <span className="font-mono text-xs text-slate-400">
                  {formatDateIndo(activity.dateIso)}
                </span>
                <span className="font-mono text-[11px] text-slate-500">
                  • ID: {activity.stravaActivityId}
                </span>
              </div>
              <DialogTitle className="mt-1 font-display text-lg font-bold text-white sm:text-xl">
                {activity.name}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Detail metrik, peta rute GPS, dan split per kilometer aktivitas lari.
              </DialogDescription>
            </div>

            {/* Body Scrollable */}
            <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
              {/* 5 Metrik Ringkasan */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3.5">
                  <span className="block text-[11px] text-slate-400">Jarak Tempuh</span>
                  <span className="mt-0.5 block font-display text-xl font-bold text-lime-400">
                    {activity.distanceKm.toFixed(2)} km
                  </span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3.5">
                  <span className="block text-[11px] text-slate-400">Moving Time</span>
                  <span className="mt-0.5 block font-display text-xl font-bold text-white">
                    {formatDurationHMS(activity.movingTimeSec)}
                  </span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3.5">
                  <span className="block text-[11px] text-slate-400">Moving Pace</span>
                  <span className="mt-0.5 block font-display text-xl font-bold text-cyan-400">
                    {formatPaceMinKm(activity.paceSecPerKm)} /km
                  </span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3.5">
                  <span className="block text-[11px] text-slate-400">Total Elevasi</span>
                  <span className="mt-0.5 block font-display text-xl font-bold text-emerald-400">
                    +{activity.elevationGain || 0} m
                  </span>
                </div>
                <div className="col-span-2 rounded-xl border border-slate-800 bg-slate-950/90 p-3.5 sm:col-span-1">
                  <span className="block text-[11px] text-slate-400">
                    Prediksi 10K Sesi Ini
                  </span>
                  <span className="mt-0.5 block font-display text-xl font-bold text-amber-400">
                    {riegelSec ? formatDurationHMS(riegelSec) : 'N/A (<1.5K)'}
                  </span>
                </div>
              </div>

              {/* Grid Peta Rute & Split per Kilometer */}
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
                {/* Kiri: React Leaflet Map */}
                <div className="flex flex-col lg:col-span-7">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-slate-300">
                      <MapIcon className="h-3.5 w-3.5 text-lime-400" />
                      <span>Visualisasi Rute GPS</span>
                    </h4>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />
                        Start
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-lime-400" />
                        Rute
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-500" />
                        Finish
                      </span>
                    </div>
                  </div>

                  <div className="relative h-80 w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 sm:h-96">
                    {activity.hasGpx && coords.length > 1 ? (
                      <RouteMapView
                        key={activity.stravaActivityId}
                        coords={coords}
                        title={activity.name}
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                        <Radar className="mb-2 h-8 w-8 text-slate-600" />
                        <p className="text-sm font-bold text-slate-300">
                          Rute Koordinat GPX Tidak Tersedia
                        </p>
                        <p className="mt-1 max-w-xs text-xs text-slate-500">
                          Aktivitas ini berasal dari ringkasan CSV / input manual (misal
                          lari treadmill atau backup ringkas tanpa koordinat rute).
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Kanan: Tabel Split per Km */}
                <div className="flex flex-col lg:col-span-5">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-slate-300">
                      <BarChart3 className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Analisis Split per Kilometer</span>
                    </h4>
                    <span className="font-mono text-[11px] text-cyan-400">
                      {splits.length} Segmen
                    </span>
                  </div>

                  <div className="max-h-96 flex-1 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead className="sticky top-0 bg-slate-900/95 font-mono text-[10px] uppercase text-slate-400">
                        <tr>
                          <th className="px-3 py-2.5">KM</th>
                          <th className="px-3 py-2.5">Pace (/km)</th>
                          <th className="px-3 py-2.5">Visual Kecepatan</th>
                          <th className="px-3 py-2.5 text-right">Elev</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {splits.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-6 text-center text-slate-500">
                              Tidak ada data split untuk sesi ini.
                            </td>
                          </tr>
                        ) : (
                          splits.map((sp, idx) => {
                            const isFastest =
                              sp.paceSecPerKm === minPace && splits.length > 1;
                            const spread = Math.max(30, maxPace - minPace);
                            const ratio = Math.max(
                              0.22,
                              Math.min(1, 1 - (sp.paceSecPerKm - minPace) / (spread * 1.35)),
                            );
                            const widthPct = Math.round(ratio * 100);
                            const eleStr =
                              sp.eleDelta > 0 ? `+${sp.eleDelta}m` : `${sp.eleDelta || 0}m`;

                            return (
                              <tr
                                key={`${sp.km}-${idx}`}
                                className={isFastest ? 'bg-lime-400/5' : ''}
                              >
                                <td className="whitespace-nowrap px-3 py-2.5 font-bold text-white">
                                  Km {sp.km}
                                </td>
                                <td
                                  className={`whitespace-nowrap px-3 py-2.5 font-bold ${
                                    isFastest ? 'text-lime-400' : 'text-slate-200'
                                  }`}
                                >
                                  <span className="inline-flex items-center gap-1">
                                    {formatPaceMinKm(sp.paceSecPerKm)}
                                    {isFastest && (
                                      <Zap
                                        aria-label="Split tercepat"
                                        className="h-3 w-3 text-lime-400"
                                      />
                                    )}
                                  </span>
                                </td>
                                <td className="w-full px-3 py-2.5">
                                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-900">
                                    <div
                                      className={`h-full rounded-full ${
                                        isFastest ? 'bg-lime-400' : 'bg-cyan-400/80'
                                      }`}
                                      style={{ width: `${widthPct}%` }}
                                    />
                                  </div>
                                </td>
                                <td className="whitespace-nowrap px-3 py-2.5 text-right text-slate-400">
                                  {eleStr}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
