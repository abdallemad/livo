"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { API_ROUTES } from "@/constants/api-routes"
import { providerKeys } from "@/constants/query-keys"
import { api } from "@/lib/api-client"
import type { ProviderRequestListQuery } from "@/schemas/provider.schema"
import type { ProviderDashboardDto, ProviderRequestList } from "@/types/provider"

/**
 * `/provider` home and `/provider/requests` (docs/provider-dashboard-requests-feature.md).
 * The dashboard is rendered on the server and handed in as `initialData`; the request list reads
 * its filters from the URL. Future provider writes (send a quote) should invalidate `providerKeys.all`.
 */
export function useProviderDashboard(initialData: ProviderDashboardDto) {
  return useQuery({
    queryKey: providerKeys.dashboard(),
    queryFn: () => api.get<ProviderDashboardDto>(API_ROUTES.provider.dashboard),
    initialData,
  })
}

export function useProviderRequests(query: ProviderRequestListQuery) {
  return useQuery({
    queryKey: providerKeys.requestList(query),
    queryFn: () => api.get<ProviderRequestList>(API_ROUTES.provider.requests, query),
    placeholderData: keepPreviousData,
  })
}
