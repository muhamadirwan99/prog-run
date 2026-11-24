import { formatShortDateIndo } from '@/core/utils/formatters';
import type { RunActivity } from '@/features/activities/domain/entities/activity';

/**
 * Use Case: Mengolah data mentah aktivitas menjadi dataset siap-render untuk grafik Recharts.
 * Analogi Flutter: `AggregateChartsUseCase`.
 */

export interface PaceTrendPoint {
  stravaActivityId: string;
  dateLabel: string;
  name: string;
  distanceKm: number;
  paceSecPerKm: number;
  /** Pace dalam menit desimal (misal 6.5 = 6:30/km) untuk nilai sumbu Y Recharts */
  paceMinutes: number;
}

export interface WeeklyVolumePoint {
  weekKey: string;
  weekLabel: string;
  totalKm: number;
  runCount: number;
}

export interface AggregatedChartsData {
  paceTrend: PaceTrendPoint[];
  weeklyVolume: WeeklyVolumePoint[];
  averageWeeklyKm: number;
}

export function aggregateChartsData(activities: RunActivity[]): AggregatedChartsData {
  // Urutkan kronologis (terlama -> terbaru) agar garis tren bergerak dari kiri ke kanan
  const chronological = [...activities].sort(
    (a, b) => new Date(a.dateIso).getTime() - new Date(b.dateIso).getTime(),
  );

  const paceTrend: PaceTrendPoint[] = chronological.map((run) => ({
    stravaActivityId: run.stravaActivityId,
    dateLabel: formatShortDateIndo(run.dateIso),
    name: run.name,
    distanceKm: run.distanceKm,
    paceSecPerKm: run.paceSecPerKm,
    paceMinutes: Number((run.paceSecPerKm / 60).toFixed(2)),
  }));

  // Agregasi volume jarak per minggu kalender (Senin - Minggu)
  const weekMap = new Map<string, WeeklyVolumePoint>();

  for (const run of chronological) {
    const d = new Date(run.dateIso);
    if (Number.isNaN(d.getTime())) continue;

    const day = d.getDay(); // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    // Format kunci lokal YYYY-MM-DD agar tidak geser karena timezone UTC
    const y = monday.getFullYear();
    const m = String(monday.getMonth() + 1).padStart(2, '0');
    const dayNum = String(monday.getDate()).padStart(2, '0');
    const weekKey = `${y}-${m}-${dayNum}`;

    const label = monday.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
    });

    const existing = weekMap.get(weekKey);
    if (!existing) {
      weekMap.set(weekKey, {
        weekKey,
        weekLabel: `Mgg ${label}`,
        totalKm: Number(run.distanceKm.toFixed(2)),
        runCount: 1,
      });
    } else {
      existing.totalKm = Number((existing.totalKm + run.distanceKm).toFixed(2));
      existing.runCount += 1;
    }
  }

  const weeklyVolume = Array.from(weekMap.values());
  const averageWeeklyKm =
    weeklyVolume.length > 0
      ? Number(
          (
            weeklyVolume.reduce((acc, w) => acc + w.totalKm, 0) / weeklyVolume.length
          ).toFixed(1),
        )
      : 0;

  return {
    paceTrend,
    weeklyVolume,
    averageWeeklyKm,
  };
}
