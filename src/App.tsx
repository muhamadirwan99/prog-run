import { useLiveQuery } from 'dexie-react-hooks';
import {
  Activity,
  CalendarCheck,
  LineChart,
  Zap,
} from 'lucide-react';
import {
  QUARTERS_CONFIG,
  TUESDAY_CALISTHENICS,
} from '@/core/constants/training_plan';
import { appDb } from '@/core/database/app_database';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/ui/tabs';
import { ToastViewport } from '@/core/ui/toast_viewport';
import { TooltipProvider } from '@/core/ui/tooltip';
import { DashboardPage } from '@/features/activities/presentation/pages/dashboard_page';
import {
  useActivityUiStore,
  type MainTabId,
} from '@/features/activities/presentation/state/use_activity_ui_store';
import { BackupActionsBar } from '@/features/backup/presentation/widgets/backup_actions_bar';
import { ResetConfirmDialog } from '@/features/backup/presentation/widgets/reset_confirm_dialog';
import { createDefaultProgramState } from '@/features/training_program/domain/entities/program_state';
import { TrainingProgramPage } from '@/features/training_program/presentation/pages/training_program_page';

/**
 * Root App Shell (Analogi Flutter: `MaterialApp` + `Scaffold` dengan AppBar & TabBar).
 */
export function App() {
  const activeTab = useActivityUiStore((s) => s.activeTab);
  const setActiveTab = useActivityUiStore((s) => s.setActiveTab);

  // Live query ringan untuk badge persentase checklist mingguan di Header
  const programState =
    useLiveQuery(() => appDb.programSettings.get('default'), []) ??
    createDefaultProgramState();

  const activeQuarterPlan =
    QUARTERS_CONFIG.find((q) => q.id === programState.activeQuarter) ??
    QUARTERS_CONFIG[0];

  const allWeeklyIds = [
    ...TUESDAY_CALISTHENICS.map((x) => x.id),
    ...activeQuarterPlan.saturdayTasks.map((x) => x.id),
    ...activeQuarterPlan.sundayTasks.map((x) => x.id),
  ];
  const doneWeeklyCount = allWeeklyIds.filter((id) =>
    Boolean(programState.weeklyChecklist[id]),
  ).length;
  const weeklyPct =
    allWeeklyIds.length > 0
      ? Math.round((doneWeeklyCount / allWeeklyIds.length) * 100)
      : 0;

  return (
    <TooltipProvider delayDuration={250}>
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as MainTabId)}
        className="flex min-h-screen flex-col bg-slate-950 text-slate-100"
      >
        {/* Background Ambient Accents */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-lime-500/10 blur-3xl" />
          <div className="absolute right-0 top-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl" />
        </div>

        {/* Sticky Top Header */}
        <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-3.5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            {/* Brand Identity */}
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br from-lime-400 via-emerald-500 to-cyan-500 p-0.5 shadow-lg shadow-lime-500/20">
                <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
                  <Activity className="h-5 w-5 text-lime-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-lg font-bold uppercase tracking-tight text-white sm:text-xl">
                    Road to <span className="text-lime-400">10K Sub-60</span>
                  </h1>
                  <span className="hidden items-center rounded-full border border-lime-400/30 bg-lime-400/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-lime-400 sm:inline-flex">
                    10:00 → 6:00 /KM
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Sistem Pemantauan Progres Lari 1 Tahun • Strava Bulk Export Analytics
                </p>
              </div>
            </div>

            {/* Navigation Tabs & Backup Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 lg:justify-end">
              <TabsList>
                <TabsTrigger value="dashboard">
                  <LineChart className="h-4 w-4" />
                  <span>Dashboard &amp; Analitik</span>
                </TabsTrigger>
                <TabsTrigger value="program">
                  <CalendarCheck className="h-4 w-4" />
                  <span>Program &amp; Kalistenik</span>
                  <span className="rounded-md bg-slate-950/80 px-1.5 py-0.5 font-mono text-[10px] text-emerald-400">
                    {weeklyPct}%
                  </span>
                </TabsTrigger>
              </TabsList>

              <BackupActionsBar />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <TabsContent value="dashboard" className="focus:outline-none">
            <DashboardPage />
          </TabsContent>
          <TabsContent value="program" className="focus:outline-none">
            <TrainingProgramPage />
          </TabsContent>
        </main>

        {/* Footer */}
        <footer className="relative z-10 mt-10 border-t border-slate-900 bg-slate-950/90 py-5">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-xs text-slate-500 sm:flex-row sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-lime-400" />
              <span>
                <strong>Road to 10K Sub-60 Tracker</strong> • Local-First Strava ZIP &amp;
                GPX Engine
              </span>
            </div>
            <div className="font-mono text-[11px]">
              Penyimpanan Lokal: <code className="text-slate-400">IndexedDB (Dexie)</code>{' '}
              • Rumus Riegel T2 = T1 × (10 / D1)^1.06
            </div>
          </div>
        </footer>

        {/* Global Overlays */}
        <ResetConfirmDialog />
        <ToastViewport />
      </Tabs>
    </TooltipProvider>
  );
}

export default App;
