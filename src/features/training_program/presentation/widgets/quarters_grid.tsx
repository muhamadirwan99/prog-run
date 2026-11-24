import { CircleDot } from 'lucide-react';
import { QUARTERS_CONFIG, type QuarterId } from '@/core/constants/training_plan';
import { Checkbox } from '@/core/ui/checkbox';
import { useActivityUiStore } from '@/features/activities/presentation/state/use_activity_ui_store';
import { programRepository } from '@/features/training_program/data/repositories/program_repository';
import type { ProgramState } from '@/features/training_program/domain/entities/program_state';

/**
 * Grid 4 Kartu Periodisasi Kuartal (Bulan 1-12) beserta checkbox 3 milestone per kuartal.
 */
export function QuartersGrid({ programState }: { programState: ProgramState }) {
  const showToast = useActivityUiStore((s) => s.showToast);

  async function handleSelectQuarter(quarterId: QuarterId) {
    if (programState.activeQuarter === quarterId) return;
    await programRepository.setActiveQuarter(quarterId);
    showToast(
      `Kuartal ${quarterId} diaktifkan. Jadwal Sabtu & Minggu telah disesuaikan.`,
      'info',
    );
  }

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {QUARTERS_CONFIG.map((q) => {
        const isActive = q.id === programState.activeQuarter;
        const mStates = programState.quarterMilestones[q.id] ?? [false, false, false];
        const completedCount = mStates.filter(Boolean).length;

        return (
          <div
            key={q.id}
            className={`flex flex-col justify-between rounded-2xl border p-5 transition-all ${
              isActive
                ? 'border-lime-400 bg-slate-900 ring-1 ring-lime-400/50'
                : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase ${
                    isActive
                      ? 'bg-lime-400 text-slate-950'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Kuartal {q.id} • {q.months}
                </span>

                {isActive ? (
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] text-lime-400">
                    <CircleDot className="h-3.5 w-3.5" />
                    Aktif
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleSelectQuarter(q.id)}
                    className="cursor-pointer font-mono text-[11px] text-cyan-400 hover:underline"
                  >
                    Aktifkan
                  </button>
                )}
              </div>

              <div>
                <h3 className="font-display text-base font-bold text-white">{q.title}</h3>
                <p className="mt-0.5 font-mono text-xs text-emerald-400">
                  {q.targetBadge}
                </p>
              </div>

              <p className="text-xs leading-relaxed text-slate-400">{q.description}</p>

              {/* Milestone Checklist */}
              <div className="space-y-2 border-t border-slate-800/80 pt-2">
                <div className="flex items-center justify-between font-mono text-[11px] text-slate-400">
                  <span>Milestone Kuartal {q.id}</span>
                  <span>{completedCount}/3</span>
                </div>

                {q.milestones.map((mText, idx) => {
                  const mIdx = idx as 0 | 1 | 2;
                  const checked = Boolean(mStates[mIdx]);
                  return (
                    <label
                      key={mText}
                      className="group flex cursor-pointer items-start gap-2.5"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() =>
                          void programRepository.toggleQuarterMilestone(q.id, mIdx)
                        }
                        className="mt-0.5"
                      />
                      <span
                        className={`text-xs ${
                          checked
                            ? 'text-slate-500 line-through'
                            : 'text-slate-200 group-hover:text-white'
                        }`}
                      >
                        {mText}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 border-t border-slate-800/80 pt-3">
              <button
                type="button"
                disabled={isActive}
                onClick={() => void handleSelectQuarter(q.id)}
                className={`w-full rounded-xl px-3 py-2 text-xs font-bold transition ${
                  isActive
                    ? 'cursor-default border border-lime-400/40 bg-lime-400/15 text-lime-300'
                    : 'cursor-pointer bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                {isActive
                  ? 'Sedang Menjadi Fokus Latihan'
                  : `Pilih Kuartal ${q.id} Sebagai Aktif`}
              </button>
            </div>
          </div>
        );
      })}
    </section>
  );
}
