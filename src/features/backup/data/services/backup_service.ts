import type { QuarterId } from '@/core/constants/training_plan';
import { activityRepository } from '@/features/activities/data/repositories/activity_repository';
import type {
  GeoPoint,
  ParsedRunBundle,
  UpsertSummary,
} from '@/features/activities/domain/entities/activity';
import { backupFileSchema } from '@/features/backup/domain/schemas/backup_schema';
import { programRepository } from '@/features/training_program/data/repositories/program_repository';

/**
 * Service Export/Import Backup `.json` tervalidasi Zod + Reset Database Lokal.
 * Analogi Flutter: `BackupService` di `data/services/`.
 */
export const backupService = {
  /** Mengunduh seluruh database lokal sebagai file `.json` */
  async exportToJsonFile(includeRoutes = true): Promise<void> {
    const [{ activities, routes }, programState] = await Promise.all([
      activityRepository.getAllForBackup(includeRoutes),
      programRepository.getOrCreate(),
    ]);

    const payload = {
      app: 'Road to 10K Sub-60 Tracker',
      version: 2 as const,
      exportedAt: new Date().toISOString(),
      includesRoutes: includeRoutes,
      activities,
      routes: includeRoutes ? routes : [],
      programState: {
        activeQuarter: programState.activeQuarter,
        quarterMilestones: programState.quarterMilestones,
        weeklyChecklist: programState.weeklyChecklist,
      },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const dateStamp = new Date().toISOString().split('T')[0];
    const suffix = includeRoutes ? 'full' : 'ringkas';

    const a = document.createElement('a');
    a.href = url;
    a.download = `road_to_10k_backup_${suffix}_${dateStamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  /**
   * Memvalidasi file `.json` menggunakan Zod lalu memulihkannya ke Dexie IndexedDB.
   * Mendukung file backup v2 (baru) maupun v1 (dari prototype HTML sebelumnya).
   */
  async importFromJsonFile(file: File): Promise<UpsertSummary> {
    const rawText = await file.text();
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawText);
    } catch {
      throw new Error('File bukan format JSON yang valid.');
    }

    const validation = backupFileSchema.safeParse(parsedJson);
    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      const fieldPath = firstIssue?.path.join('.') || 'root';
      throw new Error(
        `Struktur backup tidak valid pada "${fieldPath}": ${firstIssue?.message ?? 'skema tidak sesuai'}`,
      );
    }

    const data = validation.data;

    // Map tabel routes v2 untuk lookup cepat berdasarkan stravaActivityId
    const routeLookup = new Map<string, GeoPoint[]>();
    for (const r of data.routes ?? []) {
      routeLookup.set(r.stravaActivityId, r.coords);
    }

    const bundles: ParsedRunBundle[] = data.activities.map((item) => {
      const stravaActivityId = item.stravaActivityId ?? String(item.id);
      const coords = routeLookup.get(stravaActivityId) ?? item.coords ?? [];

      return {
        activity: {
          stravaActivityId,
          name: item.name,
          dateIso: item.dateIso,
          distanceKm: item.distanceKm,
          movingTimeSec: item.movingTimeSec,
          paceSecPerKm: item.paceSecPerKm,
          elevationGain: item.elevationGain,
          hasGpx: item.hasGpx || coords.length > 1,
          sourceFile: item.sourceFile,
          splits: item.splits,
          updatedAt: item.updatedAt ?? new Date().toISOString(),
        },
        coords,
      };
    });

    const summary = await activityRepository.upsertBatch(bundles);

    if (data.programState) {
      const existingProg = await programRepository.getOrCreate();
      const mergedMilestones = { ...existingProg.quarterMilestones };

      if (data.programState.quarterMilestones) {
        for (const qKey of [1, 2, 3, 4] as QuarterId[]) {
          const fromFile = data.programState.quarterMilestones[String(qKey)];
          if (fromFile) {
            mergedMilestones[qKey] = fromFile;
          }
        }
      }

      await programRepository.saveFullState({
        activeQuarter: data.programState.activeQuarter,
        quarterMilestones: mergedMilestones,
        weeklyChecklist: data.programState.weeklyChecklist ?? existingProg.weeklyChecklist,
      });
    }

    return summary;
  },

  /** Menghapus semua aktivitas, rute GPX, dan mengembalikan program ke default */
  async resetAllLocalData(): Promise<void> {
    await Promise.all([
      activityRepository.clearAll(),
      programRepository.resetAll(),
    ]);
  },
};
