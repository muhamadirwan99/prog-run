import JSZip from 'jszip';
import { ungzip } from 'pako';
import Papa from 'papaparse';
import { generateSyntheticSplits } from '@/core/utils/running_math';
import { parseGpxXmlString } from '@/features/activities/data/parsers/gpx_parser';
import type { ParsedRunBundle } from '@/features/activities/domain/entities/activity';

/**
 * Web Worker untuk ekstraksi & parsing Strava Bulk Export (.zip, .gpx, .gpx.gz).
 *
 * Analogi Flutter:
 * File ini persis seperti `Isolate.run()` / `compute()` di Flutter!
 * Semua kerja berat (unzip ratusan MB, ungzip pako, parse CSV, hitung Haversine ribuan titik)
 * berjalan di background thread terpisah agar animasi UI & scroll tetap 60fps tanpa freeze.
 *
 * Komunikasi antar thread menggunakan `postMessage` (mirip `SendPort` / `ReceivePort` di Dart).
 */

export interface WorkerFileInput {
  name: string;
  buffer: ArrayBuffer;
}

export interface WorkerRequestMessage {
  type: 'PROCESS_FILES';
  files: WorkerFileInput[];
}

export type WorkerResponseMessage =
  | {
      type: 'PROGRESS';
      title: string;
      detail: string;
      percent: number;
    }
  | {
      type: 'RESULT';
      bundles: ParsedRunBundle[];
      warnings: string[];
    }
  | {
      type: 'ERROR';
      message: string;
    };

// Helper typed postMessage khusus environment Worker
function emit(msg: WorkerResponseMessage): void {
  self.postMessage(msg);
}

// Dekompresi .gpx.gz (Uint8Array) menjadi teks UTF-8 dengan aman
const utf8Decoder = new TextDecoder('utf-8');
function ungzipToUtf8(bytes: Uint8Array): string {
  return utf8Decoder.decode(ungzip(bytes));
}

type CsvRow = Record<string, string | undefined>;

function parseStravaCsvDistanceKm(row: CsvRow): number {
  const raw = (row['Distance'] || row['Jarak'] || '0')
    .toString()
    .replace(/,/g, '.')
    .trim();
  const val = Number.parseFloat(raw);
  if (Number.isNaN(val) || val <= 0) return 0;
  // Kolom Distance Strava kadang dalam meter (misal 5120) atau km (5.12)
  return val > 150 ? val / 1000 : val;
}

function parseStravaCsvMovingTimeSec(row: CsvRow): number {
  const raw = (
    row['Moving Time'] ||
    row['Waktu Bergerak'] ||
    row['Elapsed Time'] ||
    row['Waktu Berlalu'] ||
    '0'
  )
    .toString()
    .trim();

  if (raw.includes(':')) {
    const parts = raw.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
  }
  const val = Number.parseFloat(raw);
  return Number.isNaN(val) ? 0 : val;
}

function parseStravaDateToISO(rawDateStr: string): string {
  if (!rawDateStr) return new Date().toISOString();
  const parsed = new Date(rawDateStr);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function isRunningActivityType(row: CsvRow): boolean {
  const typeRaw = (
    row['Activity Type'] ||
    row['Jenis Aktivitas'] ||
    row['Type'] ||
    ''
  )
    .toString()
    .trim()
    .toLowerCase();

  return (
    typeRaw === 'run' ||
    typeRaw === 'lari' ||
    typeRaw === 'virtualrun' ||
    typeRaw === 'virtual run' ||
    typeRaw === 'trail run' ||
    typeRaw === 'lari lintas alam'
  );
}

async function processZipFile(
  file: WorkerFileInput,
  warnings: string[],
): Promise<ParsedRunBundle[]> {
  const results: ParsedRunBundle[] = [];

  emit({
    type: 'PROGRESS',
    title: 'Membuka Arsip .ZIP Strava...',
    detail: file.name,
    percent: 12,
  });

  const zip = await JSZip.loadAsync(file.buffer);

  // Indeks semua file di dalam zip (case-insensitive + basename fallback)
  const zipEntriesMap = new Map<string, JSZip.JSZipObject>();
  zip.forEach((relativePath, entry) => {
    if (!entry.dir) {
      const cleanPath = relativePath.replace(/^\/+/, '').trim();
      zipEntriesMap.set(cleanPath, entry);
      zipEntriesMap.set(cleanPath.toLowerCase(), entry);

      const base = cleanPath.split('/').pop()?.toLowerCase();
      if (base && !zipEntriesMap.has(`basename:${base}`)) {
        zipEntriesMap.set(`basename:${base}`, entry);
      }
    }
  });

  const csvEntry =
    zipEntriesMap.get('activities.csv') ?? zipEntriesMap.get('basename:activities.csv');

  // Mode Fallback: arsip .zip berisi kumpulan file .gpx/.gpx.gz tanpa activities.csv
  if (!csvEntry) {
    const gpxEntries = Object.values(zip.files).filter(
      (f) =>
        !f.dir &&
        (f.name.toLowerCase().endsWith('.gpx') || f.name.toLowerCase().endsWith('.gpx.gz')),
    );

    if (gpxEntries.length === 0) {
      throw new Error(
        `Tidak ditemukan activities.csv maupun file .gpx di dalam ${file.name}.`,
      );
    }

    for (let idx = 0; idx < gpxEntries.length; idx++) {
      const entry = gpxEntries[idx];
      const percent = Math.round(20 + ((idx + 1) / gpxEntries.length) * 75);
      emit({
        type: 'PROGRESS',
        title: `Mengekstrak GPX (${idx + 1}/${gpxEntries.length})...`,
        detail: entry.name,
        percent,
      });

      const xmlStr = entry.name.toLowerCase().endsWith('.gz')
        ? ungzipToUtf8(await entry.async('uint8array'))
        : await entry.async('string');

      const fallbackName =
        entry.name
          .split('/')
          .pop()
          ?.replace(/\.gpx(\.gz)?$/i, '') ?? 'Lari GPX';

      const parsed = parseGpxXmlString(xmlStr, fallbackName, entry.name);
      if (parsed && parsed.activity.distanceKm > 0.05) {
        results.push(parsed);
      }
    }
    return results;
  }

  // Mode Utama: Strava Bulk Export asli dengan activities.csv
  emit({
    type: 'PROGRESS',
    title: 'Membaca activities.csv...',
    detail: 'Memfilter aktivitas lari (Run / Lari)...',
    percent: 24,
  });

  const csvText = await csvEntry.async('string');
  const parsedCsv = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const runRows = (parsedCsv.data ?? []).filter(isRunningActivityType);
  if (runRows.length === 0) {
    warnings.push(
      `Tidak ditemukan baris aktivitas bertipe "Run" atau "Lari" di ${file.name}.`,
    );
    return results;
  }

  for (let i = 0; i < runRows.length; i++) {
    const row = runRows[i];
    const percent = Math.round(28 + ((i + 1) / runRows.length) * 70);

    const stravaActivityId = (
      row['Activity ID'] ||
      row['ID Aktivitas'] ||
      row['id'] ||
      `strava_${i}_${Date.now()}`
    )
      .toString()
      .trim();

    const activityName = (
      row['Activity Name'] ||
      row['Nama Aktivitas'] ||
      'Lari Strava'
    )
      .toString()
      .trim();

    const rawDate = (
      row['Activity Date'] ||
      row['Tanggal Aktivitas'] ||
      row['Date'] ||
      ''
    )
      .toString()
      .trim();

    const filenameCol = (row['Filename'] || row['Nama File'] || '').toString().trim();

    emit({
      type: 'PROGRESS',
      title: `Memproses Lari (${i + 1}/${runRows.length})`,
      detail: `${activityName}${filenameCol ? ` (${filenameCol})` : ''}`,
      percent,
    });

    const csvDistanceKm = parseStravaCsvDistanceKm(row);
    const csvMovingTimeSec = parseStravaCsvMovingTimeSec(row);
    const csvElevationGain =
      Number.parseFloat(row['Elevation Gain'] || row['Kenaikan Elevasi'] || '0') || 0;
    const parsedDateIso = parseStravaDateToISO(rawDate);

    let gpxBundle: ParsedRunBundle | null = null;

    if (filenameCol) {
      const cleanRef = filenameCol.replace(/^\/+/, '').trim();
      const baseRef = cleanRef.split('/').pop()?.toLowerCase() ?? '';
      const matchedEntry =
        zipEntriesMap.get(cleanRef) ??
        zipEntriesMap.get(cleanRef.toLowerCase()) ??
        zipEntriesMap.get(`basename:${baseRef}`);

      if (matchedEntry) {
        const lowerName = matchedEntry.name.toLowerCase();
        try {
          if (lowerName.endsWith('.gpx')) {
            const xmlStr = await matchedEntry.async('string');
            gpxBundle = parseGpxXmlString(xmlStr, activityName, filenameCol);
          } else if (lowerName.endsWith('.gpx.gz')) {
            const uint8 = await matchedEntry.async('uint8array');
            const xmlStr = ungzipToUtf8(uint8);
            gpxBundle = parseGpxXmlString(xmlStr, activityName, filenameCol);
          }
          // File non-GPX (misal treadmill tanpa rute) otomatis fallback ke ringkasan CSV
        } catch (err) {
          console.warn('[Worker] Gagal parse GPX:', filenameCol, err);
        }
      }
    }

    const finalDistanceKm =
      gpxBundle && gpxBundle.activity.distanceKm > 0.05
        ? gpxBundle.activity.distanceKm
        : csvDistanceKm;
    const finalMovingTimeSec =
      gpxBundle && gpxBundle.activity.movingTimeSec > 10
        ? gpxBundle.activity.movingTimeSec
        : csvMovingTimeSec;

    if (finalDistanceKm <= 0.05 || finalMovingTimeSec <= 0) {
      continue;
    }

    const finalPaceSecPerKm = Math.round(finalMovingTimeSec / finalDistanceKm);
    const finalElevation =
      gpxBundle && gpxBundle.activity.elevationGain > 0
        ? gpxBundle.activity.elevationGain
        : Math.round(csvElevationGain);
    const finalDateIso = gpxBundle?.activity.dateIso ?? parsedDateIso;
    const coords = gpxBundle?.coords ?? [];
    const splits =
      gpxBundle && gpxBundle.activity.splits.length > 0
        ? gpxBundle.activity.splits
        : generateSyntheticSplits(finalDistanceKm, finalMovingTimeSec, finalElevation);

    results.push({
      activity: {
        stravaActivityId,
        name: activityName,
        dateIso: finalDateIso,
        distanceKm: Number(finalDistanceKm.toFixed(2)),
        movingTimeSec: Math.round(finalMovingTimeSec),
        paceSecPerKm: finalPaceSecPerKm,
        elevationGain: Math.round(finalElevation),
        hasGpx: coords.length > 1,
        sourceFile: filenameCol || 'activities.csv',
        splits,
        updatedAt: new Date().toISOString(),
      },
      coords,
    });
  }

  return results;
}

self.onmessage = async (event: MessageEvent<WorkerRequestMessage>) => {
  const payload = event.data;
  if (payload.type !== 'PROCESS_FILES') return;

  try {
    const allBundles: ParsedRunBundle[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < payload.files.length; i++) {
      const file = payload.files[i];
      const lowerName = file.name.toLowerCase();

      if (lowerName.endsWith('.zip')) {
        const zipBundles = await processZipFile(file, warnings);
        allBundles.push(...zipBundles);
      } else if (lowerName.endsWith('.gpx') || lowerName.endsWith('.gpx.gz')) {
        emit({
          type: 'PROGRESS',
          title: `Memproses file GPX (${i + 1}/${payload.files.length})`,
          detail: file.name,
          percent: Math.round(((i + 0.5) / payload.files.length) * 90),
        });

        const xmlText = lowerName.endsWith('.gz')
          ? ungzipToUtf8(new Uint8Array(file.buffer))
          : utf8Decoder.decode(file.buffer);

        const fallbackName = file.name.replace(/\.gpx(\.gz)?$/i, '');
        const parsed = parseGpxXmlString(xmlText, fallbackName, file.name);
        if (parsed && parsed.activity.distanceKm > 0.05) {
          allBundles.push(parsed);
        } else {
          warnings.push(`File ${file.name} tidak memiliki titik lari valid (> 50m).`);
        }
      } else {
        warnings.push(
          `Format ${file.name} tidak didukung. Gunakan file .zip, .gpx, atau .gpx.gz.`,
        );
      }
    }

    emit({
      type: 'PROGRESS',
      title: 'Menyimpan ke IndexedDB...',
      detail: `${allBundles.length} sesi lari siap disinkronkan`,
      percent: 98,
    });

    emit({
      type: 'RESULT',
      bundles: allBundles,
      warnings,
    });
  } catch (err) {
    emit({
      type: 'ERROR',
      message:
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan tidak dikenal saat memproses arsip Strava.',
    });
  }
};
