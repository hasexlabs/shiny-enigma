import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig(() => {
  return {
    publicDir: 'public',
    plugins: [
      sentryVitePlugin({
        authToken: process.env.SENTRY_AUTH_TOKEN,
        org: "hasex",
        project: "hasex-web",
      }),
      react(),
      tailwindcss()
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      // Enable code splitting
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunk for React and core libraries
            vendor: ['react', 'react-dom', '@supabase/supabase-js'],
            // UI libraries chunk
            'ui-libs': ['lucide-react', 'motion'],
          },
        },
      },
      // Optimize chunk size
      chunkSizeWarningLimit: 1000,
      // Minify output
      minify: 'terser' as const,
      terserOptions: {
        compress: {
          drop_console: false, // Keep console logs for debugging
          drop_debugger: true,
        },
      },
      // Enable CSS code splitting
      cssCodeSplit: true,
      // Enable source maps for Sentry error tracking
      sourcemap: true,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom', '@supabase/supabase-js', 'lucide-react', 'motion'],
    },
  };
});
