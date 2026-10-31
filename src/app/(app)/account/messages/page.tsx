import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /account/messages — docs/SITEMAP.md (CU-06). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "Messages" }

export default function AccountMessagesPage() {
  return <PagePlaceholder title={"Messages"} description={"Your chats with providers for confirmed bookings."} route="/account/messages" reqs={["CU-06"]} />
}
