"use client"

import { useState } from "react"
import Link from "next/link"
import { AlertTriangle, CalendarDays, Clock, Plus, Trash2, Wand2 } from "lucide-react"
import { toast } from "sonner"
import { OptionSelect } from "@/components/forms/OptionSelect"
import { BookingStatusBadge, PageHeader } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { useProviderSchedule, useSaveSchedule } from "@/hooks/use-provider-schedule"
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes"
import { cn } from "@/lib/utils"
import type { ProviderSchedule, ScheduleDay } from "@/types/provider-schedule"
import { dayError, DEFAULT_WEEK, MAX_RANGES_PER_DAY, timeLabel, TIME_OPTIONS, WEEKDAY_LABEL, weeklyMinutes, type DayHours } from "@/utils/availability"
import { formatNumber } from "@/utils/format"
import { formatZonedDay, formatZonedTime } from "@/utils/zoned-time"

const START_OPTIONS = TIME_OPTIONS.slice(0, -1).map((t) => ({ id: t, name: timeLabel(t) }))
const END_OPTIONS = TIME_OPTIONS.slice(1).map((t) => ({ id: t, name: timeLabel(t) }))
const SELECT = "w-32 [&_[data-slot=select-trigger]]:h-11"
const hours = (minutes: number) => `${formatNumber(Math.round((minutes / 60) * 10) / 10)} h`
const rangesText = (ranges: DayHours["ranges"]) => (ranges.length ? ranges.map((r) => `${timeLabel(r.start)} – ${timeLabel(r.end)}`).join(", ") : "Day off")

function WeekEditor({ initial }: { initial: DayHours[] }) {
  const save = useSaveSchedule()
  const [week, setWeek] = useState<DayHours[]>(initial)
  const [saved, setSaved] = useState(JSON.stringify(initial))
  const dirty = JSON.stringify(week) !== saved
  useUnsavedChanges(dirty)
  const errors = week.map((d) => dayError(d.ranges))
  const invalid = errors.some(Boolean)

  const update = (weekday: number, ranges: DayHours["ranges"]) => setWeek((w) => w.map((d) => (d.weekday === weekday ? { ...d, ranges } : d)))

  const submit = () =>
    save.mutate(
      { days: week },
      {
        onSuccess: () => {
          setSaved(JSON.stringify(week))
          toast.success("Working hours saved")
        },
        onError: (e) => toast.error(e.message),
      },
    )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Working hours</CardTitle>
        <CardDescription>When customers can book you each week, in Cairo time. {hours(weeklyMinutes(week))} a week.</CardDescription>
        <CardAction>
          <Button variant="outline" onClick={() => setWeek(DEFAULT_WEEK)}>
            <Wand2 data-icon="inline-start" aria-hidden />
            Sat–Thu, 9 to 6
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-1">
        <ul className="divide-y">
          {week.map((d, i) => {
            const working = d.ranges.length > 0
            const switchId = `day-${d.weekday}`
            return (
              <li key={d.weekday} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start">
                <div className="flex min-h-11 w-44 shrink-0 items-center gap-3">
                  <Switch
                    id={switchId}
                    checked={working}
                    onCheckedChange={(on) => update(d.weekday, on ? [{ start: "09:00", end: "18:00" }] : [])}
                  />
                  <Label htmlFor={switchId} className="text-base font-medium">
                    {WEEKDAY_LABEL[d.weekday]}
                  </Label>
                </div>
                <div className="flex-1 space-y-2">
                  {working ? (
                    d.ranges.map((r, ri) => (
                      <div key={ri} className="flex flex-wrap items-center gap-2">
                        <div className={SELECT}>
                          <OptionSelect
                            id={`day-${d.weekday}-${ri}-start`}
                            value={r.start}
                            onChange={(v) => update(d.weekday, d.ranges.map((x, xi) => (xi === ri ? { ...x, start: v } : x)))}
                            options={START_OPTIONS}
                            placeholder="From"
                          />
                        </div>
                        <span className="text-muted-foreground">to</span>
                        <div className={SELECT}>
                          <OptionSelect
                            id={`day-${d.weekday}-${ri}-end`}
                            value={r.end}
                            onChange={(v) => update(d.weekday, d.ranges.map((x, xi) => (xi === ri ? { ...x, end: v } : x)))}
                            options={END_OPTIONS}
                            placeholder="To"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove these hours on ${WEEKDAY_LABEL[d.weekday]}`}
                          onClick={() => update(d.weekday, d.ranges.filter((_, xi) => xi !== ri))}
                        >
                          <Trash2 aria-hidden />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="flex min-h-11 items-center text-muted-foreground">Day off</p>
                  )}
                  {working && d.ranges.length < MAX_RANGES_PER_DAY ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const last = d.ranges[d.ranges.length - 1]
                        update(d.weekday, [...d.ranges, { start: last?.end && last.end < "22:00" ? last.end : "18:00", end: "22:00" }])
                      }}
                    >
                      <Plus data-icon="inline-start" aria-hidden />
                      Add more hours
                    </Button>
                  ) : null}
                  {errors[i] ? (
                    <p className="flex items-center gap-1 text-sm text-destructive" role="alert">
                      <AlertTriangle className="size-4" aria-hidden />
                      {errors[i]}
                    </p>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
        <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-end">
          {dirty ? <span className="text-sm text-muted-foreground sm:me-auto">You have unsaved changes.</span> : null}
          <Button variant="outline" size="lg" disabled={!dirty || save.isPending} onClick={() => setWeek(JSON.parse(saved))}>
            Undo changes
          </Button>
          <Button size="lg" disabled={!dirty || invalid || save.isPending} onClick={submit}>
            {save.isPending ? <Spinner data-icon="inline-start" /> : null}
            Save hours
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function dayTitle(day: ScheduleDay, index: number) {
  if (index === 0) return `Today · ${formatZonedDay(day.date)}`
  if (index === 1) return `Tomorrow · ${formatZonedDay(day.date)}`
  return formatZonedDay(day.date)
}

function Upcoming({ days }: { days: ScheduleDay[] }) {
  const total = days.reduce((s, d) => s + d.bookings.length, 0)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Next 14 days</CardTitle>
        <CardDescription>
          {total ? `${formatNumber(total)} ${total === 1 ? "booking" : "bookings"} against your hours.` : "No bookings in the next two weeks."}
        </CardDescription>
        <CardAction>
          <Button variant="ghost" render={<Link href="/provider/bookings" />}>
            All bookings
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ol className="divide-y">
          {days.map((day, i) => (
            <li key={day.date} className="py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className={cn("font-medium", i === 0 && "text-primary")}>{dayTitle(day, i)}</p>
                <p className="text-sm text-muted-foreground">{rangesText(day.ranges)}</p>
              </div>
              {day.bookings.length ? (
                <ul className="mt-2 space-y-1.5">
                  {day.bookings.map((b) => (
                    <li key={b.id}>
                      <Link href={`/provider/bookings/${b.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border p-2.5 hover:bg-accent/40">
                        <span className="flex items-center gap-1 font-heading font-semibold tabular-nums">
                          <Clock className="size-4 text-muted-foreground" aria-hidden />
                          <bdi dir="ltr">{formatZonedTime(b.scheduledAt)}</bdi>
                        </span>
                        <span className="min-w-0 flex-1 truncate">{b.title}</span>
                        {b.place ? <span className="text-sm text-muted-foreground">{b.place}</span> : null}
                        <BookingStatusBadge status={b.status} />
                        {b.withinHours === false ? (
                          <span className="flex w-full items-center gap-1 text-sm text-warning">
                            <AlertTriangle className="size-3.5" aria-hidden />
                            Outside your working hours
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}

/**
 * `/provider/schedule` (PR-10, docs/provider-schedule-reviews-feature.md): weekly working hours
 * (Saturday → Friday, up to 3 ranges a day, half-hour steps) and the next 14 days of bookings against
 * them, flagging any booked outside the hours. First snapshot from the server.
 */
export function ScheduleEditor({ initialData }: { initialData: ProviderSchedule }) {
  const { data } = useProviderSchedule(initialData)
  const empty = data.week.every((d) => d.ranges.length === 0)
  return (
    <div className="space-y-6">
      <PageHeader title="Schedule" description="Set the days and hours you work, and see what's booked." />
      {empty ? (
        <p className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          <CalendarDays className="size-5 shrink-0" aria-hidden />
          You haven&apos;t set working hours yet. Tap “Sat–Thu, 9 to 6” to start, then adjust.
        </p>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <WeekEditor key={JSON.stringify(data.week)} initial={data.week} />
        <Upcoming days={data.upcoming} />
      </div>
    </div>
  )
}
