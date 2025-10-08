import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // Browser compatibility settings
  build: {
    target: ['es2015', 'chrome63', 'firefox67', 'safari11.1'],
    cssTarget: 'chrome61',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['chart.js', 'react-chartjs-2', 'd3'],
          maps: ['mapbox-gl', 'leaflet', 'react-leaflet'],
        },
      },
    },
    // Ensure consistent builds across platforms
    assetsInlineLimit: 4096,
  },

  // CSS processing
  css: {
    postcss: './postcss.config.js',
    devSourcemap: true,
  },

  // Server settings for development
  server: {
    host: '0.0.0.0', // Allow external connections for testing on different devices
    port: 3000,
    strictPort: true,
  },

  // Preview settings
  preview: {
    host: '0.0.0.0',
    port: 5000,
  },

  // Define feature flags for consistent behavior
})
