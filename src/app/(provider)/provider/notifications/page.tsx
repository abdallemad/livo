import type { Metadata } from "next"
import { NotificationsList } from "@/components/notifications/NotificationsList"

/**
 * /provider/notifications — the notification centre (docs/SITEMAP.md, SY-02, docs/notifications-feature.md). A client island
 * over `GET /api/me/notifications` (the signed-in user's own rows); live through Pusher. Private: `noindex` from the zone layout.
 */
export const metadata: Metadata = { title: "Notifications" }

export default function NotificationsPage() {
  return <NotificationsList />
}
