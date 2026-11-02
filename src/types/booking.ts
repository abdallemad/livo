import type { BookingStatus, PaymentMethod, PaymentStatus } from "@prisma/client"
import type { BookableDay, BookingPaymentMethod } from "@/utils/booking-checkout"

/** DTOs for `/account/book/[serviceId]` (CU-02, CU-07; docs/booking-checkout-feature.md). Safe for the browser. */

export interface BookServiceFormData {
  service: {
    id: string
    title: string
    price: number
    durationMinutes: number | null
    category: string
    imageUrl: string | null
    href: string
    provider: { id: string; name: string; avatarUrl: string | null; rating: number; reviewsCount: number }
  }
  city: string | null
  addresses: { id: string; label: string; isDefault: boolean }[]
  /** Days with at least one free start, in the customer's (Cairo) clock. */
  days: BookableDay[]
  paymentMethods: { id: BookingPaymentMethod; available: boolean }[]
}

/** Answer of `POST /api/me/bookings`. `checkoutUrl` is set for online payment: send the browser there. */
export interface CreatedBookingDto {
  id: string
  number: string
  status: BookingStatus
  checkoutUrl: string | null
}

/** Answer of `POST /api/me/bookings/[id]/checkout`. */
export interface CheckoutSessionDto {
  checkoutUrl: string
}

/** Answer of `GET /api/me/bookings/[id]/confirmation`: the last wizard step, polled while the payment settles. */
export interface BookingConfirmationDto {
  id: string
  number: string
  status: BookingStatus
  title: string
  serviceId: string | null
  providerName: string
  scheduledAt: string | null
  place: string | null
  amount: number
  payment: { method: PaymentMethod; status: PaymentStatus } | null
  /** True while an online payment is still open (customer can pay / retry). */
  canPay: boolean
}
