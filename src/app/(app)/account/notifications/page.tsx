import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /account/notifications — docs/SITEMAP.md (SY-02). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "Notifications" }

export default function AccountNotificationsPage() {
  return <PagePlaceholder title={"Notifications"} description={"Every update on your requests and bookings."} route="/account/notifications" reqs={["SY-02"]} />
}
