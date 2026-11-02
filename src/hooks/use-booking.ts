"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { API_ROUTES } from "@/constants/api-routes"
import { customerKeys } from "@/constants/query-keys"
import { api } from "@/lib/api-client"
import type { CreateServiceBookingValues } from "@/schemas/booking.schema"
import type { BookingConfirmationDto, CheckoutSessionDto, CreatedBookingDto } from "@/types/booking"

/**
 * Booking a fixed-price service and paying for it (CU-02, CU-07; docs/booking-checkout-feature.md).
 * Online payment leaves the app for Stripe's hosted page, so callers do `window.location.assign(checkoutUrl)`.
 */
export function useCreateServiceBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: CreateServiceBookingValues) => api.post<CreatedBookingDto>(API_ROUTES.customer.bookings, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customerKeys.all }),
  })
}

/** "Pay now" / retry: a Stripe Checkout link for an unpaid booking. */
export function useStartCheckout() {
  return useMutation({
    mutationFn: (bookingId: string) => api.post<CheckoutSessionDto>(API_ROUTES.customer.bookingCheckout(bookingId)),
  })
}

/** Max time the confirmation step keeps polling after Stripe's redirect before telling the customer to check back. */
export const CONFIRMATION_POLL_MS = 3_000
export const CONFIRMATION_POLL_LIMIT = 20

/**
 * The wizard's confirmation step. `waiting` polls while an online payment is still settling, at most
 * `CONFIRMATION_POLL_LIMIT` times; `stillSettling` turns false once the limit is reached so the page can offer to pay again.
 */
export function useBookingConfirmation(id: string, waiting: boolean) {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: customerKeys.bookingConfirmation(id),
    queryFn: () => api.get<BookingConfirmationDto>(API_ROUTES.customer.bookingConfirmation(id)),
    refetchInterval: (q) => (waiting && q.state.data?.status === "PENDING_PAYMENT" && q.state.dataUpdateCount < CONFIRMATION_POLL_LIMIT ? CONFIRMATION_POLL_MS : false),
  })
  const polls = queryClient.getQueryState(customerKeys.bookingConfirmation(id))?.dataUpdateCount ?? 0
  const stillSettling = waiting && query.data?.status === "PENDING_PAYMENT" && polls < CONFIRMATION_POLL_LIMIT
  return { ...query, stillSettling }
}
