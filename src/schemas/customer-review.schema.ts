import { z } from "zod"
import { REVIEW_COMMENT_MAX, reviewCommentProblem } from "@/utils/customer-review"

/**
 * `PUT /api/me/bookings/[id]/review` — the customer rates a finished booking (CU-10) or edits that review within the
 * edit window. Shared by the review form and the route; docs/customer-review-feature.md.
 */
export const customerReviewSchema = z.object({
  rating: z
    .number({ error: "Choose a star rating." })
    .int("Choose a star rating.")
    .min(1, "Choose a star rating.")
    .max(5, "Choose a star rating."),
  comment: z
    .string()
    .trim()
    .max(REVIEW_COMMENT_MAX + 50)
    .superRefine((v, ctx) => {
      const problem = reviewCommentProblem(v)
      if (problem) ctx.addIssue({ code: "custom", message: problem })
    })
    .optional()
    .transform((v) => v || null),
})
export type CustomerReviewInput = z.input<typeof customerReviewSchema>
export type CustomerReviewValues = z.output<typeof customerReviewSchema>
