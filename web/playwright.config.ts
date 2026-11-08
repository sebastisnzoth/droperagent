import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: { baseURL: 'http://127.0.0.1:5173/droperagent/', browserName: 'chromium', screenshot: 'only-on-failure' },
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort', url: 'http://127.0.0.1:5173/droperagent/', timeout: 90_000, reuseExistingServer: !process.env.CI },
  reporter: [['list']],
  retries: process.env.CI ? 1 : 0,
});
