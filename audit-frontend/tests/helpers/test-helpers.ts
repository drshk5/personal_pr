import { type Page, expect } from "@playwright/test";
import { TIMEOUTS } from "../config/test-config";

/**
 * Helper functions for common test operations
 */

/**
 * Wait for all API calls to complete
 */
export async function waitForAllAPIsToLoad(page: Page) {
  // Wait for main backend APIs to respond
  const apiCalls = [
    page.waitForResponse(
      (resp) => resp.url().includes("/api/") && resp.status() === 200,
      { timeout: TIMEOUTS.medium }
    ),
  ];

  await Promise.race([
    Promise.all(apiCalls),
    page.waitForLoadState("networkidle", { timeout: TIMEOUTS.long }),
  ]);
}

/**
 * Wait for SignalR connection to be established
 */
export async function waitForSignalRConnection(page: Page) {
  try {
    await page.waitForFunction(
      () => {
        // Check if signalR connection exists and is connected
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const connection = (window as any).signalRService?.connection;
        return connection && connection.state === "Connected";
      },
      { timeout: TIMEOUTS.signalR }
    );
    return true;
  } catch {
    console.warn("SignalR connection not detected");
    return false;
  }
}

/**
 * Check SignalR connection state
 */
export async function getSignalRConnectionState(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const connection = (window as any).signalRService?.connection;
    return connection?.state || null;
  });
}

/**
 * Verify SignalR WebSocket connection
 */
export async function verifySignalRWebSocket(page: Page): Promise<boolean> {
  try {
    const wsPromise = page.waitForEvent("websocket", {
      timeout: TIMEOUTS.signalR,
    });
    const ws = await wsPromise;
    return ws.url().includes("notification");
  } catch {
    return false;
  }
}

/**
 * Fill a form field by label or name
 */
export async function fillFormField(
  page: Page,
  fieldName: string,
  value: string
) {
  const input = page.locator(
    `input[name="${fieldName}"], textarea[name="${fieldName}"]`
  );
  await input.waitFor({ state: "visible", timeout: TIMEOUTS.short });
  await input.fill(value);
}

/**
 * Click a button by text content
 */
export async function clickButton(page: Page, buttonText: string) {
  const button = page.locator(`button:has-text("${buttonText}")`);
  await button.waitFor({ state: "visible", timeout: TIMEOUTS.short });
  await button.click();
}

/**
 * Wait for toast/notification message
 */
export async function waitForToast(page: Page, expectedText?: string) {
  const toast = page.locator('[role="status"], .toast, .notification');
  await toast.waitFor({ state: "visible", timeout: TIMEOUTS.short });

  if (expectedText) {
    await expect(toast).toContainText(expectedText);
  }

  return toast;
}

/**
 * Check if element is visible on page
 */
export async function isVisible(
  page: Page,
  selector: string
): Promise<boolean> {
  try {
    await page.locator(selector).waitFor({ state: "visible", timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Take a screenshot with a descriptive name
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `test-results/screenshots/${name}.png`,
    fullPage: true,
  });
}
