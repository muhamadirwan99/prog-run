# Road to 10K Sub-60 Tracker

Aplikasi web **Single-Page Application (SPA) 100% client-side (local-first)** untuk memantau progres lari 1 tahun (baseline 4 km pace `10:00/km` → target 10 km Sub-60 menit / pace `6:00/km`) dari arsip `.zip` Strava Bulk Export.

---

## Panduan Cepat untuk Flutter Developer (Clean Architecture Map)

Kalau kamu terbiasa dengan **Flutter Clean Architecture**, setiap konsep di proyek ini punya padanan langsung:

| Konsep Flutter | Padanan di Proyek Web Ini | Lokasi File |
| :--- | :--- | :--- |
| `void main() => runApp()` | Entry point React | `src/main.tsx` |
| `MaterialApp` + `Scaffold` | Root Shell + Header + Radix Tabs | `src/App.tsx` |
| `ThemeData` | Tailwind v4 `@theme` & CSS tokens | `src/index.css` |
| `Isar` / `Drift` / `Hive` | **Dexie.js (IndexedDB)** | `src/core/database/app_database.ts` |
| `StreamBuilder` / `ref.watch` | **`useLiveQuery`** (`dexie-react-hooks`) | `dashboard_page.tsx`, `activity_detail_dialog.tsx` |
| `Cubit` / `Riverpod Notifier` | **Zustand Store** | `presentation/state/use_*_store.ts` |
| `Isolate.run()` / `compute()` | **Vite Web Worker** | `features/activities/data/workers/strava_import.worker.ts` |
| `fromJson()` + validasi ketat | **Zod Schema** | `features/backup/domain/schemas/backup_schema.ts` |
| `showDialog` / `AlertDialog` | **Radix UI Primitives** | `src/core/ui/` |
| `wakelock_plus` | **Screen Wake Lock API** | `src/core/utils/web_audio.ts` |

---

## Struktur Folder (Feature-First Clean Architecture)

```text
src/
├── core/
│   ├── constants/training_plan.ts      # Masterplan 4 Kuartal & gerakan Kalistenik Selasa
│   ├── database/app_database.ts        # Skema Dexie IndexedDB (3 tabel terpisah)
│   ├── ui/                             # Shared Radix UI + Tailwind primitives
│   └── utils/                          # Formatter, rumus Haversine/Riegel, Web Audio & WakeLock
└── features/
    ├── activities/                     # Tab 1: Import Strava, KPI, Recharts, Riwayat & Peta Leaflet
    │   ├── domain/entities/            # Model RunActivity, ActivityRoute, ActivitySplit
    │   ├── domain/usecases/            # Pure functions: computeDashboardKpi & aggregateChartsData
    │   ├── data/parsers/               # Parser GPX non-DOM (fast-xml-parser) untuk Worker
    │   ├── data/workers/               # Web Worker ekstrak .zip/.gpx/.gpx.gz di background thread
    │   ├── data/repositories/          # Upsert atomik anti-duplikat ke Dexie IndexedDB
    │   └── presentation/               # Zustand UI store, DashboardPage, Widgets & Modal Peta
    ├── training_program/               # Tab 2: 4 Kuartal, Checklist Mingguan & Timer Kalistenik
    │   ├── domain/entities/
    │   ├── data/repositories/
    │   └── presentation/
    └── backup/                         # Export/Import Backup .json (Zod v1+v2) & Reset DB
```

---

## Skema Database Lokal (Dexie.js / IndexedDB)

Database `RoadTo10kSub60DB` dibagi menjadi 3 tabel agar performa tetap cepat untuk ribuan kilometer data:

1. **`activities`** (Primary Key: `stravaActivityId`, Index: `dateIso`, `distanceKm`, `paceSecPerKm`, `hasGpx`)
   - Menyimpan ringkasan metrik lari + `splits` per km (~1 KB/sesi). Dashboard selalu ringan dibaca.
2. **`activityRoutes`** (Primary Key: `stravaActivityId`)
   - Menyimpan array koordinat GPX (`[lat, lon][]`). Di-load secara **lazy** hanya saat modal detail aktivitas dibuka.
3. **`programSettings`** (Primary Key: `id` = `'default'`)
   - Menyimpan kuartal aktif, status milestone, dan checklist rutinitas mingguan.

---

## Menjalankan Proyek

```bash
npm install
npm run dev      # Jalankan dev server lokal (Vite HMR)
npm run build    # Type-check TypeScript + build produksi + generate PWA Service Worker
npm run preview  # Preview hasil build produksi secara lokal
```
