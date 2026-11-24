import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { appDb } from '@/core/database/app_database';
import type { RunActivity } from '@/features/activities/domain/entities/activity';
import { aggregateChartsData } from '@/features/activities/domain/usecases/aggregate_charts';
import { computeDashboardKpi } from '@/features/activities/domain/usecases/compute_dashboard_kpi';
import { ActivityDetailDialog } from '@/features/activities/presentation/widgets/activity_detail_dialog';
import { ActivityHistoryTable } from '@/features/activities/presentation/widgets/activity_history_table';
import { AnalyticsChartsGrid } from '@/features/activities/presentation/widgets/analytics_charts_grid';
import { KpiCardsGrid } from '@/features/activities/presentation/widgets/kpi_cards_grid';
import { ManualRunDialog } from '@/features/activities/presentation/widgets/manual_run_dialog';
import { StravaDropzoneCard } from '@/features/activities/presentation/widgets/strava_dropzone_card';
import { createDefaultProgramState } from '@/features/training_program/domain/entities/program_state';

// Referensi array kosong stabil agar useMemo tidak menghitung ulang saat DB masih loading
const EMPTY_ACTIVITIES: RunActivity[] = [];
const DEFAULT_PROGRAM = createDefaultProgramState();

/**
 * Halaman Tab 1: Dashboard & Analitik Progres Lari.
 *
 * Analogi Flutter:
 * - `useLiveQuery` adalah `StreamBuilder` / `ref.watch(streamProvider)` terhadap IndexedDB Dexie.
 * - Setiap kali ada aktivitas baru masuk dari Web Worker atau dihapus, seluruh KPI, grafik,
 *   dan tabel di halaman ini otomatis update secara reaktif!
 */
export function DashboardPage() {
  const liveActivities = useLiveQuery(
    () => appDb.activities.orderBy('dateIso').reverse().toArray(),
    [],
  );
  const activities = liveActivities ?? EMPTY_ACTIVITIES;

  const liveProgram = useLiveQuery(() => appDb.programSettings.get('default'), []);
  const programState = liveProgram ?? DEFAULT_PROGRAM;

  const kpi = useMemo(
    () => computeDashboardKpi(activities, programState.activeQuarter),
    [activities, programState.activeQuarter],
  );

  const chartsData = useMemo(() => aggregateChartsData(activities), [activities]);

  return (
    <div className="space-y-6">
      <StravaDropzoneCard />
      <KpiCardsGrid kpi={kpi} />
      <AnalyticsChartsGrid data={chartsData} />
      <ActivityHistoryTable activities={activities} />

      {/* Modal Radix Dialog (hanya aktif saat dipicu dari Zustand store) */}
      <ActivityDetailDialog />
      <ManualRunDialog />
    </div>
  );
}
