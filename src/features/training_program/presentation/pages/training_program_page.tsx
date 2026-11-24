import { useLiveQuery } from 'dexie-react-hooks';
import { Layers } from 'lucide-react';
import { QUARTERS_CONFIG } from '@/core/constants/training_plan';
import { appDb } from '@/core/database/app_database';
import { createDefaultProgramState } from '@/features/training_program/domain/entities/program_state';
import { CalisthenicsTimerCard } from '@/features/training_program/presentation/widgets/calisthenics_timer_card';
import { QuartersGrid } from '@/features/training_program/presentation/widgets/quarters_grid';
import { WeeklyChecklistSection } from '@/features/training_program/presentation/widgets/weekly_checklist_section';

/**
 * Halaman Tab 2: Periodisasi 1 Tahun (4 Kuartal), Checklist Mingguan & Timer Kalistenik.
 */
export function TrainingProgramPage() {
  const programState =
    useLiveQuery(() => appDb.programSettings.get('default'), []) ??
    createDefaultProgramState();

  const activeQuarterPlan =
    QUARTERS_CONFIG.find((q) => q.id === programState.activeQuarter) ??
    QUARTERS_CONFIG[0];

  return (
    <div className="space-y-6">
      {/* Banner Masterplan 12 Bulan */}
      <section className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/60 p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-lime-400/30 bg-lime-400/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-lime-400">
              <span>MASTERPLAN 12 BULAN</span>
              <span>•</span>
              <span>4 KM (10:00/KM) → 10 KM (6:00/KM)</span>
            </div>
            <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
              Periodisasi 4 Kuartal &amp; Rutinitas Kalistenik Mingguan
            </h2>
            <p className="max-w-3xl text-xs text-slate-400 sm:text-sm">
              Pilih salah satu kartu kuartal untuk menjadikannya{' '}
              <strong>Kuartal Aktif</strong>. Panduan latihan kualitas hari Sabtu dan Long
              Run hari Minggu otomatis menyesuaikan fase kuartal Anda.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 lg:self-center">
            <div className="text-right">
              <span className="block font-mono text-[11px] uppercase text-slate-400">
                Kuartal Aktif Saat Ini
              </span>
              <span className="font-display text-base font-bold text-lime-400">
                Kuartal {activeQuarterPlan.id} ({activeQuarterPlan.months})
              </span>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-lime-400/30 bg-lime-400/15 text-lime-400">
              <Layers className="h-5 w-5" />
            </div>
          </div>
        </div>
      </section>

      {/* 4 Kartu Kuartal */}
      <QuartersGrid programState={programState} />

      {/* Checklist Mingguan (Kiri) + Countdown Timer (Kanan) */}
      <section className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <WeeklyChecklistSection
          programState={programState}
          activeQuarterPlan={activeQuarterPlan}
        />
        <CalisthenicsTimerCard />
      </section>
    </div>
  );
}
