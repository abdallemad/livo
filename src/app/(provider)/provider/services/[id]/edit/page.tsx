import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /provider/services/[id]/edit — docs/SITEMAP.md (PR-05). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "تعديل الخدمة" }

export default function ProviderServicesIdEditPage() {
  return <PagePlaceholder title={"تعديل الخدمة"} description={"عدّل بيانات الخدمة أو أوقفها."} route="/provider/services/[id]/edit" reqs={["PR-05"]} />
}
