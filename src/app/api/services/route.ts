import { ok, parseQuery, toErrorResponse } from "@/lib/api-route"
import { catalogQuerySchema } from "@/schemas/catalog.schema"
import { listCatalogServices } from "@/services/catalog.service"

/**
 * GET /api/services?q=&category=&area=&minPrice=&maxPrice=&maxDuration=&minRating=&sort=&page= — the
 * filtered public catalog behind the `/services` island (MK-02, MK-06; docs/catalog-feature.md).
 * PUBLIC: no session needed, only LIVE services, no contact details. Short shared cache — it's the
 * same answer for everyone. `/api/` is disallowed in robots.txt; the crawlable listings are the category pages.
 */
export async function GET(request: Request) {
  try {
    const query = parseQuery(request, catalogQuerySchema)
    return ok(await listCatalogServices(query), { headers: { "cache-control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" } })
  } catch (error) {
    return toErrorResponse(error, "Could not load services.")
  }
}
