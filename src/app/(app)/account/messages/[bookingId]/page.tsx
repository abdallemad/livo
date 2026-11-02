import { cache } from "react"
import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { notFound, redirect } from "next/navigation"
import { ChatThread } from "@/components/chat/ChatThread"
import { getThread } from "@/services/chat.service"

/**
 * /account/messages/[bookingId] — one booking's chat (CU-06, SY-04; docs/messages-feature.md). Opens only once the provider
 * accepted the booking; otherwise, or for someone else's booking, a 404. Live through Pusher. Private: `noindex` from the
 * zone layout.
 */
const load = cache(async (bookingId: string) => {
  const { userId } = await auth()
  // Layout and page render in parallel, so don't rely on the layout's gate having run first.
  if (!userId) redirect(`/sign-in?redirect_url=${encodeURIComponent(`/account/messages/${bookingId}`)}`)
  return getThread(userId, "CUSTOMER", bookingId.slice(0, 64))
})

export async function generateMetadata({ params }: PageProps<"/account/messages/[bookingId]">): Promise<Metadata> {
  const thread = await load((await params).bookingId)
  return { title: thread ? `Chat with ${thread.other.name}` : "Chat not found" }
}

export default async function AccountThreadPage({ params }: PageProps<"/account/messages/[bookingId]">) {
  const thread = await load((await params).bookingId)
  if (!thread) notFound()
  return <ChatThread side="CUSTOMER" initialData={thread} />
}
