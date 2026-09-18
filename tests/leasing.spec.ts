import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { properties, units } from "../src/lib/demo/data";
const community = properties[0];
const unit = units.find(
  (u) => u.property_id === community.id && u.status === "available",
)!;
const application = () => ({
  kind: "application",
  requestId: crypto.randomUUID(),
  propertyId: community.id,
  unitId: unit.id,
  floorPlanId: unit.floor_plan_id,
  firstName: "Jamie",
  lastName: "Meadow",
  email: "jamie@example.test",
  phone: "512-555-0183",
  message: "Interested in a bright corner apartment.",
  website: "",
  moveIn: "2026-10-12",
  occupants: 2,
  pets: "cat",
});

test("search combines bedrooms, bathrooms, price, availability and amenities", async ({
  page,
}) => {
  await page.goto("/properties");
  await expect(page.locator(".property-card")).toHaveCount(3);
  await page
    .getByRole("combobox", { name: "Bedrooms", exact: true })
    .selectOption("1");
  await page
    .getByRole("combobox", { name: "Bathrooms", exact: true })
    .selectOption("2");
  await expect(
    page.getByText("No communities match your search"),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Bathrooms", exact: true })
    .selectOption("1");
  await page
    .getByRole("spinbutton", { name: "Minimum monthly rent" })
    .fill("2000");
  await page
    .getByRole("spinbutton", { name: "Maximum monthly rent" })
    .fill("2100");
  await expect(page.locator(".property-card")).toHaveCount(1);
  await page.getByText("Amenities", { exact: true }).click();
  await page.getByRole("checkbox", { name: "Rooftop terrace" }).check();
  await expect(
    page.getByText("No communities match your search"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset filters" }).click();
  await page
    .getByRole("combobox", { name: "Availability", exact: true })
    .selectOption("now");
  await expect(
    page.getByText("No communities match your search"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page.locator(".property-card")).toHaveCount(3);
});

test("gallery keyboard navigation and apartment application preserve selected home", async ({
  page,
}) => {
  await page.goto(`/properties/${community.slug}`);
  await page
    .getByRole("button", { name: `View photo 1 of ${community.name}` })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByText("2 / 3", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page
    .locator(".unit-card")
    .first()
    .getByRole("link", { name: "Apply", exact: true })
    .click();
  await expect(page).toHaveURL(/\/apply\?/);
  await expect(page.locator("#propertyId")).toHaveValue(community.id);
  await expect(page.locator("#selection")).toHaveValue(`unit:${unit.id}`);
  await page.getByLabel("Preferred move-in date").fill("2026-10-12");
  await page.getByLabel("First name").fill("Jamie");
  await page.getByLabel("Last name").fill("Meadow");
  await page.getByLabel("Email", { exact: false }).fill("jamie@example.test");
  await page.getByLabel("Phone").fill("512-555-0183");
  await page.getByLabel("Number of occupants").fill("2");
  await page.getByLabel("Will pets be joining you?").selectOption("cat");
  await page
    .getByLabel("Message (optional)")
    .fill("A sunny space for a fresh start.");
  await page.getByRole("button", { name: "Send application inquiry" }).click();
  await expect(
    page.getByRole("heading", { name: "You’re one step closer to home." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "View in management demo" }).click();
  await page
    .locator(".inbox-record summary")
    .filter({ hasText: "Jamie Meadow" })
    .click();
  await expect(
    page.locator(".inbox-record-details").getByText("jamie@example.test"),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.locator(".inbox-record summary").filter({ hasText: "Jamie Meadow" }),
  ).toBeVisible();
});

test("tour request works without a unit and displays an unconfirmed success state", async ({
  page,
}) => {
  await page.goto(`/tour?property=${properties[1].slug}`);
  await page.getByLabel("Requested date").fill("2026-10-10");
  await page.getByLabel("Preferred time").selectOption("14:00");
  await page.getByLabel("First name").fill("Riley");
  await page.getByLabel("Last name").fill("Willow");
  await page.getByLabel("Email").fill("riley@example.test");
  await page.getByLabel("Phone").fill("512-555-0191");
  await page
    .getByRole("button", { name: "Request a tour", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your tour request is in." }),
  ).toBeVisible();
  await expect(page.getByText("Oct 10, 2026 at 2:00 PM CT")).toBeVisible();
  await expect(page.getByText(/does not reserve a tour slot/)).toBeVisible();
  await page.getByRole("link", { name: "View in management demo" }).click();
  await expect(
    page.locator(".inbox-record summary").filter({ hasText: "Riley Willow" }),
  ).toBeVisible();
});

test("intake API is idempotent, session-private and validates tenant and apartment selections", async ({
  request,
  playwright,
  baseURL,
}) => {
  const initial = await request.get("/api/leasing");
  expect(initial.status()).toBe(200);
  const payload = application();
  const options = { data: payload, headers: { Origin: baseURL! } };
  const first = await request.post("/api/leasing", options);
  expect(first.status()).toBe(201);
  const duplicate = await request.post("/api/leasing", options);
  expect(duplicate.status()).toBe(201);
  expect((await duplicate.json()).id).toBe((await first.json()).id);
  const own = await (await request.get("/api/leasing")).json();
  expect(own.records).toHaveLength(1);
  expect(own.records[0].lead_id).toBeTruthy();
  expect(own.records[0]).not.toHaveProperty("session_id");
  const stranger = await playwright.request.newContext({ baseURL });
  expect(
    (await (await stranger.get("/api/leasing")).json()).records,
  ).toHaveLength(0);
  await stranger.dispose();
  for (const changes of [
    { propertyId: properties[1].id },
    { unitId: units[0].id },
    { occupants: 0 },
    { moveIn: "2026-09-18" },
    { website: "bot" },
    { organizationId: "anything" },
  ]) {
    const result = await request.post("/api/leasing", {
      data: { ...application(), ...changes },
      headers: { Origin: baseURL! },
    });
    expect(result.status()).toBe(422);
  }
  const crossSite = await request.post("/api/leasing", {
    data: application(),
    headers: { Origin: "https://unrelated.example" },
  });
  expect(crossSite.status()).toBe(403);
  const oversized = await request.post("/api/leasing", {
    data: { ...application(), message: "x".repeat(13000) },
    headers: { Origin: baseURL! },
  });
  expect(oversized.status()).toBe(413);
  expect(
    (await (await request.get("/api/leasing")).json()).records,
  ).toHaveLength(1);
});

test("form keeps entered details when storage fails and succeeds on retry", async ({
  page,
}) => {
  await page.goto(`/apply?property=${community.slug}&unit=${unit.id}`);
  await page.getByLabel("Preferred move-in date").fill("2026-10-15");
  await page.getByLabel("First name").fill("Casey");
  await page.getByLabel("Last name").fill("Reed");
  await page.getByLabel("Email").fill("casey@example.test");
  await page.getByLabel("Phone").fill("5125550192");
  await page.route("**/api/leasing", async (route) =>
    route.request().method() === "POST"
      ? route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ error: "Please try again shortly." }),
        })
      : route.continue(),
  );
  await page.getByRole("button", { name: "Send application inquiry" }).click();
  await expect(page.locator(".form-error")).toHaveText(
    "Please try again shortly.",
  );
  await expect(page.getByLabel("First name")).toHaveValue("Casey");
  await page.unroute("**/api/leasing");
  await page.getByRole("button", { name: "Send application inquiry" }).click();
  await expect(
    page.getByRole("heading", { name: "You’re one step closer to home." }),
  ).toBeVisible();
});

test("external application setting redirects the flow before collecting contact details", async ({
  page,
}) => {
  await page.route("**/api/leasing", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        records: [],
        providers: {
          [community.id]: {
            mode: "external",
            name: "Partner provider",
            url: "https://applications.example.test/mercer",
          },
        },
      }),
    }),
  );
  await page.goto(`/apply?property=${community.slug}`);
  await expect(
    page.getByRole("link", { name: "Continue to application provider" }),
  ).toHaveAttribute("href", "https://applications.example.test/mercer");
  await expect(page.getByLabel("First name")).toHaveCount(0);
});

test("public leasing is accessible without overflow on mobile and tablet", async ({
  page,
}) => {
  for (const width of [390, 768]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      "/",
      "/properties",
      `/properties/${community.slug}`,
      "/availability",
      `/apply?property=${community.slug}&unit=${unit.id}`,
      "/tour",
    ]) {
      await page.goto(path);
      await page.getByRole("heading", { level: 1 }).waitFor();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${path} at ${width}px`,
      ).toBe(true);
      const scan = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(scan.violations, `${path} at ${width}px`).toEqual([]);
    }
  }
});
