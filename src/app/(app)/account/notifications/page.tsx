import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /account/notifications — docs/SITEMAP.md (SY-02). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "الإشعارات" }

export default function AccountNotificationsPage() {
  return <PagePlaceholder title={"الإشعارات"} description={"كل التحديثات عن طلباتك وحجوزاتك."} route="/account/notifications" reqs={["SY-02"]} />
}
