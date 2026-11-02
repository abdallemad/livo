"use client"

import { useState } from "react"
import { Bell, CheckCheck } from "lucide-react"
import { EmptyState, PageHeader } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { useMarkNotificationsRead, useNotifications } from "@/hooks/use-notifications"
import { cn } from "@/lib/utils"
import type { NotificationDto } from "@/types/notification"
import { formatNumber } from "@/utils/format"
import { NotificationItem } from "./NotificationItem"

const PER_PAGE = 20

/**
 * `/account/notifications` and `/provider/notifications` (SY-02; docs/notifications-feature.md): every notification,
 * newest first, **All / Unread** filter, **Mark all read**, 20 per page with "Load more". Opening one marks it read and
 * goes to its page. Updates live through Pusher.
 */
export function NotificationsList() {
  const [filter, setFilter] = useState<"all" | "unread">("all")
  const [pages, setPages] = useState(1)
  const { data, isPending, isFetching } = useNotifications({ filter, page: 1, perPage: PER_PAGE * pages })
  const markRead = useMarkNotificationsRead()
  const unread = data?.unread ?? 0
  const openOne = (n: NotificationDto) => {
    if (!n.readAt) markRead.mutate({ ids: [n.id] })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Quotes, bookings, payments and messages — they also pop up live while you're here."
        actions={
          unread > 0 ? (
            <Button variant="outline" onClick={() => markRead.mutate({})} disabled={markRead.isPending}>
              <CheckCheck data-icon="inline-start" aria-hidden />
              Mark all read
            </Button>
          ) : null
        }
      />
      <div role="radiogroup" aria-label="Show" className="inline-flex rounded-lg border p-1">
        {(
          [
            ["all", "All"],
            ["unread", `Unread${unread ? ` (${formatNumber(unread)})` : ""}`],
          ] as const
        ).map(([id, text]) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={filter === id}
            onClick={() => {
              setFilter(id)
              setPages(1)
            }}
            className={cn("h-9 rounded-md px-3 text-sm transition-colors", filter === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            {text}
          </button>
        ))}
      </div>

      {isPending ? (
        <div className="space-y-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={Bell} title={filter === "unread" ? "No unread notifications" : "No notifications yet"} description="Updates on your requests, quotes, bookings and payments show up here." />
      ) : (
        <>
          <Card className="gap-0 divide-y p-1">
            {data.items.map((n) => (
              <NotificationItem key={n.id} n={n} onOpen={openOne} />
            ))}
          </Card>
          {data.total > data.items.length ? (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => setPages((p) => p + 1)} disabled={isFetching}>
                {isFetching ? <Spinner data-icon="inline-start" /> : null}
                Load more
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
