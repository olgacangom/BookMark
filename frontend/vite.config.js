import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('lucide-react')) {
            return 'icons';
          }
        },
      },
    },
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '*.config.js',       
        '*.config.cjs',
        'eslint.config.js',
        'src/main.tsx',      
        'src/vite-env.d.ts',
        'src/components/shared/**',
        'src/users/pages',
        'src/pages/**',
        'src/layouts',
        'src/bookstore',
        'App.tsx'
      ],
    },
  },
})