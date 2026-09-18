# Multi-tenant architecture

> Customer onboarding now extends this architecture: see [multi-tenant-architecture.md](multi-tenant-architecture.md) and [new-customer-onboarding.md](new-customer-onboarding.md) for current lifecycle, features, setup inventory access, invitations, public websites and private marketing uploads.

Implemented September 18, 2026. This architecture pass preserves the existing public and demo experiences. Final browser/end-to-end testing is intentionally deferred at the user's request.

## First tenant and data preservation

**Alder & Stone Living** remains the first organization (`alder-stone`, UUID `00000001-0000-4000-8000-000000000001`). The repository had no Louis Capra or Pine Creek implementation; the user explicitly selected Alder & Stone. No tenant, property, resident, lease, or saved inquiry was renamed, deleted, or reassigned.

The existing database already used organization IDs and composite tenant foreign keys. This pass extends that architecture rather than creating a competing ownership system. Two additive migrations were applied to the existing local PostgreSQL database after an offline backup. An automated before/after comparison verified the original organization identity and every business record across all 23 original tables. This includes 3 properties, 90 units, 78 residents and leases, 235 payments, and 45 saved leasing intakes. See `local-tenant-migration.json` for counts and the backup location.

## Schema changes

- `20260918055837_organization_roles.sql`: adds `admin` and `leasing` to the existing organization role enum. This separate migration commits the enum values before policies use them.
- `20260918055838_tenant_platform.sql`: organization branding/contact fields, lifecycle and subscription status; `organization_settings`, `organization_domains`, `platform_memberships`, and `platform_configuration`; explicit grants, RLS, timestamps, indexes, and privacy policies.

There are now **8 migrations, 27 base tables, and one compatibility view**.

`organizations` now includes name, slug, legal name, phone, email, website, logo URL, primary/secondary colors, address, status, subscription status, and original timestamps/UUID. Existing required `organization_id` columns, non-null ownership, immutable tenant identity, and composite foreign keys remain enforced for properties, buildings, units, residents, leases, leasing records, maintenance, document assignments, announcements, and activity.

The canonical membership table remains `organization_memberships` to preserve existing references and integrations. `organization_members` is a read-only compatibility view using `security_invoker=true`; it exposes the requested membership shape without bypassing the base table's RLS. Both names resolve the same records. Global user identity remains in `users`/Supabase Auth; company membership and roles remain organization scoped.

Organization settings store a time zone and a JSON object for future non-secret preferences. Verified custom-domain mappings live in `organization_domains`. Members cannot create or verify their own domain mappings. Secrets must not be stored in organization settings or branding.

## Request and database boundaries

1. `requireUser()` verifies the actual Supabase user with `auth.getUser()` on the server.
2. `requireMembership()` queries membership for **both authenticated user and selected organization**, checks allowed roles, then requires an active organization. Guards are request cached, not globally cached.
3. Server repositories add an explicit `.eq('organization_id', verifiedOrganization.id)` predicate. Staff profiles use only IDs obtained from the selected organization's memberships. Resident queries additionally bind `user_id` and then `resident_id` to the authenticated resident.
4. Every exposed base table has RLS. Tenant policies use actual database membership, not a URL, client role, hidden navigation item, JWT user metadata, or demo persona. Composite foreign keys reject parent references in another organization. Tenant identity cannot be changed by an update.
5. A restrictive active-organization policy stops tenant reads and writes on deactivation, including resident document, payment, lease, attachment, and maintenance paths. Records remain intact and access returns on reactivation.
6. Branding actions whitelist editable fields. Organization administrators cannot change subscription/lifecycle status, create platform organizations, self-verify domains, write platform configuration, or promote memberships. RLS and a database trigger enforce those restrictions even for direct database API calls.

All production queries use the user's Supabase session and its RLS context. There is no service-role client or fixture fallback in the production workspace. Shared components do not hard-code tenant names or contact details; fictional demo configuration is in `src/lib/demo/organization.ts`.

## Roles

| Role                       | Access                                                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Owner / organization admin | Own portfolio operations, colleague directory, branding and settings                                                                        |
| Property manager           | Own portfolio operations and colleague directory; no company/platform settings                                                              |
| Staff                      | Own operational records; no finance, membership provisioning or manager-only writes                                                         |
| Maintenance                | Own organization inventory and maintenance operations                                                                                       |
| Leasing                    | Own inventory, leads, applications, tours, documents and announcements; no resident directory, payment records or private maintenance notes |
| Resident                   | Own permitted resident, lease, payment, maintenance and document information; applicable announcements                                      |
| Applicant                  | Own permitted application/tour records and available inventory                                                                              |
| Platform super admin       | Organization metadata, organization creation, lifecycle/subscription state, verified-domain records, platform configuration                 |

A platform super admin receives **no automatic access to customer properties, residents, payments, leads or documents**. A separate organization membership is required for tenant access. Legacy `platform_admin` organization memberships are preserved but are not promoted to `super_admin` and do not gain platform privileges.

## Routes and administration

- Existing public and `/demo/*` URLs are preserved.
- `/workspace` lists the signed-in user's active organizations; platform administrators also receive a link to their separate console.
- `/workspace/[organizationId]` is the stable authenticated tenant entry point. The organization frame loads company name, logo, colors, contact information and website from PostgreSQL. Configurable button/navigation colors use contrasting text.
- `/workspace/[organizationId]/[section]` provides scoped property, unit, resident, lease, maintenance, lead, application, document, announcement and staff reads, plus owner/admin branding and time-zone forms. Access is checked again in the page/repository, not only in navigation. Tables currently display the newest 200 records.
- Residents receive their own payment and maintenance summary instead of administrative records.
- `/[organizationSlug]`, including `/alder-stone`, is an authenticated alias to the existing organization workspace. Reserved application paths cannot be selected by the creation form. This is preparation for organization-specific routing; it does not turn the shared fictional public marketplace into a separate live leasing site for every tenant.
- `/platform` is server guarded by `requireSuperAdmin()` and has organization creation, activate/deactivate, subscription-status and platform configuration controls. Deactivation requires an explicit confirmation. Subscription status is metadata only; billing is not implemented.

Custom-domain storage is ready, but DNS ownership verification and host-based routing are not enabled. A future resolver must use an exact, verified hostname mapping and still require membership for private routes. Never trust a client-provided organization header or unvalidated forwarded host as authorization.

## Trusted onboarding

No super admin or production password is seeded. Bootstrap the first real platform administrator using a trusted database operator after their Supabase Auth identity and `public.users` profile exist:

```sql
-- Supply the real, verified account UUID. Do not execute with a demo identity.
insert into public.platform_memberships (user_id, role)
values ('<verified-auth-user-uuid>', 'super_admin');
```

Provision organization owners/staff through a trusted onboarding or invitation service after verifying the target user. Insert the organization's UUID, verified user UUID, and allowed role into `organization_memberships`. Browser users cannot directly provision or modify memberships. An invitation UI, ownership-transfer workflow, and audited membership administration remain future work.

## Demo boundary

The persona switcher continues to operate only on the fictional demo state. Switching, profile edits, maintenance interactions and reset never establish a production session or alter production memberships. Public demo inquiries remain bound to the explicitly configured fictional organization and browser session. The optional privileged demo intake adapter must use a dedicated demo Supabase project, never a customer database. Production leasing providers and mutation workflows remain a separate integration pass.

## Validation and operations

- `pnpm db:test`: 164 assertions execute the real SQL migrations and policies in PostgreSQL/PGlite under distinct identities. Coverage includes two organizations, admins, leasing, residents, platform super admins, direct cross-tenant reads/inserts/updates/deletes, escalation attempts, compatibility-view RLS, deactivation/reactivation, and existing fixture coherence.
- `pnpm test:unit`: application query scoping, role/section guards, branding field allowlists, URL/color validation, reserved routes, contrasting colors and first-tenant compatibility.
- `pnpm db:types`: regenerates types from the migrated database catalog, including the membership view and enum values.
- `pnpm db:migrate:local`: with the local app stopped, makes an offline backup, applies pending migrations transactionally with bookkeeping, and verifies preserved records. Do not run concurrently with an app using the same local directory.
- `pnpm lint` and `pnpm typecheck`: passed. The production build passed with `pnpm build --webpack`; the default Turbopack attempt was blocked by a local sandbox restriction on its compiler process binding an internal port. No build configuration was changed.

Only the local saved database was migrated. A hosted Supabase project is not configured in this workspace. Apply the same migrations to a dedicated development/staging project, provision real test accounts in two organizations, run Supabase advisors, and verify Auth/PostgREST/Storage before production rollout. The current database tests emulate `auth.uid()`; they are not hosted Auth integration tests. No final browser/end-to-end test suite was run during this architecture pass.

The preceding design pass remains preserved. Browser tests were adjusted for the new two-step demo reset, but their execution and final responsive verification remain deferred.
