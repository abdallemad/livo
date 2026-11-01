import { z } from "zod"
import { dayError, MAX_RANGES_PER_DAY, toMinutes } from "@/utils/availability"
import { REPLY_MAX, replyProblem } from "@/utils/review-summary"
import { paginationQuerySchema } from "./common.schema"

/**
 * Provider schedule (PR-10) and reviews received (PR-13) — docs/provider-schedule-reviews-feature.md.
 * Shared by the forms and the `/api/provider/schedule` and `/api/provider/reviews*` routes.
 */

const time = z.string().refine((v) => toMinutes(v) !== null, "Choose a time.")

/** `PUT /api/provider/schedule` — the whole week at once; a weekday with no ranges is a day off. */
export const scheduleSchema = z
  .object({
    days: z
      .array(
        z.object({
          weekday: z.number().int().min(0).max(6),
          ranges: z.array(z.object({ start: time, end: time })).max(MAX_RANGES_PER_DAY),
        }),
      )
      .max(7),
  })
  .superRefine((v, ctx) => {
    const seen = new Set<number>()
    v.days.forEach((d, i) => {
      if (seen.has(d.weekday)) ctx.addIssue({ code: "custom", path: ["days", i], message: "Each day once." })
      seen.add(d.weekday)
      const error = dayError(d.ranges)
      if (error) ctx.addIssue({ code: "custom", path: ["days", i], message: error })
    })
  })
export type ScheduleValues = z.infer<typeof scheduleSchema>

export const PROVIDER_REVIEW_FILTERS = ["all", "unreplied", "replied"] as const

export const providerReviewListQuerySchema = paginationQuerySchema.extend({
  filter: z.enum(PROVIDER_REVIEW_FILTERS).default("all"),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  perPage: z.coerce.number().int().min(1).max(50).default(10),
})
export type ProviderReviewListQuery = z.infer<typeof providerReviewListQuerySchema>

/** `PUT /api/provider/reviews/[id]/reply` — public text, so contact details are refused (`replyProblem`). */
export const reviewReplySchema = z.object({
  reply: z
    .string()
    .trim()
    .max(REPLY_MAX + 50)
    .superRefine((v, ctx) => {
      const problem = replyProblem(v)
      if (problem) ctx.addIssue({ code: "custom", message: problem })
    }),
})
export type ReviewReplyValues = z.infer<typeof reviewReplySchema>
