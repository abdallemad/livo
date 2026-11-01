import { cache } from "react"
import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { notFound, redirect } from "next/navigation"
import { BookingDetail } from "@/components/provider/bookings/BookingDetail"
import { getBookingForProvider } from "@/services/provider-booking.service"

/**
 * /provider/bookings/[id] — one of the provider's bookings (docs/SITEMAP.md §4, PR-08, BR-02,
 * docs/provider-quotes-bookings-feature.md). First snapshot read on the server (service called
 * directly for the session's own user id — CLAUDE.md §2 exception) and handed to the client as
 * `initialData`; actions go through `PATCH /api/provider/bookings/[id]/status`. Another provider's
 * booking is a 404. Private: `noindex` from the zone layout.
 */
const load = cache(async (id: string) => {
  const { userId } = await auth()
  // Layout and page render in parallel, so don't rely on the layout's gate having run first.
  if (!userId) redirect(`/sign-in?redirect_url=${encodeURIComponent(`/provider/bookings/${id}`)}`)
  return getBookingForProvider(userId, id)
})

export async function generateMetadata({ params }: PageProps<"/provider/bookings/[id]">): Promise<Metadata> {
  const booking = await load((await params).id)
  return { title: booking ? `Booking ${booking.number}` : "Booking not found" }
}

export default async function ProviderBookingDetailPage({ params }: PageProps<"/provider/bookings/[id]">) {
  const booking = await load((await params).id)
  if (!booking) notFound()
  return <BookingDetail initialData={booking} />
}
