# GitHub and Vercel deployment

Source repository: https://github.com/Cookarelli/property-hub

Live demo: https://property-hub-orpin.vercel.app

Vercel project: https://vercel.com/steves-projects-e37a4ef4/property-hub

Supabase project: https://supabase.com/dashboard/project/vxgliyuqfvdqugccurxk

Deployment verified September 18, 2026. The GitHub repository contains the application, and Vercel's Git integration automatically deploys `main` to the live demo. Vercel deployment protection remains enabled for nonproduction deployment URLs.

The application is the repository root. `vercel.json` uses the locked pnpm version, Next.js framework detection and the audited Webpack production build. Node.js 24 is declared in `package.json`.

## Vercel setup

`Cookarelli/property-hub` is connected to the `property-hub` project in Steve's Projects, with the repository root as the application root and `main` as the production branch. The repository configuration supplies the install/build commands. Production credentials are configured only for Production. Preview environments need their own dedicated backend credentials before accepting leasing requests.

## Hosted demo versus customer production

The five-persona guided demo at `/demo` runs with fictional browser-local data and does not require Supabase authentication. Real account sign-in and platform onboarding require a configured Supabase project.

The public tour/application forms use durable Supabase storage on Vercel. They never fall back to a serverless filesystem. Requests are scoped to the fictional demo organization and an HTTP-only browser session; another visitor cannot retrieve them through the demo inbox.

The supplied Supabase project was verified empty before setup. All nine repository migrations were applied, and their recorded versions match the source filenames. The deterministic seed created one Alder & Stone organization, three properties, 90 units, 78 residents and leases, and 235 simulated payment records. No passwords or real customer accounts were created. Every public base table has Row Level Security enabled.

These Vercel environment variables are configured for Production:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `PROPERTY_HUB_LEASING_BACKEND=supabase-demo`
- `PROPERTY_HUB_DEMO_ORGANIZATION_ID=00000001-0000-4000-8000-000000000001`
- `SUPABASE_SECRET_KEY` (server-only, sensitive)
- `PROPERTY_HUB_APP_URL=https://property-hub-orpin.vercel.app`

Supabase Auth's site URL is the live origin, with the exact `https://property-hub-orpin.vercel.app/auth/confirm` callback allowed. Server credentials are sensitive environment variables, never browser configuration or committed files.

For real customer production, keep the fictional intake backend disabled, do not load fictional residents into a customer database, and follow [customer onboarding](new-customer-onboarding.md). Configure Supabase Auth's allowed redirect URLs for `/auth/confirm` on the deployed origin. Scope preview credentials separately from production.

Never upload `.env.local`, local databases/backups, or credentials. Git and deployment ignore rules exclude these files. No live payment processing is enabled by deployment.

## Verification

Hosted verification passed:

- Homepage → The Mercer → available two-bedroom → tour submission → success screen.
- Application inquiry submission → success screen → manager lead pipeline/inbox.
- Both fictional requests were independently confirmed in Supabase with linked lead/tour records. They use `deployment-check@propertyhub.example` and do not send messages.
- A fresh session returns zero other-session inquiries.
- Applicant, Resident, Property Manager, Maintenance, and Owner dashboards switch without authentication and show their populated data.
- Unauthenticated `/platform` and `/workspace` requests lead to sign-in; the platform administration interface is not rendered.
- Hosted PostgreSQL role checks passed for manager tenant isolation, cross-tenant update prevention, resident-only leases/payments/maintenance, and denial of platform privileges. Temporary fixtures were rolled back.
- Production build, lint, TypeScript, nine policy tests, and 212 local database checks passed. The [local release audit](MVP-RELEASE-AUDIT.md) separately records 37 browser tests from the prior full audit.

Safe server diagnostics record only fixed operation labels and status/error codes. They never log credentials, cookies, applicant payloads, or resident information.

## Before real customer launch

This is a hosted sales demo. Demo maintenance, payment, and persona state remains browser-local; payments never move money. Public leasing inquiries are persisted in Supabase. Do not treat demo persona switching as production authorization.

Provision the first real platform administrator, configure production email delivery, and complete the [customer onboarding checklist](new-customer-onboarding.md) before inviting a real organization. No platform administrator was silently granted by deployment.

Supabase's security advisor reports no database/RLS findings. Its remaining Auth advisory is disabled leaked-password protection, which the dashboard lists as requiring Pro or above. No paid upgrade was performed. See [Supabase password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Email delivery and a real administrator sign-in were not exercised in this deployment pass.
