import type { BookingStatus } from "@prisma/client"
import type { DayHours } from "@/utils/availability"
import type { Paginated } from "./api"

/** Provider schedule (PR-10) and reviews received (PR-13) — docs/provider-schedule-reviews-feature.md. */

export interface ScheduleBooking {
  id: string
  number: string
  title: string
  status: BookingStatus
  scheduledAt: string
  /** Area only until the booking is confirmed (BR-02). */
  place: string | null
  /** `false` = booked outside the provider's working hours; `null` = no hours set. */
  withinHours: boolean | null
}

export interface ScheduleDay {
  /** Local (Cairo) midnight of the day, ISO. */
  date: string
  weekday: number
  ranges: DayHours["ranges"]
  bookings: ScheduleBooking[]
}

export interface ProviderSchedule {
  /** Saturday → Friday, every weekday present. */
  week: DayHours[]
  weeklyMinutes: number
  /** The next 14 days in Cairo time, today first. */
  upcoming: ScheduleDay[]
}

export interface ProviderReviewItem {
  id: string
  rating: number
  comment: string | null
  reply: string | null
  isHidden: boolean
  createdAt: string
  updatedAt: string
  customerFirstName: string | null
  booking: { id: string; number: string; title: string }
  replyBlockedReason: string | null
}

export interface ProviderReviewList extends Paginated<ProviderReviewItem> {
  summary: {
    average: number
    /** Visible reviews only — hidden ones don't count towards the rating. */
    count: number
    distribution: { rating: number; count: number; percent: number }[]
    unreplied: number
    replied: number
    hidden: number
    /** BR-04: under review for low ratings. */
    underReview: boolean
  }
}
