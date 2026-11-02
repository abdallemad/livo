"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Phone, Send } from "lucide-react"
import { toast } from "sonner"
import { BookingStatusBadge } from "@/components/shared"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { useMarkThreadRead, useSendMessage, useThread } from "@/hooks/use-chat"
import { cn } from "@/lib/utils"
import type { ChatThreadDto } from "@/types/chat"
import { MESSAGE_MAX, type ChatSide } from "@/utils/chat"
import { formatPhone } from "@/utils/format"
import { formatZonedDateTime, formatZonedDay, formatZonedTime, zonedIsoDay } from "@/utils/zoned-time"

const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?"
const newClientId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`)

/**
 * One booking's chat (CU-06, PR-09; docs/messages-feature.md): header with the other person (phone while the job is live,
 * BR-02) and a link to the booking, messages grouped by day (Cairo time), and the composer — Enter sends, Shift+Enter is a
 * new line. New messages arrive through Pusher (or polling) and the list scrolls to the bottom. A closed chat stays readable.
 */
export function ChatThread({ side, initialData }: { side: ChatSide; initialData: ChatThreadDto }) {
  const { data: t } = useThread(side, initialData)
  const send = useSendMessage(side, t.bookingId, t.me)
  const [body, setBody] = useState("")
  const bottom = useRef<HTMLDivElement>(null)
  const back = side === "CUSTOMER" ? "/account/messages" : "/provider/messages"

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" })
  }, [t.messages.length])

  // Seen: on open, and whenever a message from the other side arrives while the thread is open (clears the badge).
  const markRead = useMarkThreadRead(side, t.bookingId)
  const lastFromOther = [...t.messages].reverse().find((m) => m.senderId !== t.me)?.id ?? null
  const { mutate: mark } = markRead
  useEffect(() => {
    mark()
  }, [lastFromOther, mark])

  const submit = () => {
    const text = body.trim()
    if (!text || send.isPending) return
    setBody("")
    send.mutate({ body: text, clientId: newClientId() }, { onError: (e) => (setBody(text), toast.error(e.message)) })
  }

  return (
    <div className="flex h-[calc(100dvh-10rem)] min-h-96 flex-col overflow-hidden rounded-xl border bg-card">
      <header className="flex items-center gap-3 border-b p-3">
        <Button variant="ghost" size="icon" render={<Link href={back} aria-label="All messages" />}>
          <ArrowLeft className="rtl:-scale-x-100" aria-hidden />
        </Button>
        <Avatar className="size-10">
          {t.other.avatarUrl ? <AvatarImage src={t.other.avatarUrl} alt="" /> : null}
          <AvatarFallback>{initials(t.other.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{t.other.name}</p>
          <Link href={t.bookingHref} className="block truncate text-sm text-muted-foreground hover:underline">
            {t.title} · <bdi dir="ltr">{t.number}</bdi>
          </Link>
        </div>
        <BookingStatusBadge status={t.status} className="max-sm:hidden" />
        {t.other.phone ? (
          <Button variant="outline" size="icon" render={<a href={`tel:${t.other.phone}`} aria-label={`Call ${formatPhone(t.other.phone)}`} />}>
            <Phone aria-hidden />
          </Button>
        ) : null}
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto p-4" role="log" aria-live="polite" aria-label="Messages">
        {t.messages.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">No messages yet. Say hello and agree the details.</p> : null}
        {t.messages.map((m, i) => {
          const mine = m.senderId === t.me
          const prev = t.messages[i - 1]
          const showDay = !prev || zonedIsoDay(new Date(prev.createdAt)) !== zonedIsoDay(new Date(m.createdAt))
          return (
            <div key={m.clientId ?? m.id}>
              {showDay ? <p className="my-3 text-center text-xs text-muted-foreground">{formatZonedDay(m.createdAt)}</p> : null}
              <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn("max-w-[80%] rounded-2xl px-3 py-2 text-sm", mine ? "rounded-ee-sm bg-primary text-primary-foreground" : "rounded-es-sm bg-muted", m.id.startsWith("pending-") && "opacity-70")}
                  title={formatZonedDateTime(m.createdAt)}
                >
                  <p className="whitespace-pre-line break-words">{m.body}</p>
                  <p className={cn("mt-1 text-end text-[11px] tabular-nums", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>{m.id.startsWith("pending-") ? "Sending…" : formatZonedTime(m.createdAt)}</p>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottom} />
      </div>

      {t.closedReason ? (
        <p className="border-t p-4 text-center text-sm text-muted-foreground">{t.closedReason}</p>
      ) : (
        <form
          className="flex items-end gap-2 border-t p-3"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <label htmlFor="chat-body" className="sr-only">
            Message
          </label>
          <Textarea
            id="chat-body"
            rows={1}
            maxLength={MESSAGE_MAX}
            value={body}
            placeholder="Write a message…"
            className="max-h-40 min-h-11 resize-none"
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                submit()
              }
            }}
          />
          <Button type="submit" size="icon" className="size-11 shrink-0" disabled={!body.trim() || send.isPending} aria-label="Send">
            {send.isPending ? <Spinner /> : <Send className="rtl:-scale-x-100" aria-hidden />}
          </Button>
        </form>
      )}
    </div>
  )
}
