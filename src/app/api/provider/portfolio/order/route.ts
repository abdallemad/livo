import { noContent, parseBody, toErrorResponse } from "@/lib/api-route"
import { revalidateStorefront } from "@/lib/storefront-cache"
import { portfolioOrderSchema } from "@/schemas/provider-catalog.schema"
import { requireProvider } from "@/services/auth.service"
import { reorderPortfolio } from "@/services/provider-portfolio.service"

/** PUT /api/provider/portfolio/order `{ ids }` — every item id in the new display order (PR-04). */
export async function PUT(request: Request) {
  try {
    const user = await requireProvider()
    const { ids } = await parseBody(request, portfolioOrderSchema)
    await reorderPortfolio(user.id, ids)
    revalidateStorefront()
    return noContent()
  } catch (error) {
    return toErrorResponse(error, "Could not change the order.")
  }
}
