import { expect, test } from "@playwright/test";

test("visitors can browse published events from the landing page", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Find your next campus moment." })).toBeVisible();
  await page.getByRole("link", { name: "Browse events" }).click();

  await expect(page).toHaveURL(/\/events$/);
  await expect(page.getByRole("heading", { name: "UPCOMING CAMPUS EVENTS" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Robotics Lab Night" })).toBeVisible();
  await expect(page.locator("article")).toHaveCount(3);
});

test("theme selection persists across page reloads", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();

  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.getByRole("button", { name: "Switch to light mode" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("mobile navigation opens and routes to event discovery", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();

  const eventsLink = page.getByRole("link", { name: "Explore Events", exact: true });
  await expect(eventsLink).toBeVisible();
  await eventsLink.click();
  await expect(page).toHaveURL(/\/events$/);
  await expect(page.getByRole("heading", { name: "UPCOMING CAMPUS EVENTS" })).toBeVisible();
});
