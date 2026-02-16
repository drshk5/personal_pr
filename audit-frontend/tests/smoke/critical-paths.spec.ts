import { test, expect, type Page } from "@playwright/test";
import { clickButton, fillFormField } from "../helpers/test-helpers";
import { TEST_USERS } from "../config/test-config";

/**
 * Critical Smoke Tests
 * Tests the core authentication flow:
 * 1. User can login
 * 2. Redirects to welcome page
 * 3. Auth /me endpoint works
 * 4. Role endpoint works
 */

test.describe.serial("Critical User Flows - Smoke Tests", () => {
  let sharedPage: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    sharedPage = await context.newPage();
  });

  test("1. User can login successfully", async () => {
    await sharedPage.goto("/login");

    // Wait for login form
    await expect(sharedPage.locator('input[name="email"]')).toBeVisible();

    // Fill credentials from config
    await fillFormField(sharedPage, "email", TEST_USERS.admin.email);
    await fillFormField(sharedPage, "password", TEST_USERS.admin.password);

    // Submit
    await clickButton(sharedPage, "Log in");

    // Wait a bit for login to process
    await sharedPage.waitForTimeout(2000);

    // Check if session conflict modal appears (409 response)
    const sessionModal = sharedPage.locator('text="Active Session Detected"');
    const isSessionModalVisible = await sessionModal
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (isSessionModalVisible) {
      // Modal appeared - click "Sign Out Other Sessions & Continue" button
      const forceLoginButton = sharedPage.locator(
        'button:has-text("Sign Out Other Sessions & Continue")'
      );
      await forceLoginButton.waitFor({ state: "visible", timeout: 5000 });
      await forceLoginButton.click();

      // Wait for force login to process
      await sharedPage.waitForTimeout(2000);
    }
  });

  test("2. After login redirects to welcome page", async () => {
    // Verify redirect to welcome page
    await sharedPage.waitForURL(/\/welcome/, { timeout: 15000 });
    await expect(sharedPage).toHaveURL(/\/welcome/);
    await expect(sharedPage.locator("body")).toBeVisible();
  });

  test("3. Auth /me endpoint works properly", async () => {
    // Set up response listener before navigation
    const authResponsePromise = sharedPage.waitForResponse(
      (response) =>
        response.url().includes("/api/auth/me") && response.status() === 200,
      { timeout: 15000 }
    );

    // Navigate to welcome page to trigger the API call
    await sharedPage.goto("/welcome");

    // Wait for the auth response
    const authResponse = await authResponsePromise;

    // Verify auth endpoint worked successfully
    expect(authResponse.ok()).toBeTruthy();
    expect(authResponse.status()).toBe(200);
  });

  test("4. Role endpoint works properly", async () => {
    // Set up response listener before navigation
    const roleResponsePromise = sharedPage.waitForResponse(
      (response) =>
        response.url().includes("/api/UserRights/role") &&
        response.status() === 200,
      { timeout: 15000 }
    );

    // Navigate to welcome page to trigger the API call
    await sharedPage.goto("/welcome");

    // Wait for the role response
    const roleResponse = await roleResponsePromise;

    // Verify role endpoint worked successfully
    expect(roleResponse.ok()).toBeTruthy();
    expect(roleResponse.status()).toBe(200);
  });
});
