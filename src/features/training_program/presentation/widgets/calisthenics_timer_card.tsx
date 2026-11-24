import {
  Pause,
  Play,
  RotateCw,
  ShieldCheck,
  Timer,
  Volume2,
} from 'lucide-react';
import { formatTimerMMSS } from '@/core/utils/formatters';
import { useTimerStore } from '@/features/training_program/presentation/state/use_timer_store';

const RING_CIRCUMFERENCE = 326.72; // 2 * PI * 52

/**
 * Widget Countdown Timer Kalistenik + Tips Biomekanik (sticky di desktop).
 * State dikontrol penuh oleh Zustand `useTimerStore` (berbasis timestamp + Web Audio + WakeLock).
 */
export function CalisthenicsTimerCard() {
  const label = useTimerStore((s) => s.label);
  const targetSeconds = useTimerStore((s) => s.targetSeconds);
  const remainingSeconds = useTimerStore((s) => s.remainingSeconds);
  const isRunning = useTimerStore((s) => s.isRunning);
  const isJustFinished = useTimerStore((s) => s.isJustFinished);
  const statusSubtext = useTimerStore((s) => s.statusSubtext);
  const setPreset = useTimerStore((s) => s.setPreset);
  const toggleStartPause = useTimerStore((s) => s.toggleStartPause);
  const adjustSeconds = useTimerStore((s) => s.adjustSeconds);
  const reset = useTimerStore((s) => s.reset);
  const testAudio = useTimerStore((s) => s.testAudio);

  const fraction = targetSeconds > 0 ? remainingSeconds / targetSeconds : 0;
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, fraction)));

  const startPauseLabel = isRunning
    ? 'Jeda Timer'
    : remainingSeconds < targetSeconds && remainingSeconds > 0
      ? 'Lanjutkan'
      : 'Mulai Timer';

  return (
    <div className="space-y-5 lg:sticky lg:top-24 lg:col-span-5">
      {/* Kartu Countdown Timer */}
      <div
        className={`space-y-5 rounded-2xl border border-slate-800 bg-slate-900/95 p-5 shadow-2xl sm:p-6 ${
          isJustFinished ? 'animate-pulse-lime' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-lime-400">
              <Timer className="h-3.5 w-3.5" />
              Stopwatch &amp; Timer Kalistenik
            </span>
            <h3 className="mt-0.5 font-display text-lg font-bold text-white">{label}</h3>
          </div>
          <button
            type="button"
            onClick={testAudio}
            title="Tes Bunyi Beep"
            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs text-slate-300 transition hover:bg-slate-700"
          >
            <Volume2 className="h-3.5 w-3.5 text-lime-400" />
            <span>Tes Bunyi</span>
          </button>
        </div>

        {/* Circular SVG Ring */}
        <div className="relative mx-auto flex h-52 w-52 items-center justify-center">
          <svg className="h-full w-full" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="#1e293b"
              strokeWidth="8"
            />
            <circle
              className="timer-ring-circle"
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="#a3e635"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-mono text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {formatTimerMMSS(remainingSeconds)}
            </span>
            <span className="mt-1 px-4 font-mono text-[11px] text-slate-400">
              {statusSubtext}
            </span>
          </div>
        </div>

        {/* Preset Cepat */}
        <div className="space-y-2">
          <p className="text-center font-mono text-xs uppercase text-slate-400">
            Tombol Cepat Durasi
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setPreset(30, 'Pogo Jumps (30 Detik)')}
              className="flex cursor-pointer flex-col items-center rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 font-mono text-xs font-bold text-slate-200 transition hover:border-lime-400/50 hover:bg-slate-800"
            >
              <span className="text-sm text-lime-400">30 Dtk</span>
              <span className="font-sans text-[10px] font-normal text-slate-400">
                Pogo Jumps
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPreset(45, 'Wall Sit / Plank (45 Detik)')}
              className="flex cursor-pointer flex-col items-center rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 font-mono text-xs font-bold text-slate-200 transition hover:border-cyan-400/50 hover:bg-slate-800"
            >
              <span className="text-sm text-cyan-400">45 Dtk</span>
              <span className="font-sans text-[10px] font-normal text-slate-400">
                Wall Sit / Plank
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPreset(60, 'Recovery Antar Set (60 Detik)')}
              className="flex cursor-pointer flex-col items-center rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 font-mono text-xs font-bold text-slate-200 transition hover:border-emerald-400/50 hover:bg-slate-800"
            >
              <span className="text-sm text-emerald-400">60 Dtk</span>
              <span className="font-sans text-[10px] font-normal text-slate-400">
                Rest / Istirahat
              </span>
            </button>
          </div>
        </div>

        {/* Kontrol Play / Pause / +15s / Reset */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={toggleStartPause}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-lime-400 px-4 py-3 font-display text-sm font-bold uppercase tracking-wider text-slate-950 shadow-lg shadow-lime-500/20 transition hover:bg-lime-300"
          >
            {isRunning ? (
              <Pause className="h-4 w-4 fill-current" />
            ) : (
              <Play className="h-4 w-4 fill-current" />
            )}
            <span>{startPauseLabel}</span>
          </button>

          <button
            type="button"
            onClick={() => adjustSeconds(15)}
            title="Tambah 15 detik"
            className="cursor-pointer rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-3 font-mono text-xs font-bold text-slate-200 transition hover:bg-slate-700"
          >
            +15s
          </button>

          <button
            type="button"
            onClick={reset}
            title="Reset Timer"
            className="cursor-pointer rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-3 text-slate-300 transition hover:bg-slate-700"
          >
            <RotateCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Kartu Prinsip Kunci Biomekanik */}
      <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
        <h4 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-cyan-400">
          <ShieldCheck className="h-4 w-4" />
          <span>Prinsip Kunci Menuju 10K Sub-60</span>
        </h4>

        <ul className="space-y-2.5 text-xs text-slate-300">
          <li className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime-400/15 font-mono font-bold text-lime-400">
              1
            </span>
            <span>
              <strong>80/20 Polarized Intensity:</strong> 80% kilometer mingguan
              dilakukan pada pace ngobrol santai (Easy/Long Run) untuk membangun kapiler
              otot &amp; mitokondria tanpa cedera.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 font-mono font-bold text-cyan-400">
              2
            </span>
            <span>
              <strong>Cadence &gt; Overstriding:</strong> Untuk lari di pace 6:00/km
              secara hemat energi, fokuskan langkah pendek cepat (170+ spm) yang mendarat
              tepat di bawah titik berat tubuh.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 font-mono font-bold text-emerald-400">
              3
            </span>
            <span>
              <strong>Prehab Selasa Malam Wajib:</strong> <em>Eccentric Calf Raise</em>{' '}
              dan <em>Tibialis Raise</em> adalah asuransi utama agar terhindar dari{' '}
              <em>Shin Splints</em> &amp; nyeri lutut saat volume lari naik ke 10 km.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
