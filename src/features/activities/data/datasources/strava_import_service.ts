import type {
  WorkerFileInput,
  WorkerRequestMessage,
  WorkerResponseMessage,
} from '@/features/activities/data/workers/strava_import.worker';
import type { ParsedRunBundle } from '@/features/activities/domain/entities/activity';

/**
 * Service jembatan antara UI Main Thread dan Web Worker (`strava_import.worker.ts`).
 * Analogi Flutter: wrapper `Future<ImportWorkerResult> runInIsolate(...)`.
 */

export interface ImportProgressCallback {
  (progress: { title: string; detail: string; percent: number }): void;
}

export interface ImportWorkerResult {
  bundles: ParsedRunBundle[];
  warnings: string[];
}

export async function parseStravaFilesInWorker(
  fileList: File[],
  onProgress?: ImportProgressCallback,
): Promise<ImportWorkerResult> {
  // Baca seluruh file menjadi ArrayBuffer agar bisa di-transfer zero-copy ke Web Worker
  const workerInputs: WorkerFileInput[] = [];
  const transferables: Transferable[] = [];

  for (const file of fileList) {
    const buffer = await file.arrayBuffer();
    workerInputs.push({ name: file.name, buffer });
    transferables.push(buffer);
  }

  return new Promise<ImportWorkerResult>((resolve, reject) => {
    // Sintaks standar Vite untuk membuat ES Module Web Worker
    const worker = new Worker(
      new URL('../workers/strava_import.worker.ts', import.meta.url),
      { type: 'module' },
    );

    worker.onmessage = (event: MessageEvent<WorkerResponseMessage>) => {
      const msg = event.data;

      if (msg.type === 'PROGRESS') {
        onProgress?.({
          title: msg.title,
          detail: msg.detail,
          percent: msg.percent,
        });
      } else if (msg.type === 'RESULT') {
        worker.terminate();
        resolve({ bundles: msg.bundles, warnings: msg.warnings });
      } else if (msg.type === 'ERROR') {
        worker.terminate();
        reject(new Error(msg.message));
      }
    };

    worker.onerror = (errEvent) => {
      worker.terminate();
      reject(new Error(errEvent.message || 'Web Worker gagal dieksekusi.'));
    };

    const request: WorkerRequestMessage = {
      type: 'PROCESS_FILES',
      files: workerInputs,
    };

    // Parameter ke-2 (transferables) memindahkan kepemilikan buffer tanpa menggandakan RAM
    worker.postMessage(request, transferables);
  });
}
