import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatPaceMinKm } from '@/core/utils/formatters';
import type {
  AggregatedChartsData,
  PaceTrendPoint,
  WeeklyVolumePoint,
} from '@/features/activities/domain/usecases/aggregate_charts';

/**
 * Widget 2 Grafik Analitik menggunakan Recharts:
 * 1. Grafik Tren Moving Pace (dengan sumbu Y terbalik `reversed={true}` agar pace lebih cepat
 *    terlihat menanjak ke atas menuju garis referensi hijau `6:00 /km`).
 * 2. Grafik Volume Jarak Mingguan (akumulasi Senin - Minggu).
 */
export function AnalyticsChartsGrid({ data }: { data: AggregatedChartsData }) {
  const hasPaceData = data.paceTrend.length > 0;
  const hasVolumeData = data.weeklyVolume.length > 0;

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Grafik 1: Tren Moving Pace */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
        <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-lime-400" />
              <h3 className="font-display text-base font-bold text-white sm:text-lg">
                Grafik Tren Pace Rata-rata
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Perkembangan Moving Pace (min/km) — makin ke atas makin cepat menuju 6:00/km
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 self-start rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 font-mono text-[11px] text-emerald-400 sm:self-auto">
            <span className="inline-block h-0.5 w-3 border-b-2 border-dashed border-emerald-400" />
            Target 6:00 /km
          </span>
        </div>

        <div className="h-72 w-full">
          {hasPaceData ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data.paceTrend}
                margin={{ top: 10, right: 12, left: -12, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="paceLimeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a3e635" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#a3e635" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(30, 41, 59, 0.65)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="dateLabel"
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={false}
                />
                <YAxis
                  reversed
                  domain={[5, 10.5]}
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  tickLine={false}
                  tickFormatter={(val: number) => formatPaceMinKm(val * 60)}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0].payload as PaceTrendPoint;
                    return (
                      <div className="rounded-xl border border-slate-700 bg-slate-950/95 px-3 py-2 text-xs shadow-xl">
                        <p className="font-semibold text-white">{item.name}</p>
                        <p className="mt-1 font-mono text-lime-400">
                          Pace: {formatPaceMinKm(item.paceSecPerKm)} /km
                        </p>
                        <p className="font-mono text-slate-400">
                          Jarak: {item.distanceKm.toFixed(2)} km • {item.dateLabel}
                        </p>
                      </div>
                    );
                  }}
                />
                <ReferenceLine
                  y={6}
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="6 6"
                  label={{
                    value: 'Target 6:00',
                    position: 'insideTopRight',
                    fill: '#10b981',
                    fontSize: 11,
                    fontFamily: 'JetBrains Mono',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="paceMinutes"
                  stroke="#a3e635"
                  strokeWidth={2.5}
                  fill="url(#paceLimeGradient)"
                  dot={{ r: 4, fill: '#a3e635', stroke: '#020617', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#a3e635', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/40 text-xs text-slate-500">
              Unggah data Strava atau muat simulasi untuk melihat kurva tren pace.
            </div>
          )}
        </div>
      </div>

      {/* Grafik 2: Volume Jarak Mingguan */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
        <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
              <h3 className="font-display text-base font-bold text-white sm:text-lg">
                Grafik Volume Jarak Mingguan
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Akumulasi total kilometer per minggu kalender (Senin–Minggu)
            </p>
          </div>
          <span className="self-start rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 font-mono text-[11px] text-cyan-400 sm:self-auto">
            Rata-rata: {data.averageWeeklyKm.toFixed(1)} km/minggu
          </span>
        </div>

        <div className="h-72 w-full">
          {hasVolumeData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.weeklyVolume}
                margin={{ top: 10, right: 12, left: -12, bottom: 0 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="rgba(30, 41, 59, 0.65)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="weekLabel"
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  tickLine={false}
                  tickFormatter={(val: number) => `${val} km`}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0].payload as WeeklyVolumePoint;
                    return (
                      <div className="rounded-xl border border-slate-700 bg-slate-950/95 px-3 py-2 text-xs shadow-xl">
                        <p className="font-semibold text-white">{item.weekLabel}</p>
                        <p className="mt-1 font-mono text-cyan-400">
                          Total: {item.totalKm.toFixed(2)} KM
                        </p>
                        <p className="font-mono text-slate-400">
                          {item.runCount} sesi lari
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="totalKm"
                  fill="#06b6d4"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={42}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/40 text-xs text-slate-500">
              Belum ada akumulasi jarak mingguan.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
