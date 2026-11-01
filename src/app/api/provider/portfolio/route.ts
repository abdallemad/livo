import { created, ok, parseBody, toErrorResponse } from "@/lib/api-route"
import { revalidateStorefront } from "@/lib/storefront-cache"
import { portfolioItemSchema } from "@/schemas/provider-catalog.schema"
import { requireProvider } from "@/services/auth.service"
import { createPortfolioItem, getPortfolio } from "@/services/provider-portfolio.service"

/** GET /api/provider/portfolio — items in display order + unsaved photos. POST — add an item (PR-04). */
export async function GET() {
  try {
    const user = await requireProvider()
    return ok(await getPortfolio(user.id), { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load your portfolio.")
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireProvider()
    const input = await parseBody(request, portfolioItemSchema)
    const item = await createPortfolioItem(user.id, input)
    revalidateStorefront() // the portfolio shows on the public provider profile
    return created(item)
  } catch (error) {
    return toErrorResponse(error, "Could not add to your portfolio.")
  }
}
