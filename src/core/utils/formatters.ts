/**
 * Kumpulan fungsi formatter tampilan (pure functions).
 * Analogi Flutter: mirip extension method atau helper class di `lib/core/utils/formatters.dart`.
 */

/** Ubah detik/km (misal 360) -> format pace "6:00" */
export function formatPaceMinKm(secPerKm: number | null | undefined): string {
  if (!secPerKm || !Number.isFinite(secPerKm) || secPerKm <= 0) {
    return '--:--';
  }
  const totalSec = Math.round(secPerKm);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/** Ubah durasi detik (misal 3590) -> "59:50" atau "1:05:12" jika >= 1 jam */
export function formatDurationHMS(totalSeconds: number | null | undefined): string {
  if (!totalSeconds || !Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return '00:00';
  }
  const sec = Math.round(totalSeconds);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/** Format total durasi akumulasi (KPI Card 1) -> "12j 45m" */
export function formatTotalHoursMinutes(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds || 0));
  const h = Math.floor(safe / 3600);
  const m = Math.round((safe % 3600) / 60);
  return `${h}j ${m}m`;
}

/** Format ISO date -> "15 Nov 2026" (locale Indonesia) */
export function formatDateIndo(isoString: string | null | undefined): string {
  if (!isoString) return '-';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString;
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Format pendek untuk sumbu X grafik -> "15 Nov" */
export function formatShortDateIndo(isoString: string): string {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString;
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
  });
}

/** Format hitung mundur timer kalistenik (detik -> "00:45") */
export function formatTimerMMSS(seconds: number): string {
  const safe = Math.max(0, Math.ceil(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
