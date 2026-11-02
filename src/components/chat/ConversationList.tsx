"use client"

import Link from "next/link"
import { MessagesSquare } from "lucide-react"
import { BookingStatusBadge, EmptyState, PageHeader } from "@/components/shared"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { useConversations } from "@/hooks/use-chat"
import { cn } from "@/lib/utils"
import type { ConversationDto } from "@/types/chat"
import type { ChatSide } from "@/utils/chat"
import { formatZonedDateTime } from "@/utils/zoned-time"

const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?"

/**
 * `/account/messages` and `/provider/messages` (CU-06, PR-09; docs/messages-feature.md): one row per booking whose chat
 * is open or was open, most recent activity first — the other person, the job, the last message, open / closed.
 */
export function ConversationList({ side, initialData }: { side: ChatSide; initialData: ConversationDto[] }) {
  const { data } = useConversations(side, initialData)
  const base = side === "CUSTOMER" ? "/account/messages" : "/provider/messages"

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        description={side === "CUSTOMER" ? "Chat with your providers. A chat opens when the provider accepts your booking." : "Chat with your customers. A chat opens when you accept a booking."}
      />
      {data.length === 0 ? (
        <EmptyState
          icon={MessagesSquare}
          title="No conversations yet"
          description={side === "CUSTOMER" ? "Once a provider accepts one of your bookings, you can message them here." : "Once you accept a booking, you can message the customer here."}
        />
      ) : (
        <Card className="divide-y gap-0 py-0">
          {data.map((c) => (
            <Link key={c.bookingId} href={`${base}/${c.bookingId}`} className="flex items-center gap-3 p-4 transition-colors hover:bg-muted/50">
              <Avatar className="size-11">
                {c.other.avatarUrl ? <AvatarImage src={c.other.avatarUrl} alt="" /> : null}
                <AvatarFallback>{initials(c.other.name)}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2">
                  <span className="font-semibold">{c.other.name}</span>
                  <span className="truncate text-sm text-muted-foreground">
                    {c.title} · <bdi dir="ltr">{c.number}</bdi>
                  </span>
                </span>
                <span className={cn("block truncate text-sm", c.unread > 0 ? "font-semibold text-foreground" : c.lastMessage ? "text-foreground/80" : "text-muted-foreground italic")}>
                  {c.lastMessage ? `${c.lastMessage.fromMe ? "You: " : ""}${c.lastMessage.body}` : "No messages yet — say hello."}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-xs text-muted-foreground tabular-nums">{formatZonedDateTime(c.activityAt)}</span>
                {c.unread > 0 ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground tabular-nums" aria-label={`${c.unread} unread`}>
                    {c.unread > 9 ? "9+" : c.unread}
                  </span>
                ) : null}
                {c.closedReason ? <BookingStatusBadge status={c.status} /> : null}
              </span>
            </Link>
          ))}
        </Card>
      )}
    </div>
  )
}
