import type { BookingStatus, QuoteStatus, RequestStatus, VerificationStatus } from "@prisma/client"
import type { Paginated } from "./api"

/**
 * Provider workspace contracts (`/provider`, `/provider/requests`) —
 * docs/provider-dashboard-requests-feature.md. Money is a plain number in EGP, dates are ISO
 * strings. **No customer identity, phone or street address** appears in any request DTO
 * (BR-02, SY-04): only the area and city.
 */

/** Why the list may be empty regardless of filters. */
export type ProviderEligibility = "OK" | "NOT_APPROVED" | "NO_PROFILE"

export interface ProviderMyQuote {
  id: string
  price: number
  durationDays: number | null
  status: QuoteStatus
  createdAt: string
}

export interface ProviderRequestCard {
  id: string
  title: string
  /** Full text; the card clamps it. */
  description: string
  category: string
  /** Parent category name for a sub-category ("Plumbing" for "Leak repair"). */
  parentCategory: string | null
  area: string | null
  city: string
  budget: number | null
  preferredDate: string | null
  status: RequestStatus
  createdAt: string
  expiresAt: string | null
  /** Local (Cairo) calendar days; computed on the server at read time. */
  postedDaysAgo: number
  expiresInDays: number | null
  photoCount: number
  quoteCount: number
  /** True when the request's area is not one of mine (only possible with scope "whole city"). */
  outsideMyAreas: boolean
  myQuote: ProviderMyQuote | null
}

export interface ProviderOption {
  id: string
  name: string
}

export interface ProviderRequestList extends Paginated<ProviderRequestCard> {
  eligibility: ProviderEligibility
  verificationStatus: VerificationStatus | null
  /** Tab badges: matching requests not quoted yet (in the chosen scope) / requests I quoted. */
  counts: { new: number; quoted: number }
  /** Filter options: my categories (+ sub-categories) and my areas. */
  categories: ProviderOption[]
  areas: ProviderOption[]
}

export interface ProviderTodayBooking {
  id: string
  number: string
  title: string
  status: BookingStatus
  scheduledAt: string
  /** Area only until the booking is confirmed and contact is unlocked (BR-02); then the full address. */
  place: string | null
  customerFirstName: string | null
}

export interface ProviderDashboardDto {
  eligibility: ProviderEligibility
  name: string | null
  verification: { status: VerificationStatus; rejectionReason: string | null } | null
  stats: {
    newRequests: number
    pendingQuotes: number
    bookingsToAccept: number
    activeBookings: number
    /** Net credited this (Cairo) month: EARNING − REFUND_CLAWBACK ledger rows. */
    earningsThisMonth: number
    /** Ledger balance (PR-11); may be negative (cash-job commission owed). */
    walletBalance: number
    completedJobs: number
    ratingAvg: number
    ratingCount: number
    underReview: boolean
  }
  newRequests: ProviderRequestCard[]
  todayBookings: ProviderTodayBooking[]
  /** Setup gaps that stop customers finding the provider. */
  setup: { hasServices: boolean; hasAreas: boolean; hasCategories: boolean }
}
