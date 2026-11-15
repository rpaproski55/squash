/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Relative base so the build works from any folder (GitHub Pages project path,
// a preview host, or a local file server).
// `--mode preview-page` builds a copy without the service worker, for hosts
// that do not allow one (such as a shared preview page).
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [
    react(),
    mode !== 'preview-page' && VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Squash',
        short_name: 'Squash',
        description: 'What to work on today, and proof you are improving.',
        theme_color: '#FBF8F4',
        background_color: '#FBF8F4',
        display: 'standalone',
        start_url: './',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,woff2}'] },
    }),
  ],
  define: { __PWA__: JSON.stringify(mode !== 'preview-page') },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}))
