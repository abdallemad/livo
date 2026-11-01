"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { API_ROUTES } from "@/constants/api-routes"
import { providerKeys } from "@/constants/query-keys"
import { api } from "@/lib/api-client"
import type { LedgerQuery, PayoutRequestValues, ProviderPayoutListQuery } from "@/schemas/provider-wallet.schema"
import type { ProviderEarnings, ProviderPayouts } from "@/types/provider-wallet"

/** `/provider/earnings` (PR-11) and `/provider/payouts` (PR-12) — docs/provider-earnings-payouts-feature.md. */

export function useProviderEarnings(query: LedgerQuery) {
  return useQuery({
    queryKey: providerKeys.earnings(query),
    queryFn: () => api.get<ProviderEarnings>(API_ROUTES.provider.earnings, query),
    placeholderData: keepPreviousData,
  })
}

export function useProviderPayouts(query: ProviderPayoutListQuery) {
  return useQuery({
    queryKey: providerKeys.payouts(query),
    queryFn: () => api.get<ProviderPayouts>(API_ROUTES.provider.payouts, query),
    placeholderData: keepPreviousData,
  })
}

/** The request changes "available", the history and the home page's wallet line — refresh everything provider-side. */
export function useRequestPayout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: PayoutRequestValues) => api.post<{ id: string }>(API_ROUTES.provider.payouts, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: providerKeys.all }),
  })
}
