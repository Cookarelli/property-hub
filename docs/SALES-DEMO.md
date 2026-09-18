# Property Hub sales demonstration

Open **[Start Demo](http://127.0.0.1:3000/demo)**. The public website also includes a Start Demo link. The launcher offers four populated experiences and a guided story; maintenance is available from the launcher and every persona selector.

The visible **Demo: Viewing as [Persona]** control changes the dashboard, navigation, and available tools without signing in. Everyone belongs to the fictional **Alder & Stone Living** organization: three communities, 90 apartments, and 78 occupied homes. All operational changes are shared between personas in the current tab.

## The connected story

Use **Start the guided story**, then **Demo guide → Continue the story** to move between perspectives. The guide tracks nine moments and survives refresh. You can also jump directly to any moment. Contextual hints can be hidden without losing progress.

1. **Discover as Sofia Martinez.** The applicant landing page features The Mercer **B-302**, an available two-bedroom, two-bath apartment with 1,120 square feet at **$2,500/month**. Choose **Tour this two-bedroom**. Other available apartments can also be selected; the chosen property and unit follow the inquiry.
2. **Request a tour.** Choose a day and preferred time, then select **Request demo tour**. This is a request, not a confirmed booking. Continue to **Your application**.
3. **Send a basic application.** Use the populated fictional contact details, move-in date, occupants, and pet information. Check the demo acknowledgment and submit. No sensitive screening details or application fee are collected.
4. **Review as the manager.** Select **See it as the manager** to find Sofia’s submitted application, selected apartment, and contact information. The Leads screen also shows her linked lead and the tour request. Stage changes remain visible when returning to the applicant experience.
5. **Request a repair as Alex.** The guide opens the resident request form. **Use sample request & photo** fills a cabinet-hinge issue and adds an illustrative kitchen photo. Review access permission and submit. You may instead attach your own demo image or video.
6. **Assign as the property manager.** Continue through the guide, open the new repair, and assign **Marcus Reed**. The manager can inspect the attachment, access preferences, and timeline, or add a resident-visible update. Internal notes remain outside the resident timeline.
7. **Start work as maintenance.** Marcus’s landing page defaults to **My assignments**, including the new repair. Open it and choose **Start work**. **Team queue** offers the broader maintenance queue without exposing financial or application tools.
8. **See the update as Alex.** Continue to the resident’s request. It now shows **In Progress**, Marcus’s name, the image, and the updated visual timeline.
9. **Finish as the owner.** Portfolio metrics and recent activity reflect the new application, lead, tour, and repair. The guide reaches **9 of 9** moments explored. Marking the repair completed also updates the owner’s open-work count.

Resident payments, documents, lease details, community announcements, and management records remain available for free exploration. Payments are simulated; document downloads contain demo metadata only.

## Reset for the next presentation

Choose **Demo guide → Reset demo data**, or use Reset on the launcher. The existing account-menu reset remains available.

- Restores the known fictional fixtures by removing this tab’s operational edits, receipts, newly submitted repairs, assignments, announcements, application/tour changes, and guide progress.
- Removes attachment blobs referenced by this tab’s new repairs from browser storage.
- Hides older public website inquiries in this tab’s demo views using a reset timestamp. A new website inquiry after reset appears normally.
- Preserves actual saved leasing database records, browser-session cookies, other tabs’ independent state, production accounts, and production organizations.

Reset is a presentation reset, not a database deletion command. Operational demo state uses session storage; a newly opened tab starts independently. Public website inquiries still use the existing persistent PostgreSQL adapter and browser-session privacy boundary.

## Implementation and authorization

`src/lib/demo/story.ts` centralizes the fictional identities, selected-home fallback, linked repair, and story milestones. Reusable controls and the launcher live in `src/components/demo`. The existing validated store and shared selectors connect the story to management metrics, CRM, activity, resident timelines, and maintenance assignments.

The demo URL controls presentation only. It does not authenticate, issue tokens, change organization memberships, or authorize production requests. Protected `/workspace` routes continue to require server-verified Supabase identity and membership. Production organization isolation remains enforced independently by PostgreSQL RLS.

**No database migrations or schema changes were required in this pass.** The existing six migrations, 23 tables, and deterministic fixtures are preserved. No hosted Supabase project or deployment was changed.

See [verification results](VERIFICATION.md) for browser, build, type, lint, and database checks. The next production pass still needs authenticated domain mutations, hosted Supabase integration checks, private file storage, real notification delivery, payment/scheduling providers, and deployment. These demo flows deliberately remain separate from real customer transactions.
