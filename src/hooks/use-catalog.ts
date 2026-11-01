"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { API_ROUTES } from "@/constants/api-routes"
import { catalogKeys } from "@/constants/query-keys"
import { api } from "@/lib/api-client"
import type { CatalogQuery } from "@/schemas/catalog.schema"
import type { CatalogServicePage } from "@/types/catalog"
import { activeFilterCount } from "@/utils/catalog"

/**
 * The `/services` island (docs/catalog-feature.md). The unfiltered first page is rendered on the server and
 * passed as `initialData` (no first-visit API call, CLAUDE.md §4.1 rule 6); any filter fetches `GET /api/services`.
 */
export function useCatalogServices(query: CatalogQuery, initial: CatalogServicePage) {
  const isDefault = activeFilterCount(query) === 0 && query.sort === "recommended" && query.page === 1
  return useQuery({
    queryKey: catalogKeys.services(query),
    queryFn: () => api.get<CatalogServicePage>(API_ROUTES.services, query),
    initialData: isDefault ? initial : undefined,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  })
}
