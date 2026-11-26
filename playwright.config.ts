import { defineConfig, devices } from "@playwright/test";

const appUrl = "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: appUrl,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "docker compose --env-file /dev/null -p product-catalogue-test -f compose.test.yaml up --build --abort-on-container-exit",
    url: appUrl,
    reuseExistingServer: false,
    timeout: 240_000,
    gracefulShutdown: { signal: "SIGTERM", timeout: 15_000 },
  },
});
