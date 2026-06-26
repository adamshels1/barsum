import { expect, test } from "@playwright/test";

test.describe("Auth flows", () => {
  test("home page shows role selector", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Barsum")).toBeVisible();
    await expect(page.getByText("Войти как родитель")).toBeVisible();
    await expect(page.getByText("Войти как ребёнок")).toBeVisible();
  });

  test("navigates to parent auth", async ({ page }) => {
    await page.goto("/");
    await page.click("text=Войти как родитель");
    await expect(page).toHaveURL("/auth/parent");
  });

  test("navigates to child auth", async ({ page }) => {
    await page.goto("/");
    await page.click("text=Войти как ребёнок");
    await expect(page).toHaveURL("/auth/child");
  });
});
