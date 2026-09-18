# Multi-tenant customer configuration

Updated September 18, 2026. One Next.js application and Supabase project can serve independent property management companies. Customer setup is stored in PostgreSQL and performed in the platform console. Creating a customer does not require editing source code or redeploying the app.

## Identity and ownership

`organizations` is the tenant root. Properties, buildings, floor plans, units, residents, leases, staff memberships, leads, maintenance, documents and announcements retain their original UUID organization relationships. Composite foreign keys and immutable tenant IDs prevent cross-company references. Alder & Stone remains the original fictional tenant with its original records.

`organization_memberships` remains the canonical role table; `organization_members` remains its security-invoker compatibility view. Global Supabase user identity is separate from organization membership. `platform_memberships` grants the platform `super_admin` role; demo personas and organization admins cannot grant it.

## Customer setup routes

| Route                                                 | Purpose / authorization                                                                       |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `/platform`                                           | Super-admin organization creation and directory                                               |
| `/platform/[organizationId]`                          | Super-admin checklist, company, properties, units, invitations, plans, features and lifecycle |
| `/platform/[organizationId]/preview`                  | Super-admin-only customer website preview and explicit review                                 |
| `/sites/[organizationSlug]`                           | Live customer-branded website; only active, reviewed organizations with website enabled       |
| `/invite/[token]`                                     | Sign in/register, verify email and accept a one-time staff invitation                         |
| `/workspace/[organizationId]`                         | Existing authenticated organization workspace                                                 |
| `/[organizationSlug]`                                 | Existing authenticated workspace alias, preserved                                             |
| `/api/organization-media/[organizationId]/[filename]` | Private/no-store marketing image delivery governed by Storage RLS                             |

The original public/demo URLs and their fictional workflows are preserved. Customer websites are separate from the reusable Property Hub demonstration. Production workspace features continue to use real authentication; the demo switcher cannot enter platform setup.

## Database changes

`20260918063640_customer_onboarding.sql` is the ninth migration. There are now **29 public base tables and one compatibility view**.

- Organizations: `plan`, validated JSON feature flags, portal/maintenance configuration timestamps, explicit payment deferral, website review and onboarding completion timestamps.
- Lifecycle: `draft`, `setup`, `ready`, `active`, `suspended`. New organizations default to `draft`. Existing active organizations stay active; legacy `inactive` maps to `suspended`.
- Subscription metadata: `trial`, `active`, `past_due`, `canceled`. Legacy `cancelled` maps to `canceled`. No billing or subscription charge is performed.
- Properties: photo URLs, office hours/phone/email, emergency maintenance phone; existing name, address, description, primary photo and amenities are reused.
- Units: deposit and photo URLs. Bedrooms, bathrooms and square footage remain in tenant/property-scoped floor plans; setup saves the building, floor plan and unit in one database transaction. Occupancy still requires a real active lease and resident relationship.
- `organization_invitations`: company, email, allowed staff role, token hash, inviter, expiry, acceptance and revocation timestamps. Tokens are not stored in plaintext.
- `organization_assets`: tenant-scoped metadata for private marketing image objects.
- Leads: inquiry message and a per-organization idempotency key.
- Scoped setup, catalog, inquiry and invitation functions with explicit grants and fixed search paths. No anonymous base-table grants were added.

The local Auth/Storage test schemas emulate Supabase interfaces so the actual SQL policies can be executed. The migration creates the private Storage bucket and policies when applied to a real Supabase project. It intentionally does not create a fake Storage service in the local PGlite demo.

## Publication rules

Activation is not a cosmetic toggle. The database checks company contact details, complete published properties, units for every published property, an accepted owner/admin membership, relevant portal/maintenance decisions, payment deferral and public review. New organizations cannot be inserted directly as active through an authenticated API call.

A `ready` organization is still private. Only explicit `active` status plus website review plus the website feature enables public delivery. Changes to branding, feature settings, properties or units clear the review. Existing private workspaces remain available while an active company reviews website changes. Suspending an organization removes workspace and public image/site access without deleting records. Original active tenants are grandfathered for private-workspace reactivation; their public sites still require explicit setup and review.

The public catalog returns only an allowlisted marketing projection: company branding/contact details, published property information and available apartments. It never returns residents, occupied-unit identities, leases, membership data, payments or internal maintenance records. Preview authorization is checked inside the database as well as on the page; omitted or null preview arguments cannot bypass publication rules.

## Features and plans

`starter`, `professional` and `portfolio` provide initial feature defaults. Starter enables the public website/listings/availability/inquiry features. Professional and Portfolio also enable the available resident and operational capabilities. They currently share defaults for implemented operational features; there is no invented advanced feature or billing behavior to differentiate them. A super admin can customize an organization's flags independently of these defaults.

Prepared keys: `website`, `property_listings`, `availability`, `lead_capture`, `resident_portal`, `maintenance_requests`, `maintenance_tracking`, `documents`, `announcements`, `resident_messaging`, `online_applications`, `lease_management`, `payment_integration`, `sms_notifications`, `analytics`.

Production messaging, full online applications, payment integration, SMS and analytics are **unavailable and effectively disabled**, even if someone writes a true flag directly. The configuration screen labels them accordingly. Existing demo versions remain demonstrations, not production integrations. Available operational flags gate existing scoped records and database workflows; this pass does not silently turn demo-only workflows into production services.

Server guards and navigation use the same feature catalog. Relevant database policies enforce disabled maintenance/document/announcement/lease/lead capabilities, and resident identity helpers respect a disabled portal. Public catalog and inquiry functions enforce website/listing/availability/lead flags. Feature settings are platform-only and cannot be overridden by an organization admin.

## Staff invitation security

A super admin creates a 256-bit random invitation link. Only its SHA-256 hash is saved. Invitations expire after seven days, can be revoked, and are consumed under a database row lock. Acceptance requires a real signed-in Supabase account whose **verified auth email** matches the invitation. A submitted email or editable user metadata grants no role. Existing memberships are not silently promoted when another invitation is accepted.

The console provides a copyable link; it does not claim to send an invitation email. New colleagues can create an account on that page, receive Supabase's configured verification email, and then accept. SMTP/email verification and allowed redirects must be configured once for the deployment. No service-role key is needed by the onboarding UI.

## Media privacy

Uploads accept JPEG, PNG and WebP up to 2 MB. The server checks the decoded image, limits dimensions/pixels, removes metadata and converts it to WebP. Unique object names avoid replacing other files. The bucket is private. Only super admins upload; public downloads are allowed only for images referenced by a reviewed active company's logo, published properties or available units. Unreferenced uploads and draft photos remain private. The delivery route sends `private, no-store` so suspension/feature changes are rechecked. An HTTPS image URL remains an alternative; external hosting permissions are controlled by that image provider.

## Authorization boundaries

All administration actions recheck Supabase Auth and platform membership, then bind queries to the selected organization. Platform setup can manage property/building/floor-plan/unit inventory and invitations, because onboarding requires that access. It still does not grant platform administrators customer resident, payment or maintenance records. Organization members retain tenant/RLS restrictions. Existing tenant account/profile and financial policies are preserved.

The public inquiry function validates a published property in the selected active organization, whitelists basic contact fields, bounds input, limits repeats per email/company and preserves idempotency. Production abuse controls such as CAPTCHA or broader edge rate limiting remain a deployment follow-up.

## Key files

- `src/app/platform/[organizationId]/`: setup and private preview pages.
- `src/app/sites/[organizationSlug]/`: runtime customer website.
- `src/app/invite/[token]/`, `src/app/auth/confirm/`: invitation account/verification flow.
- `src/app/api/organization-media/`: guarded image delivery.
- `src/lib/organizations/{features,onboarding-schema,onboarding-actions,setup-fields,catalog,invitation-auth,rpc-types}.ts`: configuration definitions, validation, scoped actions and shared data contracts.
- `src/components/organizations/`: reusable configuration forms, uploads, feature controls and customer website.
- `src/lib/auth.ts`, organization repositories and workspace layouts: feature-aware production access/navigation.
- `scripts/check-onboarding.ts`: a separate fictional Harborline Property Group fixture and database isolation/publication/invitation/Storage tests.
- `scripts/check-organization-policy.ts`: plan/flag, form, routing, branding and monetary validation tests.

## Validation boundaries

The saved local migration was applied after backup and verified against all 27 original tables; [local-onboarding-migration.json](local-onboarding-migration.json) records the preserved counts. Validation completed with 212 PostgreSQL checks, 9 application tests, lint, TypeScript, and a production Webpack build.

The second fictional customer is created by the isolated database test suite, including an owner, resident, active lease, maintenance request, property and apartment. It is intentionally not inserted into a production organization or the saved Alder & Stone demo seed. Tests execute real PostgreSQL RLS and function logic; Auth sessions and Storage tables are emulated. They do not claim to verify hosted email delivery or object transfer.

Final browser/end-to-end testing is deferred as requested. Before launch, apply the migrations to a dedicated Supabase staging project, configure Auth/Storage/SMTP, provision the first real super admin and run a hosted onboarding integration pass. Private Storage cleanup for unreferenced uploads, invitation email delivery automation, billing and the unavailable integrations remain future work.
