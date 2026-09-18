# Property Hub MVP release audit

Audited September 18, 2026 against the optimized local production build at `http://127.0.0.1:3000` using desktop Chrome and responsive viewports.

## Release decision

**Ready for the fictional Alder & Stone sales demonstration.** Every requested public, management, resident, maintenance and persona-switching workflow passed after the fixes below. This is not approval to onboard live residents or process real payments. Hosted authentication, Storage transfers and production operational workflows still need staging integration and verification.

## Workflow results

| Journey | Result and evidence |
| --- | --- |
| Home → Properties → The Mercer → available B-302 → Schedule Tour | Passed through actual links and form submission. Apartment selection survived navigation. The saved request appeared in the manager's lead inbox with the requested date/time and contact information. Confirmation correctly says the time still requires confirmation. |
| Home → available B-304 → Apply → submit basic information | Passed. Selected home, occupants and pet information were preserved. The application inquiry appeared in management and survived reload. This creates a leasing lead/intake, not a screened rental application. |
| Manager → Leads → applicant information | Passed. Contact/home details open correctly; CRM stage edits persist. Public inquiries remain private to the originating browser demo session. |
| Manager → Applications | Passed. Submitted applicant information opens, status changes persist, and no sensitive screening information is collected. |
| Manager → Maintenance → request → assignment → status | Passed. Managers can assign Marcus Reed and update progress. Internal notes stay outside the resident timeline. |
| Resident → Maintenance → request with attachment → status | Passed. Real file-input photo upload, sample photo, video persistence, invalid-file rejection, access details and timeline updates were exercised. |
| Maintenance → assigned request → update status | Passed. Assigned work is visible in the maintenance queue; status and public updates return to the resident, including scheduled, in-progress and completed states. |
| Resident → Payments → simulated payment | Passed. One receipt is created, balance settles, and history survives reload. The UI says no real money moved; the test observed no external payment request. |
| Resident → Documents | Passed. Metadata placeholders download usable demo information; no fake legal agreement is generated. Assignment and revocation were also checked. |
| Start Demo → all five personas | Passed. Guided story, populated dashboards, role-specific navigation, scoped data and progress survive persona changes. Demo controls do not authorize production routes. |
| Desktop navigation and 375px mobile menus | Passed. Every navigation entry for Owner, Property Manager, Maintenance, Resident and Applicant was clicked and its destination checked. |
| Reset demo | Passed. Confirmation, cancellation, keyboard focus, guide progress, local attachment cleanup and isolation from another tab were checked. Durable database records are retained. |

## Issues found and fixed

1. **Mobile management heading overflow.** An older 35px icon-button rule conflicted with visible action text. The shared mobile heading now wraps, and actions keep their readable labels and touch size. The initial three failed browser checks all passed after this fix.
2. **Reset confirmation lost keyboard focus.** Canceling the dialog left focus on the document body. Closing now returns focus to the launcher/guide reset button or the resident/management account button. Regression coverage checks every entry point and verifies cancellation preserves state.

The new navigation tests were corrected to account for visible unread-count badges in accessible link names; no working navigation was changed to accommodate the tests.

## Final verification

| Check | Result |
| --- | --- |
| Full Playwright browser suite | **37 passed**, including four new release-audit tests |
| Responsive/accessibility scan | **156 passed**: 39 screens at 375, 768, 1280 and 1920px |
| Scan findings | Zero page overflow, WCAG A/AA axe violations, detected broken images or page errors |
| Database/RLS/integrity suite | **212 passed**, executing PostgreSQL policies with emulated Auth identities |
| Application policy/schema tests | **9 passed** |
| ESLint | Passed, zero warnings |
| TypeScript and route types | Passed |
| Production build | Passed with `pnpm build --webpack`; 59 generated pages plus dynamic routes |
| Local server/browser logs | No runtime errors observed in the audited flows |

Webpack was used because the local sandbox previously blocked Turbopack's internal port binding. Browser tests ran against the built application, not a mocked UI. Automated accessibility checks are useful coverage, not a full assistive-technology certification. Native Safari/Firefox and physical phones were not tested.

### Evidence

- [Structured 156-screen results](release-audit/report.json)
- [Mobile resident dashboard](release-audit/375-demo-resident.png)
- [Mobile owner dashboard after the fix](release-audit/375-demo-owner.png)
- [Desktop owner dashboard](release-audit/1280-demo-owner.png)
- [Property discovery](release-audit/1280-properties.png)
- [Mobile property details](release-audit/375-properties-the-mercer.png)
- [Saved public tour in management](release-audit/manager-tour-inbox.png)
- [Submitted resident repair with photo](release-audit/resident-submitted-request.png)

## Presentation runbook

1. Keep the local preview running and open `/demo`. Use **Reset demo data → Reset this demo** for a fresh presentation.
2. Start the guided story with Sofia and The Mercer's available two-bedroom B-302. Request a tour and submit the basic demo application.
3. Follow the guide to the manager, then Alex Rivera's resident portal. Use **Use sample request & photo**, review access permission, and submit.
4. Assign the request to Marcus Reed as Property Manager, switch to Maintenance and update its status, then return to Resident to show the timeline.
5. Finish with the Owner metrics. Show simulated rent payment and document metadata as optional resident highlights.

Use the same browser tab for the connected story: resident/management edits are tab-local, and public leasing inquiries use a browser-session cookie. The fictional calendar is September 2026; October 10, 2026 at 2 PM is a valid tour example. Use fictional contact information. Reset does not delete stored inquiries or production organizations.

## Production limits and next step

- No hosted Supabase project is configured in this workspace. Real Auth email confirmation, invitation acceptance across accounts, Storage transfer and live organization onboarding still need staging verification. Local RLS tests emulate Auth and Storage tables; they are not hosted-service tests.
- The full operational sales experience uses fictional tab-local state. Production organization setup, branding, public listings and scoped record access exist, but the entire resident/management demo workflow is not yet backed by production mutations.
- Payment processing, billing, screening, SMS and internal messaging remain unimplemented. Payments are deliberately simulated; documents are metadata placeholders; tour requests are unconfirmed requests.
- The default public demo's local database adapter is suitable for this local presentation, not durable Vercel deployment. Use the documented supported backend configuration before publishing and keep fictional demo data separate from customer data.

Recommended next step: configure a dedicated Supabase staging project, apply the nine existing migrations, and complete the [new-customer onboarding checklist](new-customer-onboarding.md) with separate platform-admin, organization-admin and resident accounts before a live-customer release.

## Files and data changes in this audit

- `src/app/refinements.css`: responsive heading/action fix.
- `src/components/demo/reset-dialog.tsx`, `src/components/demo/controls.tsx`, `src/components/demo-shell.tsx`, `src/components/resident/shell.tsx`: explicit focus restoration.
- `tests/release-audit.spec.ts`: four browser regression tests covering entry-point journeys, navigation and reset behavior.
- `docs/MVP-RELEASE-AUDIT.md`, `docs/release-audit/*`, `docs/VERIFICATION.md`, `docs/new-customer-onboarding.md`, `README.md`: results, evidence and current release guidance.

No schema or migration changes were required. Fictional test inquiries were added through the normal local demo API; existing records were not deleted. No production database or external customer service was modified.
