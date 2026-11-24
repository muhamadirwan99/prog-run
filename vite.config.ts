import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Konfigurasi Vite (mirip build.gradle / pubspec.yaml untuk build tooling web).
 * - react(): compiler JSX/TSX React
 * - tailwindcss(): engine Tailwind CSS v4
 * - VitePWA(): membuat web bisa di-install ke home screen HP & jalan offline
 */
export default defineConfig({
  // Base path wajib sesuai nama repository GitHub Pages: https://muhamadirwan99.github.io/prog-run/
  base: '/prog-run/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-icon.svg'],
      manifest: {
        name: 'Road to 10K Sub-60 Tracker',
        short_name: 'Road210K',
        description:
          'Tracker progres lari 1 tahun (10:00 -> 6:00/km) 100% lokal dari Strava Bulk Export.',
        start_url: '/prog-run/',
        scope: '/prog-run/',
        theme_color: '#020617',
        background_color: '#020617',
        display: 'standalone',
        orientation: 'portrait-primary',
        lang: 'id',
        icons: [
          {
            src: 'pwa-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Cache semua aset statis lokal (JS, CSS, HTML, SVG) agar checklist & timer tetap jalan offline
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Jangan cache tile peta eksternal secara paksa agar kuota penyimpanan HP tetap aman
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      // Alias "@/" merujuk ke folder "src/" (mirip import 'package:road_to_10k/...')
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  worker: {
    // Format ES module supaya Web Worker bisa import JSZip, pako, PapaParse, fast-xml-parser
    format: 'es',
  },
});
