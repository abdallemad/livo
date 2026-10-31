import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /admin/services — docs/SITEMAP.md (AD-02). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "الخدمات" }

export default function AdminServicesPage() {
  return <PagePlaceholder title={"الخدمات"} description={"كل الخدمات بسعر ثابت — مراجعة أو إيقاف."} route="/admin/services" reqs={["AD-02"]} />
}
