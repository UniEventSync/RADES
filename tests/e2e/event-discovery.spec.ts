import { expect, test } from "@playwright/test";

test("event search, category, subcategory, price, sorting, and reset work together", async ({ page }) => {
  await page.goto("/events");
  const cards = page.locator("article");

  await expect(cards).toHaveCount(3);
  await page.getByLabel("Search events").fill("robotics");
  await expect(page.getByText("1 upcoming event")).toBeVisible();
  await expect(cards).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Robotics Lab Night" })).toBeVisible();

  await page.getByLabel("Search events").fill("");
  await page.getByLabel("Hackathon").check();
  await expect(cards).toHaveCount(1);
  await page.getByLabel("Paid").check();
  await expect(page.getByRole("heading", { name: "No events match your filters" })).toBeVisible();

  await page.getByRole("button", { name: "Clear All Filters" }).click();
  await expect(cards).toHaveCount(3);
  await page.getByLabel("Music & Arts").check();
  await expect(cards).toHaveCount(1);
  await page.getByLabel("Paid").check();
  await expect(cards).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Campus Jazz Evening" })).toBeVisible();

  await page.getByRole("button", { name: "Clear All Filters" }).click();
  await page.getByLabel("Sort by").selectOption("name");
  await expect(cards.first().getByRole("heading")).toHaveText("Campus Jazz Evening");
});

test("event details show a sign-in path for signed-out visitors", async ({ page }) => {
  await page.goto("/events");
  await page.getByRole("link", { name: "View Details" }).first().click();

  await expect(page.getByRole("heading", { name: "Robotics Lab Night" })).toBeVisible();
  await page.getByRole("link", { name: "Sign in to register" }).click();
  await expect(page).toHaveURL(/\/sign-in\?next=/);
  await expect(page.getByRole("heading", { name: "Welcome Back" })).toBeVisible();
});
