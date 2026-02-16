import { test as base, expect, type Page } from "@playwright/test";
import { TEST_USERS } from "../config/test-config";

type AuthFixtures = {
  authenticatedPage: Page;
  adminPage: Page;
  auditorPage: Page;
};

/**
 * Extended test fixture with authenticated pages
 * Usage: test('my test', async ({ authenticatedPage }) => { ... })
 */
/* eslint-disable react-hooks/rules-of-hooks */
export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await loginAs(page, TEST_USERS.admin);
    await use(page);
  },

  adminPage: async ({ page }, use) => {
    await loginAs(page, TEST_USERS.admin);
    await use(page);
  },
});
/* eslint-enable react-hooks/rules-of-hooks */

/**
 * Helper function to login as a specific user
 */
async function loginAs(page: Page, user: { email: string; password: string }) {
  await page.goto("/login");

  // Wait for login form to be visible
  await page.waitForSelector('input[name="email"]', { timeout: 10000 });

  // Fill credentials
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait a bit for login to process
  await page.waitForTimeout(3000);

  // Handle session conflict if it appears
  const sessionModal = page.locator('text="Active Session Detected"');
  const isSessionModalVisible = await sessionModal
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  if (isSessionModalVisible) {
    // Modal appeared - click "Sign Out Other Sessions & Continue" button
    const forceLoginButton = page.locator(
      'button:has-text("Sign Out Other Sessions & Continue")'
    );
    await forceLoginButton.waitFor({ state: "visible", timeout: 5000 });
    await forceLoginButton.click();

    // Wait for force login to process
    await page.waitForTimeout(3000);
  }

  // Wait for successful redirect - increased timeout for concurrent test handling
  await page.waitForURL(/\/(welcome|dashboard)/, { timeout: 30000 });

  // Wait for token to be stored
  await page.waitForTimeout(2000);

  // Verify token is in localStorage - wrapped in try/catch for navigation issues
  try {
    const hasToken = await page.evaluate(() => {
      const token = localStorage.getItem("Token");
      return token !== null && token.length > 0;
    });

    if (!hasToken) {
      throw new Error(
        "Login succeeded but token was not stored in localStorage"
      );
    }
  } catch (error) {
    // If page navigated during evaluation, that's okay - login succeeded
    if (!error.message?.includes("Execution context was destroyed")) {
      throw error;
    }
  }
}

export { expect };
