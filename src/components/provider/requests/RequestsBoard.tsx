"use client"

import Link from "next/link"
import { AlertCircle, Inbox, MapPin, SearchX, ShieldCheck } from "lucide-react"
import { OptionSelect } from "@/components/forms/OptionSelect"
import { ListPagination } from "@/components/admin/shared/ListPagination"
import { SearchBox } from "@/components/admin/shared/SearchBox"
import { EmptyState, PageHeader } from "@/components/shared"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { useProviderRequests } from "@/hooks/use-provider-workspace"
import { useUrlQuery } from "@/hooks/use-url-query"
import { cn } from "@/lib/utils"
import { providerRequestListQuerySchema, type ProviderRequestSort } from "@/schemas/provider.schema"
import type { ProviderRequestList } from "@/types/provider"
import { formatNumber } from "@/utils/format"
import { RequestCard } from "./RequestCard"

const ALL = "ALL"
const SORT_OPTIONS: { id: ProviderRequestSort; name: string }[] = [
  { id: "newest", name: "Newest first" },
  { id: "expiring", name: "Closing soon" },
  { id: "budget", name: "Highest budget" },
]
const SELECT = "[&_[data-slot=select-trigger]]:h-11"

/** Why there is no list at all (not a filter result): account not active yet, or not a provider. */
function Gate({ data }: { data: ProviderRequestList }) {
  if (data.eligibility === "NO_PROFILE") {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="This page is for provider accounts"
        description="Your account has no provider profile, so there are no matching requests to show."
      />
    )
  }
  const s = data.verificationStatus
  const copy =
    s === "PENDING"
      ? { title: "Your account is under review", text: "You'll see requests in your specialty and area as soon as we verify your details." }
      : s === "REJECTED"
        ? { title: "Your verification was not approved", text: "Check the reason on the verification page and send your documents again." }
        : s === "SUSPENDED"
          ? { title: "Your account is suspended", text: "You can't receive requests while your account is suspended. Contact support to find out why." }
          : { title: "Finish setting up your account", text: "Complete your profile and send your documents to start receiving requests." }
  return (
    <EmptyState
      icon={ShieldCheck}
      title={copy.title}
      description={copy.text}
      action={<Button render={<Link href="/provider/verification" />}>Go to verification</Button>}
    />
  )
}

/**
 * `/provider/requests` (PR-06, SY-01; docs/provider-dashboard-requests-feature.md): quote requests
 * matching the provider's specialty, city and work areas, as cards (providers are mostly on
 * phones — NF-06). Tabs: new for you / quoted. Filters live in the URL.
 */
export function RequestsBoard() {
  const { query, hrefWith, setQuery } = useUrlQuery(providerRequestListQuerySchema)
  const { data, isPending, isError, error, isFetching, refetch } = useProviderRequests(query)
  const isNew = query.tab === "new"
  const filtered = !!(query.q || query.categoryId)
  const eligible = data?.eligibility === "OK"

  const tabs = [
    { tab: undefined, label: "New for you", count: data?.counts.new, active: isNew },
    { tab: "quoted", label: "Quoted", count: data?.counts.quoted, active: !isNew },
  ] as const

  return (
    <div className="space-y-6">
      <PageHeader
        title="Available requests"
        description="Customers describing a job and asking for prices. Send a quote on the ones you can do."
        actions={isFetching && !isPending ? <Spinner className="text-muted-foreground" /> : null}
      />

      {isError ? (
        <EmptyState
          icon={AlertCircle}
          title="Couldn't load requests"
          description={error.message}
          action={<Button variant="outline" onClick={() => refetch()}>Try again</Button>}
        />
      ) : isPending ? (
        <div className="space-y-4">
          <Skeleton className="h-11 w-full" />
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      ) : !eligible ? (
        <Gate data={data} />
      ) : (
        <>
          <nav aria-label="Requests" className="flex gap-1 border-b">
            {tabs.map((t) => (
              <Link
                key={t.label}
                href={hrefWith({ tab: t.tab, scope: undefined, sort: undefined })}
                scroll={false}
                aria-current={t.active ? "page" : undefined}
                className={cn(
                  "-mb-px flex h-12 items-center gap-2 border-b-2 px-4 text-base",
                  t.active ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
                {t.count !== undefined ? (
                  <span className={cn("rounded-full px-2 text-sm tabular-nums", t.active ? "bg-primary/12 text-primary" : "bg-muted")}>{formatNumber(t.count)}</span>
                ) : null}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <SearchBox value={query.q} onSearch={(q) => setQuery({ q })} placeholder="Search in titles and descriptions" label="Search requests" />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex">
              <div className={cn("lg:w-56", SELECT)}>
                <OptionSelect
                  id="filter-category"
                  value={query.categoryId ?? ALL}
                  onChange={(v) => setQuery({ categoryId: v === ALL ? undefined : v })}
                  options={[{ id: ALL, name: "All my specialties" }, ...data.categories]}
                  placeholder="Specialty"
                />
              </div>
              <div className={cn("lg:w-44", SELECT)}>
                <OptionSelect
                  id="filter-sort"
                  value={query.sort}
                  onChange={(v) => setQuery({ sort: v === "newest" ? undefined : v })}
                  options={SORT_OPTIONS}
                  placeholder="Sort"
                />
              </div>
            </div>
            {filtered ? (
              <Button variant="ghost" render={<Link href={hrefWith({ q: undefined, categoryId: undefined })} />}>
                Clear filters
              </Button>
            ) : null}
          </div>

          {isNew ? (
            data.areas.length === 0 ? (
              <Alert variant="info">
                <MapPin aria-hidden />
                <AlertDescription>
                  You haven&apos;t chosen work areas, so you see requests from your whole city.{" "}
                  <Link href="/provider/settings" className="font-medium underline underline-offset-4">
                    Choose your areas
                  </Link>
                </AlertDescription>
              </Alert>
            ) : (
              <div className="flex flex-wrap items-center gap-2 text-sm" role="group" aria-label="Where">
                <span className="text-muted-foreground">Show requests in:</span>
                {(
                  [
                    { scope: undefined, label: `My areas (${data.areas.map((a) => a.name).join(", ")})`, active: query.scope === "areas" },
                    { scope: "city", label: "The whole city", active: query.scope === "city" },
                  ] as const
                ).map((o) => (
                  <Button
                    key={o.label}
                    size="sm"
                    variant={o.active ? "default" : "outline"}
                    aria-pressed={o.active}
                    className="max-w-full"
                    render={<Link href={hrefWith({ scope: o.scope })} scroll={false} />}
                  >
                    <span className="truncate">{o.label}</span>
                  </Button>
                ))}
              </div>
            )
          ) : null}

          {data.items.length === 0 ? (
            filtered ? (
              <EmptyState
                icon={SearchX}
                title="No requests match your search"
                action={<Button variant="outline" render={<Link href={hrefWith({ q: undefined, categoryId: undefined })} />}>Clear filters</Button>}
              />
            ) : isNew ? (
              <EmptyState
                icon={Inbox}
                title="No new requests right now"
                description={
                  query.scope === "areas" && data.areas.length > 0
                    ? "Nothing new in your areas. Try the whole city, or check back later — we'll notify you when a request comes in."
                    : "We'll notify you as soon as a customer asks for work in your specialty."
                }
                action={
                  query.scope === "areas" && data.areas.length > 0 ? (
                    <Button variant="outline" render={<Link href={hrefWith({ scope: "city" })} scroll={false} />}>
                      Show the whole city
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <EmptyState
                icon={Inbox}
                title="You haven't sent any quotes yet"
                description="Quotes you send appear here with their status."
                action={<Button variant="outline" render={<Link href={hrefWith({ tab: undefined })} />}>See new requests</Button>}
              />
            )
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {data.items.map((r) => (
                <RequestCard key={r.id} r={r} />
              ))}
            </div>
          )}

          {data.total > 0 ? (
            <ListPagination page={data.page} pageCount={data.pageCount} total={data.total} hrefFor={(page) => hrefWith({ page })} />
          ) : null}
        </>
      )}
    </div>
  )
}
