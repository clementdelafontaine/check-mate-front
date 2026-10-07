import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  test: {
    environment: 'jsdom'
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API_URL || 'http://127.0.0.1:3100',
        changeOrigin: true
      }
    }
  },
  plugins: [
    vue(),
    ['true', 'dev'].includes(process.env.VITE_DEVTOOLS) ? vueDevTools() : false,
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'CheckMate',
        short_name: 'CheckMate',
        description: 'Vos checklists, partout avec vous.',
        theme_color: '#0a0a0b',
        background_color: '#0a0a0b',
        display: 'standalone',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        navigateFallback: 'index.html'
      }
    })
  ]
})
