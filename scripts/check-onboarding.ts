import type { PGlite } from "@electric-sql/pglite";
import { createHash } from "node:crypto";
import { uuid, organizationId, residents } from "../src/lib/demo/data";
export async function checkOnboarding(
  db: PGlite,
  check: (actual: unknown, expected: unknown, message: string) => void,
) {
  const org = uuid(61, 1),
    prop = uuid(62, 1),
    owner = uuid(63, 1),
    resident = uuid(63, 2),
    residentRecord = uuid(64, 1),
    lease = uuid(65, 1),
    request = uuid(66, 1),
    superUser = uuid(7, 803);
  const as = async (id: string) => {
    await db.exec(
      `reset role;select set_config('request.jwt.claim.sub','${id}',false);set role authenticated;`,
    );
  };
  const rows = async (sql: string) => (await db.query(sql)).rows;
  const denied = async (sql: string, msg: string) => {
    let failed = false;
    try {
      await db.exec(sql);
    } catch {
      failed = true;
    }
    check(failed, true, msg);
  };
  const token = "a".repeat(64),
    hash = createHash("sha256").update(token).digest("hex");
  await db.exec(
    `reset role;insert into auth.users(id,email,email_confirmed_at)values('${owner}','owner@harborline.example',now()),('${resident}','resident@harborline.example',now());`,
  );
  await as(superUser);
  await db.exec(
    `insert into public.organizations(id,name,slug,legal_name,phone,email,address,primary_color,secondary_color,plan,features)values('${org}','Harborline Property Group','harborline-test','Harborline Property Group','312-555-0130','office@harborline.example','40 Harbor Lane, Chicago, IL','#153f65','#e9f0f8','professional',private.plan_features('professional'));`,
  );
  check(
    (
      await rows(`select status from public.organizations where id='${org}'`)
    )[0],
    { status: "draft" },
    "New customers are private drafts by default",
  );
  await denied(
    `update public.organizations set status='active' where id='${org}'`,
    "Incomplete customers cannot be activated",
  );
  await denied(
    `insert into public.organizations(name,slug,status)values('Unsafe activation','unsafe-activation','active')`,
    "Super admins cannot bypass draft onboarding during creation",
  );
  await db.exec(
    `insert into public.properties(id,organization_id,name,slug,address,city,state,zip,description,image,amenities,office_hours,office_phone,office_email,emergency_phone,published)values('${prop}','${org}','Harbor House','harbor-house','40 Harbor Lane','Chicago','IL','60601','Light-filled apartments beside neighborhood parks and local shops.','/images/juniper.jpg',array['Fitness room','Pet friendly'],'Mon–Fri, 9 AM–5 PM','312-555-0130','leasing@harborline.example','312-555-0198',true);`,
  );
  const payload = {
    number: "201",
    building: "East",
    floor_plan: "Harbor Two",
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1120,
    rent_cents: 240000,
    deposit_cents: 120000,
    status: "available",
    available_on: "2026-10-01",
    photos: ["/images/mercer.jpg"],
  };
  const unit = (
    await db.query<{ id: string }>(
      `select public.configure_organization_unit($1,$2,null,$3) id`,
      [org, prop, JSON.stringify(payload)],
    )
  ).rows[0].id;
  check(
    (
      await rows(
        `select rent_cents,deposit_cents from public.units where id='${unit}'`,
      )
    )[0],
    { rent_cents: 240000, deposit_cents: 120000 },
    "New customer unit configuration persists rent and deposit exactly",
  );
  await denied(
    `select public.configure_organization_unit('${organizationId}','${prop}',null,'${JSON.stringify(payload)}')`,
    "Setup rejects a property belonging to a different organization",
  );
  await denied(
    `select public.configure_organization_unit('${org}','${prop}','${uuid(5, 1)}','${JSON.stringify(payload)}')`,
    "Unit edits cannot target an apartment in another organization",
  );
  await db.exec(
    `insert into public.organization_invitations(organization_id,email,role,token_hash,invited_by)values('${org}','owner@harborline.example','owner','${hash}','${superUser}');`,
  );
  await as(resident);
  await denied(
    `select public.accept_organization_invitation('${hash}')`,
    "A valid invite token cannot be accepted by a different email",
  );
  await db.exec(
    `reset role;update auth.users set email_confirmed_at=null where id='${owner}'`,
  );
  await as(owner);
  await denied(
    `select public.accept_organization_invitation('${hash}')`,
    "Unverified email accounts cannot accept staff invitations",
  );
  await db.exec(
    `reset role;update auth.users set email_confirmed_at=now() where id='${owner}'`,
  );
  await as(owner);
  check(
    (
      await rows(`select public.accept_organization_invitation('${hash}') id`)
    )[0],
    { id: org },
    "Verified invited staff can join the correct company without database editing",
  );
  await denied(
    `select public.accept_organization_invitation('${hash}')`,
    "Accepted staff invitations cannot be replayed",
  );
  await as(superUser);
  await db.exec(
    `update public.organizations set portal_configured_at=now(),maintenance_configured_at=now(),payments_deferred_at=now() where id='${org}'`,
  );
  const gaps = (
    await db.query<{ gaps: string[] }>(
      `select public.organization_onboarding_gaps('${org}') gaps`,
    )
  ).rows[0].gaps;
  check(
    gaps,
    ["Public website review"],
    "Readiness is derived from actual configured data and accepted staff",
  );
  const preview = (
    await db.query<{
      catalog: {
        organization: { name: string; primary_color: string };
        properties: { id: string }[];
        units: { id: string }[];
      };
    }>(`select public.organization_catalog('harborline-test',true) catalog`)
  ).rows[0].catalog;
  check(
    preview.organization.name,
    "Harborline Property Group",
    "Private preview inherits the second company’s branding",
  );
  check(
    preview.organization.primary_color,
    "#153f65",
    "Private preview inherits the second company’s colors",
  );
  check(
    preview.properties.map((p) => p.id),
    [prop],
    "Public catalog contains only the selected company’s properties",
  );
  check(
    preview.units.map((u) => u.id),
    [unit],
    "Public catalog contains only the selected company’s available apartments",
  );
  await db.exec(
    "reset role;select set_config('request.jwt.claim.sub','',false);set role anon;",
  );
  check(
    (
      await rows(
        "select public.organization_catalog('harborline-test') catalog",
      )
    )[0],
    { catalog: null },
    "Draft websites are unavailable to anonymous visitors",
  );
  await denied(
    "select public.organization_catalog('harborline-test',true)",
    "Anonymous visitors cannot turn on preview with a query parameter",
  );
  check(
    (
      await rows(
        "select public.organization_catalog('harborline-test',null) catalog",
      )
    )[0],
    { catalog: null },
    "Null preview arguments cannot bypass draft privacy",
  );
  await as(superUser);
  await db.exec(
    `update public.organizations set public_reviewed_at=now() where id='${org}';update public.organizations set status='ready' where id='${org}'`,
  );
  await db.exec(
    "reset role;select set_config('request.jwt.claim.sub','',false);set role anon;",
  );
  check(
    (
      await rows(
        "select public.organization_catalog('harborline-test') catalog",
      )
    )[0],
    { catalog: null },
    "Ready organizations remain private until explicit activation",
  );
  await as(superUser);
  await db.exec(
    `update public.organizations set status='active' where id='${org}'`,
  );
  await db.exec(
    "reset role;select set_config('request.jwt.claim.sub','',false);set role anon;",
  );
  check(
    (
      await rows(
        "select public.organization_catalog('harborline-test')->'organization'->>'name' name",
      )
    )[0],
    { name: "Harborline Property Group" },
    "Reviewed and activated customer website becomes publicly available",
  );
  const leadPayload = JSON.stringify({
    name: "Prospective Renter",
    email: "renter@example.test",
    phone: "312-555-0144",
    message: "Interested in Harbor Two",
    desired_move_in: "2026-10-01",
  });
  const key = uuid(67, 1);
  const receipt = (
    await rows(
      `select public.capture_organization_lead('harborline-test','${prop}','${key}','${leadPayload}') id`,
    )
  )[0];
  check(
    (
      await rows(
        `select public.capture_organization_lead('harborline-test','${prop}','${key}','${leadPayload}') id`,
      )
    )[0],
    receipt,
    "Customer inquiries are persisted once across submission retries",
  );
  await denied(
    `select public.capture_organization_lead('harborline-test','${uuid(2, 1)}','${uuid(67, 2)}','${leadPayload}')`,
    "Public inquiry cannot attach a lead to another company’s property",
  );
  await as(owner);
  check(
    (await rows(`select id from public.leads where organization_id='${org}'`))
      .length,
    1,
    "The new customer’s staff can read its website inquiry",
  );
  check(
    (
      await rows(
        `select id from public.properties where organization_id='${organizationId}'`,
      )
    ).length,
    0,
    "The second organization admin cannot read Alder & Stone properties",
  );
  await denied(
    `update public.organizations set features='{}' where id='${org}'`,
    "Organization admins cannot override plan feature configuration",
  );
  // Real occupied inventory, resident, lease, and repair for the second test tenant.
  await db.exec("reset role;");
  await db.exec(
    `begin;insert into public.users(id,full_name,email)values('${resident}','Jordan Park','resident@harborline.example');insert into public.organization_memberships(organization_id,user_id,role)values('${org}','${resident}','resident');insert into public.residents(id,organization_id,user_id,name,email,phone)values('${residentRecord}','${org}','${resident}','Jordan Park','resident@harborline.example','312-555-0151');update public.units set status='occupied',available_on=null where id='${unit}';insert into public.leases(id,organization_id,unit_id,starts_on,ends_on,rent_cents,deposit_cents,status)values('${lease}','${org}','${unit}','2026-09-01','2027-08-31',240000,120000,'active');insert into public.lease_residents(organization_id,lease_id,resident_id,is_primary)values('${org}','${lease}','${residentRecord}',true);insert into public.maintenance_requests(id,organization_id,property_id,unit_id,resident_id,title,description,category)values('${request}','${org}','${prop}','${unit}','${residentRecord}','Kitchen faucet drips','The kitchen faucet drips after being turned off.','Plumbing');commit;`,
  );
  await as(resident);
  check(
    await rows("select id from public.residents"),
    [{ id: residentRecord }],
    "The second tenant resident sees only their profile",
  );
  check(
    await rows("select id from public.maintenance_requests"),
    [{ id: request }],
    "The second tenant resident sees only their repair",
  );
  await as(residents[0].user_id);
  check(
    (
      await rows(
        `select id from public.residents where organization_id='${org}'`,
      )
    ).length,
    0,
    "Alder & Stone residents cannot access the other company’s residents",
  );
  check(
    (
      await rows(
        `select id from public.maintenance_requests where organization_id='${org}'`,
      )
    ).length,
    0,
    "Alder & Stone residents cannot access the other company’s maintenance",
  );
  await as(uuid(7, 801));
  check(
    (
      await rows(
        `select id from public.residents where organization_id='${org}'`,
      )
    ).length,
    0,
    "Organization A admins cannot access Organization B resident records",
  );
  check(
    (
      await rows(
        `update public.maintenance_requests set status='completed' where id='${request}' returning id`,
      )
    ).length,
    0,
    "Organization A admins cannot change Organization B maintenance",
  );
  await as(superUser);
  await db.exec(
    `update public.organizations set features=jsonb_set(features,'{maintenance_tracking}','false') where id='${org}'`,
  );
  await as(owner);
  check(
    (await rows("select id from public.maintenance_requests")).length,
    0,
    "Disabled maintenance tracking is enforced by database policy",
  );
  await as(superUser);
  await db.exec(
    `update public.organizations set features=jsonb_set(features,'{resident_portal}','false') where id='${org}'`,
  );
  await as(resident);
  check(
    (await rows("select id from public.residents")).length,
    0,
    "Disabled resident portal blocks direct resident profile reads",
  );
  await as(superUser);
  await db.exec(
    `update public.organizations set features=jsonb_set(features,'{availability}','false'),public_reviewed_at=null where id='${org}'`,
  );
  check(
    (
      await rows(
        `select public.organization_catalog('harborline-test',true)->'units' units`,
      )
    )[0],
    { units: [] },
    "Disabled availability removes units from the website projection",
  );
  await db.exec(
    `update public.organizations set features=jsonb_set(features,'{lead_capture}','false') where id='${org}';update public.organizations set public_reviewed_at=now() where id='${org}'`,
  );
  await db.exec(
    "reset role;select set_config('request.jwt.claim.sub','',false);set role anon;",
  );
  await denied(
    `select public.capture_organization_lead('harborline-test','${prop}','${uuid(67, 3)}','${leadPayload}')`,
    "Disabled lead capture rejects direct submissions",
  );
  await as(superUser);
  await db.exec(
    `update public.properties set description='Updated customer marketing description for the website.' where id='${prop}'`,
  );
  await db.exec(
    "reset role;select set_config('request.jwt.claim.sub','',false);set role anon;",
  );
  check(
    (
      await rows(
        "select public.organization_catalog('harborline-test') catalog",
      )
    )[0],
    { catalog: null },
    "Changing property content requires a fresh website review",
  );
  await as(superUser);
  check(
    (
      await rows(
        `select id from public.residents where organization_id='${org}'`,
      )
    ).length,
    0,
    "Setup inventory access does not grant super admins private resident access",
  );

  // Execute the real Storage policies against the local Storage schema.
  const assetPath = `${org}/${uuid(68, 1)}.webp`;
  await as(superUser);
  await db.exec(
    `insert into public.organization_assets(organization_id,path)values('${org}','${assetPath}');insert into storage.objects(bucket_id,name)values('organization-marketing','${assetPath}');update public.organizations set logo_url='/api/organization-media/${assetPath}' where id='${org}'`,
  );
  await db.exec(
    "reset role;select set_config('request.jwt.claim.sub','',false);set role anon;",
  );
  check(
    (await rows("select name from storage.objects")).length,
    0,
    "Unreviewed customer branding images remain private in Storage",
  );
  await as(owner);
  await denied(
    `insert into storage.objects(bucket_id,name)values('organization-marketing','${org}/${uuid(68, 2)}.webp')`,
    "Organization users cannot upload through the platform-only marketing bucket",
  );
  await as(superUser);
  await db.exec(
    `update public.organizations set public_reviewed_at=now() where id='${org}'`,
  );
  await db.exec(
    "reset role;select set_config('request.jwt.claim.sub','',false);set role anon;",
  );
  check(
    await rows("select name from storage.objects"),
    [{ name: assetPath }],
    "Only referenced images on reviewed active websites are publicly readable",
  );
  await as(superUser);
  await db.exec(
    `update public.organizations set status='suspended' where id='${org}'`,
  );
  await db.exec(
    "reset role;select set_config('request.jwt.claim.sub','',false);set role anon;",
  );
  check(
    (await rows("select name from storage.objects")).length,
    0,
    "Suspension removes public image access as well as the website",
  );
  check(
    (
      await rows(
        "select public.organization_catalog('harborline-test') catalog",
      )
    )[0],
    { catalog: null },
    "Suspended organizations do not expose their customer website",
  );
  await as(superUser);
  check(
    (
      await rows(
        "select private.feature_enabled('" +
          org +
          "','payment_integration') enabled",
      )
    )[0],
    { enabled: false },
    "Unimplemented payment integration never reports itself enabled",
  );

  await as(superUser);
  await db.exec(
    `insert into public.organization_invitations(organization_id,email,role,token_hash,invited_by,expires_at)values('${organizationId}','resident@harborline.example','maintenance','${"b".repeat(64)}','${superUser}',now()-interval '1 day');insert into public.organization_invitations(organization_id,email,role,token_hash,invited_by,revoked_at)values('${organizationId}','resident@harborline.example','maintenance','${"c".repeat(64)}','${superUser}',now());`,
  );
  await as(resident);
  await denied(
    `select public.accept_organization_invitation('${"b".repeat(64)}')`,
    "Expired invitation links cannot create memberships",
  );
  await denied(
    `select public.accept_organization_invitation('${"c".repeat(64)}')`,
    "Revoked invitation links cannot create memberships",
  );
  await as(owner);
  await denied(
    `insert into public.organization_invitations(organization_id,email,role,token_hash,invited_by)values('${organizationId}','attacker@example.test','owner','${"d".repeat(64)}','${owner}')`,
    "Organization admins cannot create platform invitations into another company",
  );
  await as(superUser);
  await db.exec(
    `update public.organizations set features=jsonb_set(features,'{payment_integration}','true') where id='${org}'`,
  );
  check(
    (
      await rows(
        `select private.feature_enabled('${org}','payment_integration') enabled`,
      )
    )[0],
    { enabled: false },
    "Writing a future integration flag cannot make an unavailable provider live",
  );
  await db.exec("reset role;");
}
