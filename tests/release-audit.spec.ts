import { test, expect, type Page } from "@playwright/test";
import { personas, navFor, demoHref } from "../src/lib/navigation";

test.use({ actionTimeout: 10_000 });

async function contact(page: Page, firstName: string) {
  await page.getByLabel("First name").fill(firstName);
  await page.getByLabel("Last name").fill("Release Audit");
  await page.getByLabel("Email").fill("release-audit@example.test");
  await page.getByLabel("Phone").fill("512-555-0162");
}

test("homepage discovery keeps the selected two-bedroom through tour request and manager inbox", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("link", { name: "Browse Properties", exact: true })
    .click();
  await page.getByRole("link", { name: "The Mercer", exact: true }).click();
  await page
    .getByRole("navigation", { name: "Community sections" })
    .getByRole("link", { name: "Available homes" })
    .click();
  const unit = page.locator(".unit-card").filter({ hasText: "B-302" });
  await unit
    .getByRole("link", { name: "Schedule a tour", exact: true })
    .click();
  await expect(page.locator("#selection option:checked")).toContainText(
    "B-302",
  );
  await contact(page, "Tour");
  await page.getByLabel("Requested date").fill("2026-10-10");
  await page.getByLabel("Preferred time").selectOption("14:00");
  await page
    .getByRole("button", { name: "Request a tour", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your tour request is in." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "View in management demo" }).click();
  const record = page
    .locator(".inbox-record")
    .filter({ hasText: "Tour Release Audit" });
  await record.locator("summary").click();
  await expect(record).toContainText("B-302");
  await expect(record).toContainText("release-audit@example.test");
});

test("homepage available home submits a basic application and opens the manager applicant record", async ({
  page,
}) => {
  await page.goto("/");
  const unit = page.locator(".unit-card").first();
  await expect(unit).toContainText("B-304");
  await unit.getByRole("link", { name: "Apply", exact: true }).click();
  await expect(page.locator("#selection option:checked")).toContainText(
    "B-304",
  );
  await contact(page, "Application");
  await page.getByLabel("Preferred move-in date").fill("2026-10-12");
  await page.getByLabel("Number of occupants").fill("2");
  await page.getByLabel("Will pets be joining you?").selectOption("cat");
  await page.getByRole("button", { name: "Send application inquiry" }).click();
  await expect(
    page.getByRole("heading", { name: "You’re one step closer to home." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "View in management demo" }).click();
  const record = page
    .locator(".inbox-record")
    .filter({ hasText: "Application Release Audit" });
  await record.locator("summary").click();
  await expect(record).toContainText("B-304");
  await expect(record).toContainText("release-audit@example.test");
  await page
    .getByRole("navigation", { name: "Workspace navigation" })
    .getByRole("link", { name: /^Applications(?: \d+)?$/ })
    .click();
  await expect(page.locator("h1")).toHaveText("Applications");
});

test("all persona navigation links work through desktop navigation and the 375px menu", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 900 });
    for (const persona of personas) {
      await page.goto(demoHref(persona.id));
      for (const section of navFor(persona.id)) {
        if (width === 375)
          await page
            .getByRole("button", { name: "Open workspace navigation" })
            .click();
        await page
          .getByRole("navigation", {
            name: width === 375 ? "Mobile navigation" : "Workspace navigation",
            exact: true,
          })
          .getByRole("link", {
            name: new RegExp(
              `^${section === "Saved" ? "Saved apartment" : section}(?: \\d+)?$`,
            ),
          })
          .click();
        await expect(page).toHaveURL(demoHref(persona.id, section));
        await expect(page.locator("h1").first()).toBeVisible();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
          `${width}: ${persona.id}/${section}`,
        ).toBe(true);
      }
    }
  }
  expect(errors).toEqual([]);
});

test("reset cancellation preserves progress and returns keyboard focus at every entry point", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/demo");
  const reset = page.getByRole("button", {
    name: "Reset demo data",
    exact: true,
  });
  await reset.click();
  await expect(
    page.getByRole("button", { name: "Keep exploring" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(reset).toBeFocused();
  for (const role of ["resident", "property-manager"]) {
    await page.goto(`/demo/${role}`);
    const before = await page.evaluate(() =>
      sessionStorage.getItem("property-hub-demo-v1"),
    );
    const account = page.getByRole("button", {
      name: "Account menu",
      exact: true,
    });
    await account.click();
    await page
      .getByRole("menuitem", { name: "Reset demo", exact: true })
      .click();
    await page.getByRole("button", { name: "Keep exploring" }).click();
    await expect(account).toBeFocused();
    expect(
      await page.evaluate(() => sessionStorage.getItem("property-hub-demo-v1")),
    ).toBe(before);
    await page.getByRole("button", { name: "Open demo guide" }).click();
    await reset.click();
    await page.getByRole("button", { name: "Keep exploring" }).click();
    await expect(reset).toBeFocused();
    await page.keyboard.press("Escape");
  }
});
