import { noContent, ok, parseBody, parseParams, toErrorResponse } from "@/lib/api-route"
import { revalidateStorefront } from "@/lib/storefront-cache"
import { idParamSchema } from "@/schemas/common.schema"
import { portfolioItemSchema } from "@/schemas/provider-catalog.schema"
import { requireProvider } from "@/services/auth.service"
import { deletePortfolioItem, updatePortfolioItem } from "@/services/provider-portfolio.service"

/** PUT / DELETE /api/provider/portfolio/[id] — edit or delete one of the provider's portfolio items (PR-04). */
export async function PUT(request: Request, ctx: RouteContext<"/api/provider/portfolio/[id]">) {
  try {
    const user = await requireProvider()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const input = await parseBody(request, portfolioItemSchema)
    const result = await updatePortfolioItem(user.id, id, input)
    revalidateStorefront()
    return ok(result)
  } catch (error) {
    return toErrorResponse(error, "Could not save the portfolio item.")
  }
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/provider/portfolio/[id]">) {
  try {
    const user = await requireProvider()
    const { id } = await parseParams(ctx.params, idParamSchema)
    await deletePortfolioItem(user.id, id)
    revalidateStorefront()
    return noContent()
  } catch (error) {
    return toErrorResponse(error, "Could not delete the portfolio item.")
  }
}
