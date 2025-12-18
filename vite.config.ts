import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import viteCompression from 'vite-plugin-compression';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024, // Only compress files larger than 1KB
      deleteOriginFile: false, // Keep original files
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Molkhas',
        short_name: 'Molkhas',
        description: 'منصة لمشاركة الملخصات الدراسية بين طلاب الجامعات',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'logo_1.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo_1.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  build: {
    // Increase chunk size warning limit since we have code splitting
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'react-vendor': ['react', 'react-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'ui-vendor': ['lucide-react'],
          'ai-vendor': ['@google/generative-ai'],
          // Group contexts together
          'contexts': ['./src/contexts/AuthContext', './src/contexts/ThemeContext', './src/contexts/ChatContext'],
          // Group utilities together
          'utils': ['./src/lib/supabase', './src/lib/gemini'],
          // Group hooks together
          'hooks': ['./src/hooks/useAppeals', './src/hooks/useNews', './src/hooks/useSummaries', './src/hooks/useNotifications'],
        }
      }
    },
    // Enable minification and compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      }
    }
  },
  optimizeDeps: {
    // Remove the lucide-react exclusion since we're including it in manual chunks
    include: ['react', 'react-dom', '@supabase/supabase-js']
  },
  // Ensure .env files are loaded from project root
  envPrefix: 'VITE_',
});
