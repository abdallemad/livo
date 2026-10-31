"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { API_ROUTES } from "@/constants/api-routes"
import { adminKeys } from "@/constants/query-keys"
import { api } from "@/lib/api-client"
import type { ProviderDecisionValues } from "@/schemas/admin.schema"
import type { AdminDashboardDto, DisputeStatusDto, ProviderDecisionDto } from "@/types/admin"

/**
 * `/admin` dashboard data. The page renders it on the server and hands it in
 * as `initialData` (no first-visit API call); every action invalidates it so
 * the KPIs and queues refetch from `GET /api/admin/dashboard`.
 */
export function useAdminDashboard(initialData: AdminDashboardDto) {
  return useQuery({
    queryKey: adminKeys.dashboard(),
    queryFn: () => api.get<AdminDashboardDto>(API_ROUTES.admin.dashboard),
    initialData,
  })
}

/** AD-01: approve / reject a pending provider. */
export function useProviderDecision() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...values }: ProviderDecisionValues & { id: string }) =>
      api.patch<ProviderDecisionDto>(API_ROUTES.admin.providerStatus(id), values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  })
}

/** AD-05: OPEN → UNDER_REVIEW. */
export function useStartDisputeReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.patch<DisputeStatusDto>(API_ROUTES.admin.disputeStatus(id), { status: "UNDER_REVIEW" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  })
}
