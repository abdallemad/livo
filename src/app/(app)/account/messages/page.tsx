import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /account/messages — docs/SITEMAP.md (CU-06). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "المحادثات" }

export default function AccountMessagesPage() {
  return <PagePlaceholder title={"المحادثات"} description={"محادثاتك مع مزودي الخدمة للحجوزات المؤكدة."} route="/account/messages" reqs={["CU-06"]} />
}
