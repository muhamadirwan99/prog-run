import { create } from 'zustand';
import {
  playBeepTone,
  playCompletionAlarm,
  releaseScreenWakeLock,
  requestScreenWakeLock,
  unlockAudioEngine,
} from '@/core/utils/web_audio';
import { useActivityUiStore } from '@/features/activities/presentation/state/use_activity_ui_store';

/**
 * Zustand Store untuk Countdown Timer Kalistenik + Audio Beep + Screen Wake Lock.
 *
 * KENAPA BERBASIS TIMESTAMP (`endTimestampMs - Date.now()`)?
 * Browser HP (Chrome Android / Safari iOS) sering memperlambat `setInterval` saat
 * tab berpindah atau layar meredup. Dengan menghitung selisih dari `Date.now()`,
 * sisa waktu timer tetap 100% akurat hingga milidetik meskipun interval sempat tertunda.
 */

interface CalisthenicsTimerStore {
  label: string;
  targetSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  isJustFinished: boolean;
  statusSubtext: string;

  setPreset: (seconds: number, label: string, autoStart?: boolean) => void;
  start: () => void;
  pause: () => void;
  toggleStartPause: () => void;
  reset: () => void;
  adjustSeconds: (deltaSeconds: number) => void;
  testAudio: () => void;
}

// Variabel modul di luar state React agar interval tidak memicu re-render ekstra
let tickIntervalId: number | null = null;
let endTimestampMs: number | null = null;
let lastBeepedSecond: number | null = null;

function clearTickTimer(): void {
  if (tickIntervalId !== null) {
    window.clearInterval(tickIntervalId);
    tickIntervalId = null;
  }
  endTimestampMs = null;
  lastBeepedSecond = null;
}

export const useTimerStore = create<CalisthenicsTimerStore>((set, get) => ({
  label: 'Siap Mulai Latihan',
  targetSeconds: 45,
  remainingSeconds: 45,
  isRunning: false,
  isJustFinished: false,
  statusSubtext: 'DURASI TARGET: 45 DTK',

  setPreset: (seconds, label, autoStart = false) => {
    clearTickTimer();
    void releaseScreenWakeLock();

    set({
      label,
      targetSeconds: seconds,
      remainingSeconds: seconds,
      isRunning: false,
      isJustFinished: false,
      statusSubtext: `DURASI TARGET: ${seconds} DTK`,
    });

    if (autoStart) {
      get().start();
    }
  },

  start: () => {
    const state = get();
    if (state.isRunning) return;

    unlockAudioEngine();
    void requestScreenWakeLock();

    const startFrom =
      state.remainingSeconds <= 0 ? state.targetSeconds : state.remainingSeconds;
    endTimestampMs = Date.now() + startFrom * 1000;
    lastBeepedSecond = null;

    set({
      remainingSeconds: startFrom,
      isRunning: true,
      isJustFinished: false,
      statusSubtext: `BERJALAN • TARGET ${state.targetSeconds} DTK`,
    });

    // Polling 200ms agar transisi angka detik & cincin SVG terasa responsif
    tickIntervalId = window.setInterval(() => {
      if (endTimestampMs === null) return;

      const remainingMs = endTimestampMs - Date.now();
      const nextSec = Math.max(0, Math.ceil(remainingMs / 1000));

      // Mainkan nada persiapan di detik 3, 2, 1 (masing-masing tepat 1x)
      if (nextSec <= 3 && nextSec > 0 && lastBeepedSecond !== nextSec) {
        lastBeepedSecond = nextSec;
        playBeepTone(660, 95, 'sine');
      }

      if (remainingMs <= 0) {
        clearTickTimer();
        void releaseScreenWakeLock();
        playCompletionAlarm();

        set({
          remainingSeconds: 0,
          isRunning: false,
          isJustFinished: true,
          statusSubtext: 'SELESAI! ISTIRAHAT SEJENAK',
        });

        useActivityUiStore
          .getState()
          .showToast('Waktu latihan selesai! Kerja bagus!', 'success');

        window.setTimeout(() => {
          set({ isJustFinished: false });
        }, 3500);
        return;
      }

      // Hanya update state jika angka detik benar-benar berubah (hemat render)
      if (nextSec !== get().remainingSeconds) {
        set({ remainingSeconds: nextSec });
      }
    }, 200);
  },

  pause: () => {
    if (!get().isRunning) return;

    const remainingMs =
      endTimestampMs !== null ? Math.max(0, endTimestampMs - Date.now()) : 0;
    const preservedSec = Math.ceil(remainingMs / 1000);

    clearTickTimer();
    void releaseScreenWakeLock();

    set((state) => ({
      isRunning: false,
      remainingSeconds: preservedSec || state.remainingSeconds,
      statusSubtext: `DIJEDA • TARGET ${state.targetSeconds} DTK`,
    }));
  },

  toggleStartPause: () => {
    if (get().isRunning) {
      get().pause();
    } else {
      get().start();
    }
  },

  reset: () => {
    clearTickTimer();
    void releaseScreenWakeLock();

    set((state) => ({
      isRunning: false,
      isJustFinished: false,
      remainingSeconds: state.targetSeconds,
      statusSubtext: `DURASI TARGET: ${state.targetSeconds} DTK`,
    }));
  },

  adjustSeconds: (deltaSeconds) => {
    const state = get();
    const nextTarget = Math.max(5, state.targetSeconds + deltaSeconds);
    const nextRemaining = Math.max(1, state.remainingSeconds + deltaSeconds);

    if (state.isRunning && endTimestampMs !== null) {
      endTimestampMs += deltaSeconds * 1000;
    }

    set({
      targetSeconds: nextTarget,
      remainingSeconds: nextRemaining,
      statusSubtext: state.isRunning
        ? `BERJALAN • TARGET ${nextTarget} DTK`
        : `DURASI TARGET: ${nextTarget} DTK`,
    });
  },

  testAudio: () => {
    unlockAudioEngine();
    playCompletionAlarm();
    useActivityUiStore.getState().showToast('Audio Timer Aktif!', 'info');
  },
}));
