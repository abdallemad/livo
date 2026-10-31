import { Check } from "lucide-react"
import { WORK_STATUS, WORK_TIMELINE, type WorkStatus } from "@/constants/status"
import { cn } from "@/lib/utils"

export interface TimelineEvent {
  status: WorkStatus
  /** Pre-formatted timestamp (formatDateTime). */
  at?: string
  note?: string
}

interface BookingTimelineProps {
  current: WorkStatus
  events?: TimelineEvent[]
  className?: string
}

const EXCEPTIONS: WorkStatus[] = ["CANCELLED", "DISPUTED", "EXPIRED"]

/**
 * Vertical state timeline (CU-08). Runs top→bottom; done steps are filled,
 * the current one is ringed, an exception (cancelled / disputed / expired)
 * replaces the remaining steps.
 */
export function BookingTimeline({ current, events = [], className }: BookingTimelineProps) {
  const byStatus = new Map(events.map((e) => [e.status, e]))
  const isException = EXCEPTIONS.includes(current)
  const lastDone = isException
    ? Math.max(...events.map((e) => WORK_TIMELINE.indexOf(e.status)), -1)
    : WORK_TIMELINE.indexOf(current)
  const steps: WorkStatus[] = isException ? [...WORK_TIMELINE.slice(0, lastDone + 1), current] : WORK_TIMELINE

  return (
    <ol className={cn("relative flex flex-col", className)}>
      {steps.map((status, i) => {
        const meta = WORK_STATUS[status]
        const done = isException ? status !== current : i < lastDone
        const active = status === current
        const event = byStatus.get(status)
        const Icon = meta.icon
        return (
          <li key={status} className="relative flex gap-3 pb-6 last:pb-0">
            {i < steps.length - 1 ? (
              <span
                aria-hidden
                className={cn("absolute top-9 bottom-0 start-[1.0625rem] w-0.5", done ? "bg-primary" : "bg-border")}
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border-2",
                done && "border-primary bg-primary text-primary-foreground",
                active && !isException && "border-primary bg-card text-primary ring-4 ring-primary/15",
                active && isException && "border-destructive bg-card text-destructive",
                !done && !active && "border-border bg-card text-muted-foreground"
              )}
            >
              {done ? <Check className="size-4" aria-hidden /> : <Icon className="size-4" aria-hidden />}
            </span>
            <div className="min-w-0 pt-1">
              <p className={cn("font-medium", !done && !active && "text-muted-foreground")}>
                {meta.label}
                {active ? <span className="sr-only"> (current status)</span> : null}
              </p>
              {event?.at ? <p className="text-sm text-muted-foreground tabular-nums">{event.at}</p> : null}
              {event?.note ? <p className="text-sm text-muted-foreground">{event.note}</p> : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
