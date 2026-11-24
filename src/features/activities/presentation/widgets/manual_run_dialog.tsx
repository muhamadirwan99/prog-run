import { PlusCircle } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/core/ui/dialog';
import { generateSyntheticSplits } from '@/core/utils/running_math';
import { activityRepository } from '@/features/activities/data/repositories/activity_repository';
import { useActivityUiStore } from '@/features/activities/presentation/state/use_activity_ui_store';

/**
 * Modal Input Aktivitas Lari Manual (Radix Dialog).
 * Cocok untuk mencatat lari treadmill atau sesi tanpa file GPX Strava.
 */
export function ManualRunDialog() {
  const isOpen = useActivityUiStore((s) => s.isManualRunOpen);
  const setOpen = useActivityUiStore((s) => s.setManualRunOpen);
  const showToast = useActivityUiStore((s) => s.showToast);

  const [name, setName] = useState('');
  const [dateVal, setDateVal] = useState(() => new Date().toISOString().split('T')[0]);
  const [distanceKm, setDistanceKm] = useState('5.00');
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('38');
  const [seconds, setSeconds] = useState('30');
  const [elevation, setElevation] = useState('18');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const dist = Number.parseFloat(distanceKm);
    const totalSec =
      (Number.parseInt(hours, 10) || 0) * 3600 +
      (Number.parseInt(minutes, 10) || 0) * 60 +
      (Number.parseInt(seconds, 10) || 0);
    const ele = Number.parseInt(elevation, 10) || 0;

    if (!Number.isFinite(dist) || dist <= 0 || totalSec <= 0) {
      showToast('Jarak dan durasi harus lebih besar dari 0.', 'warning');
      return;
    }

    const cleanName = name.trim() || 'Lari Manual';
    const paceSec = Math.round(totalSec / dist);
    const dateIso = dateVal
      ? new Date(`${dateVal}T06:30:00`).toISOString()
      : new Date().toISOString();

    await activityRepository.upsertSingle({
      activity: {
        stravaActivityId: `manual_${Date.now()}`,
        name: cleanName,
        dateIso,
        distanceKm: Number(dist.toFixed(2)),
        movingTimeSec: totalSec,
        paceSecPerKm: paceSec,
        elevationGain: ele,
        hasGpx: false,
        sourceFile: 'Input Manual',
        splits: generateSyntheticSplits(dist, totalSec, ele),
        updatedAt: new Date().toISOString(),
      },
      coords: [],
    });

    setName('');
    setOpen(false);
    showToast(`Aktivitas "${cleanName}" (${dist.toFixed(2)} km) ditambahkan!`, 'success');
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="max-w-md overflow-hidden p-0">
        <div className="border-b border-slate-800 bg-slate-950 p-4 pr-14 sm:p-5 sm:pr-14">
          <DialogTitle className="flex items-center gap-2 font-display text-base font-bold text-white">
            <PlusCircle className="h-4 w-4 text-lime-400" />
            <span>Tambah Aktivitas Lari Manual</span>
          </DialogTitle>
          <DialogDescription className="mt-0.5 text-xs text-slate-400">
            Catat lari treadmill atau sesi tanpa arsip GPX ke database lokal.
          </DialogDescription>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 p-5 text-xs sm:text-sm">
          <div>
            <label className="mb-1 block text-xs text-slate-400">
              Nama Aktivitas Lari
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Easy Run Pagi GBK"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-lime-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Tanggal</label>
              <input
                type="date"
                required
                value={dateVal}
                onChange={(e) => setDateVal(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-lime-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Jarak (KM)</label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                max="100"
                required
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-lime-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Jam</label>
              <input
                type="number"
                min="0"
                max="23"
                required
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-lime-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Menit</label>
              <input
                type="number"
                min="0"
                max="59"
                required
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-lime-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Detik</label>
              <input
                type="number"
                min="0"
                max="59"
                required
                value={seconds}
                onChange={(e) => setSeconds(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-lime-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400">
              Elevasi Gain (meter, opsional)
            </label>
            <input
              type="number"
              min="0"
              max="5000"
              value={elevation}
              onChange={(e) => setElevation(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-lime-400 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="cursor-pointer rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-700"
            >
              Batal
            </button>
            <button
              type="submit"
              className="cursor-pointer rounded-xl bg-lime-400 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-lime-300"
            >
              Simpan Aktivitas
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
