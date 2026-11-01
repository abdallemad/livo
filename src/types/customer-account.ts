import type { BookingSource, BookingStatus, PaymentMethod, PaymentStatus } from "@prisma/client"
import type { Paginated } from "./api"
import type { CustomerPaymentTotals } from "@/utils/customer-booking"

/** Customer settings, addresses, bookings, payments (AU-06, CU-13, CU-14, SY-07) — docs/customer-account-feature.md. */

export interface PersonalDetailsDto {
  name: string
  email: string | null
  phone: string | null
  avatarUrl: string | null
  city: string | null
}

export interface CustomerSettings {
  personal: PersonalDetailsDto
  interestIds: string[]
  options: { categories: { id: string; name: string }[] }
}

export interface AddressDto {
  id: string
  label: string | null
  street: string
  details: string | null
  areaId: string | null
  area: string | null
  city: string
  isDefault: boolean
  /** "Street, details, Area". */
  line: string
}

export interface CustomerAddresses {
  items: AddressDto[]
  max: number
  city: string | null
  areas: { id: string; name: string }[]
}

export interface CustomerBookingListItem {
  id: string
  number: string
  source: BookingSource
  title: string
  status: BookingStatus
  scheduledAt: string | null
  createdAt: string
  amount: number
  /** The customer's own address snapshot. */
  place: string | null
  providerId: string
  providerName: string
  /** Only while a confirmed booking is live (BR-02). */
  providerPhone: string | null
  paymentMethod: PaymentMethod | null
  paymentLabel: string | null
  nextStep: string
  /** Completed / closed and not reviewed yet by this customer (CU-10, BR-03). */
  canReview: boolean
}

export interface CustomerBookingList extends Paginated<CustomerBookingListItem> {
  counts: Record<"current" | "finished" | "cancelled", number>
  /** Bookings the customer must act on now (pay or confirm). */
  needsAction: number
}

export interface CustomerPaymentDto {
  id: string
  method: PaymentMethod
  status: PaymentStatus
  amount: number
  refundedAmount: number
  label: string
  milestone: string | null
  date: string
  booking: { id: string; number: string; title: string }
}

export interface CustomerInvoiceDto {
  id: string
  number: string
  total: number
  issuedAt: string
  /** PDF generation isn't built yet (SY-07), so this is false for now. */
  hasPdf: boolean
  booking: { id: string; number: string; title: string }
}

export interface CustomerPayments {
  totals: CustomerPaymentTotals
  view: "payments" | "invoices"
  payments: Paginated<CustomerPaymentDto> | null
  invoices: Paginated<CustomerInvoiceDto> | null
  invoiceCount: number
}
