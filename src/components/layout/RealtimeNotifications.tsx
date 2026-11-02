"use client"

import { useAuth } from "@clerk/nextjs"
import { useQueryClient } from "@tanstack/react-query"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"
import { customerKeys, notificationKeys, providerKeys } from "@/constants/query-keys"
import { REALTIME_EVENTS, type LiveNotification, userChannel } from "@/constants/realtime"
import { useChannelEvent } from "@/hooks/use-realtime"

/**
 * Live notifications for the signed-in user (SY-02; docs/realtime-feature.md): listens on their private Pusher channel
 * (`User.id` is the Clerk id, so no extra request) and shows a toast with a **View** link — "New quote on …", "New message
 * from …". It also refreshes the bell (docs/notifications-feature.md) and the dashboard lists, so an open request page shows the new quote without a reload. Skipped
 * when the user is already on the page the toast points to. Renders nothing; mounted once in `DashboardShell`.
 */
export function RealtimeNotifications() {
  const { userId } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()

  useChannelEvent<LiveNotification>(userId ? userChannel(userId) : null, REALTIME_EVENTS.notification, (n) => {
    void queryClient.invalidateQueries({ queryKey: n.href.startsWith("/provider") ? providerKeys.all : customerKeys.all })
    // The bell's count and list (stored notifications; chat messages aren't stored but cost one cheap refetch).
    void queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    if (pathname === n.href) return
    toast(n.title, { description: n.body ?? undefined, action: { label: "View", onClick: () => router.push(n.href) } })
  })

  return null
}
