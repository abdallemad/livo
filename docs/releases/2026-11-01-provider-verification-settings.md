# 2026-11-01 — Provider verification and settings

Details: [provider-verification-settings-feature.md](../provider-verification-settings-feature.md).

## `/provider/verification` (PR-02, PR-03)

- Replaced the placeholder: status in plain words with the admin's reason, documents (ID, selfie, certificates) editable
  only when the status allows, **Send for review again** after a rejection (new `REJECTED → PENDING` transition, audited,
  admins notified), and the history of submissions and decisions.
- The provider banner now shows the **real** status (it said "under review" to every provider).
- New `GET /api/provider/verification`, `POST|DELETE /api/provider/verification/documents[/id]`,
  `POST /api/provider/verification/resubmit`.

## `/provider/settings` (AU-06)

- Replaced the placeholder: personal details (photo and name synced with Clerk, email), work profile (bio, experience,
  specialties, areas — same rules as onboarding), and account actions (verification, Clerk's sign-in & security dialog,
  sign out). Account deletion (AU-07) points to support for now.
- New `GET /api/provider/settings`, `PUT /api/provider/settings/{personal,work}`.

## Shared changes

- `syncNameToClerk` moved from `onboarding.service.ts` to `services/clerk-profile.service.ts`; onboarding behaves the same.

No schema change and no migration.

## Verification

- `tsc --noEmit`, `eslint src tests`, `npm test` (128/128; 3 new) pass.
- Found and fixed while reviewing: changing the photo would have saved half-typed, unsaved name/email edits (or reported a
  failed upload when they were invalid); it now re-sends the saved details only.
- **Not verified in a browser, against a database or with Clerk / R2:** this environment has no `.env`. Worth checking with
  the seed: provider 7 (REJECTED, "the ID photo isn't clear") can replace the ID and send again → appears under Pending review
  in `/admin/providers`; an approved provider no longer sees the "under review" banner.
