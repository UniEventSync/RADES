import { defineConfig, devices } from "@playwright/test";

const testEnvironment = {
  APP_URL: "http://127.0.0.1:4173",
  NEXT_DIST_DIR: ".next-playwright",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54500",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "playwright-test-key",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "playwright-test-key",
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "",
  SUPABASE_SECRET_KEY: "",
  STRIPE_SECRET_KEY: "",
  STRIPE_WEBHOOK_SECRET: "",
  RESEND_API_KEY: "",
  SMTP_PASSWORD: "",
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: "",
  NEXT_TELEMETRY_DISABLED: "1",
};

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  reporter: process.env.CI
    ? [["github"], ["html", { outputFolder: "playwright-report", open: "never" }]]
    : "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "node scripts/playwright-mock-backend.mjs",
      url: "http://127.0.0.1:54500/health",
      timeout: 30_000,
      reuseExistingServer: false,
      env: { PLAYWRIGHT_MOCK_PORT: "54500" },
    },
    {
      command: "npm run dev -- --hostname 127.0.0.1 --port 4173",
      url: "http://127.0.0.1:4173",
      timeout: 120_000,
      reuseExistingServer: false,
      env: testEnvironment,
    },
  ],
});
