"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { API_ROUTES } from "@/constants/api-routes"
import { providerKeys } from "@/constants/query-keys"
import { api } from "@/lib/api-client"
import type {
  ProviderBookingListQuery,
  ProviderBookingStatusValues,
  ProviderQuoteListQuery,
  ProviderRequestListQuery,
} from "@/schemas/provider.schema"
import type {
  ProviderBookingDetail,
  ProviderBookingList,
  ProviderBookingStatusDto,
  ProviderDashboardDto,
  ProviderQuoteList,
  ProviderRequestList,
} from "@/types/provider"

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

// --- quotes (PR-07) and bookings (PR-08) — docs/provider-quotes-bookings-feature.md ---

/** Any provider write can change the home counters, both lists and the detail page. */
function useInvalidateProvider() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: providerKeys.all })
}

export function useProviderQuotes(query: ProviderQuoteListQuery) {
  return useQuery({
    queryKey: providerKeys.quoteList(query),
    queryFn: () => api.get<ProviderQuoteList>(API_ROUTES.provider.quotes, query),
    placeholderData: keepPreviousData,
  })
}

export function useWithdrawQuote() {
  const invalidate = useInvalidateProvider()
  return useMutation({
    mutationFn: (id: string) => api.patch<{ id: string }>(API_ROUTES.provider.quoteStatus(id), { status: "WITHDRAWN" }),
    onSuccess: invalidate,
  })
}

export function useProviderBookings(query: ProviderBookingListQuery) {
  return useQuery({
    queryKey: providerKeys.bookingList(query),
    queryFn: () => api.get<ProviderBookingList>(API_ROUTES.provider.bookings, query),
    placeholderData: keepPreviousData,
  })
}

export function useProviderBooking(id: string, initialData: ProviderBookingDetail) {
  return useQuery({
    queryKey: providerKeys.booking(id),
    queryFn: () => api.get<ProviderBookingDetail>(API_ROUTES.provider.booking(id)),
    initialData,
  })
}

export function useUpdateProviderBooking() {
  const invalidate = useInvalidateProvider()
  return useMutation({
    mutationFn: ({ id, ...values }: ProviderBookingStatusValues & { id: string }) =>
      api.patch<ProviderBookingStatusDto>(API_ROUTES.provider.bookingStatus(id), values),
    onSuccess: invalidate,
  })
}
