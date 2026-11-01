import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { ScheduleEditor } from "@/components/provider/schedule/ScheduleEditor"
import { getSchedule } from "@/services/provider-schedule.service"

/**
 * /provider/schedule — weekly working hours + the next 14 days (docs/SITEMAP.md §4, PR-10,
 * docs/provider-schedule-reviews-feature.md). First snapshot read on the server (service called
 * directly for the session's own user id — CLAUDE.md §2 exception); saving goes through
 * `PUT /api/provider/schedule`. Private: `noindex` from the zone layout.
 */
export const metadata: Metadata = { title: "Schedule" }

export default async function ProviderSchedulePage() {
  const { userId } = await auth()
  // Layout and page render in parallel, so don't rely on the layout's gate having run first.
  if (!userId) redirect("/sign-in?redirect_url=%2Fprovider%2Fschedule")
  return <ScheduleEditor initialData={await getSchedule(userId)} />
}
