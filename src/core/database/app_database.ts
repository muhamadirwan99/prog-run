import Dexie, { type EntityTable } from 'dexie';
import type {
  ActivityRoute,
  RunActivity,
} from '@/features/activities/domain/entities/activity';
import type { ProgramState } from '@/features/training_program/domain/entities/program_state';

/**
 * Konfigurasi Database Lokal IndexedDB menggunakan Dexie.js.
 *
 * Analogi Flutter:
 * - Dexie class ini persis seperti `Isar` / `Drift AppDatabase` / `Hive Box`.
 * - IndexedDB tidak kena batas 5 MB seperti `localStorage` (bisa ratusan MB).
 *
 * Strategi Skema Optimal (Normalisasi Ringan):
 * 1. `activities`      -> Menyimpan ringkasan metrik + splits (~1 KB/sesi).
 *                         Cepat sekali di-query untuk KPI, Grafik, dan Tabel Riwayat.
 * 2. `activityRoutes`  -> Menyimpan array koordinat GPX ([lat, lon][]).
 *                         Dipisah agar dashboard TIDAK perlu meload ribuan koordinat GPS ke RAM!
 *                         Koordinat hanya diambil (lazy-load) saat user mengklik aktivitas.
 * 3. `programSettings` -> Menyimpan kuartal aktif, milestone, & checklist mingguan.
 *
 * Cara migrasi jika nanti kamu menambah kolom indeks baru:
 * Naikkan `this.version(2).stores({ ... })` tanpa menghapus blok `version(1)`.
 */
class RoadTo10kDatabase extends Dexie {
  activities!: EntityTable<RunActivity, 'stravaActivityId'>;
  activityRoutes!: EntityTable<ActivityRoute, 'stravaActivityId'>;
  programSettings!: EntityTable<ProgramState, 'id'>;

  constructor() {
    super('RoadTo10kSub60DB');

    this.version(1).stores({
      // Kunci primer di depan (stravaActivityId), diikuti kolom yang sering difilter/diurutkan
      activities: 'stravaActivityId, dateIso, distanceKm, paceSecPerKm, hasGpx',
      // Hanya butuh primary key karena lookup selalu berdasarkan stravaActivityId
      activityRoutes: 'stravaActivityId',
      // Singleton record dengan id = 'default'
      programSettings: 'id',
    });
  }
}

/** Singleton instance database (mirip GetIt.I<AppDatabase>() di Flutter) */
export const appDb = new RoadTo10kDatabase();
