"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { API_ROUTES } from "@/constants/api-routes"
import { adminKeys } from "@/constants/query-keys"
import { api } from "@/lib/api-client"
import type { BookingListQuery, RequestListQuery } from "@/schemas/admin.schema"
import type { AdminBookingDetail, AdminBookingList, AdminRequestDetail, AdminRequestList } from "@/types/admin"

/**
 * `/admin/requests` and `/admin/bookings` (AD-04). Lists read their filters
 * from the URL; detail pages get `initialData` from the server; a cancel
 * invalidates every admin query (dashboard KPIs depend on these too).
 */
export function useAdminRequests(query: RequestListQuery) {
  return useQuery({
    queryKey: adminKeys.requestList(query),
    queryFn: () => api.get<AdminRequestList>(API_ROUTES.admin.requests, query),
    placeholderData: keepPreviousData,
  })
}

export function useAdminRequest(id: string, initialData: AdminRequestDetail) {
  return useQuery({
    queryKey: adminKeys.request(id),
    queryFn: () => api.get<AdminRequestDetail>(API_ROUTES.admin.request(id)),
    initialData,
  })
}

export function useCancelRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.patch<{ id: string }>(API_ROUTES.admin.requestStatus(id), { status: "CANCELLED", reason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  })
}

export function useAdminBookings(query: BookingListQuery) {
  return useQuery({
    queryKey: adminKeys.bookingList(query),
    queryFn: () => api.get<AdminBookingList>(API_ROUTES.admin.bookings, query),
    placeholderData: keepPreviousData,
  })
}

export function useAdminBooking(id: string, initialData: AdminBookingDetail) {
  return useQuery({
    queryKey: adminKeys.booking(id),
    queryFn: () => api.get<AdminBookingDetail>(API_ROUTES.admin.booking(id)),
    initialData,
  })
}

export function useCancelBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.patch<{ id: string }>(API_ROUTES.admin.bookingStatus(id), { status: "CANCELLED", reason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  })
}
