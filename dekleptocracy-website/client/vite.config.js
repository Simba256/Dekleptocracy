import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries - always needed
          'react-vendor': ['react', 'react-dom'],
          // Router - loaded with first navigation
          'router': ['react-router-dom'],
          // Charts/map libs - lazy loaded with PriceMapSection
          'charts': ['d3-scale', 'react-simple-maps', 'topojson-client', 'react-tooltip'],
        }
      }
    },
    // Warn if chunks exceed 500KB
    chunkSizeWarningLimit: 500,
    // Enable minification with esbuild (faster than terser)
    minify: 'esbuild',
    // Generate source maps for debugging (production)
    sourcemap: true,
    // Target modern browsers for smaller bundles
    target: 'es2020',
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})
