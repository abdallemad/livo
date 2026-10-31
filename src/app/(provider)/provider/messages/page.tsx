import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /provider/messages — docs/SITEMAP.md (PR-09). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "Messages" }

export default function ProviderMessagesPage() {
  return <PagePlaceholder title={"Messages"} description={"Your chats with customers."} route="/provider/messages" reqs={["PR-09"]} />
}
