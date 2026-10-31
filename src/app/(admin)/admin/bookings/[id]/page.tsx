import { cache } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { BookingDetail } from "@/components/admin/orders/BookingDetail"
import { getBookingForAdmin } from "@/services/admin-booking.service"

/**
 * /admin/bookings/[id] — one booking: money, payments/escrow, chat (for disputes), history (AD-04).
 * First snapshot read on the server (service called directly — CLAUDE.md §2 exception; the admin
 * layout enforced the role) and handed to the client as `initialData`; cancelling goes through
 * `PATCH /api/admin/bookings/[id]/status`.
 */
const load = cache(getBookingForAdmin)

export async function generateMetadata({ params }: PageProps<"/admin/bookings/[id]">): Promise<Metadata> {
  const booking = await load((await params).id)
  return { title: booking ? `Booking ${booking.number}` : "Booking not found" }
}

export default async function AdminBookingDetailPage({ params }: PageProps<"/admin/bookings/[id]">) {
  const booking = await load((await params).id)
  if (!booking) notFound()
  return <BookingDetail initialData={booking} />
}
