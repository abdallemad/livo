import { cache } from "react"
import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { notFound, redirect } from "next/navigation"
import { MyBookingDetail } from "@/components/customer/bookings/MyBookingDetail"
import { getMyBooking } from "@/services/customer-booking.service"

/**
 * /account/bookings/[id] — one of the customer's bookings (docs/SITEMAP.md §3, CU-09…CU-12, BR-02, BR-08,
 * docs/customer-booking-detail-feature.md). First snapshot read on the server (service called directly for the
 * session's own user id — CLAUDE.md §2 exception) and handed to the client as `initialData`; actions go through
 * `PATCH /api/me/bookings/[id]/status` and Stripe Checkout. Someone else's booking is a 404. Private: `noindex` from
 * the zone layout.
 */
const load = cache(async (id: string) => {
  const { userId } = await auth()
  // Layout and page render in parallel, so don't rely on the layout's gate having run first.
  if (!userId) redirect(`/sign-in?redirect_url=${encodeURIComponent(`/account/bookings/${id}`)}`)
  return getMyBooking(userId, id.slice(0, 64))
})

export async function generateMetadata({ params }: PageProps<"/account/bookings/[id]">): Promise<Metadata> {
  const booking = await load((await params).id)
  return { title: booking ? `Booking ${booking.number}` : "Booking not found" }
}

export default async function AccountBookingDetailPage({ params }: PageProps<"/account/bookings/[id]">) {
  const booking = await load((await params).id)
  if (!booking) notFound()
  return <MyBookingDetail initialData={booking} />
}
