import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /provider/verification — docs/SITEMAP.md (PR-02, PR-03). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "توثيق الحساب" }

export default function ProviderVerificationPage() {
  return <PagePlaceholder title={"توثيق الحساب"} description={"ارفع البطاقة والصورة والشهادات، وتابع حالة المراجعة."} route="/provider/verification" reqs={["PR-02", "PR-03"]} />
}
