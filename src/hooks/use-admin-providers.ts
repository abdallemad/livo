"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { API_ROUTES } from "@/constants/api-routes"
import { adminKeys } from "@/constants/query-keys"
import { api } from "@/lib/api-client"
import type { ProviderDecisionValues, ProviderListQuery } from "@/schemas/admin.schema"
import type { AdminProviderDetail, AdminProviderList, ProviderDecisionDto } from "@/types/admin"

/**
 * `/admin/providers` (AD-01): the review queue, the review page and every
 * verification decision. A decision invalidates all admin queries, so the
 * dashboard KPIs, the tab counts and the detail page all refresh.
 */
export function useAdminProviders(query: ProviderListQuery) {
  return useQuery({
    queryKey: adminKeys.providerList(query),
    queryFn: () => api.get<AdminProviderList>(API_ROUTES.admin.providers, query),
    placeholderData: keepPreviousData,
  })
}

/** The server page passes the first snapshot as `initialData`. */
export function useAdminProvider(id: string, initialData: AdminProviderDetail) {
  return useQuery({
    queryKey: adminKeys.provider(id),
    queryFn: () => api.get<AdminProviderDetail>(API_ROUTES.admin.provider(id)),
    initialData,
  })
}

/** Approve / reject (PENDING), suspend (APPROVED), reinstate (SUSPENDED). */
export function useProviderDecision() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...values }: ProviderDecisionValues & { id: string }) =>
      api.patch<ProviderDecisionDto>(API_ROUTES.admin.providerStatus(id), values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  })
}
