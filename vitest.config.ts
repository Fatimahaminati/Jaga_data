import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./tests-setup/vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Seluruh sumber ikut diukur, termasuk lapisan komponen/halaman.
      include: ['src/**'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/main.tsx', // titik masuk ReactDOM; diverifikasi lewat smoke test manual
        'src/components/ErrorBoundary.tsx', // hanya aktif saat crash global (lihat kasus uji E2E-09)
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
})
