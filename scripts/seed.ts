import { writeFileSync } from "node:fs";
import * as data from "../src/lib/demo/data";
function literal(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (Array.isArray(value))
    return `array[${value.map(literal).join(",")}]::text[]`;
  if (typeof value === "object")
    return `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;
  return `'${String(value).replaceAll("'", "''")}'`;
}
export function seedSql(legacy = false) {
  const statements = [
    "-- Deterministic fictional demo seed. Run only against a local/demo Supabase project.",
    "-- No passwords or production authentication sessions are created.",
    "begin;",
  ];
  function insert(table: string, rows: object[]) {
    for (const row of rows)
      statements.push(
        `insert into ${table} (${Object.keys(row).join(",")}) values (${Object.values(row).map(literal).join(",")}) on conflict ${table === "public.document_assignments" ? "(organization_id,document_id,resident_id)" : "(id)"} do nothing;`,
      );
  }
  insert(
    "auth.users",
    data.users.map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      updated_at: u.updated_at,
    })),
  );
  insert("public.organizations", [
    legacy
      ? {
          id: data.organization.id,
          name: data.organization.name,
          slug: data.organization.slug,
          created_at: data.organization.created_at,
          updated_at: data.organization.updated_at,
        }
      : data.organization,
  ]);
  if (!legacy)
    statements.push(
      `insert into public.organization_settings(organization_id) values (${literal(data.organizationId)}) on conflict(organization_id) do nothing;`,
    );
  insert("public.users", data.users);
  insert("public.organization_memberships", data.memberships);
  for (const [table, rows] of Object.entries({
    properties: data.properties,
    buildings: data.buildings,
    floor_plans: data.floorPlans,
    units: data.units,
    residents: data.residents,
    leases: data.leases,
    lease_residents: data.leaseResidents,
    leads: data.leads,
    applications: data.applications,
    maintenance_requests: data.maintenanceRequests,
    maintenance_updates: data.maintenanceUpdates,
    documents: data.documents.map((document) => ({
      ...document,
      resident_id: null,
    })),
    document_assignments: data.documents
      .filter((document) => document.resident_id)
      .map((document, index) => ({
        ...data.base(43, index + 1),
        document_id: document.id,
        resident_id: document.resident_id,
        assigned_by: data.uuid(7, 101),
      })),
    announcements: data.announcements,
    payments: data.payments,
    tour_requests: data.tours,
    activity_events: data.activityEvents,
  }))
    insert(`public.${table}`, rows);
  statements.push("commit;");
  return statements.join("\n") + "\n";
}
if (process.argv.includes("--write")) {
  writeFileSync("supabase/seed.sql", seedSql());
  console.log(
    "Seed generated from shared fixtures: 3 communities, 90 units, 78 residents and leases, 235 payments.",
  );
}
