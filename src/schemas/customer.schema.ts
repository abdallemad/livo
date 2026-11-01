import { z } from "zod"
import { contactProblem, REQUEST_BUDGET_MAX, REQUEST_BUDGET_MIN, REQUEST_DESCRIPTION_MAX, REQUEST_DESCRIPTION_MIN, REQUEST_MAX_PHOTOS, REQUEST_SIZE_MAX, REQUEST_TITLE_MAX, REQUEST_TITLE_MIN } from "@/utils/new-request"
import { paginationQuerySchema } from "./common.schema"

/** Customer dashboard & requests (CU-08, CU-11, CU-13) — docs/customer-dashboard-requests-feature.md. */

export const CUSTOMER_REQUEST_TAB_IDS = ["active", "booked", "closed"] as const

export const customerRequestListQuerySchema = paginationQuerySchema.extend({
  tab: z.enum(CUSTOMER_REQUEST_TAB_IDS).default("active"),
  q: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((v) => v || undefined),
  perPage: z.coerce.number().int().min(1).max(50).default(10),
})
export type CustomerRequestListQuery = z.infer<typeof customerRequestListQuerySchema>

/** `PATCH /api/me/requests/[id]/status` — the only change the list makes (CU-11). */
export const customerRequestStatusSchema = z.object({ status: z.literal("CANCELLED") })

// ---------------------------------------------------------------------------
// New quote request (CU-03) — docs/customer-new-request-feature.md
// ---------------------------------------------------------------------------

const optionalNumber = (schema: z.ZodNumber) =>
  z.preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.coerce.number({ error: "Enter a number." }).pipe(schema).optional())

const optionalId = z
  .string()
  .trim()
  .max(64)
  .optional()
  .transform((v) => v || undefined)

/** `POST /api/me/requests`. Contact details are refused in title and description (SY-04). */
export const newRequestSchema = z
  .object({
    categoryId: z.string().trim().min(1, "Choose what kind of job it is."),
    title: z
      .string()
      .trim()
      .min(REQUEST_TITLE_MIN, `Give it a short title (at least ${REQUEST_TITLE_MIN} characters).`)
      .max(REQUEST_TITLE_MAX, `Keep the title under ${REQUEST_TITLE_MAX} characters.`),
    description: z
      .string()
      .trim()
      .min(REQUEST_DESCRIPTION_MIN, `Describe the job in at least ${REQUEST_DESCRIPTION_MIN} characters.`)
      .max(REQUEST_DESCRIPTION_MAX, `Keep the description under ${REQUEST_DESCRIPTION_MAX} characters.`),
    sizeM2: optionalNumber(z.number().int("Use a whole number.").min(1, "Enter the size in m².").max(REQUEST_SIZE_MAX)),
    /** A saved address, or … */
    addressId: optionalId,
    /** … just an area in the customer's city. One of the two is required (checked in the service). */
    areaId: optionalId,
    budget: optionalNumber(z.number().min(REQUEST_BUDGET_MIN, `The budget must be at least ${REQUEST_BUDGET_MIN} EGP.`).max(REQUEST_BUDGET_MAX)),
    preferredDate: z
      .string()
      .trim()
      .optional()
      .transform((v) => v || undefined),
    imageIds: z.array(z.string().min(1).max(64)).max(REQUEST_MAX_PHOTOS, `At most ${REQUEST_MAX_PHOTOS} photos.`).default([]),
  })
  .superRefine((v, ctx) => {
    const t = contactProblem(v.title)
    if (t) ctx.addIssue({ code: "custom", path: ["title"], message: t })
    const d = contactProblem(v.description)
    if (d) ctx.addIssue({ code: "custom", path: ["description"], message: d })
  })
export type NewRequestInput = z.input<typeof newRequestSchema>
export type NewRequestValues = z.output<typeof newRequestSchema>
