import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { defineConfig } from '@playwright/test';

if (existsSync('.env')) loadEnvFile('.env');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 2,
  use: {
    browserName: 'chromium',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
