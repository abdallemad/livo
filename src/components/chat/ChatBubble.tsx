import { Check, CheckCheck, Clock, ShieldAlert } from "lucide-react"
import { cn } from "@/lib/utils"

export type DeliveryState = "sending" | "sent" | "read"

interface ChatBubbleProps {
  body: string
  /** Pre-formatted time. */
  at: string
  mine?: boolean
  state?: DeliveryState
}

const STATE_ICON = { sending: Clock, sent: Check, read: CheckCheck } as const
const STATE_LABEL = { sending: "جارٍ الإرسال", sent: "اتبعتت", read: "اتقرت" } as const

/** One chat message. "Mine" sits at the start side (right in RTL). */
export function ChatBubble({ body, at, mine = false, state = "sent" }: ChatBubbleProps) {
  const Icon = STATE_ICON[state]
  return (
    <div className={cn("flex", mine ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[80%] rounded-xl px-4 py-2",
          mine ? "rounded-ss-sm bg-primary text-primary-foreground" : "rounded-se-sm border bg-card"
        )}
      >
        <p className="whitespace-pre-wrap">{body}</p>
        <p className={cn("mt-1 flex items-center gap-1 text-xs", mine ? "text-primary-foreground/75" : "text-muted-foreground")}>
          <span className="tabular-nums">{at}</span>
          {mine ? <Icon className="size-3.5" aria-label={STATE_LABEL[state]} /> : null}
        </p>
      </div>
    </div>
  )
}

/** Inline notice when a message was blocked for containing contact details (SY-04). */
export function ChatBlockedNotice() {
  return (
    <p role="status" className="mx-auto flex max-w-prose items-center gap-2 rounded-md bg-warning/10 px-3 py-2 text-sm text-warning">
      <ShieldAlert className="size-4 shrink-0" aria-hidden />
      ممنوع تبادل أرقام التليفون أو الإيميل قبل تأكيد الحجز. الرسالة ما اتبعتتش.
    </p>
  )
}
