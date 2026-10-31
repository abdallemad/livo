"use client"

import Link from "next/link"
import { Fragment } from "react"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { DASHBOARD_NAV, type DashboardZone } from "@/constants/dashboard-nav"

/**
 * Pathname-driven breadcrumb for dashboard top bars. Segment labels come from
 * the zone's nav; unknown segments (ids, "new", "edit") get generic labels.
 */
const SEGMENT_LABELS: Record<string, string> = { new: "جديد", edit: "تعديل", review: "تقييم", dispute: "نزاع" }

export function DashboardBreadcrumb({ zone }: { zone: DashboardZone }) {
  const { root: rootHref, label: rootLabel, nav: groups } = DASHBOARD_NAV[zone]
  const pathname = usePathname()
  const labels = new Map(groups.flatMap((g) => g.items).map((i) => [i.href, i.label]))
  const parts = pathname.replace(rootHref, "").split("/").filter(Boolean)
  const crumbs = parts.map((seg, i) => {
    const href = `${rootHref}/${parts.slice(0, i + 1).join("/")}`
    return { href, label: labels.get(href) ?? SEGMENT_LABELS[seg] ?? "التفاصيل" }
  })

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {crumbs.length ? (
            <BreadcrumbLink render={<Link href={rootHref} />}>{rootLabel}</BreadcrumbLink>
          ) : (
            <BreadcrumbPage>{rootLabel}</BreadcrumbPage>
          )}
        </BreadcrumbItem>
        {crumbs.map((c, i) => (
          <Fragment key={c.href}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {i === crumbs.length - 1 ? (
                <BreadcrumbPage>{c.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink render={<Link href={c.href} />}>{c.label}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
