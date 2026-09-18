# Property Hub verification

## MVP release audit — September 18, 2026

The requested end-to-end audit is now complete. **37 browser tests, 212 PostgreSQL checks and 9 application policy/schema tests pass.** A fresh scan of 39 screens at four widths (156 combinations) found no page overflow, detected broken images, page errors or axe WCAG A/AA violations. Lint, TypeScript and the production Webpack build passed.

Fixed mobile management heading/action overflow and keyboard focus restoration after demo reset confirmation. Added four release regression tests. See [the release audit and presentation runbook](MVP-RELEASE-AUDIT.md) for the workflow matrix, screenshots and live-customer limitations. Deferral statements below describe earlier passes and are superseded for the local sales demo; hosted Supabase integration remains unverified.

## Customer onboarding pass — September 18, 2026

- Added organization setup/checklist, private customer preview, runtime branded websites, private marketing uploads, one-time verified-email staff invitations, plan defaults and effective feature controls.
- Applied migration `20260918063640_customer_onboarding.sql` to the saved local demo after backup. All existing business records and tenant identities across the original 27 tables passed the before/after comparison; see [migration report](local-onboarding-migration.json).
- 212 PostgreSQL checks and 9 application policy/schema tests passed. The separate Harborline fixture covers branding, private records, staff invitations, publication, public inquiry isolation, flags and Storage policy behavior.
- ESLint, strict TypeScript and the production Webpack build passed.
- Hosted Supabase Auth email and actual Storage transfers are not configured or verified here. Local tests emulate Auth and the Storage schema while executing the actual SQL policies.
- Final end-to-end/browser testing remains deliberately deferred.

See [customer onboarding](new-customer-onboarding.md) and [current multi-tenant architecture](multi-tenant-architecture.md). Older results below describe earlier passes.

## Current architecture pass — September 18, 2026

| Check                              | Result                                                                                                                 |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Additive local migrations          | Applied both new migrations after backup; all original records in 23 tables verified unchanged                         |
| PostgreSQL RLS / integrity suite   | 164 assertions passed                                                                                                  |
| Application policy unit tests      | 7 tests passed                                                                                                         |
| ESLint                             | Passed with zero warnings                                                                                              |
| TypeScript / route checks          | Passed                                                                                                                 |
| Production build                   | Passed with `pnpm build --webpack`; 58 generated pages plus dynamic organization/platform routes                       |
| Default Turbopack build            | Local sandbox prevented the compiler process from binding its internal port; no application compile error was reported |
| Final browser / end-to-end suite   | Intentionally deferred at the user’s request                                                                           |
| Hosted Supabase / Auth integration | Not configured or migrated in this pass; local tests emulate Auth identity                                             |

See [TENANCY.md](TENANCY.md) and [the local migration report](local-tenant-migration.json). The schema now has eight migrations, 27 base tables and one membership compatibility view. Production workspace and platform pages require real Supabase authentication; the local demo persona switcher cannot grant those permissions.

The design changes made before this architecture pass remain in place; final responsive and browser regression checks have not been rerun. Existing browser tests were updated to confirm the two-step demo reset.

## Prior sales-demo verification (before the architecture and design changes)

The sales demo pass adds the guided launcher, five-persona controls, linked story, contextual hints, and scoped reset while preserving public leasing, resident, and management workflows. The complete suite was run against the optimized production server on September 18, 2026.

| Check                                                                                    | Result                                                                                                                                                                        |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Next.js production build                                                                 | Passed; 58 generated pages, dynamic leasing API/forms and protected workspace routes                                                                                          |
| ESLint with zero warnings allowed                                                        | Passed                                                                                                                                                                        |
| Strict TypeScript and Next.js route types                                                | Passed                                                                                                                                                                        |
| PostgreSQL migration, seed repeatability, tenant authorization, and relational integrity | 88 checks passed                                                                                                                                                              |
| Browser coverage                                                                         | 33 tests across foundation, leasing, resident, management, and sales-demo suites                                                                                              |
| Existing route coverage                                                                  | 52 public/demo navigation routes, including the launcher, load without browser page errors                                                                                    |
| Public leasing accessibility                                                             | Homepage, search, property detail, availability, application inquiry and tour pages checked at 390px and 768px with WCAG A/AA axe checks                                      |
| Existing mobile accessibility                                                            | Eight foundation routes retained passing checks                                                                                                                               |
| Resident layouts and accessibility                                                       | Eleven resident screens checked at 390px, 768px, and 1440px without overflow; WCAG A/AA axe checks pass on all eleven at phone width                                          |
| Production browser verification                                                          | All 33 tests, including five new sales-demo tests, pass against the optimized production server                                                                               |
| Simulated payment                                                                        | Receipt reload, zero balance, fictional method, single receipt, keyboard focus, and no external requests verified                                                             |
| Maintenance                                                                              | Photo and actual WebM video previews survive reload; manager scheduling and maintenance status changes appear on the resident timeline; reset removes stored attachment blobs |
| Resident contact and documents                                                           | Preferences persist; messages reach the management demo inbox; document downloads contain metadata only; lease and announcements are populated                                |
| Resident permissions                                                                     | Cross-resident edits, identity changes, unauthorized scheduling, forged status events, and unauthorized attachment metadata are rejected by PostgreSQL                        |
| Management workflows                                                                     | Ten metrics reconcile; property/resident details, CRM/application changes, assignment, private notes, building audiences, revocable document access, and activity verified    |
| Management accessibility                                                                 | Twelve screens at 390px, 768px, and 1440px without page overflow; phone screens and main editing forms pass WCAG A/AA axe checks                                              |
| Management permissions                                                                   | Internal notes and other residents’ documents stay private; legacy recipient migration and access revocation pass; staff has no financial access or manager workflow writes   |
| Gallery                                                                                  | Opens, advances with keyboard arrows, and closes with Escape                                                                                                                  |
| Persistence                                                                              | An actual lead/intake survived a full server restart from development into the production build                                                                               |
| Intake privacy                                                                           | Same-browser requests readable; a separate browser session receives none                                                                                                      |
| Validation                                                                               | Cross-tenant/property selections, occupied units, bad dates, invalid occupants, honeypots, unexpected fields, oversize input and cross-origin submissions rejected            |
| Retry behavior                                                                           | Duplicate keys do not duplicate records; failed saves preserve form details and can be retried                                                                                |
| External application provider                                                            | Configured provider renders an explicit handoff; database refuses internal inquiries for that property                                                                        |
| Persona isolation                                                                        | All five personas switch without login and cannot authorize protected production routes                                                                                       |
| Guided sales story                                                                       | Applicant tour and application → manager review → resident photo repair → assignment → maintenance status → resident timeline → owner metrics; all nine milestones persist    |
| Selected apartment handoff                                                               | Choosing a different community preserves its property and unit through the tour, linked lead, and application                                                                 |
| Scoped reset                                                                             | Seeded metrics and story restored; local attachment blobs removed; earlier inquiries hidden only in this tab; database records, cookies, and another tab’s state preserved    |
| Sales demo accessibility                                                                 | Launcher and all five persona controls/drawers checked at 390px, 768px, and 1440px with WCAG A/AA axe, overflow, keyboard dismissal, and focus-return checks                  |

The PostgreSQL checks execute the real migrations and RLS policies in PGlite, including a second organization and multiple roles. Supabase Auth is emulated. Hosted Auth, PostgREST, Storage, and project advisors still need verification after a dedicated Supabase project is connected. No hosted database or Vercel deployment was modified.

The production build is also exercised in the browser. The local storage adapter uses the same schema and transaction RPC as the Supabase adapter; the hosted adapter is implemented but not integration-tested against a configured project.

## Preview images

- [Sales demo launcher, desktop](screenshots/sales-launcher-desktop.png)
- [Applicant story entry, phone](screenshots/sales-applicant-mobile.png)
- [Guided story drawer, phone](screenshots/sales-guide-mobile.png)
- [Public homepage, desktop](screenshots/leasing-home-desktop.png)
- [Public homepage, phone](screenshots/leasing-home-mobile.png)
- [Property gallery, desktop](screenshots/leasing-property-desktop.png)
- [Property detail, phone](screenshots/leasing-property-mobile.png)
- [Application inquiry, phone](screenshots/leasing-apply-mobile.png)
- [Owner portfolio dashboard](screenshots/owner-dashboard-v2.png)
- [Management maintenance queue, phone](screenshots/management-maintenance-mobile.png)
- [Management maintenance detail, phone](screenshots/management-request-mobile.png)
- [Resident home, phone](screenshots/resident-home-mobile-v2.png)
- [Resident home, desktop](screenshots/resident-home-desktop-v2.png)
- [Maintenance request, phone](screenshots/resident-request-mobile.png)
- [Maintenance timeline, phone](screenshots/resident-timeline-mobile.png)
- [Simulated rent review, phone](screenshots/resident-payment-mobile.png)

See [public leasing notes](PUBLIC-LEASING.md) for the demonstration walkthrough and remaining production integrations.

Start with the [sales demo walkthrough](SALES-DEMO.md) for the complete connected presentation and reset semantics. This pass changed no database schema or production authorization policies; all six migrations, 23 tables, and the existing saved leasing records are preserved.

See the [resident demo walkthrough](RESIDENT-EXPERIENCE.md) for the new flows, schema changes, and production integration boundaries. The existing persistent local PostgreSQL database was inspected after the upgrade: all six migrations are recorded, existing leasing intakes remain, and the resident fixtures and migrated document assignment are present. See the [management walkthrough](MANAGEMENT-EXPERIENCE.md) for this pass’s workflows, metric definitions, and production boundaries.
