import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,       // 循序執行，避免雲端 API 限流
  retries: 1,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 60_000,            // 60 秒（線上 API 載入較慢）
  use: {
    baseURL: 'http://localhost:5174',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    port: 5174,
    reuseExistingServer: true,
    timeout: 30_000,
  },
  globalSetup: './global-setup.ts',
})
