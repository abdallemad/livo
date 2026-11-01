"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { API_ROUTES } from "@/constants/api-routes"
import { customerKeys } from "@/constants/query-keys"
import { api } from "@/lib/api-client"
import type { AddressValues, CustomerBookingListQuery, CustomerPaymentQuery, InterestsSettingsValues, PersonalSettingsValues } from "@/schemas/customer-account.schema"
import type { CustomerAddresses, CustomerBookingList, CustomerPayments, CustomerSettings } from "@/types/customer-account"

/**
 * `/account/settings`, `/account/addresses`, `/account/bookings`, `/account/payments` —
 * docs/customer-account-feature.md. Writes invalidate every customer query.
 */
function useInvalidateCustomer() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: customerKeys.all })
}

export function useCustomerSettings(initialData: CustomerSettings) {
  return useQuery({ queryKey: customerKeys.settings(), queryFn: () => api.get<CustomerSettings>(API_ROUTES.customer.settings), initialData })
}

export function useSaveCustomerPersonal() {
  const invalidate = useInvalidateCustomer()
  return useMutation({ mutationFn: (values: PersonalSettingsValues) => api.put<{ name: string }>(API_ROUTES.customer.settingsPersonal, values), onSuccess: invalidate })
}

export function useSaveInterests() {
  const invalidate = useInvalidateCustomer()
  return useMutation({ mutationFn: (values: InterestsSettingsValues) => api.put<{ ok: true }>(API_ROUTES.customer.settingsInterests, values), onSuccess: invalidate })
}

export function useAddresses(initialData: CustomerAddresses) {
  return useQuery({ queryKey: customerKeys.addresses(), queryFn: () => api.get<CustomerAddresses>(API_ROUTES.customer.addresses), initialData })
}

export function useSaveAddress(id: string | null) {
  const invalidate = useInvalidateCustomer()
  return useMutation({
    mutationFn: (values: AddressValues) => (id ? api.put<{ id: string }>(API_ROUTES.customer.address(id), values) : api.post<{ id: string }>(API_ROUTES.customer.addresses, values)),
    onSuccess: invalidate,
  })
}

export function useDeleteAddress() {
  const invalidate = useInvalidateCustomer()
  return useMutation({ mutationFn: (id: string) => api.delete<void>(API_ROUTES.customer.address(id)), onSuccess: invalidate })
}

export function useSetDefaultAddress() {
  const invalidate = useInvalidateCustomer()
  return useMutation({ mutationFn: (id: string) => api.put<{ id: string }>(API_ROUTES.customer.addressDefault(id)), onSuccess: invalidate })
}

export function useMyBookings(query: CustomerBookingListQuery) {
  return useQuery({ queryKey: customerKeys.bookingList(query), queryFn: () => api.get<CustomerBookingList>(API_ROUTES.customer.bookings, query), placeholderData: keepPreviousData })
}

export function useMyPayments(query: CustomerPaymentQuery) {
  return useQuery({ queryKey: customerKeys.payments(query), queryFn: () => api.get<CustomerPayments>(API_ROUTES.customer.payments, query), placeholderData: keepPreviousData })
}
