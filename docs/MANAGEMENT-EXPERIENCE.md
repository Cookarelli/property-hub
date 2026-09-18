# Property Hub management experience

The Owner and Property Manager demos now provide complete, populated portfolio and operational workflows. Existing public leasing, resident screens, shared components, authentication boundaries, and saved leasing records are preserved.

## A five-minute demonstration

1. Open `/demo/owner`. Review the ten portfolio metrics, occupancy, maintenance status, application pipeline, September rent, community comparison, and recent activity. Select The Mercer to scope the dashboard; metric links open the relevant community records.
2. Switch to **Property Manager**. Open Properties → The Mercer. Explore Overview, Units, Residents, Maintenance, Applications, Documents, and Announcements. Unit inventory supports property, building, bedrooms, occupancy, and text filters.
3. Open Residents and search **Alex Rivera**. Review the active lease, four payment records, maintenance history, document access, and contact information. Resident demo messages remain available in the directory inbox.
4. Open Leads. Move a fictional prospect from New to Contacted or Tour Scheduled. Applications has separate Started, Submitted, Under Review, Approved, Denied, and Withdrawn stages. These stages are demo workflow records: approving an application or marking a lead Leased does not create a lease or change occupancy.
5. Open Maintenance → **Kitchen faucet is leaking**. Assign Marcus Reed, save an internal note, schedule a visit, and post an update for the resident. Switch to **Resident** and open the request: the public update and appointment appear, while the internal note does not. Switch to Maintenance to start and complete the work.
6. Publish an announcement for The Mercer, Building A. Alex receives it; a Building B or Juniper Park announcement does not appear in Alex’s feed. Organization announcements reach all demo residents.
7. Add document metadata, choose **Assigned residents only**, and select Alex. Switch to Resident to see it. Remove the assignment to remove access. Downloads contain metadata only; no agreement or legal document is generated.
8. Open Owner → Activity. Application submissions, tour requests, maintenance submissions/status updates, simulated payments, announcements, and CRM/application stage changes are recorded. Activity can be filtered by type. Public leasing requests saved in this browser also appear.

Use the account menu’s **Reset demo** to clear operational changes and the tab’s referenced photo/video attachments. Saved public leasing requests use separate database persistence and are retained.

## Portfolio definitions

The fixed demo reporting date is September 17, 2026.

| Metric                     | Initial value | Definition                                                         |
| -------------------------- | ------------: | ------------------------------------------------------------------ |
| Total units                |            90 | All three communities’ inventory                                   |
| Occupied units             |            78 | Units with active leases and linked residents                      |
| Vacant units               |            12 | Nine available homes plus three in turnover                        |
| Occupancy                  |         86.7% | Occupied units divided by all units                                |
| Monthly scheduled rent     |      $165,825 | Total monthly rent from active leases                              |
| Outstanding rent           |       $17,725 | Unpaid rent charges due by September 17                            |
| Open maintenance           |             8 | Submitted, Scheduled, or In Progress                               |
| Pending applications       |             5 | Started, Submitted, or Under Review                                |
| Upcoming lease expirations |             9 | Active leases ending in the next 60 days                           |
| New leads                  |             2 | Seeded New leads; same-browser website inquiries add to this count |

September’s rent chart shows $148,100 paid, $8,575 pending, and $9,150 overdue. Alex’s upcoming October payment is shown in the resident ledger; simulating it updates the resident account and activity without changing September’s chart. All money is fictional.

## Routes and components

- `/demo/owner` and `/demo/property-manager`: portfolio and operations landing pages.
- Twelve management sections: Dashboard, Properties, Units, Residents, Leads, Applications, Maintenance, Documents, Announcements, Analytics, Activity, Settings.
- `/demo/{persona}/properties/{slug}/{section?}`: scoped community records with seven sections for managers and four operational sections for maintenance.
- `/demo/{persona}/residents/{id}/{section?}`: Profile, Lease, Payment history, Maintenance history, Documents.
- `/demo/maintenance`: a populated work queue, active/scheduled/urgent counts, assignment, timelines, and private notes. Financial tools, applications, resident directory, and document library are excluded.
- `src/components/management`: reusable dashboard, tables/filters, record views, leasing workflow, repair queue, and communications components.
- `src/lib/management`: shared schemas, selectors, metrics, and presentation capability definitions. Production permissions remain server membership and RLS decisions.

Staff remains a supported organization role with operational reads, internal-note reads, no payment access, and no manager workflow writes. It is not an additional sales persona; the requested five-persona switcher is preserved. The full authenticated staff workspace is part of the production integration pass.

## Database changes

Two new migrations bring the schema to six migrations and 23 tables:

- `20260918043102_management_workflows.sql` adds the seven lead stages, lead contact/unit/move fields, application contact/household fields, property/building audiences, document visibility, `document_assignments`, and `maintenance_internal_notes`. It adds tenant-aware foreign keys, indexes, RLS, and activity property/related-record references. A trusted intake trigger records public leasing activity once, including idempotent retries. Existing income data is preserved as a nullable legacy column; this pass collects no income, SSN, bank, credit, or screening information.
- `20260918045756_document_assignment_access.sql` migrates legacy direct document recipients into the assignment table, preserves their access without inventing authorship, and removes the old access bypass. All individual recipient access is now revocable through assignments. New documents default to staff-only access.

The shared seed and generated database types are updated. The local persistent database was upgraded without deleting its saved leasing inquiries or existing community settings. No hosted Supabase project was modified.

## Persistence and authorization

Management workflow edits are validated **demo tab state**, shared instantly across personas in that tab. Internal notes are omitted from resident rendering and activity; the entire fictional demo state remains inspectable in the browser. This is a sales demonstration, not a real user authorization boundary.

Production RLS independently enforces organization isolation, private internal notes, building audiences, recipient ownership, assignment authorship, and revocation. Demo role switching cannot grant production access. Public application/tour intake remains the existing database-backed, browser-session-private flow. The activity feed distinguishes public application inquiries from rental applications.

## Verification and remaining integration

Build, lint, and strict type checks pass. The subsequent sales demo pass brings the suite to **33 browser tests**, all passing on the production build, including seven management tests, leasing/resident flows, persona restrictions, persistence, assignment removal, activity, and the connected sales story. Twelve management screens are checked at 390, 768, and 1440 pixels; phone pages and the main editing forms pass automated WCAG A/AA checks. **88 PostgreSQL checks** cover real RLS execution, tenant isolation, upgrades, repeatable seeds, assignment revocation, and intake activity idempotency. Start with the [guided sales demo](SALES-DEMO.md) for the complete presentation.

Next: connect authenticated management mutations and the staff workspace to Supabase; add real property/resident editing and transactional lease operations; implement private Storage uploads/downloads and notification delivery; connect chosen payment and scheduling providers. Hosted Auth/PostgREST/Storage integration, production monitoring, and deployment remain unconfigured. Payments, application decisions, contact messages, and operational demo changes do not perform real-world transactions.
