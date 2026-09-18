import { z } from "zod";
import type { Role } from "../types";
export const organizationRoles = [
  "owner",
  "admin",
  "property_manager",
  "staff",
  "maintenance",
  "leasing",
  "resident",
  "applicant",
] as const;
export const reservedSlugs = new Set([
  "api",
  "auth",
  "availability",
  "contact",
  "demo",
  "how-it-works",
  "platform",
  "properties",
  "sign-in",
  "workspace",
  "apply",
  "tour",
  "manifest",
  "_next",
  "sites",
  "invite",
]);
export const organizationSlug = z
  .string()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .refine((v) => !reservedSlugs.has(v), "This address is reserved.");
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null);
const optionalUrl = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (v) => !v || (/^https:\/\/[^\s]+$/.test(v) && URL.canParse(v)),
    "Use a full HTTPS address.",
  )
  .transform((v) => v || null);
export const brandingSchema = z.object({
  name: z.string().trim().min(2).max(100),
  legal_name: optionalText(160),
  phone: optionalText(40),
  email: z
    .union([z.email().max(254), z.literal("")])
    .transform((v) => v || null),
  website: optionalUrl,
  logo_url: z
    .string()
    .trim()
    .max(2048)
    .refine(
      (v) =>
        !v ||
        /^\/(?!\/)[^\s\\]+$/.test(v) ||
        (/^https:\/\/[^\s]+$/.test(v) && URL.canParse(v)),
      "Use an HTTPS address or local image path.",
    )
    .transform((v) => v || null),
  primary_color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a six-digit hex color."),
  secondary_color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a six-digit hex color."),
  address: optionalText(500),
});
export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: organizationSlug,
});
export const lifecycleSchema = z.object({
  status: z.enum(["draft", "setup", "ready", "active", "suspended"]),
  subscription_status: z.enum(["trial", "active", "past_due", "canceled"]),
});
export const sections = [
  "properties",
  "units",
  "residents",
  "leases",
  "maintenance",
  "leads",
  "applications",
  "documents",
  "announcements",
  "staff",
  "settings",
] as const;
export type OrganizationSection = (typeof sections)[number];
export function mayAccessSection(role: Role, section: OrganizationSection) {
  if (["owner", "admin"].includes(role)) return true;
  if (role === "property_manager") return section !== "settings";
  if (role === "staff")
    return !["staff", "settings", "leases"].includes(section);
  if (role === "maintenance")
    return ["properties", "units", "maintenance"].includes(section);
  if (role === "leasing")
    return [
      "properties",
      "units",
      "leads",
      "applications",
      "documents",
      "announcements",
    ].includes(section);
  return false;
}
// This helper always appends an explicit tenant predicate, even when RLS also applies.
export function scopeToOrganization<T>(
  query: { eq(column: string, value: string): T },
  organizationId: string,
): T {
  const id = z.uuid().parse(organizationId);
  return query.eq("organization_id", id);
}
export function hasAllowedRole(role: Role, allowed: readonly Role[]) {
  return (
    allowed.includes(role) ||
    (role === "admin" &&
      (allowed.includes("owner") || allowed.includes("property_manager")))
  );
}
