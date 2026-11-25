import { expect, test } from "@playwright/test";

test("student signup derives the ERP number and submits the account details", async ({ page }) => {
  await page.goto("/sign-up");
  await page.getByLabel("Full Name").fill("Ayesha Khan");
  await page.getByLabel("IBA Email").fill("ayesha.khan.12345@khi.iba.edu.pk");

  await expect(page.getByText("Student account")).toBeVisible();
  await expect(page.getByLabel("ERP / Student ID")).toHaveValue("12345");

  const signupRequestPromise = page.waitForRequest((request) =>
    request.url().endsWith("/api/auth/signup") && request.method() === "POST",
  );
  let mockSignupHandled = false;
  await page.route("**/api/auth/signup", async (route) => {
    mockSignupHandled = true;
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });

  const passwords = page.locator('input[autocomplete="new-password"]');
  await passwords.nth(0).fill("PlaywrightPass123!");
  await passwords.nth(1).fill("PlaywrightPass123!");
  await page.getByRole("button", { name: "Create Account" }).click();

  const signupRequest = await signupRequestPromise;
  expect(signupRequest.postDataJSON()).toMatchObject({
    email: "ayesha.khan.12345@khi.iba.edu.pk",
    firstName: "Ayesha",
    lastName: "Khan",
    accountType: "student",
  });
  await expect.poll(() => mockSignupHandled).toBe(true);
  await expect(page).toHaveURL(/\/verify-email\?email=/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();
});

test("signup rejects email addresses outside IBA domains", async ({ page }) => {
  await page.goto("/sign-up");
  await page.getByLabel("Full Name").fill("Ayesha Khan");
  await page.getByLabel("IBA Email").fill("ayesha@example.com");
  const passwords = page.locator('input[autocomplete="new-password"]');
  await passwords.nth(0).fill("PlaywrightPass123!");
  await passwords.nth(1).fill("PlaywrightPass123!");
  await page.getByRole("button", { name: "Create Account" }).click();

  await expect(page.getByText("Use your IBA student or faculty email address.", { exact: true })).toBeVisible();
});

test("signup API rejects non-IBA addresses before contacting the backend", async ({ request }) => {
  const response = await request.post("/api/auth/signup", {
    data: {
      email: "person@example.com",
      password: "PlaywrightPass123!",
      firstName: "Test",
      lastName: "Person",
      phone: "",
      accountType: "faculty",
    },
  });

  expect(response.status()).toBe(400);
  expect(await response.json()).toMatchObject({
    error: "Only IBA student and faculty email addresses can be used with RADES.",
  });
});
