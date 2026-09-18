import { contrastingText } from "../src/lib/organizations/branding";
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  brandingSchema,
  createOrganizationSchema,
  hasAllowedRole,
  mayAccessSection,
  scopeToOrganization,
  sections,
} from "../src/lib/organizations/policy";
import {
  organization,
  organizationId,
  properties,
  units,
  residents,
  leases,
} from "../src/lib/demo/data";
import { demoOrganizationBranding } from "../src/lib/demo/organization";

test("all organization query scopes add the verified ID and reject malformed IDs", () => {
  const calls: unknown[] = [];
  const query = {
    eq: (column: string, value: string) => {
      calls.push([column, value]);
      return query;
    },
  };
  assert.equal(scopeToOrganization(query, organizationId), query);
  assert.deepEqual(calls, [["organization_id", organizationId]]);
  assert.throws(() => scopeToOrganization(query, "another-tenant"));
});
test("organization administrators inherit only their organization’s allowed roles", () => {
  assert.ok(hasAllowedRole("admin", ["owner", "property_manager"]));
  assert.equal(hasAllowedRole("resident", ["owner"]), false);
  assert.equal(hasAllowedRole("platform_admin", ["owner"]), false);
  assert.equal(hasAllowedRole("leasing", ["owner"]), false);
});
test("resident and applicant cannot open administration sections", () => {
  for (const role of ["resident", "applicant", "platform_admin"] as const)
    for (const section of sections)
      assert.equal(mayAccessSection(role, section), false);
  assert.equal(mayAccessSection("property_manager", "settings"), false);
  assert.equal(mayAccessSection("maintenance", "residents"), false);
  assert.equal(mayAccessSection("maintenance", "maintenance"), true);
  assert.equal(mayAccessSection("leasing", "leads"), true);
  assert.equal(mayAccessSection("leasing", "leases"), false);
});
test("branding is validated and cannot smuggle tenant identity or privileges", () => {
  const result = brandingSchema.parse({
    ...demoOrganizationBranding,
    logo_url: "",
    organization_id: "other",
    status: "inactive",
    subscription_status: "active",
    role: "super_admin",
  });
  assert.equal("organization_id" in result, false);
  assert.equal("status" in result, false);
  assert.equal("role" in result, false);
  for (const url of [
    "javascript:alert(1)",
    "//evil.example.test/logo.png",
    "/\\evil.example.test/logo.png",
  ])
    assert.equal(
      brandingSchema.safeParse({ ...demoOrganizationBranding, logo_url: url })
        .success,
      false,
    );
  assert.equal(
    brandingSchema.safeParse({
      ...demoOrganizationBranding,
      logo_url: "",
      primary_color: "red;display:none",
    }).success,
    false,
  );
});
test("tenant addresses do not override platform or existing routes", () => {
  for (const slug of [
    "platform",
    "demo",
    "properties",
    "workspace",
    "../admin",
    "Mixed Case",
  ])
    assert.equal(
      createOrganizationSchema.safeParse({ name: "Company", slug }).success,
      false,
    );
  assert.ok(
    createOrganizationSchema.safeParse({
      name: organization.name,
      slug: organization.slug,
    }).success,
  );
});
test("Alder & Stone remains the first tenant with all linked fixtures intact", () => {
  assert.equal(organization.slug, "alder-stone");
  assert.equal(properties.length, 3);
  assert.equal(units.length, 90);
  assert.equal(residents.length, 78);
  assert.equal(leases.length, 78);
  for (const record of [...properties, ...units, ...residents, ...leases])
    assert.equal(record.organization_id, organizationId);
});

test("organization colors retain contrasting control text", () => {
  assert.equal(contrastingText("#ffffff"), "#000000");
  assert.equal(contrastingText("#000000"), "#ffffff");
  assert.equal(contrastingText("#284f40"), "#ffffff");
});

test("pricing defaults and overrides enable only implemented features", async () => {
  const { featureEnabled, planFeatures } =
    await import("../src/lib/organizations/features");
  assert.equal(planFeatures("starter").resident_portal, false);
  assert.equal(planFeatures("professional").resident_portal, true);
  assert.equal(
    featureEnabled(
      { plan: "portfolio", features: { documents: false } },
      "documents",
    ),
    false,
  );
  for (const feature of [
    "online_applications",
    "payment_integration",
    "sms_notifications",
    "resident_messaging",
    "analytics",
  ] as const)
    assert.equal(
      featureEnabled(
        { plan: "portfolio", features: { [feature]: true } },
        feature,
      ),
      false,
    );
});
test("customer forms validate monetary amounts, availability, and uploaded image references", async () => {
  const { unitSetupSchema, propertySetupSchema } =
    await import("../src/lib/organizations/onboarding-schema");
  const base = {
    number: "102",
    building: "East",
    floor_plan: "Two bedroom",
    bedrooms: "2",
    bathrooms: "1.5",
    sqft: "990",
    rent_cents: "1825.25",
    deposit_cents: "500.01",
    status: "available",
    available_on: "2026-10-01",
    photos: "/images/mercer.jpg",
  };
  const result = unitSetupSchema.parse(base);
  assert.equal(result.rent_cents, 182525);
  assert.equal(result.deposit_cents, 50001);
  assert.deepEqual(result.photos, ["/images/mercer.jpg"]);
  assert.equal(
    unitSetupSchema.safeParse({ ...base, rent_cents: "-20" }).success,
    false,
  );
  assert.equal(
    unitSetupSchema.safeParse({ ...base, available_on: "" }).success,
    false,
  );
  assert.equal(
    unitSetupSchema.safeParse({ ...base, photos: "javascript:alert(1)" })
      .success,
    false,
  );
  assert.equal(
    propertySetupSchema.safeParse({ name: "New community" }).success,
    false,
  );
});
