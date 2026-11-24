/**
 * Domain Entities untuk fitur Aktivitas Lari.
 * Analogi Flutter: mirip class entity / model dengan `@freezed` di `domain/entities/`.
 *
 * Arsitektur Optimal Database:
 * Kita memisahkan `RunActivity` (ringkasan ringan untuk tabel & grafik dashboard)
 * dengan `ActivityRoute` (array koordinat GPS berat untuk peta Leaflet di modal).
 */

/** Pasangan koordinat GPS [latitude, longitude] */
export type GeoPoint = [number, number];

/** Split performa per 1 kilometer (atau segmen terakhir yang parsial) */
export interface ActivitySplit {
  km: number | string;
  distanceKm: number;
  timeSec: number;
  paceSecPerKm: number;
  eleDelta: number;
  isPartial?: boolean;
}

/**
 * Ringkasan aktivitas lari yang disimpan di tabel `activities` (Dexie IndexedDB).
 * Kunci unik = `stravaActivityId` (untuk anti-duplikasi saat re-import arsip Strava).
 */
export interface RunActivity {
  stravaActivityId: string;
  name: string;
  dateIso: string;
  distanceKm: number;
  movingTimeSec: number;
  paceSecPerKm: number;
  elevationGain: number;
  hasGpx: boolean;
  sourceFile: string;
  splits: ActivitySplit[];
  updatedAt: string;
}

/**
 * Data koordinat rute GPS yang disimpan terpisah di tabel `activityRoutes`.
 * Hanya dimuat dari IndexedDB ketika pengguna membuka modal detail aktivitas.
 */
export interface ActivityRoute {
  stravaActivityId: string;
  coords: GeoPoint[];
  pointCount: number;
  updatedAt: string;
}

/**
 * Payload gabungan hasil parsing dari Web Worker sebelum dipecah ke 2 tabel Dexie.
 */
export interface ParsedRunBundle {
  activity: RunActivity;
  coords: GeoPoint[];
}

export interface UpsertSummary {
  added: number;
  updated: number;
  skipped: number;
}
