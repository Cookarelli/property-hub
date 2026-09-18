import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { personas, navFor, demoHref } from "../src/lib/navigation";
async function switchPersona(page: Page, label: string) {
  await page.getByRole("combobox", { name: "Switch demo persona" }).click();
  await page.getByRole("option", { name: label, exact: true }).click();
}
test("every public route and every persona section loads without page errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const routes = [
    "/",
    "/demo",
    "/properties",
    "/availability",
    "/how-it-works",
    "/contact",
    "/sign-in",
    "/properties/the-mercer",
    "/properties/juniper-park",
    "/properties/westhaven-lofts",
    ...personas.flatMap((p) => navFor(p.id).map((n) => demoHref(p.id, n))),
  ];
  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator("h1").first(), route).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      `${route} has no horizontal page overflow`,
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});
test("public search, empty state, availability filters and saved apartment work", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("textbox", { name: "City or neighborhood" })
    .fill("Juniper");
  await page.getByRole("button", { name: "Find your home" }).click();
  await expect(page.locator(".property-card")).toHaveCount(1);
  await expect(page.locator(".property-card")).toContainText("Juniper Park");
  await page
    .getByRole("textbox", { name: "Search communities" })
    .fill("No matching neighborhood");
  await expect(
    page.getByText("No communities match your search"),
  ).toBeVisible();
  await page.goto("/availability");
  await page
    .getByRole("combobox", { name: "Filter by bedrooms" })
    .selectOption("1");
  await expect(page.locator(".unit-card")).toHaveCount(3);
  await page.locator(".save-unit").first().click();
  await page.getByRole("link", { name: "View your saved apartment" }).click();
  await expect(page.locator(".unit-card")).toHaveCount(1);
  await page.reload();
  await expect(page.locator(".save-unit")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
test("all five personas switch without signing in and cannot authorize production routes", async ({
  page,
}) => {
  await page.goto("/demo/owner");
  for (const p of personas) {
    await switchPersona(page, p.label);
    await expect(page).toHaveURL(new RegExp(`/demo/${p.id}$`));
    await expect(
      page.getByRole("combobox", { name: "Switch demo persona" }),
    ).toContainText("Demo: Viewing as");
  }
  await page.goto("/demo/resident/analytics");
  await expect(
    page.getByRole("heading", { name: "Let’s get you back home." }),
  ).toBeVisible();
  await page.goto(
    "/workspace/00000001-0000-4000-8000-000000000001?persona=owner",
  );
  await expect(page).toHaveURL(/\/sign-in/);
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeDisabled();
});
test("resident request is visible to maintenance and completion returns to resident", async ({
  page,
}) => {
  await page.goto("/demo/resident/maintenance");
  await page.getByRole("link", { name: "New request" }).click();
  await page
    .getByLabel("What needs attention?")
    .fill("Bathroom faucet needs a repair");
  await page
    .getByLabel("Tell us a little more")
    .fill("The bathroom faucet drips continuously even when fully closed.");
  await page.getByLabel("Our team may enter when I’m away.").check();
  await page.getByRole("button", { name: "Submit demo request" }).click();
  await expect(page.getByRole("status")).toContainText("saved");
  await switchPersona(page, "Maintenance");
  await page.getByRole("button", { name: "Team queue", exact: true }).click();
  const card = page
    .locator(".maintenance-list .panel")
    .filter({ hasText: "Bathroom faucet needs a repair" });
  await card.getByRole("button", { name: "View request" }).click();
  await page.getByRole("button", { name: "Mark completed" }).click();
  await page.keyboard.press("Escape");
  await switchPersona(page, "Resident");
  await page.goto("/demo/resident/maintenance");
  await page.getByRole("button", { name: /^Completed/ }).click();
  await expect(page.locator(".maintenance-list")).toContainText(
    "Bathroom faucet needs a repair",
  );
});
test("applicant submission and tour request persist, manager sees submitted details", async ({
  page,
}) => {
  await page.goto("/demo/applicant/application");
  await page.getByLabel("First name").fill("Robin");
  await page.getByLabel("Last name").fill("Taylor");
  await page.getByLabel("Email address").fill("robin@example.test");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Submit demo application" }).click();
  await expect(
    page.getByRole("heading", { name: "You’re on your way." }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "You’re on your way." }),
  ).toBeVisible();
  await switchPersona(page, "Property Manager");
  await page
    .getByRole("navigation", { name: "Workspace navigation" })
    .getByRole("link", { name: /Applications/ })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Application status for Robin Taylor" }),
  ).toHaveValue("submitted");
  await switchPersona(page, "Applicant");
  await page.goto("/demo/applicant/tour");
  await page.getByLabel("Your preferred day").fill("2026-10-05");
  await page.getByRole("button", { name: "Request demo tour" }).click();
  await expect(page.locator(".visit-card")).toContainText(
    "2026-10-05 at 10:00 AM",
  );
});
test("announcements propagate and documents download usable content", async ({
  page,
}) => {
  await page.goto("/demo/owner/announcements");
  await page.getByRole("button", { name: "Write announcement" }).click();
  await page.getByLabel("Title", { exact: true }).fill("Demo courtyard picnic");
  await page
    .getByLabel("Message", { exact: true })
    .fill("Join your demo neighbors in the courtyard this Saturday afternoon.");
  await page.getByRole("button", { name: "Publish to demo" }).click();
  await switchPersona(page, "Resident");
  await page.goto("/demo/resident/announcements");
  await expect(
    page.getByRole("heading", { name: "Demo courtyard picnic" }),
  ).toBeVisible();
  await page.goto("/demo/resident/documents");
  await page.getByRole("button", { name: "Resident welcome guide" }).click();
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download demo document" }).click();
  const file = await downloaded;
  expect(file.suggestedFilename()).toBe("resident-welcome-guide.txt");
  expect(await file.failure()).toBeNull();
});
test("mobile navigation, widths, and core accessibility checks", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
    "/",
    "/properties",
    "/demo/owner",
    "/demo/resident",
    "/demo/resident/payments",
    "/demo/resident/maintenance",
    "/demo/applicant/application",
    "/demo/maintenance",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1").first()).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      route,
    ).toBe(true);
    const scan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      scan.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
      route,
    ).toEqual([]);
  }
  await page.goto("/demo/resident");
  await page
    .getByRole("navigation", { name: "Resident quick navigation" })
    .getByRole("link", { name: "Payments" })
    .click();
  await expect(page).toHaveURL(/\/payments$/);
  await page.getByRole("button", { name: "Open workspace navigation" }).click();
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  expect(errors).toEqual([]);
});
