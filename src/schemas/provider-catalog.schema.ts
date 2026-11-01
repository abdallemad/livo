import { z } from "zod"
import {
  PORTFOLIO_DESCRIPTION_MAX,
  PORTFOLIO_MAX_IMAGES,
  PORTFOLIO_MAX_ITEMS,
  PORTFOLIO_TITLE_MAX,
  PORTFOLIO_TITLE_MIN,
} from "@/constants/provider-catalog"
import { firstServiceStepSchema } from "./onboarding.schema"

/**
 * The provider's services (PR-05) and portfolio (PR-04) — docs/provider-services-portfolio-feature.md.
 * Shared by the forms and the `/api/provider/services*` and `/api/provider/portfolio*` routes.
 */

const id = z.string().trim().min(1).max(64)

/** One rule for a fixed-price service everywhere: the same schema as onboarding step 5. */
export const serviceFormSchema = firstServiceStepSchema
export type ServiceFormInput = z.input<typeof serviceFormSchema>
export type ServiceFormValues = z.output<typeof serviceFormSchema>

/** `PATCH /api/provider/services/[id]/status` — the provider's own on/off switch. */
export const serviceStatusSchema = z.object({ isActive: z.boolean() })

export const portfolioItemSchema = z.object({
  title: z
    .string()
    .trim()
    .min(PORTFOLIO_TITLE_MIN, `Give it a title of at least ${PORTFOLIO_TITLE_MIN} characters.`)
    .max(PORTFOLIO_TITLE_MAX, `Keep the title under ${PORTFOLIO_TITLE_MAX} characters.`),
  description: z
    .string()
    .trim()
    .max(PORTFOLIO_DESCRIPTION_MAX, `Keep the description under ${PORTFOLIO_DESCRIPTION_MAX} characters.`)
    .optional()
    .transform((v) => v || null),
  imageIds: z.array(id).min(1, "Add at least one photo.").max(PORTFOLIO_MAX_IMAGES, `At most ${PORTFOLIO_MAX_IMAGES} photos.`),
})
export type PortfolioItemInput = z.input<typeof portfolioItemSchema>
export type PortfolioItemValues = z.output<typeof portfolioItemSchema>

/** `PUT /api/provider/portfolio/order` — every item id, in the new order. */
export const portfolioOrderSchema = z.object({ ids: z.array(id).max(PORTFOLIO_MAX_ITEMS) })
