"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { API_ROUTES } from "@/constants/api-routes"
import { adminKeys } from "@/constants/query-keys"
import { api } from "@/lib/api-client"
import type { CommissionRateValues, PayoutListQuery, PayoutStatusValues } from "@/schemas/admin.schema"
import type { AdminCommissionSettings, AdminPayoutList, PayoutStatusDto } from "@/types/admin"

/**
 * `/admin/payouts` (AD-07) and `/admin/settings/commission` (AD-06). Every write invalidates
 * all admin queries: the dashboard's payout card and the payments page depend on them too.
 */
function useInvalidateAdmin() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: adminKeys.all })
}

export function useAdminPayouts(query: PayoutListQuery) {
  return useQuery({
    queryKey: adminKeys.payoutList(query),
    queryFn: () => api.get<AdminPayoutList>(API_ROUTES.admin.payouts, query),
    placeholderData: keepPreviousData,
  })
}

export function useDecidePayout() {
  const invalidate = useInvalidateAdmin()
  return useMutation({
    mutationFn: ({ id, ...values }: PayoutStatusValues & { id: string }) => api.patch<PayoutStatusDto>(API_ROUTES.admin.payoutStatus(id), values),
    onSuccess: invalidate,
  })
}

export function useCommissionSettings(initialData: AdminCommissionSettings) {
  return useQuery({
    queryKey: adminKeys.commission(),
    queryFn: () => api.get<AdminCommissionSettings>(API_ROUTES.admin.commission),
    initialData,
  })
}

export function useUpdateGlobalCommission() {
  const invalidate = useInvalidateAdmin()
  return useMutation({
    mutationFn: (values: CommissionRateValues) => api.patch<{ ratePercent: number }>(API_ROUTES.admin.commission, values),
    onSuccess: invalidate,
  })
}

export function useSetCategoryCommission() {
  const invalidate = useInvalidateAdmin()
  return useMutation({
    mutationFn: ({ categoryId, ...values }: CommissionRateValues & { categoryId: string }) =>
      api.put<{ categoryId: string }>(API_ROUTES.admin.commissionCategory(categoryId), values),
    onSuccess: invalidate,
  })
}

export function useClearCategoryCommission() {
  const invalidate = useInvalidateAdmin()
  return useMutation({
    mutationFn: (categoryId: string) => api.delete<{ categoryId: string }>(API_ROUTES.admin.commissionCategory(categoryId)),
    onSuccess: invalidate,
  })
}
