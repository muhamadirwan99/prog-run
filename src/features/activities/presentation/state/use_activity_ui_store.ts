import { create } from 'zustand';

/**
 * Zustand Store untuk State UI Global (ringan & tidak perlu disimpan di database).
 *
 * Analogi Flutter:
 * - Zustand persis seperti `Cubit` (BLoC) atau `StateNotifier` (Riverpod).
 * - Komponen React cukup memanggil `const search = useActivityUiStore((s) => s.searchQuery)`
 *   (mirip `ref.watch(provider.select((s) => s.searchQuery))`), jadi hanya komponen yang
 *   memakai field tersebut yang re-render saat berubah.
 * - PENTING: Daftar aktivitas TIDAK disimpan di sini, melainkan dibaca langsung dari
 *   Dexie IndexedDB memakai `useLiveQuery` agar tidak ada duplikasi state!
 */

export type MainTabId = 'dashboard' | 'program';
export type ActivityFilterMode = 'all' | 'gpx' | '5k';
export type ActivitySortMode = 'date_desc' | 'date_asc' | 'pace_asc' | 'dist_desc';
export type ToastVariant = 'success' | 'info' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ImportProgressState {
  isImporting: boolean;
  title: string;
  detail: string;
  percent: number;
}

interface ActivityUiStore {
  // Navigasi tab utama
  activeTab: MainTabId;
  setActiveTab: (tab: MainTabId) => void;

  // Kontrol filter & pencarian tabel riwayat
  searchQuery: string;
  filterMode: ActivityFilterMode;
  sortMode: ActivitySortMode;
  setSearchQuery: (q: string) => void;
  setFilterMode: (mode: ActivityFilterMode) => void;
  setSortMode: (mode: ActivitySortMode) => void;

  // Kontrol modal Radix Dialog / AlertDialog
  selectedActivityId: string | null;
  openActivityDetail: (stravaActivityId: string) => void;
  closeActivityDetail: () => void;

  isManualRunOpen: boolean;
  setManualRunOpen: (open: boolean) => void;

  isResetDialogOpen: boolean;
  setResetDialogOpen: (open: boolean) => void;

  // Status progres Web Worker import Strava
  importProgress: ImportProgressState;
  lastImportBanner: string | null;
  setImportProgress: (next: Partial<ImportProgressState>) => void;
  resetImportProgress: () => void;
  setLastImportBanner: (message: string | null) => void;

  // Sistem notifikasi Toast (mirip ScaffoldMessenger.showSnackBar di Flutter)
  toasts: ToastItem[];
  showToast: (message: string, variant?: ToastVariant) => void;
  dismissToast: (id: string) => void;
}

export const useActivityUiStore = create<ActivityUiStore>((set) => ({
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  searchQuery: '',
  filterMode: 'all',
  sortMode: 'date_desc',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFilterMode: (filterMode) => set({ filterMode }),
  setSortMode: (sortMode) => set({ sortMode }),

  selectedActivityId: null,
  openActivityDetail: (stravaActivityId) => set({ selectedActivityId: stravaActivityId }),
  closeActivityDetail: () => set({ selectedActivityId: null }),

  isManualRunOpen: false,
  setManualRunOpen: (isManualRunOpen) => set({ isManualRunOpen }),

  isResetDialogOpen: false,
  setResetDialogOpen: (isResetDialogOpen) => set({ isResetDialogOpen }),

  importProgress: {
    isImporting: false,
    title: '',
    detail: '',
    percent: 0,
  },
  lastImportBanner: null,
  setImportProgress: (next) =>
    set((state) => ({
      importProgress: { ...state.importProgress, ...next },
    })),
  resetImportProgress: () =>
    set({
      importProgress: {
        isImporting: false,
        title: '',
        detail: '',
        percent: 0,
      },
    }),
  setLastImportBanner: (lastImportBanner) => set({ lastImportBanner }),

  toasts: [],
  showToast: (message, variant = 'success') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    set((state) => ({
      toasts: [...state.toasts.slice(-3), { id, message, variant }],
    }));

    window.setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4500);
  },
  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
