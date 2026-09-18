# Property Hub

A multi-tenant property management SaaS foundation with polished public, management, maintenance, resident, and applicant demo experiences.

Built with **Next.js 16 App Router, strict TypeScript, Tailwind CSS 4, shadcn/ui, and Supabase/PostgreSQL**. All demonstration communities and people are fictional.

**[Open the live demo](https://property-hub-orpin.vercel.app/demo)** · [Public website](https://property-hub-orpin.vercel.app) · [Deployment setup and verified checks](docs/DEPLOYMENT.md)

GitHub `main` automatically deploys to Vercel. Hosted public tour and application inquiries persist in the dedicated Supabase demo project.

## Run the demo

Use Node.js 24 and the pinned pnpm version from `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open [Property Hub](http://localhost:3000) and choose **Start Demo**, or open the [guided demo launcher](http://localhost:3000/demo). No environment variables or account are needed for the demonstration.

The persistent **Demo: Viewing as [Persona]** control switches between Owner, Property Manager, Maintenance, Resident, and Applicant. **Demo guide** connects nine moments across those perspectives, with optional contextual hints. **Reset demo data** asks for confirmation, then restores this tab’s seeded experience and hides earlier website inquiries here; it does not delete saved database records, modify another tab, or affect production access. Public application inquiries and tour requests remain stored in PostgreSQL and scoped to a seven-day browser cookie. See the [sales demonstration walkthrough](docs/SALES-DEMO.md).

## Implemented

- A polished four-experience demo launcher, five-persona control, guided story with progress, optional hints, and scoped reset. The applicant’s selected apartment, tour, application, and lead stay linked; a resident sample-photo repair flows through manager assignment, maintenance work, resident updates, and owner metrics.
- Public homepage with search and leasing CTAs, six-way community filtering, photo galleries, available apartments, illustrated floor plans, neighborhood and policy information.
- `/apply` application inquiries and `/tour` requests, selected-home handoff, validation, loading/error/retry/success states, durable storage, and a management Leads inbox.
- A per-community internal/external application provider setting. External providers receive no contact data from Property Hub.
- Availability, how-it-works, contact, and sign-in routes.
- A dedicated resident app shell with five-item mobile navigation, a populated home, simulated rent checkout and receipts, maintenance creation and timelines, local photo/video attachments, lease details, metadata-only documents, announcements, editable preferences, and a contact form visible in the management demo.
- All 12 management navigation sections, five maintenance sections, eight resident sections, and five applicant sections.
- Shared shells, management sidebar, mobile navigation, breadcrumbs, account menu, workspace navigation search, notifications placeholder, persona switching, loading/error/empty states.
- Owner portfolio and manager operations dashboards with ten calculated metrics, occupancy/maintenance/application/payment charts, and activity history.
- Portfolio/property details, searchable unit inventory, resident directory and detail records, seven-stage lead CRM, and six-stage application workflow.
- Maintenance assignment, six queue filters, private team notes, resident timelines, organization/property/building announcements, and explicit document assignments.
- Saved apartments, demo application/tour workflows, profile/settings edits, and metadata-only document downloads.
- Real Supabase SSR client setup, session refresh, password sign-in/sign-out, server-side user/membership guards, active-organization enforcement, scoped production directories, editable company branding/settings, and a separate platform super-admin console. Full production workflow mutations remain a later integration pass.
- Nine migrations with 29 tables and a security-invoker membership compatibility view, UUIDs, timestamps, foreign keys, tenant-aware constraints, indexes, RLS policies, controlled writes, and occupancy consistency enforcement.
- Deterministic shared seed: three communities, 90 units, 78 residents/leases, and 235 simulated payments, plus leasing, maintenance, document, and community records.
- Mobile layouts, semantic controls, visible keyboard focus, contrast corrections, reduced-motion support, manifest, and app icons.

## Customer onboarding

Platform super admins can configure company branding, properties, units, invitation links, plans and feature switches at `/platform`. Customer sites at `/sites/[organizationSlug]` inherit their saved configuration. New organizations stay private until setup, website review and activation are complete. See [the customer onboarding guide](docs/new-customer-onboarding.md) and [current multi-tenant architecture](docs/multi-tenant-architecture.md).

## Organization architecture

Alder & Stone remains the first tenant. Production workspaces isolate organization data through server membership checks, scoped queries, PostgreSQL RLS and composite foreign keys. `/alder-stone` resolves to the authenticated workspace; `/platform` requires a separate platform super-admin membership. See [TENANCY.md](docs/TENANCY.md) for migrations, roles, onboarding, routing, validation and preserved-data details. The [MVP release audit](docs/MVP-RELEASE-AUDIT.md) passes 37 browser tests and includes a presentation runbook; hosted integration verification is still required before live-customer release.

## Management demo

Open [Owner](http://localhost:3000/demo/owner) for portfolio performance or [Property Manager](http://localhost:3000/demo/property-manager) for daily operations. Search records, open a community or resident, move a lead/application through its workflow, assign maintenance, and publish a building update. Switch to Resident in the same tab to see public maintenance updates, applicable announcements, and assigned documents. Team notes stay out of the resident interface. See the [management walkthrough](docs/MANAGEMENT-EXPERIENCE.md) for a short sales demonstration and the exact production boundaries.

## Resident demo

Open [the resident portal](http://localhost:3000/demo/resident) to try a simulated rent payment, create a repair with photos or video, and follow management updates through completion. Payment, request, profile, and contact changes stay in the current demo tab. Attachments stay in this browser’s IndexedDB and are removed when that tab’s demo is reset. No real payment or message is sent. Resident document downloads contain metadata only. See the [resident walkthrough and provider boundaries](docs/RESIDENT-EXPERIENCE.md).

## Public leasing persistence

The local demo uses PGlite PostgreSQL at `.local/leasing-db` (ignored by Git). The server applies pending migrations and inserts missing seed records on first use, preserving saved inquiries and existing settings. Requests create actual `leads` or `tour_requests` records; `leasing_intakes` preserves contact details and links to those records. They survive page reloads and server restarts. Keep one application process per local database directory. Set `PROPERTY_HUB_DEMO_DB_PATH` to choose another persistent directory.

Try a property → Apply or Schedule a tour → submit fictional details → **View in management demo**. New requests appear in `/demo/property-manager/leads` for the same browser. Requests in another browser are private. Existing seeded applicant demo flows remain separate from these public inquiries.

For a Vercel sales demo, use a **dedicated disposable Supabase demo project**, apply all migrations and the seed, and set `PROPERTY_HUB_LEASING_BACKEND=supabase-demo`, the URL, `SUPABASE_SECRET_KEY`, and the exact fictional `PROPERTY_HUB_DEMO_ORGANIZATION_ID` in `.env.example`. Never connect this demo intake adapter to a project with real customer data. The server refuses filesystem fallback on Vercel and returns a clear unavailable state until durable storage is configured. Secret keys remain server-only.

To use an external application service, set the community’s `application_mode` to `external` and `application_url` to its HTTPS URL. The form reads these settings from the database and offers an explicit handoff before collecting contact details. The database also rejects internal application inquiries for that community. Switching back to `internal` requires setting the URL to NULL.

See [public leasing implementation notes](docs/PUBLIC-LEASING.md) for security boundaries and the next production pass.

## Database setup

The nine migrations in `supabase/migrations` cover the foundation, public leasing, resident experience, management workflows, tenant/platform roles, and customer onboarding. The management migrations, `20260918043102_management_workflows.sql` and `20260918045756_document_assignment_access.sql`, provide private maintenance notes, revocable document assignments, building audiences, CRM contact/stage fields, application household metadata, and durable public-intake activity events. Legacy document recipients are migrated to the assignment table so revoking access works consistently. New documents default to staff-only access. Existing data is preserved. Demo rows live in `supabase/seed.sql` and are generated from `src/lib/demo/data.ts`. All nine migrations are installed in the hosted demo database; the deployment pass added no new schema migration.

For a **disposable local development database**, install Docker, then:

```sh
pnpm exec supabase start
pnpm exec supabase db reset --local
```

The reset command recreates the local database; do not use it against a database with records you need to preserve. The seed is for local/demo projects and does not create sign-in passwords.

Copy `.env.example` to `.env.local`, then fill in your project's public URL and publishable key. Real accounts need an `auth.users` identity, a matching public user profile, and a server-provisioned organization membership. Live access is available at `/workspace`. The app deliberately does not silently promote a signed-in account to owner.

No live Supabase database was changed or deployed during this implementation. See [architecture and access policies](docs/ARCHITECTURE.md) before wiring up production mutations or Storage.

## Quality checks

```sh
pnpm lint
pnpm typecheck
pnpm db:test
pnpm build
```

`pnpm db:test` uses local PostgreSQL via PGlite; it does not require Docker or external credentials. It runs the real migration and RLS policies with a small Supabase Auth shim.

For browser tests, keep the dev server running in another terminal:

```sh
pnpm exec playwright install chromium
pnpm test:e2e
```

You can instead set `PLAYWRIGHT_CHROME_PATH` to an installed Chrome executable. Set `TEST_BASE_URL` to test another local URL.

Generate the seed and structural table types after schema changes:

```sh
pnpm db:seed:generate
pnpm db:types
```

After connecting actual Supabase, its full type generator can include PostgREST relationships:

```sh
pnpm exec supabase gen types --local --lang typescript --schema public > src/lib/database.types.ts
```

## Project map

| Path                        | Purpose                                                       |
| --------------------------- | ------------------------------------------------------------- |
| `src/app/(public)`          | Public marketplace and sign-in                                |
| `src/app/demo`              | Explicit fictional demo routes                                |
| `src/app/workspace`         | Authenticated organization entry points                       |
| `src/components`            | Shared shells and domain UI                                   |
| `src/components/ui`         | shadcn/ui component sources                                   |
| `src/lib/demo`              | Deterministic fixtures, validated tab state, shared selectors |
| `src/lib/supabase`          | Typed browser/server clients                                  |
| `src/lib/auth.ts`           | Server-only authorization guards                              |
| `supabase`                  | Migration, seed, local configuration                          |
| `scripts/check-database.ts` | PostgreSQL tenant/security/integrity checks                   |
| `tests`                     | Browser workflows and mobile accessibility                    |
| `docs/ARCHITECTURE.md`      | Boundaries, role matrix, data model, and next-pass work       |

## Limits of this foundation

The hosted sales demo is live. Demo maintenance, payments, attachments, and persona changes remain browser-local; public leasing inquiries persist in Supabase. Authenticated organization onboarding and workspaces require provisioned accounts and memberships. The first real platform administrator and production email delivery still need setup. Real payment processing, screening, live scheduling, notifications, complete production resident/management workflows, and offline service-worker behavior remain next-pass work. See [deployment boundaries](docs/DEPLOYMENT.md) and [architecture](docs/ARCHITECTURE.md).

Apartment photography is illustrative, downloaded from [Unsplash Images](https://images.unsplash.com), and is not a photograph of a real community represented by the demo names. Fonts are DM Sans and Manrope (bundled through Fontsource). shadcn/ui components are included as editable source.
