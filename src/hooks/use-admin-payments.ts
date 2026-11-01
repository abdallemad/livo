"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { API_ROUTES } from "@/constants/api-routes"
import { adminKeys } from "@/constants/query-keys"
import { api } from "@/lib/api-client"
import type { PaymentListQuery } from "@/schemas/admin.schema"
import type { AdminPaymentList } from "@/types/admin"

/**
 * `/admin/payments` (AD-07). Filters come from the URL; the key lives under `adminKeys.all`,
 * so any admin money action (cancel a booking, resolve a dispute) also refreshes this list.
 */
export function useAdminPayments(query: PaymentListQuery) {
  return useQuery({
    queryKey: adminKeys.paymentList(query),
    queryFn: () => api.get<AdminPaymentList>(API_ROUTES.admin.payments, query),
    placeholderData: keepPreviousData,
  })
}
