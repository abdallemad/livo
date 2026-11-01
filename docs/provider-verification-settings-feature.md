# Provider verification & settings — PR-02, PR-03, AU-06

The last two provider pages: where a provider sees their account status and manages their documents, and
where they edit their profile. Same layering as the rest of the app: page (server snapshot) → client island →
hook → `/api/provider/*` → service → repository. The provider id always comes **from the session**.

## Pages

| Route | What it does |
|---|---|
| `/provider/verification` | Status badge and a coloured panel with one sentence per status, **the admin's reason** when rejected ("What to fix") or suspended ("Why"), the last decision time; "Finish signing up" for an unfinished (DRAFT) account, "Contact support" when suspended. **Your documents** (private — only the provider and the review team see them): national ID, selfie (front camera on phones), up to 3 certificates (photo or PDF) — editable only when the status allows, otherwise listed with a link that opens each through a short-lived signed URL. **Send for review again** after a rejection (confirm dialog; disabled with the reason until an ID and a selfie are present). **History** of submissions, document changes and admin decisions with reasons. |
| `/provider/settings` | **Personal details**: photo (uploaded to Clerk), full name (letters only — SY-04), email; mobile number and city shown read-only. **Work profile**: about your work, years of experience, specialties (up to 6, sub-categories show their parent), work areas in your city (up to 15). **Account**: verification status → verification page, **Sign-in and security** (opens Clerk's own dialog: mobile number, sessions), sign out, delete account → contact support. Each card saves on its own and warns before leaving with unsaved changes. |

## Verification rules — `src/utils/verification.ts` (pure, 3 tests)

| Status | ID & selfie | Certificates | Send again |
|---|---|---|---|
| `DRAFT` | — (finish the wizard at `/onboarding`) | — | — |
| `PENDING` | read-only | read-only | — (already being reviewed) |
| `REJECTED` | **replace / remove** | **add / remove** | **yes**, once an ID and a selfie are present |
| `APPROVED` | read-only (changing identity would skip review) | **add / remove** (they add trust, status unchanged) | — |
| `SUSPENDED` | read-only | read-only | — (contact support) |

- **Resubmit** is the one provider-driven transition: `REJECTED → PENDING`. One conditional UPDATE (409 if the status
  just changed), clears the reason the provider was shown, audit `provider.resubmit` (with the previous reason),
  `PROVIDER_DECISION` notifications to every active admin and to the provider, and the ops-alert hook
  (`provider.resubmitted_for_review`, a logged no-op until SMS/WhatsApp is wired). The admin queue then shows the
  provider under **Pending review** again, where the existing approve / reject decisions apply
  ([admin-providers-users-feature.md](admin-providers-users-feature.md)).
- Documents use the onboarding pipeline: magic-byte check, ≤ 5 MB image / ≤ 10 MB PDF (certificates only), private
  prefix `private/verification/<userId>/`; ID and selfie **replace** the previous one; previews go through the owner-only
  `GET /api/onboarding/files/[id]`. Every upload and delete on this page is audited (`provider.document_upload` /
  `provider.document_delete`) so the reviewer sees what changed.
- Someone else's document id answers 404 (never confirms it exists); a change the status doesn't allow answers 409.

### The provider zone banner now shows the real status

`(provider)/layout.tsx` used to show "Your account is under review" to **every** provider (a TODO). It now reads the
status (`getBannerStatus`): nothing when approved, the matching banner when pending / rejected / suspended, nothing for
an admin browsing the zone. The layout was already dynamic (`requireZone` reads the session).

## Settings rules (AU-06)

- Same schemas as the onboarding steps they edit: `personalSettingsSchema` = step 2's name + email,
  `workSettingsSchema` = step 3 (`providerProfileStepSchema`). Specialties must be switched on; areas must be in the
  provider's city (422 on the field otherwise). City isn't editable (one city at launch, A1).
- The name is mirrored to Clerk (`services/clerk-profile.service.ts`, moved out of `onboarding.service.ts` and shared);
  the **photo** is uploaded straight to Clerk from the browser, then the saved details are re-sent so Clerk's photo URL is
  copied into `User.avatarUrl` — unsaved edits in the form are not saved by a photo change.
- **Changing specialties or areas doesn't send an approved account back to review**, and it changes which requests the
  provider sees at once. Existing services in a removed specialty stay listed (the service form only checks the category
  when it's changed). Re-review on specialty changes is a product decision for later.
- Personal and work saves call `revalidateStorefront()` (name, photo, bio and areas belong on the public profile).
- **Account deletion (AU-07, SHOULD) is not self-service yet**: it must settle open bookings, the wallet balance and open
  payouts, anonymise personal data (NF-04) and delete the Clerk user — irreversible, so the page points to support until
  that flow is designed and tested.

## API

| Method | Path | Does |
|---|---|---|
| GET | `/api/provider/verification` | `ProviderVerification` (status, reason, documents, access, resubmit reason, history) |
| POST | `/api/provider/verification/documents` | multipart `type` + `file` → 201 document |
| DELETE | `/api/provider/verification/documents/[id]` | remove a document (when allowed) |
| POST | `/api/provider/verification/resubmit` | `REJECTED → PENDING` |
| GET | `/api/provider/settings` | `ProviderSettings` (personal, work, options) |
| PUT | `/api/provider/settings/personal` | `{ name, email }` |
| PUT | `/api/provider/settings/work` | `{ bio, yearsExperience, categoryIds, areaIds }` |

All call `requireProvider()`; reads answer `private, no-store`. An admin (no provider profile) gets 404.

## Files

| Layer | File |
|---|---|
| Schemas | `src/schemas/provider-account.schema.ts` (reuses the onboarding schemas) |
| DTOs | `src/types/provider-account.ts` |
| Repository | `src/repositories/provider-account.repository.ts`; document rows and profile writes reuse `onboarding.repository.ts` |
| Services | `provider-verification.service.ts` (incl. `getBannerStatus`), `provider-settings.service.ts`, `clerk-profile.service.ts` (shared) |
| Routes | `src/app/api/provider/{verification,settings}/**` |
| Utils + tests | `src/utils/verification.ts`, `tests/utils/verification.test.ts` |
| Hook | `src/hooks/use-provider-account.ts` (`providerKeys.verification/settings`) |
| Constants | `API_ROUTES.provider.{verification*,settings*}`; audit labels `provider.resubmit`, `provider.document_upload`, `provider.document_delete`; ops-alert kind |
| UI | `components/provider/account/{VerificationCenter,ProviderSettingsForm}.tsx`; reuses `forms/ImageUploader`, `forms/CheckboxChips`, `admin/shared/HistoryCard` |
| Pages | `(provider)/provider/verification/page.tsx`, `(provider)/provider/settings/page.tsx`, `(provider)/layout.tsx` (banner) |

No schema change and no migration.

## Not done / follow-ups

- Self-service account deletion (AU-07) — see above.
- The SITEMAP access rule "non-active providers are sent to `/provider/verification`" isn't enforced; they can browse the
  zone with the banner, and the actions themselves are gated (requests, accepting bookings, payouts).
- Re-review when an approved provider changes specialties.
