import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { BookingConfirmation } from "@/components/booking/BookingConfirmation"
import { BookServiceWizard } from "@/components/booking/BookServiceWizard"
import { getCurrentUser } from "@/services/auth.service"
import { getBookServiceFormData } from "@/services/booking-checkout.service"

/**
 * /account/book/[serviceId] — book a fixed-price service (docs/SITEMAP.md §3, CU-02, CU-07,
 * docs/booking-checkout-feature.md). Date & time → address → notes → payment → confirmation.
 *
 * `?booking=<id>` (after Stripe's redirect or a cash booking) shows the confirmation step for that booking, owner-only via
 * `GET /api/me/bookings/[id]/confirmation`. Private and per-user: dynamic, `noindex` from the zone layout, which also
 * gates the zone to signed-in customers. A service that isn't live (hidden, provider suspended…) is a 404.
 */
export const metadata: Metadata = { title: "Book the service" }

export default async function AccountBookServiceIdPage({ params, searchParams }: PageProps<"/account/book/[serviceId]">) {
  const user = await getCurrentUser()
  if (!user) notFound()
  const [{ serviceId }, query] = await Promise.all([params, searchParams])

  const bookingId = typeof query.booking === "string" ? query.booking.slice(0, 64) : null
  if (bookingId) {
    const checkout = query.checkout === "success" || query.checkout === "cancelled" ? query.checkout : null
    return <BookingConfirmation bookingId={bookingId} checkout={checkout} />
  }

  const data = await getBookServiceFormData(user.id, serviceId.slice(0, 64))
  if (!data) notFound()
  return <BookServiceWizard data={data} />
}
