# 2026-11-01 — Provider services and portfolio

Details: [provider-services-portfolio-feature.md](../provider-services-portfolio-feature.md).

## `/provider/services`, `/new`, `/[id]/edit` (PR-05)

- Replaced the three placeholders. The list shows whether customers can see each service and why not
  (live / off / hidden by Livo with the reason / waiting for activation / category paused), an on/off switch,
  edit, and delete (blocked once a service has bookings — switch it off instead).
- Add / edit form with a live preview of the customer's card; same rules as onboarding step 5; up to 5 photos.
  The public URL (slug) never changes on edit.
- New endpoints under `/api/provider/services*`. Every write busts the public catalog cache.

## `/provider/portfolio` (PR-04)

- Replaced the placeholder: a gallery of past work; add / edit in a dialog (title, details, 1–6 photos),
  delete, move up / down. New endpoints under `/api/provider/portfolio*`.

## Shared changes

- Upload plumbing (magic-byte validation, private storage, removal, signed previews) moved from
  `onboarding.service.ts` to `services/file-upload.service.ts`; onboarding behaves the same.
- `ImageUploader` moved from `components/onboarding/` to `components/forms/` (shared form fields, CLAUDE.md §3).
- New owner-only photo preview route `GET /api/provider/files/[id]`.

No schema change and no migration.

## Verification

- `tsc --noEmit`, `eslint src tests`, `npm test` (111/111; 5 new) pass.
- **Not verified in a browser, against a database or with R2:** this environment has no `.env`. Uploads need R2
  configured (503 otherwise). Worth checking: add a service with 2 photos, edit it and remove one, cancel — the
  photo must still be there; save — it's gone. Try deleting a seeded service that has bookings (blocked).
