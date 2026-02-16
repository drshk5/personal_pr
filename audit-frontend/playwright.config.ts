import { defineConfig, devices } from "@playwright/test";
import { testRuntime } from "./tests/config/runtime-env";

/**
 * Playwright Configuration for Audit Software Frontend
 * Tests the frontend against 3 backends: Central, Task, Accounting
 *
 * Note: If you see 'process' errors in VS Code, reload the window.
 * This file uses Node types from tsconfig.node.json
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: false,
  retries: 0,
  workers: undefined,

  reporter: [
    ["html"],
    ["junit", { outputFile: "test-results/junit.xml" }],
    ["list"],
  ],

  use: {
    baseURL: testRuntime.baseUrl,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",

    // Increase timeout for SignalR connections
    actionTimeout: testRuntime.timeout.medium,
    navigationTimeout: testRuntime.timeout.long,

    // Ignore SSL errors for local development
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // Run only chromium by default for speed
    // Uncomment below for cross-browser testing
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "npm run dev",
    url: testRuntime.baseUrl,
    reuseExistingServer: true,
    timeout: testRuntime.timeout.long * 4,
  },
});
