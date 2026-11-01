import type { z } from "zod"
import { basicInfoStepSchema, documentTypeSchema, providerProfileStepSchema } from "./onboarding.schema"

/**
 * Provider verification (PR-02, PR-03) and settings (AU-06) — docs/provider-verification-settings-feature.md.
 * The same field rules as the onboarding steps they edit, so a profile is valid the same way everywhere.
 */

/** Multipart `type` field on `POST /api/provider/verification/documents`. */
export const verificationDocumentTypeSchema = documentTypeSchema

/** `PUT /api/provider/settings/personal` — the name (letters only, SY-04) and optional email. City is fixed at launch (A1). */
export const personalSettingsSchema = basicInfoStepSchema.pick({ name: true, email: true })
export type PersonalSettingsInput = z.input<typeof personalSettingsSchema>
export type PersonalSettingsValues = z.output<typeof personalSettingsSchema>

/** `PUT /api/provider/settings/work` — bio, years, specialties, work areas (onboarding step 3). */
export const workSettingsSchema = providerProfileStepSchema
export type WorkSettingsInput = z.input<typeof workSettingsSchema>
export type WorkSettingsValues = z.output<typeof workSettingsSchema>
