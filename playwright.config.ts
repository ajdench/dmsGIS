import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:4180/dmsGIS/',
  },
  webServer: {
    command: 'npm run dev -- --host --strictPort --port 4180',
    port: 4180,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
