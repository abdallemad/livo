import { z } from "zod"

/** Roles a person may pick at sign-up (SRS AU-03). ADMIN is never self-assigned. */
export const signUpRoleSchema = z.enum(["CUSTOMER", "PROVIDER"])

export const syncUserSchema = z.object({
  role: signUpRoleSchema.optional(),
})

export type SignUpRole = z.infer<typeof signUpRoleSchema>
export type SyncUserValues = z.infer<typeof syncUserSchema>
