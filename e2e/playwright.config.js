// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '.',
  globalSetup: './global-setup.js',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    headless: false,
    slowMo: 700,
    viewport: { width: 1400, height: 900 },
    video: 'off',
    screenshot: 'only-on-failure',
    launchOptions: {
      args: ['--start-maximized'],
    },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
