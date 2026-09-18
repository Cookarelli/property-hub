import type { Json } from "@/lib/database.types";
export const plans = ["starter", "professional", "portfolio"] as const;
export const lifecycleStatuses = [
  "draft",
  "setup",
  "ready",
  "active",
  "suspended",
] as const;
export const featureDefinitions = {
  website: { label: "Website", available: true },
  property_listings: { label: "Property listings", available: true },
  availability: { label: "Availability", available: true },
  lead_capture: { label: "Lead capture", available: true },
  resident_portal: { label: "Resident portal", available: true },
  maintenance_requests: { label: "Maintenance requests", available: true },
  maintenance_tracking: { label: "Maintenance tracking", available: true },
  documents: { label: "Documents", available: true },
  announcements: { label: "Announcements", available: true },
  resident_messaging: { label: "Resident messaging", available: false },
  online_applications: { label: "Online applications", available: false },
  lease_management: { label: "Lease management", available: true },
  payment_integration: { label: "Payment integration", available: false },
  sms_notifications: { label: "SMS notifications", available: false },
  analytics: { label: "Analytics", available: false },
} as const;
export type Feature = keyof typeof featureDefinitions;
export type FeatureFlags = Record<Feature, boolean>;
export const featureKeys = Object.keys(featureDefinitions) as Feature[];
export function planFeatures(plan: string): FeatureFlags {
  return Object.fromEntries(
    featureKeys.map((key) => [
      key,
      featureDefinitions[key].available &&
        (plan !== "starter" ||
          [
            "website",
            "property_listings",
            "availability",
            "lead_capture",
          ].includes(key)),
    ]),
  ) as FeatureFlags;
}
export function featureEnabled(
  organization: { features: Json; plan: string },
  key: Feature,
) {
  if (!featureDefinitions[key].available) return false;
  const flags = organization.features;
  return flags &&
    typeof flags === "object" &&
    !Array.isArray(flags) &&
    typeof flags[key] === "boolean"
    ? (flags[key] as boolean)
    : planFeatures(organization.plan)[key];
}
export const sectionFeatures: Partial<Record<string, Feature>> = {
  maintenance: "maintenance_tracking",
  documents: "documents",
  announcements: "announcements",
  leases: "lease_management",
  leads: "lead_capture",
  applications: "online_applications",
};

export const featureNotes: Partial<Record<Feature, string>> = {
  resident_portal: "Account summary, payment history and maintenance status.",
  maintenance_requests:
    "Submission permissions are prepared; the live resident request form is not connected yet.",
  maintenance_tracking: "Maintenance records and resident status summaries.",
  documents: "Document metadata; live file delivery is not connected yet.",
  announcements:
    "Management notice records; the live resident feed is not connected yet.",
  lease_management:
    "Lease records; signing and renewal automation are not connected yet.",
};
