"use client"

import Link from "next/link"
import { AlertCircle, BadgeCheck, Star } from "lucide-react"
import type { VerificationStatus } from "@prisma/client"
import { ListPagination } from "@/components/admin/shared/ListPagination"
import { SearchBox } from "@/components/admin/shared/SearchBox"
import { EmptyState, PageHeader, ProviderStatusBadge } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAdminProviders } from "@/hooks/use-admin-providers"
import { useUrlQuery } from "@/hooks/use-url-query"
import { cn } from "@/lib/utils"
import { providerListQuerySchema, type ProviderListStatus } from "@/schemas/admin.schema"
import { formatDate, formatNumber } from "@/utils/format"
import { ProviderDecisionActions } from "./ProviderDecisionActions"

/** Tab order = how often each is needed. DRAFT is last: those providers haven't submitted yet. */
const TABS: { status: ProviderListStatus; label: string; dateLabel: string }[] = [
  { status: "PENDING", label: "Pending review", dateLabel: "Submitted" },
  { status: "APPROVED", label: "Active", dateLabel: "Updated" },
  { status: "SUSPENDED", label: "Suspended", dateLabel: "Suspended" },
  { status: "REJECTED", label: "Rejected", dateLabel: "Rejected" },
  { status: "DRAFT", label: "Incomplete", dateLabel: "Last edit" },
]

const COLUMNS = 7

/**
 * `/admin/providers` (AD-01): one status tab at a time, search, and the
 * decisions that fit each row's status. Filters live in the URL.
 */
export function ProvidersTable() {
  const { query, hrefWith, setQuery } = useUrlQuery(providerListQuerySchema)
  const { data, isPending, isError, error, isFetching, refetch } = useAdminProviders(query)
  const tab = TABS.find((t) => t.status === query.status)!

  return (
    <div className="space-y-6">
      <PageHeader
        title="Provider applications"
        description="Review new providers, and suspend or reinstate active ones."
        actions={isFetching && !isPending ? <Spinner className="text-muted-foreground" /> : null}
      />

      <nav aria-label="Filter by status" className="flex flex-wrap gap-1 border-b">
        {TABS.map((t) => {
          const active = t.status === query.status
          const count = data?.counts[t.status as VerificationStatus]
          return (
            <Link
              key={t.status}
              href={hrefWith({ status: t.status === "PENDING" ? undefined : t.status })}
              scroll={false}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px flex h-10 items-center gap-2 border-b-2 px-3 text-sm",
                active ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {count !== undefined ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 text-xs tabular-nums",
                    active || (t.status === "PENDING" && count > 0) ? "bg-primary/12 text-primary" : "bg-muted",
                  )}
                >
                  {formatNumber(count)}
                </span>
              ) : null}
            </Link>
          )
        })}
      </nav>

      <Card>
        <CardContent className="space-y-4">
          <SearchBox
            key={query.status}
            value={query.q}
            onSearch={(q) => setQuery({ q })}
            placeholder="Name, email or phone"
            label="Search providers"
          />

          {isError ? (
            <EmptyState
              icon={AlertCircle}
              title="Couldn't load providers"
              description={error.message}
              action={<Button variant="outline" onClick={() => refetch()}>Try again</Button>}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead className="text-end">Docs / services</TableHead>
                  <TableHead>{tab.dateLabel}</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-end">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending ? (
                  Array.from({ length: 5 }, (_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={COLUMNS}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : data.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={COLUMNS} className="h-28 text-center text-muted-foreground">
                      <BadgeCheck className="mx-auto mb-1 size-5" aria-hidden />
                      {query.q ? `No ${tab.label.toLowerCase()} providers match “${query.q}”.` : `No ${tab.label.toLowerCase()} providers.`}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.items.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link href={`/admin/providers/${p.id}`} className="font-medium hover:underline">
                          {p.name}
                        </Link>
                        <span className="block text-xs text-muted-foreground">
                          <bdi dir="ltr">{p.phone ?? p.email ?? "No contact details"}</bdi>
                        </span>
                      </TableCell>
                      <TableCell>{p.city}</TableCell>
                      <TableCell className="max-w-56">
                        <span className="line-clamp-2 whitespace-normal">{p.categories.join(", ") || "—"}</span>
                        {p.ratingCount ? (
                          <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="size-3 fill-commit text-commit" aria-hidden />
                            <span className="tabular-nums">
                              {p.ratingAvg.toFixed(1)} ({formatNumber(p.ratingCount)})
                            </span>
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-end tabular-nums">
                        {p.documentCount} / {p.serviceCount}
                      </TableCell>
                      <TableCell className="tabular-nums">{formatDate(p.updatedAt)}</TableCell>
                      <TableCell>
                        <ProviderStatusBadge status={p.verificationStatus} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1.5">
                          <ProviderDecisionActions id={p.id} name={p.name} status={p.verificationStatus} />
                          <Button size="sm" variant="ghost" render={<Link href={`/admin/providers/${p.id}`} />}>
                            Review
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {data && data.total > 0 ? (
            <ListPagination
              page={data.page}
              pageCount={data.pageCount}
              total={data.total}
              hrefFor={(page) => hrefWith({ page })}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
