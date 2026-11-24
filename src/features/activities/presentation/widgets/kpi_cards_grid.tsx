import {
  Clock,
  Flag,
  Footprints,
  Gauge,
  Info,
  Route,
  Trophy,
} from 'lucide-react';
import { Progress } from '@/core/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/core/ui/tooltip';
import {
  formatDateIndo,
  formatDurationHMS,
  formatPaceMinKm,
  formatTotalHoursMinutes,
} from '@/core/utils/formatters';
import type { DashboardKpiResult } from '@/features/activities/domain/usecases/compute_dashboard_kpi';
import { useActivityUiStore } from '@/features/activities/presentation/state/use_activity_ui_store';

/**
 * 4 Kartu KPI Utama Dashboard:
 * 1. Total Jarak Terkumpul
 * 2. Rekor Pace & Prediksi 10K (Rumus Riegel)
 * 3. Rekor Jarak Terjauh (% menuju 10K)
 * 4. Status Kuartal Aktif & Progres Pace 10:00 -> 6:00/km
 */
export function KpiCardsGrid({ kpi }: { kpi: DashboardKpiResult }) {
  const setActiveTab = useActivityUiStore((s) => s.setActiveTab);

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* KPI 1: Total Jarak Terkumpul */}
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-900/90 p-5 transition hover:border-lime-400/40">
        <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-lime-400/5 blur-xl transition group-hover:bg-lime-400/15" />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Jarak Terkumpul
            </p>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-display text-3xl font-bold text-white sm:text-4xl">
                {kpi.totalDistanceKm.toFixed(1)}
              </span>
              <span className="font-mono text-sm font-semibold text-lime-400">KM</span>
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-lime-400/20 bg-lime-400/10 text-lime-400">
            <Route className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Footprints className="h-3.5 w-3.5 text-lime-400" />
            <strong className="text-slate-200">{kpi.totalRuns}</strong> Sesi Lari
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-cyan-400" />
            <strong className="text-slate-200">
              {formatTotalHoursMinutes(kpi.totalDurationSec)}
            </strong>
          </span>
        </div>
      </div>

      {/* KPI 2: Rekor Pace Terbaik & Prediksi 10K Riegel */}
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-900/90 p-5 transition hover:border-cyan-400/40">
        <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-cyan-400/5 blur-xl transition group-hover:bg-cyan-400/15" />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Rekor Pace &amp; Prediksi 10K
            </p>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-display text-3xl font-bold text-white sm:text-4xl">
                {kpi.bestPaceRun ? formatPaceMinKm(kpi.bestPaceRun.paceSecPerKm) : '--:--'}
              </span>
              <span className="font-mono text-xs font-semibold text-cyan-400">/KM</span>
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-400">
            <Gauge className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4 border-t border-slate-800/80 pt-3">
          <div className="flex items-center justify-between text-xs">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex cursor-help items-center gap-1 text-slate-400">
                  Est. 10K (Riegel)
                  <Info className="h-3 w-3 text-slate-500" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                Rumus Riegel: T2 = T1 × (10 / D1)^1.06 dihitung dari performa terbaik lari
                minimal 3 km.
              </TooltipContent>
            </Tooltip>

            <span
              className={`rounded border px-2 py-0.5 font-mono font-bold ${
                kpi.isSub60Achieved
                  ? 'border-lime-400/50 bg-lime-950/90 text-lime-300'
                  : 'border-cyan-500/30 bg-cyan-950/80 text-cyan-300'
              }`}
            >
              {kpi.bestRiegel10kSec ? formatDurationHMS(kpi.bestRiegel10kSec) : '--:--:--'}
            </span>
          </div>

          <p className="mt-1 truncate text-[11px] text-slate-500">
            {kpi.bestRiegelSource
              ? kpi.isSub60Achieved
                ? `TARGET SUB-60 TERCAPAI! (${kpi.bestRiegelSource.distanceKm}K @ ${formatPaceMinKm(kpi.bestRiegelSource.paceSecPerKm)}/km)`
                : `-${kpi.minutesRemainingToSub60} mnt ke Sub-60 (${kpi.bestRiegelSource.distanceKm}K @ ${formatPaceMinKm(kpi.bestRiegelSource.paceSecPerKm)})`
              : 'Minimal 1 lari ≥ 3 km untuk prediksi Riegel'}
          </p>
        </div>
      </div>

      {/* KPI 3: Rekor Jarak Terjauh */}
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-900/90 p-5 transition hover:border-emerald-400/40">
        <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-emerald-400/5 blur-xl transition group-hover:bg-emerald-400/15" />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Rekor Jarak Terjauh
            </p>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-display text-3xl font-bold text-white sm:text-4xl">
                {kpi.longestRun ? kpi.longestRun.distanceKm.toFixed(2) : '0.00'}
              </span>
              <span className="font-mono text-sm font-semibold text-emerald-400">KM</span>
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-400">
            <Trophy className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4 space-y-1.5 border-t border-slate-800/80 pt-3">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="truncate text-slate-400">
              {kpi.longestRun
                ? `${formatDateIndo(kpi.longestRun.dateIso)} • ${formatPaceMinKm(kpi.longestRun.paceSecPerKm)}/km`
                : 'Belum ada aktivitas'}
            </span>
            <span className="shrink-0 font-mono font-semibold text-emerald-400">
              {kpi.longestRunPctOf10k}% dari 10K
            </span>
          </div>
          <Progress
            value={kpi.longestRunPctOf10k}
            className="h-1.5"
            indicatorClassName="bg-emerald-400"
          />
        </div>
      </div>

      {/* KPI 4: Status Kuartal Aktif & Progres Pace 10:00 -> 6:00 */}
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-900/90 p-5 transition hover:border-lime-400/40">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="rounded border border-lime-400/30 bg-lime-400/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-lime-400">
                KUARTAL {kpi.activeQuarterPlan.id} ({kpi.activeQuarterPlan.months})
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('program')}
                className="cursor-pointer text-[11px] text-slate-400 underline hover:text-lime-400"
              >
                Ubah
              </button>
            </div>
            <p className="mt-1.5 line-clamp-1 text-sm font-bold text-white">
              {kpi.activeQuarterPlan.title}
            </p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-lime-400/20 bg-lime-400/10 text-lime-400">
            <Flag className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4 space-y-1.5 border-t border-slate-800/80 pt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Progres Pace 10:00 → 6:00:</span>
            <span className="font-mono font-bold text-lime-400">
              {kpi.paceProgressPct}%
            </span>
          </div>
          <Progress
            value={kpi.paceProgressPct}
            className="h-2 bg-slate-800 p-0.5"
            indicatorClassName="bg-gradient-to-r from-emerald-500 via-lime-400 to-cyan-400"
          />
          <div className="flex justify-between font-mono text-[10px] text-slate-500">
            <span>Baseline 10:00</span>
            <span className="text-slate-300">
              {kpi.benchmarkPaceSec
                ? `Terbaik: ${formatPaceMinKm(kpi.benchmarkPaceSec)}/km`
                : 'Saat ini: --:--'}
            </span>
            <span className="text-lime-400">Target 6:00</span>
          </div>
        </div>
      </div>
    </section>
  );
}
