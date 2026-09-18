import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  properties,
  residents,
  buildings,
  leads,
  applications,
  maintenanceRequests,
} from "../src/lib/demo/data";

async function persona(page: Page, name: string) {
  await page.getByRole("combobox", { name: "Switch demo persona" }).click();
  await page.getByRole("option", { name, exact: true }).click();
}

test("owner metrics reconcile and property, inventory, and resident records are navigable", async ({
  page,
}) => {
  await page.goto("/demo/owner");
  const metrics = page.locator(".m-metrics a");
  await expect(metrics).toHaveCount(10);
  for (const [label, value] of [
    ["Total Units", "90"],
    ["Occupied Units", "78"],
    ["Vacant Units", "12"],
    ["Occupancy %", "86.7%"],
    ["Monthly Scheduled Rent", "$165,825"],
    ["Outstanding Rent", "$17,725"],
    ["Open Maintenance Requests", "8"],
    ["Pending Applications", "5"],
    ["Upcoming Lease Expirations", "9"],
  ]) {
    await expect(
      metrics
        .filter({ has: page.getByText(label, { exact: true }) })
        .locator("strong"),
    ).toHaveText(value);
  }
  await page
    .getByRole("combobox", { name: "Property", exact: true })
    .selectOption(properties[0].id);
  await expect(
    metrics
      .filter({ has: page.getByText("Total Units", { exact: true }) })
      .locator("strong"),
  ).toHaveText("30");
  await expect(
    metrics
      .filter({ has: page.getByText("Occupied Units", { exact: true }) })
      .locator("strong"),
  ).toHaveText("26");
  await page.goto("/demo/owner/properties/the-mercer");
  await expect(
    page
      .getByRole("navigation", { name: "Property sections" })
      .getByRole("link"),
  ).toHaveCount(7);
  await page
    .getByRole("navigation", { name: "Property sections" })
    .getByRole("link", { name: "Units", exact: true })
    .click();
  await expect(page.locator("tbody tr")).toHaveCount(30);
  await page
    .getByRole("combobox", { name: "Occupancy status", exact: true })
    .selectOption("available");
  await expect(page.locator("tbody tr")).toHaveCount(3);
  await expect(page.locator("tbody")).not.toContainText("Alex Rivera");
  await page.goto("/demo/owner/units");
  await page.getByLabel("Search units", { exact: true }).fill("A-101");
  await page
    .getByRole("combobox", { name: "Property", exact: true })
    .selectOption(properties[0].id);
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody")).toContainText("Alex Rivera");
  await page.goto("/demo/owner/residents");
  await page.getByLabel("Search residents").fill("Alex Rivera");
  await page.getByRole("link", { name: "Alex Rivera", exact: true }).click();
  await expect(page.locator("h1")).toHaveText("Alex Rivera");
  await page
    .getByRole("navigation", { name: "Resident record sections" })
    .getByRole("link", { name: "Lease", exact: true })
    .click();
  await expect(page.locator("main")).toContainText("Oct 31, 2026");
  await page
    .getByRole("navigation", { name: "Resident record sections" })
    .getByRole("link", { name: "Payment history", exact: true })
    .click();
  await expect(page.locator("tbody tr")).toHaveCount(4);
});

test("CRM stages and application decisions persist without collecting screening data", async ({
  page,
}) => {
  await page.goto("/demo/property-manager/leads");
  const lead = page.getByRole("combobox", {
    name: "Lead status for " + leads[0].name,
    exact: true,
  });
  await lead.selectOption("Contacted");
  await page.reload();
  await expect(lead).toHaveValue("Contacted");
  await page
    .getByRole("group", { name: "Lead pipeline" })
    .getByRole("button", { name: /^Contacted/ })
    .click();
  await expect(page.locator(".m-table tbody tr")).toHaveCount(2);
  await page.goto("/demo/property-manager/applications");
  const application = page.getByRole("combobox", {
    name: "Application status for " + applications[0].name,
    exact: true,
  });
  await application.selectOption("approved");
  await page.reload();
  await expect(application).toHaveValue("approved");
  await page
    .getByRole("combobox", { name: "Application status", exact: true })
    .selectOption("approved");
  await expect(page.locator("tbody tr")).toHaveCount(2);
  await page.goto("/demo/property-manager/activity");
  await expect(page.locator(".m-activity-list")).toContainText(
    "Application workflow updated",
  );
  await expect(page.locator(".m-activity-list")).toContainText(
    "Lead pipeline updated",
  );
  await page.goto("/demo/applicant/application");
  await expect(
    page.getByLabel(/income|social security|SSN|bank account|credit score/i),
  ).toHaveCount(0);
});

test("maintenance assignment and team notes persist while only public updates reach residents", async ({
  page,
}) => {
  await page.goto("/demo/property-manager/maintenance");
  await page
    .getByLabel("Search maintenance", { exact: true })
    .fill(maintenanceRequests[0].title);
  await page.getByRole("button", { name: "View request" }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("combobox", { name: "Assign request to" })
    .selectOption({ label: "Marcus Reed · Maintenance" });
  await dialog
    .getByLabel("Internal note", { exact: true })
    .fill("TEAM ONLY: Replacement cartridge is on shelf C4.");
  await dialog.getByRole("button", { name: "Save internal note" }).click();
  await expect(dialog.getByRole("status")).toContainText("Internal note saved");
  await dialog
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("scheduled");
  await dialog.getByLabel("Visit date", { exact: true }).fill("2026-09-22");
  await dialog.getByLabel("Visit time (Central)").fill("11:00");
  await dialog
    .getByLabel("Update for resident")
    .fill("Marcus will replace your faucet cartridge Tuesday at 11 AM.");
  await dialog.getByRole("button", { name: "Post update" }).click();
  await page.keyboard.press("Escape");
  await page
    .getByRole("combobox", { name: "Assigned staff", exact: true })
    .selectOption({ label: "Marcus Reed · Maintenance" });
  await expect(page.locator(".maintenance-list .panel")).toHaveCount(1);
  await page.reload();
  await page
    .getByLabel("Search maintenance", { exact: true })
    .fill(maintenanceRequests[0].title);
  await page.getByRole("button", { name: "View request" }).click();
  await expect(dialog).toContainText("TEAM ONLY: Replacement cartridge");
  await page.keyboard.press("Escape");
  await persona(page, "Resident");
  await page.goto("/demo/resident/maintenance/" + maintenanceRequests[0].id);
  await expect(page.locator(".r-events")).toContainText(
    "Marcus will replace your faucet",
  );
  await expect(page.locator("main")).not.toContainText("TEAM ONLY");
  await persona(page, "Maintenance");
  const nav = page.getByRole("navigation", { name: "Workspace navigation" });
  await expect(
    nav.getByRole("link", { name: /Residents|Applications|Analytics/ }),
  ).toHaveCount(0);
  await page.goto("/demo/maintenance/properties/the-mercer");
  await expect(
    page
      .getByRole("navigation", { name: "Property sections" })
      .getByRole("link"),
  ).toHaveCount(4);
  await expect(page.locator("main")).not.toContainText("Scheduled rent");
  await page.goto("/demo/maintenance/properties/the-mercer/residents");
  await expect(
    page.getByRole("heading", { name: "Let’s get you back home." }),
  ).toBeVisible();
});

test("announcements honor organization, property and building audiences", async ({
  page,
}) => {
  const ownBuildings = buildings.filter(
    (b) => b.property_id === properties[0].id,
  );
  async function publish(title: string, property: string, building = "") {
    await page.goto("/demo/property-manager/announcements");
    await page.getByRole("button", { name: "Write announcement" }).click();
    await page
      .getByRole("combobox", { name: "Audience property", exact: true })
      .selectOption(property);
    if (building)
      await page
        .getByRole("combobox", { name: "Audience building", exact: true })
        .selectOption(building);
    await page.getByLabel("Title", { exact: true }).fill(title);
    await page
      .getByLabel("Message", { exact: true })
      .fill("Our community team will be available in the lobby on Friday.");
    await page.getByRole("button", { name: "Publish to demo" }).click();
    await expect(page.getByRole("status")).toContainText(
      "Announcement published",
    );
  }
  await publish(
    "Building B residents only",
    properties[0].id,
    ownBuildings[1].id,
  );
  await publish("Building A lobby visit", properties[0].id, ownBuildings[0].id);
  await publish("Juniper neighbors only", properties[1].id);
  await publish("Portfolio office hours", "");
  await persona(page, "Resident");
  await page.goto("/demo/resident/announcements");
  await expect(page.locator(".r-announcement-feed")).toContainText(
    "Building A lobby visit",
  );
  await expect(page.locator(".r-announcement-feed")).toContainText(
    "Portfolio office hours",
  );
  await expect(page.locator(".r-announcement-feed")).not.toContainText(
    "Building B residents only",
  );
  await expect(page.locator(".r-announcement-feed")).not.toContainText(
    "Juniper neighbors only",
  );
});

test("document metadata defaults to staff access and explicit assignments can be revoked", async ({
  page,
}) => {
  await page.goto("/demo/property-manager/documents");
  await page
    .getByRole("button", { name: "Add document metadata", exact: true })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Document visibility" }),
  ).toHaveValue("staff");
  await page.getByLabel("Document title").fill("Team vendor directory");
  await page.getByRole("button", { name: "Save document metadata" }).click();
  await page
    .getByRole("button", { name: "Add document metadata", exact: true })
    .click();
  await page.getByLabel("Document title").fill("Alex renewal conversation");
  await page
    .getByRole("combobox", { name: "Document property", exact: true })
    .selectOption(properties[0].id);
  await page
    .getByRole("combobox", { name: "Document visibility" })
    .selectOption("assigned");
  await page.getByRole("checkbox", { name: /Alex Rivera/ }).check();
  await page.getByRole("button", { name: "Save document metadata" }).click();
  await persona(page, "Resident");
  await page.goto("/demo/resident/documents");
  await expect(page.locator(".r-document-card")).toHaveCount(7);
  await expect(
    page.getByRole("button", {
      name: "Alex renewal conversation",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator("main")).not.toContainText("Team vendor directory");
  await persona(page, "Property Manager");
  await page.goto("/demo/property-manager/documents");
  await page
    .locator(".m-document-grid article")
    .filter({ hasText: "Alex renewal conversation" })
    .getByRole("button", { name: "View metadata" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("checkbox", { name: /Alex Rivera/ })
    .uncheck();
  await page.getByRole("button", { name: "Save resident access" }).click();
  await page.keyboard.press("Escape");
  await persona(page, "Resident");
  await page.goto("/demo/resident/documents");
  await expect(
    page.getByRole("button", {
      name: "Alex renewal conversation",
      exact: true,
    }),
  ).toHaveCount(0);
});

test("resident and applicant actions create activity once and survive persona changes", async ({
  page,
}) => {
  await page.goto("/demo/resident/payments/pay");
  await page.getByRole("button", { name: "Confirm simulated payment" }).click();
  await expect(
    page.getByRole("heading", { name: "One less thing on your mind." }),
  ).toBeVisible();
  await page.reload();
  await page.goto("/demo/resident/maintenance/new");
  await page.getByLabel("What needs attention?").fill("Kitchen cabinet hinge");
  await page
    .getByLabel("Tell us a little more")
    .fill("The hinge on the cabinet beside the refrigerator is loose.");
  await page.getByRole("button", { name: "Submit demo request" }).click();
  await expect(
    page.getByRole("heading", { name: "Kitchen cabinet hinge" }),
  ).toBeVisible();
  await persona(page, "Applicant");
  await page.goto("/demo/applicant/application");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Submit demo application" }).click();
  await expect(
    page.getByRole("heading", { name: "You’re on your way." }),
  ).toBeVisible();
  await page.goto("/demo/applicant/tour");
  await page.getByLabel("Your preferred day").fill("2026-10-05");
  await page.getByRole("button", { name: "Request demo tour" }).click();
  await persona(page, "Owner");
  await page.goto("/demo/owner/activity");
  for (const title of [
    "Rent payment simulated",
    "Maintenance submitted",
    "Application submitted",
    "Tour requested",
  ])
    await expect(page.locator(".m-activity-list")).toContainText(title);
  const types = await page.evaluate(() =>
    JSON.parse(
      sessionStorage.getItem("property-hub-demo-v1") ?? "{}",
    ).demoActivity.map((a: { type: string }) => a.type),
  );
  for (const type of [
    "payment.simulated",
    "maintenance.created",
    "application.submitted",
    "tour.requested",
  ])
    expect(types.filter((t: string) => t === type)).toHaveLength(1);
  await page
    .getByRole("group", { name: "Activity type" })
    .getByRole("button", { name: "payment", exact: true })
    .click();
  await expect(page.locator(".m-activity-list")).toContainText(
    "Rent payment simulated",
  );
  await expect(page.locator(".m-activity-list")).not.toContainText(
    "Kitchen cabinet hinge",
  );
});

test("management screens and editing forms are accessible and fit phone, tablet and desktop", async ({
  page,
}) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const paths = [
    "",
    "/properties",
    "/properties/the-mercer",
    "/units",
    "/residents",
    "/residents/" + residents[0].id,
    "/leads",
    "/applications",
    "/maintenance",
    "/documents",
    "/announcements",
    "/activity",
  ];
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of paths) {
      await page.goto("/demo/property-manager" + path);
      await expect(page.locator("h1")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `${width} ${path} overflow`,
      ).toBe(true);
      if (width === 390) {
        if (path === "/documents")
          await page
            .getByRole("button", { name: "Add document metadata", exact: true })
            .click();
        if (path === "/announcements")
          await page
            .getByRole("button", { name: "Write announcement" })
            .click();
        if (path === "/maintenance")
          await page
            .getByRole("button", { name: "View request" })
            .first()
            .click();
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
          path,
        ).toEqual([]);
      }
    }
  }
  expect(errors).toEqual([]);
});
