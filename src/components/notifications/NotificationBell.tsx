"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@clerk/nextjs"
import { usePathname } from "next/navigation"
import { Bell, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { useMarkNotificationsRead, useNotifications } from "@/hooks/use-notifications"
import type { NotificationDto } from "@/types/notification"
import { countBadge } from "@/utils/notification"
import { NotificationItem } from "./NotificationItem"

const BELL_QUERY = { filter: "all", page: 1, perPage: 8 } as const

/** Where "See all" goes: the zone's notification centre (admins have only the bell). */
const centreFor = (pathname: string) => (pathname.startsWith("/admin") ? null : pathname.startsWith("/provider") ? "/provider/notifications" : "/account/notifications")

/**
 * The bell in every dashboard header (SY-02; docs/notifications-feature.md): unread count badge, the 8 newest, **Mark all
 * read**, and **See all**. Opening one marks it read. Updates live through Pusher (`RealtimeNotifications`). Renders a
 * same-size placeholder until Clerk resolves (CLAUDE.md §4.1 rule 2).
 */
export function NotificationBell() {
  const { isLoaded, isSignedIn } = useAuth()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { data, isPending } = useNotifications(BELL_QUERY)
  const markRead = useMarkNotificationsRead()
  if (!isLoaded || !isSignedIn) return <div aria-hidden className="size-9" />

  const unread = data?.unread ?? 0
  const centre = centreFor(pathname)
  const openOne = (n: NotificationDto) => {
    setOpen(false)
    if (!n.readAt) markRead.mutate({ ids: [n.id] })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon" className="relative" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}>
            <Bell aria-hidden />
            {unread > 0 ? (
              <span aria-hidden className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-none font-semibold text-primary-foreground tabular-nums">
                {countBadge(unread)}
              </span>
            ) : null}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-[min(24rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
          <p className="font-semibold">Notifications</p>
          {unread > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => markRead.mutate({})} disabled={markRead.isPending}>
              <CheckCheck data-icon="inline-start" aria-hidden />
              Mark all read
            </Button>
          ) : null}
        </div>
        <div className="max-h-[60dvh] overflow-y-auto p-1">
          {isPending ? (
            <div className="space-y-2 p-2">
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
          ) : data && data.items.length ? (
            data.items.map((n) => <NotificationItem key={n.id} n={n} onOpen={openOne} compact />)
          ) : (
            <p className="p-6 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
          )}
        </div>
        {centre ? (
          <div className="border-t p-1">
            <Button variant="ghost" className="w-full" render={<Link href={centre} onClick={() => setOpen(false)} />}>
              See all
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
