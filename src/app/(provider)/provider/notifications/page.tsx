import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /provider/notifications — docs/SITEMAP.md (SY-02). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "الإشعارات" }

export default function ProviderNotificationsPage() {
  return <PagePlaceholder title={"الإشعارات"} description={"طلبات جديدة، حجوزات، ومدفوعات."} route="/provider/notifications" reqs={["SY-02"]} />
}
