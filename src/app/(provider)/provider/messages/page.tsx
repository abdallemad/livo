import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /provider/messages — docs/SITEMAP.md (PR-09). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "المحادثات" }

export default function ProviderMessagesPage() {
  return <PagePlaceholder title={"المحادثات"} description={"محادثاتك مع العملاء."} route="/provider/messages" reqs={["PR-09"]} />
}
