import { XMLParser } from 'fast-xml-parser';
import { downsampleCoords, haversineMeters } from '@/core/utils/running_math';
import type {
  ActivitySplit,
  GeoPoint,
  ParsedRunBundle,
} from '@/features/activities/domain/entities/activity';

/**
 * Parser GPX XML non-DOM menggunakan `fast-xml-parser`.
 *
 * KENAPA TIDAK PAKAI `DOMParser` SEPERTI PROTOTYPE HTML?
 * Karena parser ini berjalan di dalam Web Worker (background thread, mirip Isolate Flutter).
 * Di dalam Web Worker tidak ada objek `window` maupun `DOMParser`.
 * `fast-xml-parser` murni JavaScript, sangat cepat, dan 100% aman di Web Worker!
 */

const gpxXmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseAttributeValue: false,
  parseTagValue: false,
  trimValues: true,
  // Paksa tag ini selalu berbentuk array meskipun hanya ada 1 elemen di dalam GPX
  isArray: (tagName) =>
    tagName === 'trk' ||
    tagName === 'trkseg' ||
    tagName === 'trkpt' ||
    tagName === 'rte' ||
    tagName === 'rtept',
});

interface RawTrackPoint {
  '@_lat'?: string;
  '@_lon'?: string;
  ele?: string | number;
  time?: string;
}

interface RawGpxDoc {
  gpx?: {
    metadata?: { name?: string };
    trk?: Array<{
      name?: string;
      trkseg?: Array<{
        trkpt?: RawTrackPoint[];
      }>;
    }>;
    rte?: Array<{
      name?: string;
      rtept?: RawTrackPoint[];
    }>;
  };
}

export function parseGpxXmlString(
  xmlString: string,
  fallbackName = 'Sesi Lari GPX',
  sourceFileName?: string,
): ParsedRunBundle | null {
  let doc: RawGpxDoc;
  try {
    doc = gpxXmlParser.parse(xmlString) as RawGpxDoc;
  } catch (err) {
    console.warn('[GPX Parser] XML tidak valid:', err);
    return null;
  }

  const gpxRoot = doc?.gpx;
  if (!gpxRoot) return null;

  // Ambil nama sesi dari <trk><name> atau <metadata><name>
  const firstTrack = gpxRoot.trk?.[0];
  const gpxName =
    firstTrack?.name?.toString().trim() ||
    gpxRoot.metadata?.name?.toString().trim() ||
    fallbackName;

  // Kumpulkan seluruh titik koordinat dari semua <trk><trkseg><trkpt>
  const points: RawTrackPoint[] = [];
  if (gpxRoot.trk) {
    for (const track of gpxRoot.trk) {
      for (const seg of track.trkseg ?? []) {
        if (seg.trkpt) {
          points.push(...seg.trkpt);
        }
      }
    }
  }

  // Fallback jika file GPX memakai tag <rte><rtept>
  if (points.length === 0 && gpxRoot.rte) {
    for (const route of gpxRoot.rte) {
      if (route.rtept) {
        points.push(...route.rtept);
      }
    }
  }

  if (points.length < 2) return null;

  let totalDistMeters = 0;
  let movingTimeSec = 0;
  let totalElapsedSec = 0;
  let elevationGain = 0;

  const rawCoords: GeoPoint[] = [];
  const splits: ActivitySplit[] = [];

  let currentKmIndex = 1;
  let kmAccumDist = 0;
  let kmAccumTime = 0;
  let kmStartEle: number | null = null;

  let prevLat: number | null = null;
  let prevLon: number | null = null;
  let prevEle: number | null = null;
  let prevTimeMs: number | null = null;
  let firstTimeIso: string | null = null;

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    const lat = Number.parseFloat(pt['@_lat'] ?? '');
    const lon = Number.parseFloat(pt['@_lon'] ?? '');
    if (Number.isNaN(lat) || Number.isNaN(lon)) continue;

    const eleParsed = pt.ele !== undefined ? Number.parseFloat(String(pt.ele)) : Number.NaN;
    const ele = Number.isNaN(eleParsed) ? null : eleParsed;

    const timeMs = pt.time ? new Date(String(pt.time).trim()).getTime() : Number.NaN;
    const validTimeMs = Number.isNaN(timeMs) ? null : timeMs;

    if (!firstTimeIso && validTimeMs !== null) {
      firstTimeIso = new Date(validTimeMs).toISOString();
    }

    rawCoords.push([Number(lat.toFixed(5)), Number(lon.toFixed(5))]);

    if (prevLat !== null && prevLon !== null) {
      const segDist = haversineMeters(prevLat, prevLon, lat, lon);
      let segTime = 0;

      if (prevTimeMs !== null && validTimeMs !== null && validTimeMs > prevTimeMs) {
        segTime = (validTimeMs - prevTimeMs) / 1000;
        totalElapsedSec += segTime;
      } else {
        // Fallback jika GPX tanpa timestamp: asumsi pace 7:30/km (0.45 detik/meter)
        segTime = segDist * 0.45;
      }

      // Filter berhenti / auto-pause: kecepatan < 0.5 m/s atau jeda > 300 detik tidak dihitung moving time
      const speedMps = segTime > 0 ? segDist / segTime : 0;
      const isMoving = segTime > 0 && speedMps >= 0.5 && segTime <= 300;

      if (isMoving || prevTimeMs === null) {
        totalDistMeters += segDist;
        movingTimeSec += segTime;
        kmAccumDist += segDist;
        kmAccumTime += segTime;
      }

      // Filter noise elevasi GPS: hanya hitung kenaikan antara 0.3m - 25m antar titik
      if (ele !== null && prevEle !== null) {
        const dEle = ele - prevEle;
        if (dEle > 0.3 && dEle < 25) {
          elevationGain += dEle;
        }
      }

      if (kmStartEle === null && ele !== null) {
        kmStartEle = ele;
      }

      // Setiap akumulasi menembus 1.000 meter -> catat split per kilometer
      while (kmAccumDist >= 1000) {
        const ratio = 1000 / kmAccumDist;
        const splitTime = Math.round(kmAccumTime * ratio);
        const eleDelta =
          ele !== null && kmStartEle !== null ? Math.round(ele - kmStartEle) : 0;

        splits.push({
          km: currentKmIndex,
          distanceKm: 1.0,
          timeSec: splitTime,
          paceSecPerKm: splitTime,
          eleDelta,
        });

        currentKmIndex++;
        kmAccumDist -= 1000;
        kmAccumTime = kmAccumTime * (1 - ratio);
        kmStartEle = ele;
      }
    } else if (ele !== null) {
      kmStartEle = ele;
    }

    prevLat = lat;
    prevLon = lon;
    if (ele !== null) prevEle = ele;
    if (validTimeMs !== null) prevTimeMs = validTimeMs;
  }

  // Catat segmen terakhir yang parsial jika >= 100 meter
  if (kmAccumDist >= 100 && kmAccumTime > 5) {
    const partialKm = Number((kmAccumDist / 1000).toFixed(2));
    const paceSec = Math.round(kmAccumTime / partialKm);
    const eleDelta =
      prevEle !== null && kmStartEle !== null ? Math.round(prevEle - kmStartEle) : 0;

    splits.push({
      km: Number((currentKmIndex - 1 + partialKm).toFixed(2)),
      distanceKm: partialKm,
      timeSec: Math.round(kmAccumTime),
      paceSecPerKm: paceSec,
      eleDelta,
      isPartial: true,
    });
  }

  const distanceKm = totalDistMeters / 1000;
  if (movingTimeSec <= 0 && totalElapsedSec > 0) {
    movingTimeSec = totalElapsedSec;
  }
  const paceSecPerKm = distanceKm > 0 ? Math.round(movingTimeSec / distanceKm) : 0;

  // Simpan hingga 600 titik koordinat di IndexedDB (tajam di Leaflet & hemat storage)
  const optimizedCoords = downsampleCoords(rawCoords, 600);
  const dateIso = firstTimeIso ?? new Date().toISOString();
  const stravaActivityId = `gpx_${new Date(dateIso).getTime()}_${Math.round(totalDistMeters)}`;
  const nowIso = new Date().toISOString();

  return {
    activity: {
      stravaActivityId,
      name: gpxName,
      dateIso,
      distanceKm: Number(distanceKm.toFixed(2)),
      movingTimeSec: Math.round(movingTimeSec),
      paceSecPerKm,
      elevationGain: Math.round(elevationGain),
      hasGpx: optimizedCoords.length > 1,
      sourceFile: sourceFileName ?? `${fallbackName}.gpx`,
      splits,
      updatedAt: nowIso,
    },
    coords: optimizedCoords,
  };
}
