import { appDb } from '@/core/database/app_database';
import type {
  ActivityRoute,
  ParsedRunBundle,
  RunActivity,
  UpsertSummary,
} from '@/features/activities/domain/entities/activity';

/**
 * Repository Aktivitas Lari (Data Layer -> Dexie IndexedDB).
 * Analogi Flutter: `ActivityRepositoryImpl` yang berkomunikasi dengan Isar/Drift.
 *
 * Keunggulan:
 * - Memakai transaksi atomik `appDb.transaction('rw', ...)` sehingga kalau terjadi error
 *   di tengah proses batch import, database tidak akan korup/setengah tersimpan.
 * - Anti-duplikasi otomatis menggunakan primary key `stravaActivityId`.
 */
export const activityRepository = {
  /**
   * Upsert massal (insert baru atau update data lama) untuk daftar hasil parsing Strava.
   * Jika record lama sudah punya rute GPX dan data baru hanya ringkasan CSV,
   * koordinat GPX lama tetap dipertahankan agar tidak hilang!
   */
  async upsertBatch(bundles: ParsedRunBundle[]): Promise<UpsertSummary> {
    if (bundles.length === 0) {
      return { added: 0, updated: 0, skipped: 0 };
    }

    let added = 0;
    let updated = 0;
    let skipped = 0;

    await appDb.transaction('rw', appDb.activities, appDb.activityRoutes, async () => {
      const ids = bundles.map((b) => b.activity.stravaActivityId);
      const existingList = await appDb.activities.bulkGet(ids);
      const existingMap = new Map<string, RunActivity>();

      for (const item of existingList) {
        if (item) existingMap.set(item.stravaActivityId, item);
      }

      const activitiesToPut: RunActivity[] = [];
      const routesToPut: ActivityRoute[] = [];
      const seenInCurrentBatch = new Set<string>();

      for (const bundle of bundles) {
        const id = bundle.activity.stravaActivityId;
        if (!id || bundle.activity.distanceKm <= 0.05) {
          skipped++;
          continue;
        }

        const existing = existingMap.get(id);
        const isUpdate = Boolean(existing) || seenInCurrentBatch.has(id);
        seenInCurrentBatch.add(id);

        if (isUpdate) {
          updated++;
        } else {
          added++;
        }

        const mergedActivity: RunActivity = {
          ...(existing ?? {}),
          ...bundle.activity,
          hasGpx: bundle.activity.hasGpx || Boolean(existing?.hasGpx),
          splits:
            bundle.activity.splits.length > 0
              ? bundle.activity.splits
              : (existing?.splits ?? []),
          updatedAt: new Date().toISOString(),
        };

        activitiesToPut.push(mergedActivity);

        if (bundle.coords.length > 1) {
          routesToPut.push({
            stravaActivityId: id,
            coords: bundle.coords,
            pointCount: bundle.coords.length,
            updatedAt: new Date().toISOString(),
          });
        }
      }

      if (activitiesToPut.length > 0) {
        await appDb.activities.bulkPut(activitiesToPut);
      }
      if (routesToPut.length > 0) {
        await appDb.activityRoutes.bulkPut(routesToPut);
      }
    });

    return { added, updated, skipped };
  },

  /** Menambah 1 aktivitas manual (tanpa koordinat GPX) */
  async upsertSingle(bundle: ParsedRunBundle): Promise<UpsertSummary> {
    return this.upsertBatch([bundle]);
  },

  /** Lazy-load koordinat rute GPX hanya ketika modal detail dibuka */
  async getRouteById(stravaActivityId: string): Promise<ActivityRoute | undefined> {
    return appDb.activityRoutes.get(stravaActivityId);
  },

  /** Hapus 1 aktivitas beserta koordinat rutenya secara atomik */
  async deleteById(stravaActivityId: string): Promise<void> {
    await appDb.transaction('rw', appDb.activities, appDb.activityRoutes, async () => {
      await appDb.activities.delete(stravaActivityId);
      await appDb.activityRoutes.delete(stravaActivityId);
    });
  },

  /** Ambil seluruh data (digunakan saat Export Backup JSON) */
  async getAllForBackup(includeRoutes: boolean): Promise<{
    activities: RunActivity[];
    routes: ActivityRoute[];
  }> {
    const activities = await appDb.activities.orderBy('dateIso').reverse().toArray();
    const routes = includeRoutes ? await appDb.activityRoutes.toArray() : [];
    return { activities, routes };
  },

  /** Mengosongkan tabel aktivitas & rute (dipakai saat Reset Semua Data) */
  async clearAll(): Promise<void> {
    await appDb.transaction('rw', appDb.activities, appDb.activityRoutes, async () => {
      await appDb.activities.clear();
      await appDb.activityRoutes.clear();
    });
  },
};
