import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { demoStory } from "../src/lib/demo/story";
import { properties, availableUnits } from "../src/lib/demo/data";

async function switchPersona(page: Page, name: string) {
  await page.getByRole("combobox", { name: "Switch demo persona" }).click();
  await page.getByRole("option", { name, exact: true }).click();
}
async function continueStory(page: Page) {
  await page.getByRole("button", { name: "Open demo guide" }).click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Continue the story", exact: true })
    .click();
}

test("public Start Demo opens four populated experiences and persona controls preserve scope", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator(".public-demo-bar")
    .getByRole("link", { name: "Start Demo" })
    .click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.locator(".sales-experience-card")).toHaveCount(4);
  await page
    .locator(".sales-experience-card")
    .filter({ hasText: "Owner Overview" })
    .click();
  await expect(page.locator("h1")).toHaveText("Portfolio overview");
  await expect(
    page.getByRole("combobox", { name: "Switch demo persona" }),
  ).toContainText("Demo: Viewing as");
  await expect(
    page.getByRole("link", { name: "Total Units 90 All inventory" }),
  ).toBeVisible();
  await switchPersona(page, "Property Manager");
  await expect(page.locator("h1")).toHaveText("Operations center");
  await expect(page.locator(".organization-selector")).toContainText(
    "Alder & Stone Living",
  );
  await switchPersona(page, "Maintenance");
  await expect(
    page.getByRole("button", { name: "My assignments", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".maintenance-list .panel")).toHaveCount(3);
  await page.getByRole("button", { name: "Team queue", exact: true }).click();
  await expect(page.locator(".maintenance-list .panel")).toHaveCount(8);
  await expect(
    page
      .getByRole("navigation", { name: "Workspace navigation" })
      .getByRole("link", { name: /Residents|Applications|Analytics/ }),
  ).toHaveCount(0);
  await switchPersona(page, "Resident");
  await expect(page.locator("main")).toContainText("Alex");
  await expect(page.locator("main")).toContainText("A-101");
  await switchPersona(page, "Applicant");
  await expect(page.locator(".sales-interested-home")).toContainText("2 beds");
  await expect(page.locator(".sales-interested-home")).toContainText("B-302");
  await page.goto(
    "/workspace/" + properties[0].organization_id + "?persona=owner&demo=true",
  );
  await expect(page).toHaveURL(/\/sign-in/);
});

test("the complete guided sales story connects applicant, manager, resident, maintenance and owner", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/demo");
  await page
    .getByRole("link", { name: "Start the guided story", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Tour this two-bedroom", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Request demo tour", exact: true })
    .click();
  await expect(page.locator(".visit-card")).toContainText("B-302");
  await page
    .getByRole("link", { name: "Next: Your application", exact: true })
    .click();
  await page.getByLabel("Phone number", { exact: true }).fill("512-555-0134");
  await page.getByLabel("Number of occupants", { exact: true }).fill("2");
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Submit demo application", exact: true })
    .click();
  await page
    .getByRole("link", { name: "See it as the manager", exact: true })
    .click();
  await expect(
    page.getByRole("combobox", {
      name: "Application status for Sofia Martinez",
      exact: true,
    }),
  ).toHaveValue("submitted");
  await page
    .getByRole("row")
    .filter({ hasText: "Sofia Martinez" })
    .getByRole("button", { name: "View application" })
    .click();
  await expect(page.getByRole("dialog")).toContainText("512-555-0134");
  await expect(page.getByRole("dialog")).toContainText("B-302");
  await page.keyboard.press("Escape");
  await page.goto("/demo/property-manager/leads");
  await expect(
    page.getByRole("combobox", {
      name: "Lead status for Sofia Martinez",
      exact: true,
    }),
  ).toHaveValue("Applied");
  await expect(
    page.getByRole("region", { name: "Applicant demo tour requests" }),
  ).toContainText("Sofia Martinez");
  await expect(
    page.getByRole("region", { name: "Applicant demo tour requests" }),
  ).toContainText("B-302");
  await continueStory(page);
  await expect(page).toHaveURL(/resident\/maintenance\/new$/);
  await page
    .getByRole("button", { name: "Use sample request & photo", exact: true })
    .click();
  await expect(page.locator(".r-file-list")).toContainText("demo-kitchen.jpg");
  await page.getByLabel("Our team may enter when I’m away.").check();
  await page
    .getByRole("button", { name: "Submit demo request", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Kitchen cabinet hinge needs adjusting",
    }),
  ).toBeVisible();
  await expect(page.locator(".r-attachment img")).toBeVisible();
  await continueStory(page);
  await expect(page).toHaveURL(/property-manager\/maintenance$/);
  const card = page
    .locator(".maintenance-list .panel")
    .filter({ hasText: "Kitchen cabinet hinge needs adjusting" });
  await card.getByRole("button", { name: "View request" }).click();
  await expect(
    page.getByRole("dialog").locator(".r-attachment img"),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Assign request to" })
    .selectOption(demoStory.maintenanceUserId);
  await page.keyboard.press("Escape");
  await continueStory(page);
  await expect(page).toHaveURL(/\/demo\/maintenance$/);
  await expect(page.locator(".maintenance-list .panel")).toHaveCount(4);
  await card.getByRole("button", { name: "View request" }).click();
  await page.getByRole("button", { name: "Start work", exact: true }).click();
  await page.keyboard.press("Escape");
  await continueStory(page);
  await expect(page.locator(".r-progress [aria-current=step]")).toContainText(
    "In Progress",
  );
  await expect(page.locator(".r-events")).toContainText("Marcus Reed");
  await continueStory(page);
  await expect(page).toHaveURL(/\/demo\/owner$/);
  await expect(
    page.getByRole("link", { name: /Open Maintenance Requests 9/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open demo guide" }).click();
  await expect(
    page.getByRole("progressbar", { name: "Demo story progress" }),
  ).toHaveAttribute("value", "9");
  await page.reload();
  await page.getByRole("button", { name: "Open demo guide" }).click();
  await expect(
    page.getByRole("progressbar", { name: "Demo story progress" }),
  ).toHaveAttribute("value", "9");
  await page
    .getByRole("button", { name: "Reset demo data", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Reset this demo", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Demo restored");
  await expect(
    page.getByRole("progressbar", { name: "Demo story progress" }),
  ).toHaveAttribute("value", "0");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("link", { name: /Open Maintenance Requests 8/ }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("applicant apartment cards stay in the demo and preserve a different property selection", async ({
  page,
}) => {
  await page.goto("/demo/applicant");
  await page
    .getByRole("combobox", { name: "Filter by community" })
    .selectOption(properties[1].id);
  await expect(page.locator(".unit-card")).toHaveCount(3);
  const card = page.locator(".unit-card").first();
  await expect(card).toContainText("Juniper Park");
  await card
    .getByRole("link", { name: "Schedule a tour", exact: true })
    .click();
  await expect(page).toHaveURL(/\/demo\/applicant\/tour$/);
  await page
    .getByRole("button", { name: "Request demo tour", exact: true })
    .click();
  await page
    .getByRole("link", { name: "View the manager’s tour inbox", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Applicant demo tour requests" }),
  ).toContainText("Juniper Park");
  await expect(
    page
      .getByRole("region", { name: "Lead pipeline records" })
      .getByRole("row")
      .filter({ hasText: "Sofia Martinez" }),
  ).toContainText("Juniper Park");
  await page.goto("/demo/applicant/saved");
  await page.getByRole("link", { name: "Apply", exact: true }).click();
  await expect(page).toHaveURL(/\/demo\/applicant\/application$/);
  await expect(page.locator(".application-summary")).toContainText(
    "Juniper Park",
  );
});

test("reset hides earlier website inquiries in this tab without deleting records or another tab’s state", async ({
  page,
  context,
}) => {
  const unit = availableUnits[0];
  const payload = {
    kind: "application",
    requestId: crypto.randomUUID(),
    propertyId: unit.property_id,
    unitId: unit.id,
    floorPlanId: unit.floor_plan_id,
    firstName: "Demo",
    lastName: "Visitor",
    email: "demo-visitor@example.test",
    phone: "512-555-0193",
    message: "A fictional inquiry for the sales demonstration.",
    website: "",
    moveIn: "2026-10-12",
    occupants: 2,
    pets: "none",
  };
  const response = await page.request.post("/api/leasing", {
    headers: { origin: "http://127.0.0.1:3000" },
    data: payload,
  });
  expect(response.status()).toBe(201);
  const second = await context.newPage();
  await second.goto("/demo/applicant/tour");
  await second
    .getByRole("button", { name: "Request demo tour", exact: true })
    .click();
  await page.goto("/demo/property-manager/leads");
  await expect(
    page.getByRole("region", { name: "Lead pipeline records" }),
  ).toContainText("Demo Visitor");
  const cookiesBefore = await context.cookies();
  await page.getByRole("button", { name: "Open demo guide" }).click();
  await page
    .getByRole("button", { name: "Reset demo data", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Reset this demo", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("region", { name: "Lead pipeline records" }),
  ).not.toContainText("Demo Visitor");
  await page.reload();
  await expect(
    page.getByRole("region", { name: "Lead pipeline records" }),
  ).not.toContainText("Demo Visitor");
  const retained = await page.request.get("/api/leasing");
  expect(
    (await retained.json()).records.some(
      (record: { payload: { requestId: string } }) =>
        record.payload.requestId === payload.requestId,
    ),
  ).toBe(true);
  expect(
    (await context.cookies()).map(({ name, value }) => ({ name, value })),
  ).toEqual(cookiesBefore.map(({ name, value }) => ({ name, value })));
  await second.reload();
  await expect(second.locator(".visit-card")).toContainText("Tour requested");
  const newPayload = {
    ...payload,
    requestId: crypto.randomUUID(),
    firstName: "Fresh",
  };
  expect(
    (
      await page.request.post("/api/leasing", {
        headers: { origin: "http://127.0.0.1:3000" },
        data: newPayload,
      })
    ).status(),
  ).toBe(201);
  await page
    .getByRole("button", { name: "Refresh inquiries", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Lead pipeline records" }),
  ).toContainText("Fresh Visitor");
  await second.close();
});

test("launcher, guided controls and story drawer work accessibly at phone, tablet and desktop widths", async ({
  page,
}) => {
  test.setTimeout(120_000);
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/demo");
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    const launcher = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      launcher.violations.map((violation) => ({
        id: violation.id,
        nodes: violation.nodes.map((node) => node.failureSummary),
      })),
    ).toEqual([]);
    await page
      .getByRole("link", { name: "Start the guided story", exact: true })
      .click();
    for (const name of [
      "Applicant",
      "Property Manager",
      "Maintenance",
      "Resident",
      "Owner",
    ]) {
      await switchPersona(page, name);
      await expect(
        page.getByRole("combobox", { name: "Switch demo persona" }),
      ).toContainText(name);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `${width} ${name}`,
      ).toBe(true);
      await page.getByRole("button", { name: "Open demo guide" }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      const scan = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(
        scan.violations.map((violation) => ({
          id: violation.id,
          nodes: violation.nodes.map((node) => node.failureSummary),
        })),
        `${width} ${name}`,
      ).toEqual([]);
      await page.keyboard.press("Escape");
      await expect(
        page.getByRole("button", { name: "Open demo guide" }),
      ).toBeFocused();
    }
  }
});
