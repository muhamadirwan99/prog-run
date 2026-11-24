/**
 * Utility Audio Synthesizer (Web Audio API) & Screen Wake Lock untuk Timer Kalistenik.
 * Tidak membutuhkan file .mp3 eksternal sehingga tetap bunyi 100% offline di PWA.
 */

let sharedAudioCtx: AudioContext | null = null;
let activeWakeLock: WakeLockSentinel | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!sharedAudioCtx) {
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioCtxClass) {
      sharedAudioCtx = new AudioCtxClass();
    }
  }

  // Browser mobile (iOS/Android) mem-pause AudioContext sampai ada klik user.
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    void sharedAudioCtx.resume();
  }

  return sharedAudioCtx;
}

/** Panggil fungsi ini di dalam event click tombol "Mulai Timer" untuk unlock audio mobile */
export function unlockAudioEngine(): void {
  getAudioContext();
}

/** Memainkan nada beep singkat (dipakai pada hitungan 3-2-1 terakhir) */
export function playBeepTone(
  freq = 880,
  durationMs = 140,
  waveType: OscillatorType = 'sine',
): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = waveType;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch (err) {
    console.warn('[WebAudio] Gagal memutar nada beep:', err);
  }
}

/** Memainkan 3 nada naik (G5 -> B5 -> D6) saat waktu latihan selesai */
export function playCompletionAlarm(): void {
  playBeepTone(784, 140, 'triangle');
  window.setTimeout(() => playBeepTone(987.77, 140, 'triangle'), 160);
  window.setTimeout(() => playBeepTone(1174.66, 380, 'triangle'), 320);
}

/**
 * Menjaga layar HP tetap menyala selama timer kalistenik berjalan.
 * (Analogi Flutter: mirip package `wakelock_plus` -> `WakelockPlus.enable()`.)
 */
export async function requestScreenWakeLock(): Promise<void> {
  try {
    if ('wakeLock' in navigator && !activeWakeLock) {
      activeWakeLock = await navigator.wakeLock.request('screen');
      activeWakeLock.addEventListener('release', () => {
        activeWakeLock = null;
      });
    }
  } catch {
    // Beberapa browser desktop/mode hemat daya menolak WakeLock; aman diabaikan.
  }
}

/** Melepaskan Wake Lock saat timer dijeda, direset, atau selesai */
export async function releaseScreenWakeLock(): Promise<void> {
  try {
    if (activeWakeLock) {
      await activeWakeLock.release();
      activeWakeLock = null;
    }
  } catch {
    activeWakeLock = null;
  }
}
