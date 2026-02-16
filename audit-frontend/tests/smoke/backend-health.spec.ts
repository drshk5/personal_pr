import { test, expect } from "@playwright/test";

/**
 * Backend Health Checks
 * Verifies backend is responding to requests
 */

test.describe("Backend Health Checks", () => {
  test("Backend is responding", async ({ request }) => {
    // Check that backend responds (even with 401 Unauthorized means it's working)
    const response = await request.get("https://localhost:5001/api/auth/me");

    // Any response (200, 401, 403, etc.) means backend is responding
    // Only network errors would cause this to fail
    expect(response.status()).toBeGreaterThan(0);
  });

  test("Auth endpoint is reachable", async ({ request }) => {
    // Test that auth API is reachable (even if it returns 401)
    const response = await request.get("https://localhost:5001/api/auth/me");

    // We expect either 200 (if authenticated) or 401 (requires auth) - both mean API is working
    expect([200, 401, 403].includes(response.status())).toBeTruthy();
  });
});
