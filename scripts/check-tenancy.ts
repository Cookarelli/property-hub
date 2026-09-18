import type { PGlite } from "@electric-sql/pglite";
import {
  organizationId,
  uuid,
  residents,
  properties,
} from "../src/lib/demo/data";
export async function checkTenancy(
  db: PGlite,
  check: (value: unknown, expected: unknown, message: string) => void,
) {
  const orgA = organizationId,
    orgB = uuid(1, 2),
    adminA = uuid(7, 801),
    adminB = uuid(7, 802),
    superUser = uuid(7, 803),
    leasingA = uuid(7, 804);
  const asUser = async (id: string) => {
    await db.exec(
      `reset role; select set_config('request.jwt.claim.sub','${id}',false); set role authenticated;`,
    );
  };
  const rows = async (sql: string) => (await db.query(sql)).rows;
  const forbidden = async (sql: string, message: string) => {
    let code = "";
    try {
      await db.exec(sql);
    } catch (error) {
      code = (error as { code: string }).code;
    }
    check(code, "42501", message);
  };
  const rejected = async (sql: string, message: string) => {
    let failed = false;
    try {
      await db.exec(sql);
    } catch {
      failed = true;
    }
    check(failed, true, message);
  };
  await db.exec("reset role");
  for (const [id, name] of [
    [adminA, "Admin A"],
    [adminB, "Admin B"],
    [superUser, "Platform Administrator"],
    [leasingA, "Leasing A"],
  ])
    await db.exec(
      `insert into auth.users(id)values('${id}');insert into public.users(id,full_name,email)values('${id}','${name}','${id}@example.test');`,
    );
  await db.exec(
    `insert into public.organization_memberships(organization_id,user_id,role)values('${orgA}','${adminA}','admin'),('${orgB}','${adminB}','admin'),('${orgA}','${leasingA}','leasing');insert into public.platform_memberships(user_id)values('${superUser}');insert into public.organization_settings(organization_id)values('${orgB}') on conflict do nothing;`,
  );
  const ownedTables = (
    await db.query<{ table_name: string }>(
      "select c.table_name from information_schema.columns c join information_schema.tables t using(table_schema,table_name) where c.table_schema='public' and c.column_name='organization_id' and t.table_type='BASE TABLE' order by c.table_name",
    )
  ).rows;
  await asUser(adminB);
  for (const { table_name } of ownedTables)
    check(
      (
        await rows(
          `select * from public.${table_name} where organization_id='${orgA}'`,
        )
      ).length,
      0,
      `Organization B admin cannot retrieve A’s ${table_name}`,
    );
  check(
    (
      await rows(
        `select * from public.organization_members where organization_id='${orgA}'`,
      )
    ).length,
    0,
    "Membership compatibility view preserves tenant RLS",
  );
  check(
    (await rows(`select * from public.users where id='${adminA}'`)).length,
    0,
    "Staff directory does not disclose another company’s profiles",
  );
  await asUser(adminA);
  check(
    (await rows(`select * from public.properties`)).length,
    3,
    "Organization admin can read all three Alder & Stone communities",
  );
  check(
    (
      await rows(
        `update public.properties set name='Not permitted' where organization_id='${orgB}' returning id`,
      )
    ).length,
    0,
    "Organization admin cannot update another company’s property",
  );
  check(
    (
      await rows(
        `delete from public.properties where organization_id='${orgB}' returning id`,
      )
    ).length,
    0,
    "Organization admin cannot delete another company’s property",
  );
  await forbidden(
    `insert into public.properties(organization_id,name,slug,address,city,state,zip)values('${orgB}','Injected','injected','1 Road','Austin','TX','78701')`,
    "Organization admin cannot create records in another tenant",
  );
  check(
    (
      await rows(
        `update public.organizations set legal_name='Alder & Stone Living',primary_color='#284f40' where id='${orgA}' returning id`,
      )
    ).length,
    1,
    "Organization admin can edit their own branding",
  );
  check(
    (
      await rows(
        `update public.organizations set name='Hijacked' where id='${orgB}' returning id`,
      )
    ).length,
    0,
    "Organization branding is isolated across tenants",
  );
  await db.exec(
    `insert into public.organization_settings(organization_id,timezone)values('${orgA}','America/Chicago') on conflict(organization_id)do update set timezone=excluded.timezone`,
  );
  check(
    (
      await rows(
        `select timezone from public.organization_settings where organization_id='${orgA}'`,
      )
    )[0],
    { timezone: "America/Chicago" },
    "Organization settings can be saved without changing their identity",
  );
  check(
    (
      await rows(
        `update public.organization_settings set timezone='UTC' where organization_id='${orgB}' returning id`,
      )
    ).length,
    0,
    "Organization admin cannot edit another tenant’s settings",
  );
  await forbidden(
    `insert into public.organizations(name,slug)values('Unauthorized Company','unauthorized-company')`,
    "Organization admins cannot create platform organizations",
  );
  await rejected(
    `update public.organizations set status='suspended' where id='${orgA}'`,
    "Organization admins cannot change platform lifecycle status",
  );
  await rejected(
    `update public.organizations set subscription_status='active' where id='${orgA}'`,
    "Organization admins cannot set their subscription status",
  );
  check(
    (await rows("select * from public.platform_memberships")).length,
    0,
    "Organization admins cannot access platform memberships",
  );
  await forbidden(
    `insert into public.platform_memberships(user_id)values('${adminA}')`,
    "Organization admin cannot promote themselves to super admin",
  );
  await forbidden(
    `insert into public.organization_memberships(organization_id,user_id,role)values('${orgB}','${adminA}','owner')`,
    "Organization admin cannot grant themselves membership in another tenant",
  );
  await forbidden(
    `insert into public.platform_configuration(key,value)values('general','{}')`,
    "Organization admins cannot write platform configuration",
  );
  await forbidden(
    `insert into public.organization_domains(organization_id,hostname,verified_at)values('${orgA}','unverified.example.test',now())`,
    "Organization admins cannot self-verify a custom domain",
  );
  check(
    (
      await rows(
        `select id from public.users where id='${residents[0].user_id}'`,
      )
    ).length,
    1,
    "Administrators can see colleague profiles only through their organization",
  );
  await asUser(leasingA);
  check(
    (await rows("select * from public.properties")).length,
    3,
    "Leasing staff can view their organization’s inventory",
  );
  for (const table of [
    "residents",
    "payments",
    "platform_memberships",
    "maintenance_internal_notes",
  ])
    check(
      (await rows(`select * from public.${table}`)).length,
      0,
      `Leasing role cannot access ${table}`,
    );
  check(
    (
      await rows(
        `update public.leads set status='Contacted' where organization_id='${orgB}' returning id`,
      )
    ).length,
    0,
    "Leasing workflow writes are tenant scoped",
  );
  await asUser(residents[0].user_id);
  check(
    await rows("select id from public.residents"),
    [{ id: residents[0].id }],
    "Resident identity remains limited to the signed-in resident",
  );
  check(
    (
      await rows(
        `select id from public.payments where resident_id<>'${residents[0].id}'`,
      )
    ).length,
    0,
    "Resident cannot read another resident’s payment records",
  );
  check(
    (
      await rows(
        `select id from public.maintenance_requests where resident_id<>'${residents[0].id}'`,
      )
    ).length,
    0,
    "Resident cannot read another resident’s requests",
  );
  await forbidden(
    `insert into public.platform_memberships(user_id)values('${residents[0].user_id}')`,
    "Residents cannot enter platform management",
  );
  await asUser(superUser);
  check(
    (await rows("select id from public.organizations")).length,
    2,
    "Super admin can view organizations without tenant membership",
  );
  check(
    (await rows("select role from public.platform_memberships"))[0],
    { role: "super_admin" },
    "Platform super admin is stored separately from organization roles",
  );
  for (const table of [
    "residents",
    "payments",
    "maintenance_requests",
    "documents",
    "leads",
  ])
    check(
      (await rows(`select * from public.${table}`)).length,
      0,
      `Platform management does not grant access to tenant ${table}`,
    );
  await db.exec(
    `insert into public.organizations(name,slug)values('New Independent Company','new-independent-company');insert into public.platform_configuration(key,value)values('general','{"platform_name":"Property Hub"}');insert into public.organization_domains(organization_id,hostname,verified_at)values('${orgA}','alder.example.test',now());`,
  );
  check(
    (await rows("select id from public.organizations")).length,
    3,
    "Super admin can create an independent organization",
  );
  check(
    (await rows("select key from public.platform_configuration"))[0],
    { key: "general" },
    "Super admin can manage platform configuration",
  );
  await db.exec(
    `update public.organizations set status='suspended',subscription_status='past_due' where id='${orgA}'`,
  );
  await asUser(adminA);
  check(
    (await rows(`select * from public.properties`)).length,
    0,
    "Deactivation immediately removes organization admin data access",
  );
  await asUser(residents[0].user_id);
  for (const table of [
    "residents",
    "leases",
    "payments",
    "maintenance_requests",
    "maintenance_attachments",
    "maintenance_updates",
    "documents",
    "document_assignments",
    "announcements",
  ])
    check(
      (await rows(`select * from public.${table}`)).length,
      0,
      `Deactivated residents cannot retrieve ${table}`,
    );
  await asUser(superUser);
  await db.exec(
    `update public.organizations set status='active',subscription_status='trial' where id='${orgA}'`,
  );
  await asUser(adminA);
  check(
    await rows("select id from public.properties order by id"),
    properties.map((p) => ({ id: p.id })),
    "Reactivation preserves every original Alder & Stone property ID",
  );
  await asUser(residents[0].user_id);
  check(
    await rows("select id from public.residents"),
    [{ id: residents[0].id }],
    "Existing resident access is restored without recreating records",
  );
  await db.exec("reset role");
  check(
    (
      await rows(
        "select tablename from pg_tables where schemaname='public' and not rowsecurity",
      )
    ).length,
    0,
    "All new and existing public tables have RLS enabled",
  );
  check(
    (
      await rows(
        "select reloptions from pg_class where oid='public.organization_members'::regclass",
      )
    )[0],
    { reloptions: ["security_invoker=true"] },
    "Compatibility view explicitly uses caller authorization",
  );
}
