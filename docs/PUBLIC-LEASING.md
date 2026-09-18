# Public leasing implementation

The second implementation pass preserves the existing Property Hub shells, role switcher, multi-tenant schema, and fictional Alder & Stone Living portfolio. Public pages now form a complete demonstration path from search to a saved leasing inquiry.

## Demonstration walkthrough

1. Open `/`. The hero uses “Find a Place That Feels Like Home,” with Browse Properties and Schedule a Tour actions, neighborhood search, featured communities and apartments, amenity benefits, three leasing steps, a resident portal preview, and an owner/manager CTA.
2. Browse `/properties`. Combine bedrooms, minimum bathrooms, minimum/maximum base rent, availability, and multiple amenities. All unit criteria must match the same unit. Search also matches community name, city, and neighborhood. Sort by lowest matching rent or reset to the featured order.
3. Open a community. Explore its three-photo gallery with keyboard controls, overview, amenities, available apartments, illustrative floor plans, neighborhood illustration, pet/parking/utility/laundry details, and leasing contact card.
4. Choose Apply or Schedule a tour from an apartment or floor plan. The selected community/home carries into the form and can be changed. Choosing another community clears the old home selection.
5. Submit fictional contact information. Application inquiries collect first/last name, email, phone, preferred move-in, community, unit/floor plan, occupants, pets, and an optional message. Tours collect community, optional home, name, email, phone, date, Central Time preference, and notes. Success screens include a reference and clearly distinguish a request from a reservation or confirmation.
6. Open **View in management demo**. The Leads page includes a saved-request inbox with both inquiry types, expandable contact/preferences, and refresh. Records remain after navigation, refresh, and restarting the app.

## Data and authorization

Migration `20260918030456_public_leasing_intake.sql` adds:

- `leasing_intakes`: UUIDs, organization/property/unit/floor-plan scope, kind, browser session/request UUIDs, validated contact/preferences JSON, linked lead/tour IDs, timestamps, indexes, composite foreign keys, and RLS.
- Application provider settings on `properties`: internal or external, with HTTPS URL constraints.
- Guest support on `tour_requests`: nullable user and unit references. Existing member/RLS policies remain intact.
- `submit_leasing_intake`: a transactionally atomic, invoker-rights RPC, executable only by the trusted server role. It checks current published inventory and provider mode, writes either a lead or a tour, links an intake, serializes retry keys, and limits each browser session to 20 new requests per hour. Tours use the `America/Chicago` time zone when converting to UTC.

`POST /api/leasing` validates a strict discriminated Zod schema before invoking the repository. Unknown fields, mismatched properties/units/plans, occupied units, invalid dates/contact details, Sunday tour requests, early move-ins, oversized messages, honeypot values, and cross-origin submissions are rejected. A client cannot choose the organization or intake session through the form.

The local repository uses persistent PGlite PostgreSQL under `.local/leasing-db`; it applies the same migrations and seed as Supabase. Run one app process per local database directory. The server-only Supabase repository supports a dedicated seeded **demo** project. No live project was configured or modified in this pass. The Vercel environment never uses filesystem persistence as a fallback.

The demo repository is fixed to the fictional organization. A random HttpOnly, SameSite=Strict cookie additionally scopes browser reads and expires after seven days. Requests from another browser are not shown. Demo role switching has no production authority. Owners/managers/staff with actual database membership may read their organization's intake records through RLS; residents, applicants, maintenance, and unrelated organizations cannot. Anonymous clients have neither direct table access nor RPC execution rights.

The browser cookie's expiry does not delete database rows. The existing Reset demo action clears operational tab state only; it intentionally preserves leasing inquiries. Use fictional information for demonstrations. Retention and deletion controls are part of the live-service pass.

## Provider strategy

Each community defaults to Property Hub's internal inquiry form. The UI reads provider settings from the database. Set `application_mode='external'` and an HTTPS `application_url` to use an existing provider; the inquiry form becomes an explicit external handoff and does not pass contact details in the URL. The database also rejects internal inquiries while that mode is active. Set `application_mode='internal'` and `application_url=NULL` to restore Property Hub intake.

This is an application **lead** flow. It does not collect income, identity documents, social security numbers, screening consent, or background-check information. The original seeded applicant portal remains a separate operational demonstration; public Apply links use the new nonsensitive inquiry flow.

## Next production pass

- Connect and verify a dedicated Supabase project with hosted Auth/PostgREST and two real test organizations. Replace the fixed demo catalog with a reviewed published inventory query and trusted tenant/domain resolution.
- Add authenticated management actions for lead follow-up, stage changes, application conversion, tour confirmation/cancellation, calendar conflicts, and auditing.
- Add approved email/SMS delivery, per-tenant contact settings, and configurable tour windows. This pass saves requests and sends no messages.
- Replace the fixed September 2026 demo calendar with a tenant-local current clock for live service.
- Add distributed abuse controls, tenant-specific consent/privacy/retention settings, request deletion, and production monitoring. The per-session database quota is a demo safeguard, not comprehensive public-endpoint abuse protection.
- Add full rental application modules or external provider integrations, according to customer settings. Screening and payments remain separate future work.

## Photography

All communities, addresses, contacts, prices, and policies are fictional. Photography and SVG floor-plan layouts are illustrative, not actual unit documentation. Existing local photography was preserved. Two additional locally served Unsplash images support the galleries: [kitchen](https://images.unsplash.com/photo-1556912172-45b7abe8b7e1) and [bedroom](https://images.unsplash.com/photo-1505693416388-ac5ce068fe85).
