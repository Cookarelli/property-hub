import { checkOnboarding } from "./check-onboarding";
import { checkTenancy } from "./check-tenancy";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
import { seedSql } from "./seed";
import {
  organizationId,
  uuid,
  properties,
  units,
  residents,
  leases,
  applications,
  maintenanceRequests,
  documents,
} from "../src/lib/demo/data";

const db = new PGlite();
let checks = 0;
await db.exec(
  `create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users (id uuid primary key,email text,created_at timestamptz,updated_at timestamptz,email_confirmed_at timestamptz); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;`,
);
// Minimal Storage schema to execute the actual bucket/object policies locally.
await db.exec(
  `create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text,unique(bucket_id,name));alter table storage.objects enable row level security;grant usage on schema storage to anon,authenticated;grant select on storage.objects to anon;grant select,insert,delete on storage.objects to authenticated;`,
);
for (const file of readdirSync("supabase/migrations")
  .filter((f) => f.endsWith(".sql"))
  .sort()) {
  if (file.includes("document_assignment_access")) {
    // Exercise an upgrade with a real legacy direct recipient, not just a fresh schema.
    await db.exec(seedSql(true));
    await db.exec(
      `delete from public.document_assignments where document_id='${documents[1].id}'; update public.documents set resident_id='${residents[0].id}' where id='${documents[1].id}';`,
    );
  }
  await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
}
await db.exec(seedSql());
await db.exec(seedSql()); // Repeatable seeds must not duplicate entities.
const count = async (table: string) =>
  (
    await db.query<{ count: number }>(
      `select count(*)::int as count from public.${table}`,
    )
  ).rows[0].count;
function check(value: unknown, expected: unknown, message: string) {
  assert.deepEqual(value, expected, message);
  console.log(`PASS ${message}`);
  checks++;
}
async function asUser(id: string) {
  await db.exec(
    `reset role; select set_config('request.jwt.claim.sub','${id}',false); set role authenticated;`,
  );
}
async function denied(sql: string, message: string) {
  let rejected = false;
  try {
    await db.exec(sql);
  } catch {
    rejected = true;
  }
  check(rejected, true, message);
}
check(await count("units"), 90, "Seed has exactly 90 units after two runs");
check(await count("residents"), 78, "Seed has 78 residents");
check(
  (
    await db.query(
      `select count(*)::int count from public.document_assignments where document_id='${documents[1].id}' and resident_id='${residents[0].id}' and assigned_by is null`,
    )
  ).rows[0],
  { count: 1 },
  "Legacy direct document recipient migrates without invented authorship",
);
check(
  await count("leases"),
  78,
  "Every occupied apartment has an active lease",
);
check(
  await count("payments"),
  235,
  "Three months of history plus an upcoming resident rent charge",
);
check(
  (
    await db.query<{ count: number }>(
      `select count(*)::int count from pg_tables where schemaname='public' and not rowsecurity`,
    )
  ).rows[0].count,
  0,
  "Every exposed table enables RLS",
);
const otherOrg = uuid(1, 2),
  otherUser = uuid(7, 999),
  otherProperty = uuid(2, 99);
await db.exec(
  `insert into auth.users(id) values('${otherUser}'); insert into public.users(id,full_name,email) values('${otherUser}','Other Owner','other@example.test'); insert into public.organizations(id,name,slug,status,plan,features) values('${otherOrg}','Other Organization','other-org','active','portfolio',private.plan_features('portfolio')); insert into public.organization_memberships(organization_id,user_id,role) values('${otherOrg}','${otherUser}','owner'); insert into public.properties(id,organization_id,name,slug,address,city,state,zip) values('${otherProperty}','${otherOrg}','Private community','private','1 Other St','Austin','TX','78701');`,
);
await asUser(uuid(7, 100));
check(
  await count("properties"),
  3,
  "Owner sees only their organization’s properties",
);
check(
  await count("payments"),
  235,
  "Owner sees their organization’s finance records",
);
check(
  (
    await db.query(
      `select * from public.properties where organization_id='${otherOrg}'`,
    )
  ).rows.length,
  0,
  "Explicit cross-tenant query returns no records",
);
check(
  (
    await db.query(
      `update public.properties set name='Forbidden' where id='${otherProperty}' returning id`,
    )
  ).rows.length,
  0,
  "Cross-tenant update changes no records",
);
await denied(
  `insert into public.buildings(organization_id,property_id,name,floors) values('${organizationId}','${otherProperty}','Wrong tenant',3)`,
  "Composite FK rejects cross-organization relationships",
);
await denied(
  `update public.properties set organization_id='${otherOrg}' where id='${properties[0].id}'`,
  "Organization identity cannot be reassigned",
);
await denied(
  `insert into public.organization_memberships(organization_id,user_id,role) values('${otherOrg}','${uuid(7, 100)}','owner')`,
  "Clients cannot self-provision membership",
);
await denied(
  `update public.units set status='available' where id='${units[0].id}'`,
  "Occupied unit cannot be detached from active lease",
);
await denied(
  `delete from public.lease_residents where lease_id='${leases[0].id}'`,
  "Active lease cannot lose its last resident",
);
await asUser(uuid(7, 101));
await db.exec(
  `update public.maintenance_requests set assigned_to='${uuid(7, 102)}' where id='${maintenanceRequests[0].id}'`,
);
check(
  (
    await db.query<{ assigned_to: string }>(
      `select assigned_to from public.maintenance_requests where id='${maintenanceRequests[0].id}'`,
    )
  ).rows[0].assigned_to,
  uuid(7, 102),
  "Manager can assign work to a maintenance member",
);
await denied(
  `update public.maintenance_requests set assigned_to='${uuid(7, 200)}' where id='${maintenanceRequests[0].id}'`,
  "Requests cannot be assigned to applicants",
);
await asUser(residents[0].user_id);
check(
  (
    await db.query(
      `update public.residents set phone='512-555-0188',contact_preference='Text message',community_notifications=false where id='${residents[0].id}' returning contact_preference`,
    )
  ).rows[0],
  { contact_preference: "Text message" },
  "Resident can save their contact preferences",
);
check(
  (
    await db.query(
      `update public.residents set phone='512-555-0199' where id='${residents[1].id}' returning id`,
    )
  ).rows.length,
  0,
  "Resident cannot edit another resident’s preferences",
);
await denied(
  `update public.residents set user_id='${residents[1].user_id}' where id='${residents[0].id}'`,
  "Resident cannot transfer profile identity",
);
await denied(
  `update public.residents set name='Changed legal identity' where id='${residents[0].id}'`,
  "Preference access does not grant legal identity editing",
);
check(
  (
    await db.query(
      `update public.maintenance_requests set status='completed',scheduled_for=now() where id='${maintenanceRequests[0].id}' returning id`,
    )
  ).rows.length,
  0,
  "Resident cannot set repair status or confirmed schedule",
);
await denied(
  `insert into public.maintenance_requests(organization_id,property_id,unit_id,resident_id,title,description,category,scheduled_for) values('${organizationId}','${properties[0].id}','${units[0].id}','${residents[0].id}','Forged appointment','Attempt to confirm an appointment.','Plumbing',now())`,
  "Resident cannot confirm their own appointment during submission",
);
await denied(
  `insert into public.maintenance_updates(organization_id,maintenance_request_id,author_id,body,status) values('${organizationId}','${maintenanceRequests[0].id}','${residents[0].user_id}','Forged completion','completed')`,
  "Resident cannot forge a management status event",
);
await db.exec(
  `insert into public.maintenance_attachments(organization_id,maintenance_request_id,uploaded_by,storage_path,mime_type,size_bytes) values('${organizationId}','${maintenanceRequests[0].id}','${residents[0].user_id}','${organizationId}/maintenance/leak.mp4','video/mp4',1000000)`,
);
check(
  await count("maintenance_attachments"),
  1,
  "Resident can attach video metadata to their own request",
);
await denied(
  `insert into public.maintenance_attachments(organization_id,maintenance_request_id,uploaded_by,storage_path,mime_type,size_bytes) values('${organizationId}','${maintenanceRequests[1].id}','${residents[0].user_id}','${organizationId}/maintenance/other.mp4','video/mp4',1000000)`,
  "Resident cannot attach files to another resident’s request",
);
check(await count("residents"), 1, "Resident sees only their resident record");
check(await count("leases"), 1, "Resident sees only their lease");
check(await count("payments"), 4, "Resident sees only their payments");
check(await count("units"), 1, "Resident sees only their apartment");
check(await count("applications"), 0, "Resident cannot read applicants");
check(
  await count("documents"),
  6,
  "Resident sees own and permitted community documents",
);
check(
  await count("maintenance_requests"),
  3,
  "Resident sees only their requests",
);
await denied(
  `update public.payments set status='paid',paid_at=now()`,
  "Resident cannot alter financial records",
);
await denied(
  `insert into public.maintenance_requests(organization_id,property_id,unit_id,resident_id,title,description,category) values('${organizationId}','${properties[0].id}','${units[1].id}','${residents[0].id}','Wrong apartment','This is an unauthorized request.','Plumbing')`,
  "Resident cannot submit a request for another apartment",
);
await db.exec(
  `insert into public.maintenance_requests(organization_id,property_id,unit_id,resident_id,title,description,category) values('${organizationId}','${properties[0].id}','${units[0].id}','${residents[0].id}','Valid request','My kitchen faucet is dripping.','Plumbing')`,
);
check(
  await count("maintenance_requests"),
  4,
  "Resident can create an authorized request",
);
await asUser(residents[1].user_id);
check(
  await count("maintenance_attachments"),
  0,
  "Other resident cannot read private attachment metadata",
);
await asUser(uuid(7, 101));
await db.exec(
  `update public.maintenance_requests set status='scheduled',scheduled_for='2026-09-20T15:00:00Z' where id='${maintenanceRequests[0].id}'; insert into public.maintenance_updates(organization_id,maintenance_request_id,author_id,body,status,scheduled_for) values('${organizationId}','${maintenanceRequests[0].id}','${uuid(7, 101)}','Confirmed visit','scheduled','2026-09-20T15:00:00Z')`,
);
await asUser(residents[0].user_id);
check(
  (
    await db.query(
      "select status from public.maintenance_updates where body='Confirmed visit'",
    )
  ).rows[0],
  { status: "scheduled" },
  "Resident sees the manager’s scheduled timeline update",
);
await asUser(otherUser);
check(
  await count("maintenance_updates"),
  0,
  "Other organization cannot read resident timeline updates",
);
await asUser(residents[1].user_id);
check(
  await count("documents"),
  5,
  "A different resident cannot read the private lease document",
);
await asUser(uuid(7, 200));
check(
  await count("applications"),
  1,
  "Applicant sees only their own application",
);
check(
  await count("units"),
  9,
  "Applicant sees only available published apartments",
);
check(await count("payments"), 0, "Applicant has no financial access");
await denied(
  `update public.applications set status='approved' where id='${applications[0].id}'`,
  "Applicant cannot self-approve",
);
await db.exec(
  `update public.applications set status='submitted' where id='${applications[0].id}'`,
);
check(
  (
    await db.query<{ status: string }>(
      `select status from public.applications where id='${applications[0].id}'`,
    )
  ).rows[0].status,
  "submitted",
  "Applicant can submit their draft",
);
await asUser(uuid(7, 102));
check(await count("payments"), 0, "Maintenance role cannot read finances");
check(
  await count("residents"),
  0,
  "Maintenance role cannot browse resident profiles",
);
await db.exec(
  `update public.maintenance_requests set status='completed' where id='${maintenanceRequests[1].id}'`,
);
check(
  (
    await db.query<{ status: string }>(
      `select status from public.maintenance_requests where id='${maintenanceRequests[1].id}'`,
    )
  ).rows[0].status,
  "completed",
  "Maintenance can update request status",
);
await denied(
  `update public.maintenance_requests set resident_id='${residents[1].id}' where id='${maintenanceRequests[1].id}'`,
  "Maintenance cannot reassign request ownership",
);
await asUser(otherUser);
check(
  await count("properties"),
  1,
  "Second owner only sees their separate organization",
);
check(
  await count("payments"),
  0,
  "Second owner cannot see demo organization payments",
);
await asUser(uuid(7, 104));
check(
  await count("properties"),
  0,
  "Platform admin has no implicit tenant-data bypass",
);
await db.exec("reset role; set role anon;");
await denied(
  "select * from public.residents",
  "Anonymous callers cannot read private tables",
);
await denied(
  "select private.is_member('" + organizationId + "')",
  "Anonymous callers cannot invoke private authorization helpers",
);
await db.exec("reset role;");
// Generate structural Supabase types from the migrated PostgreSQL catalog.
const intakeSession = uuid(30, 1);
const intakePayload = {
  kind: "application",
  propertyId: properties[0].id,
  unitId: units[26].id,
  floorPlanId: units[26].floor_plan_id,
  firstName: "Jamie",
  lastName: "Meadow",
  email: "jamie@example.test",
  phone: "5125550183",
  moveIn: "2026-10-12",
  occupants: 2,
  pets: "cat",
  message: "A bright space",
  website: "",
  requestId: uuid(31, 1),
};
async function submitIntake(
  payload: object,
  request = uuid(31, 1),
  org = organizationId,
) {
  return (
    await db.query<{ id: string }>(
      "select public.submit_leasing_intake($1,$2,$3,$4::jsonb) as id",
      [org, intakeSession, request, JSON.stringify(payload)],
    )
  ).rows[0].id;
}
await db.exec("set role service_role;");
const intakeId = await submitIntake(intakePayload);
check(
  await submitIntake(intakePayload),
  intakeId,
  "Leasing retry returns the original receipt without duplicate leads",
);
check(
  await count("leasing_intakes"),
  1,
  "Application inquiry is stored in the database",
);
check(
  await count("leads"),
  9,
  "Application inquiry creates a lead, not a screened application",
);
await db.exec("reset role;");
check(
  await count("applications"),
  6,
  "Public inquiry does not create a screened rental application",
);
await db.exec("set role service_role;");
await submitIntake(
  {
    ...intakePayload,
    kind: "tour",
    unitId: "",
    floorPlanId: "",
    date: "2026-10-10",
    time: "14:00",
  },
  uuid(31, 2),
);
check(
  (
    await db.query<{ scheduled: string }>(
      "select to_char(scheduled_at at time zone 'UTC','YYYY-MM-DD HH24:MI') scheduled from public.tour_requests where user_id is null",
    )
  ).rows[0].scheduled,
  "2026-10-10 19:00",
  "Guest tour stores the requested Austin time correctly in UTC",
);
async function rejectIntake(payload: object, message: string) {
  let rejected = false;
  try {
    await submitIntake(payload, uuid(31, 3));
  } catch {
    rejected = true;
  }
  check(rejected, true, message);
}
await rejectIntake(
  { ...intakePayload, propertyId: otherProperty },
  "Intake RPC rejects a property from another tenant",
);
await rejectIntake(
  { ...intakePayload, propertyId: properties[1].id },
  "Intake RPC rejects a unit from another property",
);
await rejectIntake(
  { ...intakePayload, unitId: units[0].id },
  "Intake RPC rejects an occupied apartment",
);
await db.exec("reset role;");
await db.query(
  "update public.properties set application_mode='external',application_url='https://applications.example.test/start' where id=$1",
  [properties[0].id],
);
await db.exec("set role service_role;");
await rejectIntake(
  intakePayload,
  "External-provider communities cannot accept internal application inquiries",
);
await db.exec("reset role;");
await db.query(
  "update public.properties set application_mode='internal',application_url=null where id=$1",
  [properties[0].id],
);
await asUser(uuid(7, 100));
check(
  await count("leasing_intakes"),
  2,
  "Owner can read leasing inquiries only in their organization",
);
await denied(
  `select public.submit_leasing_intake('${organizationId}','${intakeSession}','${uuid(31, 9)}','{}')`,
  "Authenticated browser users cannot call the trusted intake RPC",
);
await asUser(otherUser);
check(
  await count("leasing_intakes"),
  0,
  "Other organization cannot see demo leasing inquiries",
);
await asUser(uuid(7, 1));
check(
  await count("leasing_intakes"),
  0,
  "Residents cannot read public leasing contact details",
);
await db.exec("reset role; set role anon;");
await denied(
  "select * from public.leasing_intakes",
  "Anonymous clients cannot read intake contact data directly",
);
await denied(
  `select public.submit_leasing_intake('${organizationId}','${intakeSession}','${uuid(31, 9)}','{}')`,
  "Anonymous clients cannot bypass the validated server route",
);
await db.exec("reset role;");
// Management-specific privacy and audience checks.
await asUser(uuid(7, 101));
const noteId = uuid(40, 1),
  annA = uuid(40, 2),
  annB = uuid(40, 3),
  docId = uuid(40, 4),
  staffDoc = uuid(40, 5);
await db.exec(`insert into public.maintenance_internal_notes(id,organization_id,maintenance_request_id,author_id,body) values('${noteId}','${organizationId}','${maintenanceRequests[0].id}','${uuid(7, 101)}','Internal vendor quote and access handoff');
insert into public.announcements(id,organization_id,property_id,building_id,title,body,published_at) values('${annA}','${organizationId}','${properties[0].id}','${units[0].building_id}','Building A update','Please use the east entrance.',now()),('${annB}','${organizationId}','${properties[0].id}','${units[15].building_id}','Building B update','Please use the west entrance.',now());
insert into public.documents(id,organization_id,property_id,title,category,visibility) values('${docId}','${organizationId}','${properties[0].id}','Assigned metadata','Community','assigned'),('${staffDoc}','${organizationId}','${properties[0].id}','Internal operations','Operations','staff');`);
await asUser(residents[0].user_id);
check(
  await count("maintenance_internal_notes"),
  0,
  "Residents cannot read internal maintenance notes",
);
await denied(
  `insert into public.maintenance_internal_notes(organization_id,maintenance_request_id,author_id,body) values('${organizationId}','${maintenanceRequests[0].id}','${residents[0].user_id}','Forged internal note')`,
  "Residents cannot author internal notes",
);
check(
  (
    await db.query(
      `select id from public.announcements where id in ('${annA}','${annB}')`,
    )
  ).rows,
  [{ id: annA }],
  "Residents receive announcements only for their own building",
);
check(
  (
    await db.query(
      `select id from public.documents where id in ('${docId}','${staffDoc}')`,
    )
  ).rows.length,
  0,
  "Unassigned and staff-only documents stay private",
);
await denied(
  `insert into public.document_assignments(organization_id,document_id,resident_id,assigned_by) values('${organizationId}','${docId}','${residents[0].id}','${residents[0].user_id}')`,
  "Residents cannot assign documents to themselves",
);
await asUser(uuid(7, 101));
await db.exec(
  `insert into public.document_assignments(organization_id,document_id,resident_id,assigned_by) values('${organizationId}','${docId}','${residents[0].id}','${uuid(7, 101)}')`,
);
await denied(
  `insert into public.document_assignments(organization_id,document_id,resident_id,assigned_by) values('${organizationId}','${docId}','${residents[26].id}','${uuid(7, 101)}')`,
  "Document assignment rejects a resident in a different property",
);
await denied(
  `insert into public.announcements(organization_id,property_id,building_id,title,body) values('${organizationId}','${properties[0].id}','${units[30].building_id}','Wrong building','This audience belongs to another property.')`,
  "Announcement building must belong to the selected property",
);
await asUser(residents[0].user_id);
check(
  (await db.query(`select id from public.documents where id='${docId}'`)).rows
    .length,
  1,
  "Assigned resident can read their document metadata",
);
await asUser(residents[1].user_id);
check(
  (await db.query(`select id from public.documents where id='${docId}'`)).rows
    .length,
  0,
  "Another resident cannot read an individually assigned document",
);
await asUser(uuid(7, 101));
await db.exec(
  `delete from public.document_assignments where document_id in ('${docId}','${documents[1].id}')`,
);
await denied(
  `update public.documents set resident_id='${residents[0].id}' where id='${docId}'`,
  "Direct recipient writes cannot bypass revocable document assignments",
);
await asUser(residents[0].user_id);
check(
  (
    await db.query(
      `select id from public.documents where id in ('${docId}','${documents[1].id}')`,
    )
  ).rows.length,
  0,
  "Revoking assignments removes access for new and legacy documents",
);
await asUser(uuid(7, 102));
check(
  await count("maintenance_internal_notes"),
  1,
  "Maintenance can read internal team notes",
);
await asUser(uuid(7, 103));
check(await count("payments"), 0, "Staff cannot read portfolio finances");
check(
  (
    await db.query(
      `update public.leads set status='Approved' where organization_id='${organizationId}' returning id`,
    )
  ).rows.length,
  0,
  "Staff cannot operate the manager-only lead workflow",
);
await asUser(otherUser);
check(
  await count("maintenance_internal_notes"),
  0,
  "Other organization cannot read internal notes",
);
check(
  await count("document_assignments"),
  0,
  "Other organization cannot read document assignments",
);
await db.exec("reset role;");
check(
  (
    await db.query(
      `select count(*)::int count from public.activity_events where related_id is not null and event_type in ('application.inquiry','tour.requested')`,
    )
  ).rows[0],
  { count: 2 },
  "Leasing intake creates durable activity once, including retries",
);
await db.exec("set role anon;");
await denied(
  "select * from public.maintenance_internal_notes",
  "Anonymous clients cannot access internal team notes",
);
await denied(
  "select * from public.document_assignments",
  "Anonymous clients cannot access document assignments",
);
await db.exec("reset role;");
await checkTenancy(db, check);
await checkOnboarding(db, check);
if (process.argv.includes("--generate-types")) {
  const columns = (
    await db.query<{
      table_name: string;
      column_name: string;
      is_nullable: string;
      column_default: string | null;
      data_type: string;
      udt_name: string;
    }>(
      `select table_name,column_name,is_nullable,column_default,data_type,udt_name from information_schema.columns where table_schema='public' order by table_name,ordinal_position`,
    )
  ).rows;
  const baseTables = (
    await db.query<{ table_name: string }>(
      "select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE'",
    )
  ).rows.map((r) => r.table_name);
  const tables = [...new Set(columns.map((c) => c.table_name))].filter((t) =>
    baseTables.includes(t),
  );
  const enumRoles = (
    await db.query<{ enumlabel: string }>(
      "select enumlabel from pg_enum join pg_type on pg_type.oid=enumtypid where typname='app_role' order by enumsortorder",
    )
  ).rows
    .map((r) => `'${r.enumlabel}'`)
    .join(" | ");
  const viewTypes = [...new Set(columns.map((c) => c.table_name))].filter(
    (t) => !baseTables.includes(t),
  );
  const typeOf = (c: (typeof columns)[number]) =>
    (c.udt_name === "app_role"
      ? enumRoles
      : c.data_type === "ARRAY"
        ? "string[]"
        : ["integer", "numeric", "bigint", "smallint"].includes(c.data_type)
          ? "number"
          : c.data_type === "boolean"
            ? "boolean"
            : c.data_type === "jsonb"
              ? "Json"
              : "string") + (c.is_nullable === "YES" ? " | null" : "");
  const tableTypes = tables.map((table) => {
    const own = columns.filter((c) => c.table_name === table);
    return `    ${table}: {\n      Row: {\n${own.map((c) => `        ${c.column_name}: ${typeOf(c)};`).join("\n")}\n      };\n      Insert: {\n${own.map((c) => `        ${c.column_name}${c.is_nullable === "YES" || c.column_default ? "?" : ""}: ${typeOf(c)};`).join("\n")}\n      };\n      Update: {\n${own.map((c) => `        ${c.column_name}?: ${typeOf(c)};`).join("\n")}\n      };\n      Relationships: [];\n    };`;
  });
  writeFileSync(
    "src/lib/database.types.ts",
    `// Generated from the migrated PostgreSQL catalog by pnpm db:types.\nimport type { OnboardingRpc } from "./organizations/rpc-types";\nexport type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];\nexport type Database = {\n  public: {\n  Tables: {\n${tableTypes.join("\n")}\n  };\n  Views: { ${viewTypes
      .map(
        (v) =>
          `${v}: { Row: { ${columns
            .filter((c) => c.table_name === v)
            .map((c) => `${c.column_name}: ${typeOf(c)};`)
            .join(" ")} }; Relationships: [] };`,
      )
      .join(
        " ",
      )} };\n  Functions: { submit_leasing_intake: { Args: { p_org: string; p_session: string; p_request: string; p_payload: Json }; Returns: string } } & OnboardingRpc;\n  Enums: { app_role: ${enumRoles} };\n  CompositeTypes: { [_ in never]: never };\n  };\n};\n`,
  );
  console.log("Generated database.types.ts from PostgreSQL table definitions.");
}
console.log(
  `\n${checks} database checks passed. PostgreSQL RLS executed under distinct roles; Supabase Auth is emulated for this local test.`,
);
await db.close();
