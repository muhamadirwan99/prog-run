import type { QuarterId } from '@/core/constants/training_plan';

/**
 * Domain Entity untuk progres Program Latihan 1 Tahun & Checklist Mingguan.
 * Disimpan sebagai 1 record singleton (`id: 'default'`) di tabel Dexie `programSettings`.
 */
export interface ProgramState {
  id: 'default';
  activeQuarter: QuarterId;
  /** Status 3 milestone per kuartal (key 1..4) */
  quarterMilestones: Record<QuarterId, [boolean, boolean, boolean]>;
  /** Status centang checklist mingguan (key = task.id, value = sudah/belum) */
  weeklyChecklist: Record<string, boolean>;
  updatedAt: string;
}

export function createDefaultProgramState(): ProgramState {
  return {
    id: 'default',
    activeQuarter: 1,
    quarterMilestones: {
      1: [false, false, false],
      2: [false, false, false],
      3: [false, false, false],
      4: [false, false, false],
    },
    weeklyChecklist: {},
    updatedAt: new Date().toISOString(),
  };
}
