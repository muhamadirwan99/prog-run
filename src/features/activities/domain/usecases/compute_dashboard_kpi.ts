import {
  BASELINE_PACE_SEC,
  QUARTERS_CONFIG,
  TARGET_10K_SECONDS,
  TARGET_DISTANCE_KM,
  TARGET_PACE_SEC,
  type QuarterId,
  type QuarterPlan,
} from '@/core/constants/training_plan';
import { calculateRiegel10kSeconds } from '@/core/utils/running_math';
import type { RunActivity } from '@/features/activities/domain/entities/activity';

/**
 * Use Case: Menghitung seluruh metrik KPI Dashboard dari daftar aktivitas.
 * Analogi Flutter: `ComputeDashboardKpiUseCase` di `domain/usecases/`.
 * Pure function (tanpa React/DB) sehingga sangat mudah dites atau di-debug.
 */

export interface DashboardKpiResult {
  totalRuns: number;
  totalDistanceKm: number;
  totalDurationSec: number;
  bestPaceRun: RunActivity | null;
  bestRiegel10kSec: number | null;
  bestRiegelSource: RunActivity | null;
  isSub60Achieved: boolean;
  minutesRemainingToSub60: number | null;
  longestRun: RunActivity | null;
  longestRunPctOf10k: number;
  activeQuarterPlan: QuarterPlan;
  paceProgressPct: number;
  benchmarkPaceSec: number | null;
}

export function computeDashboardKpi(
  activities: RunActivity[],
  activeQuarter: QuarterId,
): DashboardKpiResult {
  const totalRuns = activities.length;
  const totalDistanceKm = activities.reduce((sum, r) => sum + (r.distanceKm || 0), 0);
  const totalDurationSec = activities.reduce((sum, r) => sum + (r.movingTimeSec || 0), 0);

  // Filter lari valid >= 1 km & pace masuk akal (> 2:30/km untuk hindari glitch GPS)
  const validPaceRuns = activities.filter(
    (r) => r.distanceKm >= 1.0 && r.paceSecPerKm > 150,
  );

  let bestPaceRun: RunActivity | null = null;
  for (const run of validPaceRuns) {
    if (!bestPaceRun || run.paceSecPerKm < bestPaceRun.paceSecPerKm) {
      bestPaceRun = run;
    }
  }

  // Kandidat prediksi Riegel 10K: utamakan lari >= 3.0 km (lebih akurat secara fisiologis)
  const riegelCandidates = activities.filter(
    (r) => r.distanceKm >= 3.0 && r.movingTimeSec > 0,
  );
  const fallbackCandidates =
    riegelCandidates.length > 0 ? riegelCandidates : validPaceRuns;

  let bestRiegel10kSec: number | null = null;
  let bestRiegelSource: RunActivity | null = null;

  for (const run of fallbackCandidates) {
    const predSec = calculateRiegel10kSeconds(run.distanceKm, run.movingTimeSec);
    if (predSec !== null && (bestRiegel10kSec === null || predSec < bestRiegel10kSec)) {
      bestRiegel10kSec = predSec;
      bestRiegelSource = run;
    }
  }

  const isSub60Achieved =
    bestRiegel10kSec !== null && bestRiegel10kSec <= TARGET_10K_SECONDS;
  const minutesRemainingToSub60 =
    bestRiegel10kSec !== null && !isSub60Achieved
      ? Number(((bestRiegel10kSec - TARGET_10K_SECONDS) / 60).toFixed(1))
      : null;

  // Rekor jarak terjauh
  let longestRun: RunActivity | null = null;
  for (const run of activities) {
    if (!longestRun || run.distanceKm > longestRun.distanceKm) {
      longestRun = run;
    }
  }
  const longestRunPctOf10k = longestRun
    ? Math.min(100, Math.round((longestRun.distanceKm / TARGET_DISTANCE_KM) * 100))
    : 0;

  // Progress bar pace 10:00/km (600s) -> 6:00/km (360s)
  const activeQuarterPlan =
    QUARTERS_CONFIG.find((q) => q.id === activeQuarter) ?? QUARTERS_CONFIG[0];

  const benchmarkRun = bestRiegelSource ?? bestPaceRun;
  let paceProgressPct = 0;
  let benchmarkPaceSec: number | null = null;

  if (benchmarkRun) {
    benchmarkPaceSec = benchmarkRun.paceSecPerKm;
    const rawPct =
      ((BASELINE_PACE_SEC - benchmarkPaceSec) / (BASELINE_PACE_SEC - TARGET_PACE_SEC)) *
      100;
    paceProgressPct = Math.min(100, Math.max(2, Math.round(rawPct)));
  }

  return {
    totalRuns,
    totalDistanceKm,
    totalDurationSec,
    bestPaceRun,
    bestRiegel10kSec,
    bestRiegelSource,
    isSub60Achieved,
    minutesRemainingToSub60,
    longestRun,
    longestRunPctOf10k,
    activeQuarterPlan,
    paceProgressPct,
    benchmarkPaceSec,
  };
}
