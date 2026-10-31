"use client"

import Link from "next/link"
import { AlertCircle, BriefcaseBusiness, EyeOff, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { OptionSelect } from "@/components/forms/OptionSelect"
import { ListPagination } from "@/components/admin/shared/ListPagination"
import { ReasonDialog } from "@/components/admin/shared/ReasonDialog"
import { SearchBox } from "@/components/admin/shared/SearchBox"
import { ConfirmDialog, EmptyState, PageHeader } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { StatusVariant } from "@/constants/status"
import { useAdminCategories, useAdminServices, useModerateService } from "@/hooks/use-admin-catalog"
import { useUrlQuery } from "@/hooks/use-url-query"
import { SERVICE_VISIBILITIES, serviceListQuerySchema } from "@/schemas/admin.schema"
import type { AdminServiceListItem } from "@/types/admin"
import { formatDate, formatNumber, formatPrice } from "@/utils/format"
import { SERVICE_VISIBILITY_LABEL, type ServiceVisibilityState } from "@/utils/service-visibility"

const ALL = "ALL"
const VISIBILITY_VARIANT: Record<ServiceVisibilityState, StatusVariant> = {
  LIVE: "success",
  PROVIDER_OFF: "neutral",
  HIDDEN_BY_ADMIN: "destructive",
  PROVIDER_INACTIVE: "warning",
  CATEGORY_OFF: "warning",
}
const VISIBILITY_OPTIONS = [{ id: ALL, name: "Any visibility" }, ...SERVICE_VISIBILITIES.map((v) => ({ id: v, name: SERVICE_VISIBILITY_LABEL[v] }))]
const COLUMNS = 7

/**
 * `/admin/services` (AD-02): every fixed-price service, filterable by search,
 * category (a parent includes its sub-categories) and visibility, with the
 * reason a service isn't public and admin hide / restore. Filters live in the URL.
 */
export function ServicesTable() {
  const { query, hrefWith, setQuery } = useUrlQuery(serviceListQuerySchema)
  const { data, isPending, isError, error, isFetching, refetch } = useAdminServices(query)
  const { data: categories } = useAdminCategories()
  const categoryOptions = [
    { id: ALL, name: "All categories" },
    ...(categories ?? []).map((c) => ({ id: c.id, name: c.parentName ? `${c.parentName} · ${c.nameEn ?? c.nameAr}` : (c.nameEn ?? c.nameAr) })),
  ]
  const filtered = !!(query.q || query.categoryId || query.visibility)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Services"
        description="Every fixed-price service providers list. Hide a listing that breaks the rules; the provider can't re-publish it."
        actions={isFetching && !isPending ? <Spinner className="text-muted-foreground" /> : null}
      />

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <SearchBox value={query.q} onSearch={(q) => setQuery({ q })} placeholder="Service or provider" label="Search services" />
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <div className="sm:w-52 [&_[data-slot=select-trigger]]:h-9 [&_[data-slot=select-trigger]]:text-sm">
                <OptionSelect
                  id="filter-category"
                  value={query.categoryId ?? ALL}
                  onChange={(v) => setQuery({ categoryId: v === ALL ? undefined : v })}
                  options={categoryOptions}
                  placeholder="Category"
                />
              </div>
              <div className="sm:w-48 [&_[data-slot=select-trigger]]:h-9 [&_[data-slot=select-trigger]]:text-sm">
                <OptionSelect
                  id="filter-visibility"
                  value={query.visibility ?? ALL}
                  onChange={(v) => setQuery({ visibility: v === ALL ? undefined : v })}
                  options={VISIBILITY_OPTIONS}
                  placeholder="Visibility"
                />
              </div>
            </div>
            {filtered ? (
              <Button size="sm" variant="ghost" render={<Link href={hrefWith({ q: undefined, categoryId: undefined, visibility: undefined })} />}>
                Clear filters
              </Button>
            ) : null}
          </div>

          {isError ? (
            <EmptyState
              icon={AlertCircle}
              title="Couldn't load services"
              description={error.message}
              action={<Button variant="outline" onClick={() => refetch()}>Try again</Button>}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-end">Price</TableHead>
                  <TableHead className="text-end">Bookings</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead className="text-end">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending ? (
                  Array.from({ length: 6 }, (_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={COLUMNS}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : data.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={COLUMNS} className="h-28 text-center text-muted-foreground">
                      <BriefcaseBusiness className="mx-auto mb-1 size-5" aria-hidden />
                      {filtered ? "No services match these filters." : "No services yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.items.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="max-w-72">
                        <span className="block font-medium whitespace-normal">{s.title}</span>
                        <span className="line-clamp-1 text-xs whitespace-normal text-muted-foreground">{s.description}</span>
                        <span className="text-xs text-muted-foreground">
                          {s.imageCount} {s.imageCount === 1 ? "photo" : "photos"}
                          {s.durationMinutes ? ` · ${formatNumber(s.durationMinutes)} min` : ""} · added {formatDate(s.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Link href={`/admin/providers/${s.providerId}`} className="hover:underline">
                          {s.providerName}
                        </Link>
                      </TableCell>
                      <TableCell>{s.category}</TableCell>
                      <TableCell className="text-end tabular-nums">
                        <bdi dir="ltr">{formatPrice(s.price)}</bdi>
                      </TableCell>
                      <TableCell className="text-end tabular-nums">{formatNumber(s.bookingCount)}</TableCell>
                      <TableCell>
                        <VisibilityBadge service={s} />
                      </TableCell>
                      <TableCell>
                        <ModerationAction service={s} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {data && data.total > 0 ? (
            <ListPagination page={data.page} pageCount={data.pageCount} total={data.total} hrefFor={(page) => hrefWith({ page })} />
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

function VisibilityBadge({ service: s }: { service: AdminServiceListItem }) {
  const badge = <Badge variant={VISIBILITY_VARIANT[s.visibility]}>{SERVICE_VISIBILITY_LABEL[s.visibility]}</Badge>
  if (s.visibility !== "HIDDEN_BY_ADMIN" || !s.hiddenByAdminReason) return badge
  return (
    <Tooltip>
      <TooltipTrigger render={<span tabIndex={0} className="cursor-help" />}>{badge}</TooltipTrigger>
      <TooltipContent className="max-w-64">
        {s.hiddenByAdminReason}
        {s.hiddenByAdminAt ? ` (${formatDate(s.hiddenByAdminAt)})` : ""}
      </TooltipContent>
    </Tooltip>
  )
}

function ModerationAction({ service: s }: { service: AdminServiceListItem }) {
  const moderate = useModerateService()
  const busy = moderate.isPending

  if (s.hiddenByAdminAt) {
    return (
      <div className="flex justify-end">
        <ConfirmDialog
          trigger={
            <Button size="sm" variant="outline" disabled={busy}>
              {busy ? <Spinner data-icon="inline-start" /> : <RotateCcw data-icon="inline-start" aria-hidden />}
              Restore
            </Button>
          }
          title={`Restore “${s.title}”?`}
          description="It goes back to the provider's own on/off setting, and shows on the site if everything else allows it."
          confirmLabel="Restore service"
          cancelLabel="Cancel"
          destructive={false}
          onConfirm={() =>
            moderate.mutate(
              { id: s.id, action: "RESTORE" },
              { onSuccess: () => toast.success(`“${s.title}” was restored`), onError: (e) => toast.error(e.message) },
            )
          }
        />
      </div>
    )
  }

  return (
    <div className="flex justify-end">
      <ReasonDialog
        trigger={
          <Button size="sm" variant="destructive" disabled={busy}>
            <EyeOff data-icon="inline-start" aria-hidden />
            Hide
          </Button>
        }
        title={`Hide “${s.title}”?`}
        description="It disappears from the site and can't be booked. The provider sees your reason and can't switch it back on."
        confirmLabel="Hide service"
        pending={busy}
        onSubmit={(reason) =>
          moderate.mutateAsync({ id: s.id, action: "HIDE", reason }).then(() => toast.success(`“${s.title}” is hidden`))
        }
      />
    </div>
  )
}
