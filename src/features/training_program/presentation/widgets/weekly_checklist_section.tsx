import { ClipboardCheck, Play, RotateCcw } from 'lucide-react';
import {
  TUESDAY_CALISTHENICS,
  type QuarterPlan,
} from '@/core/constants/training_plan';
import { Checkbox } from '@/core/ui/checkbox';
import { Progress } from '@/core/ui/progress';
import { useActivityUiStore } from '@/features/activities/presentation/state/use_activity_ui_store';
import { programRepository } from '@/features/training_program/data/repositories/program_repository';
import type { ProgramState } from '@/features/training_program/domain/entities/program_state';
import { useTimerStore } from '@/features/training_program/presentation/state/use_timer_store';

/**
 * Checklist Rutinitas Mingguan Interaktif:
 * - Selasa Malam: Kalistenik Kamar Kos (dengan tombol cepat jalankan Timer!)
 * - Sabtu: Sesi Kualitas (menyesuaikan kuartal aktif)
 * - Minggu: Sesi Long Run (menyesuaikan kuartal aktif)
 */
export function WeeklyChecklistSection({
  programState,
  activeQuarterPlan,
}: {
  programState: ProgramState;
  activeQuarterPlan: QuarterPlan;
}) {
  const setTimerPreset = useTimerStore((s) => s.setPreset);
  const showToast = useActivityUiStore((s) => s.showToast);

  const checklist = programState.weeklyChecklist;

  const tueDone = TUESDAY_CALISTHENICS.filter((item) => Boolean(checklist[item.id])).length;
  const satDone = activeQuarterPlan.saturdayTasks.filter((t) =>
    Boolean(checklist[t.id]),
  ).length;
  const sunDone = activeQuarterPlan.sundayTasks.filter((t) =>
    Boolean(checklist[t.id]),
  ).length;

  const totalTasks =
    TUESDAY_CALISTHENICS.length +
    activeQuarterPlan.saturdayTasks.length +
    activeQuarterPlan.sundayTasks.length;
  const totalDone = tueDone + satDone + sunDone;
  const pct = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;

  async function handleResetWeek() {
    await programRepository.resetWeeklyChecklist();
    showToast('Checklist mingguan telah direset untuk minggu baru!', 'info');
  }

  return (
    <div className="space-y-5 lg:col-span-7">
      {/* Header Progress Mingguan */}
      <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h3 className="flex items-center gap-2 font-display text-lg font-bold text-white">
              <ClipboardCheck className="h-5 w-5 text-lime-400" />
              <span>Checklist Rutinitas Mingguan Interaktif</span>
            </h3>
            <p className="text-xs text-slate-400">
              Tandai setiap sesi latihan untuk menjaga konsistensi mingguan Anda
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleResetWeek()}
            className="flex cursor-pointer items-center gap-1.5 self-start rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700 sm:self-auto"
          >
            <RotateCcw className="h-3.5 w-3.5 text-cyan-400" />
            <span>Reset Minggu Ini</span>
          </button>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between font-mono text-xs">
            <span className="text-slate-400">Progres Penyelesaian Minggu Ini</span>
            <span className="font-bold text-lime-400">
              {totalDone} / {totalTasks} Selesai ({pct}%)
            </span>
          </div>
          <Progress value={pct} className="h-2.5 border border-slate-800 bg-slate-950" />
        </div>
      </div>

      {/* SELASA MALAM: Kalistenik Kamar Kos */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-lime-400/30 bg-lime-400/10 font-display font-bold text-lime-400">
              SEL
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-display text-base font-bold text-white">
                  Selasa Malam — Kalistenik Kamar Kos
                </h4>
                <span className="rounded border border-lime-400/20 bg-lime-400/10 px-2 py-0.5 font-mono text-[10px] text-lime-400">
                  Tanpa Alat
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Penguatan otot kaki, tendon Achilles, anti-shin splints &amp; core
              </p>
            </div>
          </div>
          <span className="shrink-0 font-mono text-xs text-slate-400">
            {tueDone}/{TUESDAY_CALISTHENICS.length} Selesai
          </span>
        </div>

        <div className="divide-y divide-slate-800/60 p-2 sm:p-3">
          {TUESDAY_CALISTHENICS.map((item) => {
            const isChecked = Boolean(checklist[item.id]);
            return (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-xl p-3 transition hover:bg-slate-800/40"
              >
                <label className="flex flex-1 cursor-pointer items-start gap-3">
                  <Checkbox
                    accent="lime"
                    checked={isChecked}
                    onCheckedChange={() =>
                      void programRepository.toggleWeeklyTask(item.id)
                    }
                    className="mt-0.5"
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-xs font-bold sm:text-sm ${
                          isChecked ? 'text-slate-500 line-through' : 'text-white'
                        }`}
                      >
                        {item.name}
                      </span>
                      <span className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-cyan-300">
                        {item.setsReps}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">{item.cue}</p>
                  </div>
                </label>

                {item.timerSec !== null && (
                  <button
                    type="button"
                    onClick={() =>
                      setTimerPreset(
                        item.timerSec!,
                        `${item.name} (${item.setsReps})`,
                        true,
                      )
                    }
                    className="flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-lime-400/30 bg-lime-400/15 px-2.5 py-1 font-mono text-[11px] font-semibold text-lime-300 transition hover:bg-lime-400 hover:text-slate-950"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    {item.timerSec} dtk
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SABTU: Sesi Kualitas */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 font-display font-bold text-cyan-400">
              SAB
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-display text-base font-bold text-white">
                  Sabtu Pagi/Sore — Sesi Kualitas (Speed &amp; Cadence)
                </h4>
                <span className="rounded border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 font-mono text-[10px] text-cyan-400">
                  Kuartal {activeQuarterPlan.id}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Latihan efisiensi langkah, ritme napas, dan kecepatan
              </p>
            </div>
          </div>
          <span className="shrink-0 font-mono text-xs text-slate-400">
            {satDone}/{activeQuarterPlan.saturdayTasks.length} Selesai
          </span>
        </div>

        <div className="divide-y divide-slate-800/60 p-2 sm:p-3">
          {activeQuarterPlan.saturdayTasks.map((task) => {
            const isChecked = Boolean(checklist[task.id]);
            return (
              <label
                key={task.id}
                className="flex cursor-pointer items-start gap-3 rounded-xl p-3 transition hover:bg-slate-800/40"
              >
                <Checkbox
                  accent="cyan"
                  checked={isChecked}
                  onCheckedChange={() => void programRepository.toggleWeeklyTask(task.id)}
                  className="mt-0.5"
                />
                <div>
                  <span
                    className={`block text-xs font-bold sm:text-sm ${
                      isChecked ? 'text-slate-500 line-through' : 'text-white'
                    }`}
                  >
                    {task.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-400">{task.desc}</span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* MINGGU: Sesi Long Run */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-400/10 font-display font-bold text-emerald-400">
              MIN
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-display text-base font-bold text-white">
                  Minggu Pagi — Sesi Long Run (Endurance)
                </h4>
                <span className="rounded border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 font-mono text-[10px] text-emerald-400">
                  Kuartal {activeQuarterPlan.id}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Fondasi aerobik Zona 2/3 &amp; adaptasi ketahanan jarak
              </p>
            </div>
          </div>
          <span className="shrink-0 font-mono text-xs text-slate-400">
            {sunDone}/{activeQuarterPlan.sundayTasks.length} Selesai
          </span>
        </div>

        <div className="divide-y divide-slate-800/60 p-2 sm:p-3">
          {activeQuarterPlan.sundayTasks.map((task) => {
            const isChecked = Boolean(checklist[task.id]);
            return (
              <label
                key={task.id}
                className="flex cursor-pointer items-start gap-3 rounded-xl p-3 transition hover:bg-slate-800/40"
              >
                <Checkbox
                  accent="emerald"
                  checked={isChecked}
                  onCheckedChange={() => void programRepository.toggleWeeklyTask(task.id)}
                  className="mt-0.5"
                />
                <div>
                  <span
                    className={`block text-xs font-bold sm:text-sm ${
                      isChecked ? 'text-slate-500 line-through' : 'text-white'
                    }`}
                  >
                    {task.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-400">{task.desc}</span>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
