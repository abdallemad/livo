import { cache } from "react"
import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { notFound, redirect } from "next/navigation"
import { ReviewBookingForm } from "@/components/customer/bookings/ReviewBookingForm"
import { getMyBookingReview } from "@/services/customer-review.service"

/**
 * /account/bookings/[id]/review — rate a finished booking (CU-10, BR-03, SY-05; docs/customer-review-feature.md).
 * First snapshot read on the server (service called directly for the session's own user id — CLAUDE.md §2 exception)
 * and handed to the client island as `initialData`; saving goes through `PUT /api/me/bookings/[id]/review`.
 * Someone else's booking is a 404. Private: `noindex` comes from the zone layout.
 */
const load = cache(async (id: string) => {
  const { userId } = await auth()
  // Layout and page render in parallel, so don't rely on the layout's gate having run first.
  if (!userId) redirect(`/sign-in?redirect_url=${encodeURIComponent(`/account/bookings/${id}/review`)}`)
  return getMyBookingReview(userId, id.slice(0, 64))
})

export async function generateMetadata({ params }: PageProps<"/account/bookings/[id]/review">): Promise<Metadata> {
  const data = await load((await params).id)
  return { title: data ? `Rate booking ${data.booking.number}` : "Booking not found" }
}

export default async function AccountBookingReviewPage({ params }: PageProps<"/account/bookings/[id]/review">) {
  const data = await load((await params).id)
  if (!data) notFound()
  return <ReviewBookingForm initialData={data} />
}
