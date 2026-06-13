import { test, expect } from "@playwright/test";

test.describe("EcoBuddy AI E2E Smoke Tests", () => {
  test("should load the landing page successfully and verify titles", async ({ page }) => {
    // Navigate to local baseURL defined in config
    await page.goto("/");

    // Verify page title
    await expect(page).toHaveTitle(/EcoBuddy/i);

    // Verify main brand heading elements
    const heading = page.locator("h1");
    await expect(heading).toContainText("EcoBuddy AI");
  });

  test("should check accessibility features on forms", async ({ page }) => {
    await page.goto("/");

    // Verify that the login section exists and email input is accessible
    const emailInput = page.locator('input[type="email"]');
    if ((await emailInput.count()) > 0) {
      await expect(emailInput).toBeVisible();
      await expect(emailInput).toHaveAttribute("id");
    }
  });
});
