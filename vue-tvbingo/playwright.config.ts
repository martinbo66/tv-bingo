import { defineConfig, devices } from '@playwright/test'

/**
 * E2E tests expect a running app by default.
 *
 * - Unified (Spring serving SPA): E2E_BASE_URL=http://localhost:8080 (default)
 * - Vite + API: E2E_BASE_URL=http://localhost:5173 and E2E_API_BASE_URL=http://localhost:8080
 *   (API helpers always use E2E_API_BASE_URL, defaulting to http://localhost:8080)
 */
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:8080'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
})
