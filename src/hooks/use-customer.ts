"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { API_ROUTES } from "@/constants/api-routes"
import { customerKeys } from "@/constants/query-keys"
import { api } from "@/lib/api-client"
import type { CustomerRequestListQuery } from "@/schemas/customer.schema"
import type { CustomerDashboardDto, CustomerRequestList } from "@/types/customer"

/**
 * `/account` (CU-08) and `/account/requests` (CU-11, CU-13) — docs/customer-dashboard-requests-feature.md.
 * The dashboard is rendered on the server and handed in as `initialData`; a cancel refreshes everything
 * customer-side (the home counts depend on it).
 */
export function useCustomerDashboard(initialData: CustomerDashboardDto) {
  return useQuery({ queryKey: customerKeys.dashboard(), queryFn: () => api.get<CustomerDashboardDto>(API_ROUTES.customer.dashboard), initialData })
}

export function useMyRequests(query: CustomerRequestListQuery) {
  return useQuery({
    queryKey: customerKeys.requestList(query),
    queryFn: () => api.get<CustomerRequestList>(API_ROUTES.customer.requests, query),
    placeholderData: keepPreviousData,
  })
}

export function useCancelMyRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.patch<{ id: string }>(API_ROUTES.customer.requestStatus(id), { status: "CANCELLED" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customerKeys.all }),
  })
}
