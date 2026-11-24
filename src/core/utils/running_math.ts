import type { ActivitySplit, GeoPoint } from '@/features/activities/domain/entities/activity';

/**
 * Pure math utilities untuk perhitungan lari & GPS.
 * Aman dijalankan di Main Thread maupun di dalam Web Worker (tidak pakai DOM/window).
 */

/**
 * Menghitung jarak antara 2 titik koordinat bumi dalam meter menggunakan rumus Haversine.
 * Dipakai saat menghitung jarak tempuh & split per km dari trackpoint GPX.
 */
export function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const EARTH_RADIUS_M = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

/**
 * Rumus Prediksi Waktu 10K Pete Riegel:
 *   T2 = T1 * (10 / D1)^1.06
 * Mengembalikan estimasi waktu finish 10 km dalam detik, atau null jika jarak < 1.5 km.
 */
export function calculateRiegel10kSeconds(
  distanceKm: number,
  movingTimeSec: number,
): number | null {
  if (!distanceKm || distanceKm < 1.5 || !movingTimeSec || movingTimeSec <= 0) {
    return null;
  }
  return movingTimeSec * Math.pow(10.0 / distanceKm, 1.06);
}

/**
 * Menyederhanakan titik rute GPX supaya rendering polyline Leaflet tetap mulus
 * di HP/desktop tanpa membuang detail tikungan (maxPoints default 600 — jauh lebih tajam
 * dibanding prototype HTML yang terbatas 260 titik karena limit localStorage).
 */
export function downsampleCoords(coords: GeoPoint[], maxPoints = 600): GeoPoint[] {
  if (!coords || coords.length <= maxPoints) return coords;
  const step = (coords.length - 1) / (maxPoints - 1);
  const result: GeoPoint[] = [];
  for (let i = 0; i < maxPoints - 1; i++) {
    result.push(coords[Math.round(i * step)]);
  }
  result.push(coords[coords.length - 1]);
  return result;
}

/**
 * Membuat estimasi split per km merata untuk aktivitas yang tidak memiliki file GPX
 * (misalnya lari treadmill, input manual, atau ringkasan CSV tanpa koordinat).
 */
export function generateSyntheticSplits(
  distanceKm: number,
  movingTimeSec: number,
  totalEle = 0,
): ActivitySplit[] {
  const splits: ActivitySplit[] = [];
  if (distanceKm <= 0 || movingTimeSec <= 0) return splits;

  const avgPace = movingTimeSec / distanceKm;
  const fullKms = Math.floor(distanceKm);
  const remainder = Number((distanceKm - fullKms).toFixed(2));

  for (let k = 1; k <= fullKms; k++) {
    splits.push({
      km: k,
      distanceKm: 1.0,
      timeSec: Math.round(avgPace),
      paceSecPerKm: Math.round(avgPace),
      eleDelta: Math.round(totalEle / Math.max(1, distanceKm)),
    });
  }

  if (remainder >= 0.1) {
    splits.push({
      km: Number(distanceKm.toFixed(2)),
      distanceKm: remainder,
      timeSec: Math.round(avgPace * remainder),
      paceSecPerKm: Math.round(avgPace),
      eleDelta: 0,
      isPartial: true,
    });
  }

  return splits;
}
