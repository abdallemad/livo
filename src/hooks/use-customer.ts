"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { API_ROUTES } from "@/constants/api-routes"
import { customerKeys } from "@/constants/query-keys"
import { api, apiUpload } from "@/lib/api-client"
import type { CustomerRequestListQuery, NewRequestInput } from "@/schemas/customer.schema"
import type { CustomerDashboardDto, CustomerRequestList, RequestPhotoDto } from "@/types/customer"

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

// --- new quote request (CU-03) — docs/customer-new-request-feature.md ---------------------

export function useCreateRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: NewRequestInput) => api.post<{ id: string; notified: number }>(API_ROUTES.customer.requests, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customerKeys.all }),
  })
}

export function useUploadRequestPhoto() {
  return useMutation({
    mutationFn: ({ file, onProgress }: { file: Blob; onProgress?: (fraction: number) => void }) => {
      const form = new FormData()
      form.set("file", file, "upload")
      return apiUpload<RequestPhotoDto>(API_ROUTES.customer.requestImages, form, onProgress)
    },
  })
}

export function useDeleteRequestPhoto() {
  return useMutation({ mutationFn: (id: string) => api.delete<void>(API_ROUTES.customer.requestImage(id)) })
}
