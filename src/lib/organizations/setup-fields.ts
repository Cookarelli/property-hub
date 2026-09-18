import type { FormField } from "@/components/organizations/action-form";
import type { Database } from "@/lib/database.types";
type Tables = Database["public"]["Tables"];
export function companyFields(
  org?: Partial<Tables["organizations"]["Row"]>,
  create = false,
): FormField[] {
  return [
    ...(create
      ? [
          {
            name: "slug",
            label: "Organization address (lowercase words and hyphens)",
            required: true,
            maxLength: 80,
          },
        ]
      : []),
    ...Object.entries({
      name: "Company name",
      legal_name: "Legal name",
      logo_url: "Logo",
      primary_color: "Primary color",
      secondary_color: "Secondary color",
      phone: "Phone",
      email: "Email",
      website: "Company website",
      address: "Business address",
    }).map(([name, label]) => ({
      name,
      label,
      required: ["name", "legal_name", "phone", "email", "address"].includes(
        name,
      ),
      value: String(
        org?.[name as keyof typeof org] ??
          (name === "primary_color"
            ? "#284f40"
            : name === "secondary_color"
              ? "#edf2ed"
              : ""),
      ),
      type: (name.includes("color")
        ? "color"
        : name === "email"
          ? "email"
          : "text") as FormField["type"],
      uploadOrganizationId: name === "logo_url" ? org?.id : undefined,
    })),
  ];
}
export function propertyFields(
  orgId: string,
  p?: Partial<Tables["properties"]["Row"]>,
): FormField[] {
  return Object.entries({
    name: "Property name",
    address: "Street address",
    city: "City",
    state: "State / region",
    zip: "Postal code",
    description: "Property description",
    image: "Main property photo",
    photos: "Additional property photos (one address per line)",
    amenities: "Amenities (one per line)",
    office_hours: "Office hours",
    office_phone: "Office phone",
    office_email: "Office email",
    emergency_phone: "Emergency maintenance phone",
    published: "Include in the public website when the organization is active",
  }).map(([name, label]) => {
    const value = p?.[name as keyof typeof p];
    return {
      name,
      label,
      value: Array.isArray(value)
        ? value.join("\n")
        : String(value ?? (name === "published" ? "true" : "")),
      type: ["description", "photos", "amenities"].includes(name)
        ? "textarea"
        : name === "office_email"
          ? "email"
          : "text",
      required: ![
        "photos",
        "amenities",
        "office_hours",
        "office_email",
      ].includes(name),
      uploadOrganizationId: ["image", "photos"].includes(name)
        ? orgId
        : undefined,
      choices:
        name === "published"
          ? [
              { value: "true", label: "Include" },
              { value: "false", label: "Keep property hidden" },
            ]
          : undefined,
    };
  });
}
export function unitFields(
  orgId: string,
  u?: Partial<Tables["units"]["Row"]>,
  f?: Partial<Tables["floor_plans"]["Row"]>,
  building = "Main",
): FormField[] {
  return [
    { name: "number", label: "Unit number", value: u?.number, required: true },
    { name: "building", label: "Building", value: building, required: true },
    {
      name: "floor_plan",
      label: "Floor plan / unit type",
      value: f?.name ?? "",
      required: true,
    },
    {
      name: "bedrooms",
      label: "Bedrooms",
      type: "number",
      step: "1",
      value: String(f?.bedrooms ?? 1),
      required: true,
    },
    {
      name: "bathrooms",
      label: "Bathrooms",
      type: "number",
      step: "0.5",
      value: String(f?.bathrooms ?? 1),
      required: true,
    },
    {
      name: "sqft",
      label: "Square footage",
      type: "number",
      step: "1",
      value: String(f?.sqft ?? 700),
      required: true,
    },
    {
      name: "rent_cents",
      label: "Monthly rent (USD)",
      type: "number",
      step: "0.01",
      value: String((u?.rent_cents ?? 0) / 100),
      required: true,
    },
    {
      name: "deposit_cents",
      label: "Deposit (USD)",
      type: "number",
      step: "0.01",
      value: String((u?.deposit_cents ?? 0) / 100),
      required: true,
    },
    {
      name: "status",
      label: "Availability",
      value: u?.status ?? "available",
      options:
        u?.status === "occupied" ? ["occupied"] : ["available", "turnover"],
    },
    {
      name: "available_on",
      label: "Available date",
      type: "date",
      value: u?.available_on ?? "",
    },
    {
      name: "photos",
      label: "Unit photos",
      type: "textarea",
      value: u?.photos?.join("\n"),
      uploadOrganizationId: orgId,
    },
  ];
}
