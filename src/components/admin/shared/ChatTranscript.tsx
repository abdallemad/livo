import { MessageSquare, ShieldAlert } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { AdminMessageDto } from "@/types/admin"
import { formatDateTime } from "@/utils/format"

/**
 * A booking's chat, read-only, for the team to settle disputes (booking and
 * dispute pages). Customer messages sit at the start, provider messages at
 * the end; blocked contact-detail attempts are flagged (SY-04).
 */
export function ChatTranscript({ messages }: { messages: AdminMessageDto[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Chat</CardTitle>
        <CardDescription>Read-only. Shown so the team can settle disputes.</CardDescription>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="size-4" aria-hidden />
            No messages.
          </p>
        ) : (
          <ol className="space-y-3">
            {messages.map((m) => (
              <li key={m.id} className={cn("flex", m.senderSide === "PROVIDER" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-xl border px-3 py-2",
                    m.senderSide === "PROVIDER" ? "bg-primary/5" : "bg-card",
                    m.contactBlocked && "border-warning/50",
                  )}
                >
                  <p className="text-xs font-medium text-muted-foreground">
                    {m.senderName} · {m.senderSide === "CUSTOMER" ? "customer" : m.senderSide === "PROVIDER" ? "provider" : "other"}
                  </p>
                  <p className="whitespace-pre-wrap" dir="auto">
                    {m.body}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="tabular-nums">{formatDateTime(m.createdAt)}</span>
                    {m.contactBlocked ? (
                      <span className="flex items-center gap-1 text-warning">
                        <ShieldAlert className="size-3.5" aria-hidden />
                        Contact details blocked
                      </span>
                    ) : null}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
