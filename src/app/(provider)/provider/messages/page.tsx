import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { ConversationList } from "@/components/chat/ConversationList"
import { listConversations } from "@/services/chat.service"

/**
 * /provider/messages — conversations for bookings whose chat is (or was) open (docs/SITEMAP.md, PR-09,
 * docs/messages-feature.md). First snapshot from the server (service called directly for the session's own user id —
 * CLAUDE.md §2 exception), then the client refreshes. Private: `noindex` from the zone layout.
 */
export const metadata: Metadata = { title: "Messages" }

export default async function ProviderMessagesPage() {
  const { userId } = await auth()
  if (!userId) redirect(`/sign-in?redirect_url=${encodeURIComponent("/provider/messages")}`)
  return <ConversationList side="PROVIDER" initialData={await listConversations(userId, "PROVIDER")} />
}
