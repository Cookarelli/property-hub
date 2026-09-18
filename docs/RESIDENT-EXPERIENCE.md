# Resident experience

Open [the resident demo](http://127.0.0.1:3000/demo/resident), or choose **Resident** in the global demo switcher. No login is needed. The populated persona is Alex Rivera at The Mercer, apartment A-101.

## Demonstration walkthrough

1. **Home:** Review the $1,550 October rent charge, October 1 due date, active repair, community news, important documents, and October 31 lease expiration. Large quick actions lead to rent, maintenance, lease, and contact.
2. **Payments:** Choose Pay rent, select a fictional checking account or debit card, and confirm a simulated payment. A receipt appears, the balance becomes zero, and October joins three months of paid history. Reloading keeps the receipt without creating another charge or payment. No money moves or credentials are collected.
3. **Maintenance:** Open the active request or view two completed repairs. Create a request with any of nine categories, urgency, photos or video, entry permission, pet details, preferred access, and contact preference. The new detail page includes the four-stage progress indicator, timestamped timeline, and attachments.
4. **Management update:** Switch to Property Manager, open Maintenance, and view the new request. Choose Scheduled, enter a visit time and a message, and post the update. Switch to Maintenance to start and complete work. Switch back to Resident to see the same updates and author names on the timeline.
5. **Documents and lease:** Browse six document entries, including Lease Agreement, Community Rules, Move-in checklist, Parking Policy, and Pet Policy. Downloads contain metadata only, with an explicit statement that no agreement or policy is attached. The separate Lease page shows fictional dates, rent, deposit, occupant, and renewal information.
6. **Announcements:** See parking work, a seasonal HVAC reminder, office closure, a community gathering, and other community information. Filter by category. Management demo announcements appear in the resident feed.
7. **Profile and contact:** Edit contact information and notification preferences. Save a fictional message through Contact; it appears in the same tab’s Property Manager → Residents inbox. No email, SMS, or emergency dispatch occurs.

Phone navigation prioritizes **Home, Payments, Maintenance, Documents, Profile**. Announcements, Lease, and Contact remain available through the mobile menu; all eight destinations appear in the desktop navigation. Notifications, account controls, and the persona switcher are shared throughout the resident experience.

## Persistence and provider boundaries

Resident receipts, requests, events, contact preferences, and messages use the existing validated, tab-scoped demo store. Reloading and switching personas retain them; Reset demo clears them. No demo state is an authorization credential, and none of these actions writes to a live payment provider or production tenant.

Photos and videos use the `AttachmentProvider` abstraction with an IndexedDB demo implementation. Only metadata lives in session storage. The adapter accepts JPG/PNG/WebP (10 MB each) and MP4/WebM/MOV (20 MB each), at most five files and 25 MB combined. Files stay in this browser. Transaction failure rolls back the file save; missing/unsupported previews have recovery text and available files can be downloaded. Reset demo removes files referenced by that tab. Browser storage is temporary demo storage; closed-tab orphan cleanup and hosted retention are future work.

The `PaymentProvider` abstraction resolves an invoice ID rather than accepting a client-selected amount. Its result distinguishes a simulated receipt from a future hosted checkout handoff. The resident demo uses only the simulator and rejects a hosted result. A real adapter must resolve tenant/resident ownership and the amount on the server, then reconcile payment state through authenticated provider webhooks. Financial credentials and actual payment-method collection are outside this pass.

The existing public leasing adapter remains separate: public inquiries and tours persist in local PostgreSQL or a dedicated configured Supabase demo project. Resident Reset demo does not remove those records.

## Schema changes

- `20260918034429_resident_experience.sql`: adds Scheduled maintenance status, pets, preferred access, contact preference, confirmed visit time, timeline event status/time, video attachment metadata, lease renewal status, and resident notification preferences. Adds a timeline index and restricts resident-authored status events.
- `20260918041644_resident_preference_guards.sql`: limits resident profile edits to contact preferences while preserving authorized management editing; prevents identity/linkage changes and resident-confirmed appointments. The additive migration also upgrades an existing local demo database safely.
- The schema still has **21 tables**, with tenant-aware foreign keys and RLS preserved.
- Expanded shared fixtures and generated SQL contain **235 simulated payment records**, including Alex’s upcoming charge; 12 repair requests with Alex’s active request and two completed repairs; six document entries and six portfolio announcements.

All migrations are local files. No hosted Supabase project was modified. PostgreSQL tests execute the real migrations and policies with an emulated Auth identity.

## Next production pass

Connect resident queries and mutations to authenticated Supabase users and memberships; add a server-owned contact-message store and delivery. Configure private Storage buckets, authorized upload/download endpoints, malware/content validation, retention, and cleanup. Integrate a selected payment provider with idempotent webhooks and ledger reconciliation. Add actual document files supplied by management, real appointment availability, notification delivery, and renewal workflows. These integrations must retain the separate demo boundary.
