import type { QuarterId } from '@/core/constants/training_plan';
import { appDb } from '@/core/database/app_database';
import {
  createDefaultProgramState,
  type ProgramState,
} from '@/features/training_program/domain/entities/program_state';

/**
 * Repository Program Latihan 1 Tahun & Checklist Mingguan (Dexie `programSettings`).
 * Analogi Flutter: `ProgramRepositoryImpl`.
 */
export const programRepository = {
  async getOrCreate(): Promise<ProgramState> {
    const existing = await appDb.programSettings.get('default');
    if (existing) return existing;
    const initial = createDefaultProgramState();
    await appDb.programSettings.put(initial);
    return initial;
  },

  async setActiveQuarter(quarterId: QuarterId): Promise<void> {
    const current = await this.getOrCreate();
    await appDb.programSettings.put({
      ...current,
      activeQuarter: quarterId,
      updatedAt: new Date().toISOString(),
    });
  },

  async toggleQuarterMilestone(quarterId: QuarterId, index: 0 | 1 | 2): Promise<void> {
    const current = await this.getOrCreate();
    const prevArr = current.quarterMilestones[quarterId] ?? [false, false, false];
    const nextArr: [boolean, boolean, boolean] = [...prevArr] as [
      boolean,
      boolean,
      boolean,
    ];
    nextArr[index] = !nextArr[index];

    await appDb.programSettings.put({
      ...current,
      quarterMilestones: {
        ...current.quarterMilestones,
        [quarterId]: nextArr,
      },
      updatedAt: new Date().toISOString(),
    });
  },

  async toggleWeeklyTask(taskId: string): Promise<void> {
    const current = await this.getOrCreate();
    await appDb.programSettings.put({
      ...current,
      weeklyChecklist: {
        ...current.weeklyChecklist,
        [taskId]: !current.weeklyChecklist[taskId],
      },
      updatedAt: new Date().toISOString(),
    });
  },

  async resetWeeklyChecklist(): Promise<void> {
    const current = await this.getOrCreate();
    await appDb.programSettings.put({
      ...current,
      weeklyChecklist: {},
      updatedAt: new Date().toISOString(),
    });
  },

  async saveFullState(next: Omit<ProgramState, 'id' | 'updatedAt'>): Promise<void> {
    await appDb.programSettings.put({
      id: 'default',
      ...next,
      updatedAt: new Date().toISOString(),
    });
  },

  async resetAll(): Promise<void> {
    await appDb.programSettings.put(createDefaultProgramState());
  },
};
