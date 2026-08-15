import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e/dashboard',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  timeout: 120_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [['list']],
  outputDir: './test-results',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3100',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    navigationTimeout: 60_000,
    actionTimeout: 15_000,
  },
  // Serves the production build (run `npm run build` first).
  webServer: {
    command: 'npm run start -- -p 3100',
    url: 'http://localhost:3100/dashboard',
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
