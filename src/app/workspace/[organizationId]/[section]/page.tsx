import { notFound } from "next/navigation";
import { requireMembership } from "@/lib/auth";
import { sections, type OrganizationSection } from "@/lib/organizations/policy";
import { getOrganizationRecords } from "@/lib/organizations/repository";
import {
  loadOrganizationSettings,
  saveOrganizationBranding,
  saveOrganizationSettings,
} from "@/lib/organizations/actions";
import {
  OrganizationActionForm,
  type FormField,
} from "@/components/organizations/action-form";
import { EmptyState, PageHeading, Panel } from "@/components/shared";
const columns: Record<Exclude<OrganizationSection, "settings">, string[]> = {
  properties: ["name", "address", "city", "published"],
  units: ["number", "floor", "rent_cents", "status", "available_on"],
  residents: ["name", "email", "phone"],
  leases: ["starts_on", "ends_on", "rent_cents", "status"],
  maintenance: [
    "title",
    "category",
    "priority",
    "status",
    "preferred_access_date",
  ],
  leads: ["name", "email", "phone", "status", "source"],
  applications: ["name", "email", "status", "desired_move_in", "created_at"],
  documents: ["title", "category", "visibility"],
  announcements: ["title", "body", "published_at"],
  staff: ["full_name", "email", "role"],
};
function display(value: unknown, field: string) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (field.endsWith("_cents") && typeof value === "number")
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value / 100);
  return String(value).replaceAll("_", " ");
}
export default async function RecordsPage({
  params,
}: {
  params: Promise<{ organizationId: string; section: string }>;
}) {
  const { organizationId, section } = await params;
  if (!sections.includes(section as OrganizationSection)) notFound();
  if (section === "settings") {
    const { organization } = await requireMembership(organizationId, [
      "owner",
      "admin",
    ]);
    const settings = await loadOrganizationSettings(organizationId);
    const fields: FormField[] = Object.entries({
      name: "Company name",
      legal_name: "Legal name",
      phone: "Phone",
      email: "Email",
      website: "Website",
      logo_url: "Logo URL",
      primary_color: "Primary color",
      secondary_color: "Secondary color",
      address: "Address",
    }).map(([key, label]) => ({
      name: key,
      label,
      value: String(organization[key as keyof typeof organization] ?? ""),
      type: key.includes("color")
        ? "color"
        : key === "email"
          ? "email"
          : "text",
      required: key === "name",
    }));
    return (
      <>
        <PageHeading
          title="Organization settings"
          description="Branding, contact details and preferences for your company."
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Company profile">
            <div className="p-6">
              <OrganizationActionForm
                action={saveOrganizationBranding.bind(null, organizationId)}
                fields={fields}
                submitLabel="Save company profile"
              />
            </div>
          </Panel>
          <Panel title="Preferences">
            <div className="p-6">
              <OrganizationActionForm
                action={saveOrganizationSettings.bind(null, organizationId)}
                fields={[
                  {
                    name: "timezone",
                    label: "Time zone",
                    value: settings?.timezone ?? "America/Chicago",
                    required: true,
                  },
                ]}
                submitLabel="Save preferences"
              />
              <p className="mt-6 text-sm text-muted-foreground">
                Organization address: /{organization.slug}
              </p>
            </div>
          </Panel>
        </div>
      </>
    );
  }
  const { rows } = await getOrganizationRecords(
    organizationId,
    section as OrganizationSection,
  );
  const fields = columns[section as Exclude<OrganizationSection, "settings">];
  return (
    <>
      <PageHeading
        title={section.charAt(0).toUpperCase() + section.slice(1)}
        description={`${rows.length} records shown · Your organization`}
      />
      {rows.length ? (
        <Panel>
          <div
            className="overflow-x-auto"
            tabIndex={0}
            role="region"
            aria-label={`${section} records`}
          >
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                {section} belonging to your organization; up to 200 most recent
                records
              </caption>
              <thead>
                <tr className="border-b bg-muted">
                  {fields.map((field) => (
                    <th
                      key={field}
                      scope="col"
                      className="p-4 capitalize whitespace-nowrap"
                    >
                      {field.replace("_cents", "").replaceAll("_", " ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={String(row.id)} className="border-b">
                    {fields.map((field) => (
                      <td
                        key={field}
                        className="p-4 min-w-32 max-w-sm break-words"
                      >
                        {display(row[field], field)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : (
        <EmptyState
          title={`No ${section} yet`}
          description="Records available to your role will appear here as your organization adds them."
        />
      )}
    </>
  );
}
