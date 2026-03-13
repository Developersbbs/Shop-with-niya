import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
  ],

  server: {
    host: true,
    allowedHosts: [
      "shop-with-niya.sbbs.co.in"
    ]
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth'],
          ui: ['@heroicons/react', 'lucide-react', 'react-hot-toast', 'react-toastify'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
          utils: ['axios', 'react-helmet-async']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@reduxjs/toolkit',
      'firebase/app',
      'firebase/auth',
      'axios'
    ]
  }
})