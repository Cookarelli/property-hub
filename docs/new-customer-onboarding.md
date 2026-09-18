# Add a new property management customer

After the platform has been connected to Supabase once, every customer is configured through `/platform`. No customer-specific source files, builds or deployments are needed. The existing Alder & Stone demonstration is preserved separately.

## One-time deployment setup

1. Deploy the existing Next.js application to Vercel or a compatible Node host. Use the pinned dependencies and build scripts.
2. Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `PROPERTY_HUB_APP_URL` for the deployment's public origin. No onboarding service-role secret is required.
3. Apply all nine migrations to the intended Supabase project. Do **not** seed fictional people or payments into a production customer database.
4. Check that the private `organization-marketing` Storage bucket and its policies exist. The onboarding migration creates them on Supabase. Local PGlite cannot host image files or Auth email.
5. Configure Supabase Auth email verification and SMTP. Set its Site URL and allowed redirect URL to your platform origin and `/auth/confirm`. Allow account registration if invited colleagues will register themselves.
6. Create and verify the initial platform operator's Auth account. A trusted database operator must bootstrap its profile and separate platform role once:

```sql
-- Replace the UUID with the verified operator's auth.users ID.
insert into public.users (id, full_name, email)
select id, 'Platform Administrator', email
from auth.users where id = '<verified-auth-user-uuid>'
on conflict (id) do nothing;

insert into public.platform_memberships (user_id, role)
values ('<verified-auth-user-uuid>', 'super_admin')
on conflict (user_id) do nothing;
```

7. Sign in and open `/platform`. Organization admins and demo personas do not see or gain platform permissions.
8. In a customer production deployment, set `PROPERTY_HUB_LEASING_BACKEND=disabled` for the original fictional demo inquiry adapter. New customer websites use their own scoped inquiry function and continue to work. Never point the optional privileged **demo** Supabase adapter at a customer production project.

## Customer checklist

1. **Create organization.** Enter the company/legal name, unique organization slug, colors, phone, email, website and business address. The company starts as a private draft. Slugs are kept stable after creation to preserve URLs.
2. **Upload branding.** Open its setup page and upload a logo, or use an HTTPS logo URL. Save the company form after uploading. A logo is optional; the company name is a usable wordmark. Colors automatically receive contrasting control text.
3. **Add properties.** Enter each property's address, description, main photo, optional additional photos, amenities, office details and emergency maintenance phone. Decide which properties to include on the eventual website. Saving a property does not publish a draft company.
4. **Add units.** Open a property's unit section and enter unit number, building, floor-plan name, beds/baths, square footage, rent, deposit, availability date and optional photos. Amounts are entered in dollars and stored as cents. Available and turnover units can be added directly. An occupied unit requires a real lease/resident workflow; setup does not invent residents or mark apartments occupied without a lease.
5. **Invite staff.** Create an invitation for the intended owner's or admin's exact email and role. Copy and share the link. The recipient signs in or creates an account, verifies their email, then accepts. The checklist advances when an owner/admin membership actually exists, not merely when a link is created. Invitations expire in seven days and can be revoked; lost links should be revoked and replaced.
6. **Configure the resident portal.** Choose Starter, Professional or Portfolio, then review the feature switches. Saving the configuration records this decision. Disabled features disappear from relevant navigation and reject protected data paths.
7. **Configure maintenance.** Review requests/tracking switches on the same feature form, and confirm the property's office and emergency contacts. Changing a plan reloads its defaults; review custom switches before saving.
8. **Connect payment system.** There is no production payment provider yet. Explicitly choose **Defer payment integration**. The checklist records the decision and the UI continues to say no provider is connected. No payment or billing charge is made.
9. **Review public website.** Open the protected preview, check company branding, photos, rents, deposits, availability and contact details, then confirm the review. Complete the preceding required steps first. The public address is `/sites/[organizationSlug]`. Draft/ready companies are unavailable at that public address.
10. **Activate organization.** Resolve any remaining checklist items. Mark the account ready if it should remain private, or choose active and confirm. Set subscription metadata to trial/active/past_due/canceled as appropriate; this does not initiate billing.

## After activation

- Staff sign in through `/workspace` or the existing organization slug alias.
- The website immediately uses saved company/property data. Public inquiries create leads in that organization only.
- A saved branding, feature, property or unit change clears website review. Reopen the private preview and confirm again to restore public visibility. This does not log staff out of an otherwise active private workspace.
- Suspending an organization hides its public site and uploaded public images and removes member access, while retaining its records. Reactivate through the platform console when appropriate.
- Unimplemented messaging, full online applications, payments, SMS and analytics stay labeled unavailable. Do not sell their switches as completed integrations.

## Verification and current limits

Run `pnpm lint`, `pnpm typecheck`, `pnpm test:unit`, `pnpm db:test`, and the production build. The database suite creates **Harborline Property Group** as an isolated second fictional customer and verifies brand isolation, property/resident/maintenance isolation, invitation acceptance, readiness, feature controls, public inquiries and private Storage rules. It does not add fictional customers to a production database.

Only the saved local demo database is migrated in this workspace; no hosted Supabase project is configured here. Auth email delivery, real Storage transfers and production onboarding need hosted staging verification. The [local sales-demo release audit](MVP-RELEASE-AUDIT.md) now passes all 37 browser tests; it does not validate those hosted integrations. Custom-domain verification/routing, billing, automatic invitation email delivery, bulk inventory import and unreferenced-upload cleanup are not implemented.

The recommended next step is to connect a dedicated Supabase staging project and onboard one test company using this checklist, then verify the live account and storage flows before accepting customer data.
