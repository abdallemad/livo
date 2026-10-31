import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /provider/notifications — docs/SITEMAP.md (SY-02). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "Notifications" }

export default function ProviderNotificationsPage() {
  return <PagePlaceholder title={"Notifications"} description={"New requests, bookings, and payments."} route="/provider/notifications" reqs={["SY-02"]} />
}
