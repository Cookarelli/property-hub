import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
import { maintenanceRequests } from "../src/lib/demo/data";

async function persona(page: Page, name: string) {
  await page.getByRole("combobox", { name: "Switch demo persona" }).click();
  await page.getByRole("option", { name, exact: true }).click();
}

test("resident can simulate one payment, reload the receipt, and see a settled balance", async ({
  page,
}) => {
  const external: string[] = [];
  page.on("request", (request) => {
    if (
      !request.url().startsWith("http://127.0.0.1") &&
      !request.url().startsWith("blob:")
    )
      external.push(request.url());
  });
  await page.goto("/demo/resident/payments");
  await expect(page.locator(".r-payment-balance")).toContainText("$1,550");
  await expect(page.locator(".r-payment-list article")).toHaveCount(4);
  await page.getByRole("link", { name: "Pay rent", exact: true }).click();
  await page.getByRole("radio", { name: /Demo debit card/ }).check();
  await page.getByRole("button", { name: "Confirm simulated payment" }).click();
  const heading = page.getByRole("heading", {
    name: "One less thing on your mind.",
  });
  await expect(heading).toBeVisible();
  await expect(heading).toBeFocused();
  await expect(page.locator(".r-payment-success")).toContainText(
    "No real money moved.",
  );
  await page.reload();
  await expect(heading).toBeVisible();
  await expect(page.locator(".r-payment-success")).toContainText(
    "Demo debit card",
  );
  expect(
    await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("property-hub-demo-v1") ?? "{}")
          .residentReceipts.length,
    ),
  ).toBe(1);
  await page.getByRole("link", { name: "View payment history" }).click();
  await expect(page.locator(".r-payment-balance")).toContainText("$0");
  await expect(page.locator(".r-payment-list article").first()).toContainText(
    "Demo debit card",
  );
  await page.goto("/demo/resident");
  await expect(page.locator(".r-balance")).toContainText("$0");
  expect(external).toEqual([]);
});

test("repair photos persist and scheduled, in-progress and completed updates reach the resident", async ({
  page,
}) => {
  await page.goto("/demo/resident/maintenance");
  await expect(page.locator(".r-request-card")).toHaveCount(1);
  await page.getByRole("button", { name: /^Completed/ }).click();
  await expect(page.locator(".r-request-card")).toHaveCount(2);
  await page.getByRole("link", { name: "New request", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Category", exact: true })
    .selectOption("Heating / Cooling");
  await page
    .getByLabel("What needs attention?")
    .fill("Living room AC needs attention");
  await page
    .getByLabel("Tell us a little more")
    .fill(
      "The living room AC is blowing warm air. The filter was changed last week.",
    );
  await page.getByLabel("How urgent is it?").selectOption("high");
  await page
    .getByLabel("Photos or videos")
    .setInputFiles("public/images/kitchen.jpg");
  await page.getByLabel("Our team may enter when I’m away.").check();
  await page.getByLabel("Pets are in my home").check();
  await page
    .getByLabel("What should we know about your pets?")
    .fill("One cat will be in the bedroom.");
  await page.getByLabel("Preferred access date (optional)").fill("2026-09-21");
  await page
    .getByRole("combobox", { name: "Preferred time", exact: true })
    .selectOption("9 AM–12 PM");
  await page
    .getByLabel("How should we contact you?")
    .selectOption("Text message");
  await page.getByRole("button", { name: "Submit demo request" }).click();
  await expect(
    page.getByRole("heading", { name: "Living room AC needs attention" }),
  ).toBeVisible();
  const detailUrl = page.url().split("?")[0];
  await expect(page.locator(".r-details")).toContainText(
    "One cat will be in the bedroom.",
  );
  await expect(page.locator(".r-attachment img")).toBeVisible();
  await page.reload();
  await expect(page.locator(".r-attachment img")).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(".r-attachment img")
        .evaluate((img: HTMLImageElement) => img.naturalWidth),
    )
    .toBeGreaterThan(0);
  await persona(page, "Property Manager");
  await page.goto("/demo/property-manager/maintenance");
  const card = page
    .locator(".maintenance-list .panel")
    .filter({ hasText: "Living room AC needs attention" });
  await card.getByRole("button", { name: "View request" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Text message");
  await expect(dialog.locator(".r-attachment img")).toBeVisible();
  await dialog
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("scheduled");
  await dialog.getByLabel("Visit date").fill("2026-09-21");
  await dialog.getByLabel("Visit time (Central)").fill("10:30");
  await dialog
    .getByLabel("Update for resident")
    .fill(
      "Marcus will visit Monday at 10:30 AM. Please keep your cat in the bedroom.",
    );
  await dialog.getByRole("button", { name: "Post update" }).click();
  await expect(dialog.locator(".r-events")).toContainText(
    "Marcus will visit Monday",
  );
  await page.keyboard.press("Escape");
  await persona(page, "Resident");
  await page.goto(detailUrl);
  await expect(page.locator(".r-progress [aria-current=step]")).toHaveText(
    /Scheduled/,
  );
  await expect(page.locator(".r-events")).toContainText(
    "Sep 21, 2026, 10:30 AM",
  );
  await persona(page, "Maintenance");
  await page.getByRole("button", { name: "Team queue", exact: true }).click();
  await page
    .locator(".maintenance-list .panel")
    .filter({ hasText: "Living room AC needs attention" })
    .getByRole("button", { name: "View request" })
    .click();
  await page.getByRole("button", { name: "Start work", exact: true }).click();
  await page
    .getByRole("button", { name: "Mark completed", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await persona(page, "Resident");
  await page.goto(detailUrl);
  await expect(page.locator(".r-progress [aria-current=step]")).toHaveText(
    /Completed/,
  );
  await expect(page.locator(".r-events")).toContainText("In Progress");
  await page.reload();
  await expect(page.locator(".r-progress [aria-current=step]")).toHaveText(
    /Completed/,
  );
});

test("maintenance validates attachment types and sizes and unknown requests have a recovery path", async ({
  page,
}) => {
  await page.goto("/demo/resident/maintenance/new");
  await page.getByLabel("Photos or videos").setInputFiles({
    name: "unsafe.html",
    mimeType: "text/html",
    buffer: Buffer.from("<h1>No</h1>"),
  });
  await expect(page.locator(".r-error")).toContainText("JPG");
  await expect(page.locator(".r-file-list li")).toHaveCount(0);
  await page.getByLabel("Photos or videos").setInputFiles({
    name: "oversized.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.alloc(11 * 1024 * 1024),
  });
  await expect(page.locator(".r-error")).toContainText("10 MB");
  await page.getByLabel("How urgent is it?").selectOption("urgent");
  await expect(page.locator(".r-emergency-note")).toContainText(
    "Do not wait for a portal response.",
  );
  await page.goto(
    "/demo/resident/maintenance/11111111-1111-4111-8111-111111111111",
  );
  await expect(
    page.getByRole("heading", { name: "Let’s find your request." }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Back to maintenance" }),
  ).toBeVisible();
});

test("document placeholders download metadata only, while lease and announcements are populated", async ({
  page,
}) => {
  await page.goto("/demo/resident/documents");
  await expect(page.locator(".r-document-card")).toHaveCount(6);
  for (const title of [
    "Lease Agreement",
    "Community Rules",
    "Parking Policy",
    "Pet Policy",
  ])
    await expect(
      page.getByRole("button", { name: title, exact: true }),
    ).toBeVisible();
  await page
    .getByRole("button", { name: "Lease Agreement", exact: true })
    .click();
  const downloading = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download metadata placeholder", exact: true })
    .click();
  const downloaded = await downloading;
  expect(downloaded.suggestedFilename()).toBe("lease-agreement.txt");
  const content = await readFile((await downloaded.path())!, "utf8");
  expect(content).toContain("No actual document is attached.");
  expect(content).toContain("It contains no legal terms");
  await page.keyboard.press("Escape");
  await page.getByLabel("Search your documents").fill("unavailable-document");
  await expect(
    page.getByRole("heading", { name: "No matching documents" }),
  ).toBeVisible();
  await page.goto("/demo/resident/lease");
  await expect(page.locator(".r-lease-details")).toContainText("Oct 31, 2026");
  await expect(page.locator(".r-lease-details")).toContainText(
    "Alex Rivera · 1 resident",
  );
  await page.goto("/demo/resident/announcements");
  await expect(page.locator(".r-announcement-feed article")).toHaveCount(5);
});

test("contact preferences persist and management can review the resident’s demo message", async ({
  page,
}) => {
  await page.goto("/demo/resident/profile");
  await page.getByLabel("Phone number").fill("512-555-0188");
  await page
    .getByLabel("Preferred way to reach you")
    .selectOption("Text message");
  await page.getByLabel("Community announcements").uncheck();
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByRole("status")).toContainText("saved");
  await page.reload();
  await expect(page.getByLabel("Phone number")).toHaveValue("512-555-0188");
  await expect(page.getByLabel("Preferred way to reach you")).toHaveValue(
    "Text message",
  );
  await expect(page.getByLabel("Community announcements")).not.toBeChecked();
  await page.goto("/demo/resident/contact?subject=Lease%20renewal");
  await expect(page.getByLabel("What’s on your mind?")).toHaveValue(
    "Lease renewal",
  );
  await page
    .getByLabel("Your message")
    .fill(
      "Could we arrange a time to discuss renewing my lease for another year?",
    );
  await page.getByRole("button", { name: "Save demo message" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Your demo message is saved.",
  );
  await persona(page, "Property Manager");
  await page.goto("/demo/property-manager/residents");
  await expect(page.locator(".leasing-inbox")).toContainText(
    "Could we arrange a time",
  );
  await expect(page.locator(".leasing-inbox")).toContainText("Text message");
});

test("video attachments reload locally and resetting the demo removes their stored files", async ({
  page,
}) => {
  await page.goto("/demo/resident/maintenance/new");
  await page
    .getByLabel("What needs attention?")
    .fill("Ceiling fan makes a noise");
  await page
    .getByLabel("Tell us a little more")
    .fill("A short clip shows the fan making a clicking noise.");
  const bytes = await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 64;
    const stream = canvas.captureStream(10);
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => chunks.push(event.data);
    const stopped = new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
    });
    recorder.start();
    canvas.getContext("2d")!.fillRect(0, 0, 64, 64);
    await new Promise((resolve) => setTimeout(resolve, 250));
    recorder.stop();
    await stopped;
    stream.getTracks().forEach((track) => track.stop());
    return Array.from(
      new Uint8Array(
        await new Blob(chunks, { type: "video/webm" }).arrayBuffer(),
      ),
    );
  });
  await page.getByLabel("Photos or videos").setInputFiles({
    name: "fan.webm",
    mimeType: "video/webm",
    buffer: Buffer.from(bytes),
  });
  await page.getByRole("button", { name: "Submit demo request" }).click();
  await expect(page.locator(".r-attachment video")).toBeVisible();
  await page.reload();
  await expect
    .poll(() =>
      page
        .locator(".r-attachment video")
        .evaluate((video: HTMLVideoElement) => video.readyState),
    )
    .toBeGreaterThanOrEqual(1);
  const key = await page.evaluate(
    () =>
      Object.values(
        JSON.parse(sessionStorage.getItem("property-hub-demo-v1") ?? "{}")
          .requestDetails as Record<string, { attachments: { key: string }[] }>,
      )[0].attachments[0].key,
  );
  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("menuitem", { name: /Reset demo/ }).click();
  await page
    .getByRole("button", { name: "Reset this demo", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Let’s find your request." }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      Object.keys(
        JSON.parse(sessionStorage.getItem("property-hub-demo-v1") ?? "{}"),
      ),
    ),
  ).toEqual(["demoResetAt"]);
  await expect
    .poll(() =>
      page.evaluate(async (attachmentKey: string) => {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open("property-hub-demo-attachments", 1);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        const result = await new Promise<boolean>((resolve, reject) => {
          const request = db
            .transaction("files")
            .objectStore("files")
            .get(attachmentKey);
          request.onsuccess = () => resolve(request.result !== undefined);
          request.onerror = () => reject(request.error);
        });
        db.close();
        return result;
      }, key),
    )
    .toBe(false);
});

test("resident pages work at phone, tablet and desktop sizes with accessible forms and navigation", async ({
  page,
}) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const paths = [
    "",
    "/payments",
    "/payments/pay",
    "/maintenance",
    "/maintenance/new",
    `/maintenance/${maintenanceRequests[0].id}`,
    "/documents",
    "/announcements",
    "/lease",
    "/profile",
    "/contact",
  ];
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of paths) {
      await page.goto("/demo/resident" + path);
      await expect(page.locator("h1")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `${width} ${path} overflow`,
      ).toBe(true);
      if (width === 390) {
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
  await page.setViewportSize({ width: 390, height: 844 });
  const bottom = page.getByRole("navigation", {
    name: "Resident quick navigation",
  });
  await expect(bottom.getByRole("link")).toHaveCount(5);
  await bottom.getByRole("link", { name: "Maintenance", exact: true }).click();
  await expect(page).toHaveURL(/\/maintenance$/);
  await page.getByRole("button", { name: "Open workspace navigation" }).click();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Contact", exact: true })
    .click();
  await expect(page).toHaveURL(/\/contact$/);
  expect(errors).toEqual([]);
});
