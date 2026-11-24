import JSZip from 'jszip';
import { gzip } from 'pako';
import type {
  ActivitySplit,
  GeoPoint,
  ParsedRunBundle,
} from '@/features/activities/domain/entities/activity';

/**
 * Generator data simulasi progres lari (4 km @ 9:55/km -> 8.5 km @ 6:14/km)
 * serta pembuat file `.zip` berformat Strava Bulk Export asli untuk pengujian Drag & Drop.
 */

function generateLoopCoords(
  centerLat: number,
  centerLon: number,
  radiusLat: number,
  radiusLon: number,
  numPoints: number,
  loops = 1,
): GeoPoint[] {
  const coords: GeoPoint[] = [];
  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * (Math.PI * 2 * loops);
    const jitterLat = Math.sin(i * 0.7) * 0.00012;
    const jitterLon = Math.cos(i * 0.9) * 0.00012;
    coords.push([
      Number((centerLat + Math.sin(angle) * radiusLat + jitterLat).toFixed(5)),
      Number((centerLon + Math.cos(angle) * radiusLon + jitterLon).toFixed(5)),
    ]);
  }
  return coords;
}

export function createDemoRunBundles(): ParsedRunBundle[] {
  const now = new Date();
  const daysAgo = (days: number) => {
    const dt = new Date(now);
    dt.setDate(dt.getDate() - days);
    dt.setHours(6, 15, 0, 0);
    return dt.toISOString();
  };

  const gbkRingCoords = generateLoopCoords(-6.2186, 106.8025, 0.0038, 0.0042, 95, 2);
  const monasLoopCoords = generateLoopCoords(-6.1754, 106.8272, 0.0046, 0.0048, 110, 2);
  const suropatiCoords = generateLoopCoords(-6.1993, 106.8326, 0.0032, 0.0055, 100, 2);
  const cfdSudirmanCoords = generateLoopCoords(-6.2088, 106.822, 0.011, 0.0022, 130, 1);

  const rawSessions = [
    {
      id: 'demo_strava_1001',
      name: 'Baseline Run Awal — Keliling Luar GBK Senayan',
      dateIso: daysAgo(72),
      distanceKm: 4.02,
      movingTimeSec: 2392,
      elevationGain: 14,
      coords: gbkRingCoords,
    },
    {
      id: 'demo_strava_1002',
      name: 'Easy Run Adaptasi Impak Aspal — Monas Loop',
      dateIso: daysAgo(65),
      distanceKm: 4.35,
      movingTimeSec: 2497,
      elevationGain: 16,
      coords: monasLoopCoords,
    },
    {
      id: 'demo_strava_1003',
      name: 'Long Run Minggu — Tembus 5K Perdana Nonstop!',
      dateIso: daysAgo(58),
      distanceKm: 5.05,
      movingTimeSec: 2777,
      elevationGain: 21,
      coords: gbkRingCoords,
    },
    {
      id: 'demo_strava_1004',
      name: 'Sesi Kualitas Cadence Drill — Taman Suropati Menteng',
      dateIso: daysAgo(51),
      distanceKm: 4.6,
      movingTimeSec: 2364,
      elevationGain: 18,
      coords: suropatiCoords,
    },
    {
      id: 'demo_strava_1005',
      name: 'Easy Aerobic Run — CFD Sudirman Thamrin',
      dateIso: daysAgo(44),
      distanceKm: 5.4,
      movingTimeSec: 2673,
      elevationGain: 26,
      coords: cfdSudirmanCoords,
    },
    {
      id: 'demo_strava_1006',
      name: '5K Time Trial Kuartal 2 — Sub-40 Menit Tercapai!',
      dateIso: daysAgo(37),
      distanceKm: 5.02,
      movingTimeSec: 2334,
      elevationGain: 15,
      coords: gbkRingCoords,
    },
    {
      id: 'demo_strava_1007',
      name: 'Endurance Long Run — Monas ke Menteng Loop',
      dateIso: daysAgo(30),
      distanceKm: 6.5,
      movingTimeSec: 3042,
      elevationGain: 32,
      coords: monasLoopCoords,
    },
    {
      id: 'demo_strava_1008',
      name: 'Interval 6x400m & Speed Efisiensi — Track GBK',
      dateIso: daysAgo(24),
      distanceKm: 5.25,
      movingTimeSec: 2231,
      elevationGain: 12,
      coords: gbkRingCoords,
    },
    {
      id: 'demo_strava_1009',
      name: 'Progressive Long Run 7.5K — Sudirman Loop',
      dateIso: daysAgo(17),
      distanceKm: 7.54,
      movingTimeSec: 3280,
      elevationGain: 38,
      coords: cfdSudirmanCoords,
    },
    {
      id: 'demo_strava_1010',
      name: 'Tempo Run Ambang Laktat — Menteng Pagi',
      dateIso: daysAgo(11),
      distanceKm: 6.1,
      movingTimeSec: 2470,
      elevationGain: 24,
      coords: suropatiCoords,
    },
    {
      id: 'demo_strava_1011',
      name: 'Long Run Kuartal 3 — 8.5 KM Negative Split',
      dateIso: daysAgo(4),
      distanceKm: 8.52,
      movingTimeSec: 3340,
      elevationGain: 42,
      coords: cfdSudirmanCoords,
    },
    {
      id: 'demo_strava_1012',
      name: 'Sesi Kualitas Pace 6:15 — Simulasi Sub-60 GBK',
      dateIso: daysAgo(1),
      distanceKm: 6.4,
      movingTimeSec: 2394,
      elevationGain: 19,
      coords: gbkRingCoords,
    },
  ];

  const nowIso = new Date().toISOString();

  return rawSessions.map((sess) => {
    const paceSec = Math.round(sess.movingTimeSec / sess.distanceKm);
    const fullKms = Math.floor(sess.distanceKm);
    const rem = Number((sess.distanceKm - fullKms).toFixed(2));
    const splits: ActivitySplit[] = [];

    for (let k = 1; k <= fullKms; k++) {
      const progressFactor = (fullKms / 2 - k) * 3;
      const spSec = Math.round(paceSec + progressFactor + Math.sin(k * 1.7) * 4);
      splits.push({
        km: k,
        distanceKm: 1.0,
        timeSec: spSec,
        paceSecPerKm: spSec,
        eleDelta: Math.round(sess.elevationGain / fullKms + (k % 2 === 0 ? 2 : -1)),
      });
    }

    if (rem >= 0.1) {
      splits.push({
        km: sess.distanceKm,
        distanceKm: rem,
        timeSec: Math.round((paceSec - 6) * rem),
        paceSecPerKm: paceSec - 6,
        eleDelta: 1,
        isPartial: true,
      });
    }

    return {
      activity: {
        stravaActivityId: sess.id,
        name: sess.name,
        dateIso: sess.dateIso,
        distanceKm: sess.distanceKm,
        movingTimeSec: sess.movingTimeSec,
        paceSecPerKm: paceSec,
        elevationGain: sess.elevationGain,
        hasGpx: true,
        sourceFile: `activities/${sess.id}.gpx.gz`,
        splits,
        updatedAt: nowIso,
      },
      coords: sess.coords,
    };
  });
}

function buildSampleGpxXml(
  name: string,
  startIso: string,
  baseLat: number,
  baseLon: number,
  numSegments: number,
  paceSecPerKm: number,
): string {
  let ptsXml = '';
  const startMs = new Date(startIso).getTime();
  const secPer100m = paceSecPerKm / 10;

  for (let i = 0; i <= numSegments; i++) {
    const angle = (i / 25) * Math.PI * 2;
    const lat = baseLat + Math.sin(angle) * 0.0039;
    const lon = baseLon + Math.cos(angle) * 0.0039;
    const ele = (15 + Math.sin(i * 0.4) * 3).toFixed(1);
    const tIso = new Date(startMs + i * secPer100m * 1000).toISOString();
    ptsXml += `      <trkpt lat="${lat.toFixed(6)}" lon="${lon.toFixed(6)}"><ele>${ele}</ele><time>${tIso}</time></trkpt>\n`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx creator="StravaGPX" version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><time>${startIso}</time></metadata>
  <trk>
    <name>${name}</name>
    <type>running</type>
    <trkseg>
${ptsXml}    </trkseg>
  </trk>
</gpx>`;
}

/** Menghasilkan & mengunduh file `.zip` berformat Strava Bulk Export asli untuk dites */
export async function downloadSampleStravaZip(): Promise<void> {
  const zip = new JSZip();

  const csvContent = [
    'Activity ID,Activity Date,Activity Name,Activity Type,Distance,Moving Time,Elapsed Time,Elevation Gain,Filename',
    '900100201,"Nov 10, 2026, 6:00:00 AM",Lari Pagi Monas 5K (GPX Asli),Run,5.12,2160,2210,22,activities/900100201.gpx',
    '900100202,"Nov 15, 2026, 6:10:00 AM",Tempo Run GBK 10K Prep (.gpx.gz Compressed),Run,6.05,2310,2350,28,activities/900100202.gpx.gz',
    '900100203,"Nov 16, 2026, 5:00:00 PM",Bersepeda Sore (Otomatis Diabaikan),Ride,18.5,3600,3700,45,',
  ].join('\n');

  zip.file('activities.csv', csvContent);

  const gpx1 = buildSampleGpxXml(
    'Lari Pagi Monas 5K (GPX Asli)',
    '2026-11-10T06:00:00Z',
    -6.1754,
    106.8272,
    52,
    420,
  );
  zip.file('activities/900100201.gpx', gpx1);

  const gpx2 = buildSampleGpxXml(
    'Tempo Run GBK 10K Prep (.gpx.gz Compressed)',
    '2026-11-15T06:10:00Z',
    -6.2186,
    106.8025,
    61,
    382,
  );
  const gzBytes = gzip(gpx2);
  zip.file('activities/900100202.gpx.gz', gzBytes);

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'strava_export_sample.zip';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
