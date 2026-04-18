import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx', 'tests/integration/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/plans/**', 'src/lib/ai/usage.ts', 'src/lib/rate-limit.ts', 'src/lib/errors/**', 'src/lib/ai/chat-errors.ts', 'src/lib/actions/action-registry.ts', 'src/lib/build/**', 'src/lib/api/**', 'src/lib/ai/agents/index.ts', 'src/lib/ai/agents/phase-agents.ts', 'src/lib/plans/credit-packs.ts'],
      exclude: ['src/**/*.d.ts'],
      reporter: ['text-summary'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
